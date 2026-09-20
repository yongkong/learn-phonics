import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  {
    no: '第 1 课',
    title: '字母名 ≠ 字母音（s a t p）',
    desc: '已上线：26 个字母音图表 + 听音辨字母练习。配套课程在仓库 lessons/ 目录。',
    done: true,
  },
  {
    no: '第 2 课',
    title: 'i, n, m, d · CVC 拼读',
    desc: '已上线：课程 lessons/0002 + 网站「拼读机」——逐音点读、慢速合成、释义揭示。',
    done: true,
  },
  {
    no: '第 3 课',
    title: 'g, o, c, k · 听音写词',
    desc: '规划中：反向练习 segmenting——听单词拆音素（网站将新增「拼写挑战」）。',
    done: false,
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          见词能读 · 听音能写
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          系统自然拼读训练：从 26 个字母音开始，每天 10 分钟。
          课程内容依据英国教育部《Letters and Sounds》与美国国家阅读委员会的循证研究设计。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link to="/learn" />}>开始学习字母音</Button>
          <Button size="lg" variant="outline" render={<Link to="/blend" />}>🧩 试试拼读机</Button>
          <Button size="lg" variant="outline" render={<Link to="/practice" />}>直接去练习 →</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>🔊 字母音图表</CardTitle>
            <CardDescription>26 个字母 + 例词，点一下就发音，随时随地磨耳朵。</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>🧩 拼读机</CardTitle>
            <CardDescription>逐音点读、慢速合成，把字母「焊」成单词。</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>🎯 听音练习</CardTitle>
            <CardDescription>听音选字母，即时反馈。检索练习让记忆真正变强。</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>🏆 伙伴排行榜</CardTitle>
            <CardDescription>成绩存入 SQLite，和一起学习的伙伴互相打气。</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">学习路线（= 网站路线）</h2>
        <div className="space-y-3">
          {steps.map((s) => (
            <Card key={s.no}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.no}</span>
                    <span className="text-foreground/90">{s.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <Badge variant={s.done ? 'default' : 'secondary'} className="shrink-0">
                  {s.done ? '已上线' : '规划中'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
