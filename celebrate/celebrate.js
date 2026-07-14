const STORAGE_KEY = "robbie-bachelor-rsvp-responses-v1";
const defaultPersistenceConfig = {
  csvUrl: "",
  endpointUrl: "/api/rsvps",
};
const persistenceConfig = {
  ...defaultPersistenceConfig,
  ...(window.CELEBRATE_RSVP_CONFIG || {}),
};
const csvStoreUrl = String(persistenceConfig.csvUrl || "").trim();
const remoteStoreUrl = String(persistenceConfig.endpointUrl || "").trim();
const sharedRefreshIntervalMs = 60000;

const invitees = [
  { id: "max-voorhees", name: "Max Voorhees", phone: "5302103099" },
  { id: "thomas-correll", name: "Thomas Correll", phone: "5302637719" },
  { id: "jonno-christie", name: "Jonno Christie", phone: "8053414024" },
  { id: "lane-carleson", name: "Lane Carlson", phone: "5309136251" },
  { id: "sean-fitzhenry", name: "Sean Fitzhenry", phone: "5305598103" },
  { id: "andrew-kostolefsky", name: "Andrew Kostolefsky", phone: "5305595048" },
  { id: "cody-gardi", name: "Cody Gardi", phone: "9253938441" },
];

const rsvpStatuses = [
  "Yes, I am in",
  "No, I cannot make it",
];
const yesStatus = "Yes, I am in";
const noStatus = "No, I cannot make it";
const legacyNoStatus = "Sorry, I cannot make it";
const unavailableWeekend = "None of these weekends work for me";
const resetPassword = "archie";
const expectedRsvpCount = 8;

const weekendOptions = [
  {
    value: "Weekend of Jan 9: Friday afternoon Jan 8 + Saturday Jan 9",
    label: "Jan 8-9",
    detail: "Friday afternoon + Saturday",
    summary: "Jan 8-9",
  },
  {
    value: "Weekend of Jan 16: Friday afternoon Jan 15 + Saturday Jan 16",
    label: "Jan 15-16",
    detail: "Friday afternoon + Saturday",
    summary: "Jan 15-16",
  },
  {
    value: "Weekend of Jan 23: Friday afternoon Jan 22 + Saturday Jan 23",
    label: "Jan 22-23",
    detail: "Friday afternoon + Saturday",
    summary: "Jan 22-23",
  },
  {
    value: unavailableWeekend,
    label: "None of these",
    detail: "No listed weekend works",
    summary: "None",
  },
];

// Trip details live here so updates do not affect saved RSVP records.
const tripDetails = [
  {
    title: "Location",
    body: "Grass Valley, CA",
    linkLabel: "Open in Google Maps",
    linkUrl: "https://www.google.com/maps/search/?api=1&query=Grass%20Valley%2C%20CA",
  },
  {
    title: "Flights",
    body: "Destination: Sacramento International Airport",
    linkLabel: "Open Google Flights",
    linkUrl: "https://www.google.com/travel/flights?q=Flights%20to%20Sacramento%20International%20Airport%20SMF",
  },
  {
    title: "What to bring",
    body: "will update soon",
  },
  {
    title: "Activities",
    body: "will update soon",
  },
  {
    title: "Est. Cost",
    body: "will update soon",
  },
];

