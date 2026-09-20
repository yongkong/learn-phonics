import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from '../api/_lib/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const app = createApp()

// 教学内容：仓库根目录的 lessons / reference / assets（仅暴露这三个目录）
const repoRoot = path.relative(process.cwd(), path.join(__dirname, '..', '..'))
for (const dir of ['lessons', 'reference', 'assets']) {
  app.use(`/teach/${dir}/*`, serveStatic({
    root: repoRoot,
    rewriteRequestPath: (p) => p.replace(/^\/teach/, ''),
  }))
}

// 前端构建产物 + SPA 回退
app.use('*', serveStatic({ root: path.relative(process.cwd(), distDir) || '.' }))
app.get('*', serveStatic({ path: path.join(distDir, 'index.html') }))

const PORT = Number(process.env.PORT) || 3210
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`learn-phonics 运行中 → http://localhost:${info.port}`)
})
