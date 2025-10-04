/* Education filter: left-to-right domino fade-in (robust) */
(function () {
  'use strict';

  function ready(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, {once:true});
    } else { fn(); }
  }

  ready(function(){
    var roots = Array.prototype.slice.call(document.querySelectorAll('.edu'));
    if (!roots.length) return;
    roots.forEach(init);
  });

  function init(root){
    var grid  = root.querySelector('.edu-grid');
    var btns  = Array.prototype.slice.call(root.querySelectorAll('.edu-filter-btn'));
    var items = Array.prototype.slice.call(grid.querySelectorAll('.edu-item'));

    // Timing (overridable via data attributes)
    var STEP_DELAY = toInt(root.dataset.step, 180);
    var FADE_MS    = toInt(root.dataset.fade, 600);
    var ignoreReduce = truthy(root.dataset.ignoreReduce);

    // Respect OS reduce motion unless overridden
    var reduce = (!ignoreReduce) &&
                 window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { STEP_DELAY = 0; FADE_MS = 0; }

    var timers = [];

    function toInt(v, d){ v = parseInt(v,10); return isFinite(v)? v : d; }
    function truthy(v){ return v === '1' || v === 'true' || v === 'yes'; }

    function clearTimers(){
      while (timers.length) clearTimeout(timers.pop());
    }

    function setActive(btn){
      btns.forEach(function(b){
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    function matchFilter(el, filter){
      if (filter === 'all') return true;
      return el.classList.contains('cat-' + filter);
    }

    function hideAll(){
      items.forEach(function(el){
        el.classList.add('is-hidden');     // out of layout
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(10px)';
        el.style.willChange = 'opacity, transform';
      });
      void grid.offsetWidth; // reflow
    }

    function sortLeftToRight(els){
      // After they are unhidden (but still opacity 0), sort by row (top) then column (left)
      return els.slice().sort(function(a,b){
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        var rowA = Math.round(ra.top);
        var rowB = Math.round(rb.top);
        if (rowA !== rowB) return rowA - rowB;
        return ra.left - rb.left;
      });
    }

    function applyFilter(filter){
      clearTimers();
      hideAll();

      // Unhide matches invisibly so we can measure positions
      var matches = items.filter(function(el){ return matchFilter(el, filter); });
      matches.forEach(function(el){
        el.classList.remove('is-hidden');
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(10px)';
      });

      // Reflow before measuring/sorting
      void grid.offsetWidth;

      // Sort in visual L->R order and stagger
      var ordered = sortLeftToRight(matches);

      ordered.forEach(function(el, idx){
        var t = setTimeout(function(){
          el.style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
          requestAnimationFrame(function(){
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0)';
          });
          var end = function(e){
            if (e.propertyName !== 'opacity') return;
            el.style.transition = '';
            el.style.willChange = '';
            el.removeEventListener('transitionend', end);
          };
          el.addEventListener('transitionend', end);
        }, idx * STEP_DELAY);
        timers.push(t);
      });
    }

    // Bind buttons
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
        setActive(btn);
        applyFilter(filter);
      }, {passive:true});
    });

    // Initial render
    var initial = root.querySelector('.edu-filter-btn.is-active');
    applyFilter(initial ? (initial.getAttribute('data-filter') || 'all') : 'all');
  }
})();
