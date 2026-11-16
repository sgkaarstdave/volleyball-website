import {newSession, validateSession, reduceSet, fieldLineup} from './rally-model.mjs?v=rally8';
import {emptySet, assertTrackableMatch} from './model.mjs?v=19';

export const fieldCoverage='Live erfasst · Feldtracking';
const categories={
  kills:'Kill',aces:'Ass',blocks:'Blockpunkt',directReturns:'Direkter Rückball',
  serveErrors:'Aufschlagfehler',attackErrors:'Angriffsfehler',receiveErrors:'Annahmefehler',
  defenseErrors:'Abwehrfehler',setErrors:'Zuspielfehler',blockErrors:'Blockfehler',freeballErrors:'Rückballfehler'
};

export function fieldSession(match,players){
  if(match.sets.some(set=>!set.field))throw Error('Dieser Spieltag verwendet die Aktionstasten.');
  const session=newSession();
  session.roster=[...new Set([...players,...match.sets.flatMap(s=>s.fieldRoster||[])])];
  session.sets=match.sets.map(s=>structuredClone(s.field));
  return validateSession(session);
}

function summarizeSet(set,roster){
  const state=reduceSet(set);
  const summary=emptySet(fieldLineup(state,'us'));
  summary.field=set;
  summary.fieldRoster=[...roster];
  summary.coverage=fieldCoverage;
  summary.score=[state.score.us,state.score.them];
  summary.lineupPositions=Object.fromEntries(summary.active.map((n,i)=>[i+1,n]));
  summary.subs=set.events.filter(e=>e.kind==='sub'&&e.team==='us').map(({out,in:incoming})=>({out,in:incoming}));
  for(const [spot,count] of Object.entries(state.distribution.us))summary.pos[spot==='2h'?'5':spot]=count;
  for(const [name,row] of Object.entries(state.stats.us)){
    const actions={};
    for(const [key,value] of Object.entries(row)){
      actions['Feld.'+key]=value;
      if(categories[key])actions[categories[key]]=value;
    }
    summary.actions[name]=actions;
  }
  return summary;
}

export function saveFieldMatch(db,id,session,revision,today){
  const match=assertTrackableMatch(db,id,today);
  if((match.sets.at(-1)?.fieldRevision??null)!==revision || match.sets.some(s=>!s.field))
    throw Error('Spielstand geändert. Bitte das Feld erneut öffnen.');
  validateSession(session);
  if(!session.sets.length)throw Error('Es fehlt die Satzaufstellung.');
  // Stroke coordinates are for recognition only. Confirmed contacts suffice for replay and undo.
  const sets=structuredClone(session.sets);
  for(const set of sets)for(const event of set.events)delete event.trace;
  match.sets=sets.map(s=>summarizeSet(s,session.roster));
  const nextRevision=crypto.randomUUID();
  match.sets.at(-1).fieldRevision=nextRevision;
  match.planned=false;match.seeded=false;db.current=id;
  return nextRevision;
}
