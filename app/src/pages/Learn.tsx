import { useEffect, useState } from 'react'
import { fetchPhonemes, type Phoneme } from '@/lib/api'
import { hasEnglishVoice, speak, speakSequence } from '@/lib/speak'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Learn() {
  const [phonemes, setPhonemes] = useState<Phoneme[]>([])
  const [phase, setPhase] = useState<number | 'all'>('all')
  const [error, setError] = useState<string | null>(null)
  const [noEnVoice, setNoEnVoice] = useState(false)

  useEffect(() => {
    fetchPhonemes().then(setPhonemes).catch((e) => setError(String(e)))
  }, [])

  // 语音列表是异步加载的：立即查一次，再监听变化
  useEffect(() => {
    const check = () => setNoEnVoice(!hasEnglishVoice())
    check()
    window.speechSynthesis?.addEventListener('voiceschanged', check)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', check)
  }, [])

  const filtered = phase === 'all' ? phonemes : phonemes.filter((p) => p.phase === phase)

  function playPhoneme(p: Phoneme) {
    speakSequence([
      { text: p.say, rate: 0.5 },
      { text: p.words[0], rate: 0.75 },
    ])
  }

  if (error) return <p className="text-destructive">加载失败：{error}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">字母音图表</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          点击大字母：先听「字母音」，再听一个例词（音素由语音合成近似，例词是准确锚点）。
          点击例词标签可单独听整词。
        </p>
      </div>

      {noEnVoice && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ 未检测到英语语音包，当前用非英语语音合成，发音会失真。
          建议在 Windows「设置 → 时间和语言 → 语音」添加英语语音包后刷新，或使用 Chrome / Edge 浏览器。
        </div>
      )}

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
                onClick={() => playPhoneme(p)}
                aria-label={`播放 ${p.letter} 的音和例词`}
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
        发音说明：语音合成读「孤立音素」只能是近似（如 /t/ 会带一点中性元音），后面跟的例词才是准确示范；
        追求真人口型示范请配合 BBC Learning English《The Sounds of English》。
      </p>
    </div>
  )
}
