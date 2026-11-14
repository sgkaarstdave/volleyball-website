import {snapshot} from './schedule-data.mjs?v=13';
export {snapshot};
const clone=x=>structuredClone(x),normalize=s=>String(s).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de');
export function applyFixtures(db,fixtures=snapshot.fixtures,{manual=false}={}){
 let added=0,updated=0,matched=0;
 for(const f of fixtures){
  let m=db.matches.find(m=>m.fixtureKey===f.key&&!m.linkedTo)||db.matches.find(m=>m.id===f.key);
  if(m?.linkedTo)continue;
  if(!m){const candidates=db.matches.filter(m=>!m.deletedAt&&!m.fixtureKey&&m.date===f.date&&normalize(m.opponent)===normalize(f.opponent));if(candidates.length===1){m=candidates[0];m.fixtureKey=f.key;m.seeded=false;matched++}}
  if(m){if(m.deletedAt)continue;if(m.official&&!manual&&m.official.checkedAt>=f.checkedAt)continue;if(m.official?.checkedAt>f.checkedAt)continue;if(JSON.stringify(m.official)===JSON.stringify(f))continue;m.official=clone(f);if(!m.manualOverrides?.opponent)m.opponent=f.opponent;if(!m.manualOverrides?.date)m.date=f.date;if(!m.sets.length){m.done=!!f.result;m.planned=!f.result}if(manual)m.seeded=false;updated++;
  }else{db.matches.push({id:f.key,fixtureKey:f.key,opponent:f.opponent,date:f.date,sets:[],done:!!f.result,planned:!f.result,official:clone(f),seeded:!manual});added++}
 }
 return {added,updated,matched};
}
export function linkCandidates(db,fixture){return db.matches.filter(m=>!m.deletedAt&&!m.fixtureKey&&m.id!==fixture.id&&m.date===fixture.date)}
export function linkFixture(db,fixtureId,targetId,at=new Date().toISOString()){
 const source=db.matches.find(m=>m.id===fixtureId&&!m.deletedAt),target=db.matches.find(m=>m.id===targetId&&!m.deletedAt);
 if(!source?.fixtureKey||source.sets.length||!target||target.fixtureKey||source.date!==target.date)throw Error('Diese Spieltage können nicht automatisch verknüpft werden.');
 target.fixtureKey=source.fixtureKey;target.official=clone(source.official);target.opponent=source.opponent;target.seeded=false;source.linkedTo=target.id;source.deletedAt=at;
 if(db.current===source.id)db.current=target.id;return target;
}
export function dashboardFixtures(db,today){const official=db.matches.filter(m=>!m.deletedAt&&m.fixtureKey&&m.official);const upcoming=official.filter(m=>!m.done&&m.date>=today).sort((a,b)=>(a.date+(a.official.time||'')).localeCompare(b.date+(b.official.time||'')));const results=official.filter(m=>m.official.result).sort((a,b)=>(b.official.date+(b.official.time||'')).localeCompare(a.official.date+(a.official.time||'')));return {upcoming,next:upcoming[0]||null,results}}
export const berlinToday=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
