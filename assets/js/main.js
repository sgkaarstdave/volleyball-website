// Einstellungen
const NEWS_SETTINGS = { SHOW_ONLY_LATEST: false, RETENTION_DAYS: 60 };
const byId = (id) => document.getElementById(id);

// Fallback-Daten (nur für den Fall, dass JSON mal nicht lädt)
const fallbackData = {
  stats: { members: 18, teams: 1, trainings_per_week: 2 },
  gallery: [],
  news: [
    { date: "2025-10-25", title: "Eindeutiger Sieg gegen DJK Kleinenbroich!", text: "3:0 gegen den DJK – starke Teamleistung." },
    { date: "2025-10-25", title: "Comeback einer Legende!", text: "Unser lang verletzter Spieler David Salai feierte sein Comeback!" }
  ],
  schedule: [
    { date: "2025-11-02", opponent: "Eintracht Spontent IV", place: "Pestalozzistraße 3a, 41564 Kaarst", time: "14:30", info: "Liga – Spieltag 5" }
  ]
};

async function loadSiteData() {
  const bust = `?t=${Date.now()}`;
  try {
    const res = await fetch(`data/site.json${bust}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`site.json HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("Nutze Fallback-Daten:", e.message);
    return fallbackData;
  }
}

/* ---------- RENDER ---------- */
function renderStats(stats = {}) {
  const { members = "-", teams = "-", trainings_per_week = "-" } = stats;
  const m = byId("stat-members"), t = byId("stat-teams"), tr = byId("stat-train");
  if (m) m.textContent = members;
  if (t) t.textContent = teams;
  if (tr) tr.textContent = trainings_per_week;
}

function renderGallery(images = []) {
  const wrap = byId("gallery");
  if (!wrap) return;
  wrap.innerHTML = "";
  images.slice(0, 6).forEach((src, i) => {
    const a = document.createElement("a");
    a.href = src; a.target = "_blank"; a.rel = "noopener";
    a.className = "block overflow-hidden rounded-2xl border bg-white";
    a.innerHTML = `<img src="${src}" alt="Volleyball Bild ${i+1}" class="w-full h-40 md:h-56 object-cover transform hover:scale-105 transition" loading="lazy">`;
    wrap.appendChild(a);
  });
}

function renderNews(news) {
  const list = byId("news-list");
  if (!list) return;
  list.innerHTML = "";
  const now = new Date();
  let items = [...news].sort((a, b) => b.date.localeCompare(a.date));
  if (NEWS_SETTINGS.SHOW_ONLY_LATEST) items = items.slice(0, 1);
  else if (NEWS_SETTINGS.RETENTION_DAYS) {
    items = items.filter(n => (now - new Date(n.date)) / 86400000 <= NEWS_SETTINGS.RETENTION_DAYS);
  }
  items.forEach((n) => {
    const li = document.createElement("li");
    li.className = "rounded-2xl border border-blue-100 bg-white p-4";
    li.innerHTML = `
      <div class="text-xs text-blue-600">${new Date(n.date).toLocaleDateString("de-DE")}</div>
      <div class="font-semibold">${n.title}</div>
      <p class="text-sm text-gray-700">${n.text}</p>
    `;
    list.appendChild(li);
  });
}

function renderSchedule(schedule) {
  const tbody = byId("schedule");
  if (!tbody) return;
  tbody.innerHTML = "";
  schedule.sort((a, b) => a.date.localeCompare(b.date)).forEach((ev) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${new Date(ev.date).toLocaleDateString("de-DE")}</td>
      <td class="p-3">${ev.opponent || "-"}</td>
      <td class="p-3">${ev.place || "-"}</td>
      <td class="p-3">${ev.time || "-"}</td>
      <td class="p-3">${ev.info || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------- FORM DEMO ---------- */
function setupFormDemo() {
  const form = document.getElementById("tryout-form");
  const fake = document.getElementById("fakeSubmit");
  const skill = document.getElementById("skill");
  const teamDetails = document.getElementById("team-details");
  const alert = document.getElementById("formAlert");
  if (!form) return;

  const toggle = () => {
    const show = skill.value === "Ich spiele bereits im Team";
    teamDetails.classList.toggle("hidden", !show);
    form.querySelector('[name="current_team"]').required = show;
    form.querySelector('[name="league"]').required = show;
  };
  skill?.addEventListener("change", toggle);
  toggle();

  fake?.addEventListener("click", () => {
    alert.textContent = "✅ Test erfolgreich! (Formular wird später final angebunden)";
    alert.className = "text-green-700 text-sm mt-2";
    alert.classList.remove("hidden");
    form.reset();
    toggle();
  });
}

function initFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- INIT ---------- */
(async function init() {
  initFooterYear();
  setupFormDemo();
  const data = await loadSiteData();
  renderStats(data.stats);
  renderGallery(data.gallery);
  renderNews(data.news || []);
  renderSchedule(data.schedule || []);
})();