const elements = {
  rsvpPage: document.querySelector("[data-rsvp-page]"),
  detailsPage: document.querySelector("[data-details-page]"),
  backToRsvp: document.querySelector("[data-back-to-rsvp]"),
  alreadyDidThis: document.querySelector("[data-already-did-this]"),
  form: document.querySelector("[data-rsvp-form]"),
  inviteeSelect: document.querySelector("[data-invitee-select]"),
  phoneCard: document.querySelector("[data-phone-card]"),
  phoneDisplay: document.querySelector("[data-phone-display]"),
  statusOptions: document.querySelector("[data-status-options]"),
  availabilityOptions: document.querySelector("[data-availability-options]"),
  notes: document.querySelector("[data-notes]"),
  statusMessage: document.querySelector("[data-status-message]"),
  submitRsvp: document.querySelector("[data-submit-rsvp]"),
  tripDetails: document.querySelector("[data-trip-details]"),
  responseList: document.querySelector("[data-response-list]"),
  overlapSummary: document.querySelector("[data-overlap-summary]"),
  overlapList: document.querySelector("[data-overlap-list]"),
  resetForm: document.querySelector("[data-reset-form]"),
  resetPassword: document.querySelector("[data-reset-password]"),
  resetMessage: document.querySelector("[data-reset-message]"),
};

let responses = {};
let sharedRefreshTimer = 0;
let isRefreshingSharedResponses = false;

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getInviteeById(id) {
  return invitees.find((invitee) => invitee.id === id) || null;
}

