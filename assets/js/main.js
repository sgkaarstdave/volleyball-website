// Einstellungen
const NEWS_SETTINGS = { SHOW_ONLY_LATEST: false, RETENTION_DAYS: 60 };
const byId = (id) => document.getElementById(id);

// Fallback-Daten, falls site.json nicht geladen werden kann
const fallbackData = {
  news: [
    {
      date: "2025-10-25",
      title: "Eindeutiger Sieg gegen DJK Kleinenbroich!",
      text: "3:0 gegen den DJK – starke Teamleistung."
    },
    {
      date: "2025-10-25",
      title: "Comeback einer Legende!",
      text: "Unser lang verletzter Spieler David Salai feierte sein Comeback!"
    }
  ],
  schedule: [
    {
      date: "2025-11-02",
      opponent: "Eintracht Spontent IV",
      place: "Pestalozzistraße 3a, 41564 Kaarst",
      time: "14:30",
      info: "Liga – Spieltag 5"
    }
  ]
};

function showTopBanner(msg) {
  let el = document.getElementById("top-debug");
  if (!el) {
    el = document.createElement("div");
    el.id = "top-debug";
    el.style.cssText =
      "position:sticky;top:0;z-index:9999;background:#fee;border-bottom:1px solid #fca;padding:.5rem 1rem;color:#991b1b;font:14px/1.4 system-ui";
    document.body.prepend(el);
  }
  el.textContent = msg;
}

async function loadSiteData() {
  const bust = `?t=${Date.now()}`;
  const url = `data/site.json${bust}`;
  console.log("[site.json] lade:", url);
  try {
    const res = await fetch(url, { cache: "no-store" });
    console.log("[site.json] status:", res.status);
    if (!res.ok) throw new Error(`site.json HTTP ${res.status}`);
    const json = await res.json();
    console.log("[site.json] ok:", json);
    return json;
  } catch (e) {
    console.warn("Nutze Fallback-Daten:", e.message);
    showTopBanner("Hinweis: site.json nicht geladen – es werden Fallback-Daten angezeigt.");
    return fallbackData;
  }
}

function renderNews(news) {
  const list = byId("news-list");
  if (!list) return;
  list.innerHTML = "";
  const now = new Date();

  let items = [...news].sort((a, b) => b.date.localeCompare(a.date));
  if (NEWS_SETTINGS.SHOW_ONLY_LATEST) {
    items = items.slice(0, 1);
  } else if (NEWS_SETTINGS.RETENTION_DAYS) {
    items = items.filter(
      (n) => (now - new Date(n.date)) / (1000 * 60 * 60 * 24) <= NEWS_SETTINGS.RETENTION_DAYS
    );
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

  schedule
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((ev) => {
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

  if (fake) {
    fake.addEventListener("click", () => {
      alert.textContent = "✅ Test erfolgreich! (Formular wird später final angebunden)";
      alert.className = "text-green-700 text-sm mt-2";
      alert.classList.remove("hidden");
      form.reset();
      toggle();
    });
  }
}

function initFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

(async function init() {
  console.log("[init] start");
  initFooterYear();
  setupFormDemo();
  const data = await loadSiteData();
  renderNews(data.news || []);
  renderSchedule(data.schedule || []);
  console.log("[init] done");
})();
