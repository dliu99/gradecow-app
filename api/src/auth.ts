import { Hono } from 'hono'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import * as z from 'zod'
import { 
  sealSessionData,
  unsealSessionData,
  createICSession, 
} from './supabase'

const auth = new Hono()

function mergeCookies(oldCookie: string, setCookieHeaders: string[]): string {
  const cookieMap = new Map<string, string>();

  oldCookie.split(';').forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const [name, ...valueParts] = trimmed.split('=');
    if (name) cookieMap.set(name, valueParts.join('='));
  });

  setCookieHeaders.forEach(header => {
    const firstPart = header.split(';')[0];
    const [name, ...valueParts] = firstPart.trim().split('=');
    if (name) cookieMap.set(name, valueParts.join('='));
  });

  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

interface SessionData {
  cookie: string
  baseURL: string
  deviceId: string
  deviceModel: string
  deviceType: string
  systemVersion: string
  personID: number
}

auth.get('/', (c) => {
  return c.json({ ok: true,message: 'Hello Hono!' })
})

auth.get('/districts', async (c) => {
  const state = c.req.query('state');
  const query = c.req.query('query');
  if (!state || !query || query.length < 3) {
    return c.json({ ok: false, message: 'State and query are required and query must be at least 3 characters' }, 400)
  }
  const response = await fetch(`https://www.infinitecampus.com/api/district?state=${state.toUpperCase()}&query=${query}`)
  const data = await response.json()
  return c.json({ ok: true, data })
})

auth.post('/verify-session', async (c) => {
  const res = await c.req.json()
  const schema = z.object({
    sessionToken: z.string(),
  })
  
  const { sessionToken } = schema.parse(res)

  let sessionData: SessionData
  try {
    sessionData = await unsealSessionData<SessionData>(sessionToken)
  } catch {
    console.log('Invalid session token')
    return c.json({ ok: false, message: 'Invalid session token' }, 401)
  }

  const storedCookie = sessionData.cookie
  if (!storedCookie) {
    console.log('No credentials found in session')
    return c.json({ ok: false, message: 'No credentials found in session' }, 401)
  }

  const baseURL = sessionData.baseURL
  const districtURL = baseURL.replace('/campus', '')

  const xsrfMatch = storedCookie.match(/XSRF-TOKEN=([^;]+)/)
  const xsrfToken = xsrfMatch ? xsrfMatch[1] : ''

  const updateResponse = await fetch(`https://${baseURL}/api/campus/hybridDevice/update`, {
    method: 'POST',
    headers: {
      'Host': districtURL,
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': `https://${districtURL}`,
      'Connection': 'keep-alive',
      'Cookie': `appType=student;campus_hybrid_app=student;deviceID=${sessionData.deviceId};${storedCookie};`,
      'x-xsrf-token': xsrfToken,
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'StudentApp/1.11.4 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    },
    body: JSON.stringify({
      'registrationToken': 'gradecow',
      'deviceType': sessionData.deviceType,
      'deviceModel': 'gradecow/' + sessionData.deviceModel,
      'appVersion': '1.11.4',
      'systemVersion': sessionData.systemVersion,
      'deviceID': sessionData.deviceId,
      'keepMeLoggedIn': true
    })
  })

  if (updateResponse.status !== 200) {
    console.log('Device update failed', updateResponse.status)
    return c.json({ ok: false, message: 'Failed to refresh device registration' }, updateResponse.status as ContentfulStatusCode)
  }
  console.log('did not fail!!! initial verify step')
  const updatedCookie = mergeCookies(storedCookie, updateResponse.headers.getSetCookie())

  const verifyResponse = await fetch(`https://${baseURL}/resources/my/userAccount`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'User-Agent': 'gradecow/1.0 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Cookie': updatedCookie
    }
  })

  if (verifyResponse.status !== 200) {
    console.log('Session verification failed', verifyResponse.status, verifyResponse.statusText)
    //return c.json({ ok: false, message: 'Session expired or invalid' }, 401)
  }

  const userData = await verifyResponse.json() as { personID: number }
  const personID = userData.personID

  if (!personID) {
    console.log('No personID found in user data')
    //return c.json({ ok: false, message: 'Failed to get user information' }, 401)
  }


  const newSessionToken = await sealSessionData({ 
    cookie: updatedCookie,
    baseURL: sessionData.baseURL,
    deviceId: sessionData.deviceId,
    deviceModel: sessionData.deviceModel,
    deviceType: sessionData.deviceType,
    systemVersion: sessionData.systemVersion,
    personID: personID,
  })

  await createICSession(personID, newSessionToken)

  return c.json({ 
    ok: true, 
    personId: personID,
    sessionToken: newSessionToken,
  })
})

