/* PROJECTS FILTER — Same Animation as Education */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once:true });
    } else { fn(); }
  }

  ready(function () {
    var roots = Array.prototype.slice.call(document.querySelectorAll('.projects'));
    if (!roots.length) return;
    roots.forEach(initProjects);
  });

  function initProjects(root) {
    var grid  = root.querySelector('.proj-grid');
    var btns  = Array.prototype.slice.call(root.querySelectorAll('.proj-filter-btn'));
    var items = Array.prototype.slice.call(grid.querySelectorAll('.proj-item'));
    var main  = root.closest('#main');

    if (!grid || !btns.length || !items.length) return;

    var STEP_DELAY = toInt(root.dataset.step, 180);
    var FADE_MS    = toInt(root.dataset.fade, 600);
    var ignoreReduce = truthy(root.dataset.ignoreReduce);

    var reduce = (!ignoreReduce) &&
                 window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) { STEP_DELAY = 0; FADE_MS = 0; }

    var timers = [];

    function toInt(v,d){ v=parseInt(v,10); return isFinite(v)?v:d; }
    function truthy(v){ return v==='1'||v==='true'||v==='yes'; }

    function clearTimers(){
      while(timers.length) clearTimeout(timers.pop());
    }

    function setActive(btn){
      btns.forEach(function(b){
        var on=b===btn;
        b.classList.toggle('is-active',on);
        b.setAttribute('aria-selected',on?'true':'false');
      });
    }

    function getType(el){
      var tag = el.querySelector('.proj-tag');
      if (!tag) return '';
      return (tag.textContent||'').trim().toLowerCase();
    }

    function matchFilter(el,filter){
      if (filter==='all') return true;
      var type=getType(el);
      return type.includes(filter);
    }

    function hideAll(){
      items.forEach(function(el){
        el.classList.add('is-hidden');
        el.style.transition='none';
        el.style.opacity='0';
        el.style.transform='translateY(10px)';
      });
      void grid.offsetWidth;
    }

    function sortLeftToRight(els){
      return els.slice().sort(function(a,b){
        var ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
        var rowA=Math.round(ra.top), rowB=Math.round(rb.top);
        if (rowA!==rowB) return rowA-rowB;
        return ra.left-rb.left;
      });
    }

    function animateMain(before,after){
      if (!main || before==null || after==null || before===after) return;
      main.style.minHeight=before+'px';
      main.style.maxHeight=before+'px';
      requestAnimationFrame(function(){
        main.style.minHeight=after+'px';
        main.style.maxHeight=after+'px';
      });
      var clear=function(e){
        if (e.propertyName!=='max-height' && e.propertyName!=='min-height') return;
        main.style.minHeight='';
        main.style.maxHeight='';
        main.removeEventListener('transitionend',clear);
      };
      main.addEventListener('transitionend',clear);
    }

    function applyFilter(filter){
      clearTimers();

      var before=main?main.offsetHeight:null;

      hideAll();

      var matches=items.filter(function(el){ return matchFilter(el,filter); });
      matches.forEach(function(el){
        el.classList.remove('is-hidden');
        el.style.transition='none';
        el.style.opacity='0';
        el.style.transform='translateY(10px)';
      });

      void grid.offsetWidth;

      var after=main?main.offsetHeight:null;
      animateMain(before,after);

      var ordered=sortLeftToRight(matches);

      ordered.forEach(function(el,idx){
        var t=setTimeout(function(){
          el.style.transition='opacity '+FADE_MS+'ms ease, transform '+FADE_MS+'ms ease';
          requestAnimationFrame(function(){
            el.style.opacity='1';
            el.style.transform='translateY(0)';
          });
        }, idx*STEP_DELAY);
        timers.push(t);
      });
    }

    btns.forEach(function(btn){
      btn.addEventListener('click',function(){
        var filter = (btn.dataset.filter||'all').toLowerCase();
        setActive(btn);
        applyFilter(filter);
      },{passive:true});
    });

    var initial=root.querySelector('.proj-filter-btn.is-active');
    applyFilter(initial?(initial.dataset.filter||'all'):'all');
  }
})();
