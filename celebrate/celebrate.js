const STORAGE_KEY = "robbie-bachelor-rsvp-responses-v1";

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

function loadResponses() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    responses = saved ? JSON.parse(saved) : {};
  } catch (error) {
    responses = {};
    setStatus("Saved RSVPs could not be loaded in this browser.", "error");
  }
}

function saveResponses() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
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

function showDetailsPage({ updateHash = true } = {}) {
  renderDetailsPage();
  elements.rsvpPage.hidden = true;
  elements.detailsPage.hidden = false;

  if (updateHash) {
    window.history.replaceState(null, "", "#quest-details");
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function handleSubmit(event) {
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

  try {
    responses[invitee.id] = response;
    saveResponses();
    setStatus("", "loading");
    elements.submitRsvp.textContent = "Update RSVP";
    showDetailsPage();
  } catch (error) {
    if (existingResponse) {
      responses[invitee.id] = existingResponse;
    } else {
      delete responses[invitee.id];
    }
    setStatus("This browser could not save the RSVP. Please try again.", "error");
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

function handleResetForm(event) {
  event.preventDefault();

  if (elements.resetPassword.value.trim() !== resetPassword) {
    setResetMessage("Wrong password.", "error");
    elements.resetPassword.select();
    return;
  }

  try {
    responses = {};
    window.localStorage.removeItem(STORAGE_KEY);
    elements.resetPassword.value = "";
    elements.submitRsvp.textContent = "Submit RSVP";
    renderDetailsPage();
    setResetMessage("RSVPs cleared.", "success");
  } catch (error) {
    setResetMessage("Could not clear RSVPs.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderInviteeOptions();
  renderChoices();
  loadResponses();
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

  if (window.location.hash === "#quest-details") {
    showDetailsPage({ updateHash: false });
  } else {
    showRsvpPage({ updateHash: false });
  }
});
