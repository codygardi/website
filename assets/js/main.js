const THEME_STORAGE_KEY = "theme-preference";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";
const THEME_SHUTTER_COLUMN_COUNT = 5;
const THEME_SHUTTER_TOTAL_DURATION_MS = 1000;
const THEME_SHUTTER_STAGGER_MS = 30;
const THEME_SHUTTER_PANEL_DURATION_MS = 330;
const THEME_SHUTTER_COVER_DURATION_MS =
  THEME_SHUTTER_PANEL_DURATION_MS + (THEME_SHUTTER_STAGGER_MS * (THEME_SHUTTER_COLUMN_COUNT - 1));
const THEME_SHUTTER_REVEAL_DURATION_MS = THEME_SHUTTER_COVER_DURATION_MS;
const THEME_SHUTTER_HOLD_DURATION_MS =
  THEME_SHUTTER_TOTAL_DURATION_MS - THEME_SHUTTER_COVER_DURATION_MS - THEME_SHUTTER_REVEAL_DURATION_MS;
const NAV_PHASE_DURATION_MS = 280;

function waitForDuration(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function commitStyleChange(element) {
  void element.offsetHeight;
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("js-ready");

  const themeShutter = initializeThemeShutterTransition();
  initializeThemeToggle(themeShutter);
  initializeSectionPhaseTransition();
  initializeScrollReveal();
  initializeProjectCarousel();
});

function initializeThemeShutterTransition() {
  const root = document.documentElement;
  const body = document.body;
  const existingOverlay = document.querySelector("[data-page-transition]");
  const overlay = existingOverlay || document.createElement("div");
  const fragment = document.createDocumentFragment();
  const lockedElements = [];
  const blockedScrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"]);

  overlay.className = "theme-shutter";
  overlay.setAttribute("data-page-transition", "");
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("inert", "");
  overlay.style.setProperty("--theme-shutter-panel-duration", `${THEME_SHUTTER_PANEL_DURATION_MS}ms`);
  overlay.style.setProperty("--theme-shutter-stagger", `${THEME_SHUTTER_STAGGER_MS}ms`);
  overlay.style.setProperty("--theme-shutter-column-count", String(THEME_SHUTTER_COLUMN_COUNT));
  overlay.textContent = "";

  const backdrop = document.createElement("div");
  backdrop.className = "theme-shutter__backdrop";
  fragment.appendChild(backdrop);

  for (let columnIndex = 0; columnIndex < THEME_SHUTTER_COLUMN_COUNT; columnIndex += 1) {
    const column = document.createElement("div");
    column.className = "theme-shutter__column";
    column.style.setProperty("--theme-shutter-column-index", String(columnIndex));

    const topPanel = document.createElement("div");
    topPanel.className = "theme-shutter__panel theme-shutter__panel--top";

    const bottomPanel = document.createElement("div");
    bottomPanel.className = "theme-shutter__panel theme-shutter__panel--bottom";

    column.append(topPanel, bottomPanel);
    fragment.appendChild(column);
  }

  overlay.appendChild(fragment);

  if (!existingOverlay) {
    body.prepend(overlay);
  }

  let isTransitioning = false;

  function preventScrollWhileTransitioning(event) {
    if (!isTransitioning) {
      return;
    }

    event.preventDefault();
  }

  function preventKeyboardScrollWhileTransitioning(event) {
    if (!isTransitioning || !blockedScrollKeys.has(event.key)) {
      return;
    }

    event.preventDefault();
  }

  function lockPageInteraction() {
    body.childNodes.forEach((node) => {
      if (!(node instanceof HTMLElement) || node === overlay) {
        return;
      }

      const shouldRestoreInert = node.hasAttribute("inert") ? "keep" : "remove";
      node.setAttribute("data-theme-shutter-restore-inert", shouldRestoreInert);
      node.setAttribute("inert", "");
      lockedElements.push(node);
    });

    window.addEventListener("wheel", preventScrollWhileTransitioning, { passive: false });
    window.addEventListener("touchmove", preventScrollWhileTransitioning, { passive: false });
    window.addEventListener("keydown", preventKeyboardScrollWhileTransitioning, { passive: false });
  }

  function unlockPageInteraction() {
    while (lockedElements.length) {
      const element = lockedElements.pop();
      const shouldKeepInert = element.getAttribute("data-theme-shutter-restore-inert") === "keep";

      if (!shouldKeepInert) {
        element.removeAttribute("inert");
      }

      element.removeAttribute("data-theme-shutter-restore-inert");
    }

    window.removeEventListener("wheel", preventScrollWhileTransitioning);
    window.removeEventListener("touchmove", preventScrollWhileTransitioning);
    window.removeEventListener("keydown", preventKeyboardScrollWhileTransitioning);
  }

  function resetOverlay() {
    overlay.classList.remove("is-active", "is-covering", "is-covered", "is-revealing");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("inert", "");
    unlockPageInteraction();
    overlay.removeAttribute("data-transition-theme");
    root.classList.remove("is-theme-shutter-running");
    body.classList.remove("is-theme-shutter-running");
  }

  async function runTransition(callback, { transitionTheme } = {}) {
    if (isTransitioning) {
      return false;
    }

    isTransitioning = true;
    overlay.dataset.transitionTheme = transitionTheme ?? root.dataset.theme ?? THEME_LIGHT;
    overlay.classList.remove("is-covering", "is-covered", "is-revealing");
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "true");
    overlay.removeAttribute("inert");
    lockPageInteraction();
    root.classList.add("is-theme-shutter-running");
    body.classList.add("is-theme-shutter-running");

    try {
      commitStyleChange(overlay);
      overlay.classList.add("is-covering");
      await waitForDuration(THEME_SHUTTER_COVER_DURATION_MS);

      overlay.classList.remove("is-covering");
      overlay.classList.add("is-covered");

      await callback();
      await waitForDuration(THEME_SHUTTER_HOLD_DURATION_MS);

      overlay.classList.add("is-revealing");
      commitStyleChange(overlay);
      overlay.classList.remove("is-covered");
      await waitForDuration(THEME_SHUTTER_REVEAL_DURATION_MS);

      resetOverlay();
      isTransitioning = false;
      return true;
    } catch (error) {
      resetOverlay();
      isTransitioning = false;
      throw error;
    }
  }

  resetOverlay();

  return {
    isTransitioning: () => isTransitioning,
    runTransition,
  };
}

