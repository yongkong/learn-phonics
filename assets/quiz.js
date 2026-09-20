/* quiz.js — 通用选择题测验组件（检索练习，即时反馈，本地保存最佳成绩）
 * 用法：
 *   PhonicsQuiz(document.getElementById("quiz"), {
 *     id: "lesson-0001",
 *     questions: [
 *       { prompt: "哪个字母发 /s/？", speak: "sss",       // speak 可选：🔊按钮朗读
 *         options: ["s", "a", "t", "p"], answer: 0,       // answer 为下标；选项必须等长
 *         explain: "蛇的嘶嘶声。" },
 *     ],
 *     done: function (score, total) {}                    // 可选回调
 *   });
 */
(function () {
  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  function render(container, cfg) {
    var qi = 0;
    var score = 0;
    var answered = false;
    var bestKey = "quiz-best-" + (cfg.id || location.pathname);

    function drawQuestion() {
      answered = false;
      var q = cfg.questions[qi];
      container.innerHTML = "";
      container.className = "quiz";

      container.appendChild(el("div", "quiz-progress", "第 " + (qi + 1) + " / " + cfg.questions.length + " 题 · 已得 " + score + " 分"));

      var prompt = el("div", "quiz-question");
      prompt.appendChild(el("span", null, q.prompt));
      if (q.speak) {
        var b = el("button", "speak-btn", "🔊 听音");
        b.type = "button";
        b.setAttribute("data-say", q.speak);
        b.setAttribute("data-rate", q.rate || "0.6");
        prompt.appendChild(document.createTextNode(" "));
        prompt.appendChild(b);
      }
      container.appendChild(prompt);

      var opts = el("div", "quiz-options");
      q.options.forEach(function (opt, idx) {
        var btn = el("button", "quiz-option");
        btn.type = "button";
        btn.textContent = opt;
        btn.addEventListener("click", function () { answer(idx, btn); });
        opts.appendChild(btn);
      });
      container.appendChild(opts);

      container.appendChild(el("div", "quiz-feedback"));
      var next = el("button", "btn primary quiz-next", qi + 1 < cfg.questions.length ? "下一题 →" : "看成绩 →");
      next.type = "button";
      next.style.display = "none";
      next.addEventListener("click", function () {
        qi += 1;
        if (qi < cfg.questions.length) drawQuestion();
        else drawFinal();
      });
      container.appendChild(next);
    }

    function answer(idx, btn) {
      if (answered) return;
      answered = true;
      var q = cfg.questions[qi];
      var buttons = container.querySelectorAll(".quiz-option");
      buttons.forEach(function (b) { b.disabled = true; });
      var fb = container.querySelector(".quiz-feedback");
      var nextBtn = container.querySelector(".quiz-next");

      if (idx === q.answer) {
        score += 1;
        btn.classList.add("correct");
        fb.className = "quiz-feedback ok";
        fb.textContent = "✓ 正确！" + (q.explain ? " " + q.explain : "");
      } else {
        btn.classList.add("wrong");
        buttons[q.answer].classList.add("correct");
        fb.className = "quiz-feedback no";
        fb.textContent = "✗ 正确答案是 " + q.options[q.answer] + "。" + (q.explain ? " " + q.explain : "");
      }
      nextBtn.style.display = "inline-block";
      nextBtn.focus();
    }

    function drawFinal() {
      var total = cfg.questions.length;
      var pct = Math.round((score / total) * 100);
      var prev = parseInt(localStorage.getItem(bestKey) || "0", 10);
      if (score > prev) localStorage.setItem(bestKey, String(score));
      var best = Math.max(prev, score);

      container.innerHTML = "";
      var fin = el("div", "quiz-final");
      fin.appendChild(el("div", "score", score + " / " + total));
      var msg =
        pct >= 80 ? "太棒了，这个知识点已经属于你了。"
        : pct >= 50 ? "不错，把错的几题隔天再测一次（间隔练习）。"
        : "没关系，回到上面的讲解再读一遍，然后点「重来」——检索失败恰恰是记忆增长的开始。";
      fin.appendChild(el("p", null, msg));
      fin.appendChild(el("p", "muted", "本地最佳成绩：" + best + " / " + total));
      var retry = el("button", "btn primary", "↻ 重来");
      retry.type = "button";
      retry.addEventListener("click", function () { qi = 0; score = 0; drawQuestion(); });
      fin.appendChild(retry);
      container.appendChild(fin);
      if (cfg.done) cfg.done(score, total);
    }

    drawQuestion();
  }

  window.PhonicsQuiz = render;
})();