function setStatus(message, type = "loading") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message is-${type}`;
  elements.statusMessage.hidden = type === "loading";
}

function normalizeAvailability(availability) {
  if (!availability.includes(unavailableWeekend) || availability.length === 1) {
    return availability;
  }

  return availability.filter((weekend) => weekend !== unavailableWeekend);
}

function normalizeStatus(status) {
  if (status === yesStatus || status === noStatus) {
    return status;
  }

  return status === legacyNoStatus ? noStatus : "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function parseAvailabilityValue(value) {
  if (Array.isArray(value)) {
    return normalizeAvailability(value.map(String).map((item) => item.trim()).filter(Boolean));
  }

  return normalizeAvailability(
    String(value || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function normalizeStoredResponse(record) {
  const invitee = getInviteeById(record.inviteeId);
  const status = normalizeStatus(record.status);
  const availability = parseAvailabilityValue(record.availability);

  if (!invitee || !status || !availability.length) {
    return null;
  }

  const submittedAt = record.submittedAt || record.updatedAt || new Date().toISOString();
  const updatedAt = record.updatedAt || submittedAt;

  return {
    inviteeId: invitee.id,
    name: invitee.name,
    phone: invitee.phone,
    status,
    availability,
    notes: record.notes || "",
    submittedAt,
    updatedAt,
  };
}

function createResponseCollection(records) {
  return records.reduce((collection, record) => {
    const response = normalizeStoredResponse(record);
    if (response) {
      collection[response.inviteeId] = response;
    }
    return collection;
  }, {});
}

function responsesFromCsv(text) {
  const rows = parseCsv(text);

  if (rows.length < 2) {
    return {};
  }

  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1).map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index] || "";
      return record;
    }, {}),
  );

  return createResponseCollection(records);
}

function responsesFromPayload(payload) {
  if (Array.isArray(payload)) {
    return createResponseCollection(payload);
  }

  if (Array.isArray(payload?.responses)) {
    return createResponseCollection(payload.responses);
  }

  return {};
}

function getTimestamp(response) {
  return Date.parse(response.updatedAt || response.submittedAt || "") || 0;
}

function mergeResponses(nextResponses) {
  Object.values(nextResponses).forEach((nextResponse) => {
    const existingResponse = responses[nextResponse.inviteeId];

    if (!existingResponse || getTimestamp(nextResponse) >= getTimestamp(existingResponse)) {
      responses[nextResponse.inviteeId] = nextResponse;
    }
  });
}

function readLocalResponses() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return createResponseCollection(Object.values(parsed));
  } catch (error) {
    return {};
  }
}

function saveLocalResponses() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
}

function buildRemoteUrl(action) {
  const url = new URL(remoteStoreUrl, window.location.href);
  url.searchParams.set("action", action);
  url.searchParams.set("cache", Date.now().toString());
  return url.toString();
}

function responseToRemoteRecord(response) {
  return {
    ...response,
    availability: response.availability.join("|"),
  };
}

async function readTextResponse(response) {
  const text = await response.text();
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {};
  }

  if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
    return responsesFromPayload(JSON.parse(trimmedText));
  }

  return responsesFromCsv(text);
}

async function fetchCsvResponses() {
  if (!csvStoreUrl) {
    return {};
  }

  const url = new URL(csvStoreUrl, window.location.href);
  url.searchParams.set("cache", Date.now().toString());
  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    return {};
  }

  return responsesFromCsv(await response.text());
}

async function fetchRemoteResponses() {
  if (!remoteStoreUrl) {
    return {};
  }

  const response = await fetch(buildRemoteUrl("list"), { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Shared RSVP log could not be loaded.");
  }

  return readTextResponse(response);
}

async function refreshSharedResponses() {
  if (isRefreshingSharedResponses) {
    return;
  }

  isRefreshingSharedResponses = true;

  try {
    mergeResponses(await fetchCsvResponses());
  } catch (error) {
    // The static CSV is only a shared seed; local saves can still render the page.
  }

  try {
    if (remoteStoreUrl) {
      mergeResponses(await fetchRemoteResponses());
    }

    saveLocalResponses();
  } finally {
    isRefreshingSharedResponses = false;
  }
}

async function loadResponses() {
  responses = readLocalResponses();

  try {
    await refreshSharedResponses();
  } catch (error) {
    setStatus("Shared RSVPs could not be loaded. Showing saved browser entries for now.", "error");
  }
}

async function writeRemoteResponse(response) {
  if (!remoteStoreUrl) {
    return;
  }

  const saveResponse = await fetch(remoteStoreUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "upsert",
      response: responseToRemoteRecord(response),
    }),
  });

  if (!saveResponse.ok) {
    throw new Error("Shared RSVP log could not be updated.");
  }
}

async function persistResponse(response) {
  responses[response.inviteeId] = response;
  saveLocalResponses();

  await writeRemoteResponse(response);

  if (remoteStoreUrl) {
    await refreshSharedResponses();
  }
}

async function clearRemoteResponses(password) {
  if (!remoteStoreUrl) {
    return;
  }

  const clearResponse = await fetch(remoteStoreUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "clear",
      password,
    }),
  });

  if (!clearResponse.ok) {
    throw new Error("Shared RSVPs could not be cleared.");
  }
}

async function syncVisibleSharedResponses({ showError = false } = {}) {
  if (!remoteStoreUrl) {
    return;
  }

  try {
    await refreshSharedResponses();

    if (!elements.detailsPage.hidden) {
      renderDetailsPage();
    }

    if (!elements.rsvpPage.hidden) {
      updateInviteeState();
    }
  } catch (error) {
    if (showError) {
      setStatus("Shared RSVPs could not be refreshed. Showing saved browser entries for now.", "error");
    }
  }
}

function startSharedPolling() {
  if (!remoteStoreUrl || sharedRefreshTimer) {
    return;
  }

  sharedRefreshTimer = window.setInterval(() => {
    if (!document.hidden) {
      syncVisibleSharedResponses();
    }
  }, sharedRefreshIntervalMs);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncVisibleSharedResponses();
    }
  });
}

function setResetMessage(message, type = "neutral") {
  elements.resetMessage.textContent = message;
  elements.resetMessage.dataset.state = type;
}

function createOption(type, name, value, label, detail = "") {
  const optionLabel = document.createElement("label");
  optionLabel.className = "option-card";

  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.value = value;
  input.required = type === "radio";

  const text = document.createElement("span");
  text.className = "option-text";
  text.textContent = label;

  if (detail) {
    const detailText = document.createElement("small");
    detailText.textContent = detail;
    text.appendChild(detailText);
  }

  optionLabel.append(input, text);
  return optionLabel;
}

function renderInviteeOptions() {
  invitees.forEach((invitee) => {
    const option = document.createElement("option");
    option.value = invitee.id;
    option.textContent = invitee.name;
    elements.inviteeSelect.appendChild(option);
  });
}

function renderChoices() {
  rsvpStatuses.forEach((status) => {
    elements.statusOptions.appendChild(createOption("radio", "rsvp-status", status, status));
  });

  weekendOptions.forEach((weekend) => {
    elements.availabilityOptions.appendChild(
      createOption("checkbox", "availability", weekend.value, weekend.label, weekend.detail),
    );
  });
}

function renderTripDetails() {
  elements.tripDetails.textContent = "";

  tripDetails.forEach((detail) => {
    const card = document.createElement("article");
    card.className = "trip-card";

    const title = document.createElement("h3");
    title.textContent = detail.title;

    const body = document.createElement("p");
    body.textContent = detail.body;

    card.append(title, body);

    if (detail.linkUrl && detail.linkLabel) {
      const link = document.createElement("a");
      link.href = detail.linkUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = detail.linkLabel;
      card.appendChild(link);
    }

    elements.tripDetails.appendChild(card);
  });
}

function clearResponseInputs() {
  elements.form.querySelectorAll('input[name="rsvp-status"], input[name="availability"]').forEach((input) => {
    input.checked = false;
  });
  elements.notes.value = "";
}

function setFormFromResponse(response) {
  clearResponseInputs();

  if (!response) {
    elements.submitRsvp.textContent = "Submit RSVP";
    return;
  }

  const normalizedStatus = normalizeStatus(response.status);
  const statusInput = elements.form.querySelector(`input[name="rsvp-status"][value="${CSS.escape(normalizedStatus)}"]`);
  if (statusInput) {
    statusInput.checked = true;
  }

  elements.form.querySelectorAll('input[name="availability"]').forEach((input) => {
    input.checked = normalizeAvailability(response.availability).includes(input.value);
  });
  elements.notes.value = response.notes || "";
  elements.submitRsvp.textContent = "Update RSVP";
}

function updateInviteeState() {
  const invitee = getInviteeById(elements.inviteeSelect.value);

  if (!invitee) {
    elements.phoneCard.hidden = true;
    elements.phoneDisplay.textContent = "";
    clearResponseInputs();
    elements.submitRsvp.textContent = "Submit RSVP";
    setStatus("", "loading");
    return;
  }

  elements.phoneCard.hidden = false;
  elements.phoneDisplay.textContent = formatPhone(invitee.phone);
  setFormFromResponse(responses[invitee.id]);
  setStatus("", "loading");
}

function getSelectedAvailability() {
  const selectedAvailability = Array.from(elements.form.querySelectorAll('input[name="availability"]:checked')).map(
    (input) => input.value,
  );
  return normalizeAvailability(selectedAvailability);
}

function getSelectedStatus() {
  const checked = elements.form.querySelector('input[name="rsvp-status"]:checked');
  return checked ? checked.value : "";
}

function handleAvailabilityChange(event) {
  const changedInput = event.target;

  if (!(changedInput instanceof HTMLInputElement) || changedInput.name !== "availability" || !changedInput.checked) {
    return;
  }

  const availabilityInputs = Array.from(elements.form.querySelectorAll('input[name="availability"]'));

  if (changedInput.value === unavailableWeekend) {
    availabilityInputs.forEach((input) => {
      if (input !== changedInput) {
        input.checked = false;
      }
    });
    return;
  }

  const unavailableInput = availabilityInputs.find((input) => input.value === unavailableWeekend);
  if (unavailableInput) {
    unavailableInput.checked = false;
  }
}

function showRsvpPage({ updateHash = true } = {}) {
  elements.detailsPage.hidden = true;
  elements.rsvpPage.hidden = false;

  if (updateHash) {
    window.history.replaceState(null, "", window.location.pathname);
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

async function showDetailsPage({ updateHash = true, refresh = true } = {}) {
  if (refresh) {
    try {
      await refreshSharedResponses();
    } catch (error) {
      setStatus("Shared RSVPs could not be refreshed. Showing saved browser entries for now.", "error");
    }
  }

  renderDetailsPage();
  elements.rsvpPage.hidden = true;
  elements.detailsPage.hidden = false;

  if (updateHash) {
    window.history.replaceState(null, "", "#quest-details");
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

async function handleSubmit(event) {
  event.preventDefault();

  const invitee = getInviteeById(elements.inviteeSelect.value);
  const status = getSelectedStatus();
  const availability = getSelectedAvailability();

  if (!invitee) {
    setStatus("Please choose your name before submitting.", "error");
    elements.inviteeSelect.focus();
    return;
  }

  if (!status) {
    setStatus("Please choose an RSVP status.", "error");
    elements.form.querySelector('input[name="rsvp-status"]')?.focus();
    return;
  }

  if (!availability.length) {
    setStatus("Please choose at least one weekend option.", "error");
    elements.form.querySelector('input[name="availability"]')?.focus();
    return;
  }

  const existingResponse = responses[invitee.id];
  const now = new Date().toISOString();
  const response = {
    inviteeId: invitee.id,
    name: invitee.name,
    phone: invitee.phone,
    status,
    availability,
    notes: elements.notes.value.trim(),
    submittedAt: existingResponse?.submittedAt || now,
    updatedAt: now,
  };

  elements.submitRsvp.disabled = true;
  elements.submitRsvp.textContent = remoteStoreUrl ? "Saving Shared RSVP..." : "Saving RSVP...";

  try {
    await persistResponse(response);
    setStatus("", "loading");
    elements.submitRsvp.textContent = "Update RSVP";
    await showDetailsPage({ refresh: false });
  } catch (error) {
    elements.submitRsvp.textContent = "Update RSVP";
    setStatus("Saved on this device, but the shared RSVP log could not be updated. Please try again.", "error");
  } finally {
    elements.submitRsvp.disabled = false;
  }
}

function getResponseEntries() {
  return invitees
    .map((invitee) => ({ invitee, response: responses[invitee.id] }))
    .filter((entry) => Boolean(entry.response) && Boolean(normalizeStatus(entry.response.status)));
}

function createRollResult(status) {
  const normalizedStatus = normalizeStatus(status);
  const rollResult = document.createElement("div");
  rollResult.className = normalizedStatus === yesStatus ? "roll-result is-success" : "roll-result is-failure";

  const diceIcon = document.createElement("span");
  diceIcon.className = "dice-icon";
  diceIcon.setAttribute("aria-hidden", "true");

  const rollDie = document.createElement("span");
  rollDie.className = "roll-die";
  rollDie.textContent = "D20";

  const rollLabel = document.createElement("span");
  rollLabel.className = "roll-label";
  rollLabel.textContent = "Roll:";

  const rollValue = document.createElement("span");
  rollValue.className = "roll-value";
  rollValue.textContent = normalizedStatus === yesStatus ? "CRITICAL SUCCESS" : "CRITICAL FAILURE";

  rollResult.append(diceIcon, rollDie, rollLabel, rollValue);
  rollResult.setAttribute("aria-label", `D20 roll: ${rollValue.textContent}`);
  return rollResult;
}

function renderResponseList() {
  const entries = getResponseEntries();
  elements.responseList.textContent = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No responses yet.";
    elements.responseList.appendChild(empty);
    return;
  }

  entries.forEach(({ invitee, response }) => {
    const item = document.createElement("article");
    item.className = "response-card";

    const responseHeading = document.createElement("div");
    responseHeading.className = "response-heading";

    const heading = document.createElement("h3");
    heading.textContent = invitee.name;
    responseHeading.append(heading, createRollResult(response.status));

    item.appendChild(responseHeading);

    if (response.notes) {
      item.appendChild(createDetailLine("Notes", response.notes));
    }

    elements.responseList.appendChild(item);
  });
}

function createDetailLine(label, value) {
  const line = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}:`;
  line.append(strong, ` ${value}`);
  return line;
}