function initializeThemeToggle(themeShutter) {
  const root = document.documentElement;
  const themeSwitch = document.querySelector(".ds-theme-switch");
  const toggleButton = document.querySelector("[data-theme-toggle-button]");
  const themeLabels = Array.from(document.querySelectorAll("[data-theme-label]"));
  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let shouldRestoreToggleFocus = false;

  if (!toggleButton || !themeLabels.length) {
    return;
  }

  function getStoredTheme() {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (storedTheme === "day") {
        return THEME_LIGHT;
      }

      if (storedTheme === "night") {
        return THEME_DARK;
      }

      return storedTheme === THEME_LIGHT || storedTheme === THEME_DARK ? storedTheme : null;
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Ignore storage failures and keep the in-memory theme change.
    }
  }

  function getPreferredTheme() {
    return getStoredTheme() ?? (systemThemeQuery.matches ? THEME_DARK : THEME_LIGHT);
  }

  function syncThemeUI(theme) {
    root.dataset.theme = theme;

    themeLabels.forEach((label) => {
      const isActive = label.dataset.themeLabel === theme;
      label.classList.toggle("is-active", isActive);
    });

    const nextTheme = theme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
    const nextThemeLabel = nextTheme === THEME_LIGHT ? "light" : "dark";

    toggleButton.setAttribute("aria-pressed", String(theme === THEME_DARK));
    toggleButton.setAttribute("aria-label", `Switch to ${nextThemeLabel} mode`);
    toggleButton.title = `Switch to ${nextThemeLabel} mode`;
  }

  function setTheme(theme, { persist = false } = {}) {
    if (theme === root.dataset.theme) {
      return;
    }

    syncThemeUI(theme);

    if (persist) {
      saveTheme(theme);
    }
  }

  function handleSystemThemeChange(event) {
    if (getStoredTheme()) {
      return;
    }

    setTheme(event.matches ? THEME_DARK : THEME_LIGHT);
  }

  function lockThemeToggle() {
    shouldRestoreToggleFocus = document.activeElement === toggleButton;
    toggleButton.disabled = true;
    toggleButton.setAttribute("aria-disabled", "true");
    themeSwitch?.setAttribute("aria-busy", "true");
  }

  function unlockThemeToggle() {
    toggleButton.disabled = false;
    toggleButton.removeAttribute("aria-disabled");
    themeSwitch?.removeAttribute("aria-busy");

    if (shouldRestoreToggleFocus) {
      toggleButton.focus({ preventScroll: true });
    }

    shouldRestoreToggleFocus = false;
  }

  syncThemeUI(getPreferredTheme());

  toggleButton.addEventListener("click", async () => {
    const nextTheme = root.dataset.theme === THEME_DARK ? THEME_LIGHT : THEME_DARK;

    if (themeShutter?.isTransitioning()) {
      return;
    }

    lockThemeToggle();

    try {
      if (themeShutter) {
        await themeShutter.runTransition(() => {
          setTheme(nextTheme, { persist: true });
        }, { transitionTheme: nextTheme });
      } else {
        setTheme(nextTheme, { persist: true });
      }
    } finally {
      unlockThemeToggle();
    }
  });

  if (typeof systemThemeQuery.addEventListener === "function") {
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);
  } else if (typeof systemThemeQuery.addListener === "function") {
    systemThemeQuery.addListener(handleSystemThemeChange);
  }
}

