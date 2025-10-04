/* Skills Wheel — rotates each column every N seconds; shows max 3 items.
   Respects prefers-reduced-motion unless data-ignore-reduce="1". */
(function(){
  'use strict';

  const ready = (fn) =>
    (document.readyState === 'loading')
      ? document.addEventListener('DOMContentLoaded', fn, { once:true })
      : fn();

  ready(() => {
    document.querySelectorAll('.skills').forEach(root => initRoot(root));
  });

  function initRoot(root){
    // Per-section config (with safe parsing)
    const ignoreReduce = isTrue(root.dataset.ignoreReduce);
    const reduce      = (!ignoreReduce) &&
                        window.matchMedia &&
                        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const INTERVAL_MS = reduce ? 0 : toInt(root.dataset.interval, 4000);
    const FADE_MS     = reduce ? 0 : toInt(root.dataset.fade, 600);
    const VISIBLE     = 3;

    root.classList.add('js-ready');

    const wheels = Array.from(root.querySelectorAll('[data-wheel] .wheel'));
    if (!wheels.length) return;

    wheels.forEach(wheel => setupWheel(wheel, { INTERVAL_MS, FADE_MS, VISIBLE }));
  }

  function setupWheel(wheel, cfg){
    const { INTERVAL_MS, FADE_MS, VISIBLE } = cfg;
    const items = Array.from(wheel.querySelectorAll('.item'));
    if (!items.length) return;

    let head = 0;   // index of the “newest” item at the top
    layout();

    // Rotate
    if (INTERVAL_MS > 0) {
      const timer = setInterval(tick, INTERVAL_MS);

      // Stop the timer if the element gets removed
      const obs = new MutationObserver(() => {
        if (!document.body.contains(wheel)) {
          clearInterval(timer); obs.disconnect();
        }
      });
      obs.observe(document.body, { childList:true, subtree:true });
    }

    function tick(){ head = (head + 1) % items.length; layout(); }

    function layout(){
      const n = items.length;
      items.forEach((el, i) => {
        const rel = (i - head + n) % n; // 0..n-1 from head downward
        el.style.transition =
          `transform ${FADE_MS}ms ease, opacity ${FADE_MS}ms ease,` +
          ` box-shadow ${FADE_MS}ms ease, border-color ${FADE_MS}ms ease`;
        el.className = el.className
          .replace(/\bpos-0\b|\bpos-1\b|\bpos-2\b|\bhid\b/g, '') // strip old
          .trim() + ' ' + classFor(rel, VISIBLE);
      });
    }
  }

  // Helpers
  function toInt(v, d){ const x = parseInt(v, 10); return Number.isFinite(x) ? x : d; }
  function isTrue(v){ return v === '1' || v === 'true' || v === 'yes'; }
  function classFor(rel, visible){
    if (rel === 0) return 'pos-0';
    if (rel === 1 && visible > 1) return 'pos-1';
    if (rel === 2 && visible > 2) return 'pos-2';
    return 'hid';
  }
})();
