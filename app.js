"use strict";

const starterRequests = [
  { id: "sample-1", group: "O+", location: "Dhanmondi, Dhaka", center: "Square Hospitals Ltd.", name: "Nusrat A.", urgency: "Urgent", time: "15 min ago", sample: true },
  { id: "sample-2", group: "B+", location: "Gulshan, Dhaka", center: "United Hospital", name: "Rahim K.", urgency: "Today", time: "48 min ago", sample: true },
  { id: "sample-3", group: "A−", location: "Uttara, Dhaka", center: "Uttara Crescent Hospital", name: "Samira H.", urgency: "Urgent", time: "1 hour ago", sample: true },
  { id: "sample-4", group: "AB+", location: "Chattogram", center: "Chattogram Medical College", name: "Farhan M.", urgency: "Today", time: "2 hours ago", sample: true },
  { id: "sample-5", group: "O−", location: "Sylhet", center: "Sylhet MAG Osmani Medical College", name: "Ayesha R.", urgency: "Urgent", time: "3 hours ago", sample: true },
  { id: "sample-6", group: "B−", location: "Mirpur, Dhaka", center: "National Heart Foundation", name: "Tariq S.", urgency: "Today", time: "5 hours ago", sample: true }
];

const requestGrid = document.querySelector("#request-grid");
const emptyState = document.querySelector("#empty-state");
const requestCount = document.querySelector("#request-count");
const locationSearch = document.querySelector("#location-search");
const groupFilter = document.querySelector("#group-filter");
const toast = document.querySelector("#toast");
let mostRecentFirst = true;
let toastTimeout;

function readSaved(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function formatRelativeTime(date) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getRequests() {
  const saved = readSaved("bloodlink-demo-requests");
  return [
    ...saved.map((request) => ({ ...request, sample: false, time: formatRelativeTime(request.createdAt) })),
    ...starterRequests
  ];
}

function createRequestCard(request) {
  const article = document.createElement("article");
  article.className = "request-card";

  const head = document.createElement("div");
  head.className = "request-card-head";

  const group = document.createElement("span");
  group.className = "group-badge";
  group.textContent = request.group;

  const urgency = document.createElement("span");
  urgency.className = `urgency-badge${request.urgency === "Urgent" ? "" : " normal"}`;
  urgency.textContent = request.urgency;
  head.append(group, urgency);

  const title = document.createElement("h3");
  title.textContent = request.center;

  const location = document.createElement("span");
  location.className = "request-location";
  location.textContent = `⌖  ${request.location}`;

  const footer = document.createElement("div");
  footer.className = "request-card-foot";
  const poster = document.createElement("span");
  poster.className = "request-poster";
  poster.textContent = `Posted by ${request.name}`;
  const time = document.createElement("span");
  time.className = "request-time";
  time.textContent = request.time;
  footer.append(poster, time);

  const connect = document.createElement("button");
  connect.className = "request-connect";
  connect.type = "button";
  connect.textContent = "I'm interested";
  connect.setAttribute("aria-label", `Show demo connection message for ${request.group} request at ${request.center}`);
  connect.addEventListener("click", () => {
    showToast("Demo only — no donor, patient, or center was contacted.");
  });

  article.append(head, title, location, footer, connect);
  return article;
}

function renderRequests() {
  const query = locationSearch.value.trim().toLocaleLowerCase();
  const group = groupFilter.value;
  const requests = getRequests()
    .filter((request) => (!group || request.group === group)
      && (!query || `${request.location} ${request.center}`.toLocaleLowerCase().includes(query)))
    .sort((a, b) => mostRecentFirst
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  requestGrid.replaceChildren(...requests.map(createRequestCard));
  requestCount.textContent = String(requests.length);
  emptyState.hidden = requests.length !== 0;
  requestGrid.hidden = requests.length === 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 3800);
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog && typeof dialog.showModal === "function") dialog.showModal();
}

function saveEntry(key, entry) {
  const saved = readSaved(key);
  saved.unshift({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(saved));
}

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => openDialog(button.dataset.openModal));
});

document.querySelectorAll(".dialog-close").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll(".form-dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.querySelector("#request-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  saveEntry("bloodlink-demo-requests", {
    name: String(values.get("name")).trim(),
    group: String(values.get("group")),
    location: String(values.get("location")).trim(),
    center: String(values.get("center")).trim(),
    urgency: "Today"
  });
  form.reset();
  form.closest("dialog").close();
  locationSearch.value = "";
  groupFilter.value = "";
  renderRequests();
  showToast("Demo request added to this browser.");
  document.querySelector("#requests").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#donor-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  saveEntry("bloodlink-demo-donors", {
    name: String(values.get("name")).trim(),
    group: String(values.get("group")),
    location: String(values.get("location")).trim()
  });
  form.reset();
  form.closest("dialog").close();
  showToast("Demo profile saved in this browser only.");
});

document.querySelector("#search-button").addEventListener("click", renderRequests);
locationSearch.addEventListener("search", renderRequests);
locationSearch.addEventListener("input", renderRequests);
groupFilter.addEventListener("change", renderRequests);
document.querySelector("#clear-filters").addEventListener("click", () => {
  locationSearch.value = "";
  groupFilter.value = "";
  renderRequests();
});
document.querySelector("#sort-button").addEventListener("click", (event) => {
  mostRecentFirst = !mostRecentFirst;
  event.currentTarget.innerHTML = `${mostRecentFirst ? "Most recent" : "Oldest first"} <span aria-hidden="true">⌄</span>`;
  renderRequests();
});

const menuButton = document.querySelector(".menu-toggle");
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  document.querySelector(".main-nav").classList.toggle("is-open", !expanded);
});
document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    document.querySelector(".main-nav").classList.remove("is-open");
  });
});

renderRequests();
