/* PROJECTS FILTER — Arrow-based, same animation as Education */
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
    var roots = Array.prototype.slice.call(document.querySelectorAll('.projects'));
    if (!roots.length) return;
    roots.forEach(initProjects);
  });

  function initProjects(root) {
    var grid      = root.querySelector('.proj-grid');
    var items     = Array.prototype.slice.call(grid.querySelectorAll('.proj-item'));
    var main      = root.closest('#main');
    var prevBtn   = root.querySelector('.proj-filter-prev');
    var nextBtn   = root.querySelector('.proj-filter-next');
    var labelEl   = root.querySelector('.proj-filter-label');

    if (!grid || !items.length || !prevBtn || !nextBtn || !labelEl) return;

    var STEP_DELAY   = toInt(root.dataset.step, 180);
    var FADE_MS      = toInt(root.dataset.fade, 600);
    var ignoreReduce = truthy(root.dataset.ignoreReduce);

    var reduce = (!ignoreReduce) &&
                 window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) { STEP_DELAY = 0; FADE_MS = 0; }

    var timers = [];

    function toInt(v, d) { v = parseInt(v, 10); return isFinite(v) ? v : d; }
    function truthy(v)   { return v === '1' || v === 'true' || v === 'yes'; }

    function clearTimers() {
      while (timers.length) clearTimeout(timers.pop());
    }

    function getType(el) {
      var tag = el.querySelector('.proj-tag');
      if (!tag) return '';
      return (tag.textContent || '').trim().toLowerCase();
    }

    // Build list of filters from proj-tag values
    var tagSet = new Set();
    items.forEach(function (el) {
      var t = getType(el);
      if (t) tagSet.add(t);
    });

    var filters = ['all'].concat(Array.from(tagSet)); // e.g. ["all","web","ml","ai","automation"]
    var currentIndex = 0;

    function formatLabel(filter) {
      if (filter === 'all') return 'All';
      return filter.charAt(0).toUpperCase() + filter.slice(1);
    }

    function updateLabel() {
      var filter = filters[currentIndex];
      labelEl.dataset.filter = filter;
      labelEl.textContent = formatLabel(filter);
    }

    function matchFilter(el, filter) {
      if (filter === 'all') return true;
      var type = getType(el);
      return type && type.indexOf(filter) !== -1;
    }

    function hideAll() {
      items.forEach(function (el) {
        el.classList.add('is-hidden');
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(10px)';
      });
      void grid.offsetWidth;
    }

    function sortLeftToRight(els) {
      return els.slice().sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        var rowA = Math.round(ra.top), rowB = Math.round(rb.top);
        if (rowA !== rowB) return rowA - rowB;
        return ra.left - rb.left;
      });
    }

    function animateMain(before, after) {
      if (!main || before == null || after == null || before === after) return;
      main.style.minHeight = before + 'px';
      main.style.maxHeight = before + 'px';
      requestAnimationFrame(function () {
        main.style.minHeight = after + 'px';
        main.style.maxHeight = after + 'px';
      });
      var clear = function (e) {
        if (e.propertyName !== 'max-height' && e.propertyName !== 'min-height') return;
        main.style.minHeight = '';
        main.style.maxHeight = '';
        main.removeEventListener('transitionend', clear);
      };
      main.addEventListener('transitionend', clear);
    }

    function applyFilter(filter) {
      clearTimers();

      var before = main ? main.offsetHeight : null;

      hideAll();

      var matches = items.filter(function (el) { return matchFilter(el, filter); });
      matches.forEach(function (el) {
        el.classList.remove('is-hidden');
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(10px)';
      });

      void grid.offsetWidth;

      var after = main ? main.offsetHeight : null;
      animateMain(before, after);

      var ordered = sortLeftToRight(matches);

      ordered.forEach(function (el, idx) {
        var t = setTimeout(function () {
          el.style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
          requestAnimationFrame(function () {
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0)';
          });
        }, idx * STEP_DELAY);
        timers.push(t);
      });
    }

    function goTo(delta) {
      currentIndex = (currentIndex + delta + filters.length) % filters.length;
      updateLabel();
      applyFilter(filters[currentIndex]);
    }

    prevBtn.addEventListener('click', function () {
      goTo(-1);
    }, { passive: true });

    nextBtn.addEventListener('click', function () {
      goTo(1);
    }, { passive: true });

    // Initial render: default to "all"
    currentIndex = 0;
    updateLabel();
    applyFilter(filters[currentIndex]);
  }
})();

