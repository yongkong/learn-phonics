import { useEffect, useState } from 'react'
import { fetchPhonemes, type Phoneme } from '@/lib/api'
import { speak, speakPhoneme } from '@/lib/speak'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Learn() {
  const [phonemes, setPhonemes] = useState<Phoneme[]>([])
  const [phase, setPhase] = useState<number | 'all'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPhonemes().then(setPhonemes).catch((e) => setError(String(e)))
  }, [])

  const filtered = phase === 'all' ? phonemes : phonemes.filter((p) => p.phase === phase)

  if (error) return <p className="text-destructive">加载失败：{error}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">字母音图表</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          点击大字母听「字母音」，点击例词听整词。注意：是字母的音，不是字母的名。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={phase === 'all' ? 'default' : 'outline'} onClick={() => setPhase('all')}>
          全部
        </Button>
        {[2, 3].map((p) => (
          <Button key={p} size="sm" variant={phase === p ? 'default' : 'outline'} onClick={() => setPhase(p)}>
            Phase {p}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((p) => (
          <Card key={p.letter} className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <button
                type="button"
                className="font-serif text-5xl font-bold leading-none transition-transform hover:scale-110 active:scale-95"
                onClick={() => speakPhoneme(p.say)}
                aria-label={`播放 ${p.letter} 的音`}
              >
                {p.letter}
              </button>
              <span className="text-sm font-semibold text-orange-700">{p.sound}</span>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {p.words.map((w) => (
                  <button
                    key={w}
                    type="button"
                    className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                    onClick={() => speak(w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <span className="mt-1 text-[11px] text-muted-foreground">
                Phase {p.phase}
                {p.set_no ? ` · Set ${p.set_no}` : ''}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        发音由浏览器语音合成（Web Speech API）生成，用于磨耳朵足够；追求真人精准口型示范，请配合 BBC Learning English《The Sounds of English》。
      </p>
    </div>
  )
}
