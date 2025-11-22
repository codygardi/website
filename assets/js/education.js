/* Education filter: left-to-right domino fade-in (using edu-tag + smooth #main) */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    var roots = Array.prototype.slice.call(document.querySelectorAll('.edu'));
    if (!roots.length) return;
    roots.forEach(initEdu);
  });

  function initEdu(root) {
    var grid  = root.querySelector('.edu-grid');
    var btns  = Array.prototype.slice.call(root.querySelectorAll('.edu-filter-btn'));
    var items = Array.prototype.slice.call(grid.querySelectorAll('.edu-item'));
    var main  = root.closest('#main');   // <== main container with border

    if (!grid || !btns.length || !items.length) return;

    // Timing (overridable via data attributes on .edu)
    var STEP_DELAY   = toInt(root.dataset.step, 180); // ms between tiles
    var FADE_MS      = toInt(root.dataset.fade, 600); // fade duration
    var ignoreReduce = truthy(root.dataset.ignoreReduce);

    // Respect OS reduce motion unless overridden
    var reduce = (!ignoreReduce) &&
                 window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      STEP_DELAY = 0;
      FADE_MS    = 0;
    }

    var timers = [];

    function toInt(v, d) {
      v = parseInt(v, 10);
      return isFinite(v) ? v : d;
    }

    function truthy(v) {
      return v === '1' || v === 'true' || v === 'yes';
    }

    function clearTimers() {
      while (timers.length) clearTimeout(timers.pop());
    }

    function setActive(btn) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    // Read the type from the .edu-tag text ("degree" / "certificate")
    function getType(el) {
      var tag = el.querySelector('.edu-tag');
      if (!tag) return '';
      return (tag.textContent || '').trim().toLowerCase();
    }

    function matchFilter(el, filter) {
      if (filter === 'all') return true;

      var type = getType(el); // e.g. "degree", "certificate"
      if (!type) return false;

      if (filter === 'degree')       return type.indexOf('degree') !== -1;
      if (filter === 'certificate')  return type.indexOf('certificate') !== -1;

      return false;
    }

    function hideAll() {
      items.forEach(function (el) {
        el.classList.add('is-hidden');     // out of layout
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(10px)';
        el.style.willChange = 'opacity, transform';
      });
      void grid.offsetWidth; // reflow
    }

    function sortLeftToRight(els) {
      // After they are unhidden (opacity 0), sort by row (top) then column (left)
      return els.slice().sort(function (a, b) {
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        var rowA = Math.round(ra.top);
        var rowB = Math.round(rb.top);
        if (rowA !== rowB) return rowA - rowB;
        return ra.left - rb.left;
      });
    }

    // Animate #main min/max-height so its border grows/shrinks smoothly
    function animateMainHeight(before, after) {
      if (!main || before == null || after == null || before === after) return;

      main.style.minHeight = before + 'px';
      main.style.maxHeight = before + 'px';

      requestAnimationFrame(function () {
        main.style.minHeight = after + 'px';
        main.style.maxHeight = after + 'px';
      });

      var clearMain = function (e) {
        if (e.propertyName !== 'max-height' && e.propertyName !== 'min-height') return;
        main.style.minHeight = '';
        main.style.maxHeight = '';
        main.removeEventListener('transitionend', clearMain);
      };
      main.addEventListener('transitionend', clearMain);
    }

    function applyFilter(filter) {
      clearTimers();

      // measure current #main height before changes
      var beforeH = main ? main.offsetHeight : null;

      hideAll();

      // Unhide matches invisibly so we can measure positions
      var matches = items.filter(function (el) { return matchFilter(el, filter); });
      matches.forEach(function (el) {
        el.classList.remove('is-hidden');
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(10px)';
      });

      // Reflow before measuring/sorting
      void grid.offsetWidth;

      // measure new #main height after layout
      var afterH = main ? main.offsetHeight : null;
      animateMainHeight(beforeH, afterH);

      // Sort in visual L->R order and stagger
      var ordered = sortLeftToRight(matches);

      ordered.forEach(function (el, idx) {
        var t = setTimeout(function () {
          el.style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
          requestAnimationFrame(function () {
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0)';
          });
          var end = function (e) {
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
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
        setActive(btn);
        applyFilter(filter);
      }, { passive: true });
    });

    // Initial render: default to "All"
    var initial = root.querySelector('.edu-filter-btn.is-active');
    var initialFilter = initial ? (initial.getAttribute('data-filter') || 'all') : 'all';
    applyFilter(initialFilter.toLowerCase());
  }

})();
