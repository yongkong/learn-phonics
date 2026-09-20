// 与课程 assets/speak.js 同一套发音约定：/s/="sss" /a/="ah" /t/="tuh" /p/="puh"
// 注意：TTS 对孤立音素只是近似，关键交互都应配合例词锚定（speakSequence）。
function pickVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    null
  )
}

export function hasEnglishVoice(): boolean {
  return 'speechSynthesis' in window && pickVoice() != null
}

export function speak(text: string, rate = 0.85) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = rate
  const voice = pickVoice()
  if (voice) u.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

// 依次朗读多段：用于「音素 → 例词」锚定，例词保证学习者听到目标音的真实语境
export function speakSequence(parts: Array<{ text: string; rate?: number }>) {
  if (!('speechSynthesis' in window)) return
  const list = [...parts]
  const next = () => {
    const p = list.shift()
    if (!p) return
    const u = new SpeechSynthesisUtterance(p.text)
    u.lang = 'en-US'
    u.rate = p.rate ?? 0.85
    const voice = pickVoice()
    if (voice) u.voice = voice
    u.onend = next
    u.onerror = next
    window.speechSynthesis.speak(u)
  }
  window.speechSynthesis.cancel()
  next()
}

export function speakPhoneme(say: string) {
  speak(say, 0.55)
}
