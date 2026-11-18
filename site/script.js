/* =========================================================
   Сайт-визитка · Дмитрий Некрашевич
   Анимации, меню, форма. Чистый JavaScript, без библиотек.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var stackMQ = window.matchMedia("(min-width: 901px) and (min-height: 680px)");

  var body = document.body;
  var hero = $("#home");

  /* ---------------------------------------------------------
     1. Подготовка текста
     --------------------------------------------------------- */

  // «рулетка»: дублируем текст, чтобы при наведении он прокручивался
  $$(".roll").forEach(function (el) {
    if (el.closest("#header")) return;
    var text = el.textContent;
    el.innerHTML = "<span>" + text + "</span><span aria-hidden=\"true\">" + text + "</span>";
  });

  // заголовок hero: строки -> слова -> буквы
  function wrapChars(node, counter) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var wd = document.createElement("span");
          wd.className = "wd";
          part.split("").forEach(function (ch) {
            var s = document.createElement("span");
            s.className = ch.toUpperCase() === "У" ? "ch ch--balanced" : "ch";
            s.textContent = ch;
            s.style.setProperty("--c", counter.i++);
            wd.appendChild(s);
          });
          frag.appendChild(wd);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        wrapChars(child, counter);
      }
    });
  }

  var heroTitle = $("#heroTitle");
  if (heroTitle) {
    heroTitle.setAttribute("aria-label", heroTitle.textContent.replace(/\s+/g, " ").trim());
    $$(".line", heroTitle).forEach(function (line, n) {
      line.style.setProperty("--n", n);
      line.setAttribute("aria-hidden", "true");
      wrapChars(line.firstElementChild, { i: 0 });
    });
  }

  // заголовки секций: слова и буквы
  $$(".section-head__title").forEach(function (el) {
    var text = el.textContent.trim().replace(/\s+/g, " ");
    var words = [];
    Array.prototype.forEach.call(el.childNodes, function (n) {
      var acc = n.nodeType === 1 && n.tagName === "EM";
      n.textContent.split(/\s+/).forEach(function (w) { if (w) words.push({ t: w, a: acc }); });
    });
    var index = 0;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var keepAccentTogether = el.closest("#cars");
    var accentGroup;
    words.forEach(function (item, w, arr) {
      var wordEl = document.createElement("span");
      wordEl.className = "word" + (item.a ? " word--accent" : "");
      wordEl.setAttribute("aria-hidden", "true");
      item.t.split("").forEach(function (ch) {
        var c = document.createElement("span");
        c.className = ch.toUpperCase() === "У" ? "char type-u" : "char";
        c.textContent = ch;
        c.style.setProperty("--i", index++);
        wordEl.appendChild(c);
      });
      var container = el;
      if (keepAccentTogether && item.a) {
        if (!accentGroup) {
          accentGroup = document.createElement("span");
          accentGroup.className = "gallery-accent";
          el.appendChild(accentGroup);
        }
        container = accentGroup;
      } else {
        accentGroup = null;
      }
      container.appendChild(wordEl);
      if (w < arr.length - 1) {
        (accentGroup && arr[w + 1].a ? accentGroup : el).appendChild(document.createTextNode(" "));
      }
      index += 2;
    });
    el.classList.add("split");
  });

  // абзацы, которые «загораются» при прокрутке
  var scrubs = $$(".scrub").map(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.textContent = "";
    var spans = words.map(function (word, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.setAttribute("aria-hidden", "true");
      s.textContent = word;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
    return { el: el, spans: spans };
  });

  function updateScrub() {
    var vh = window.innerHeight;
    scrubs.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      var p = clamp((vh * 0.9 - r.top) / (vh * 0.42), 0, 1);
      var n = s.spans.length;
      for (var i = 0; i < n; i++) {
        var wp = clamp(p * (n + 4) - i, 0, 1);
        s.spans[i].style.opacity = (0.18 + 0.82 * wp).toFixed(3);
      }
    });
  }

  requestAnimationFrame(function () {
    body.classList.add("is-ready");
    setTimeout(function () {
      if (heroTitle) heroTitle.classList.add("is-settled");
    }, 1900);
  });

  /* ---------------------------------------------------------
     4. Прокрутка: индикатор, шапка, наезд секций, параллакс, бегущая строка
     --------------------------------------------------------- */
  var progress = $("#progress");
  var marquee = $("#marquee");
  var track = $("#marqueeTrack");
  var shifters = $$("[data-hshift]").map(function (el) {
    return { el: el, section: el.closest("section"), k: parseFloat(el.getAttribute("data-hshift")) };
  });
  var speeders = $$("[data-speed]").map(function (el) {
    return { el: el, k: parseFloat(el.getAttribute("data-speed")) };
  });
  var badge = $("#badge");

  var lastY = window.scrollY;
  var scrollVel = 0;
  var dir = 1;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";

    var delta = y - lastY;
    if (Math.abs(delta) > 0) dir = delta > 0 ? 1 : -1;
    scrollVel = delta;

    lastY = y;

    // hero уходит «вглубь», пока секции наезжают
    if (hero) {
      if (false) {
        var p = clamp(y / vh, 0, 1);
        hero.style.setProperty("--hs", (1 - p * 0.07).toFixed(4));
        hero.style.setProperty("--dim", (p * 0.7).toFixed(3));
      } else {
        hero.style.setProperty("--hs", "1");
        hero.style.setProperty("--dim", "0");
      }
    }

    if (!reduceMotion) {
      shifters.forEach(function (s) {
        var top = s.section ? s.section.getBoundingClientRect().top : -y;
        s.el.style.setProperty("--hx", (top * s.k).toFixed(1) + "px");
      });
      speeders.forEach(function (s) { s.el.style.setProperty("--sy", (y * s.k * -1).toFixed(1) + "px"); });
      if (badge) badge.style.setProperty("--by", (y * -0.06).toFixed(1) + "px");
    }

    updateScrub();
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // бегущие строки: скорость и направление зависят от прокрутки
  var marqueeList = [];
  if (track) marqueeList.push({ el: track, x: 0, flip: 1, wrap: hero });
  var track2 = $("#marqueeTrack2");
  if (track2) marqueeList.push({ el: track2, x: 0, flip: -1, wrap: track2.parentNode });

  var badgeRing = $(".badge__ring");
  var badgeAngle = 0;

  if (!reduceMotion) {
    var vel = 0;
    (function runMarquee() {
      vel += (Math.min(Math.abs(scrollVel), 60) - vel) * 0.08;
      scrollVel *= 0.9;

      marqueeList.forEach(function (m) {
        var r = m.wrap.getBoundingClientRect();
        if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
        var setW = m.el.scrollWidth / 4;
        if (setW <= 0) return;
        m.x -= (1.1 + vel * 0.55) * dir * m.flip;
        if (m.x <= -setW) m.x += setW;
        if (m.x > 0) m.x -= setW;
        m.el.style.transform = "translate3d(" + m.x.toFixed(1) + "px,0,0)";
      });

      // бейдж вращается быстрее, когда прокручиваешь страницу
      if (badgeRing) {
        badgeAngle += 0.32 + vel * 0.28 * dir;
        badgeRing.style.transform = "rotate(" + badgeAngle.toFixed(1) + "deg)";
      }
      requestAnimationFrame(runMarquee);
    })();
  }

  /* ---------------------------------------------------------
     4b. Машина: заезжает на первый экран и уезжает при прокрутке
     --------------------------------------------------------- */
  var car = $("#car");
  if (car && marquee) {
    var carPitch = $("#carPitch");
    var wheels = $$(".wheel__spin", car);
    var cW = 300, parkX = 0, wheelR = 20, roadH = 120;
    var carStart = null;
    var carX = -600, prevX = -600, prevSpeed = 0, pitch = 0;
    var flashed = false;

    function layoutCar() {
      var W = hero.clientWidth;
      cW = car.offsetWidth;
      roadH = marquee.offsetHeight;
      car.style.bottom = (roadH - 4) + "px";
      parkX = W < 700 ? (W - cW) / 2 : W * 0.5 - cW / 2;
      wheelR = cW * (22 / 340);
    }
    layoutCar();
    window.addEventListener("resize", layoutCar);

    var readyWatch = setInterval(function () {
      if (body.classList.contains("is-ready")) {
        clearInterval(readyWatch);
        carStart = performance.now() + 900;
      }
    }, 60);

    var easeOutQuart = function (p) { return 1 - Math.pow(1 - p, 4); };

    function drawCar(x, pitchDeg) {
      car.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
      var rot = (x / wheelR) * 57.2958;
      wheels.forEach(function (w) { w.style.transform = "rotate(" + rot.toFixed(1) + "deg)"; });
      if (carPitch) carPitch.setAttribute("transform", "rotate(" + pitchDeg.toFixed(2) + " 165 88)");
    }

    if (reduceMotion) {
      drawCar(parkX, 0);
      window.addEventListener("resize", function () { drawCar(parkX, 0); });
    } else {
      (function driveLoop(ts) {
        var startX = -cW - 80;
        var p = 0;
        if (carStart !== null) p = clamp((ts - carStart) / 2800, 0, 1);
        var base = carStart === null ? startX : startX + (parkX - startX) * easeOutQuart(p);
        var extra = window.scrollY < window.innerHeight * 1.3 ? window.scrollY * 1.6 : window.innerHeight * 2.1;
        carX = base + extra;

        var speed = carX - prevX;
        var acc = speed - prevSpeed;
        pitch += (clamp(-acc * 7, -3, 3) - pitch) * 0.15;
        prevX = carX;
        prevSpeed = speed;

        drawCar(carX, pitch);

        var parked = p >= 1 && extra < 2;
        car.classList.toggle("is-idle", parked);
        if (p >= 1 && !flashed) {
          flashed = true;
          car.classList.add("is-flash");
          setTimeout(function () { car.classList.remove("is-flash"); }, 1200);
        }
        requestAnimationFrame(driveLoop);
      })(performance.now());
    }
  }

  /* ---------------------------------------------------------
     5. Бургер-меню и активный пункт
     --------------------------------------------------------- */
  var sections = $$("main section[id]");
  var links = $$(".nav__link");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var active = links.find(function (link) { return link.getAttribute("href") === "#" + entry.target.id; });
        if (!active) return;
        links.forEach(function (link) {
          link.classList.toggle("is-active", link === active);
          if (link === active) link.setAttribute("aria-current", entry.target.id === "home" ? "page" : "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------------------------------------------------
     6. Появление блоков и счётчики
     --------------------------------------------------------- */
  $$(".cards, .tech-grid").forEach(function (group) {
    $$(".reveal", group).forEach(function (el, i) { el.style.setProperty("--d", ((i % 4) * 0.12) + "s"); });
  });

  function counterHTML(el, value) {
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var unit = el.getAttribute("data-unit") || "";
    return (prefix ? "<span class=\"sfx\">" + prefix + "</span>" : "") + value +
      (suffix ? "<span class=\"sfx\">" + suffix + "</span>" : "") +
      (unit ? "<small>" + unit + "</small>" : "");
  }

  function runCounter(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    if (reduceMotion) { el.innerHTML = counterHTML(el, end); return; }
    var duration = 2000;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.innerHTML = counterHTML(el, Math.round(end * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  $$("[data-count]").forEach(function (el) { el.innerHTML = counterHTML(el, 0); });

  var inTargets = $$(".reveal, .split");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        $$("[data-count]", el).forEach(runCounter);
        io.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    inTargets.forEach(function (el) { io.observe(el); });
  } else {
    inTargets.forEach(function (el) {
      el.classList.add("is-in");
      $$("[data-count]", el).forEach(runCounter);
    });
  }

  /* ---------------------------------------------------------
     7. Карточки и кнопки
     --------------------------------------------------------- */
  $$(".more").forEach(function (btn) {
    var label = $("span", btn);
    btn.addEventListener("click", function () {
      var card = btn.closest(".card");
      var open = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      label.textContent = open ? "Свернуть" : "Подробнее";
    });
  });

  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((px - 0.5) * 8).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 8).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    // «магнитные» кнопки
    $$(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.32;
        btn.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      });
      btn.addEventListener("pointerleave", function () { btn.style.translate = "0 0"; });
    });
  }

})();

