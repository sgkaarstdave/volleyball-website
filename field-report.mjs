const percent=(hits,total)=>total?Math.round(100*hits/total)+' %':'—';

export function summarizeField(matches){
  const team={},players=new Map();
  let setCount=0;
  for(const match of matches){
    if(match.deletedAt)continue;
    for(const set of match.sets){
      if(set.coverage!=='Live erfasst · Feldtracking')continue;
      setCount++;
      for(const [name,actions] of Object.entries(set.actions)){
        const row=players.get(name)||{};
        for(const [key,count] of Object.entries(actions)){
          if(!key.startsWith('Feld.')||!Number.isFinite(count))continue;
          const metric=key.slice(5);
          row[metric]=(row[metric]||0)+count;
          team[metric]=(team[metric]||0)+count;
        }
        players.set(name,row);
      }
    }
  }
  return {team,players,setCount};
}


const rateMetrics=[
 ['Killquote','kills','attacks','Angriffen'],['Angriffsfehler','attackErrors','attacks','Angriffen'],
 ['Assquote','aces','serves','Aufschlägen'],['Aufschlagfehler','serveErrors','serves','Aufschlägen'],
 ['Annahmefehler','receiveErrors','receptions','Annahmen'],['Annahme weitergespielt','receptionsPlayed','receptions','Annahmen'],['Zuspiel­fehler','setErrors','sets','Zuspielen'],
 ['Notzuspiel-Anteil','emergencySets','sets','Zuspielen'],['Annahme ungenau bestätigt','receptionsImprecise','receptions','Annahmen'],
 ['Blockpunkte','blocks','blockAttempts','Blockkontakten'],['Zuspiel weitergespielt','setsPlayed','sets','Zuspielen'],['Abwehrfehler','defenseErrors','defenses','Abwehraktionen']
];
export function contactRates(row={}){
 const cells=rateMetrics.filter(([,,attempt])=>row[attempt]>0).map(([label,outcome,attempt,unit])=>{
   const n=row[outcome]||0,total=row[attempt];
   return `<div><dt>${label}</dt><dd>${percent(n,total)}<small>${n} von ${total} ${unit}</small></dd></div>`;
 });
 return cells.length?'<dl class="stat-values contact-rates">'+cells.join('')+'</dl>':'';
}

export function renderFieldReport(report){
  if(!report.setCount)return '';
  const t=report.team;
  const phases=[
    ['Annahme',t.receiveErrors||0,t.receptions||0],
    ['Aufschlag',t.serveErrors||0,t.serves||0],
    ['Angriff',t.attackErrors||0,t.attacks||0],
    ['Zuspiel',t.setErrors||0,t.sets||0]
  ];
  const observations=[];
  const affected=phases.filter(([,errors,attempts])=>errors && attempts>=5).sort((a,b)=>b[1]/b[2]-a[1]/a[2]);
  if(affected.length){
    const [name,n,total]=affected[0];
    observations.push('Im Bereich '+name+' führten '+n+' von '+total+' erfassten Versuchen direkt zum Punkt für den Gegner ('+percent(n,total)+').');
  }
  if(t.receptionsImprecise)observations.push(t.receptionsImprecise+' '+(t.receptionsImprecise===1?'Annahme wurde':'Annahmen wurden')+' als ungenau bestätigt und trotzdem weitergespielt.');
  if(t.blockAttempts)observations.push((t.blocks||0)+' von '+t.blockAttempts+' Blockkontakten brachten direkt einen Punkt.');
  if(t.receptions && !t.receiveErrors)observations.push('Bei '+t.receptions+' erfassten Annahmen gab es keinen direkten Annahmefehler.');
  if(t.attacks)observations.push('Der Angriff brachte '+(t.kills||0)+' direkte Punkte aus '+t.attacks+' erfassten Versuchen.');
  const coverage=report.setCount+' '+(report.setCount===1?'Satz':'Sätze')+' mit Feldtracking';
  let html='<section class="field-report"><div class="field-report-head"><div><small>'+coverage+'</small><h2>Ballkontakte im Überblick</h2></div></div>';
  html+=contactRates(t)||'<p>Noch keine Ballkontakte mit Versuchen erfasst.</p>';
  if(observations.length)html+='<h3>Was in dieser Auswahl auffällt</h3><ul>'+observations.map(text=>'<li>'+text+'</li>').join('')+'</ul>';
  return html+'<p class="table-note">Die Quoten beziehen sich auf protokollierte Kontakte in der gewählten Auswahl. Zusätzliche Sätze mit Aktionstasten oder historischen Summen fließen nur in die Gesamtzahlen ein.</p></section>';
}