function renderOverlapTracker() {
  const responseEntries = getResponseEntries();
  const hasAllExpectedResponses = responseEntries.length >= expectedRsvpCount;
  const eligibleResponses = responseEntries
    .map((entry) => entry.response)
    .filter((response) => normalizeStatus(response.status) === yesStatus);
  const needsAnotherDateOption = eligibleResponses.some((response) =>
    normalizeAvailability(response.availability).includes(unavailableWeekend),
  );
  const weekendCounts = weekendOptions
    .filter((weekend) => weekend.value !== unavailableWeekend)
    .map((weekend) => ({
      ...weekend,
      names: eligibleResponses
        .filter((response) => normalizeAvailability(response.availability).includes(weekend.value))
        .map((response) => response.name),
    }));
  const completeWeekends = weekendCounts.filter((weekend) => weekend.names.length >= expectedRsvpCount);

  elements.overlapSummary.textContent = "";
  elements.overlapList.textContent = "";

  const summary = document.createElement("p");
  summary.className = "overlap-callout";
  if (needsAnotherDateOption) {
    summary.textContent = "Need to pick another date to choose from.";
  } else if (completeWeekends.length === 1) {
    summary.textContent = `${completeWeekends[0].summary}: works best for everyone.`;
  } else if (completeWeekends.length > 1) {
    const labels = completeWeekends.map((weekend) => weekend.summary).join(", ");
    summary.textContent = `${labels}: all work for everyone.`;
  } else if (!hasAllExpectedResponses) {
    summary.textContent = `Waiting for all ${expectedRsvpCount} RSVPs before calling the best weekend.`;
  } else {
    summary.textContent = `No single date has all ${expectedRsvpCount} votes yet.`;
  }
  elements.overlapSummary.appendChild(summary);

  weekendCounts.forEach(({ label, detail, names }) => {
    const item = document.createElement("article");
    item.className = "overlap-card";

    const title = document.createElement("h3");
    title.textContent = label;

    const detailLine = document.createElement("p");
    detailLine.className = "overlap-window";
    detailLine.textContent = detail;

    const count = document.createElement("p");
    count.textContent = `${names.length} ${names.length === 1 ? "vote" : "votes"}`;

    item.append(title, detailLine, count);
    elements.overlapList.appendChild(item);
  });
}

