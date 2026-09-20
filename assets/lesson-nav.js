/* lesson-nav.js — 课程页顶部导航（注入网站链接 + 上一课/下一课翻页）
 * 用法：在课程/速查表页面引入
 *   <script src="../assets/lesson-nav.js" data-lesson="0002-phonemes-imnd-cvc.html"></script>
 * data-lesson 可省略（速查表等非课程页），省略时不显示翻页器。
 */
(function () {
  var LESSONS = [
    { file: "0001-letter-sounds-satp.html", title: "第 1 课 · 字母名 ≠ 字母音 (s a t p)" },
    { file: "0002-phonemes-imnd-cvc.html", title: "第 2 课 · i, n, m, d 与 CVC 拼读" },
    { file: "0003-phonemes-gock-segmenting.html", title: "第 3 课 · g, o, c, k 与听音写词" },
    { file: "0004-ck-e-u-r-digraph.html", title: "第 4 课 · ck, e, u, r 与 digraph" },
    { file: "0005-h-b-f-l-double-letters.html", title: "第 5 课 · h, b, f, l 与双写字母" },
    { file: "0006-j-v-w-x-y-z-q-complete.html", title: "第 6 课 · 26 音全解锁" }
  ];

  var script = document.currentScript;
  var lessonFile = script ? script.getAttribute("data-lesson") : null;
  var idx = -1;
  if (lessonFile) {
    for (var i = 0; i < LESSONS.length; i++) {
      if (LESSONS[i].file === lessonFile) idx = i;
    }
  }

  function a(href, text, cls, title) {
    var el = document.createElement("a");
    el.href = href;
    el.textContent = text;
    if (cls) el.className = cls;
    if (title) el.title = title;
    return el;
  }

  var header = document.createElement("header");
  header.className = "lesson-topnav";

  header.appendChild(a("/", "📖 自然拼读训练营", "brand"));

  var nav = document.createElement("nav");
  [
    ["/learn", "字母音图表"],
    ["/blend", "拼读机"],
    ["/spell", "拼写挑战"],
    ["/practice", "听音练习"],
    ["/leaderboard", "排行榜"]
  ].forEach(function (item) {
    nav.appendChild(a(item[0], item[1]));
  });
  header.appendChild(nav);

  var pager = document.createElement("div");
  pager.className = "pager";
  if (idx >= 0) {
    var prev = idx > 0 ? LESSONS[idx - 1] : null;
    var next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
    pager.appendChild(a(
      prev ? prev.file : "#",
      "← 上一课",
      prev ? "" : "disabled",
      prev ? prev.title : ""
    ));
    var pos = document.createElement("span");
    pos.className = "pos";
    pos.textContent = (idx + 1) + " / " + LESSONS.length;
    pager.appendChild(pos);
    pager.appendChild(a(
      next ? next.file : "#",
      "下一课 →",
      next ? "" : "disabled",
      next ? next.title : ""
    ));
  } else {
    var inReference = /\/reference\//.test(location.pathname);
    var refPath = function (file) { return inReference ? file : "../reference/" + file; };
    pager.appendChild(a(refPath("glossary.html"), "术语表"));
    pager.appendChild(a(refPath("alphabet-sounds.html"), "26 音总表"));
  }
  header.appendChild(pager);

  document.body.insertBefore(header, document.body.firstChild);
})();
