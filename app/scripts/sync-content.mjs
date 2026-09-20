// 构建前把教学内容同步进 public/teach，随前端一起发布。
// 两个环境：
//   - 本地/自托管：仓库根目录的 lessons|reference|assets 是唯一来源，每次构建刷新副本
//   - Vercel：项目根目录是 app/，根目录教学内容不在构建上下文中——
//     直接使用已提交的 public/teach 副本（更新内容 = 本地构建一次并提交副本）
import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')
const publicTeach = path.resolve(here, '..', 'public', 'teach')

if (!existsSync(repoRoot)) {
  console.log('[sync-content] 未找到仓库根目录（Vercel 构建环境），使用已提交的 public/teach 副本。')
  process.exit(0)
}

for (const dir of ['lessons', 'reference', 'assets']) {
  const src = path.join(repoRoot, dir)
  if (!existsSync(src)) {
    console.log(`[sync-content] 跳过 ${dir}（仓库根目录不存在）`)
    continue
  }
  const dest = path.join(publicTeach, dir)
  rmSync(dest, { recursive: true, force: true })
  cpSync(src, dest, { recursive: true })
}
console.log('教学内容已同步到 public/teach/')
