const FITNESS_TRACKER_STORAGE_KEY = "fitness-tracker-monthly-v4";

const DAY_TEMPLATE = [
  {
    shortLabel: "Mon",
    fullLabel: "Monday",
    title: "Feed the Beast",
    goal: "Core, Legs",
    accent: "legs",
  },
  {
    shortLabel: "Tue",
    fullLabel: "Tuesday",
    title: "Push & Pull",
    goal: "Chest, shoulders, back, triceps && back, biceps",
    accent: "push",
  },
  {
    shortLabel: "Wed",
    fullLabel: "Wednesday",
    title: "Feed the Beast",
    goal: "Core, Legs",
    accent: "legs",
  },
  {
    shortLabel: "Thu",
    fullLabel: "Thursday",
    title: "Push & Pull",
    goal: "Chest, shoulders, back, triceps && back, biceps",
    accent: "push",
  },
  {
    shortLabel: "Fri",
    fullLabel: "Friday",
    title: "Feed the Beast",
    goal: "Core, Legs",
    accent: "legs",
  },
  {
    shortLabel: "Sat",
    fullLabel: "Saturday",
    title: "Rest Day",
    goal: "Deep Stretch & Meditate",
    accent: "recovery",
  },
  {
    shortLabel: "Sun",
    fullLabel: "Sunday",
    title: "Push & Pull",
    goal: "Chest, shoulders, back, triceps && back, biceps",
    accent: "push",
  },
];

function normalizeDate(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function keyToDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return normalizeDate(copy);
}

function getTemplateForDate(date) {
  const mondayBasedIndex = (date.getDay() + 6) % 7;
  return DAY_TEMPLATE[mondayBasedIndex];
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function createDefaultState() {
  const today = normalizeDate(new Date());
  return {
    activeTab: "daily",
    selectedDateKey: dateToKey(today),
    trackingMonthKey: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    completions: {},
  };
}

function loadState() {
  try {
    const rawValue = window.localStorage.getItem(FITNESS_TRACKER_STORAGE_KEY);
    if (!rawValue) {
      return createDefaultState();
    }

    const parsed = JSON.parse(rawValue);
    const fallback = createDefaultState();
    return {
      activeTab: parsed.activeTab === "tracking" ? "tracking" : "daily",
      selectedDateKey: typeof parsed.selectedDateKey === "string" ? parsed.selectedDateKey : fallback.selectedDateKey,
      trackingMonthKey: typeof parsed.trackingMonthKey === "string" ? parsed.trackingMonthKey : fallback.trackingMonthKey,
      completions: parsed.completions && typeof parsed.completions === "object" ? parsed.completions : {},
    };
  } catch {
    return createDefaultState();
  }
}

function saveState(state) {
  window.localStorage.setItem(FITNESS_TRACKER_STORAGE_KEY, JSON.stringify(state));
}

function isCompleted(state, dateKey) {
  return state.completions[dateKey] === true;
}

function getSelectedDate(state) {
  return normalizeDate(keyToDate(state.selectedDateKey));
}

function getTrackingMonthDate(state) {
  const [year, month] = state.trackingMonthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function renderTabs(state) {
  const container = document.getElementById("ft-main-tabs");
  if (!container) {
    return;
  }

  container.innerHTML = `
    <button type="button" class="ft-tab ${state.activeTab === "daily" ? "is-active" : ""}" data-role="main-tab" data-tab="daily">Daily</button>
    <button type="button" class="ft-tab ${state.activeTab === "tracking" ? "is-active" : ""}" data-role="main-tab" data-tab="tracking">Tracking</button>
  `;
}

function renderMetaStrip(state) {
  const container = document.getElementById("ft-meta-strip");
  if (!container) {
    return;
  }

  const selectedDate = getSelectedDate(state);
  const template = getTemplateForDate(selectedDate);
  container.innerHTML = `
    <div class="ft-meta-pill">
      <span>Date</span>
      <strong>${formatShortDate(selectedDate)}</strong>
    </div>
    <div class="ft-meta-pill">
      <span>Focus</span>
      <strong>${template.title}</strong>
    </div>
    <div class="ft-meta-pill">
      <span>Status</span>
      <strong>${isCompleted(state, state.selectedDateKey) ? "Completed" : "Open"}</strong>
    </div>
  `;
}

function renderDailyCard(state) {
  const container = document.getElementById("ft-daily-card");
  if (!container) {
    return;
  }

  const selectedDate = getSelectedDate(state);
  const template = getTemplateForDate(selectedDate);
  const complete = isCompleted(state, state.selectedDateKey);

  container.innerHTML = `
    <div class="ft-daily-header">
      <div>
        <p class="ft-card-kicker">Daily View</p>
        <h3>${formatLongDate(selectedDate)}</h3>
      </div>
      <span class="ft-day-badge ft-day-badge--${template.accent}">${template.title}</span>
    </div>

    <div class="ft-daily-panel">
      <span class="ft-panel-label">Workout for the day</span>
      <strong>${template.title}</strong>
      <p>${template.goal}</p>
    </div>

    <label class="ft-done-box" for="ft-done-${state.selectedDateKey}">
      <input type="checkbox" id="ft-done-${state.selectedDateKey}" data-role="daily-done" data-date="${state.selectedDateKey}" ${complete ? "checked" : ""}>
      <span class="ft-done-indicator" aria-hidden="true"></span>
      <span class="ft-done-text">Done</span>
    </label>

    <div class="ft-daily-nav">
      <button type="button" class="ft-nav-button" data-role="day-nav" data-direction="-1">Previous Day</button>
      <button type="button" class="ft-nav-button" data-role="day-today">Today</button>
      <button type="button" class="ft-nav-button" data-role="day-nav" data-direction="1">Next Day</button>
    </div>
  `;
}

function buildMonthGrid(state) {
  const monthDate = getTrackingMonthDate(state);
  const firstDay = normalizeDate(monthDate);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -startOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const date = addDays(gridStart, index);
    const inCurrentMonth = date.getMonth() === monthDate.getMonth();
    const template = getTemplateForDate(date);
    return {
      date,
      dateKey: dateToKey(date),
      inCurrentMonth,
      template,
    };
  });
}