(function () {
  const request = document.getElementById('calcForm');
  const carField = document.getElementById('cCar');
  const budgetField = document.getElementById('cBudget');

  carField.addEventListener('input', () => carField.setCustomValidity(''));
  request.addEventListener('submit', event => {
    event.preventDefault();
    const car = carField.value.trim();
    if (car.length < 2) {
      carField.setCustomValidity('Укажите марку или модель.');
      carField.reportValidity();
      return;
    }

    const budget = budgetField.value;
    const body = 'Здравствуйте, Дмитрий! Интересует подбор: ' + car +
      (budget ? '\nБюджет: ' + budget + ' USD.' : '');
    location.href = request.getAttribute('action') +
      '?subject=' + encodeURIComponent('Подбор авто: ' + car) +
      '&body=' + encodeURIComponent(body);
  });
})();

// ===== нарисованные машины: едут слева направо, пока секция проходит экран =====
(function () {
  var cars = Array.prototype.slice.call(document.querySelectorAll("[data-drive]"));
  if (!cars.length) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight, vw = window.innerWidth;
    cars.forEach(function (el) {
      var sec = el.parentElement.getBoundingClientRect();
      var p = (vh - sec.top) / (vh + sec.height);
      p = Math.max(0, Math.min(1, p));
      var w = el.getBoundingClientRect().width;
      var from = -w - 40, to = vw + 40;
      var left = el.classList.contains("drive--contact") ? 0 : 0;
      var x = from + (to - from) * p;
      var base = el.offsetLeft;
      el.style.setProperty("--dx", (x - base) + "px");
      el.style.setProperty("--wr", (x * 0.6) + "deg");
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  update();
})();


