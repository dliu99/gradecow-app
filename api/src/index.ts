import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ ok: true,message: 'Hello Hono!' })
})

app.get('/ic/districts', async (c) => {
  const state = c.req.query('state');
  const query = c.req.query('query');
  if (!state || !query) {
    return c.json({ ok: false, message: 'State and query are required' }, 400)
  }
  const response = await fetch(`https://www.infinitecampus.com/api/district?state=${state.toUpperCase()}&query=${query}`)
  const data = await response.json()
  return c.json({ ok: true, data })
})

export default app
