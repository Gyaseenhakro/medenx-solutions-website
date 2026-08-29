(function () {
  var stageWrap = document.getElementById('p3dStageWrap');
  var stage = document.getElementById('p3dStage');
  if (!stage || !stageWrap) return;

  var canvas = document.getElementById('p3dCanvas');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  var isDesktop = window.innerWidth > 860;

  /* entrance reveal */
  if ('IntersectionObserver' in window) {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { stage.classList.add('is-in'); revealIo.disconnect(); }
      });
    }, { threshold: 0.25 });
    revealIo.observe(stage);
  } else {
    stage.classList.add('is-in');
  }

  /* mouse parallax tilt + spotlight — desktop, fine pointer only */
  if (!reduceMotion && !isCoarsePointer && isDesktop) {
    var cards = stage.querySelectorAll('.p3d-card');
    stageWrap.addEventListener('mousemove', function (e) {
      var rect = stageWrap.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width;
      var relY = (e.clientY - rect.top) / rect.height;
      stageWrap.style.setProperty('--mx', (relX * 100) + '%');
      stageWrap.style.setProperty('--my', (relY * 100) + '%');
      cards.forEach(function (card) {
        var base = parseFloat(getComputedStyle(card).getPropertyValue('--tilt')) || 0;
        card.style.transform = 'rotateY(' + (base - (relX - 0.5) * 9) + 'deg) rotateX(' + (6 + (relY - 0.5) * 7) + 'deg)';
      });
    });
    stageWrap.addEventListener('mouseleave', function () {
      cards.forEach(function (card) { card.style.transform = ''; });
    });
  }

  /* lightweight canvas particle network — no library, capped node count,
     pauses when off-screen or the tab is hidden, skipped on mobile/coarse pointers */
  if (canvas && isDesktop) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, particles = [], raf = null;
    var COUNT = 44;

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      particles = [];
      for (var i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.4 + 0.6
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var a = particles[i], b = particles[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 118) {
            ctx.strokeStyle = 'rgba(120,180,255,' + (0.16 * (1 - dist / 118)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(170,215,255,0.6)';
        ctx.fill();
      }
    }
    function loop() { frame(); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduceMotion) loop(); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    resize(); seed();
    if (reduceMotion) { frame(); } else { start(); }

    window.addEventListener('resize', function () { resize(); seed(); if (reduceMotion) frame(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if ('IntersectionObserver' in window) {
      var visIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.05 });
      visIo.observe(canvas);
    }
  }
})();
