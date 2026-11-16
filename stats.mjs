import {summarizeField,renderFieldReport,contactRates} from './field-report.mjs?v=20';
import {positions,positionLabel} from './model.mjs?v=19';
import {analyze,selectMatches,sortedPlayers,positive,negative,seasonOf,seasonLabel} from './analytics.mjs?v=19';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(n);
const percent=(n,total)=>total?fmt(n/total*100)+' %':'—';
const option=(value,label,current)=>'<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(label)+'</option>';
const metric=(n,partial=false)=>partial?(n?fmt(n)+'<sup title="Historische Werte unvollständig">*</sup>':'<span class="missing" title="Keine vollständigen Spielerwerte erfasst">—</span>'):fmt(n);
const columns={
 overview:[['kills','Kills',['Kill']],['aces','Asse',['Ass']],['blocks','Blocks',['Blockpunkt']],['errors','Fehler',negative],['points','MVP',[]]],
 positive:positive.map((c,i)=>[c,['Kills','Asse','Blockpunkte','Gute Annahme','Gute Abwehr','Gute Sicherung'][i],[c]]),
 errors:negative.map((c,i)=>[c,['Angriff','Aufschlag','Annahme','Abwehr','Sicherung','Annahme / Abwehr¹','Zuspiel','Block','Rückball'][i],[c]])
};

