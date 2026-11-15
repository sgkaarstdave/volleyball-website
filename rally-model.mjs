// Isolated, event-sourced two-team scouting. No production storage or cloud client.
export const STORAGE_KEY = 'rallyboard-rally-lab-v2';
export const BACKUP_KEY = STORAGE_KEY + '-backup';
export const ROSTER = ['Rayan','Cedric','Slawa','Jan','Lukas','David','Devin','Lionel','Dave'];
export const OPPONENTS = Array.from({length:12},(_,i)=>'G'+(i+1));
export const TYPES = {serve:'Aufschlag',receive:'Annahme',defense:'Abwehr',set:'Zuspiel',attack:'Angriff',block:'Block',freeball:'Ball zurück',unknownReturn:'Nicht erfasster Rückball'};
export const SPOTS = ['4','3','2','2h','6'];
export const spotLabel = p => p === '2h' ? '2 Hinterfeld' : p;
export const GEOMETRY = {left:.09,right:.91,top:.08,net:.465,bottom:.85};
export const other = t => t === 'us' ? 'them' : 'us';
const check = (ok, text) => {if (!ok) throw Error(text);};
const copy = value => structuredClone(value);
export const rotate = a => [...a.slice(1),a[0]];
export const newSession = () => ({version:2,roster:[...ROSTER],opponents:[...OPPONENTS],sets:[]});
export function rolesFromSetter(lineup, setter, middleFirst=false) {
  const index = lineup.indexOf(setter); check(index >= 0,'Bitte einen Zuspieler aus den sechs Startspielern wählen.');
  const pattern=middleFirst?['Z','MB','AA','D','MB','AA']:['Z','AA','MB','D','AA','MB'];
  return Object.fromEntries(lineup.map((name,i)=>[name,pattern[(i-index+6)%6]]));
}
export function checkSetup(config, roster, opponentRoster) {
  for (const [team,list] of [['us',roster],['them',opponentRoster]]) {
    const lineup=config.lineups?.[team];
    check(Array.isArray(lineup)&&lineup.length===6&&new Set(lineup).size===6&&lineup.every(n=>list.includes(n)), 'Für beide Teams sechs verschiedene Spieler aufstellen.');
  }
  const system=config.system;
  check(system?.type==='5:1','Bitte das 5:1-System festlegen.');
  const lineup=config.lineups.us, roles=system.roles;
  check(roles&&lineup.filter(n=>roles[n]==='Z').length===1&&lineup.filter(n=>roles[n]==='D').length===1&&lineup.filter(n=>roles[n]==='AA').length===2&&lineup.filter(n=>roles[n]==='MB').length===2,'Für 5:1 werden 1 Zuspieler, 1 Diagonalspieler, 2 Außen- und 2 Mittelangreifer benötigt.');
  const i=lineup.findIndex(n=>roles[n]==='Z');
  check(roles[lineup[(i+3)%6]]==='D'&&roles[lineup[(i+1)%6]]===roles[lineup[(i+4)%6]]&&roles[lineup[(i+2)%6]]===roles[lineup[(i+5)%6]],'Die Rollenpaare müssen sich in der 5:1-Rotationsfolge gegenüberstehen.');
  if(system.libero)check(roster.includes(system.libero)&&!lineup.includes(system.libero),'Der Libero muss außerhalb der sechs Startspieler gewählt werden.');
  check(['us','them'].includes(config.serving),'Bitte das erste Aufschlagrecht wählen.');
}
export function startSet(session, config, id) {
  checkSetup(config,session.roster,session.opponents);
  check(id&&!session.sets.some(s=>s.id===id),'Ungültiger Satz.');
  if(session.sets.length){const previous=reduceSet(session.sets.at(-1));check(previous.finished,'Bitte den laufenden Satz beenden oder den Test zurücksetzen.');}
  if(session.sets.length>0&&session.sets.length<4){const first=session.sets[0].serving,expected=session.sets.length%2?other(first):first;check(config.serving===expected,'Das erste Aufschlagrecht wechselt zwischen den Sätzen. Im fünften Satz wird neu gewählt.');}
  const wins={us:0,them:0};for(const s of session.sets){const a=reduceSet(s);if(a.finished)wins[a.score.us>a.score.them?'us':'them']++;}
  check(wins.us<3&&wins.them<3&&session.sets.length<5,'Das Testspiel ist beendet. Bitte einen neuen Test beginnen.');
  const next=copy(session);next.sets.push({id,...copy(config),target:next.sets.length===4?15:25,events:[]});return next;
}
function baseTeam(lineup,roles={}) {return {order:[...lineup],starters:[...lineup],roles:{...roles},rotation:0,subs:0,pairs:{},returned:[],timeouts:0,liberoSlot:null};}
function resetLibero(state) {
  const t=state.teams.us,libero=state.system.libero;
  t.liberoSlot=libero?[6,5,1].find(slot=>t.roles[t.order[slot-1]]==='MB'&&!(state.serving==='us'&&slot===1))??null:null;
}
export function fieldLineup(state,team) {const t=state.teams[team],a=[...t.order];if(team==='us'&&t.liberoSlot)a[t.liberoSlot-1]=state.system.libero;return a;}
export function serverOf(state) {return {team:state.serving,player:state.teams[state.serving].order[0]};}
function addStat(state,team,player,key) {
  if(!player)return;
  const row=(state.stats[team][player]??={});row[key]=(row[key]||0)+1;
}
function scorePoint(state,winner) {
  check(['us','them'].includes(winner),'Ungültiger Punkt.');
  state.score[winner]++;
  if(state.serving!==winner){const t=state.teams[winner];t.order=rotate(t.order);t.rotation=(t.rotation+1)%6;}
  state.serving=winner;state.phase={team:winner,type:'serve',touches:0,player:state.teams[winner].order[0]};state.last=null;state.rallies++;
  state.finished=Math.max(state.score.us,state.score.them)>=state.target&&Math.abs(state.score.us-state.score.them)>=2;
  resetLibero(state);
}
function applyContact(state,c,{strict=false}={}) {
  check(['us','them'].includes(c.team)&&TYPES[c.type],'Ungültiger Kontakt.');
  check(['played','continue','point','error'].includes(c.result),'Ungültiges Kontaktergebnis.');
  if(c.type==='unknownReturn'){
    check(!c.player&&c.team===state.phase.team&&state.phase.type!=='serve'&&c.result==='played','Nicht erfasster Rückball passt nicht zum Ballwechsel.');
    state.gaps++;state.phase={team:other(c.team),type:'defense',touches:0,player:null};state.last=c;return;
  }
  const lineup=fieldLineup(state,c.team),slot=lineup.indexOf(c.player)+1;
  check(slot>0,'Spieler ist nicht auf dem Feld.');
  check(state.phase.team===null || c.team===state.phase.team,'Dieser Kontakt passt nicht zur aktuellen Ballseite.');
  if(c.type==='serve')check(state.phase.type==='serve'&&c.team===state.serving&&slot===1&&c.player===serverOf(state).player,'Der Aufschläger muss der aktuelle Spieler auf Position 1 sein.');
  else check(state.phase.type!=='serve','Der Aufschlag fehlt noch.');
  if(c.type==='block'){
    check([2,3,4].includes(slot)&&c.player!==state.system.libero,'Ein Hinterfeldspieler oder Libero darf nicht blocken.');
    if(strict){check(state.last?.type!=='serve','Ein gegnerischer Aufschlag darf nicht geblockt werden.');check(state.last&&((state.last.team!==c.team&&['attack','freeball','block','unknownReturn'].includes(state.last.type))||state.last.type==='block'),'Ein Block setzt einen ankommenden gegnerischen Ball voraus.');}
  }
  if(c.type==='attack')check(c.player!==state.system.libero,'Ein Libero-Angriff wird nicht automatisch angenommen. Bitte den Kontakt korrigieren.');
  if(c.type!=='block'&&state.last?.type!=='block'&&state.last?.team===c.team&&state.last.player===c.player)check(false,'Derselbe Spieler kann nicht zwei aufeinanderfolgende Kontakte übernehmen.');
  check(c.type==='block'||state.phase.touches<3,'Mehr als drei Mannschaftskontakte.');
  check(!c.origin||SPOTS.includes(c.origin),'Angriffsort unbekannt.');
  check(!c.receptionQuality||(c.type==='receive'&&['imprecise','controlled'].includes(c.receptionQuality)&&c.qualityConfirmed===true),'Annahmebewertung muss ausdrücklich bestätigt werden.');
  check(!c.ballTo||(c.type==='block'&&['us','them'].includes(c.ballTo)),'Ungültige Ballseite nach dem Block.');
  check(!c.blockOut||(c.type==='attack'&&c.result==='point'),'Block-out muss ein bestätigter Angriffspunkt sein.');
  check(!c.sourceContact||(c.type==='freeball'&&['receive','defense'].includes(c.sourceContact)),'Ungültiger direkter Rückball.');
  if(c.result==='point')check(['serve','attack','block','freeball'].includes(c.type),'Dieser Kontakt allein ist kein direkter Punkt.');
  const attempt={serve:'serves',receive:'receptions',defense:'defenses',set:'sets',attack:'attacks',block:'blockAttempts',freeball:'freeballs'}[c.type];
  addStat(state,c.team,c.player,attempt);
  if(c.sourceContact)addStat(state,c.team,c.player,c.sourceContact==='receive'?'receptions':'defenses');
  if(c.inferred)addStat(state,c.team,c.player,'inferredContacts');
  if(c.type==='set'&&c.emergency)addStat(state,c.team,c.player,'emergencySets');
  if(c.result==='error'){
    addStat(state,c.team,c.player,'errors');addStat(state,c.team,c.player,(c.sourceContact||c.type)+'Errors');if(c.type==='set'&&c.emergency)addStat(state,c.team,c.player,'emergencySetErrors');scorePoint(state,other(c.team));return;
  }
  if(c.type==='receive'||c.type==='defense')addStat(state,c.team,c.player,c.type==='receive'?'receptionsPlayed':'defensesPlayed');
  if(c.sourceContact)addStat(state,c.team,c.player,c.sourceContact==='receive'?'receptionsPlayed':'defensesPlayed');
  if(c.type==='receive'&&c.receptionQuality)addStat(state,c.team,c.player,c.receptionQuality==='imprecise'?'receptionsImprecise':'receptionsControlled');
  if(c.type==='set'){
    addStat(state,c.team,c.player,'setsPlayed');
    if(c.origin)state.distribution[c.team][c.origin]=(state.distribution[c.team][c.origin]||0)+1;
  }
  if(c.result==='point'){
    addStat(state,c.team,c.player,{serve:'aces',attack:'kills',block:'blocks',freeball:'directReturns'}[c.type]);if(c.blockOut)addStat(state,c.team,c.player,'blockOutKills');scorePoint(state,c.team);return;
  }
  if(['serve','attack','freeball'].includes(c.type))state.phase={team:other(c.team),type:c.type==='serve'?'receive':'defense',touches:0,player:null};
  else if(c.type==='block'){
    // Older blocks without this field defaulted to the blocking team's side.
    const team=c.ballTo===null?null:(c.ballTo||c.team);
    state.phase={team,type:'defense',touches:0,player:null};
  }
  else state.phase={team:c.team,type:c.type==='set'?'attack':'set',touches:state.phase.touches+1,player:c.toPlayer||null};
  state.last=c;
}
export function reduceSet(set) {
  checkSetup(set,[...(set.lineups?.us||[]),...(set.system?.libero?[set.system.libero]:[])],set.lineups?.them);
  check([15,25].includes(set.target)&&Array.isArray(set.events),'Ungültige Satzdaten.');
  const state={teams:{us:baseTeam(set.lineups.us,set.system.roles),them:baseTeam(set.lineups.them)},system:copy(set.system),serving:set.serving,score:{us:0,them:0},target:set.target,phase:{team:set.serving,type:'serve',touches:0,player:set.lineups[set.serving][0]},stats:{us:{},them:{}},distribution:{us:{},them:{}},last:null,rallies:0,gaps:0,finished:false};
  resetLibero(state);const seen=new Set();
  for(const e of set.events){
    check(typeof e.id==='string'&&e.id,'Ereignis-ID fehlt.');if(seen.has(e.id))continue;seen.add(e.id);
    check(!state.finished,'Der Satz ist beendet.');
    if(e.kind==='point'){scorePoint(state,e.winner);continue;}
    if(e.kind==='play'){
      check(Array.isArray(e.contacts)&&e.contacts.length>0&&e.contacts.length<=5,'Ungültige Kontaktfolge.');
      for(let i=0;i<e.contacts.length;i++){check(i===e.contacts.length-1||['played','continue'].includes(e.contacts[i].result),'Ein Punkt muss die Kontaktfolge beenden.');applyContact(state,e.contacts[i],{strict:e.rulesVersion>=2});}continue;
    }
    const t=state.teams[e.team];check(t&&state.phase.type==='serve','Korrekturen und Wechsel nur zwischen Ballwechseln.');
    if(e.kind==='timeout'){check(t.timeouts<2,'Zwei Auszeiten sind bereits genutzt.');t.timeouts++;continue;}
    if(e.kind==='rotate'){t.order=rotate(t.order);t.rotation=(t.rotation+1)%6;resetLibero(state);state.phase.player=serverOf(state).player;continue;}
    if(e.kind==='service'){check(['us','them'].includes(e.serving),'Ungültiges Aufschlagrecht.');state.serving=e.serving;state.phase={team:e.serving,type:'serve',touches:0,player:state.teams[e.serving].order[0]};resetLibero(state);continue;}
    check(e.kind==='sub','Unbekannte Aktion.');
    const slot=t.order.indexOf(e.out),starter=t.starters.includes(e.out),pair=Object.entries(t.pairs).find(([,n])=>n===e.out);
    check(slot>=0&&typeof e.in==='string'&&!t.order.includes(e.in)&&e.in!==state.system.libero,'Wechsel nicht möglich.');
    check(t.subs<6,'Sechs reguläre Wechsel sind bereits genutzt.');
    if(starter){check(!t.pairs[e.out]&&!t.starters.includes(e.in),'Dieser Startspieler wurde bereits ausgewechselt; nur der zugehörige Rückwechsel ist möglich.');t.pairs[e.out]=e.in;}
    else{check(pair&&pair[0]===e.in&&!t.returned.includes(e.in),'Rückwechsel nur mit dem zugehörigen Startspieler möglich.');t.returned.push(e.in);}
    t.roles[e.in]=t.roles[e.out];t.order[slot]=e.in;t.subs++;resetLibero(state);state.phase.player=serverOf(state).player;
  }
  return state;
}
export function validateSession(session){
  check(session?.version===2&&Array.isArray(session.roster)&&Array.isArray(session.opponents)&&Array.isArray(session.sets),'Ungültiger Teststand.');
  for(const list of [session.roster,session.opponents])check(list.length>=6&&new Set(list).size===list.length&&list.every(n=>typeof n==='string'&&n.length>0&&n.length<=80),'Ungültiger Kader.');
  const ids=new Set();for(const set of session.sets){check(set.id&&!ids.has(set.id),'Doppelte Satz-ID.');ids.add(set.id);checkSetup(set,session.roster,session.opponents);for(const e of set.events)if(e.kind==='sub')check((e.team==='us'?session.roster:session.opponents).includes(e.in),'Einwechselspieler ist nicht im Kader.');reduceSet(set);}return session;
}
export function appendEvent(session,event){const next=copy(session),set=next.sets.at(-1);check(set,'Bitte zuerst beide Aufstellungen festlegen.');if(set.events.some(e=>e.id===event.id))return next;set.events.push({...copy(event),rulesVersion:2});return validateSession(next);}
export function undoEvent(session){const next=copy(session);next.sets.at(-1)?.events.pop();return validateSession(next);}
export function targetAt([x,y],team){const g=GEOMETRY;if(x<g.left||x>g.right||y<g.top||y>g.bottom)return 'out';if(Math.abs(y-g.net)<.028)return 'net';return (y>g.net?'us':'them')===team?'own':'opponent';}
export function playerNodes(state,{rotationOnly=false}={}){
  const nodes=[];
  for(const team of ['us','them']){
    const lineup=fieldLineup(state,team),t=state.teams[team],playing=!rotationOnly;
    for(let i=0;i<6;i++){
      const slot=i+1,player=lineup[i],base=t.order[i],role=team==='us'?(player===state.system.libero?'L':t.roles[base]):'',front=[2,3,4].includes(slot);
      let x=({1:.77,2:.77,3:.5,4:.23,5:.23,6:.5})[slot],y=front?.57:.75;
      if(playing&&team==='us'){
        if(role==='Z'){x=.64;y=.565;}
        else if(front){x=role==='AA'?.23:role==='MB'?.45:.79;y=.59;}
        else{x=role==='AA'?.49:role==='D'?.79:.23;y=.77;}
      }
      if(state.phase.type==='serve'&&state.serving===team&&slot===1){x=.77;y=.915;}
      if(team==='them'){x=1-x;y=GEOMETRY.net-(y-GEOMETRY.net);if(state.phase.type==='serve'&&state.serving===team&&slot===1)y=.065;}
      const origin=role==='AA'?(front?'4':'6'):role==='MB'?(front?'3':''):role==='Z'?'':role==='D'?(front?'2':'2h'):[2,3,4].includes(slot)?String(slot):slot===1?'2h':slot===6?'6':'';
      nodes.push({id:team+':'+player,team,player,slot,role,x,y,origin,server:state.phase.type==='serve'&&state.serving===team&&slot===1});
    }
  }
  return nodes;
}
function dist(a,b){return Math.hypot((a[0]-b[0])*600,(a[1]-b[1])*640);}
export function crossesNet(samples,team,from=0){
  const g=GEOMETRY,side=y=>team==='us'?y-g.net:g.net-y;
  for(let i=Math.max(1,from+1);i<samples.length;i++)if(side(samples[i-1][1])>=0&&side(samples[i][1])<0)return true;
  return false;
}
const backNode=n=>Math.abs(n.y-GEOMETRY.net)>.16;
export function classifyLastContact({expectedType,touchNumber,crossedNet,target,actor,override}){
  let type;
  if(override)type=override;
  else if(expectedType==='serve')type='serve';
  else if(touchNumber>=3)type=actor.role==='L'?'freeball':'attack';
  else if(touchNumber===2)type=crossedNet?(actor.role==='L'?'freeball':'attack'):'set';
  else if(crossedNet)type='freeball';
  else type=expectedType;
  const emergency=type==='set'&&actor.role!=='Z'&&backNode(actor);
  return {type,emergency,evidence:{touchNumber,crossedNet,actorBack:backNode(actor),target}};
}
export function questionFor(contact,target){
  if(contact.emergency&&contact.type==='set')return contact.result==='error'?'Notzuspiel '+(target==='out'?'ins Aus':target==='net'?'ins Netz':'misslungen')+'?':'Notzuspiel weitergespielt?';
  if(contact.type==='serve'&&target==='out')return 'Aufschlagfehler ins Aus?';
  if(contact.type==='serve'&&target==='net')return 'Aufschlagfehler ins Netz?';
  if(contact.result==='error')return ({serve:'Aufschlagfehler',attack:'Angriffsfehler',receive:'Annahmefehler',defense:'Abwehrfehler',set:'Zuspiel-/Technikfehler',block:'Blockfehler'}[contact.type]||'Fehler')+'?';
  return {attack:'Angriff erfolgreich?',serve:'Direkter Aufschlagpunkt?',block:'Blockpunkt?',freeball:'Direkter Rückball ein Punkt?'}[contact.type]||TYPES[contact.type]+' weitergespielt?';
}
export function reviseDraft(draft,{type,onlyLast=false,quality,origin,blockTouch,blockBallTo}={}){
  const next=copy(draft),last=next.contacts.at(-1);
  if(type){check(TYPES[type]&&type!=='unknownReturn','Kontaktart unbekannt.');last.type=type;last.emergency=type==='set'&&next.emergencyCandidate;if(type!=='attack')next.blockTouch=false;if(type!=='freeball')delete last.sourceContact;}
  if(onlyLast){const keepQuality=next.receptionQuality?.index===next.contacts.length-1;next.contacts=[...next.contacts.slice(0,next.prefixCount),last];if(next.receptionQuality){if(keepQuality)next.receptionQuality.index=next.prefixCount;else next.receptionQuality=null;}}
  if(quality!==undefined&&next.receptionQuality){check([null,'imprecise','controlled'].includes(quality),'Unbekannte Annahmebewertung.');next.receptionQuality.value=quality;}
  if(origin!==undefined){check(!origin||SPOTS.includes(origin),'Angriffsort unbekannt.');next.origin=origin;}
  if(blockTouch!==undefined){check(typeof blockTouch==='boolean'&&last.type==='attack'&&next.target==='out','Block-out ist nur für einen Angriff ins Aus wählbar.');next.blockTouch=blockTouch;}
  if(blockBallTo!==undefined){check(last.type==='block'&&['us','them'].includes(blockBallTo),'Ballseite passt nicht zum Block.');next.blockBallTo=blockBallTo;}
  next.type=last.type;next.player=last.player;next.question=questionFor(last,next.target);return next;
}
function attackToBlock(state, attacker, blocker, samples) {
  const contacts = [];
  let ballTeam = state.phase.team;
  if (state.phase.type === 'serve') {
    const server = serverOf(state);
    contacts.push({...server, type:'serve', result:'played', inferred:true});
    ballTeam = other(server.team);
  }
  const previous = state.last;
  const attackAlreadyRecorded = ballTeam === blocker.team && previous?.type === 'attack'
    && previous.team === attacker.team && previous.player === attacker.player;
  if (!attackAlreadyRecorded) {
    if (ballTeam !== null && ballTeam !== attacker.team) {
      contacts.push({team:ballTeam, player:null, type:'unknownReturn', result:'played', inferred:true});
    }
    contacts.push({team:attacker.team, player:attacker.player, type:'attack', result:'continue', origin:attacker.origin});
  }
  contacts.push({team:blocker.team, player:blocker.player, type:'block', result:'continue'});
  return {contacts, team:blocker.team, player:blocker.player, type:'block', question:'Blockpunkt?',
    target:null, reason:'other', prefixCount:contacts.filter(c=>c.inferred).length,
    samples:samples.map(p=>p.slice(0,2))};
}