function initializeSectionPhaseTransition() {
  const body = document.body;
  const root = document.documentElement;
  const overlay = document.querySelector("[data-nav-phase-transition]");
  const scrollingElement = document.scrollingElement || document.documentElement;
  const themeOverlay = document.querySelector("[data-page-transition]");
  const lockedElements = [];
  let isTransitioning = false;

  if (!overlay || !scrollingElement) {
    return;
  }

  function getScrollMarginTop(element) {
    return parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0;
  }

  function clampScrollY(value) {
    const maxScrollY = Math.max(scrollingElement.scrollHeight - window.innerHeight, 0);
    return Math.min(Math.max(value, 0), maxScrollY);
  }

  function getTargetFromHash(hash) {
    if (!hash || hash === "#") {
      return null;
    }

    const decodedHash = decodeURIComponent(hash);

    try {
      return document.querySelector(decodedHash);
    } catch (error) {
      return null;
    }
  }

  function getSamePageHash(link) {
    if (!(link instanceof HTMLAnchorElement)) {
      return null;
    }

    let url;

    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return null;
    }

    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash || url.hash === "#") {
      return null;
    }

    return url.hash;
  }

  function getTargetScrollTop(target) {
    return clampScrollY(scrollingElement.scrollTop + target.getBoundingClientRect().top - getScrollMarginTop(target));
  }

  function preventInteraction(event) {
    if (!isTransitioning) {
      return;
    }

    event.preventDefault();
  }

  function lockPageInteraction() {
    body.childNodes.forEach((node) => {
      if (!(node instanceof HTMLElement) || node === overlay || node === themeOverlay) {
        return;
      }

      const shouldRestoreInert = node.hasAttribute("inert") ? "keep" : "remove";
      node.setAttribute("data-nav-phase-restore-inert", shouldRestoreInert);
      node.setAttribute("inert", "");
      lockedElements.push(node);
    });

    window.addEventListener("wheel", preventInteraction, { passive: false });
    window.addEventListener("touchmove", preventInteraction, { passive: false });
    window.addEventListener("keydown", preventInteraction, { passive: false });
  }

  function unlockPageInteraction() {
    while (lockedElements.length) {
      const element = lockedElements.pop();
      const shouldKeepInert = element.getAttribute("data-nav-phase-restore-inert") === "keep";

      if (!shouldKeepInert) {
        element.removeAttribute("inert");
      }

      element.removeAttribute("data-nav-phase-restore-inert");
    }

    window.removeEventListener("wheel", preventInteraction);
    window.removeEventListener("touchmove", preventInteraction);
    window.removeEventListener("keydown", preventInteraction);
  }

  function resetOverlay() {
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("inert", "");
    unlockPageInteraction();
    root.classList.remove("is-nav-phase-transitioning");
  }

  async function runSectionTransition(target, hash) {
    if (isTransitioning) {
      return;
    }

    isTransitioning = true;
    lockPageInteraction();
    overlay.removeAttribute("inert");
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-active");
    root.classList.add("is-nav-phase-transitioning");

    try {
      commitStyleChange(overlay);
      await waitForDuration(NAV_PHASE_DURATION_MS);

      const targetScrollTop = getTargetScrollTop(target);
      window.scrollTo({
        top: targetScrollTop,
        left: 0,
        behavior: "auto",
      });
      window.history.pushState(null, "", hash);

      commitStyleChange(overlay);
      overlay.classList.remove("is-active");
      await waitForDuration(NAV_PHASE_DURATION_MS);
    } finally {
      resetOverlay();
      isTransitioning = false;
    }
  }

  resetOverlay();

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;

    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const hash = getSamePageHash(link);

    if (!hash) {
      return;
    }

    const target = getTargetFromHash(hash);

    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    runSectionTransition(target, hash);
  }, true);
}

