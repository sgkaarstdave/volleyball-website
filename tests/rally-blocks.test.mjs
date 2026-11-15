import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSession,startSet,rolesFromSetter,reduceSet,appendEvent,undoEvent,validateSession,recognizeTrace,confirmTrace,reviseDraft,playerNodes} from '../rally-model.mjs';
import {renderBlockControls,contactText} from '../rally-view.mjs';
const lineup=['David','Cedric','Slawa','Rayan','Lukas','Jan'];
const fresh=(serving='us')=>startSet(newSession(),{lineups:{us:lineup,them:['G1','G2','G3','G4','G5','G6']},serving,system:{type:'5:1',roles:rolesFromSetter(lineup,'Jan'),libero:null}},'a');
const state=s=>reduceSet(s.sets.at(-1));
const contact=(team,player,type,result='played',extra={})=>({team,player,type,result,...extra});
const play=(s,contacts)=>appendEvent(s,{id:'e'+s.sets[0].events.length,kind:'play',contacts});
function incoming(){let s=fresh();s=play(s,[contact('us','David','serve','continue')]);return play(s,[contact('them','G1','defense'),contact('them','G3','set'),contact('them','G4','attack','continue')]);}

function swipe(s, from, to, end=true) {
  const a=state(s),nodes=playerNodes(a),start=nodes.find(n=>n.player===from),stop=nodes.find(n=>n.player===to);
  return recognizeTrace(a,{team:start.team,player:from,nodes,endNode:end?stop.id:null,samples:[[start.x,start.y,0],[stop.x,stop.y,180]]});
}

test('direct attack to a blocker counts once, on both sides, and can be undone as one gesture',()=>{
  for(const [serving,from,to] of [['us','G4','Slawa'],['them','Rayan','G3']]){
    const s=fresh(serving),draft=swipe(s,from,to);
    assert.deepEqual(draft.contacts.map(c=>c.type),['serve','attack','block']);
    assert.equal(draft.player,to);
    for(const result of ['point','continue']){
      const event=confirmTrace(reviseDraft(draft,{blockBallTo:serving} ),result);
      const next=appendEvent(s,{id:'stroke',...event}),a=state(next);
      assert.equal(a.stats[serving][to].blockAttempts,1);
      assert.equal(a.stats[serving][to].blocks??0,result==='point'?1:0);
      assert.equal(a.score[serving],result==='point'?1:0);
      assert.equal(a.stats[serving==='us'?'them':'us'][from].attacks,1);
      assert.equal(a.phase.team,serving);
      assert.deepEqual(undoEvent(next),s);
    }
  }
});
test('a repeat stroke from an already recorded attacker attaches the block without another attack',()=>{
  const s=incoming(),draft=swipe(s,'G4','Slawa');
  assert.deepEqual(draft.contacts.map(c=>c.type),['block']);
  const a=state(play(s,confirmTrace(draft,'point').contacts));
  assert.equal(a.stats.them.G4.attacks,1);
  assert.equal(a.stats.us.Slawa.blocks,1);
});
test('serve, empty landing area, and back-row destination keep ordinary stroke handling',()=>{
  assert.equal(swipe(fresh('them'),'G1','Slawa').type,'serve');
  assert.notEqual(swipe(fresh(),'G4','David').type,'block');
  assert.notEqual(swipe(fresh(),'G4','Slawa',false).type,'block');
});
test('manual block tap asks about missing attack before scoring and permits both initial servers',()=>{
  for(const serving of ['us','them']){
    const s=fresh(serving),d=recognizeTrace(state(s),{team:'us',player:'Slawa',tap:true,override:'block'});
    assert.ok(d.confirmMissingAttack);
    const a=state(play(s,confirmTrace(d,'point').contacts));assert.equal(a.stats.us.Slawa.blocks,1);
    assert.equal(Object.values(a.stats.them).some(row=>row.attacks),false);
    assert.throws(()=>recognizeTrace(state(s),{team:'us',player:'David',tap:true,override:'block'}),/Vorderfeld/);
  }
});

