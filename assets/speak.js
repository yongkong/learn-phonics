/* speak.js — Web Speech API 朗读组件（课程与测验共用，无需音频文件） */
(function () {
  function pickVoice() {
    var voices = window.speechSynthesis.getVoices();
    var preferred =
      voices.find(function (v) { return /en[-_]US/i.test(v.lang) && /female|Samantha|Zira|Aria/i.test(v.name); }) ||
      voices.find(function (v) { return /en[-_]US/i.test(v.lang); }) ||
      voices.find(function (v) { return /^en/i.test(v.lang); });
    return preferred || null;
  }

  /**
   * 朗读英文。speak("sat") 正常读；speak("sss", { rate: 0.55 }) 慢速读音素。
   * 音素写法约定（TTS 近似）：/s/="sss" /a/="ah" /t/="tuh" /p/="puh"
   */
  window.speak = function (text, opts) {
    if (!("speechSynthesis" in window)) return;
    opts = opts || {};
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = opts.rate != null ? opts.rate : 0.85;
    u.pitch = 1;
    var v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // 常用音素的 TTS 近似写法（真人示范请用 BBC Sounds of English 校准）
  window.SOUNDS = { s: "sss", a: "ah", t: "tuh", p: "puh", i: "ih", n: "nnn", m: "mmm", d: "duh" };

  // 点击 .sound-card / .phoneme-btn / .speak-btn 自动发音：
  //   data-say="文本" data-rate="0.6"；.sound-card/.phoneme-btn 无 data-say 时按字母查 SOUNDS
  document.addEventListener("click", function (e) {
    var el = e.target.closest(".sound-card, .phoneme-btn, .speak-btn");
    if (!el) return;
    var say = el.getAttribute("data-say");
    if (!say) {
      var letter = (el.textContent || "").trim().toLowerCase().charAt(0);
      say = (window.SOUNDS && window.SOUNDS[letter]) || letter;
    }
    var rate = parseFloat(el.getAttribute("data-rate") || "0.6");
    window.speak(say, { rate: rate });
  });
})();
