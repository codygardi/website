/* ====================================== */
/*         SKILLS HORIZONTAL WHEEL        */
/* ====================================== */
(function(){
  'use strict';

  /* ====================================== */
  /*               DATA MODEL               */
/* ====================================== */
  const SKILL_GROUPS = {
    all: [
      // Languages
      'Python', 'SQL', 'CSS', 'HTML',
      // Technical
      'Networking (VLANs, VPN)', 'Azure (RBAC, KV, Backup)', 'SIEM (Wazuh)',
      'Linux & Windows Admin', 'Docker', 'Git/GitHub',
      // Personal
      'Analytical', 'Detail-oriented', 'Proactive', 'Resilient', 'Curious',
      // Interpersonal
      'Cross-team collaboration', 'Stakeholder communication',
      'Customer empathy', 'Mentorship', 'Process leadership'
    ],
    languages: [
      'Python', 'SQL', 'CSS', 'HTML'
    ],
    technical: [
      'Networking (VLANs, VPN)',
      'Azure (RBAC, KV, Backup)',
      'SIEM (Wazuh)',
      'Linux & Windows Admin',
      'Docker',
      'Git/GitHub'
    ],
    personal: [
      'Analytical',
      'Detail-oriented',
      'Proactive',
      'Resilient',
      'Curious'
    ],
    interpersonal: [
      'Cross-team collaboration',
      'Stakeholder communication',
      'Customer empathy',
      'Mentorship',
      'Process leadership'
    ]
  };

  const ready = (fn) =>
    (document.readyState === 'loading')
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn();

  ready(() => {
    document.querySelectorAll('.skills').forEach(initSkillsSection);
  });

  /* ====================================== */
  /*           SECTION INITIALISATION       */
/* ====================================== */
  function initSkillsSection(root){
    const track   = root.querySelector('.skills-track');
    const buttons = Array.from(root.querySelectorAll('.skills-filter'));
    const wrapper = root.querySelector('.skills-wheel-wrapper');
    if (!track || !buttons.length || !wrapper) return;

    const ignoreReduce    = root.dataset.ignoreReduce === '1';
    const osPrefersReduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReduce   = !ignoreReduce && osPrefersReduce;

    const baseSpeed = prefersReduce ? 0 : toFloat(root.dataset.baseSpeed, 40);   // px/s
    const fastSpeed = prefersReduce ? 0 : toFloat(root.dataset.fastSpeed, 260);  // px/s

    const MAX_REPEATS = 8;

    let currentGroup = 'all';
    let currentSpeed = baseSpeed;
    let targetSpeed  = baseSpeed;
    let offset       = 0;
    let segmentWidth = 0;   // width of ONE segment
    let lastTime     = null;

    setGroup(currentGroup);

    // Filter buttons
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        if (!group || group === currentGroup) return;

        buttons.forEach(b => b.classList.toggle('is-active', b === btn));

        if (!prefersReduce) {
          targetSpeed = fastSpeed;
        }
        root.classList.add('skills--transitioning');

        const SWITCH_DELAY = prefersReduce ? 0 : 260;
        setTimeout(() => {
          setGroup(group);
          currentGroup = group;

          root.classList.remove('skills--transitioning');
          if (!prefersReduce) {
            targetSpeed = baseSpeed;
          }
        }, SWITCH_DELAY);
      });
    });

    // Start animation
    if (!prefersReduce && baseSpeed > 0) {
      requestAnimationFrame(tick);
    } else {
      track.style.transform = 'translateX(0px)';
    }

    window.addEventListener('resize', () => {
      recalcSegmentWidth();
    });

    /* ====================================== */
    /*            RENDERING / GROUPS          */
/* ====================================== */
    function setGroup(group){
      const skills = SKILL_GROUPS[group] || [];
      track.innerHTML = '';
      if (!skills.length) return;

      // Build a single segment
      const segment = document.createElement('div');
      segment.className = 'skills-segment';

      skills.forEach(label => {
        const chip = document.createElement('div');
        chip.className = 'skills-item';
        chip.textContent = label;
        segment.appendChild(chip);
      });

      // Add spacer so end and beginning don't visually merge
      const spacer = document.createElement('div');
      spacer.className = 'skills-spacer';
      segment.appendChild(spacer);

      // Append enough copies to cover at least ~2x viewport width
      track.appendChild(segment);
      let repeats = 1;
      const minWidth = wrapper.clientWidth * 2;
      while (repeats < MAX_REPEATS && track.scrollWidth < minWidth) {
        track.appendChild(segment.cloneNode(true));
        repeats++;
      }

      offset = 0;
      track.style.transform = 'translateX(0px)';
      recalcSegmentWidth();
    }

    function recalcSegmentWidth(){
      const firstSeg = track.querySelector('.skills-segment');
      segmentWidth = firstSeg ? firstSeg.offsetWidth : 0;
    }

    /* ====================================== */
    /*              ANIMATION LOOP            */
/* ====================================== */
    function tick(timestamp){
      if (lastTime == null) {
        lastTime = timestamp;
        requestAnimationFrame(tick);
        return;
      }
      const dt = (timestamp - lastTime) / 1000;  // seconds
      lastTime = timestamp;

      // Ease towards target speed
      currentSpeed += (targetSpeed - currentSpeed) * 0.12;

      // Move left
      offset -= currentSpeed * dt;

      // Wrap by exactly one segment width for seamless loop
      if (segmentWidth > 0 && offset <= -segmentWidth) {
        offset += segmentWidth;
      }

      track.style.transform = `translateX(${offset}px)`;
      requestAnimationFrame(tick);
    }
  }

  /* ====================================== */
  /*                 HELPERS                */
/* ====================================== */
  function toFloat(v, d){
    const x = parseFloat(v);
    return Number.isFinite(x) ? x : d;
  }
})();
