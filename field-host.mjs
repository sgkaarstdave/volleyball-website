import {assertTrackableMatch} from './model.mjs?v=18';
import {fieldSession, saveFieldMatch} from './field-match.mjs?v=18';

export function openField({id,getDb,allowed,today,change,isBusy,showReport}){
  const getMatch=()=>{
    if(!allowed())throw Error('Bitte erneut als Admin anmelden.');
    return assertTrackableMatch(getDb(),id,today());
  };
  const match=getMatch(),initial=fieldSession(match,getDb().players);
  let revision=match.sets.at(-1)?.fieldRevision??null;
  const frame=document.createElement('iframe'),overlay=document.querySelector('#field-overlay');
  frame.title='Feldtracking gegen '+match.opponent;
  let writing=false;
  function leave(){
    if(writing)return;
    overlay.close();overlay.replaceChildren();delete window.rallyField;
  }
  overlay.oncancel=e=>{e.preventDefault();leave();};
  async function update(fn){
    if(writing)throw Error('Der letzte Kontakt wird gerade gespeichert.');
    writing=true;
    try{
      while(isBusy())await new Promise(r=>setTimeout(r,20));
      let failure;
      const ok=await change(()=>{
        try{const m=getMatch();if((m.sets.at(-1)?.fieldRevision??null)!==revision)throw Error('Spielstand geändert. Bitte erneut öffnen.');fn(m);}
        catch(e){failure=e;throw e;}
      });
      if(!ok)throw failure||Error('Speichern fehlgeschlagen. Bitte den Kontakt erneut bestätigen.');
    }finally{writing=false;}
  }
  window.rallyField={
    initial,opponent:match.opponent,leave,
    async save(next){
      let savedRevision;
      await update(()=>{savedRevision=saveFieldMatch(getDb(),id,next,revision,today());});
      revision=savedRevision;
    },
    async finish(){
      await update(m=>{if(!m.sets.length)throw Error('Zuerst einen Satz erfassen.');m.done=true;});
      leave();showReport(id);
    }
  };
  frame.src='./field.html';overlay.replaceChildren(frame);overlay.showModal();
}
