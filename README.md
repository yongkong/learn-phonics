# learn-phonics · 自然拼读学习之旅

一边系统学习自然拼读（Phonics），一边把每一课的学习成果做成一个**真实可用的学习网站**，供同样在学习自然拼读的伙伴使用。

## 仓库结构

| 路径 | 内容 |
| --- | --- |
| `MISSION.md` | 学习使命（一切课程与功能都从这里出发） |
| `lessons/` | 课程（自包含 HTML，浏览器直接打开，含交互练习与测验） |
| `reference/` | 速查表（术语表等，打印友好） |
| `assets/` | 课程共享组件（样式、发音、测验） |
| `learning-records/` | 学习记录（已掌握什么、下一步教什么） |
| `app/` | **学习网站**：React + shadcn/ui + SQLite |

## 网站（v1）

- **字母音图表**：26 个字母 + 例词，点击即发音（Web Speech API，无需音频文件）
- **拼读机**：CVC 单词逐音点读、慢速合成、释义揭示，6 个级别对应课程进度
- **拼写挑战**：听词拼字母（segmenting 反向技能），每轮 8 词、成绩入库
- **听音辨字母练习**：随机出题、即时反馈，可只练已学音素，成绩写入 SQLite
- **学习排行榜**：伙伴们比拼练习次数与正确率
- 后端：Hono + `node:sqlite`（Node 22+ 内置，无原生依赖），数据持久化在 `app/data/phonics.db`

### 运行

```bash
cd app
npm install
npm run server   # API 服务 :3210（端口被占可用 PORT=xxx 覆盖）
npm run dev      # 前端开发 :5173（开发时两个都要跑）
```

生产模式（一条命令，构建 + 单端口伺服）：

```bash
npm run build && npm start   # → http://localhost:3210
```

## 部署到 Vercel

> `app/` 已内置 `vercel.json`（SPA 回退）+ `api/[...route].ts`（Hono Serverless 函数）+ 内容同步脚本（课程页随静态构建发布）。构建时无需额外配置。

### 方式 A：CLI（最快）

```bash
cd app
npx vercel login          # 浏览器授权一次
npx vercel link           # 关联/创建项目（Root Directory 保持 app）
npx vercel --prod         # 部署
```

### 方式 B：GitHub 集成（推一次发一次）

1. Vercel 控制台 → Add New Project → 导入 `yongkong/learn-phonics`
2. **Root Directory 设为 `app`**（其余设置已由 vercel.json 提供）
3. Deploy。之后每次 `git push` 自动重新部署

### 排行榜持久化（推荐，约 3 分钟）

Vercel 是 Serverless，文件系统不持久。排行榜要跨用户保留，需配一个免费的 Turso（libsql 即 SQLite）数据库：

```bash
# 安装 Turso CLI 后：
turso db create learn-phonics
turso db show learn-phonics --url          # → TURSO_DATABASE_URL
turso db tokens create learn-phonics       # → TURSO_AUTH_TOKEN
```

在 Vercel 项目 Settings → Environment Variables 添加这两个变量，重新部署即可。
未配置时网站完全可用（发音/课程/练习均正常），仅排行榜数据不跨实例保留。

## 课程路线（= 产品路线）

1. ✅ **第 1 课** 字母名 ≠ 字母音（s a t p）→ 网站 v1：字母音图表 + 练习 + 排行榜
2. ✅ **第 2 课** i, n, m, d + CVC 拼读 → 网站「拼读机」（/blend）
3. ✅ **第 3 课** g, o, c, k + 听音写词（segmenting）→ 网站「拼写挑战」（/spell）
4. ✅ **第 4 课** ck, e, u, r（第一个 digraph）
5. ✅ **第 5 课** h, b, f, l + 双写 ff/ll/ss
6. ✅ **第 6 课** j, v, w, x, y, z, q → **26 音全解锁**，配合 Oxford Owl 分级读物
7. 下一阶段（规划）：digraphs sh / ch / th / ng、长元音（Phase 3–6）

全部课程见 `lessons/`，26 音速查表见 `reference/alphabet-sounds.html`。

## 学习资源

见 [RESOURCES.md](./RESOURCES.md)：DfE《Letters and Sounds》、NRP 元分析（Ehri et al. 2001）、Starfall、Oxford Owl、Jolly Phonics。
