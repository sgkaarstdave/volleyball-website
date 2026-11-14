// Public project configuration; no secret or service-role key belongs here.
export const PROJECT='https://odghcjkznmxaeqlrvtbs.supabase.co';
const KEY='sb_publishable_-Rz2O0TkZjres9XKIIwFWg_FLBDff_8';
let session;try{session=JSON.parse(sessionStorage.getItem('rallyboard-auth'))}catch{}
function keep(s){session=s;sessionStorage.setItem('rallyboard-auth',JSON.stringify(s))}
export const signedIn=()=>!!session?.access_token;
export const account=()=>session?.user?.email||'';
async function request(path,{method='GET',body,auth=true}={}){
 if(auth){if(!session)throw Error('Bitte als Admin anmelden');if(session.expires_at<Date.now()/1000+60){const refreshed=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},auth:false});keep({...refreshed,expires_at:Date.now()/1000+refreshed.expires_in})}}
 const r=await fetch(PROJECT+path,{method,headers:{apikey:KEY,...(auth?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
 const data=await r.json().catch(()=>null);if(!r.ok){if(data?.code==='PGRST205'||data?.code==='PGRST202')throw Error('Datenbank noch nicht eingerichtet. SQL-Migrationen ausführen.');if(data?.message?.includes('RALLYBOARD_CONFLICT'))throw Error('Cloud-Konflikt: lokale Daten bleiben erhalten. JSON-Backup exportieren; keine Daten wurden überschrieben.');throw Error(data?.msg||data?.error_description||data?.message||'Cloud-Anfrage fehlgeschlagen ('+r.status+')')}return data;
}
export async function login(email,password){const s=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},auth:false});keep({...s,expires_at:Date.now()/1000+s.expires_in});try{const admins=await request('/rest/v1/rallyboard_admins?select=user_id&user_id=eq.'+encodeURIComponent(s.user.id));if(admins.length!==1)throw Error('Dieser Login ist nicht als RallyBoard-Admin freigeschaltet.')}catch(e){await logout();throw e}}
export async function logout(){try{if(session)await request('/auth/v1/logout',{method:'POST'})}finally{session=null;sessionStorage.removeItem('rallyboard-auth')}}
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function syncPlan(local,remote,bases={}){
 const map=new Map(local.map(m=>[m.id,m])),pull=[],push=[],next={...bases};
 for(const r of remote){const l=map.get(r.id),base=bases[r.id];if(!l||same(l,r.payload)){pull.push(r);next[r.id]={revision:r.revision,payload:r.payload};continue}if(base&&same(l,base.payload)){pull.push(r);next[r.id]={revision:r.revision,payload:r.payload};continue}if(!base||r.revision!==base.revision)throw Error('Cloud-Konflikt bei '+(l.opponent||'Teameinstellungen')+'. Lokale Daten bleiben erhalten.');}
 const pulled=new Set(pull.map(r=>r.id));for(const m of local){if(pulled.has(m.id))continue;const b=bases[m.id];if(!b||!same(m,b.payload))push.push({payload:m,revision:b?.revision||0});}
 return {pull,push,bases:next};
}
export async function exchange(data){const settings={id:'__rallyboard_settings__',players:data.players,weights:data.weights,order:data.order};const local=[...data.matches,settings];const remote=await request('/rest/v1/rallyboard_matches?select=id,payload,revision&limit=10000');const plan=syncPlan(local,remote,data.cloud?.bases);for(const item of plan.push){const m=item.payload;const events=(m.sets||[]).flatMap((s,i)=>(s.events||[]).map(e=>({id:e.id,set_index:i,payload:e,voided:!!e.void})));const revision=await request('/rest/v1/rpc/rallyboard_sync_match',{method:'POST',body:{p_id:m.id,p_payload:m,p_expected_revision:item.revision,p_events:events}});plan.bases[m.id]={revision,payload:structuredClone(m)}}return {...plan,snapshot:local};}
export function applyExchange(current,result){const next=structuredClone(current);const before=new Map(result.snapshot.map(m=>[m.id,m]));for(const r of result.pull){if(r.id==='__rallyboard_settings__'){const settings={id:r.id,players:current.players,weights:current.weights,order:current.order};if(same(settings,before.get(r.id))){next.players=r.payload.players;next.weights=r.payload.weights;next.order=r.payload.order}}else{const i=next.matches.findIndex(m=>m.id===r.id);if(i===-1)next.matches.push(r.payload);else if(same(next.matches[i],before.get(r.id)))next.matches[i]=r.payload;}}
 next.cloud={bases:structuredClone(result.bases),lastSync:new Date().toISOString()};return next;}
export function pending(data){const local=[...data.matches,{id:'__rallyboard_settings__',players:data.players,weights:data.weights,order:data.order}];return local.filter(m=>!same(m,data.cloud?.bases?.[m.id]?.payload)).length}