auth.post('/updateDevice', async (c) => {
  const res = await c.req.json()
  const schema = z.object({
    cookieHeader: z.string(),
    deviceType: z.string(),
    deviceModel: z.string(),
    systemVersion: z.string(),
    deviceID: z.string(),
    districtURL: z.string(),
  })
  
  const { cookieHeader, deviceType, deviceModel, systemVersion, deviceID, districtURL } = schema.parse(res)
  const baseURL = `${districtURL}/campus`

  const verifyResponse = await fetch(`https://${baseURL}/resources/my/userAccount`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'User-Agent': 'StudentApp/1.11.4 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Cookie': cookieHeader
    }
  })

  if (verifyResponse.status !== 200) {
    console.log('Cookie verification failed', verifyResponse.status, verifyResponse.statusText)
    return c.json({ ok: false, message: 'Failed to verify login' }, verifyResponse.status as ContentfulStatusCode)
  }

  const userData = await verifyResponse.json() as { personID: number }
  const personID = userData.personID

  if (!personID) {
    return c.json({ ok: false, message: 'Failed to get user information' }, 401)
  }

  const xsrfMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
  const xsrfToken = xsrfMatch ? xsrfMatch[1] : '';

  const response = await fetch(`https://${baseURL}/api/campus/hybridDevice/update`, {
    method: 'POST',
    headers: {
      'Host': districtURL,
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': `https://${districtURL}`,
      'Connection': 'keep-alive',
      'Cookie': `appType=student;campus_hybrid_app=student;deviceID=${deviceID};${cookieHeader};`,
      'x-xsrf-token': xsrfToken,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'StudentApp/1.11.4 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      //'Referer': 'https://srvusd.infinitecampus.org/campus/nav-wrapper/student/portal/student/home?appName=sanRamon',
    },
    body: JSON.stringify({
      'registrationToken': "devin was here",
      'deviceType': deviceType,
      'deviceModel': 'gradecow/'+deviceModel,
      'appVersion': '1.11.4',
      'systemVersion': systemVersion,
      'deviceID': deviceID,
      'keepMeLoggedIn': true
    })
  });
  console.log(deviceID, deviceType, 'gradecow/'+deviceModel)
  const data = await response.json();
  console.log('Auth response:', data);
  if (response.status !== 200) {
    console.log('Failed to authenticate', response.headers.getSetCookie().join('; '));
    return c.json({ ok: false, message: response.statusText }, response.status as ContentfulStatusCode)
  }

  const fullCookie = mergeCookies(cookieHeader, response.headers.getSetCookie());
  console.log('Full cookie to seal:', fullCookie);

  const sessionToken = await sealSessionData({ 
    cookie: fullCookie,
    baseURL: `${districtURL}/campus`,
    deviceId: deviceID,
    deviceModel,
    deviceType,
    systemVersion,
    personID: personID,
  });

  const sessionPersonId = await createICSession(personID, sessionToken);

  if (!sessionPersonId) {
    return c.json({ ok: false, message: 'Failed to create session record' }, 500)
  }

  return c.json({ 
    ok: true, 
    data: data, 
    personId: sessionPersonId,
    sessionToken,
  })
})

export default auth
