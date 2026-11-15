import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrate,resetTracking,restoreTracking} from '../model.mjs';
import {startSet,rolesFromSetter,appendEvent,undoEvent,reduceSet} from '../rally-model.mjs';
import {fieldSession,saveFieldMatch} from '../field-match.mjs';
import {summarizeField,renderFieldReport} from '../field-report.mjs';
import {analyze,selectMatches} from '../analytics.mjs';
import {viewerBoard} from '../access.mjs';
import {renderStats} from '../stats.mjs';

const date='2026-11-15',id='fixture';
function example(){
  const db=migrate();const m={id,opponent:'Testgegner',date,done:false,planned:true,sets:[]};db.matches.push(m);
  const base=fieldSession(m,db.players),us=db.players.slice(0,6);
  const first=startSet(base,{serving:'them',lineups:{us,them:base.opponents.slice(0,6)},system:{type:'5:1',roles:rolesFromSetter(us,us[1])}},'set1');
  const session=appendEvent(first,{id:'chain',kind:'play',trace:[[0,0],[1,1]],contacts:[
    {team:'them',player:'G1',type:'serve',result:'continue'},
    {team:'us',player:us[0],type:'receive',result:'played',qualityConfirmed:true,receptionQuality:'imprecise'},
    {team:'us',player:us[1],type:'set',result:'played',origin:'2h'},
    {team:'us',player:us[2],type:'attack',result:'point',origin:'2h'}
  ]});
  return {db,m,session,us};
}
test('field match score, backup, viewer projection and seasonal rates agree after save, reload and undo',()=>{
  const {db,m,session,us}=example();
  const revision=saveFieldMatch(db,id,session,null,date);
  assert.equal(db.current,id);assert.deepEqual(m.sets[0].score,[1,0]);
  assert.ok(!('trace' in m.sets[0].field.events[0]));
  assert.equal(m.sets[0].actions[us[0]]['Gute Annahme'],undefined);
  assert.equal(m.sets[0].pos['5'],1);
  const restored=fieldSession(JSON.parse(JSON.stringify(m)),db.players);
  assert.deepEqual(reduceSet(restored.sets[0]).score,{us:1,them:0});
  // Same aggregate fields allowed by the deployed public read RPC.
  const {actions,pos,score,active,coverage,teamErrors,subs}=m.sets[0];
  const publicDb=viewerBoard({players:db.players,matches:[{id,date,opponent:m.opponent,sets:[{actions,pos,score,active,coverage,teamErrors,subs}]}]});
  const scoped=selectMatches(publicDb.matches,{season:'2026',matchId:id,setIndex:'0'});
  assert.equal(analyze(scoped).kills,1);assert.equal(summarizeField(scoped).team.attacks,1);
  assert.match(renderStats(publicDb,{matchId:id}),/1 Annahme wurde als ungenau bestätigt/);
  assert.match(renderFieldReport(summarizeField(scoped),'players'),/1 \/ 1/);
  assert.equal(summarizeField(selectMatches(publicDb.matches,{season:'2025'})).setCount,0);
  assert.throws(()=>saveFieldMatch(db,id,restored,null,date),/geändert/);
  const archived=resetTracking(db,id);assert.equal(summarizeField([m]).setCount,0);
  restoreTracking(db,id,archived);assert.equal(summarizeField([m]).team.kills,1);
  saveFieldMatch(db,id,undoEvent(restored),revision,date);
  assert.deepEqual(m.sets[0].score,[0,0]);assert.equal(analyze([m]).kills,0);
  assert.equal(summarizeField([m]).team.attacks,undefined);
});
test('field entry rejects future, finished and existing manual sets',()=>{
  const {db,m,session}=example();
  assert.throws(()=>saveFieldMatch(db,id,session,null,'2026-11-14'),/Spieltag/);
  m.done=true;assert.throws(()=>saveFieldMatch(db,id,session,null,date),/beendet/);
  m.done=false;m.sets=[{actions:{}}];assert.throws(()=>fieldSession(m,db.players),/Aktionstasten/);
  assert.throws(()=>saveFieldMatch(db,id,session,null,date),/geändert/);
});
