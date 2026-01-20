import { Hono } from "hono"
import auth from "./auth"
import ic from "./ic"

const app = new Hono<{ Bindings: Env }>()
  .route('/auth', auth)
  .route('/ic', ic)
export default app
export type AppType = typeof app