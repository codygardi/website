---
hide:
  - toc
  - title
---

<div class="ft-app-shell">
  <section class="ft-topbar">
    <div class="ft-tabs" id="ft-main-tabs" aria-label="Main tabs"></div>
    <div class="ft-meta-strip" id="ft-meta-strip"></div>
  </section>

  <section id="ft-daily-pane" class="ft-pane">
    <div class="ft-daily-layout">
      <div class="ft-visual-panel">
        <h2>Stay on the routine. Mark the day. Keep going.</h2>
        <p class="ft-visual-copy">
          Daily view is the only place where a workout can be marked done. The routine stays fixed so you can focus on
          showing up and keeping the streak moving.
        </p>
      </div>

      <div class="ft-daily-card" id="ft-daily-card" aria-live="polite"></div>
    </div>
  </section>

  <section id="ft-tracking-pane" class="ft-pane" hidden>
    <div class="ft-tracking-shell">
      <div class="ft-tracking-topbar">
        <div>
          <p class="ft-card-kicker">Tracking</p>
          <h3 id="ft-month-title">Month</h3>
        </div>
        <div class="ft-month-nav">
          <button type="button" class="ft-nav-button" id="ft-prev-month">Previous Month</button>
          <button type="button" class="ft-nav-button" id="ft-this-month">This Month</button>
          <button type="button" class="ft-nav-button" id="ft-next-month">Next Month</button>
        </div>
      </div>

      <div id="ft-monthly-tracking" class="ft-tracking-view" aria-live="polite"></div>
    </div>
  </section>

  <noscript>
    <p>This tracker needs JavaScript enabled so daily completion and month-to-month tracking can update in the browser.</p>
  </noscript>
</div>
