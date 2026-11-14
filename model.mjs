export const roster=['Rayan','Cedric','Slawa','Jan','Lukas','David','Devin','Lionel'];
export const positions=['4','3','2','5','6'];
export const categories=['Kill','Ass','Blockpunkt','Gute Annahme','Gute Abwehr','Gute Sicherung','Angriffsfehler','Aufschlagfehler','Annahmefehler','Abwehrfehler','Sicherungsfehler','Annahme/Abwehr-Fehler','Angabefehler'];
export const defaultWeights=Object.fromEntries(categories.map((c,i)=>[c,i<3?3:i<6?1:c==='Sicherungsfehler'?-1:-2]));
export const emptySet=(active)=>({pos:{},actions:{},subs:[],active:[...active],score:['',''],events:[],teamErrors:{},coverage:'Live erfasst; nur beobachtete Aktionen'});
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
 d.players=[...new Set([...d.players,...roster])];d.schema=2;d.weights??={...defaultWeights};d.order??=categories.slice(0,11);delete d.undo;return d;
}
export function totals(matches){const r={pos:{},actions:{},teamErrors:{}};for(const m of matches)for(const s of m.sets){for(const key of ['pos','teamErrors'])for(const [k,v]of Object.entries(s[key]||{}))r[key][k]=(r[key][k]||0)+v;for(const[n,a]of Object.entries(s.actions)) {r.actions[n]??={};for(const[c,v]of Object.entries(a))r.actions[n][c]=(r.actions[n][c]||0)+v;}for(const e of s.events||[]){if(e.void)continue;if(e.kind==='pos')r.pos[e.position]=(r.pos[e.position]||0)+1;if(e.kind==='action'){r.actions[e.player]??={};r.actions[e.player][e.category]=(r.actions[e.player][e.category]||0)+1;}}}return r;}
export function record(s,event){if(s.events.some(e=>e.id===event.id))return;s.events.push(event);}
export function undo(s){const e=s.events.findLast(e=>!e.void);if(!e)return null;e.void=true;if(e.kind==='sub')s.active[e.slot]=e.out;return e;}

