import {canTrackDate} from './model.mjs?v=19';
import {snapshot,dashboardFixtures,linkCandidates} from './schedule.mjs?v=19';
import {analyze,selectMatches,seasonOf} from './analytics.mjs?v=19';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dateLabel=(date,options={day:'2-digit',month:'2-digit',year:'numeric'})=>{const d=new Date(date+'T12:00:00Z');return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',...options}).format(d):'Datum unbekannt'};
const dateChip=m=>'<div class="fixture-date"><b>'+dateLabel(m.date,{day:'2-digit'})+'</b><span>'+dateLabel(m.date,{month:'short'}).replace('.','')+'</span></div>';
export function safeWvvUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='ergebnisdienst.volleyball.nrw'?u.href:snapshot.source}catch{return snapshot.source}}
const sourceLink=(url,label)=>'<a target="_blank" rel="noopener" href="'+esc(safeWvvUrl(url))+'">'+label+' ↗</a>';
export function fixtureMeta(m){const f=m.official;if(!f)return '';return '<p class="fixture-meta">'+esc(dateLabel(m.date))+' · '+esc(f.time||'Uhrzeit offen')+' Uhr'+(f.timeMayBeDelayed===true?' · Beginn kann sich verschieben':f.timeMayBeDelayed===null?' · Beginn laut WVV':'')+'</p><p class="fixture-place">'+esc(f.venue||'Halle nicht angegeben')+'</p>'}
function fixtureAction(m,{admin,today,primary=false}){if(!admin)return '<button class="'+(primary?'primary':'')+'" data-fixture-detail="'+esc(m.id)+'">Spieldetails ansehen</button>';if(!canTrackDate(m.date,today))return '<button disabled>Tracking am '+esc(dateLabel(m.date))+'</button>';return '<button class="'+(primary?'primary':'')+'" data-fixture-start="'+esc(m.id)+'">'+(m.sets.length?'Live öffnen':'Aufstellung wählen')+' →</button>'}
export function fixtureCard(db,m,{admin=false,today}={}){const f=m.official;return '<article class="fixture-list-item">'+dateChip(m)+'<div><small>'+(f.isHost?'Gastgeber SG Kaarst':'Gastgeber '+esc(f.host||'offen'))+' · '+esc(f.time||'offen')+' Uhr'+(f.timeMayBeDelayed?' *':'')+'</small><h3>'+esc(m.opponent)+'</h3><p>'+esc(f.venue||'Halle offen')+'</p></div>'+fixtureAction(m,{admin,today})+'</article>'}

