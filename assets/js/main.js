const byId = (id) => document.getElementById(id);
const formatDE = (d) => new Date(d).toLocaleDateString("de-DE");

async function loadSiteData() {
  const res = await fetch(`data/site.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(res.status);
  return await res.json();
}

function countUp(el, to, ms = 900) {
  const start = performance.now();
  function tick(t) {
    const p = Math.min(1, (t - start) / ms);
    el.textContent = Math.round(to * p);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderStats(stats) {
  countUp(byId("stat-members"), stats.members);
  countUp(byId("stat-teams"), stats.teams);
}

function renderTeams(teams) {
  const grid = byId("teams-grid");
  grid.innerHTML = "";
  teams.forEach((t, i) => {
    const a = document.createElement("a");
    a.href = t.href;
    a.className =
      "group overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition fade-up reveal " +
      (i === 1 ? "delay-1" : i === 2 ? "delay-2" : "");
    a.innerHTML = `
      <div class="h-44 overflow-hidden">
        <img src="${t.image}" alt="${t.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition" />
      </div>
      <div class="p-4 flex items-center justify-between">
        <div class="font-semibold">${t.title}</div>
        <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Zum Team</span>
      </div>`;
    grid.appendChild(a);
  });
}

function renderNews(news) {
  const list = byId("news-list");
  list.innerHTML = "";
  news.forEach((n, i) => {
    const li = document.createElement("li");
    li.className =
      "rounded-2xl border border-blue-100 bg-white p-5 fade-up reveal " +
      (i % 3 === 1 ? "delay-1" : i % 3 === 2 ? "delay-2" : "");
    li.innerHTML = `
      <div class="text-xs text-blue-600">${formatDE(n.date)}</div>
      <div class="font-semibold mt-1">${n.title}</div>
      <p class="text-sm text-gray-700 mt-1">${n.text}</p>`;
    list.appendChild(li);
  });
}

function renderSchedule(schedule) {
  const wrap = byId("schedule-cards");
  wrap.innerHTML = "";
  schedule.forEach((s, i) => {
    const card = document.createElement("div");
    card.className =
      "rounded-2xl border bg-white p-4 flex gap-4 items-start fade-up reveal " +
      (i % 3 === 1 ? "delay-1" : i % 3 === 2 ? "delay-2" : "");
    card.innerHTML = `
      <div class="flex flex-col items-center justify-center min-w-[82px] rounded-xl bg-blue-50 text-blue-800 px-3 py-2">
        <div class="text-2xl font-extrabold">${new Date(s.date).getDate()}</div>
        <div class="text-xs uppercase">${new Date(s.date).toLocaleString("de-DE",{month:"short"})}</div>
      </div>
      <div class="flex-1">
        <div class="font-semibold">${s.opponent}</div>
        <div class="text-sm text-gray-600">${s.place}</div>
        <div class="text-xs mt-1 text-gray-500">${s.info}</div>
      </div>
      <div class="text-right text-sm font-semibold">${s.time}</div>`;
    wrap.appendChild(card);
  });
}

function setupReveal() {
  const els = document.querySelectorAll('.reveal, .fade-up');
  if (!('IntersectionObserver' in window)) return;
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

function setupFormDemo() {
  const fake = byId("fakeSubmit");
  const alert = byId("formAlert");
  fake.addEventListener("click", () => {
    alert.textContent = "✅ Test erfolgreich! (Formular wird später final angebunden)";
    alert.className = "text-green-700 text-sm mt-2";
    alert.classList.remove("hidden");
  });
}

function initFooterYear() {
  const y = byId("year");
  if (y) y.textContent = new Date().getFullYear();
}

(async function init() {
  initFooterYear();
  setupFormDemo();
  const data = await loadSiteData();
  renderStats(data.stats);
  renderTeams(data.teams);
  renderNews(data.news);
  renderSchedule(data.schedule);
  setupReveal();
})();
