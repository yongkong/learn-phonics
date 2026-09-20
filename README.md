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
- **听音辨字母练习**：随机出题、即时反馈，成绩写入 SQLite
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

## 课程路线（= 产品路线）

1. ✅ **第 1 课** 字母名 ≠ 字母音（s a t p）→ 网站 v1：字母音图表 + 练习 + 排行榜
2. 第 2 课 i, n, m, d + CVC 拼读机 → 网站拼读合成游戏
3. 第 3 课 g, o, c, k + 听音写词（segmenting）→ 网站拼写挑战
4. …（Phase 2–6，详见 `MISSION.md`）

## 学习资源

见 [RESOURCES.md](./RESOURCES.md)：DfE《Letters and Sounds》、NRP 元分析（Ehri et al. 2001）、Starfall、Oxford Owl、Jolly Phonics。
