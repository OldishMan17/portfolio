/*  hero.js — the rotating hero on the home page.

    Three slots, one per craft. Rules it keeps:
      · The poster is the hero until a loop can actually play. First paint
        beats motion; the page is judged in 50ms.
      · Auto-advance every 15s, and ANY manual step stops it permanently for
        this visit. It should not fight the visitor.
      · prefers-reduced-motion: no auto-advance and no playback at all. The
        arrows still work, so the carousel is still usable, just still.
      · Nothing plays in a background tab.
    Dependency-free and small on purpose.                                   */

(function () {
  'use strict';

  var stage = document.getElementById('hero-stage');
  if (!stage) return;

  var slots = Array.prototype.slice.call(stage.querySelectorAll('.hero-slot'));
  var count = document.getElementById('hero-count');
  var label = document.getElementById('hero-label');
  var prev  = document.querySelector('[data-hero-prev]');
  var next  = document.querySelector('[data-hero-next]');
  var cycle = document.getElementById('hero-cycle');
  var bar   = document.getElementById('hero-bar');
  if (!slots.length || !label) return;
  /*  Revised 6 Oct 2026: with one slot there is no carousel, only a readout and
      a loop that fades in. The controls, the timer and the keys all stand down.  */
  var multi = slots.length > 1 && !!(count && prev && next);

  var DWELL = 15000;

  /*  One source of truth for the dwell: the bar's animation reads --dwell,
      so it cannot drift out of step with the interval below.              */
  if (cycle) cycle.style.setProperty('--dwell', (DWELL / 1000) + 's');
  var still = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var i = 0, timer = null, autoStopped = still;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function play(slot) {
    if (still) return;
    var v = slot.querySelector('video');
    if (!v) return;
    if (v.getAttribute('preload') === 'none') v.setAttribute('preload', 'auto');
    var p = v.play();
    /*  A browser is allowed to refuse autoplay. That is not an error worth
        surfacing — the poster simply stays, which is a valid hero.        */
    if (p && p.catch) p.catch(function () {});
  }

  function pause(slot) {
    var v = slot.querySelector('video');
    if (v) { try { v.pause(); } catch (e) {} }
  }

  function show(n) {
    i = (n + slots.length) % slots.length;
    slots.forEach(function (s, idx) {
      if (idx === i) { s.setAttribute('data-current', ''); play(s); }
      else           { s.removeAttribute('data-current'); pause(s); }
    });
    var cur = slots[i];
    if (count) count.textContent = pad(i + 1) + ' — ' + pad(slots.length);
    label.textContent = cur.getAttribute('data-craft') + ' · ' + cur.getAttribute('data-title');

    /*  Warm the slot that is about to be needed, so it is not loading from
        cold at the moment it becomes visible.                             */
    if (!still) {
      var nv = slots[(i + 1) % slots.length].querySelector('video');
      if (nv && nv.getAttribute('preload') === 'none') nv.setAttribute('preload', 'metadata');
    }

    restartBar();
  }

  /*  Restart the countdown bar from zero. Clearing the animation and reading
      offsetWidth forces the reflow that makes it play again — without that
      the browser sees the same animation and leaves it where it was.      */
  function restartBar() {
    if (!cycle || !bar) return;
    if (autoStopped || still) { cycle.removeAttribute('data-running'); return; }
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
    cycle.setAttribute('data-running', '');
  }

  function stopBar() {
    if (cycle) cycle.removeAttribute('data-running');
  }

  function startAuto() {
    if (!multi) { stopBar(); return; }
    if (autoStopped) { stopBar(); return; }
    clearInterval(timer);
    timer = setInterval(function () { show(i + 1); }, DWELL);
    restartBar();
  }

  /*  One deliberate decision: a manual step ends the auto-advance for the
      rest of the visit rather than merely deferring it. A carousel that
      resumes moving under someone who took control is the thing that makes
      carousels annoying.                                                   */
  function step(delta) {
    autoStopped = true;
    clearInterval(timer);
    timer = null;
    stopBar();
    show(i + delta);
  }

  if (multi) {
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
  }

  document.addEventListener('keydown', function (e) {
    if (!multi) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowLeft')  { step(-1); }
    if (e.key === 'ArrowRight') { step(1); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(timer); timer = null;
      stopBar();
      slots.forEach(pause);
    } else {
      play(slots[i]);
      startAuto();
    }
  });

  /*  Fade a loop in only once it can genuinely play, never on load alone. */
  slots.forEach(function (s) {
    var v = s.querySelector('video');
    if (!v) return;
    v.addEventListener('canplay', function () { v.setAttribute('data-ready', ''); });
    v.addEventListener('error',   function () { v.removeAttribute('data-ready'); });
  });

  show(0);
  startAuto();
})();
