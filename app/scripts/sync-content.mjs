// 构建前把仓库根目录的教学内容同步进 public/teach，随前端一起发布静态部署
import { cpSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')
const publicTeach = path.resolve(here, '..', 'public', 'teach')

for (const dir of ['lessons', 'reference', 'assets']) {
  const dest = path.join(publicTeach, dir)
  rmSync(dest, { recursive: true, force: true })
  cpSync(path.join(repoRoot, dir), dest, { recursive: true })
}
console.log('教学内容已同步到 public/teach/')
