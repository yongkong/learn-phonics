import { useEffect, useMemo, useState } from 'react'
import { fetchWords, type WordItem } from '@/lib/api'
import { speak, speakSequence } from '@/lib/speak'
import { WORD_LEVELS } from '@/lib/levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Blend() {
  const [words, setWords] = useState<WordItem[]>([])
  const [level, setLevel] = useState<number | 'all'>('all')
  const [current, setCurrent] = useState<WordItem | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWords().then(setWords).catch((e) => setError(String(e)))
  }, [])

  const filtered = useMemo(
    () => (level === 'all' ? words : words.filter((w) => w.level === level)),
    [words, level],
  )

  function pick(exclude?: string) {
    const pool = filtered.filter((w) => w.word !== exclude)
    const list = pool.length > 0 ? pool : filtered
    if (list.length === 0) {
      setCurrent(null)
      return
    }
    setCurrent(list[Math.floor(Math.random() * list.length)] ?? null)
    setRevealed(false)
  }

  useEffect(() => {
    pick()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  function blendSlowly() {
    if (!current) return
    speakSequence([
      ...current.says.map((s) => ({ text: s, rate: 0.45 })),
      { text: current.word, rate: 0.8 },
    ])
    setRevealed(true)
  }

  function speakWhole() {
    if (!current) return
    speak(current.word)
    setRevealed(true)
  }

  if (error) return <p className="text-destructive">加载失败：{error}</p>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧩 拼读机</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          把音素「焊」成单词：① 逐个点字母听音 → ② 自己试着连读 → ③ 点「慢速拼读」对照 → ④ 点「整词」验证。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WORD_LEVELS.map((l) => (
          <Button key={String(l.value)} size="sm" variant={level === l.value ? 'default' : 'outline'} onClick={() => setLevel(l.value)}>
            {l.label}
          </Button>
        ))}
      </div>

      {current && (
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-8">
            <div className="flex items-center gap-2">
              {current.letters.map((letter, i) => (
                <button
                  key={`${current.word}-${i}`}
                  type="button"
                  className="rounded-xl border-2 border-border px-4 py-2 font-serif text-4xl font-bold transition-colors hover:border-primary hover:text-primary"
                  onClick={() => speak(current.says[i] ?? letter, 0.5)}
                  aria-label={`播放音素 ${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={blendSlowly}>🐢 慢速拼读</Button>
              <Button variant="secondary" onClick={speakWhole}>🔊 整词</Button>
              <Button variant="outline" onClick={() => pick(current.word)}>下一个词 →</Button>
            </div>

            <div className="min-h-10 text-center">
              {revealed ? (
                <p className="text-lg">
                  <span className="font-serif text-2xl font-bold">{current.word}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{current.meaning}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">先自己拼一拼，再点上面的按钮对照（点后才显示释义）</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Level {current.level} · 音素由语音合成近似，慢速拼读最后的整词是准确发音
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
