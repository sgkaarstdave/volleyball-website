import {totals,defaultWeights} from './model.mjs?v=15';
export const positive=['Kill','Ass','Blockpunkt','Gute Annahme','Gute Abwehr','Gute Sicherung'];
export const negative=['Angriffsfehler','Aufschlagfehler','Annahmefehler','Abwehrfehler','Sicherungsfehler','Annahme/Abwehr-Fehler'];
export const errorLabels=['Angriff','Aufschlag','Annahme','Abwehr','Sicherung','Annahme / Abwehr · historisch'];
const sum=a=>a.reduce((n,v)=>n+v,0);
export const canonicalCategory=c=>c==='Angabefehler'?'Aufschlagfehler':c;
export function seasonOf(date){const y=Number(date?.slice(0,4)),m=Number(date?.slice(5,7));return y&&m?String(m>=7?y:y-1):'unknown'}
export const seasonLabel=y=>y==='unknown'?'Datum unbekannt':y+'/'+String(Number(y)+1).slice(-2);
export function selectMatches(matches,{season='all',matchId='all',setIndex='all'}={}){return matches.filter(m=>!m.deletedAt&&(season==='all'||seasonOf(m.date)===season)&&(matchId==='all'||m.id===matchId)).map(m=>({...m,sets:m.sets.map((s,i)=>({...s,number:i+1})).filter((s,i)=>setIndex==='all'||String(i)===String(setIndex))}));}
function normalize(actions){const a={};for(const[c,n]of Object.entries(actions||{})){const key=canonicalCategory(c);a[key]=(a[key]||0)+n}return a}
export function analyze(matches,players=[],weights=defaultWeights){
 const selected=matches.filter(m=>!m.deletedAt&&m.sets.length),t=totals(selected),sets=selected.flatMap(m=>m.sets.map((s,i)=>({m,s,number:s.number||i+1}))),actions=Object.fromEntries(Object.entries(t.actions).map(([n,a])=>[n,normalize(a)]));
 const unknown=normalize(t.teamErrors),assigned={};for(const a of Object.values(actions))for(const[c,n]of Object.entries(a))assigned[c]=(assigned[c]||0)+n;
 const rows=[...new Set([...players,...Object.keys(actions)])].map(name=>{const a=actions[name]||{},original=t.actions[name]||{};return {name,actions:a,kills:a.Kill||0,aces:a.Ass||0,blocks:a.Blockpunkt||0,errors:sum(negative.map(c=>a[c]||0)),points:sum(Object.entries(original).map(([c,n])=>n*(weights[c]??defaultWeights[c]??0)))}});
 const errorRows=negative.map((category,i)=>({category,label:errorLabels[i],assigned:assigned[category]||0,unassigned:unknown[category]||0,total:(assigned[category]||0)+(unknown[category]||0)})).sort((a,b)=>b.total-a.total);
 const errorCount=sum(errorRows.map(r=>r.total)),unassigned=sum(errorRows.map(r=>r.unassigned)),points=sum(['Kill','Ass','Blockpunkt'].map(c=>assigned[c]||0)),positiveCount=sum(positive.map(c=>assigned[c]||0));
 const notes=sets.filter(({s})=>!s.coverage?.startsWith('Live erfasst')).map(({m,s,number})=>({label:m.date+' · '+m.opponent+' · Satz '+number,text:s.coverage||'Vollständigkeit unbekannt'}));
 function partial(name,cats){return sets.some(({s})=>!s.coverage?.startsWith('Live erfasst')&&cats.some(c=>!Object.keys(s.actions[name]||{}).some(k=>canonicalCategory(k)===c)))}
 const setRows=sets.map(({m,s,number})=>{const one=analyzeSet(m,s);return {id:m.id,label:m.opponent,date:m.date,number,coverage:s.coverage,...one}});
 return {selected,t,sets,rows,errorRows,errorCount,unassigned,points,positiveCount,kills:assigned.Kill||0,aces:assigned.Ass||0,blocks:assigned.Blockpunkt||0,setCount:sets.length,setterCount:sum(Object.values(t.pos)),notes,partial,setRows,actualErrorRate:null};
}
function analyzeSet(m,s){const t=totals([{sets:[s]}]);let kills=0,aces=0,blocks=0,assigned=0;for(const a of Object.values(t.actions)){const n=normalize(a);kills+=n.Kill||0;aces+=n.Ass||0;blocks+=n.Blockpunkt||0;assigned+=sum(negative.map(c=>n[c]||0))}const unassigned=sum(Object.values(t.teamErrors));return {kills,aces,blocks,assigned,unassigned,errors:assigned+unassigned,setters:sum(Object.values(t.pos)),errorsMissing:m.historical&&s.coverage?.includes('Fehler nicht erfasst')&&!assigned&&!unassigned,errorsPartial:!!s.coverage?.includes('Angriffsfehler nicht erfasst')};}
export function sortedPlayers(rows,sort='kills'){return [...rows].sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'de'):(sort==='errors'?b.errors-a.errors:sort==='mvp'?b.points-a.points:b.kills-a.kills)||a.name.localeCompare(b.name,'de'))}
const quote=v=>{let text=String(v??'');if(typeof v==='string'&&/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"'};
export function playerCsv(a){const header=['Spieler',...positive,...negative,'Fehler gesamt (erfasst)','MVP (erfasste Aktionen)'];const lines=a.rows.map(r=>[r.name,...[...positive,...negative].map(c=>a.partial(r.name,[c])?(r.actions[c]?r.actions[c]+' (unvollständig)':'nicht erfasst'):(r.actions[c]||0)),a.partial(r.name,negative)?(r.errors?r.errors+' (unvollständig)':'nicht erfasst'):r.errors,r.points]);return '\uFEFF'+[header,...lines].map(row=>row.map(quote).join(';')).join('\r\n')}