function renderDetailsPage() {
  renderTripDetails();
  renderResponseList();
  renderOverlapTracker();
}

async function handleResetForm(event) {
  event.preventDefault();

  const password = elements.resetPassword.value.trim();

  if (password !== resetPassword) {
    setResetMessage("Wrong password.", "error");
    elements.resetPassword.select();
    return;
  }

  const button = elements.resetForm.querySelector("button");
  button.disabled = true;

  try {
    await clearRemoteResponses(password);
    responses = {};
    window.localStorage.removeItem(STORAGE_KEY);
    elements.resetPassword.value = "";
    elements.submitRsvp.textContent = "Submit RSVP";
    renderDetailsPage();
    setResetMessage("RSVPs cleared.", "success");
  } catch (error) {
    setResetMessage("Could not clear RSVPs.", "error");
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderInviteeOptions();
  renderChoices();
  await loadResponses();
  setStatus("", "loading");
  updateInviteeState();

  elements.inviteeSelect.addEventListener("change", updateInviteeState);
  elements.availabilityOptions.addEventListener("change", handleAvailabilityChange);
  elements.form.addEventListener("submit", handleSubmit);
  elements.resetForm.addEventListener("submit", handleResetForm);
  elements.alreadyDidThis.addEventListener("click", () => showDetailsPage());
  elements.backToRsvp.addEventListener("click", () => {
    showRsvpPage();
    updateInviteeState();
  });
  startSharedPolling();

  if (window.location.hash === "#quest-details") {
    showDetailsPage({ updateHash: false });
  } else {
    showRsvpPage({ updateHash: false });
  }
});