function manualBlock(state,team,player) {
  const slot=fieldLineup(state,team).indexOf(player)+1;
  check([2,3,4].includes(slot) && (team!=='us' || player!==state.system.libero),'Bitte einen Vorderfeldspieler auf Position 2, 3 oder 4 wählen.');
  const contacts=[];
  let ballTeam=state.phase.team;
  if(state.phase.type==='serve'){
    const server=serverOf(state);
    contacts.push({...server,type:'serve',result:'played',inferred:true});
    ballTeam=other(server.team);
  }
  const incoming=ballTeam===null || (state.last?.team===other(team)
    && ['attack','freeball','unknownReturn','block'].includes(state.last.type) && ballTeam===team);
  if(!incoming){
    if(ballTeam===team)contacts.push({team,player:null,type:'unknownReturn',result:'played',inferred:true});
    contacts.push({team:other(team),player:null,type:'unknownReturn',result:'played',inferred:true});
  }
  const prefixCount=contacts.length;
  contacts.push({team,player,type:'block',result:'continue'});
  return {team,player,type:'block',question:'Blockpunkt?',tap:true,target:null,samples:null,
    reason:'other',contacts,prefixCount,confirmMissingAttack:!incoming};
}

export function recognizeTrace(state,{team,player,samples,nodes=playerNodes(state),tap=false,override=null,endNode=null}){
  check(!state.finished,'Der Satz ist beendet.');
  check(fieldLineup(state,team).includes(player),'Spieler nicht auf dem Feld.');
  if(tap && override==='block')return manualBlock(state,team,player);
  check(tap||(Array.isArray(samples)&&samples.length>=2&&samples.every(p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite))&&samples.length<=3000),'Ungültiger Wischweg.');
  if(!tap)check(samples.slice(1).some(p=>dist(p,samples[0])>30),'Bitte weiter ziehen oder den Spieler antippen.');
  if (!tap && endNode && (!override || override === 'block') && crossesNet(samples,team)) {
    const attacker = nodes.find(n=>n.team===team && n.player===player && !n.ghost);
    const blocker = nodes.find(n=>n.id===endNode && n.team!==team && !n.ghost);
    const length = samples.slice(1).reduce((sum,p,i)=>sum+dist(samples[i],p),0);
    const direct = length <= 1.35 * dist(samples[0],samples.at(-1));
    if (direct && attacker && !attacker.server && attacker.role!=='L' && blocker &&
        [2,3,4].includes(blocker.slot) && blocker.role!=='L') {
      return attackToBlock(state,attacker,blocker,samples);
    }
  }
  const prefix=[],expected=state.phase;
  let type=expected.type;
  if(expected.team!==null && expected.team!==team){
    if(type==='serve'){prefix.push({team:expected.team,player:serverOf(state).player,type:'serve',result:'played',inferred:true});type='receive';}
    else{prefix.push({team:expected.team,player:null,type:'unknownReturn',result:'played',inferred:true});type='defense';}
  }
  const sourceType=type;
  if(override)type=override;
  check(TYPES[type]&&type!=='unknownReturn','Kontaktart unbekannt.');
  if(type==='serve')check(team===state.serving&&player===serverOf(state).player,'Bitte vom aktuellen Aufschläger ziehen.');
  const startNode=nodes.find(n=>n.team===team&&n.player===player&&!n.ghost);
  check(startNode,'Spielerposition fehlt.');
  const visited=[startNode?{...startNode,traceIndex:0}:null],seen=new Set([player]);
  if(!tap&&type!=='serve'){
    const hits=[],backTransfers=[];
    for(const node of nodes){
      if(node.team!==team||seen.has(node.player))continue;
      const near=samples.map((p,i)=>({i,d:dist(p,[node.x,node.y])})).filter(v=>v.d<=29);if(!near.length)continue;
      const closest=near.reduce((a,b)=>a.d<b.d?a:b),first=near[0].i,last=near.at(-1).i;
      const before=samples[Math.max(0,first-2)],at=samples[closest.i],after=samples[Math.min(samples.length-1,last+2)];
      const a=[(at[0]-before[0])*600,(at[1]-before[1])*640],b=[(after[0]-at[0])*600,(after[1]-at[1])*640],length=Math.hypot(...a)*Math.hypot(...b);
      const angle=length?Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/length))):0;
      const end=dist(samples.at(-1),[node.x,node.y])<=35,dwell=(samples[last][2]||0)-(samples[first][2]||0);
      if(['receive','defense'].includes(type)&&backNode(startNode)&&backNode(node))backTransfers.push({node,first,at:closest.i,d:closest.d});
      if(end||angle>.52||dwell>120)hits.push({node,first,at:closest.i,d:closest.d});
    }
    // A single clearly touched back-row teammate is meaningful even on a straight
    // lateral pass. Multiple collinear teammates require an intentional turn/pause.
    if(!hits.length&&backTransfers.length&&targetAt(samples.at(-1),team)!=='opponent'){
      check(backTransfers.length===1,'Mehrere Hinterspieler auf geradem Weg berührt. Beim gemeinten Spieler kurz halten oder die Richtung ändern.');
      hits.push(backTransfers[0]);
    }
    hits.sort((a,b)=>a.first-b.first||a.d-b.d);for(const hit of hits)if(!seen.has(hit.node.player)){visited.push({...hit.node,traceIndex:hit.at});seen.add(hit.node.player);}
  }
  check(visited[0],'Spielerposition fehlt.');
  const to=tap?null:samples.at(-1).slice(0,2),target=to?targetAt(to,team):null;
  // Ending at a teammate means delivery TO them; their next contact has not happened yet.
  const recipient=!tap&&visited.length>1&&dist(to,[visited.at(-1).x,visited.at(-1).y])<=35?visited.pop():null;
  check(visited.length<=3,'Mehr als drei Spieler berührt. Bitte kürzer zeichnen oder den Weg korrigieren.');
  const outgoing=!tap&&(target==='opponent'||target==='net'||target==='out');
  const touchesBefore=prefix.length?0:expected.touches;
  const contacts=visited.map((n,i)=>{
    const touchNumber=touchesBefore+i+1;
    let contactType=i===0?type:touchNumber>=3?'attack':'set',emergency=contactType==='set'&&n.role!=='Z'&&backNode(n),evidence;
    if(type!=='serve'&&outgoing&&i===visited.length-1){
      const inference=classifyLastContact({expectedType:type,touchNumber,crossedNet:crossesNet(samples,team,n.traceIndex),target,actor:n,override});
      contactType=inference.type;emergency=inference.emergency;evidence=inference.evidence;
    }
    return {team,player:n.player,type:contactType,result:'played',inferred:!tap,origin:n.origin||'',toPlayer:visited[i+1]?.player||recipient?.player||null,...(emergency?{emergency:true}:{}),...(evidence?{evidence}:{}),...(contactType==='freeball'&&touchNumber===1&&['receive','defense'].includes(sourceType)?{sourceContact:sourceType}:{})};
  });
  const last=contacts.at(-1),spot=last.type==='attack'?last.origin:recipient?.origin||'';
  for(const c of contacts)if(c.type==='set')c.origin=spot;
  if(tap){last.type=type;last.result=['serve','receive','defense','set'].includes(type)?'error':'continue';}
  else last.result=['net','out'].includes(target)||last.type==='serve'&&target==='own'?'error':outgoing?'continue':'played';
  const label=questionFor(last,target);
  const nextNode=visited[1]||recipient;
  const receptionQuality=!tap&&contacts[0].type==='receive'&&backNode(visited[0])&&nextNode&&backNode(nextNode)&&nextNode.role!=='Z'?{index:prefix.length,player:contacts[0].player,value:'imprecise',reason:'Die Annahme geht zu einem weiteren Hinterfeldspieler statt zum regulären Zuspielziel.'}:null;
  const lastActor=visited.at(-1),alternatives=last.evidence?.touchNumber===2&&!last.evidence.crossedNet&&['out','net'].includes(target)?['set','attack']:[];
  return {contacts:[...prefix,...contacts],team,player:last.player,type:last.type,question:label,target,reason:target==='out'?'out':target==='net'?'net':'other',tap,samples:tap?null:samples.map(p=>p.slice(0,2)),origin:spot,prefixCount:prefix.length,receptionQuality,emergencyCandidate:lastActor.role!=='Z'&&backNode(lastActor),alternatives};
}
export function confirmTrace(draft,result){
  const event={kind:'play',contacts:copy(draft.contacts),reason:draft.reason,trace:draft.samples};
  const last=event.contacts.at(-1);last.result=result;
  if(draft.receptionQuality?.value){const c=event.contacts[draft.receptionQuality.index];check(c?.type==='receive'&&c.player===draft.receptionQuality.player,'Annahmebewertung passt nicht mehr zur Kontaktkette.');c.receptionQuality=draft.receptionQuality.value;c.qualityConfirmed=true;}
  const confirmedBlockOut=last.type==='attack'&&draft.target==='out'&&draft.blockTouch===true&&result==='point';
  if(['net','out'].includes(draft.target)||last.type==='serve'&&draft.target==='own')check(result==='error'||confirmedBlockOut,'Für dieses Ziel bitte Fehler bestätigen oder neu zeichnen.');
  if(confirmedBlockOut){last.blockOut=true;event.reason='blockout';}
  if(last.type==='block' && result==='continue')last.ballTo=draft.blockBallTo??null;
  if(last.type==='attack'){last.origin=draft.origin||'';for(const c of event.contacts)if(c.type==='set')c.origin=draft.origin||'';}
  return event;
}
export function totals(session){const result={us:{},them:{},distribution:{us:{},them:{}}};for(const set of session.sets){const s=reduceSet(set);for(const team of ['us','them']){for(const [name,row]of Object.entries(s.stats[team]))for(const[k,v]of Object.entries(row))((result[team][name]??={})[k]=(result[team][name]?.[k]||0)+v);for(const[k,v]of Object.entries(s.distribution[team]))result.distribution[team][k]=(result.distribution[team][k]||0)+v;}}return result;}
