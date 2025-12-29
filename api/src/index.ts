import { Hono } from 'hono'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import * as z from 'zod'
import { 
  sealSessionData,
  unsealSessionData,
  createICSession, 
  getICSession,
  updateICSessionToken
} from './supabase'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ ok: true,message: 'Hello Hono!' })
})

app.get('/ic/districts', async (c) => {
  const state = c.req.query('state');
  const query = c.req.query('query');
  if (!state || !query || query.length < 3) {
    return c.json({ ok: false, message: 'State and query are required and query must be at least 3 characters' }, 400)
  }
  const response = await fetch(`https://www.infinitecampus.com/api/district?state=${state.toUpperCase()}&query=${query}`)
  const data = await response.json()
  return c.json({ ok: true, data })
})

app.post('/ic/verify', async (c) => {
  const res = await c.req.json()
  const schema = z.object({
    cookieHeader: z.string(),
    districtUrl: z.string().optional(),
  })
  const { cookieHeader, districtUrl } = schema.parse(res)
  const baseUrl = districtUrl
  
  const response = await fetch(`https://${baseUrl}/campus/resources/my/userAccount`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Expires': '0',
      'Referer': `https://${baseUrl}/campus/apps/portal/student/home`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'Cookie': cookieHeader
    }
  });
  if (response.status !== 200) {
    console.log('Failed to verify cookies', response.status, response.statusText);
    return c.json({ ok: false, message: 'Failed to verify cookies' }, response.status as ContentfulStatusCode)
  }
  const data = await response.json();
  return c.json({ ok: true, data: data })
})