function renderTrackingMonth(state) {
  const monthTitle = document.getElementById("ft-month-title");
  const container = document.getElementById("ft-monthly-tracking");
  if (!monthTitle || !container) {
    return;
  }

  const monthDate = getTrackingMonthDate(state);
  monthTitle.textContent = formatMonthTitle(monthDate);

  container.innerHTML = `
    <section class="ft-tracking-card">
      <div class="ft-month-headings">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
      <div class="ft-month-grid">
        ${buildMonthGrid(state)
          .map((entry) => `
            <article class="ft-month-cell ft-month-cell--${entry.template.accent} ${entry.inCurrentMonth ? "" : "is-muted"}">
              <span class="ft-month-date">${entry.inCurrentMonth ? entry.date.getDate() : ""}</span>
              <p>${entry.inCurrentMonth && isCompleted(state, entry.dateKey) ? "Completed" : ""}</p>
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function render(state) {
  renderTabs(state);
  renderMetaStrip(state);
  renderDailyCard(state);
  renderTrackingMonth(state);

  const dailyPane = document.getElementById("ft-daily-pane");
  const trackingPane = document.getElementById("ft-tracking-pane");
  if (dailyPane && trackingPane) {
    dailyPane.hidden = state.activeTab !== "daily";
    trackingPane.hidden = state.activeTab !== "tracking";
  }

  saveState(state);
}

function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

function attachEvents(state) {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-role], #ft-prev-month, #ft-next-month, #ft-this-month") : null;
    if (!target) {
      return;
    }

    if (target.id === "ft-prev-month") {
      state.trackingMonthKey = shiftMonth(state.trackingMonthKey, -1);
      state.activeTab = "tracking";
      render(state);
      return;
    }

    if (target.id === "ft-next-month") {
      state.trackingMonthKey = shiftMonth(state.trackingMonthKey, 1);
      state.activeTab = "tracking";
      render(state);
      return;
    }

    if (target.id === "ft-this-month") {
      const today = normalizeDate(new Date());
      state.trackingMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      state.activeTab = "tracking";
      render(state);
      return;
    }

    const role = target.dataset.role;
    if (!role) {
      return;
    }

    if (role === "main-tab") {
      state.activeTab = target.dataset.tab === "tracking" ? "tracking" : "daily";
      render(state);
      return;
    }

    if (role === "day-nav") {
      const direction = Number.parseInt(target.dataset.direction || "0", 10);
      state.selectedDateKey = dateToKey(addDays(getSelectedDate(state), direction));
      render(state);
      return;
    }

    if (role === "day-today") {
      const today = normalizeDate(new Date());
      state.selectedDateKey = dateToKey(today);
      render(state);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.role !== "daily-done") {
      return;
    }

    const dateKey = target.dataset.date;
    if (!dateKey) {
      return;
    }

    state.completions[dateKey] = target.checked;
    render(state);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("ft-main-tabs");
  if (!appRoot) {
    return;
  }

  const state = loadState();
  attachEvents(state);
  render(state);
});
