import { Hono } from "hono"
import auth from "./auth"
import ic from "./ic"

const app = new Hono()

app.route('/auth', auth)
app.route('/ic', ic)
export default app