app.post('/ic/auth', async (c) => {
  const res = await c.req.json()
  const schema = z.object({
    cookieHeader: z.string(),
    deviceType: z.string(),
    deviceModel: z.string(),
    systemVersion: z.string(),
    deviceID: z.string(),
    districtUrl: z.string(),
    personID: z.number(),
  })
  
  const { cookieHeader, deviceType, deviceModel, systemVersion, deviceID, districtUrl, personID } = schema.parse(res)
  const baseUrl = districtUrl

  if (!cookieHeader || !deviceType || !deviceModel || !systemVersion || !deviceID || !personID) {
    return c.json({ ok: false, message: 'cookieHeader, deviceType, deviceModel, systemVersion, deviceID, and personID are required' }, 400)
  }

  const xsrfMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
  const xsrfToken = xsrfMatch ? xsrfMatch[1] : '';

  const response = await fetch(`https://${baseUrl}/campus/api/campus/hybridDevice/update`, {
    method: 'POST',
    headers: {
      'Host': baseUrl,
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': `https://${baseUrl}`,
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
  const data = await response.json();
  console.log('Auth response:', data);
  if (response.status !== 200) {
    console.log('Failed to authenticate', response.headers.getSetCookie().join('; '));
    return c.json({ ok: false, message: 'Failed to authenticate' }, response.status as ContentfulStatusCode)
  }

  const setCookieHeader = response.headers.getSetCookie().join('; ');
  const fullCookie = cookieHeader + ';' + setCookieHeader;
  console.log('Full cookie to store:', fullCookie);

  const sessionToken = await sealSessionData({ cookie: fullCookie });

  const sessionPersonId = await createICSession({
    personId: personID,
    districtUrl: baseUrl,
    deviceType,
    deviceModel,
    systemVersion,
    deviceId: deviceID,
    sessionToken,
  });

  if (!sessionPersonId) {
    return c.json({ ok: false, message: 'Failed to create session record' }, 500)
  }

  return c.json({ 
    ok: true, 
    data: data, 
    personId: sessionPersonId,
    districtUrl: baseUrl,
  })
})

app.post('/ic/refresh', async (c) => {
  const res = await c.req.json()
  const schema = z.object({
    personId: z.number(),
  })
  
  const { personId } = schema.parse(res)

  const session = await getICSession(personId)
  if (!session) {
    return c.json({ ok: false, message: 'Session not found' }, 404)
  }

  const sessionData = await unsealSessionData<{ cookie: string }>(session.session_token)
  const storedCookie = sessionData.cookie
  if (!storedCookie) {
    return c.json({ ok: false, message: 'Failed to retrieve session credentials' }, 500)
  }

  const persistentMatch = storedCookie.match(/persistent_cookie=([^;]+)/)
  const persistentCookie = persistentMatch ? persistentMatch[1] : ''
  
  if (!persistentCookie) {
    return c.json({ ok: false, message: 'No persistent cookie found, re-authentication required' }, 401)
  }

  const baseUrl = session.district_url

  const formData = new URLSearchParams({
    'bootstrapped': '1',
    'registrationToken': 'null',
    'deviceID': session.device_id,
    'deviceModel': session.device_model,
    'deviceType': session.device_type,
    'appType': 'student',
    'appVersion': '1.11.4',
    'systemVersion': session.system_version,
    'appName': 'gradecow'
  })

  const response = await fetch(`https://${baseUrl}/campus/mobile/hybridAppUtil.jsp`, {
    method: 'POST',
    headers: {
      'Host': baseUrl,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Sec-Fetch-Site': 'same-origin',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Mode': 'navigate',
      'Origin': `https://${baseUrl}`,
      'User-Agent': 'StudentApp/1.11.4 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Referer': `https://${baseUrl}/campus/mobile/hybridAppUtil.jsp`,
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `persistent_cookie=${persistentCookie}; campus_hybrid_app=student; deviceID=${session.device_id}`,
    },
    body: formData.toString()
  })

  if (response.status !== 200) {
    console.log('Failed to refresh session', response.status, response.statusText)
    return c.json({ ok: false, message: 'Failed to refresh session' }, response.status as ContentfulStatusCode)
  }

  const newCookies = response.headers.getSetCookie()
  if (newCookies.length === 0) {
    return c.json({ ok: false, message: 'No new cookies received' }, 500)
  }

  const cookieParts: Record<string, string> = {}

  storedCookie.split(';').forEach(part => {
    const [key, value] = part.trim().split('=')
    if (key && value) {
      cookieParts[key] = value
    }
  })

  newCookies.forEach(cookieStr => {
    const [cookiePart] = cookieStr.split(';')
    const [key, value] = cookiePart.trim().split('=')
    if (key && value) {
      cookieParts[key] = value
    }
  })

  const updatedCookie = Object.entries(cookieParts)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')

  const newSessionToken = await sealSessionData({ cookie: updatedCookie })
  const updated = await updateICSessionToken(personId, newSessionToken)
  if (!updated) {
    return c.json({ ok: false, message: 'Failed to update session credentials' }, 500)
  }

  console.log('Session refreshed successfully for personId:', personId)
  return c.json({ ok: true, message: 'Session refreshed successfully' })
})

async function refreshSession(session: {
  person_id: number
  district_url: string
  device_type: string
  device_model: string
  system_version: string
  device_id: string
  session_token: string
}): Promise<{ ok: boolean }> {
  const sessionData = await unsealSessionData<{ cookie: string }>(session.session_token)
  const storedCookie = sessionData.cookie
  if (!storedCookie) {
    return { ok: false }
  }

  const persistentMatch = storedCookie.match(/persistent_cookie=([^;]+)/)
  const persistentCookie = persistentMatch ? persistentMatch[1] : ''
  
  if (!persistentCookie) {
    return { ok: false }
  }

  const baseUrl = session.district_url

  const formData = new URLSearchParams({
    'bootstrapped': '1',
    'registrationToken': 'null',
    'deviceID': session.device_id,
    'deviceModel': session.device_model,
    'deviceType': session.device_type,
    'appType': 'student',
    'appVersion': '1.11.4',
    'systemVersion': session.system_version,
    'appName': 'gradecow'
  })

  const response = await fetch(`https://${baseUrl}/campus/mobile/hybridAppUtil.jsp`, {
    method: 'POST',
    headers: {
      'Host': baseUrl,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Origin': `https://${baseUrl}`,
      'User-Agent': 'StudentApp/1.11.4 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `persistent_cookie=${persistentCookie}; campus_hybrid_app=student; deviceID=${session.device_id}`,
    },
    body: formData.toString()
  })

  if (response.status !== 200) {
    return { ok: false }
  }

  const newCookies = response.headers.getSetCookie()
  if (newCookies.length === 0) {
    return { ok: false }
  }

  const cookieParts: Record<string, string> = {}
  
  storedCookie.split(';').forEach(part => {
    const [key, value] = part.trim().split('=')
    if (key && value) {
      cookieParts[key] = value
    }
  })

  newCookies.forEach(cookieStr => {
    const [cookiePart] = cookieStr.split(';')
    const [key, value] = cookiePart.trim().split('=')
    if (key && value) {
      cookieParts[key] = value
    }
  })

  const updatedCookie = Object.entries(cookieParts)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')

  const newSessionToken = await sealSessionData({ cookie: updatedCookie })
  const updated = await updateICSessionToken(session.person_id, newSessionToken)
  return { ok: updated }
}

export default app