function leagueTable(){
 const rows=snapshot.standings.map(t=>`<tr class="${t.team==='SG Kaarst'?'own-club':''}"><td>${t.rank}</td><th scope="row">${esc(t.team)}</th><td>${t.played}</td><td>${t.wins}</td><td>${esc(t.sets)}</td><td><b>${t.points}</b></td></tr>`).join('');
 return `<section class="home-panel"><span class="eyebrow">Ligatabelle</span><h2>Bezirksklasse 16 Männer</h2><p class="source-note">Saison 2026/27 · Stand ${dateLabel(snapshot.checkedAt)}</p><table class="compact-league"><thead><tr><th scope="col">Pl.</th><th scope="col">Team</th><th scope="col" aria-label="Spiele">Sp.</th><th scope="col" aria-label="Siege">S</th><th scope="col">Sätze</th><th scope="col" aria-label="Punkte">Pkt.</th></tr></thead><tbody>${rows}</tbody></table><p class="source-note">Sp. = Spiele · S = Siege · Pkt. = Punkte</p>${sourceLink(snapshot.tableSource,'Aktuellen Stand beim WVV öffnen')}</section>`;
}
function latestResult(match){
 if(!match)return '';
 const {result,opponent,date}=match.official;
 return `<article class="home-fact"><small>Letztes Ligaergebnis · ${dateLabel(date)}</small><strong>${result.own}:${result.opponent} gegen ${esc(opponent)}</strong><span>${esc(result.setScores.map(s=>s.join(':')).join(' · '))}</span></article>`;
}
export function renderDashboard(db,today,{admin=false,page='overview'}={}){
 const {next,results,upcoming}=dashboardFixtures(db,today);
 const pages=[['overview','Übersicht'],['standings','Ligatabelle'],['news','Teamnews']];
 let html=`<div class="home-heading"><div><span class="eyebrow">SG Kaarst · Herren</span><h1>Teamzentrale</h1></div><small>${dateLabel(today,{weekday:'long',day:'numeric',month:'long'})}</small></div><div class="home-switch" role="group" aria-label="Bereich der Startseite">${pages.map(([id,label])=>`<button data-home-page="${id}" aria-pressed="${page===id}">${label}</button>`).join('')}</div>`;
 if(page==='standings')return html+leagueTable();
 if(page==='news'){
  const a=analyze(selectMatches(db.matches,{season:seasonOf(today)}),db.players,db.weights),issue=a.errorRows.find(r=>r.total);
  return html+`<section class="home-panel"><h2>Teamnews</h2><div class="home-facts">${latestResult(results[0])}<article class="home-fact"><small>Scouting · Saison ${esc(seasonOf(today))}/${String(Number(seasonOf(today))+1).slice(-2)}</small><strong>${issue?esc(issue.label):'Noch keine Fehler erfasst'}</strong><span>${issue?issue.total+' von '+a.errorCount+' protokollierten Teamfehlern.':''}</span><button data-go="stats">Zur Auswertung →</button></article></div><h3>Nächste Begegnungen</h3>${upcoming.slice(0,3).map(m=>fixtureCard(db,m,{admin,today})).join('')||'<p>Keine kommenden Begegnungen eingetragen.</p>'}<button data-go="matches">Alle Spieltage →</button></section>`;
 }
 const active=db.matches.find(m=>(!admin||m.id===db.current)&&!m.deletedAt&&!m.done&&m.sets.length&&canTrackDate(m.date,today));
 if(active)html+=`<div class="active-match"><div><b>${admin?'Tracking fortsetzen':'Spielstand ansehen'}</b><small>${esc(active.opponent)} · Satz ${active.sets.length}</small></div><button class="primary" ${admin?'data-fixture-start':'data-public-live'}="${esc(active.id)}">Spiel öffnen →</button></div>`;
 const early=admin&&db.matches.find(m=>m.id===db.current&&!m.deletedAt&&m.sets.length&&!canTrackDate(m.date,today));
 if(early)html+=`<div class="link-notice"><div><b>Vorzeitig gestartetes Tracking gesperrt</b><p>${esc(early.opponent)} · ${dateLabel(early.date)}</p></div><button data-reset-tracking="${esc(early.id)}">Tracking zurücksetzen</button></div>`;
 html+='<div class="home-feature-grid"><section class="home-game"><span class="eyebrow">Nächstes Ligaspiel</span>';
 if(next){
  const f=next.official;
  html+=`<h2>Gegen ${esc(next.opponent)}</h2><b>${dateLabel(next.date,{weekday:'short',day:'numeric',month:'long'})} · ${esc(f.time||'Zeit offen')}${f.time?' Uhr':''}${f.timeMayBeDelayed?'*':''}</b><p>${f.isHost?'Heimspiel':'Auswärts'} · ${esc(f.venue||'Halle offen')}</p><div class="next-actions">${fixtureAction(next,{admin,today,primary:true})}${admin?'<button data-fixture-detail="'+esc(next.id)+'">Spieldetails</button>':''}</div>${f.timeMayBeDelayed?'<small>* Beginn kann sich durch das vorherige Spiel verschieben.</small>':''}`;
 }else html+='<h2>Kein kommender Termin</h2><button data-go="matches">Zu den Spieltagen →</button>';
 const club=snapshot.standings.find(t=>t.team==='SG Kaarst');
 html+=`</section><div class="home-facts">${club?`<button class="home-fact rank-link" data-home-page="standings"><small>SG Kaarst · Ligatabelle</small><strong>Platz ${club.rank} <span>→</span></strong><span>${club.points} Punkte · ${club.wins} Siege · Stand ${dateLabel(snapshot.checkedAt)}</span></button>`:''}${latestResult(results[0])}</div></div>`;
 const unlinked=admin&&db.matches.find(m=>!m.deletedAt&&m.fixtureKey&&!m.sets.length&&linkCandidates(db,m).length);
 if(unlinked)html+=`<div class="link-notice"><div><b>Vorhandene Spieltage zuordnen</b><p>Ein WVV-Termin passt zu einer bereits erfassten Partie.</p></div><button data-fixture-detail="${esc(unlinked.id)}">Zuordnung prüfen →</button></div>`;
 return html;
}
