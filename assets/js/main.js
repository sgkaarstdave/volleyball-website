// Helpers
const byId = (id) => document.getElementById(id);
const formatDE = (d) => new Date(d).toLocaleDateString("de-DE");

// Daten laden
async function loadSiteData() {
  const bust = `?t=${Date.now()}`;
  try {
    const res = await fetch(`data/site.json${bust}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`site.json HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("Fallback-Daten aktiv:", e.message);
    return {
      stats: { members: 18, teams: 3 },
      teams: [],
      news: [],
      schedule: []
    };
  }
}

/* ---------- Render: Stats (CountUp) ---------- */
function countUp(el, to, ms = 900) {
  if (!el) return;
  const start = performance.now();
  const from = 0;
  function tick(t) {
    const p = Math.min(1, (t - start) / ms);
    el.textContent = Math.round(from + (to - from) * p);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function renderStats(stats) {
  countUp(byId("stat-members"), Number(stats.members) || 0);
  countUp(byId("stat-teams"), Number(stats.teams) || 0);
}

/* ---------- Render: Teams-Karten ---------- */
function renderTeams(teams = []) {
  const grid = byId("teams-grid");
  if (!grid) return;
  grid.innerHTML = "";
  teams.slice(0, 3).forEach((t, i) => {
    const a = document.createElement("a");
    a.href = t.href || "#";
    a.className =
      "group overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition fade-up " +
      (i === 1 ? "delay-1" : i === 2 ? "delay-2" : "");
    a.innerHTML = `
      <div class="h-44 overflow-hidden">
        <img src="${t.image}" alt="${t.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition" loading="lazy">
      </div>
      <div class="p-4 flex items-center justify-between">
        <div class="font-semibold">${t.title}</div>
        <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Zum Team</span>
      </div>
    `;
    grid.appendChild(a);
  });
}

/* ---------- Render: News mit Animation ---------- */
function renderNews(news = []) {
  const list = byId("news-list");
  if (!list) return;
  list.innerHTML = "";
  const items = [...news].sort((a, b) => b.date.localeCompare(a.date));
  items.forEach((n, idx) => {
    const li = document.createElement("li");
    li.className =
      "rounded-2xl border border-blue-100 bg-white p-5 fade-up " +
      (idx % 3 === 1 ? "delay-1" : idx % 3 === 2 ? "delay-2" : "");
    li.innerHTML = `
      <div class="text-xs text-blue-600">${formatDE(n.date)}</div>
      <div class="font-semibold mt-1">${n.title}</div>
      <p class="text-sm text-gray-700 mt-1">${n.text}</p>
    `;
    list.appendChild(li);
  });
}

/* ---------- Render: Termine als Karten ---------- */
function renderSchedule(schedule = []) {
  const wrap = byId("schedule-cards");
  if (!wrap) return;
  wrap.innerHTML = "";
  schedule
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s, idx) => {
      const card = document.createElement("div");
      card.className =
        "rounded-2xl border bg-white p-4 flex gap-4 items-start fade-up " +
        (idx % 3 === 1 ? "delay-1" : idx % 3 === 2 ? "delay-2" : "");
      card.innerHTML = `
        <div class="flex flex-col items-center justify-center min-w-[82px] rounded-xl bg-blue-50 text-blue-800 px-3 py-2">
          <div class="text-2xl font-extrabold leading-none">${new Date(s.date).getDate()}</div>
          <div class="text-xs uppercase">${new Date(s.date).toLocaleString("de-DE",{month:"short"})}</div>
        </div>
        <div class="flex-1">
          <div class="font-semibold">${s.opponent || "-"}</div>
          <div class="text-sm text-gray-600">${s.place || "-"}</div>
          <div class="text-xs mt-1 text-gray-500">${s.info || ""}</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-semibold">${s.time || "-"}</div>
        </div>
      `;
      wrap.appendChild(card);
    });
}

/* ---------- Form Demo ---------- */
function setupFormDemo() {
  const form = byId("tryout-form");
  const fake = byId("fakeSubmit");
  const skill = byId("skill");
  const teamDetails = byId("team-details");
  const alert = byId("formAlert");
  if (!form) return;

  const toggle = () => {
    const show = skill.value === "Ich spiele bereits im Team";
    teamDetails.classList.toggle("hidden", !show);
    form.querySelector('[name="current_team"]').required = show;
    form.querySelector('[name="league"]').required = show;
  };
  skill.addEventListener("change", toggle);
  toggle();

  fake.addEventListener("click", () => {
    alert.textContent = "✅ Test erfolgreich! (Formular wird später final angebunden)";
    alert.className = "text-green-700 text-sm mt-2";
    alert.classList.remove("hidden");
    form.reset();
    toggle();
  });
}

/* ---------- Footer Jahr ---------- */
function initFooterYear() {
  const yearEl = byId("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- Init ---------- */
(async function init() {
  initFooterYear();
  setupFormDemo();
  const data = await loadSiteData();
  renderStats(data.stats);
  renderTeams(data.teams);
  renderNews(data.news);
  renderSchedule(data.schedule);
})();
