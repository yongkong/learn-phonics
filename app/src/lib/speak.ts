// 与课程 assets/speak.js 同一套发音约定：/s/="sss" /a/="ah" /t/="tuh" /p/="puh"
export function speak(text: string, rate = 0.85) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = rate
  const voices = window.speechSynthesis.getVoices()
  const voice =
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang))
  if (voice) u.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export function speakPhoneme(say: string) {
  speak(say, 0.55)
}
