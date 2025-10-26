const byId = (id) => document.getElementById(id);
const formatDE = (d) => new Date(d).toLocaleDateString("de-DE");

async function loadSiteData() {
  const res = await fetch(`data/site.json?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(res.status);
  return await res.json();
}

/* -------- Stats mit CountUp ---------- */
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

/* -------- Teams ---------- */
function renderTeams(teams) {
  const grid = byId("teams-grid");
  grid.innerHTML = "";
  teams.forEach((t, i) => {
    const a = document.createElement("a");
    a.href = t.href || "#";
    a.className =
      "group overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition fade-up reveal " +
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

/* -------- News ---------- */
function renderNews(news) {
  const list = byId("news-list");
  list.innerHTML = "";
  [...news]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((n, i) => {
      const li = document.createElement("li");
      li.className =
        "rounded-2xl border border-blue-100 bg-white p-5 fade-up reveal " +
        (i % 3 === 1 ? "delay-1" : i % 3 === 2 ? "delay-2" : "");
      li.innerHTML = `
        <div class="text-xs text-blue-600">${formatDE(n.date)}</div>
        <div class="font-semibold mt-1">${n.title}</div>
        <p class="text-sm text-gray-700 mt-1">${n.text}</p>
      `;
      list.appendChild(li);
    });
}

/* -------- Icons (inline SVG) ---------- */
const IcoClock = `<svg class="w-4 h-4 mr-1 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M12 7v5l3 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const IcoPin   = `<svg class="w-4 h-4 mr-1 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" stroke-width="2"/><circle cx="12" cy="11" r="3" stroke-width="2"/></svg>`;

/* -------- Termine als Karten mit Hover/Icons ---------- */
function renderSchedule(schedule) {
  const wrap = byId("schedule-cards");
  wrap.innerHTML = "";
  schedule
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s, i) => {
      const date = new Date(s.date);
      const day = date.getDate();
      const mon = date.toLocaleString("de-DE", { month: "short" });
      const isHome = /kaarst|pestalozzi/i.test(s.place || "");

      const badgeCls = isHome
        ? "bg-green-100 text-green-700"
        : "bg-yellow-100 text-yellow-700";
      const badgeTxt = isHome ? "Heim" : "Auswärts";

      const card = document.createElement("div");
      card.className =
        "group rounded-2xl border bg-white p-4 flex gap-4 items-start fade-up reveal transition transform hover:-translate-y-0.5 hover:bg-blue-50 hover:border-blue-300 " +
        (i % 3 === 1 ? "delay-1" : i % 3 === 2 ? "delay-2" : "");

      card.innerHTML = `
        <div class="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-blue-100 text-blue-800">
          <div class="text-2xl font-extrabold leading-none">${day}</div>
          <div class="text-xs uppercase">${mon}</div>
        </div>

        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div class="font-semibold group-hover:text-blue-900">${s.opponent || "-"}</div>
            <span class="text-xs px-2 py-1 rounded-full ${badgeCls}">${badgeTxt}</span>
          </div>

          <div class="mt-1 text-sm text-gray-700 flex items-center">
            ${IcoPin} <span>${s.place || "-"}</span>
          </div>
          <div class="mt-1 text-sm text-gray-700 flex items-center">
            ${IcoClock} <span>${s.time || "-"}</span>
            ${s.info ? `<span class="ml-2 text-gray-500">· ${s.info}</span>` : ""}
          </div>
        </div>
      `;
      wrap.appendChild(card);
    });
}

/* -------- Reveal on Scroll ---------- */
function setupReveal() {
  const els = document.querySelectorAll('.reveal, .fade-up');
  if (!('IntersectionObserver' in window) || !els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}

/* -------- Dummy-Form ---------- */
function setupFormDemo() {
  const btn = byId("fakeSubmit");
  const alert = byId("formAlert");
  if (!btn || !alert) return;
  btn.addEventListener("click", () => {
    alert.textContent = "✅ Test erfolgreich! (Formular wird später final angebunden)";
    alert.className = "text-green-700 text-sm mt-2";
    alert.classList.remove("hidden");
  });
}

function initFooterYear() {
  const y = byId("year");
  if (y) y.textContent = new Date().getFullYear();
}

/* -------- Init ---------- */
(async function init() {
  initFooterYear();
  setupFormDemo();
  const data = await loadSiteData();
  renderStats(data.stats || {members:0,teams:0});
  renderTeams(data.teams || []);
  renderNews(data.news || []);
  renderSchedule(data.schedule || []);
  setupReveal();
})();
