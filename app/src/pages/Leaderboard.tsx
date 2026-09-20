import { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderRow } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
      .then(setRows)
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🏆 伙伴排行榜</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          按累计答对题数排序。每天 10 分钟，比谁坚持得久。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>听音辨字母 · 累计战绩</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive text-sm">加载失败（后端未启动？）：{error}</p>}
          {rows && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              还没有人上榜——去「听音练习」拿下第一 blood！
            </p>
          )}
          {rows && rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>昵称</TableHead>
                  <TableHead className="text-right">场次</TableHead>
                  <TableHead className="text-right">答对</TableHead>
                  <TableHead className="text-right">正确率</TableHead>
                  <TableHead className="text-right">最近练习</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.nickname}>
                    <TableCell>{medals[i] ?? i + 1}</TableCell>
                    <TableCell className="font-medium">{r.nickname}</TableCell>
                    <TableCell className="text-right">{r.sessions}</TableCell>
                    <TableCell className="text-right">{r.correct}</TableCell>
                    <TableCell className="text-right">{r.accuracy}%</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.last_played}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
