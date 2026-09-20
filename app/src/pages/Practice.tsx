import { useEffect, useMemo, useState } from 'react'
import { fetchPhonemes, postProgress, type Phoneme } from '@/lib/api'
import { speak, speakPhoneme } from '@/lib/speak'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

const TOTAL = 10
const NICKNAME_KEY = 'phonics-nickname'
// 第 1-2 课已学音素（Letters and Sounds Phase 2 · Set 1-2）
const LEARNED_LETTERS = ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd']

interface Question {
  answer: Phoneme
  options: string[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(pool: Phoneme[]): Question[] {
  return shuffle(pool)
    .slice(0, TOTAL)
    .map((answer) => {
      const distractors = shuffle(pool.filter((p) => p.letter !== answer.letter)).slice(0, 3)
      return { answer, options: shuffle([answer.letter, ...distractors.map((d) => d.letter)]) }
    })
}

export default function Practice() {
  const [phonemes, setPhonemes] = useState<Phoneme[]>([])
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')
  const [stage, setStage] = useState<'idle' | 'playing' | 'done'>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [scope, setScope] = useState<'learned' | 'all'>('learned')

  useEffect(() => {
    fetchPhonemes().then(setPhonemes).catch(() => setPhonemes([]))
  }, [])

  const current = questions[qi]
  const isCorrect = useMemo(
    () => picked != null && current != null && picked === current.answer.letter,
    [picked, current],
  )

  function start() {
    const pool =
      scope === 'learned'
        ? phonemes.filter((p) => LEARNED_LETTERS.includes(p.letter))
        : phonemes
    if (pool.length < 4) return
    setQuestions(buildQuestions(pool))
    setQi(0)
    setScore(0)
    setPicked(null)
    setSaveMsg(null)
    setStage('playing')
  }

  function playCurrent() {
    if (current) speakPhoneme(current.answer.say)
  }

  // 进入新题自动播放读音
  useEffect(() => {
    if (stage === 'playing' && current) playCurrent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, qi, questions])

  async function finish(finalScore: number) {
    setStage('done')
    const nick = nickname.trim()
    if (!nick) return
    try {
      await postProgress(nick, 'listen-letter', finalScore, TOTAL)
      setSaveMsg(`已保存到排行榜（${nick}）`)
    } catch {
      setSaveMsg('成绩保存失败，请确认后端已启动')
    }
  }

  function pick(letter: string) {
    if (picked != null || !current) return
    setPicked(letter)
    if (letter === current.answer.letter) {
      setScore((s) => s + 1)
      speak(current.answer.words[0] ?? current.answer.letter)
    }
  }

  function next() {
    const finalScore = score
    if (qi + 1 >= questions.length) {
      void finish(finalScore)
    } else {
      setQi((i) => i + 1)
      setPicked(null)
    }
  }

  if (stage === 'idle') {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>听音辨字母 · {TOTAL} 题挑战</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              每题播放一个「字母音」，从 4 个字母里选出刚才听到的那个。答对会自动读出一个例词。
            </p>
            <div className="space-y-1.5">
              <Label>练习范围</Label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={scope === 'learned' ? 'default' : 'outline'} onClick={() => setScope('learned')}>
                  已学 8 音（s a t p i n m d）
                </Button>
                <Button size="sm" variant={scope === 'all' ? 'default' : 'outline'} onClick={() => setScope('all')}>
                  全部 26 音
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickname">你的昵称（成绩将进入排行榜）</Label>
              <Input
                id="nickname"
                value={nickname}
                maxLength={20}
                placeholder="例如：yongk"
                onChange={(e) => {
                  setNickname(e.target.value)
                  localStorage.setItem(NICKNAME_KEY, e.target.value)
                }}
              />
            </div>
            <Button className="w-full" size="lg" disabled={!nickname.trim() || phonemes.length < 4} onClick={start}>
              开始挑战 🔊
            </Button>
            {!nickname.trim() && (
              <p className="text-center text-xs text-muted-foreground">先填一个昵称吧，伙伴们要看到你的成绩～</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (stage === 'done') {
    const pct = Math.round((score / TOTAL) * 100)
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">{score} / {TOTAL}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">
              {pct >= 80
                ? '太棒了！这些字母音已经属于你了。'
                : pct >= 50
                  ? '不错！错的几个字母去图表页再听几遍，隔天再来。'
                  : '回图表页磨磨耳朵，明天再战——检索失败正是记忆增长的开始。'}
            </p>
            {saveMsg && <p className="text-sm font-medium text-green-700">{saveMsg}</p>}
            <Button className="w-full" onClick={start}>
              ↻ 再来一轮
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          第 {qi + 1} / {questions.length} 题
        </span>
        <span>得分 {score}</span>
      </div>
      <Progress value={((qi + (picked != null ? 1 : 0)) / questions.length) * 100} />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Button size="lg" variant="secondary" className="h-20 w-20 rounded-full text-3xl" onClick={playCurrent}>
            🔊
          </Button>
          <p className="text-sm text-muted-foreground">刚才播放的是哪个字母？</p>
          <div className="grid w-full grid-cols-4 gap-2">
            {current?.options.map((letter) => {
              const state =
                picked == null
                  ? 'idle'
                  : letter === current.answer.letter
                    ? 'correct'
                    : letter === picked
                      ? 'wrong'
                      : 'dim'
              return (
                <Button
                  key={letter}
                  variant="outline"
                  className="h-16 font-serif text-3xl font-bold"
                  disabled={picked != null}
                  onClick={() => pick(letter)}
                >
                  {letter}
                  {state === 'correct' && ' ✓'}
                  {state === 'wrong' && ' ✗'}
                </Button>
              )
            })}
          </div>
          <div className="min-h-6 text-sm">
            {picked != null &&
              (isCorrect ? (
                <span className="font-medium text-green-700">
                  ✓ 正确！/æ/ 就是它 —— 听例词：{current.answer.words.join(' · ')}
                </span>
              ) : (
                <span className="font-medium text-red-700">
                  ✗ 正确答案是 {current.answer.letter}（{current.answer.sound}）
                </span>
              ))}
          </div>
          {picked != null && (
            <Button className="w-full" onClick={next}>
              {qi + 1 >= questions.length ? '看成绩 →' : '下一题 →'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
