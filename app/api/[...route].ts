import { handle } from 'hono/vercel'
import { createApp } from '../server/app'

const app = createApp()

export const GET = handle(app)
export const POST = handle(app)
