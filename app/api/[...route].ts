import { handle } from 'hono/vercel'
import { createApp } from './_lib/app'

const app = createApp()

export const GET = handle(app)
export const POST = handle(app)
