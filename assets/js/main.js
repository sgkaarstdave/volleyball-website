// Klein, klar, getrennt: rendert News & Termine aus /data/site.json
const NEWS_SETTINGS = { SHOW_ONLY_LATEST: false, RETENTION_DAYS: 60 };

const byId = (id) => document.getElementById(id);

// Fallback-Daten, falls fetch fehlschlägt (z.B. lokal)
const fallbackData = {
  news: [
    {
      date: "2025-10-25",
      title: "Eindeutiger Sieg gegen DJK Kleinenbroich!",
      text: "3:0 gegen den DJK – starke Teamleistung.",
    },
    {
      date: "2025-10-25",
      title: "Comeback einer Legende!",
      text: "Unser lang verletzter Spieler David Salai feierte sein Comeback!",
    },
  ],
  schedule: [
    {
      date: "2025-11-02",
      opponent: "Eintracht Spontent IV",
      place: "Pestalozzistraße 3a, 41564 Kaarst",
      time: "14:30",
      info: "Liga – Spieltag 5",
    },
  ],
};

async function loadSiteData() {
  try {
    const res = await fetch("data/site.json", { cache: "no-store" });
    if (!res.ok) throw new Error("site.json not found");
    return await res.json();
  } catch (e) {
    console.warn("Nutze Fallback-Daten:", e.message);
    return fallbackData;
  }
}

function renderNews(news) {
  const list = byId("news-list");
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
  skill.addEventListener("change", toggle);
  toggle();

  // Aktuell nur Demo – später mit Web3Forms finalisieren
  fake.addEventListener("click", () => {
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

(async function init() {
  initFooterYear();
  setupFormDemo();
  const data = await loadSiteData();
  renderNews(data.news || []);
  renderSchedule(data.schedule || []);
})();
