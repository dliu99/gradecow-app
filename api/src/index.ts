import { Hono } from 'hono'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import * as z from 'zod'
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
  })
  const { cookieHeader } = schema.parse(res)
  const response = await fetch('https://srvusd.infinitecampus.org/campus/resources/my/userAccount', {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Expires': '0',
      'Referer': 'https://srvusd.infinitecampus.org/campus/apps/portal/student/home',
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
  })
  
  const { cookieHeader, deviceType, deviceModel, systemVersion, deviceID } = schema.parse(res)

  if (!cookieHeader || !deviceType || !deviceModel || !systemVersion || !deviceID) {
    return c.json({ ok: false, message: 'cookieHeader, deviceType, deviceModel, systemVersion, and deviceID are required' }, 400)
  }

  const xsrfMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
  const xsrfToken = xsrfMatch ? xsrfMatch[1] : '';

  const response = await fetch('https://srvusd.infinitecampus.org/campus/api/campus/hybridDevice/update', {
    method: 'POST',
    headers: {
      'Host': 'srvusd.infinitecampus.org',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': 'https://srvusd.infinitecampus.org',
      'Connection': 'keep-alive',
      'Cookie': `appType=student;campus_hybrid_app=student;deviceID=${deviceID};${cookieHeader};`,
      'x-xsrf-token': xsrfToken,
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Length': '195',
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
  else {
    const setCookieHeader = response.headers.getSetCookie().join('; ');
    console.log('persistent cookie:', setCookieHeader);
    return c.json({ ok: true, data: data, cookie: cookieHeader+';'+setCookieHeader })
  }
})

export default app