function playerCards(a,field,{group='overview',sort='kills'}={}){
 const cols=columns[group]||columns.overview,rows=sortedPlayers(a.rows,sort);
 const cards=rows.map((r,i)=>{
  const counts=cols.map(([key,label,cats])=>{
   const value=key in r?r[key]:r.actions[key]||0;
   return `<div><dt>${label}</dt><dd>${metric(value,cats.length&&a.partial(r.name,cats))}</dd></div>`;
  }).join('');
  const rates=contactRates(field.players.get(r.name));
  const share=a.kills&&!a.partial(r.name,['Kill'])?`<p class="share-line"><b>${percent(r.kills,a.kills)}</b> der erfassten Team-Kills · ${r.kills} von ${a.kills}</p>`:'';
  return `<details class="player-card" data-name="${esc(r.name)}"${i===0?' open':''}><summary><span>${esc(r.name)}</span><small>${metric(r.kills,a.partial(r.name,['Kill']))} Kills · ${metric(r.errors,a.partial(r.name,negative))} Fehler</small></summary><div class="player-body">${share}${rates?'<h3>Quoten aus dem Feldtracking</h3>'+rates:''}<dl class="stat-values">${counts}</dl></div></details>`;
 }).join('');
 return `<div class="player-list">${cards}</div><p class="table-note">— = Spielerwerte nicht erfasst. * = historische Werte unvollständig.${group==='errors'?' ¹ Historisch gemeinsam erfasste Annahme- und Abwehrfehler.':''}</p>${a.unassigned?'<div class="unassigned"><b>'+a.unassigned+' weitere Teamfehler</b><span>Keinem Spieler zugeordnet</span></div>':''}`;
}
function coverage(a){
 return '<div class="data-context"><div><span class="context-dot '+(a.notes.length?'limited':'')+'"></span><b>'+(a.notes.length?'Historische Daten mit Lücken':'Nur beobachtete Aktionen')+'</b><span>'+a.selected.length+' '+(a.selected.length===1?'Spieltag':'Spieltage')+' · '+a.setCount+' '+(a.setCount===1?'Satz':'Sätze')+'</span></div><p>'+(a.notes.length?'Die Zahlen zeigen das erfasste Protokoll. Fehlende Werte sind keine Nullwerte.':'Die Zahlen beschreiben das Scouting-Protokoll; sie ersetzen keine vollständige Erfassung aller Ballkontakte.')+'</p>'+(a.notes.length?'<details><summary>Datenlücken ansehen</summary>'+a.notes.map(n=>'<div class="coverage-line"><b>'+esc(n.label)+'</b><span>'+esc(n.text)+'</span></div>').join('')+'</details>':'')+'</div>';
}
function errorPanel(a){
 return '<section class="analysis-section"><div class="section-heading"><div><span class="eyebrow">Wo Punkte verloren gehen</span><h2>Fehler im Team</h2></div><span class="number-tag">'+a.errorCount+' erfasst</span></div>'+(a.errorCount?'<div class="error-distribution">'+a.errorRows.filter(r=>r.total).map(r=>'<div class="error-distribution-row"><div class="row"><b>'+esc(r.label)+'</b><span><strong>'+r.total+' von '+a.errorCount+'</strong> <small>· '+percent(r.total,a.errorCount)+'</small></span></div><div class="error-track"><span style="width:'+r.total/a.errorCount*100+'%"></span></div><small>'+r.assigned+' Spielern zugeordnet · '+r.unassigned+' ohne Zuordnung</small></div>').join('')+'</div><p class="table-note">Anteile beziehen sich auf die '+a.errorCount+' erfassten Fehler. Das ist keine Fehlerquote pro Versuch oder Ballkontakt.</p>':'<p class="analysis-empty">Keine Fehler im Protokoll dieser Auswahl. Bei historischen Lücken bedeutet das nicht, dass keine Fehler passiert sind.</p>')+'</section>';
}
function setterPanel(a){
 const pos=positions;return '<section class="analysis-section"><div class="section-heading"><div><span class="eyebrow">Wohin der Ball geht</span><h2>Zuspielverteilung</h2></div><span class="number-tag">'+a.setterCount+' erfasst</span></div><div class="distribution-court"><span class="court-net">NETZ</span>'+pos.map(p=>'<div class="court-position court-pos-'+p+'"><small>Position '+positionLabel(p)+'</small><b>'+(a.t.pos[p]||0)+'</b><span>'+percent(a.t.pos[p]||0,a.setterCount)+'</span></div>').join('')+'</div><p class="table-note">Anteil der erfassten Zuspiele mit Zielposition. Im neuen Feldtracking zählen hier nur Zuspiele des markierten Zuspielers. Position 2 und Position 2 Hinterfeld werden getrennt gezählt. Keine Erfolgsquote der Angriffe.</p></section>';
}
function insights(a){
 const topError=a.errorRows[0],topKill=sortedPlayers(a.rows,'kills')[0],topPlayerError=sortedPlayers(a.rows,'errors')[0];
 return '<div class="analysis-insights">'+(a.errorCount?'<div><span class="insight-label">Größter Fehlerbereich</span><h3>'+esc(topError.label)+'</h3><p><b>'+topError.total+' Fehler · '+percent(topError.total,a.errorCount)+'</b> der erfassten Teamfehler.</p></div>':'<div><span class="insight-label">Fehlerbild</span><h3>Noch keine Fehlerdaten</h3><p>Für eine Problemanalyse müssen Fehler erfasst werden.</p></div>')+(topPlayerError?.errors?'<div><span class="insight-label">Meiste zugeordnete Fehler</span><h3>'+esc(topPlayerError.name)+'</h3><p><b>'+topPlayerError.errors+' erfasst</b>. Ohne Anzahl der Versuche lässt sich daraus keine individuelle Fehlerquote ableiten.</p></div>':a.unassigned?'<div><span class="insight-label">Spielerzuordnung fehlt</span><h3>'+a.unassigned+' Teamfehler</h3><p>Historische Fehler sind keinem Spieler zugeordnet. Eine Aussage darüber, wer sie verursacht hat, ist nicht möglich.</p></div>':'<div><span class="insight-label">Spielerfehler</span><h3>Noch keine zugeordnet</h3><p>Hier erscheinen Auffälligkeiten, sobald Spielerfehler erfasst wurden.</p></div>')+(topKill?.kills?'<div><span class="insight-label">Meiste erfasste Kills</span><h3>'+esc(topKill.name)+'</h3><p><b>'+topKill.kills+' Kills</b>. Absolute Anzahl; Angriffsversuche und Einsatzumfang fehlen für einen fairen Quotenvergleich.</p></div>':'')+'</div>';
}
function ratePanel(){return '<div class="rate-explainer"><span class="rate-symbol">%</span><div><h3>Echte Fehlerquote: noch nicht berechenbar</h3><p>Dafür fehlen die vollständigen Versuche je Aktionsart. Beispiel: Aufschlagfehler ÷ alle Aufschläge. Für diese Auswahl sind keine einzelnen Feldkontakte mit Versuchszahlen protokolliert.</p></div><span class="rate-value">—</span></div>'}

