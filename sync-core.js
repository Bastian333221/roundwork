/* Pure log reconciliation. No account tokens or network access belong here. */
window.RoundworkSyncCore=(()=>{
  'use strict';
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  function canonical(value){
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    if(object(value))return '{'+Object.keys(value).filter(key=>key!=='updatedAt').sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
    return JSON.stringify(value);
  }
  const equal=(a,b)=>canonical(a)===canonical(b);
  function records(value){
    if(!object(value))throw Error('Invalid workout history.');
    const out={};
    for(const [id,input] of Object.entries(value)){
      const row=window.RoundworkHistory.cleanRecord(input,id);
      if(!row)throw Error('A workout record could not be read. Sync stopped without replacing your history.');
      out[id]=row;
    }
    return out;
  }
  // Stable conflict identities make a retry idempotent. Collisions are checked against content.
  function fingerprint(text){let a=2166136261,b=5381;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}return (a>>>0).toString(36)+(b>>>0).toString(36);}
  function reconcile(baseInput,localInput,remoteInput,now=new Date().toISOString()){
    const base=records(baseInput),local=records(localInput),remote=records(remoteInput),merged={},remap={},conflicts=[];
    const ids=new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)]);
    const copies=[];
    for(const id of ids){
      const before=base[id];let here=local[id],there=remote[id];
      // An emptied working attempt is a deletion, not permission to erase a cloud key.
      if(before&&!here)here=there?.deletedAt?clone(there):{...clone(before),deletedAt:now,closedAt:before.closedAt||now,updatedAt:now};
      if(before&&!there)throw Error('Cloud history is incomplete. Sync stopped without replacing your history.');
      let chosen;
      if(equal(here,there))chosen=there||here;
      else if(equal(here,before))chosen=there;
      else if(equal(there,before))chosen=here;
      else if(!here)chosen=there;
      else if(!there)chosen=here;
      else {
        // If one side deleted the record, retain that deletion on the original identity
        // and keep the concurrently edited version as a visible, separate entry.
        const localDeleted=!!here.deletedAt&&!there.deletedAt;
        chosen=localDeleted?here:there;
        copies.push({id,localCopy:!localDeleted,row:{...clone(localDeleted?there:here),syncConflictOf:id,syncConflictAt:now}});
      }
      if(chosen)merged[id]=clone(chosen);
    }
    for(const {id,row,localCopy} of copies){
      const content={...row,syncConflictOf:null,syncConflictAt:null};
      const stem='session-sync-'+fingerprint(id+'|'+canonical(content));let copyId=stem,n=0;
      const matching=candidate=>equal({...candidate,id:null,syncConflictAt:null},{...row,id:null,syncConflictAt:null});
      while(merged[copyId]&&!matching(merged[copyId]))copyId=stem+'-'+(++n);
      if(!merged[copyId])merged[copyId]={...row,id:copyId};
      if(localCopy)remap[id]=copyId;conflicts.push(copyId);
    }
    return {records:merged,remap,conflicts};
  }
  function applyToState(input,nextRecords,remap={}){
    const next=clone(input);next.sessionHistory=records(nextRecords);
    next.activeSessions={...next.activeSessions};next.logs={...next.logs};next.sessions={...next.sessions};
    next.equipmentChecks={...next.equipmentChecks};next.sessionAdditions={...next.sessionAdditions};next.readinessChecks={...next.readinessChecks};
    // Downloaded records appear in Log. Only an existing local active attempt is resumed.
    for(const [key,oldId] of Object.entries(next.activeSessions)){
      const id=remap[oldId]||oldId,row=next.sessionHistory[id];
      for(const map of ['logs','equipmentChecks'])for(const k of Object.keys(next[map]))if(k.startsWith(key+':'))delete next[map][k];
      delete next.sessions[key];delete next.readinessChecks[key];
      if(!row||row.deletedAt||row.closedAt||row.week+':'+row.routine!==key){delete next.activeSessions[key];continue;}
      next.activeSessions[key]=id;next.sessionAdditions[key]=clone(row.customizations);
      for(const entry of row.exercises)next.logs[key+':'+entry.slot]={exercise:entry.exercise,at:entry.at,settings:clone(entry.settings),dose:clone(entry.dose),actual:clone(entry.actual)};
      Object.assign(next.equipmentChecks,clone(row.equipmentChecks));
      if(row.readinessCheck)next.readinessChecks[key]=clone(row.readinessCheck);
      if(row.finishedAt)next.sessions[key]={at:row.finishedAt,updatedAt:row.updatedAt,settings:clone(row.settings),readiness:row.readiness,coachLoad:row.coachLoad,prescription:clone(row.prescription),readinessCheck:clone(row.readinessCheck),sessionEffort:row.sessionEffort,sessionNotes:row.sessionNotes};
    }
    return next;
  }
  function document(value){
    if(!object(value)||value.schema!==1||!object(value.records))throw Error('This cloud history uses an unsupported format. Update the app before syncing.');
    return {schema:1,records:records(value.records)};
  }
  return {clone,equal,canonical,records,reconcile,applyToState,document};
})();
