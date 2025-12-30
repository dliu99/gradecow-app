import { Hono } from "hono"
import * as Iron from 'iron-webcrypto'

const ironKey = process.env.IRON_KEY as string

type Session = {
  personId: number
  sessionToken: string
}

type Variables = {
  session: Session
}

const ic = new Hono<{ Variables: Variables }>()
ic.use(async (c, next) => {
    const sessionToken = c.req.header('Authorization')
    if (!sessionToken) {
        return c.json({ ok: false, message: 'Unauthorized' }, 401)
    }
    try {
        const session = await Iron.unseal(sessionToken, ironKey, Iron.defaults)
        c.set('session', session as Session)
    } catch (error) {
        return c.json({ ok: false, message: 'Invalid session token' }, 401)
    }
    await next()
})

ic.get('/', async (c) => {
    return c.json({ ok: true, session: c.get('session') })
})

export default ic