function setTable(a){
 const rows=a.setRows.map(r=>{
  const partial=a.notes.some(n=>n.label===r.date+' · '+r.label+' · Satz '+r.number);
  const cells=[['Kills',r.kills],['Asse',metric(r.aces,partial)],['Blockpunkte',metric(r.blocks,partial)],['Spielerfehler',metric(r.assigned,!r.coverage?.startsWith('Live erfasst'))],['Fehler ohne Zuordnung',metric(r.unassigned,r.errorsMissing)],['Fehler gesamt',metric(r.errors,r.errorsMissing||r.errorsPartial)],['Zuspiele',r.setters]];
  return `<article class="set-card"><small>${esc(r.date+' · '+r.label)}</small><h3>Satz ${r.number}</h3><dl class="stat-values">${cells.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')}</dl></article>`;
 });
 return '<section class="analysis-section"><h2>Satz für Satz</h2><div class="set-cards">'+rows.join('')+'</div><p class="table-note">— = keine ausreichenden Werte erfasst. * = unvollständig.</p></section>';
}
export function renderStats(db,state){
 const {season='all',matchId='all',setIndex='all',view='team',group='overview',sort='kills'}=state;
 const available=db.matches.filter(m=>!m.deletedAt),seasons=[...new Set(available.map(m=>seasonOf(m.date)))].sort().reverse(),scoped=selectMatches(available,{season}),filtered=selectMatches(available,{season,matchId,setIndex}),a=analyze(filtered,db.players,db.weights),maxSets=Math.max(0,...selectMatches(available,{season,matchId}).map(m=>m.sets.length));
 const field=summarizeField(filtered);
 const game=matchId==='all'?null:filtered[0];
 const title=game?'Gegen '+esc(game.opponent):season==='all'?'Auswertung':'Saison '+esc(seasonLabel(season));
 const selection=[season==='all'?'Alle Saisons':seasonLabel(season),game?game.opponent:'Alle Spieltage',setIndex==='all'?'Alle Sätze':'Satz '+(Number(setIndex)+1)].map(esc).join(' · ');
 const scores=game?.sets.filter(s=>s.score?.length===2&&s.score.every(v=>v!==''&&v!=null)).map(s=>'<span>Satz '+s.number+' <b>'+esc(s.score.join(' : '))+'</b></span>').join('')||'';
 let html='<div class="analysis-header"><span class="eyebrow">SG Kaarst · Spielanalyse</span><h1>'+title+'</h1>'+(scores?'<div class="report-scores">'+scores+'</div>':'')+'</div><details id="stats-filters"><summary><b>Filter</b><span>'+selection+'</span></summary><div class="analysis-filters"><div><label for="season-filter">Saison</label><select id="season-filter">'+option('all','Alle Saisons',season)+seasons.map(y=>option(y,seasonLabel(y),season)).join('')+'</select></div><div><label for="filter">Spieltag</label><select id="filter">'+option('all','Alle Spieltage',matchId)+scoped.map(m=>option(m.id,m.date+' · '+m.opponent,matchId)).join('')+'</select></div><div><label for="setfilter">Satz</label><select id="setfilter">'+option('all','Alle Sätze',setIndex)+Array.from({length:maxSets},(_,i)=>option(String(i),'Satz '+(i+1),setIndex)).join('')+'</select></div></div></details><div class="analysis-tabs" role="group" aria-label="Auswertungsansicht">'+[['team','Team'],['players','Spieler'],['sets','Satzvergleich']].map(([v,label])=>'<button data-stats-view="'+v+'" aria-pressed="'+(view===v)+'" class="'+(view===v?'active':'')+'">'+label+'</button>').join('')+'</div>';
 if(!a.setCount)return html+'<div class="analysis-empty"><h2>Noch keine Daten für diese Auswahl</h2><p>Wähle einen anderen Spieltag oder erfasse Aktionen im Live-Modus.</p></div>';
 if(view==='team')html+='<div class="summary-strip">'+[['Kills',a.kills,'erfolgreiche Angriffe'],['Direkte Punkte',a.points,'Kills, Asse, Blocks und Rückbälle'],['Fehler',a.errorCount,'erfasst · mit Datenlücken'],['Zuspiele',a.setterCount,'nach Position']].map(([label,value,sub])=>'<div><span>'+label+'</span><b>'+fmt(value)+'</b><small>'+(label==='Fehler'?(a.notes.length?sub:'erfasste Spielerfehler'):sub)+'</small></div>').join('')+'</div>';
 if(view==='team')html+=renderFieldReport(field);
 if(view==='team')html+=(field.setCount?'':insights(a))+'<div class="analysis-grid">'+errorPanel(a)+setterPanel(a)+'</div>'+ (field.setCount?'':ratePanel())+'<button class="players-jump" data-stats-view="players">Spieler einzeln ansehen →</button>';
 if(view==='players')html+='<section class="analysis-section"><div class="section-heading"><div><span class="eyebrow">Individuelle Aktionen</span><h2>Spielervergleich</h2></div><div><label for="player-sort">Sortieren nach</label><select id="player-sort">'+[['kills','Kills'],['errors','Erfasste Fehler'],['mvp','MVP-Punkte'],['name','Name']].map(([v,l])=>option(v,l,sort)).join('')+'</select></div></div><div class="table-groups" role="group" aria-label="Aktionsgruppe">'+[['overview','Überblick'],['positive','Gute Aktionen'],['errors','Fehler']].map(([v,l])=>'<button data-stats-group="'+v+'" aria-pressed="'+(group===v)+'" class="'+(group===v?'active':'')+'">'+l+'</button>').join('')+'</div>'+playerCards(a,field,{group,sort})+'</section>';
 if(view==='sets')html+=setTable(a)+ (field.setCount?'':ratePanel());
 return html+coverage(a)+'<div class="analysis-export"><div><b>Deine Auswertung mitnehmen</b><small>Aktuelle Filter werden berücksichtigt.</small></div><button id="csv-export">Spielertabelle · CSV</button><button id="report">Daten · JSON</button></div>';
}
