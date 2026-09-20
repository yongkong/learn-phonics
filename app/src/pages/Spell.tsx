import { useEffect, useMemo, useState } from 'react'
import { fetchWords, postProgress, type WordItem } from '@/lib/api'
import { speak } from '@/lib/speak'
import { WORD_LEVELS } from '@/lib/levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

const ROUND = 8
const NICKNAME_KEY = 'phonics-nickname'
// 干扰字母从已发布的全部课程字母里取（Set 1-5 + Phase 3）
const TAUGHT = ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l', 'j', 'v', 'w', 'x', 'y', 'z', 'q']

interface Tile {
  char: string
  poolIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface RoundItem {
  item: WordItem
  pool: string[]
}

function buildRound(words: WordItem[]): RoundItem[] {
  return shuffle(words)
    .slice(0, ROUND)
    .map((item) => {
      const distractors = shuffle(TAUGHT.filter((l) => !item.letters.includes(l))).slice(0, 3)
      return { item, pool: shuffle([...item.letters, ...distractors]) }
    })
}

export default function Spell() {
  const [words, setWords] = useState<WordItem[]>([])
  const [level, setLevel] = useState<number | 'all'>(3)
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')
  const [stage, setStage] = useState<'idle' | 'playing' | 'done'>('idle')
  const [round, setRound] = useState<RoundItem[]>([])
  const [ri, setRi] = useState(0)
  const [built, setBuilt] = useState<Tile[]>([])
  const [wrong, setWrong] = useState(false)
  const [score, setScore] = useState(0)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWords().then(setWords).catch((e) => setError(String(e)))
  }, [])

  const filtered = useMemo(
    () => (level === 'all' ? words : words.filter((w) => w.level === level)),
    [words, level],
  )

  const current = round[ri]

  function start() {
    if (filtered.length === 0) return
    setRound(buildRound(filtered))
    setRi(0)
    setScore(0)
    setBuilt([])
    setWrong(false)
    setSaveMsg(null)
    setStage('playing')
  }

  async function finish(finalScore: number) {
    setStage('done')
    const nick = nickname.trim()
    if (!nick) return
    try {
      await postProgress(nick, 'spell', finalScore, ROUND)
      setSaveMsg(`已保存到排行榜（${nick}）`)
    } catch {
      setSaveMsg('成绩保存失败，请确认后端已启动')
    }
  }

  // 拼满自动判卷；未拼满时清除错误态，允许重排
  useEffect(() => {
    if (!current) return
    if (built.length !== current.item.letters.length) {
      setWrong(false)
      return
    }
    const attempt = built.map((t) => t.char).join('')
    if (attempt === current.item.word) {
      setWrong(false)
      setScore((s) => s + 1)
      speak(current.item.word)
    } else {
      setWrong(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built])

  function next() {
    if (ri + 1 >= round.length) {
      void finish(score)
    } else {
      setRi((i) => i + 1)
      setBuilt([])
      setWrong(false)
    }
  }

  function addTile(char: string, poolIndex: number) {
    if (!current) return
    if (built.some((t) => t.poolIndex === poolIndex)) return
    setBuilt((b) => [...b, { char, poolIndex }])
  }

  function removeTile(index: number) {
    if (!current) return
    // 拼对后锁定结果；其余状态（拼错/未拼满）都允许取回重排
    if (built.length === current.item.letters.length && !wrong) return
    setBuilt((b) => b.filter((_, i) => i !== index))
  }

  if (error) return <p className="text-destructive">加载失败：{error}</p>

  if (stage === 'idle') {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>✍️ 拼写挑战 · 每轮 {ROUND} 词</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              听一个单词 → 把它的字母按顺序点出来。这是「听音能写」的反向技能（segmenting）：
              听词 → 拆音素 → 对应字母。
            </p>
            <div className="flex flex-wrap gap-2">
              {WORD_LEVELS.map((l) => (
                <Button
                  key={String(l.value)}
                  size="sm"
                  variant={level === l.value ? 'default' : 'outline'}
                  onClick={() => setLevel(l.value)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spell-nickname">你的昵称（成绩将进入排行榜）</Label>
              <Input
                id="spell-nickname"
                value={nickname}
                maxLength={20}
                placeholder="例如：yongk"
                onChange={(e) => {
                  setNickname(e.target.value)
                  localStorage.setItem(NICKNAME_KEY, e.target.value)
                }}
              />
            </div>
            <Button className="w-full" size="lg" disabled={!nickname.trim() || filtered.length === 0} onClick={start}>
              开始挑战 🔊
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (stage === 'done') {
    const pct = Math.round((score / ROUND) * 100)
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">{score} / {ROUND}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">
              {pct >= 80
                ? '听音写词已经入门！隔天再来一轮，把它变成长期记忆。'
                : pct >= 50
                  ? '不错！拼错的词去「拼读机」再拆几遍。'
                  : '先回拼读机把这一级的词过一遍，再来挑战。'}
            </p>
            {saveMsg && <p className="text-sm font-medium text-green-700">{saveMsg}</p>}
            <Button className="w-full" onClick={start}>↻ 再来一轮</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const correct = current != null && built.length === current.item.letters.length && !wrong

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          第 {ri + 1} / {round.length} 词
        </span>
        <span>得分 {score}</span>
      </div>
      <Progress value={(ri / round.length) * 100} />

      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-8">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => current && speak(current.item.word)}>🔊 听词</Button>
            <Button variant="outline" onClick={() => current && speak(current.item.word, 0.55)}>🐢 慢速</Button>
          </div>

          <div className="flex items-center gap-2">
            {current?.item.letters.map((_, slot) => {
              const tile = built[slot]
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => removeTile(slot)}
                  className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 font-serif text-3xl font-bold ${
                    tile
                      ? wrong
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-primary bg-primary/5'
                      : 'border-dashed border-border'
                  }`}
                  aria-label={`第 ${slot + 1} 个字母${tile ? `：${tile.char}，点击移除` : ''}`}
                >
                  {tile?.char ?? ''}
                </button>
              )
            })}
          </div>
          {wrong && (
            <p className="text-sm text-red-700">
              还不对——点格子里的字母取下来重排，或再听一次 🔊
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {current?.pool.map((char, poolIndex) => {
              const used = built.some((t) => t.poolIndex === poolIndex)
              return (
                <button
                  key={poolIndex}
                  type="button"
                  disabled={used}
                  onClick={() => addTile(char, poolIndex)}
                  className="h-14 w-12 rounded-xl border border-border bg-background font-serif text-3xl font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-25"
                >
                  {char}
                </button>
              )
            })}
          </div>

          <div className="min-h-8 text-center">
            {correct && current && (
              <p className="text-lg">
                <span className="font-serif text-2xl font-bold text-green-700">{current.item.word}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{current.item.meaning}</span>
              </p>
            )}
          </div>

          {correct && (
            <Button className="w-full" onClick={next}>
              {ri + 1 >= round.length ? '看成绩 →' : '下一个词 →'}
            </Button>
          )}

          {correct && current && (
            <p className="text-xs text-muted-foreground">
              音素拆解：{current.item.says.map((s) => `/${s}/`).join(' - ')}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        每轮 {ROUND} 词 · 拼对自动读出整词 · 拼错点字母格取回重排
      </p>
    </div>
  )
}
