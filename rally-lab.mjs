import {STORAGE_KEY,BACKUP_KEY,newSession,validateSession,rolesFromSetter,startSet,reduceSet,appendEvent,undoEvent,fieldLineup,serverOf,playerNodes,recognizeTrace,confirmTrace,reviseDraft,TYPES,SPOTS,spotLabel,other} from './rally-model.mjs?v=rally5';
import {esc,teamLabel,eventText,contactText,renderActive,renderWelcome,renderStats,renderTraceReview,renderBlockControls,contactName} from './rally-view.mjs?v=rally5';
const $=s=>document.querySelector(s),uid=()=>crypto.randomUUID();
let session=newSession(),baseline=null,error='',broken=false,legacyRaw=null,override='auto',rotationOnly=false,gesture=null;
try{baseline=localStorage.getItem(STORAGE_KEY);if(baseline)session=validateSession(JSON.parse(baseline));else{legacyRaw=localStorage.getItem('rallyboard-scout-lab-v1');if(legacyRaw){const previous=JSON.parse(legacyRaw);session.legacyV1=previous;if(previous.roster?.length>=6)session.roster=[...previous.roster];}}}catch(e){broken=true;error='Vorhandene Testdaten konnten nicht geladen werden. Exportiere die Sicherung vor einem neuen Test.';}
const current=()=>session.sets.at(-1),state=()=>current()&&reduceSet(current());
function notice(text){
  const dialog=$('#lab-dialog');
  if(dialog.open){
    let message=dialog.querySelector('[role="alert"]');
    if(!message){message=document.createElement('p');message.className='error';message.setAttribute('role','alert');dialog.querySelector('.dialog-head').after(message);}
    message.textContent=text;
    message.scrollIntoView({block:'nearest'});
    return;
  }
  $('#lab-notice').textContent=text;$('#lab-notice').style.display='block';clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('#lab-notice').style.display='none',3700);
}
function persist(next,force=false){try{if(broken&&!force)throw Error(error);if(localStorage.getItem(STORAGE_KEY)!==baseline)throw Error('Anderer Tab hat den Test geändert. Bitte neu laden.');validateSession(next);const raw=JSON.stringify(next);localStorage.setItem(STORAGE_KEY,raw);baseline=raw;session=next;broken=false;error='';render();return true;}catch(e){error=e.message;notice('Nicht gespeichert: '+error);return false;}}
function commit(value){try{return persist(appendEvent(session,{id:uid(),at:new Date().toISOString(),...value}));}catch(e){notice(e.message);return false;}}
const close='<button id="close-rally-dialog" type="button" aria-label="Schließen">✕</button>';
const heading=(small,title)=>`<div class="dialog-head"><div><small>${small}</small><h2>${title}</h2></div>${close}</div>`;
function dialog(html){const d=$('#lab-dialog');if(d.open)d.close();d.innerHTML=html;d.showModal();$('#close-rally-dialog').onclick=()=>d.close();}
function setup(){
  const previous=state(),assign={us:{},them:{}},order=[4,3,2,5,6,1],lockedServing=session.sets.length>0&&session.sets.length<4?(session.sets.length%2?other(session.sets[0].serving):session.sets[0].serving):null;let step=0,zone=4,setter='',libero='',serving=lockedServing,first='',middleFirst=false;
  const names=t=>t==='us'?session.roster:session.opponents;
  const selected=t=>[1,2,3,4,5,6].map(p=>assign[t][p]);
  function paint(){
    const team=step===1?'them':'us',list=selected(team),full=list.filter(Boolean).length===6;
    const roles=setter&&selected('us').every(Boolean)?rolesFromSetter(selected('us'),setter,middleFirst):{};
    dialog(heading(`AUFSTELLUNG · SCHRITT ${step+1} / 3`,step===0?'SG Kaarst · 5:1':step===1?'Gegner · Rotationsfolge':'Wer schlägt zuerst auf?')+
      (step<2?`<p class="fine">${team==='us'?'Sechs Startspieler auf Rotationsplätze setzen. Danach den Zuspieler wählen.':'Nummern der Gegner auf ihre Rotationsplätze setzen. Auch der Gegner rotiert beim eigenen Aufschlaggewinn.'}</p><div class="setup-grid">${order.map(p=>`<button data-setup-zone="${p}" class="${zone===p?'selected':''}"><small>Rotationsplatz ${p}</small><b>${esc(assign[team][p]||'Wählen')}</b></button>`).join('')}</div><div class="people-picker">${names(team).map((n,i)=>`<button data-setup-name="${i}" class="${list.includes(n)?'used':''}">${esc(n)}</button>`).join('')}</div>${previous?'<button id="copy-previous" class="wide">Letzte Feldaufstellung übernehmen</button>':''}${team==='them'?'<button id="fill-opponent" class="wide">Gegner 1–6 übernehmen</button>':''}${team==='us'&&full?`<label class="form-label" for="setup-setter">Fester Zuspieler · 5:1</label><select class="form-input" id="setup-setter"><option value="">Zuspieler wählen</option>${list.map(n=>`<option ${n===setter?'selected':''}>${esc(n)}</option>`).join('')}</select><div class="setup-roles">${setter?list.map(n=>`<div>${({Z:'Zuspieler',D:'Diagonal',AA:'Außenangriff',MB:'Mittelblock'}[roles[n]])}<b>${esc(n)}</b></div>`).join(''):''}</div><p class="fine">Die gegenüberliegenden Rollenpaare folgen dem 5:1-System. Außen und Mitte lassen sich unten tauschen.</p>${setter?'<button id="swap-roles" class="wide">Außen / Mitte in der Folge tauschen</button>':''}<label class="form-label" for="setup-libero">Libero · optional, ersetzt Mittelspieler im Hinterfeld</label><select id="setup-libero" class="form-input"><option value="">Ohne Libero</option>${session.roster.filter(n=>!list.includes(n)).map(n=>`<option ${n===libero?'selected':''}>${esc(n)}</option>`).join('')}</select>`:''}`:
      `<p class="fine">Der erste Aufschläger wird automatisch hinter der Grundlinie angezeigt. Die Aufschlagreihenfolge und beide Rotationen bleiben gekoppelt. Die Spielansicht zeigt die Laufziele nach dem Aufschlag; „Rotation ansehen“ zeigt die gemeldete Ordnung.</p><div class="setup-serve"><button data-first-team="us" class="${serving==='us'?'selected':''}">Wir · SG Kaarst</button><button data-first-team="them" class="${serving==='them'?'selected':''}">Gegner</button></div>${serving?`<label class="form-label" for="first-server">Erster Aufschläger</label><select id="first-server" class="form-input">${selected(serving).map(n=>`<option ${n===first?'selected':''}>${esc(n)}</option>`).join('')}</select><p class="fine">Die Startaufstellung wird als Ganzes so gedreht, dass ${esc(first)} auf Position 1 beginnt. Beim ersten Annahmeteam erfolgt noch keine zusätzliche Rotation.</p>`:''}`)+
      `<div class="rally-confirm">${step?'<button id="setup-back">Zurück</button>':''}<button id="setup-next" class="primary" ${step===0?full&&setter?'':'disabled':step===1?full?'':'disabled':serving?'':'disabled'}>${step===2?'Aufstellungen bestätigen & starten':'Weiter'}</button></div><p class="fine">Nur dieser getrennte Test. Eure echten Spiele bleiben unberührt.</p>`);
    document.querySelectorAll('[data-setup-zone]').forEach(b=>b.onclick=()=>{zone=+b.dataset.setupZone;paint();});
    document.querySelectorAll('[data-setup-name]').forEach(b=>b.onclick=()=>{
      const n=names(team)[+b.dataset.setupName],p=Object.keys(assign[team]).find(k=>assign[team][k]===n),replaced=assign[team][zone];
      if(Number(p)===zone)delete assign[team][zone];else{if(p){delete assign[team][p];if(replaced)assign[team][p]=replaced;}assign[team][zone]=n;}
      if(!selected('us').includes(setter))setter='';if(selected('us').includes(libero))libero='';zone=order.find(p=>!assign[team][p])||zone;paint();
    });
    $('#setup-setter')?.addEventListener('change',e=>{setter=e.target.value;paint();});
    $('#setup-libero')?.addEventListener('change',e=>{libero=e.target.value;});
    $('#swap-roles')?.addEventListener('click',()=>{middleFirst=!middleFirst;paint();});
    $('#fill-opponent')?.addEventListener('click',()=>{session.opponents.slice(0,6).forEach((n,i)=>assign.them[i+1]=n);paint();});
    $('#copy-previous')?.addEventListener('click',()=>{previous.teams[team].order.forEach((n,i)=>assign[team][i+1]=n);if(team==='us'){setter=previous.teams.us.order.find(n=>previous.teams.us.roles[n]==='Z')||'';libero=previous.system.libero||'';const i=previous.teams.us.order.indexOf(setter);middleFirst=previous.teams.us.roles[previous.teams.us.order[(i+1)%6]]==='MB';}paint();});
    document.querySelectorAll('[data-first-team]').forEach(b=>{b.disabled=!!lockedServing&&b.dataset.firstTeam!==lockedServing;b.onclick=()=>{serving=b.dataset.firstTeam;first=selected(serving)[0];paint();};});
    $('#first-server')?.addEventListener('change',e=>{first=e.target.value;paint();});
    $('#setup-back')?.addEventListener('click',()=>{step--;zone=4;paint();});
    $('#setup-next').onclick=()=>{if(step<2){step++;zone=4;if(step===2&&serving)first=selected(serving)[0];paint();return;}try{const lineups={us:selected('us'),them:selected('them')},index=lineups[serving].indexOf(first);lineups[serving]=[...lineups[serving].slice(index),...lineups[serving].slice(0,index)];const system={type:'5:1',roles:rolesFromSetter(selected('us'),setter,middleFirst),libero:libero||null};if(persist(startSet(session,{lineups,system,serving},uid()))){$('#lab-dialog').close();notice(first+' beginnt mit Aufschlag.');}}catch(e){notice(e.message);}};
  }
  paint();
}
function confirmPanel(draft){
  if(draft.type==='block' && draft.contacts.at(-1).result!=='error')return confirmBlock(draft);
  const setId=current().id,count=current().events.length,last=draft.contacts.at(-1),errorSuggested=last.result==='error',scoring=['attack','serve','block','freeball'].includes(last.type)&&!errorSuggested;
  const review=renderTraceReview(draft);
  dialog(heading('ERKANNTER SPIELZUG',esc(draft.player)+' · '+contactName(last))+`${review}${renderBlockControls(draft)}<p class="rally-question">${esc(draft.question)}</p><div class="rally-confirm">${errorSuggested?'<button class="failure" data-result="error">Ja · Fehler zählen</button><button id="draw-again">Nein · neu zeichnen</button>':scoring?'<button class="success" data-result="point">Ja · Punkt</button><button data-result="continue">Nein · Ball läuft weiter</button>':'<button class="success" data-result="played">Ja · weitergespielt</button><button id="draw-again">Nein · verwerfen</button>'}</div>${scoring?'<button class="wide" data-result="error">Angriffs-/Kontaktfehler · Gegnerpunkt</button>':''}<p class="fine">${errorSuggested?'Die ganze gezeichnete Kontaktfolge wird zusammen gespeichert, der Gegner bekommt einen Punkt.':scoring?'Bei „Nein“ gibt es keinen Fehler und keinen Punkt. Vorher gezeichnete Annahme und Zuspiel werden trotzdem als weitergespielt erfasst.':'Kein Punkt. Der nächste erwartete Kontakt wird automatisch gewählt.'}</p><details class="dialog-details"><summary>Erkennung prüfen oder korrigieren</summary><p>Die Kontaktfolge ist aus deinem Weg abgeleitet. Nicht gezeichnete Ballkontakte werden nicht als gute Annahme oder gutes Zuspiel erfunden.</p>${draft.prefixCount?'<p>Vorheriger Aufschlag/Rückball wurde aus der Spielsituation ergänzt und ist als abgeleitet markiert.</p>':''}${last.type==='attack'?`<label class="form-label" for="rally-origin">Angriffsort</label><select class="form-input" id="rally-origin"><option value="">Nicht zuordnen</option>${SPOTS.map(p=>`<option value="${p}" ${draft.origin===p?'selected':''}>Pos. ${spotLabel(p)}</option>`).join('')}</select>`:''}<label class="form-label" for="rally-contact-type">Letzten Kontakt korrigieren</label><select class="form-input" id="rally-contact-type">${Object.entries(TYPES).filter(([t])=>t!=='unknownReturn').map(([t,label])=>`<option value="${t}" ${t===last.type?'selected':''}>${label}</option>`).join('')}</select><button class="wide" id="only-last">Nur den letzten Kontakt erfassen</button></details>`);
  $('#rally-origin')?.addEventListener('change',e=>{draft=reviseDraft(draft,{origin:e.target.value});});
  $('#block-ball-to')?.addEventListener('change',e=>{draft=reviseDraft(draft,{blockBallTo:e.target.value});});
  $('#reception-quality')?.addEventListener('change',e=>{draft=reviseDraft(draft,{quality:e.target.value||null});});
  document.querySelectorAll('[data-inferred-type]').forEach(b=>b.onclick=()=>confirmPanel(reviseDraft(draft,{type:b.dataset.inferredType})));
  $('#rally-contact-type').onchange=e=>confirmPanel(reviseDraft(draft,{type:e.target.value}));
  $('#only-last').onclick=()=>confirmPanel(reviseDraft(draft,{onlyLast:true}));
  $('#draw-again')?.addEventListener('click',()=>$('#lab-dialog').close());
  document.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{if(current().id!==setId||current().events.length!==count){$('#lab-dialog').close();notice('Der Ballwechsel hat sich geändert. Bitte neu erfassen.');return;}try{const before=state(),event=confirmTrace(b.dataset.blockTouch?reviseDraft(draft,{blockTouch:true}):draft,b.dataset.result);if(commit(event)){const after=state(),rotated=['us','them'].find(t=>before.teams[t].rotation!==after.teams[t].rotation);$('#lab-dialog').close();notice(after.finished?'Satz beendet · nächste Aufstellung im Spielmenü':rotated?teamLabel(rotated)+' rotiert · '+serverOf(after).player+' hat Aufschlag':'Spielzug gespeichert · '+TYPES[after.phase.type]+' als Nächstes');}}catch(e){notice(e.message);}});
}
function clearGesture(){gesture=null;document.body.classList.remove('rally-drawing');$('#rally-trail')?.setAttribute('d','');}
function confirmBlock(draft){
  const set=current(),eventCount=set.events.length;
  if(draft.confirmMissingAttack){
    dialog(heading('BLOCK','Hat der Gegner bereits angegriffen?')+'<p>Im Protokoll fehlt der Ball vor dem Block. Der Angriff bleibt ohne Spielerzuordnung.</p><div class="rally-confirm"><button id="missing-attack">Ja · weiter zum Block</button><button id="cancel-block">Abbrechen</button></div>');
    $('#missing-attack').onclick=()=>confirmBlock({...draft,confirmMissingAttack:false});
    $('#cancel-block').onclick=()=>$('#lab-dialog').close();
    return;
  }
  try{
    appendEvent(session,{...confirmTrace(draft,'continue'),id:uid()});
  }catch(e){
    notice(e.message+' Für einen beobachteten Angriff direkt vom Angreifer zum Vorderfeldblocker ziehen.');
    return;
  }
  function save(result,ballTo){
    if(current().id!==set.id || current().events.length!==eventCount){
      $('#lab-dialog').close();notice('Der Spielstand hat sich geändert. Bitte den Block erneut erfassen.');return;
    }
    const reviewed=ballTo?reviseDraft(draft,{blockBallTo:ballTo}):draft;
    if(commit(confirmTrace(reviewed,result))){
      $('#lab-dialog').close();
      if(override==='block'){override='auto';$('#rally-type').value='auto';}
      notice(result==='continue'?'Ball läuft weiter · '+teamLabel(ballTo):result==='point'?'Blockpunkt für '+draft.player:'Blockfehler gezählt');
    }
  }
  const title=heading('BLOCK · '+teamLabel(draft.team),esc(draft.player)+' · Blockpunkt?');
  dialog(title+renderTraceReview(draft)+'<div class="rally-confirm"><button id="block-point" class="success">Ja · Blockpunkt</button><button id="block-continues">Nein · Ball läuft weiter</button></div><button id="block-fault" class="wide">Blockfehler · Punkt für die Gegenseite</button>');
  $('#block-point').onclick=()=>save('point');
  $('#block-fault').onclick=()=>save('error');
  $('#block-continues').onclick=()=>{
    dialog(heading('BALL LÄUFT WEITER','Wer spielt den nächsten Ball?')+'<div class="rally-confirm"><button id="block-us">SG Kaarst</button><button id="block-them">Gegner</button></div>');
    $('#block-us').onclick=()=>save('continue','us');
    $('#block-them').onclick=()=>save('continue','them');
  };
}
// Pointer capture sends pointerup to the court. Hit-test the visible badge
// and name at release instead of using the captured event target.
function releasePlayer(court,x,y){
  let nearest=null,best=Infinity;
  for(const button of court.querySelectorAll('[data-node]')){
    for(const label of button.querySelectorAll(':scope > span, :scope > b')){
      const rect=label.getBoundingClientRect();
      const dx=Math.max(rect.left-x,0,x-rect.right),dy=Math.max(rect.top-y,0,y-rect.bottom);
      const distance=Math.hypot(dx,dy);
      if(distance<=5 && distance<best){nearest=button.dataset.node;best=distance;}
    }
  }
  return nearest;
}
function bindCourt(){
  const court=$('#rally-court');if(!court)return;
  const xy=e=>{const r=court.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,performance.now()];};
  const tap=(team,player)=>{try{confirmPanel(recognizeTrace(state(),{team,player,tap:true,override:override==='auto'?null:override,nodes:playerNodes(state(),{rotationOnly})}));}catch(e){notice(e.message);}};
  court.onpointerdown=e=>{const b=e.target.closest('[data-node]');if(!b||b.disabled||!e.isPrimary||e.button!==0||gesture)return;const p=xy(e);gesture={id:e.pointerId,team:b.dataset.team,player:b.dataset.player,samples:[p],start:p,nodes:playerNodes(state(),{rotationOnly}),count:current().events.length};court.setPointerCapture(e.pointerId);document.body.classList.add('rally-drawing');e.preventDefault();};
  court.onpointermove=e=>{if(!gesture||e.pointerId!==gesture.id)return;const p=xy(e),last=gesture.samples.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>.004&&gesture.samples.length<2000)gesture.samples.push(p);$('#rally-trail').setAttribute('d',gesture.samples.map((v,i)=>(i?'L':'M')+' '+v[0]*600+' '+v[1]*640).join(' '));};
  court.onpointerup=e=>{if(!gesture||e.pointerId!==gesture.id)return;const g=gesture;g.samples.push(xy(e));clearGesture();if(court.hasPointerCapture(e.pointerId))court.releasePointerCapture(e.pointerId);if(g.count!==current().events.length){notice('Ballwechsel hat sich geändert. Bitte neu zeichnen.');return;}const moved=g.samples.some(p=>Math.hypot((p[0]-g.start[0])*600,(p[1]-g.start[1])*640)>30);if(!moved){tap(g.team,g.player);return;}try{confirmPanel(recognizeTrace(state(),{...g,endNode:releasePlayer(court,e.clientX,e.clientY),override:override==='auto'?null:override}));}catch(error){notice(error.message);}};
  court.onpointercancel=clearGesture;court.onlostpointercapture=clearGesture;
  court.querySelectorAll('[data-node]').forEach(b=>b.onclick=e=>{if(e.detail===0)tap(b.dataset.team,b.dataset.player);});
}
function menu(){
  const s=state();dialog(heading('TESTSPIEL',`Satz ${session.sets.length} · ${s.score.us}:${s.score.them}`)+`<p class="fine">Nur lokale Testdaten. Aufschlag, Rotation, Libero und Kontaktfolge werden für beide Teams fortgeführt.</p><div class="point-buttons"><button data-score="us">+ Punkt SG Kaarst</button><button data-score="them">+ Punkt Gegner</button></div><p class="fine">Diese Punkte haben keine Spielerzuordnung. Ein bestätigter Angriff oder Fehler zählt den Punkt bereits mit.</p><div class="menu-actions"><button id="show-test-stats">Spielerstatistik ansehen</button><button id="show-test-log">Ballwechsel-Protokoll ansehen</button><button id="show-sub">Spieler wechseln · beide Teams</button><button id="show-correction">Rotation / Aufschlag korrigieren</button><button id="show-timeout">Auszeit erfassen</button><button id="next-rally-set" ${s.finished?'':'disabled'}>Nächsten Satz aufstellen</button><button id="add-test-player">Spielername ergänzen</button><button id="rally-export">Testdaten exportieren</button><button id="rally-reset">Test sichern & neu beginnen</button></div><p class="fine">Läufer: ${esc(s.teams.us.order.find(n=>s.teams.us.roles[n]==='Z'))} · Libero: ${esc(s.system.libero||'ohne')}. Ein automatisch eingesetzter Libero bleibt dem Rotationsplatz seines Mittelspielers zugeordnet und wird vor Vorderfeld oder eigenem Aufschlag zurückgetauscht.</p>`);
  document.querySelectorAll('[data-score]').forEach(b=>{b.disabled=s.finished;b.onclick=()=>{if(commit({kind:'point',winner:b.dataset.score})){$('#lab-dialog').close();notice('Punkt gespeichert · Rotation und Aufschlag aktualisiert.');}};});
  $('#show-test-stats').onclick=()=>dialog(heading('AUSWERTUNG','Was wurde erfasst?')+renderStats(session));
  $('#show-test-log').onclick=()=>dialog(heading('AKTIONEN','Ballwechsel-Protokoll')+'<ol class="rally-log">'+[...current().events].reverse().map(e=>'<li>'+esc(eventText(e))+'</li>').join('')+'</ol>');
  $('#show-sub').onclick=subPanel;$('#show-correction').onclick=correctionPanel;$('#show-timeout').onclick=timeoutPanel;$('#next-rally-set').onclick=setup;$('#rally-export').onclick=exportData;$('#rally-reset').onclick=resetPanel;$('#add-test-player').onclick=addPlayer;
}
function subPanel(){
  const s=state();if(s.phase.type!=='serve'||s.finished){notice('Spielerwechsel erst zwischen Ballwechseln möglich.');return;}
  dialog(heading('REGULÄRER WECHSEL','Wer kommt rein?')+`<label class="form-label" for="sub-team">Team</label><select class="form-input" id="sub-team"><option value="us">SG Kaarst</option><option value="them">Gegner</option></select><div id="sub-inputs"></div><button class="primary wide" id="sub-confirm">Wechsel bestätigen</button><p class="fine">Maximal sechs reguläre Wechsel je Team und Satz. Rückwechsel nur im gleichen Spielerpaar. Liberoaustausche sind davon getrennt und erfolgen bei aktivem Libero automatisch.</p>`);
  function paint(){const t=$('#sub-team').value,a=s.teams[t],bench=(t==='us'?session.roster:session.opponents).filter(n=>!a.order.includes(n)&&n!==s.system.libero);$('#sub-inputs').innerHTML=`<label class="form-label" for="sub-out">Start-/Feldspieler</label><select class="form-input" id="sub-out">${a.order.map((n,i)=>`<option>${esc(n)}</option>`).join('')}</select><label class="form-label" for="sub-in">Einwechselspieler</label><select class="form-input" id="sub-in">${bench.map(n=>`<option>${esc(n)}</option>`).join('')}</select>`;$('#sub-confirm').disabled=!bench.length;}
  $('#sub-team').onchange=paint;$('#sub-confirm').onclick=()=>{if(commit({kind:'sub',team:$('#sub-team').value,out:$('#sub-out').value,in:$('#sub-in').value})){$('#lab-dialog').close();notice('Wechsel gespeichert.');}};paint();
}
function correctionPanel(){
  const s=state();if(s.phase.type!=='serve'||s.finished){notice('Korrekturen erst zwischen Ballwechseln möglich. Zum Korrigieren der letzten Kontaktkette Rückgängig verwenden.');return;}
  dialog(heading('KORREKTUR','Rotation / Aufschlag')+'<p class="fine">Diese Korrekturen verändern den Spielstand nicht. Normale Aufschlagwechsel werden bereits automatisch rotiert.</p><div class="menu-actions"><button data-rotate-team="us">SG Kaarst einmal weiterrotieren ↻</button><button data-rotate-team="them">Gegner einmal weiterrotieren ↻</button><button data-service-team="us">SG Kaarst hat Aufschlag</button><button data-service-team="them">Gegner hat Aufschlag</button></div>');
  document.querySelectorAll('[data-rotate-team]').forEach(b=>b.onclick=()=>{if(commit({kind:'rotate',team:b.dataset.rotateTeam})){$('#lab-dialog').close();notice('Rotation korrigiert.');}});
  document.querySelectorAll('[data-service-team]').forEach(b=>b.onclick=()=>{if(commit({kind:'service',team:b.dataset.serviceTeam,serving:b.dataset.serviceTeam})){$('#lab-dialog').close();notice('Aufschlagrecht korrigiert.');}});
}
function timeoutPanel(){const s=state();if(s.phase.type!=='serve'||s.finished){notice('Auszeit erst zwischen Ballwechseln möglich.');return;}dialog(heading('AUSZEIT','Welches Team?')+`<div class="rally-confirm">${['us','them'].map(t=>`<button data-timeout-team="${t}" ${s.teams[t].timeouts>=2?'disabled':''}>${teamLabel(t)} · ${s.teams[t].timeouts}/2</button>`).join('')}</div>`);document.querySelectorAll('[data-timeout-team]').forEach(b=>b.onclick=()=>{if(commit({kind:'timeout',team:b.dataset.timeoutTeam})){$('#lab-dialog').close();notice('Auszeit gespeichert.');}});}
function addPlayer(){dialog(heading('TESTKADER','Spieler ergänzen')+'<form id="add-player-form"><label class="form-label" for="new-test-name">Name</label><input class="form-input" id="new-test-name" required maxlength="50"><button class="primary wide">Zum Testkader hinzufügen</button></form>');$('#add-player-form').onsubmit=e=>{e.preventDefault();const name=$('#new-test-name').value.trim();if(!name||session.roster.includes(name)||['__proto__','constructor','prototype'].includes(name)){notice('Bitte einen neuen Spielernamen eingeben.');return;}const next=structuredClone(session);next.roster.push(name);if(persist(next)){$('#lab-dialog').close();notice('Spieler ergänzt.');}};}
function exportData(){const text=broken?baseline||legacyRaw||'':JSON.stringify(session,null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='rallyboard-rally-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function resetPanel(){dialog(heading('NEUER TEST','Bisherigen Test sichern?')+'<p class="fine">Der aktuelle Test wird vor dem Neustart gesichert. Alte V1-Testdaten und echte RallyBoard-Spiele bleiben unverändert.</p><button id="reset-rally-confirm" class="primary wide">Sichern & neu beginnen</button>');$('#reset-rally-confirm').onclick=()=>{try{if(baseline)localStorage.setItem(BACKUP_KEY,baseline);if(persist(newSession(),true)){$('#lab-dialog').close();notice('Neuer Test gestartet.');}}catch(e){notice(e.message);}};}
function restorePanel(){dialog(heading('SICHERUNG','Letzten Test zurückholen?')+'<p class="fine">Der aktuelle Stand wird ebenfalls gesichert. Es werden ausschließlich Testdaten ausgetauscht.</p><button class="primary wide" id="restore-rally-confirm">Letzte Sicherung wiederherstellen</button>');$('#restore-rally-confirm').onclick=()=>{try{const next=validateSession(JSON.parse(localStorage.getItem(BACKUP_KEY))),old=baseline;if(persist(next,true)){if(old)localStorage.setItem(BACKUP_KEY,old);$('#lab-dialog').close();notice('Sicherung wiederhergestellt.');}}catch(e){notice('Nicht wiederhergestellt: '+e.message);}};}
function render(){
  clearGesture();const active=!!current();document.body.classList.toggle('rally-live',active);$('#lab-app').innerHTML=active?renderActive(session,{rotationOnly,override}):renderWelcome(session,error);
  $('#rally-start')?.addEventListener('click',setup);$('#rally-add-player')?.addEventListener('click',addPlayer);$('#rally-export')?.addEventListener('click',exportData);$('#rally-reset')?.addEventListener('click',resetPanel);
  if(!active){try{if(localStorage.getItem(BACKUP_KEY)){$('#lab-app').insertAdjacentHTML('beforeend','<button class="wide" id="restore-rally-backup">Letzten Test wiederherstellen</button>');$('#restore-rally-backup').onclick=restorePanel;}}catch{}return;}
  $('#rally-menu').onclick=menu;$('#toggle-formation').onclick=()=>{rotationOnly=!rotationOnly;render();};$('#rally-type').onchange=e=>{override=e.target.value;};$('#rally-undo').onclick=()=>{if(persist(undoEvent(session)))notice('Ganze Kontaktkette mit Punkt und beiden Rotationen rückgängig.');};bindCourt();
}
window.addEventListener('blur',clearGesture);window.addEventListener('resize',clearGesture);
window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY)return;try{const next=e.newValue?validateSession(JSON.parse(e.newValue)):newSession();baseline=e.newValue;session=next;$('#lab-dialog').close();error='';render();notice('Teststand aus anderem Tab übernommen.');}catch{error='Ungültiger Stand aus anderem Tab. Bitte neu laden.';notice(error);}});
render();
