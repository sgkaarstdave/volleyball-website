(function(){
  const $ = (s)=>document.querySelector(s);
  const byId = (id)=>document.getElementById(id);
  const qp = new URLSearchParams(location.search);
  const slug = qp.get('team'); // z.B. herren, damen, mixed
  byId('year').textContent = new Date().getFullYear();

  if(!slug){
    renderError("Kein Team angegeben. Beispiel: team.html?team=herren");
    return;
  }

  fetch(`data/teams/${slug}.json?t=${Date.now()}`, { cache: "no-store" })
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => renderTeam(data))
    .catch(() => renderError("Team nicht gefunden. Prüfe die URL oder die JSON-Datei."));
  
  function renderTeam(team){
    // Hero
    const hero = byId('hero');
    hero.style.backgroundImage = `url('${team.hero}'), url('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=2000&q=80')`;
    byId('hero-title').textContent = `SG Kaarst – ${team.name}`;
    byId('hero-intro').textContent = team.intro || "";

    // Roster
    const root = byId('roster');
    (team.positions || []).forEach(pos => {
      const sec = document.createElement('section');
      sec.className = "mb-10";
      sec.innerHTML = `
        <h2 class="text-xl font-bold">${pos.title}</h2>
        <div class="accent"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"></div>`;
      root.appendChild(sec);

      const grid = sec.querySelector('.grid');
      (pos.players || []).forEach(p => grid.appendChild(playerCard(p, pos.title)));
    });
  }

  function playerCard(p, positionTitle){
    const div = document.createElement('div');
    div.className = "rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition";
    div.innerHTML = `
      <div class="h-64 bg-gray-100">
        <img src="${p.img || 'https://placehold.co/400x500?text=Spieler/in'}" alt="${p.name || ''}" class="w-full h-full object-cover">
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold">${p.name || ''}</h4>
          <span class="badge bg-blue-100 text-blue-700">#${p.nr || '-'}</span>
        </div>
        <p class="text-xs mt-1 text-gray-500">${positionTitle}</p>
        <dl class="mt-3 text-sm">
          <div class="flex justify-between"><dt class="text-gray-500">Größe</dt><dd class="font-medium">${p.height || '-'}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Geburtstag</dt><dd class="font-medium">${formatDate(p.birth) || '-'}</dd></div>
        </dl>
      </div>`;
    return div;
  }

  function formatDate(iso){
    if(!iso) return "";
    try { return new Date(iso).toLocaleDateString("de-DE"); } catch(e){ return iso; }
  }

  function renderError(msg){
    const root = byId('roster');
    root.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
        ${msg}
      </div>`;
  }
})();
