import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newSession,rolesFromSetter,startSet,reduceSet,appendEvent,undoEvent,fieldLineup,serverOf,playerNodes,recognizeTrace,confirmTrace,totals,validateSession,targetAt,STORAGE_KEY,reviseDraft,crossesNet} from '../rally-model.mjs';
import {renderActive,renderStats,renderTraceReview,contactText} from '../rally-view.mjs';
const lineup=['David','Cedric','Slawa','Rayan','Lukas','Jan'],opponent=['G1','G2','G3','G4','G5','G6'];
const config=(serving='them',libero=null)=>({lineups:{us:lineup,them:opponent},system:{type:'5:1',roles:rolesFromSetter(lineup,'Jan'),libero},serving});
const fresh=(serving='them',libero=null)=>startSet(newSession(),config(serving,libero),'set-1');
const state=s=>reduceSet(s.sets.at(-1));
const add=(s,e)=>appendEvent(s,{id:'e'+s.sets.at(-1).events.length,...e});
function path(points){const out=[];let t=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let j=0;j<15;j++){out.push([a[0]+(b[0]-a[0])*j/15,a[1]+(b[1]-a[1])*j/15,t]);t+=5;}}out.push([...points.at(-1),t]);return out;}
const trace=(s,points,player='David',team='us')=>recognizeTrace(state(s),{team,player,samples:path(points)});
const tap=(s,player,team='us')=>recognizeTrace(state(s),{team,player,tap:true});
const confirm=(s,d,r)=>add(s,confirmTrace(d,r));
test('two-team setup is explicit; 5:1 opposite roles and optional bench libero are checked',()=>{
  assert.equal(newSession().sets.length,0);assert.throws(()=>startSet(newSession(),{...config(),serving:null},'a'),/Aufschlag/);
  assert.throws(()=>startSet(newSession(),{...config(),lineups:{us:lineup,them:[]}},'a'),/beide/);
  assert.throws(()=>fresh('us','David'),/Libero/);assert.equal(state(fresh('us','Devin')).system.libero,'Devin');
  const alternate=rolesFromSetter(lineup,'Jan',true);assert.equal(alternate.Slawa,'D');assert.notDeepEqual(alternate,config().system.roles);assert.deepEqual(lineup,['David','Cedric','Slawa','Rayan','Lukas','Jan']);
});
test('first team and rotation select the correct server; a service error rotates the opponent only',()=>{
  let s=fresh('us');assert.deepEqual(serverOf(state(s)),{team:'us',player:'David'});
  const d=trace(s,[[.77,.915],[.98,.2]]);assert.equal(d.question,'Aufschlagfehler ins Aus?');assert.deepEqual(state(s).score,{us:0,them:0});
  s=confirm(s,d,'error');const a=state(s);assert.deepEqual(a.score,{us:0,them:1});assert.equal(a.teams.us.rotation,0);assert.equal(a.teams.them.rotation,1);assert.deepEqual(serverOf(a),{team:'them',player:'G2'});assert.equal(a.stats.us.David.serveErrors,1);
});
test('after opponent service a tapped receiver suggests reception error, never rotates the serving opponent again',()=>{
  let s=confirm(fresh('us'),trace(fresh('us'),[[.77,.915],[.98,.2]]),'error');const d=tap(s,'David');
  assert.equal(d.question,'Annahmefehler?');assert.deepEqual(d.contacts.map(c=>c.type),['serve','receive']);assert.equal(d.contacts[0].player,'G2');
  s=confirm(s,d,'error');const a=state(s);assert.deepEqual(a.score,{us:0,them:2});assert.equal(a.teams.them.rotation,1);assert.equal(serverOf(a).player,'G2');assert.equal(a.stats.us.David.receiveErrors,1);assert.equal(a.stats.them.G2.aces,undefined);
});
test('continuous receive → runner → attacker → opponents yields all three contacts and only asks attack outcome',()=>{
  const s=fresh(),nodes=playerNodes(state(s)),receiver=nodes.find(n=>n.player==='David'),setter=nodes.find(n=>n.player==='Jan'),attacker=nodes.find(n=>n.player==='Rayan');
  const d=trace(s,[[receiver.x,receiver.y],[setter.x,setter.y],[attacker.x,attacker.y],[.23,.21]]);
  assert.equal(d.question,'Angriff erfolgreich?');assert.deepEqual(d.contacts.map(c=>c.type),['serve','receive','set','attack']);
  assert.deepEqual(d.contacts.map(c=>c.player),['G1','David','Jan','Rayan']);assert.equal(d.origin,'4');
  const a=state(confirm(s,d,'point'));assert.deepEqual(a.score,{us:1,them:0});assert.equal(a.stats.us.David.receptionsPlayed,1);assert.equal(a.stats.us.Jan.setsPlayed,1);assert.equal(a.distribution.us['4'],1);assert.equal(a.stats.us.Rayan.kills,1);assert.equal(a.teams.us.rotation,1);assert.equal(a.teams.them.rotation,0);assert.equal(serverOf(a).player,'Cedric');
});
test('same long chain with no attack point remains a rally and still retains played reception and set',()=>{
  const s=fresh(),d=trace(s,[[.77,.75],[.64,.565],[.23,.57],[.23,.21]]),a=state(confirm(s,d,'continue'));
  assert.deepEqual(a.score,{us:0,them:0});assert.equal(a.stats.us.David.receptionsPlayed,1);assert.equal(a.stats.us.Jan.setsPlayed,1);assert.equal(a.stats.us.Rayan.kills,undefined);assert.equal(a.stats.us.Rayan.errors,undefined);assert.deepEqual(a.phase,{team:'them',type:'defense',touches:0,player:null});assert.equal(a.teams.us.rotation,0);
});
test('ending on the setter only records delivery, not an invented setter contact',()=>{
  const s=fresh(),d=trace(s,[[.77,.75],[.64,.565]]);assert.deepEqual(d.contacts.map(c=>c.type),['serve','receive']);
  const a=state(confirm(s,d,'played'));assert.equal(a.stats.us.Jan,undefined);assert.equal(a.phase.type,'set');assert.equal(a.phase.player,'Jan');
});
test('partial reception and set gestures compose without duplicate reception or set',()=>{
  let s=fresh();s=confirm(s,trace(s,[[.77,.75],[.64,.565]]),'played');let nodes=playerNodes(state(s)),z=nodes.find(n=>n.player==='Jan'),r=nodes.find(n=>n.player==='Rayan');
  s=confirm(s,trace(s,[[z.x,z.y],[r.x,r.y]],'Jan'),'played');const a=state(s);assert.equal(a.phase.type,'attack');assert.equal(a.stats.us.David.receptionsPlayed,1);assert.equal(a.stats.us.Jan.setsPlayed,1);assert.equal(a.stats.us.Rayan,undefined);
});
test('path passing straight by a third player does not silently add that player as contact',()=>{
  const s=fresh(),d=trace(s,[[.77,.75],[.64,.565],[.23,.57],[.23,.21]]);
  assert.ok(!d.contacts.some(c=>c.player==='Slawa'));assert.equal(d.contacts.filter(c=>c.team==='us').length,3);
});
test('missed opponent return is marked as an unassigned gap and does not invent player contacts',()=>{
  let s=fresh();s=confirm(s,trace(s,[[.77,.75],[.64,.565],[.23,.57],[.23,.21]]),'continue');
  const d=tap(s,'David');assert.equal(d.contacts[0].type,'unknownReturn');assert.equal(d.contacts[0].player,null);assert.equal(d.type,'defense');
  s=confirm(s,d,'error');const a=state(s);assert.equal(a.gaps,1);assert.equal(a.stats.them.G1.attacks,undefined);assert.equal(a.stats.us.David.defenseErrors,1);
});
test('libero automatically replaces back-row middle, restores a serving middle and leaves front row',()=>{
  let s=fresh('them','Devin'),a=state(s);assert.equal(a.teams.us.liberoSlot,5);assert.equal(fieldLineup(a,'us')[4],'Devin');
  s=add(s,{kind:'point',winner:'us'});a=state(s);assert.equal(a.teams.us.order[0],'Cedric');assert.equal(a.teams.us.liberoSlot,null);assert.equal(serverOf(a).player,'Cedric');
  s=add(s,{kind:'point',winner:'them'});a=state(s);assert.equal(a.teams.us.liberoSlot,1);assert.equal(fieldLineup(a,'us')[0],'Devin');
  s=add(s,{kind:'point',winner:'us'});a=state(s);assert.equal(a.teams.us.liberoSlot,6);assert.equal(fieldLineup(a,'us')[5],'Devin');
});
test('libero stays frozen during a rally; player attribution belongs to the libero not the replaced middle',()=>{
  let s=fresh('them','Devin');const d=tap(s,'Devin');s=confirm(s,d,'error');assert.equal(state(s).stats.us.Devin.receiveErrors,1);assert.equal(state(s).stats.us.Lukas,undefined);
  s=add(s,{kind:'point',winner:'us'});const serving=state(s);assert.equal(serving.teams.us.liberoSlot,null);
  const sv=serverOf(serving);s=confirm(s,trace(s,[[.77,.915],[.2,.2]],sv.player),'continue');assert.equal(state(s).teams.us.liberoSlot,null);
});
test('both rotation orders return after six sideouts and opponents keep their service during a streak',()=>{
  let s=fresh('them');for(let i=0;i<6;i++){s=add(s,{kind:'point',winner:'us'});s=add(s,{kind:'point',winner:'them'});}const a=state(s);assert.deepEqual(a.teams.us.order,lineup);assert.deepEqual(a.teams.them.order,opponent);assert.equal(a.teams.us.rotation,0);assert.equal(a.teams.them.rotation,0);
  s=add(s,{kind:'point',winner:'them'});assert.equal(state(s).teams.them.rotation,0);
});
test('5:1 runner targets and long contact chains work across all six rotations without changing order',()=>{
  let s=fresh('them');for(let i=0;i<6;i++){
    const a=state(s),before=[...a.teams.us.order],nodes=playerNodes(a),z=nodes.find(n=>n.team==='us'&&n.role==='Z'),receiver=nodes.find(n=>n.team==='us'&&n.role!=='Z'&&[1,5,6].includes(n.slot)),attacker=nodes.find(n=>n.team==='us'&&n.role==='AA'&&[2,3,4].includes(n.slot));
    assert.equal(z.x,.64);assert.equal(z.y,.565);assert.equal(attacker.x,.23);assert.equal(z.slot,a.teams.us.order.indexOf('Jan')+1);
    const d=trace(s,[[receiver.x,receiver.y],[z.x,z.y],[attacker.x,attacker.y],[.23,.21]],receiver.player);assert.deepEqual(d.contacts.slice(-3).map(c=>c.type),['receive','set','attack']);assert.equal(d.origin,'4');
    const next=state(confirm(s,d,'continue'));assert.deepEqual(next.teams.us.order,before);assert.equal(next.stats.us.Jan.setsPlayed,1);
    s=add(s,{kind:'point',winner:'us'});s=add(s,{kind:'point',winner:'them'});
  }
});
test('undo and reload restore the entire contact chain, both teams, server, libero and stats',()=>{
  const s=fresh('them','Devin'),d=trace(s,[[.77,.75],[.64,.565],[.23,.57],[.23,.21]]),next=confirm(s,d,'point'),loaded=validateSession(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(state(next),state(loaded));assert.deepEqual(undoEvent(loaded),s);assert.deepEqual(totals(undoEvent(loaded)).us,{});
});
test('regular substitutions enforce fixed pairs, one return and six total, without changing role or rotation',()=>{
  let s=fresh('us');s=add(s,{kind:'sub',team:'us',out:'Jan',in:'Devin'});assert.equal(state(s).teams.us.roles.Devin,'Z');
  assert.throws(()=>add(s,{kind:'sub',team:'us',out:'Devin',in:'Lionel'}),/Rückwechsel/);
  s=add(s,{kind:'sub',team:'us',out:'Devin',in:'Jan'});assert.throws(()=>add(s,{kind:'sub',team:'us',out:'Jan',in:'Devin'}),/bereits/);
  s=add(s,{kind:'sub',team:'us',out:'David',in:'Lionel'});s=add(s,{kind:'sub',team:'us',out:'Lionel',in:'David'});s=add(s,{kind:'sub',team:'us',out:'Rayan',in:'Dave'});s=add(s,{kind:'sub',team:'us',out:'Dave',in:'Rayan'});
  assert.equal(state(s).teams.us.subs,6);assert.throws(()=>add(s,{kind:'sub',team:'us',out:'Cedric',in:'Devin'}),/Sechs/);assert.deepEqual(state(s).teams.us.order,lineup);
});
test('opponent replacements keep their current rotated server slot and return only as the same pair',()=>{
  let s=add(fresh('us'),{kind:'point',winner:'them'});assert.equal(serverOf(state(s)).player,'G2');
  s=add(s,{kind:'sub',team:'them',out:'G2',in:'G7'});assert.equal(serverOf(state(s)).player,'G7');assert.equal(state(s).teams.them.rotation,1);
  assert.throws(()=>add(s,{kind:'sub',team:'them',out:'G7',in:'G8'}),/Rückwechsel/);s=add(s,{kind:'sub',team:'them',out:'G7',in:'G2'});assert.equal(serverOf(state(s)).player,'G2');
});
test('service from wrong player, repeated contact, excessive contacts and illegal back-row/libero block are rejected',()=>{
  const s=fresh('us');assert.throws(()=>trace(s,[[.23,.57],[.23,.2]],'Rayan'),/Aufschläger/);
  const play=contacts=>add(s,{kind:'play',contacts});assert.throws(()=>play([{team:'us',player:'Rayan',type:'serve',result:'point'}]),/Aufschläger/);
  let ongoing=confirm(s,trace(s,[[.77,.915],[.2,.2]]),'continue');ongoing=add(ongoing,{kind:'play',contacts:[{team:'them',player:'G1',type:'receive',result:'played'}]});
  assert.throws(()=>add(ongoing,{kind:'play',contacts:[{team:'them',player:'G1',type:'set',result:'played'}]}),/Derselbe/);
  const us=fresh('them','Devin');assert.throws(()=>add(us,{kind:'play',contacts:[{team:'them',player:'G1',type:'serve',result:'played'},{team:'us',player:'Devin',type:'block',result:'point'}]}),/Hinterfeld/);
});
test('timeouts and corrections are reversible and are refused during the rally',()=>{
  let s=fresh();s=add(s,{kind:'timeout',team:'us'});s=add(s,{kind:'timeout',team:'us'});assert.throws(()=>add(s,{kind:'timeout',team:'us'}),/Zwei/);
  const before=structuredClone(s);s=add(s,{kind:'rotate',team:'them'});assert.equal(serverOf(state(s)).player,'G2');assert.deepEqual(undoEvent(s),before);
  s=confirm(s,trace(s,[[.77,.75],[.64,.565]]),'played');assert.throws(()=>add(s,{kind:'timeout',team:'us'}),/zwischen/);
});
test('out/net drafts cannot become kills, and a direct second-contact attack never fabricates a setter assist',()=>{
  const s=fresh('us'),d=trace(s,[[.77,.915],[.5,.465]]);assert.equal(d.target,'net');assert.throws(()=>confirmTrace(d,'point'),/Fehler/);
  const recv=fresh(),direct=trace(recv,[[.77,.75],[.23,.57],[.23,.2]]),a=state(confirm(recv,direct,'point'));assert.equal(a.stats.us.Rayan.kills,1);assert.equal(a.stats.us.Jan,undefined);assert.deepEqual(a.distribution.us,{});
  assert.equal(targetAt([.95,.2],'us'),'out');assert.equal(targetAt([.5,.2],'them'),'own');
});
test('receiver into net remains a reception error; unassigned attack spot removes inferred destination',()=>{
  const s=fresh(),d=trace(s,[[.77,.75],[.6,.465]]);assert.equal(d.type,'receive');assert.equal(d.question,'Annahmefehler?');
  const a=state(confirm(s,d,'error'));assert.equal(a.stats.us.David.receiveErrors,1);assert.equal(a.stats.us.David.attackErrors,undefined);
  const chain=trace(s,[[.77,.75],[.64,.565],[.23,.57],[.23,.21]]);chain.origin='';const next=state(confirm(s,chain,'point'));assert.equal(next.stats.us.Jan.setsPlayed,1);assert.deepEqual(next.distribution.us,{});
  const own=fresh('us'),short=trace(own,[[.77,.915],[.6,.75]]);assert.equal(short.contacts.at(-1).result,'error');assert.throws(()=>confirmTrace(short,'point'),/Fehler/);
});
test('two-point set end, fresh lineup each set and fifth set target 15 are enforced',()=>{
  let s=fresh('us');assert.throws(()=>startSet(s,config(),'next'),/laufenden/);
  for(let set=1;set<=4;set++){for(let i=0;i<25;i++)s=add(s,{kind:'point',winner:set%2?'us':'them'});assert.equal(state(s).finished,true);s=startSet(s,config(set%2?'them':'us'),'set-'+(set+1));}
  assert.equal(s.sets[4].target,15);assert.deepEqual(state(s).score,{us:0,them:0});assert.equal(state(s).teams.us.rotation,0);
});
test('iphone layout reserves bottom safe zone, uses two-team nodes and no production data modules',async()=>{
  const s=fresh(),html=renderActive(s);assert.equal((html.match(/class="rally-player/g)||[]).length,12);assert.ok(html.includes('iphone-guard'));assert.ok(html.includes('Gegner'));assert.ok(html.includes('preserveAspectRatio="none"'));
  const css=await readFile(new URL('../rally.css',import.meta.url),'utf8');assert.ok(css.includes('env(safe-area-inset-bottom)'));assert.ok(css.includes('minmax(0,1fr)'));assert.ok(css.includes('100svh'));assert.ok(css.includes('98px'));
  const controller=await readFile(new URL('../rally-lab.mjs',import.meta.url),'utf8');for(const bad of ['cloud.mjs','supabase.co','rallyboard-auth','indexedDB'])assert.ok(!controller.includes(bad));assert.notEqual(STORAGE_KEY,'rallyboard-scout-lab-v1');
  assert.ok(renderStats(s).includes('keine Bewertung der Annahmequalität'));
});

test('service alternates across sets, deuce needs two-point margin and three set wins end the match',()=>{let s=fresh('us');for(let i=0;i<24;i++){s=add(s,{kind:'point',winner:'us'});s=add(s,{kind:'point',winner:'them'});}s=add(s,{kind:'point',winner:'us'});assert.equal(state(s).finished,false);s=add(s,{kind:'point',winner:'us'});assert.equal(state(s).finished,true);assert.throws(()=>startSet(s,config('us'),'bad'),/Aufschlagrecht/);s=startSet(s,config('them'),'set-2');for(let i=0;i<25;i++)s=add(s,{kind:'point',winner:'us'});s=startSet(s,config('us'),'set-3');for(let i=0;i<25;i++)s=add(s,{kind:'point',winner:'us'});assert.throws(()=>startSet(s,config('them'),'set-4'),/beendet/);});
test('a fourth team contact and a wrong-team contact are refused without mutating saved data',()=>{let s=fresh('them');s=add(s,{kind:'play',contacts:[{team:'them',player:'G1',type:'serve',result:'played'},{team:'us',player:'David',type:'receive',result:'played'},{team:'us',player:'Jan',type:'set',result:'played'},{team:'us',player:'Rayan',type:'defense',result:'played'}]});const before=JSON.stringify(s);assert.throws(()=>add(s,{kind:'play',contacts:[{team:'us',player:'Lukas',type:'attack',result:'point'}]}),/drei/);assert.throws(()=>add(s,{kind:'play',contacts:[{team:'them',player:'G2',type:'attack',result:'point'}]}),/Ballseite/);assert.equal(JSON.stringify(s),before);});

test('back-row reception across another back player into own-side out is an emergency set error, not attack',()=>{
  const s=fresh(),before=JSON.stringify(s),d=trace(s,[[.49,.77],[.23,.77],[.015,.77]]);
  assert.deepEqual(d.contacts.map(c=>c.type),['serve','receive','set']);assert.equal(d.player,'Lukas');assert.equal(d.contacts.at(-1).emergency,true);assert.equal(d.question,'Notzuspiel ins Aus?');assert.equal(d.contacts.at(-1).evidence.crossedNet,false);
  assert.equal(d.receptionQuality.player,'David');assert.equal(JSON.stringify(s),before);
  const a=state(confirm(s,d,'error'));assert.equal(a.stats.us.David.receptionsPlayed,1);assert.equal(a.stats.us.David.receptionsImprecise,1);assert.equal(a.stats.us.David.errors,undefined);assert.equal(a.stats.us.Lukas.emergencySets,1);assert.equal(a.stats.us.Lukas.emergencySetErrors,1);assert.equal(a.stats.us.Lukas.attacks,undefined);assert.deepEqual(a.score,{us:0,them:1});assert.equal(a.teams.them.rotation,0);
});
test('same two back players sending second contact over net creates attack, with neither set nor assist',()=>{
  const s=fresh(),d=trace(s,[[.49,.77],[.23,.77],[.23,.2]]);assert.equal(d.type,'attack');assert.equal(d.question,'Angriff erfolgreich?');assert.equal(d.contacts.at(-1).emergency,undefined);assert.equal(d.contacts.at(-1).evidence.touchNumber,2);assert.equal(d.contacts.at(-1).evidence.crossedNet,true);
  const played=state(confirm(s,d,'continue'));assert.deepEqual(played.score,{us:0,them:0});assert.equal(played.stats.us.Lukas.attacks,1);assert.equal(played.stats.us.Lukas.errors,undefined);assert.equal(played.stats.us.Lukas.sets,undefined);assert.deepEqual(played.distribution.us,{});
  const point=state(confirm(s,d,'point'));assert.equal(point.stats.us.Lukas.kills,1);assert.equal(point.stats.us.David.receptionsImprecise,1);assert.equal(point.teams.us.rotation,1);
});
test('second back-row contact over net and beyond opponent baseline is attack out, before crossing is set out',()=>{
  const s=fresh(),long=trace(s,[[.49,.77],[.23,.77],[.23,.01]]),short=trace(s,[[.49,.77],[.23,.77],[.03,.9]]);
  assert.equal(long.type,'attack');assert.equal(long.question,'Angriffsfehler?');assert.equal(short.type,'set');assert.equal(short.question,'Notzuspiel ins Aus?');
  assert.equal(state(confirm(s,long,'error')).stats.us.Lukas.attackErrors,1);assert.equal(state(confirm(s,short,'error')).stats.us.Lukas.setErrors,1);assert.equal(state(confirm(s,short,'error')).stats.us.Lukas.attackErrors,undefined);
});
test('emergency set to own attacker remains played set; adding third contact creates a complete attack chain',()=>{
  const s=fresh(),delivered=trace(s,[[.49,.77],[.23,.77],[.23,.59]]),full=trace(s,[[.49,.77],[.23,.77],[.23,.59],[.7,.2]]);
  assert.deepEqual(delivered.contacts.map(c=>c.type),['serve','receive','set']);assert.equal(delivered.contacts.at(-1).emergency,true);const a=state(confirm(s,delivered,'played'));assert.equal(a.stats.us.Lukas.setsPlayed,1);assert.equal(a.stats.us.Rayan,undefined);assert.equal(a.phase.type,'attack');
  assert.deepEqual(full.contacts.map(c=>c.type),['serve','receive','set','attack']);const b=state(confirm(s,full,'point'));assert.equal(b.stats.us.Lukas.emergencySets,1);assert.equal(b.stats.us.Rayan.kills,1);assert.equal(b.distribution.us['4'],1);
});
test('a second contact ending at net stays a set error; its back-row variant is marked emergency',()=>{
  const s=fresh(),regular=trace(s,[[.49,.77],[.64,.565],[.64,.465]]),emergency=trace(s,[[.49,.77],[.23,.77],[.23,.465]]);
  assert.equal(regular.type,'set');assert.ok(!regular.contacts.at(-1).emergency);assert.equal(regular.question,'Zuspiel-/Technikfehler?');assert.equal(regular.receptionQuality,null);
  assert.equal(emergency.type,'set');assert.equal(emergency.question,'Notzuspiel ins Netz?');assert.equal(state(confirm(s,emergency,'error')).stats.us.Lukas.emergencySetErrors,1);
});
test('split reception and emergency set reproduce the same stats as one continuous chain and undo is complete',()=>{
  const original=fresh(),whole=confirm(original,trace(original,[[.49,.77],[.23,.77],[.015,.77]]),'error');
  let split=confirm(original,trace(original,[[.49,.77],[.23,.77]]),'played');const beforeSecond=structuredClone(split);split=confirm(split,trace(split,[[.23,.77],[.015,.77]],'Lukas'),'error');
  assert.deepEqual(totals(split),totals(whole));assert.deepEqual(state(split).score,state(whole).score);assert.deepEqual(undoEvent(split),beforeSecond);
  assert.deepEqual(undoEvent(whole),original);assert.deepEqual(state(validateSession(JSON.parse(JSON.stringify(whole)))),state(whole));
});
test('reception quality remains an explicit correctable proposal and never adds a second error point',()=>{
  const s=fresh(),d=trace(s,[[.49,.77],[.23,.77],[.015,.77]]),unrated=reviseDraft(d,{quality:null}),controlled=reviseDraft(d,{quality:'controlled'});
  assert.equal(state(confirm(s,unrated,'error')).stats.us.David.receptionsImprecise,undefined);assert.equal(state(confirm(s,controlled,'error')).stats.us.David.receptionsControlled,1);assert.deepEqual(state(confirm(s,d,'error')).score,{us:0,them:1});
  const forged=confirmTrace(d,'error');forged.contacts[1].qualityConfirmed=false;assert.throws(()=>add(s,forged),/bestätigt/);assert.equal(d.receptionQuality.value,'imprecise');
});
test('manual type correction clears stale emergency labels and only-last drops the removed reception rating',()=>{
  const s=fresh(),d=trace(s,[[.49,.77],[.23,.77],[.015,.77]]),attack=reviseDraft(d,{type:'attack'}),back=reviseDraft(attack,{type:'set'}),only=reviseDraft(d,{onlyLast:true});
  assert.equal(attack.question,'Angriffsfehler?');assert.equal(attack.contacts.at(-1).emergency,false);assert.ok(!contactText(attack.contacts.at(-1)).includes('Notzuspiel'));assert.equal(back.question,'Notzuspiel ins Aus?');assert.equal(only.receptionQuality,null);
  const next=state(confirm(s,only,'error'));assert.equal(next.stats.us.David,undefined);assert.equal(next.stats.us.Lukas.emergencySetErrors,1);
  const html=renderTraceReview(d);assert.ok(html.includes('Notzuspiel'));assert.ok(html.includes('Vermutlich ungenau'));assert.ok(html.includes('Nicht bewerten'));assert.ok(html.includes('data-inferred-type="attack"'));
  const qualityHtml=renderStats(confirm(s,d,'error'));assert.ok(qualityHtml.includes('Annahme ungenau'));assert.ok(qualityHtml.includes('Notzuspiel-Fehler'));
});
test('mirrored opponent back-row emergency set is classified and attributed to the opponent team',()=>{
  const s=fresh('us'),nodes=playerNodes(state(s)),first=nodes.find(n=>n.team==='them'&&n.slot===1),second=nodes.find(n=>n.team==='them'&&n.slot===6);
  const d=trace(s,[[first.x,first.y],[second.x,second.y],[.5,.005]],first.player,'them');assert.equal(d.type,'set');assert.equal(d.contacts.at(-1).emergency,true);
  const a=state(confirm(s,d,'error'));assert.equal(a.stats.them.G6.emergencySetErrors,1);assert.deepEqual(a.score,{us:1,them:0});assert.deepEqual(a.stats.us.David,{serves:1,inferredContacts:1});
});
test('ambiguous straight transfer across two back teammates asks for a clearer contact, while a turn resolves it',()=>{
  const c=config();c.system.roles=rolesFromSetter(lineup,'Slawa');const s=startSet(newSession(),c,'set-1');
  assert.throws(()=>trace(s,[[.79,.77],[.015,.77]],'Jan'),/Mehrere Hinterspieler/);
  const d=trace(s,[[.79,.77],[.23,.77],[.03,.93]],'Jan');assert.equal(d.player,'Lukas');assert.equal(d.type,'set');assert.equal(d.contacts.filter(c=>c.team==='us').length,2);
  assert.equal(crossesNet([[.2,.77],[.2,.2],[.23,.77],[.02,.77]],'us',2),false);
});
