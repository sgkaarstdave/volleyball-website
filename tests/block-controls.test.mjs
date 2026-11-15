import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSession, startSet, rolesFromSetter, reduceSet, playerNodes, STORAGE_KEY} from '../rally-model.mjs';

// Exercise the controller's pointer and click handlers with an in-memory
// dialog, badge rectangles and storage. Native touch delivery is device-specific.
test('block dialog buttons save the swipe or tap, continue on either side, cancel and undo', async () => {
  const lineup=['David','Cedric','Slawa','Rayan','Lukas','Jan'];
  const session=startSet(newSession(),{
    serving:'us',lineups:{us:lineup,them:['G1','G2','G3','G4','G5','G6']},
    system:{type:'5:1',roles:rolesFromSetter(lineup,'Jan')}
  },'set');
  const data=new Map([[STORAGE_KEY,JSON.stringify(session)]]);
  const saved=()=>reduceSet(JSON.parse(data.get(STORAGE_KEY)).sets[0]);
  const ids=new Map();
  function element(id){
    const el={style:{},addEventListener(){},setAttribute(){},
      set innerHTML(html){this.html=html;for(const [,child] of html.matchAll(/ id="([^"]+)"/g))element(child);}};
    ids.set(id,el);return el;
  }
  element('lab-app');element('lab-notice');
  const dialog=element('lab-dialog');
  dialog.close=()=>{dialog.open=false;};dialog.showModal=()=>{dialog.open=true;};
  let nodes=[];
  function buttonAt(n){
    const x=n.x*300,y=n.y*400;
    const label={getBoundingClientRect:()=>({left:x-14,right:x+14,top:y-14,bottom:y+14})};
    const b={x,y,dataset:{team:n.team,player:n.player,node:n.id},querySelectorAll:()=>[label]};
    b.closest=()=>b;return b;
  }
  function find(selector){
    const el=ids.get(selector.slice(1));
    if(selector==='#rally-court' && !el.querySelectorAll){
      nodes=playerNodes(saved()).map(buttonAt);
      el.querySelectorAll=()=>nodes;el.getBoundingClientRect=()=>({left:0,top:0,width:300,height:400});
      el.setPointerCapture=()=>{};el.hasPointerCapture=()=>false;
    }
    return el||null;
  }
  globalThis.document={querySelector:find,body:{classList:{toggle(){},remove(){},add(){}}}};
  globalThis.window={addEventListener(){}};
  globalThis.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  await import('../rally-lab.mjs');
  function gesture(from,to){
    const court=find('#rally-court'),a=nodes.find(n=>n.dataset.player===from),b=nodes.find(n=>n.dataset.player===to);
    court.onpointerdown({target:a,isPrimary:true,pointerId:1,button:0,clientX:a.x,clientY:a.y,preventDefault(){}});
    court.onpointerup({pointerId:1,clientX:b.x,clientY:b.y});
  }
  function click(id){assert.ok(dialog.open && dialog.html.includes('id="'+id+'"'));find('#'+id).onclick();}
  for(const team of ['us','them']){
    gesture('G4','Slawa');click('block-continues');
    assert.equal(saved().stats.us.Slawa,undefined);
    click('block-'+team);
    assert.equal(dialog.open,false);assert.deepEqual(saved().score,{us:0,them:0});
    assert.equal(saved().phase.team,team);assert.equal(saved().stats.us.Slawa.blockAttempts,1);
    find('#rally-undo').onclick();
  }
  gesture('G4','Slawa');click('block-point');
  assert.equal(saved().score.us,1);assert.equal(saved().stats.them.G4.attacks,1);
  find('#rally-undo').onclick();
  find('#rally-type').onchange({target:{value:'block'}});
  gesture('Slawa','Slawa');click('cancel-block');
  assert.deepEqual(saved().score,{us:0,them:0});
  gesture('Slawa','Slawa');click('missing-attack');click('block-point');
  assert.equal(saved().stats.us.Slawa.blocks,1);assert.equal(find('#rally-type').value,'auto');
});
