# Notes

## 用户偏好
- 中文交流；课程内容 = 中文讲解 + 英文素材（成人向，但接受结构清晰的儿童向练习资源）。
- 明确要求「边学边建」：学习自然拼读的过程要产出网站功能，不是纯理论课。
- 技术栈指定：React + shadcn/ui + SQLite（Node 后端）。用户说 "sandcn" = shadcn/ui。
- 仓库：https://github.com/yongkong/learn-phonics （原为空仓库，本次已初始化推送）。

## 工程备注
- 课程 HTML 为独立文件（可 file:// 直接打开），发音用 Web Speech API（speechSynthesis，en-US），不依赖音频素材。
- 共享组件在 `assets/`：phonics.css（课程样式）、quiz.js（选择题测验组件）。
- 网站 `app/` 内置 SQLite（node:sqlite，Node 22+ 免原生依赖），数据表 phonemes + progress。
- Windows + Git Bash 环境；Node v22.22.2。

## 待观察
- 用户当前拼读水平未评估（默认零基础起步）。第 1 课测验成绩可作为校准 ZPD 的第一个信号。
- 伙伴用户是谁（同事/朋友/孩子？）尚不明确 → 影响网站文案与难度设计，下次对话问一下。
