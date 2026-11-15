export const roster=['Rayan','Cedric','Slawa','Jan','Lukas','David','Devin','Lionel'];
// Stable legacy key 5 denotes the corrected right-side back-row set, not court zone 5.
export const positions=['4','3','2','5','6'];
export const positionLabel=p=>String(p)==='5'?'2 Hinterfeld':String(p);
export const categories=['Kill','Ass','Blockpunkt','Gute Annahme','Gute Abwehr','Gute Sicherung','Angriffsfehler','Aufschlagfehler','Annahmefehler','Abwehrfehler','Sicherungsfehler','Annahme/Abwehr-Fehler','Angabefehler'];
export const defaultWeights=Object.fromEntries(categories.map((c,i)=>[c,i<3?3:i<6?1:c==='Sicherungsfehler'?-1:-2]));
export const emptySet=(active)=>({pos:{},actions:{},subs:[],active:[...active],score:['',''],events:[],teamErrors:{},coverage:'Live erfasst; nur beobachtete Aktionen'});
export const visibleMatches=d=>d.matches.filter(m=>!m.deletedAt);
export function trashMatch(d,id,at=new Date().toISOString()){
 const m=d.matches.find(m=>m.id===id);if(!m||m.deletedAt)return;
 m.deletedAt=at;if(d.current===id)d.current=null;
}
export function restoreMatch(d,id){const m=d.matches.find(m=>m.id===id);if(m)delete m.deletedAt;}
export function updateMatch(d,id,{opponent,date}){
 const m=d.matches.find(m=>m.id===id&&!m.deletedAt);
 if(!m)throw Error('Dieser Spieltag ist nicht verfügbar.');
 const name=String(opponent??'').trim();
 if(!name||name.length>100)throw Error('Bitte einen Gegnernamen mit 1 bis 100 Zeichen eingeben.');
 const parsed=new Date(String(date)+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw Error('Bitte ein gültiges Datum auswählen.');
 if(m.fixtureKey){m.manualOverrides={...m.manualOverrides,opponent:true,date:true};m.seeded=false;}
 m.opponent=name;m.date=date;
}
const localDay=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function canTrackDate(date,today=localDay()){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===date&&date<=today}
export function assertTrackableMatch(d,id,today=localDay()){const m=d.matches.find(m=>m.id===id&&!m.deletedAt);if(!m)throw Error('Spieltag nicht verfügbar.');if(m.done)throw Error('Dieser Spieltag ist beendet.');if(!canTrackDate(m.date,today))throw Error('Tracking ist erst am Spieltag möglich: '+m.date);return m}
export function validateLineup(d,active){if(!Array.isArray(active)||active.length!==6||new Set(active).size!==6||active.some(n=>!d.players.includes(n)))throw Error('Bitte genau sechs verschiedene Spieler aus dem Kader auswählen.');return [...active]}
export function needsInitialLineup(m){if(!m.sets.length)return true;const s=m.sets.at(-1);if(s.active.length!==6)return true;return m.sets.length===1&&!s.lineupPositions&&!s.events.length&&!s.subs.length&&Object.values(s.pos).every(n=>n===0)&&Object.values(s.teamErrors).every(n=>n===0)&&Object.values(s.actions).every(a=>Object.values(a).every(n=>n===0))&&s.score.every(v=>v===''||v===0||v==='0')}
function setPositions(s,active){s.active=validateLineup({players:active},active);s.lineupPositions=Object.fromEntries(active.map((n,i)=>[i+1,n]));s.rotation=0;return s}
export function startTracking(d,id,{active,today=localDay()}={}){const m=assertTrackableMatch(d,id,today);if(needsInitialLineup(m)){const selected=validateLineup(d,active);if(!m.sets.length)m.sets.push(emptySet(selected));setPositions(m.sets.at(-1),selected);}m.planned=false;m.seeded=false;d.current=m.id;return m}
export function startNextSet(d,id,{active,today=localDay(),expectedSetCount}={}){const m=assertTrackableMatch(d,id,today);if(!m.sets.length)throw Error('Bitte zuerst den ersten Satz starten.');if(expectedSetCount!==undefined&&m.sets.length!==expectedSetCount)throw Error('Der Satz hat sich geändert. Bitte die Aufstellung neu öffnen.');const selected=validateLineup(d,active);m.sets.push(setPositions(emptySet(selected),selected));d.current=m.id;return m}
export function resetTracking(d,id,at=new Date().toISOString()){const m=d.matches.find(m=>m.id===id&&!m.deletedAt);if(!m)throw Error('Spieltag nicht verfügbar.');if(!m.sets.length)return null;const archived={id:crypto.randomUUID(),at,sets:structuredClone(m.sets),done:m.done,planned:m.planned??false};m.trackingArchive??=[];m.trackingArchive.push(archived);m.sets=[];m.done=!!m.official?.result;m.planned=!m.done;if(d.current===id)d.current=null;return archived.id}
export function restoreTracking(d,id,archiveId){const m=d.matches.find(m=>m.id===id&&!m.deletedAt),archive=m?.trackingArchive?.find(a=>a.id===archiveId&&!a.restoredAt);if(!m||!archive)throw Error('Diese Tracking-Sicherung ist nicht verfügbar.');if(m.sets.length)throw Error('Es gibt bereits neue Satzdaten. Diese werden nicht überschrieben.');m.sets=structuredClone(archive.sets);m.done=archive.done;m.planned=archive.planned;archive.restoredAt=new Date().toISOString();return m}
export function historical(){
 const kills=[[9,2,3,4,3,0,0,0],[4,2,2,0,3,5,0,0],[3,0,2,3,8,4,1,0]];
 const pos=[{'4':7,'3':2,'5':4,'6':1,'2':0},{'4':7,'3':4,'5':2,'6':0,'2':0},{'4':5,'3':7,'5':0,'6':0,'2':2}];
 const errors=[{}, {'Annahme/Abwehr-Fehler':5,Aufschlagfehler:7,Sicherungsfehler:5},{'Annahme/Abwehr-Fehler':4,Aufschlagfehler:5,Sicherungsfehler:2,Angriffsfehler:5}];
 return {id:'historical-2026-11-14',opponent:'Gegner unbekannt',date:'2026-11-14',done:true,historical:true,sets:kills.map((k,i)=>({...emptySet([]),actions:Object.fromEntries(roster.map((n,j)=>[n,{Kill:k[j]}])),pos:pos[i],teamErrors:errors[i],coverage:i===0?'Fehler nicht erfasst':i===1?'Angriffsfehler nicht erfasst; Teamfehler ohne Spielerzuordnung':'Teamfehler ohne Spielerzuordnung',subs:i===1?[{out:'Jan',in:'Devin',at:null},{out:'David',in:'Lionel',at:null}]:i===2?[{out:'Slawa',in:'Lionel',at:null}]:[]}))};
}
export function migrate(old){
 const d=old?structuredClone(old):{players:[...roster],matches:[],current:null};
 if(!Array.isArray(d.players)||!d.players.every(n=>typeof n==='string')||!Array.isArray(d.matches))throw Error('Ungültiges Backup');
 for(const m of d.matches){if(!m.id||!Array.isArray(m.sets)||typeof m.opponent!=='string')throw Error('Ungültiger Spieltag');for(const s of m.sets){s.events??=[];s.teamErrors??={};s.subs??=[];s.active??=[];s.pos??={};s.actions??={};s.score??=['',''];s.coverage??='Übernommene Daten; Vollständigkeit unbekannt';for(const a of [s.pos,s.teamErrors,...Object.values(s.actions)])for(const v of Object.values(a))if(!Number.isFinite(v)||v<0)throw Error('Ungültige Statistik');}}
 if(!d.matches.some(m=>m.id==='historical-2026-11-14'))d.matches.push(historical());
 if(d.matches.some(m=>m.id===d.current&&m.deletedAt))d.current=null;
 d.players=[...new Set([...d.players,...roster])];d.schema=2;d.weights??={...defaultWeights};d.order??=categories.slice(0,11);delete d.undo;return d;
}
export function totals(matches){const r={pos:{},actions:{},teamErrors:{}};for(const m of matches.filter(m=>!m.deletedAt))for(const s of m.sets){for(const key of ['pos','teamErrors'])for(const [k,v]of Object.entries(s[key]||{}))r[key][k]=(r[key][k]||0)+v;for(const[n,a]of Object.entries(s.actions)) {r.actions[n]??={};for(const[c,v]of Object.entries(a))r.actions[n][c]=(r.actions[n][c]||0)+v;}for(const e of s.events||[]){if(e.void)continue;if(e.kind==='pos')r.pos[e.position]=(r.pos[e.position]||0)+1;if(e.kind==='action'){r.actions[e.player]??={};r.actions[e.player][e.category]=(r.actions[e.player][e.category]||0)+1;}}}return r;}
export function record(s,event){if(s.events.some(e=>e.id===event.id))return;s.events.push(event);}
export function undo(s){const e=s.events.findLast(e=>!e.void);if(!e)return null;e.void=true;if(e.kind==='sub'){s.active[e.slot]=e.out;if(s.lineupPositions)s.lineupPositions[e.slot+1]=e.out;}return e;}