test('blocker may play next ball; block does not consume one of three team hits',()=>{
  let s=play(incoming(),[contact('us','Slawa','block','continue',{ballTo:'us'})]);assert.equal(state(s).phase.touches,0);
  s=play(s,[contact('us','Slawa','defense'),contact('us','Jan','set'),contact('us','Rayan','attack','point')]);
  const a=state(s);assert.deepEqual(a.score,{us:1,them:0});assert.equal(a.stats.us.Slawa.blockAttempts,1);assert.equal(a.stats.us.Slawa.defensesPlayed,1);assert.equal(a.stats.us.Rayan.kills,1);
});
test('continued block can land on attacking side; coverage there gets three contacts',()=>{
  let s=play(incoming(),[contact('us','Slawa','block','continue',{ballTo:'them'})]);assert.equal(state(s).phase.team,'them');assert.equal(state(s).phase.touches,0);
  s=play(s,[contact('them','G1','defense'),contact('them','G3','set'),contact('them','G4','attack','point')]);assert.deepEqual(state(s).score,{us:0,them:1});assert.equal(state(s).stats.us.Slawa.blocks,undefined);
});
test('open block survives reload; either team can draw coverage, set and attack, then undo',()=>{
  const setup=incoming();
  const block=recognizeTrace(state(setup),{team:'us',player:'Slawa',tap:true,override:'block'});
  const pending=JSON.parse(JSON.stringify(play(setup,confirmTrace(block,'continue').contacts)));
  assert.equal(state(pending).phase.team,null);
  for(const [team,players] of [['us',['Slawa','Jan','Rayan']],['them',['G1','G3','G4']]]){
    const nodes=playerNodes(state(pending));
    const coords=players.map(player=>{const n=nodes.find(n=>n.team===team && n.player===player);return [n.x,n.y];});
    const samples=coords.flatMap((p,i)=>[[...p,i*300],[...p,i*300+180]]);
    samples.push([coords[2][0],team==='us'?.2:.7,900]);
    const draft=recognizeTrace(state(pending),{team,player:players[0],samples});
    assert.deepEqual(draft.contacts.map(c=>c.type),['defense','set','attack']);
    const next=play(pending,confirmTrace(draft,'point').contacts);
    assert.equal(state(next).score[team],1);assert.equal(state(next).gaps,0);
    assert.deepEqual(undoEvent(next),pending);
    const repeat=recognizeTrace(state(pending),{team,player:players[2],tap:true,override:'block'});
    assert.equal(repeat.confirmMissingAttack,false);
    assert.deepEqual(repeat.contacts.map(c=>c.type),['block']);
    assert.equal(state(play(pending,confirmTrace(repeat,'continue').contacts)).phase.team,null);
  }
});
test('new events reject blocking a serve; existing unversioned test data remains readable',()=>{
  const s=play(fresh(),[contact('us','David','serve','continue')]),event={id:'legacy-block',kind:'play',contacts:[contact('them','G3','block','point')]};
  assert.throws(()=>appendEvent(s,event),/Aufschlag.*geblockt/);
  const legacy=structuredClone(s);legacy.sets[0].events.push(event);assert.doesNotThrow(()=>validateSession(legacy));assert.equal(state(legacy).score.them,1);
});
test('previously selected block destinations still replay and appear in the log',()=>{
  const s=incoming(),draft=recognizeTrace(state(s),{team:'us',player:'Slawa',tap:true,override:'block'}),corrected=reviseDraft(draft,{blockBallTo:'them'}),event=confirmTrace(corrected,'continue');
  assert.equal(renderBlockControls(corrected),'');assert.match(contactText(event.contacts[0]),/Ball bei Gegner/);assert.equal(state(play(s,event.contacts)).phase.team,'them');
});
test('out attack only becomes a kill with explicit opponent block touch; serve and net stay errors',()=>{
  const s=incoming(),a=playerNodes(state(s)).find(n=>n.player==='Rayan'),draft=recognizeTrace(state(s),{team:'us',player:'Rayan',samples:[[a.x,a.y,0],[a.x,.2,100],[a.x,.01,200]],override:'attack'});
  assert.equal(draft.target,'out');assert.throws(()=>confirmTrace(draft,'point'),/Fehler bestätigen/);assert.match(renderBlockControls(draft),/data-block-touch="true"/);
  const event=confirmTrace(reviseDraft(draft,{blockTouch:true}),'point'),r=state(play(s,event.contacts));assert.equal(r.stats.us.Rayan.kills,1);assert.equal(r.stats.us.Rayan.blockOutKills,1);assert.equal(r.stats.us.Rayan.errors,undefined);assert.match(contactText(event.contacts.at(-1)),/Block-out/);
  const serve=recognizeTrace(state(fresh()),{team:'us',player:'David',samples:[[.77,.915],[.98,.2]]});assert.throws(()=>reviseDraft(serve,{blockTouch:true}),/Block-out/);assert.equal(renderBlockControls(serve),'');
  const net=recognizeTrace(state(s),{team:'us',player:'Rayan',samples:[[a.x,a.y],[a.x,.465]],override:'attack'});assert.throws(()=>reviseDraft(net,{blockTouch:true}),/Block-out/);
});
test('direct reception return retains reception counters; corrections remove stale source type',()=>{
  const s=fresh('them'),n=playerNodes(state(s)).find(n=>n.player==='David'),d=recognizeTrace(state(s),{team:'us',player:'David',samples:[[n.x,n.y,0],[n.x,.2,200]]});
  assert.equal(d.type,'freeball');assert.equal(d.contacts.at(-1).sourceContact,'receive');
  const a=state(play(s,confirmTrace(d,'continue').contacts));assert.equal(a.stats.us.David.receptions,1);assert.equal(a.stats.us.David.receptionsPlayed,1);assert.equal(a.stats.us.David.freeballs,1);
  const corrected=reviseDraft(d,{type:'attack'});assert.equal(corrected.contacts.at(-1).sourceContact,undefined);assert.doesNotThrow(()=>play(s,confirmTrace(corrected,'continue').contacts));
  const failed=state(play(s,confirmTrace(d,'error').contacts));assert.equal(failed.stats.us.David.errors,1);assert.equal(failed.stats.us.David.receiveErrors,1);assert.equal(failed.stats.us.David.freeballErrors,undefined);assert.equal(failed.score.them,1);
});
test('libero can send a legal third-contact freeball without an invented attack or second reception',()=>{
  let s=startSet(newSession(),{lineups:{us:lineup,them:['G1','G2','G3','G4','G5','G6']},serving:'them',system:{type:'5:1',roles:rolesFromSetter(lineup,'Jan'),libero:'Devin'}},'libero');
  s=play(s,[contact('them','G1','serve','continue'),contact('us','David','receive'),contact('us','Jan','set')]);
  const n=playerNodes(state(s)).find(n=>n.player==='Devin'),d=recognizeTrace(state(s),{team:'us',player:'Devin',samples:[[n.x,n.y,0],[n.x,.18,200]]});assert.equal(d.type,'freeball');assert.equal(d.contacts.length,1);assert.equal(d.contacts[0].sourceContact,undefined);
  s=play(s,confirmTrace(d,'continue').contacts);assert.equal(state(s).stats.us.Devin.freeballs,1);assert.equal(state(s).stats.us.Devin.attacks,undefined);assert.equal(state(s).stats.us.Devin.receptions,undefined);assert.equal(state(s).phase.team,'them');
});