function initializeScrollReveal() {
  const revealElements = Array.from(document.querySelectorAll(".ds-reveal"));

  if (!revealElements.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -50px 0px",
  });

  revealElements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    observer.observe(element);
  });
}

function initializeProjectCarousel() {
  const carousel = document.querySelector("[data-project-carousel]");
  const track = document.querySelector("[data-project-track]");
  const viewport = document.querySelector("[data-project-viewport]");
  const prevButton = document.querySelector("[data-project-prev]");
  const nextButton = document.querySelector("[data-project-next]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!carousel || !track || !viewport || !prevButton || !nextButton) {
    return;
  }

  const cards = Array.from(track.querySelectorAll(".ds-project-card"));

  if (!cards.length) {
    return;
  }

  function openProjectCard(card) {
    if (!(card instanceof HTMLElement)) {
      return;
    }

    const projectUrl = card.dataset.projectUrl;

    if (!projectUrl) {
      return;
    }

    window.location.href = projectUrl;
  }

  let currentIndex = 0;
  let cardsPerView = getCardsPerView();
  let maxIndex = 0;
  let cardOffsets = [];
  let scrollStateTimerId = 0;

  function getCardsPerView() {
    if (window.innerWidth <= 767) {
      return 1;
    }

    if (window.innerWidth <= 991) {
      return 2;
    }

    return 3;
  }

  function clampIndex(index) {
    return Math.min(Math.max(index, 0), maxIndex);
  }

  function getScrollBehavior() {
    return prefersReducedMotion.matches ? "auto" : "smooth";
  }

  function buildCardOffsets() {
    return Array.from({ length: maxIndex + 1 }, (_, cardIndex) => {
      const card = cards[cardIndex];
      return card ? card.offsetLeft - track.offsetLeft : 0;
    });
  }

  function updateControls() {
    prevButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= maxIndex;
  }

  function syncIndexFromScroll() {
    const scrollLeft = viewport.scrollLeft;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardOffsets.forEach((offset, cardIndex) => {
      const distance = Math.abs(offset - scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = cardIndex;
      }
    });

    currentIndex = closestIndex;
    updateControls();
  }

  function scrollToIndex(index, behavior = getScrollBehavior()) {
    currentIndex = clampIndex(index);
    updateControls();

    viewport.scrollTo({
      left: cardOffsets[currentIndex] ?? 0,
      behavior,
    });
  }

  function refreshCarousel({ preserveIndex = true } = {}) {
    const previousIndex = currentIndex;

    cardsPerView = getCardsPerView();
    maxIndex = Math.max(0, cards.length - cardsPerView);
    cardOffsets = buildCardOffsets();
    carousel.style.setProperty("--projects-per-view", String(cardsPerView));
    currentIndex = preserveIndex ? clampIndex(previousIndex) : 0;
    viewport.scrollLeft = cardOffsets[currentIndex] ?? 0;
    updateControls();
  }

  prevButton.addEventListener("click", () => {
    scrollToIndex(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    scrollToIndex(currentIndex + 1);
  });

  track.addEventListener("click", (event) => {
    const card = event.target instanceof Element ? event.target.closest("[data-project-url]") : null;

    if (!card) {
      return;
    }

    openProjectCard(card);
  });

  viewport.addEventListener("keydown", (event) => {
    const linkedCard = event.target instanceof Element ? event.target.closest("[data-project-url]") : null;

    if (linkedCard && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openProjectCard(linkedCard);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex(currentIndex + 1);
    }
  });

  viewport.addEventListener("scroll", () => {
    window.clearTimeout(scrollStateTimerId);
    carousel.classList.add("is-scrolling");
    syncIndexFromScroll();

    scrollStateTimerId = window.setTimeout(() => {
      carousel.classList.remove("is-scrolling");
      syncIndexFromScroll();
    }, 140);
  }, { passive: true });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      refreshCarousel();
    });

    resizeObserver.observe(viewport);
  } else {
    window.addEventListener("resize", () => {
      refreshCarousel();
    });
  }

  refreshCarousel({ preserveIndex: false });
}
