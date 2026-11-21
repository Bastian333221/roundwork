/* Durable reconciliation coordinator. Authentication and DOM stay in sync-ui.js. */
window.RoundworkSyncEngine=(()=>{
  'use strict';
  const META='roundwork.sync.v1',RECOVERY='roundwork.sync-recovery.v1';
  function create({storage,store,api,project,online=()=>navigator.onLine!==false,visible=()=>true,busy=()=>false,changed=()=>{},now=()=>new Date().toISOString()}){
    const C=window.RoundworkSyncCore;let user=null,running=false,stopped=false,timer=null,failures=0,generation=0;
    let status={phase:'signed-out',lastSyncedAt:null,error:null,conflicts:0};
    function read(){const raw=storage.getItem(META);if(!raw)return {enabled:false,base:{}};const x=JSON.parse(raw);if(!x||typeof x!=='object'||Array.isArray(x))throw Error('The saved sync connection could not be read. Export a backup before changing browser data.');return x;}
    function write(value){const raw=JSON.stringify(value);storage.setItem(META,raw);if(storage.getItem(META)!==raw)throw Error('The sync connection could not be saved.');}
    function emit(phase,error=null,extra={}){status={...status,phase,error,...extra};changed({...status,user:user?{id:user.id,email:user.email}:null});}
    function usable(meta){return !!user&&meta.enabled&&meta.owner===user.id&&meta.project===project;}
    function queue(delay=450){clearTimeout(timer);if(stopped)return;timer=setTimeout(()=>{void sync();},delay);}
    function authChanged(nextUser){generation++;user=nextUser||null;clearTimeout(timer);try{const m=read();if(!user){emit('signed-out');return;}if(m.owner&&(m.owner!==user.id||m.project!==project)){emit('account-mismatch');return;}if(!m.enabled){emit('consent');return;}status.lastSyncedAt=m.lastSyncedAt||null;emit('queued');queue(0);}catch(error){emit('storage-error',error.message);}}
    function connect(){
      if(!user)throw Error('Sign in before connecting this device.');
      const m=read();if(m.owner&&(m.owner!==user.id||m.project!==project))throw Error('This browser is linked to another account or project. Its records were not uploaded.');
      const raw=JSON.stringify({app:'roundwork',version:1,exportedAt:now(),state:store.getState()});
      // Keep a verified recovery copy before the first cloud merge on this browser.
      if(!storage.getItem(RECOVERY)){storage.setItem(RECOVERY,raw);if(storage.getItem(RECOVERY)!==raw)throw Error('A recovery copy could not be saved. Export a backup before connecting.');}
      write({...m,owner:user.id,project,enabled:true,base:m.base||{}});emit('queued');queue(0);
    }
    function disconnect(){generation++;clearTimeout(timer);const m=read();write({...m,enabled:false});emit('disconnected');}
    function localChanged(){try{if(usable(read())){emit(online()?'queued':'offline');queue();}}catch(error){emit('storage-error',error.message);}}
    function importAllowed(){try{return !read().enabled;}catch{return false;}}
    function imported(){const m=read();if(m.enabled)throw Error('Disconnect sync before importing a backup.');write({...m,base:{},lastSyncedAt:null});}
    function accountCurrent(uid,runGeneration){return user?.id===uid&&generation===runGeneration&&!stopped;}
    async function sync(){
      clearTimeout(timer);if(running||stopped)return false;
      let m;try{m=read();}catch(error){emit('storage-error',error.message);return false;}
      if(!usable(m))return false;
      if(!online()){emit('offline');return false;}
      if(!visible()){emit('paused');return false;}
      if(busy()){emit('editing');queue(1500);return false;}
      running=true;const uid=user.id,runGeneration=generation;emit('syncing');
      try{
        for(let attempt=0;attempt<4;attempt++){
          if(!accountCurrent(uid,runGeneration))return false;
          const remote=await api.read(uid);if(!accountCurrent(uid,runGeneration))return false;
          const revision=remote?.revision??0,cloud=remote?C.document(remote.document).records:{};
          if(!Number.isSafeInteger(revision)||revision<0)throw Error('The cloud revision could not be read.');
          m=read();if(!usable(m))return false;
          if(remote===null&&Object.keys(m.base||{}).length)throw Error('The cloud history is missing. Sync stopped; your local workouts are still here.');
          const local=C.records(store.getState().sessionHistory||{}),merge=C.reconcile(m.base||{},local,cloud,now());
          let committed=merge.records;
          if(!C.equal(committed,cloud)){
            const result=await api.save(revision,{schema:1,records:committed});
            if(!accountCurrent(uid,runGeneration))return false;
            if(!result?.saved)continue;
            if(!Number.isSafeInteger(result.revision)||result.revision!==revision+1)throw Error('The cloud save could not be verified.');
          }
          // Changes made while a request was in flight remain pending for the next pass.
          const current=C.records(store.getState().sessionHistory||{}),during=C.reconcile(local,current,committed,now());
          const remap={...merge.remap,...during.remap};
          if(busy()){emit('editing');queue(1500);return false;}
          const applied=store.applySync(during.records,remap);
          if(!applied)throw Error('The updated history could not be saved on this device. Keep this page open and export a backup.');
          // Acknowledge only after the cloud write and local application both succeed.
          const latest=read();if(!usable(latest)||!accountCurrent(uid,runGeneration))return false;
          const stamp=now();write({...latest,base:committed,lastSyncedAt:stamp});failures=0;
          const conflictCount=Object.values(during.records).filter(row=>row.syncConflictOf&&!row.deletedAt).length;
          const pending=!C.equal(C.records(store.getState().sessionHistory||{}),committed);
          emit(pending?'queued':conflictCount?'conflict':'synced',null,{lastSyncedAt:stamp,conflicts:conflictCount});queue(pending?500:20000);return true;
        }
        throw Error('Another device is saving changes. Your workouts remain on this device; sync will retry.');
      }catch(error){
        if(accountCurrent(uid,runGeneration)){failures++;emit(online()?'error':'offline',error.message||'Sync could not finish.');queue(Math.min(60000,5000*2**Math.min(failures-1,4)));}
        return false;
      }finally{running=false;if(generation!==runGeneration&&!stopped&&user)queue(0);}
    }
    function stop(){stopped=true;generation++;clearTimeout(timer);}
    return {authChanged,connect,disconnect,localChanged,sync,queue,stop,importAllowed,imported,getStatus:()=>({...status,user:user?{id:user.id,email:user.email}:null}),getRecovery:()=>{try{return storage.getItem(RECOVERY);}catch{return null;}},isEnabled:()=>{try{return read().enabled===true;}catch{return false;}},isConnected:()=>{try{return usable(read());}catch{return false;}}};
  }
  return {create,META,RECOVERY};
})();
