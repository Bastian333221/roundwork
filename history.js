/* Session instances retain completed and partial attempts independently of routine templates. */
window.RoundworkHistory=(()=>{
  'use strict';
  const keyPattern=/^[1-8]:(mon|tue|wed|thu|fri|sat|sun)$/;
  const idPattern=/^(?:legacy|session)-[a-zA-Z0-9_-]{1,90}$/;
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const date=x=>typeof x==='string'&&x.trim()&&Number.isFinite(new Date(x).getTime())?x:null;
  const known=id=>window.BOXING_DATA.exercises.some(ex=>ex.id===id);
  const text=(x,n=500)=>typeof x==='string'?x.slice(0,n):'';
  function recordSettings(value,routine){const p=window.RoundworkPlanner;return object(value)&&p.levels.includes(value.level)&&p.times.includes(value.minutes)?p.cleanChoice(value,routine):null;}
  function dose(value){
    if(!object(value))return {};
    const out={};
    for(const key of ['sets','reps','rest','seconds','notes','skip','gated','standardSets']){
      const v=value[key];
      if(v===null||typeof v==='boolean'||typeof v==='string'||typeof v==='number'&&Number.isFinite(v))out[key]=typeof v==='string'?v.slice(0,5000):v;
    }
    return out;
  }
  function cleanRecord(value,id){
    if(!object(value)||!idPattern.test(id)||!keyPattern.test(value.week+':'+value.routine))return null;
    const week=Number(value.week),routine=value.routine,customizations=window.RoundworkPerformance?.definitions(value.customizations)||[];
    const customFor=x=>customizations.find(row=>row.slot===x.slot&&row.exercise===x.exercise);
    const rawExercises=(Array.isArray(value.exercises)?value.exercises:[]).filter(x=>object(x)&&((known(x.slot)||/^extra-\d+$/.test(x.slot))&&known(x.exercise)||customFor(x))).map(x=>({slot:x.slot,exercise:x.exercise,customName:customFor(x)?.customName||'',section:customFor(x)?.section||null,at:date(x.at),settings:object(x.settings)?window.RoundworkPlanner.cleanChoice(x.settings,routine):null,dose:dose(x.dose),actual:window.RoundworkPerformance?.actual(x.actual)||null}));
    const exercises=[...new Map(rawExercises.map(item=>[item.slot,item])).values()];
    const prescription=(Array.isArray(value.prescription)?value.prescription:[]).filter(x=>object(x)&&known(x.exercise)&&known(x.selected)).map(x=>({exercise:x.exercise,selected:x.selected,dose:dose(x.dose)}));
    return {id,week,routine,title:text(value.title,200),source:value.source==='manual'?'manual':'app',performedDate:window.RoundworkPerformance?.dateOnly(value.performedDate)||null,enteredAt:date(value.enteredAt),scheduledDay:window.RoundworkSchedule.ids.includes(value.scheduledDay)?value.scheduledDay:null,firstRecordedAt:date(value.firstRecordedAt),updatedAt:date(value.updatedAt),finishedAt:date(value.finishedAt),closedAt:date(value.closedAt),deletedAt:date(value.deletedAt),sessionNotes:text(value.sessionNotes,2000),settings:recordSettings(value.settings,routine),readiness:['normal','tired'].includes(value.readiness)?value.readiness:null,coachLoad:['unknown','technical','hard'].includes(value.coachLoad)?value.coachLoad:null,prescription,exercises,customizations,readinessCheck:window.RoundworkReadiness?.clean(value.readinessCheck)||null,sessionEffort:window.RoundworkReadiness?.effort(value.sessionEffort)||null,equipmentChecks:window.RoundworkChoices.cleanEquipmentChecks(value.equipmentChecks)};
  }
  function hasWork(state,key){return !!state.sessions?.[key]||Object.keys(state.logs||{}).some(k=>k.startsWith(key+':'));}
  function capture(state,key,id,meta={},previous){
    const [week,routine]=key.split(':'),session=state.sessions?.[key];
    const exercises=Object.entries(state.logs||{}).filter(([k,v])=>k.startsWith(key+':')&&object(v)).map(([k,v])=>({slot:k.slice(key.length+1),exercise:v.exercise||v.selected||k.slice(key.length+1),at:v.at,settings:v.settings,dose:v.dose,actual:v.actual}));
    const settings=session&&Object.hasOwn(session,'settings')?session.settings:previous?previous.settings:exercises.find(item=>recordSettings(item.settings,routine))?.settings||meta.settings;
    const dates=[...exercises.map(x=>date(x.at)),date(session?.at)].filter(Boolean).sort((a,b)=>new Date(a)-new Date(b));
    const day=window.BOXING_DATA.days.find(d=>d.id===routine);
    const title=window.RoundworkSchedule.routine(day,{week:Number(week),recoveryDays:state.recoveryDays}).title;
    return cleanRecord({week:Number(week),routine,title:previous?.title||meta.title||title,performedDate:previous?.performedDate,sessionNotes:session?.sessionNotes??previous?.sessionNotes,scheduledDay:previous?previous.scheduledDay:meta.scheduledDay,firstRecordedAt:previous?.firstRecordedAt||dates[0]||null,updatedAt:session?.updatedAt||dates.at(-1)||null,finishedAt:session?.at,settings,readiness:session?.readiness||previous?.readiness||(!previous?meta.readiness:null),coachLoad:session?.coachLoad||previous?.coachLoad||(!previous?meta.coachLoad:null),prescription:session?.prescription||previous?.prescription||meta.prescription,exercises,customizations:state.sessionAdditions?.[key]||[],readinessCheck:state.readinessChecks?.[key]||session?.readinessCheck||previous?.readinessCheck,sessionEffort:session&&Object.hasOwn(session,'sessionEffort')?session.sessionEffort:previous?.sessionEffort,equipmentChecks:Object.fromEntries(Object.entries(state.equipmentChecks||{}).filter(([k])=>k.startsWith(key+':')))},id);
  }
  function restore(state){
    const sessionHistory={},activeSessions={},sessionAdditions=window.RoundworkPerformance?.cleanAdditions(state.sessionAdditions)||{};
    if(object(state.sessionHistory))for(const [id,value] of Object.entries(state.sessionHistory)){const clean=cleanRecord(value,id);if(clean)sessionHistory[id]=clean;}
    if(object(state.activeSessions))for(const [key,id] of Object.entries(state.activeSessions)){
      if(!keyPattern.test(key)||typeof id!=='string'||!idPattern.test(id))continue;
      const record=sessionHistory[id];
      if(!record||(!record.deletedAt&&!record.closedAt&&record.week+':'+record.routine===key))activeSessions[key]=id;
    }
    for(const [key,id] of Object.entries(activeSessions))if(!Object.hasOwn(sessionAdditions,key)&&sessionHistory[id]?.customizations?.length)sessionAdditions[key]=sessionHistory[id].customizations;
    const cleanState={...state,sessionHistory,activeSessions,sessionAdditions};
    const keys=new Set([...Object.keys(state.sessions||{}),...Object.keys(state.logs||{}).map(k=>k.split(':').slice(0,2).join(':'))]);
    for(const key of keys){
      if(!keyPattern.test(key)||activeSessions[key]||!hasWork(state,key))continue;
      let id='legacy-'+key.replace(':','-');while(sessionHistory[id])id+='-copy';
      sessionHistory[id]=capture(cleanState,key,id);activeSessions[key]=id;
    }
    return {sessionHistory,activeSessions,sessionAdditions};
  }
  function newId(state){
    let id;do{id='session-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}while(state.sessionHistory?.[id]||Object.values(state.activeSessions||{}).includes(id));return id;
  }
  function checkpoint(state,key,meta={}){
    if(!keyPattern.test(key))return;
    const history={...state.sessionHistory},active={...state.activeSessions};
    if(!hasWork(state,key)){
      if(active[key]&&history[active[key]]&&!history[active[key]].closedAt)delete history[active[key]];
      state.sessionHistory=history;state.activeSessions=active;return;
    }
    const id=active[key]||newId(state),previous=history[id];
    const next=capture(state,key,id,meta,previous);
    const compare=x=>JSON.stringify({...x,updatedAt:null});
    if(!previous||compare(previous)!==compare(next))next.updatedAt=new Date().toISOString();else next.updatedAt=previous.updatedAt;
    history[id]=next;active[key]=id;state.sessionHistory=history;state.activeSessions=active;
  }
  function startAnother(state,key,meta={}){
    if(!keyPattern.test(key))return;
    checkpoint(state,key,meta);
    const id=state.activeSessions?.[key],previous=state.sessionHistory?.[id];
    if(previous)state.sessionHistory={...state.sessionHistory,[id]:{...previous,closedAt:new Date().toISOString()}};
    for(const name of ['logs','equipmentChecks'])state[name]=Object.fromEntries(Object.entries(state[name]||{}).filter(([k])=>!k.startsWith(key+':')));
    state.sessions={...state.sessions};delete state.sessions[key];
    window.RoundworkReadiness?.reset(state,key);
    state.activeSessions={...state.activeSessions,[key]:newId(state)};
  }
  function records(state,week='all'){
    return Object.values(state.sessionHistory||{}).filter(record=>!record.deletedAt&&(week==='all'||record.week===Number(week))).sort((a,b)=>(b.performedDate||b.firstRecordedAt||'').localeCompare(a.performedDate||a.firstRecordedAt||'')||b.id.localeCompare(a.id));
  }
  function clearWorking(state,key){
    for(const name of ['logs','equipmentChecks'])state[name]=Object.fromEntries(Object.entries(state[name]||{}).filter(([k])=>!k.startsWith(key+':')));
    for(const name of ['sessions','activeSessions','readinessChecks']){state[name]={...state[name]};delete state[name][key];}
  }
  function deleteRecords(state,ids){
    const now=new Date().toISOString(),history={...state.sessionHistory};let count=0;
    for(const id of new Set(ids)){const row=history[id];if(!row||row.deletedAt)continue;history[id]={...row,deletedAt:now,closedAt:row.closedAt||now};for(const [key,active]of Object.entries(state.activeSessions||{}))if(active===id)clearWorking(state,key);count++;}
    state.sessionHistory=history;return count;
  }
  function deleteWeek(state,week){
    if(!Number.isInteger(week)||week<1||week>8)return 0;
    const count=deleteRecords(state,records(state,week).map(row=>row.id));
    const keys=new Set([...Object.keys(state.sessions||{}),...Object.keys(state.activeSessions||{}),...Object.keys(state.readinessChecks||{}),...Object.keys(state.logs||{}).map(k=>k.split(':').slice(0,2).join(':'))]);
    for(const key of keys)if(key.startsWith(week+':'))clearWorking(state,key);
    return count;
  }
  function deletedRecords(state,week='all'){return Object.values(state.sessionHistory||{}).filter(row=>row.deletedAt&&(week==='all'||row.week===Number(week))).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));}
  function restoreDeleted(state,id){const row=state.sessionHistory?.[id];if(!row?.deletedAt)return false;state.sessionHistory={...state.sessionHistory,[id]:{...row,deletedAt:null,closedAt:row.closedAt||new Date().toISOString()}};return true;}
  function editRecord(state,input){
    const old=state.sessionHistory?.[input?.id],P=window.RoundworkPerformance,week=Number(input?.week),day=window.BOXING_DATA.days.find(d=>d.id===input?.routine),performedDate=input?.performedDate?P.dateOnly(input.performedDate):null;
    if(!old||old.deletedAt||!Number.isInteger(week)||week<1||week>8||!day||!Array.isArray(input.exercises)||input.performedDate&&!performedDate||performedDate&&performedDate>P.today()||old.source==='manual'&&!performedDate)return null;
    if(Object.hasOwn(input,'settings')&&input.settings!==null&&!recordSettings(input.settings,day.id))return null;
    const customizations=P.definitions(input.customizations),slots=new Set(),exercises=[],now=new Date().toISOString();
    for(const entry of input.exercises){if(!entry.performed)continue;const custom=customizations.find(row=>row.slot===entry.slot&&row.exercise===entry.exercise);if(slots.has(entry.slot)||(!known(entry.exercise)||!known(entry.slot)&&!/^extra-\d+$/.test(entry.slot))&&!custom)return null;slots.add(entry.slot);
      const measured=entry.actual?P.actual(entry.actual):null;if(entry.actual&&!measured)return null;const prior=old.exercises.find(row=>row.slot===entry.slot&&row.exercise===entry.exercise);
      exercises.push({slot:entry.slot,exercise:entry.exercise,customName:custom?.customName||'',section:custom?.section||null,at:prior?.at||now,settings:prior?.settings||null,dose:prior?.dose||{},actual:measured});
    }
    const oldKey=old.week+':'+old.routine,newKey=week+':'+day.id,active=state.activeSessions?.[oldKey]===old.id;
    const record=cleanRecord({...old,settings:Object.hasOwn(input,'settings')?input.settings:old.settings,week,routine:day.id,title:input.recovery?'Recovery':oldKey===newKey&&old.title!=='Recovery'?old.title:window.RoundworkSchedule.routine(day,{week:2,recoveryDays:{}}).title,performedDate,updatedAt:now,sessionNotes:input.sessionNotes,sessionEffort:input.sessionEffort,exercises,customizations,closedAt:active&&oldKey!==newKey?now:old.closedAt},old.id);
    if(!record)return null;
    if(active){
      clearWorking(state,oldKey);
      if(oldKey===newKey){
        state.activeSessions[oldKey]=old.id;state.sessionAdditions={...state.sessionAdditions,[oldKey]:record.customizations};
        for(const entry of record.exercises)state.logs[oldKey+':'+entry.slot]={exercise:entry.exercise,at:entry.at,settings:entry.settings,dose:entry.dose,actual:entry.actual};
        state.equipmentChecks={...state.equipmentChecks,...record.equipmentChecks};
        if(record.readinessCheck)state.readinessChecks[oldKey]=record.readinessCheck;
        if(old.finishedAt)state.sessions[oldKey]={...(state.sessions?.[oldKey]||{}),at:old.finishedAt,updatedAt:now,settings:record.settings,readiness:record.readiness,coachLoad:record.coachLoad,prescription:record.prescription,readinessCheck:record.readinessCheck,sessionEffort:record.sessionEffort,sessionNotes:record.sessionNotes};
        // Keep an explicitly empty partial entry as an archived record instead of recreating it from working state.
        if(!old.finishedAt&&!record.exercises.length){delete state.activeSessions[oldKey];record.closedAt=now;}
      }
    }
    state.sessionHistory={...state.sessionHistory,[old.id]:record};return record;
  }
  function visibleExercises(record){const replaced=new Set((record.customizations||[]).map(row=>row.replaces).filter(Boolean));return record.exercises.filter(entry=>!replaced.has(entry.slot));}
  const pairs=[["Selected time budget, not elapsed workout time.","Tiempo disponible elegido, no duración real del entrenamiento."],["Session level and available time","Nivel de la sesión y tiempo disponible"],["Enter the level and time budget used for this session. Leave both as Not recorded if unknown. These entries do not change your planned workout or recorded actuals.","Introduce el nivel y el tiempo disponible usados en esta sesión. Deja ambos como No registrado si los desconoces. Estos datos no cambian tu entrenamiento previsto ni el trabajo realizado registrado."],["Select both exercise level and time available, or leave both as Not recorded.","Selecciona tanto el nivel como el tiempo disponible, o deja ambos como No registrado."],["Update what you performed. Original prescription snapshots remain separate from actual work.","Actualiza lo que realizaste. El trabajo indicado originalmente se conserva separado del trabajo realizado."],["Dates performed are entered manually. Original recording timestamps are retained separately.","Las fechas de realización se introducen manualmente. Las fechas y horas originales de registro se conservan por separado."],["Edit session","Editar sesión"],["Edit saved session","Editar sesión guardada"],["Delete session","Eliminar sesión"],["Delete this session?","¿Eliminar esta sesión?"],["Clear week log","Vaciar registro semanal"],["Clear this week’s log?","¿Vaciar el registro de esta semana?"],["Sessions affected","Sesiones afectadas"],["Deleted sessions","Sesiones eliminadas"],["Restore session","Restaurar sesión"],["Session notes","Notas de la sesión"],["Remove exercise","Quitar ejercicio"],["Changes are saved only when you select Save changes. Editing the current session also updates its completion marks. Moving it to another week or routine keeps it as a historical entry and clears its previous working marks.","Los cambios se guardan solo al seleccionar Guardar cambios. Editar la sesión actual también actualiza sus marcas de realización. Moverla a otra semana o rutina la conserva como entrada histórica y borra sus marcas de trabajo anteriores."],["For existing app sessions, leave Date performed blank to retain only the original recording dates.","En las sesiones existentes de la app, deja la fecha de realización en blanco para conservar solo las fechas originales de registro."],["Choose a routine and a valid date no later than today. New or manually entered sessions require a date. Check the exercise entries and try again.","Elige una rutina y una fecha válida hasta hoy. Las sesiones nuevas o introducidas manualmente requieren fecha. Revisa los ejercicios e inténtalo de nuevo."],["These entries will move to Deleted sessions and leave the weekly totals and comparisons. You can restore them later on this device.","Estas entradas pasarán a Sesiones eliminadas y saldrán de los totales semanales y las comparaciones. Puedes restaurarlas después en este dispositivo."],["For a current session, its working completion marks, actuals and equipment checks are cleared. Your routine choices, schedule and gym inventory stay selected.","En una sesión actual se borran sus marcas de realización, datos realizados y comprobaciones de equipo. Se conservan las rutinas elegidas, el horario y el inventario del gimnasio."],["This clears the selected numbered training week, including entries recorded on different calendar dates.","Esto vacía la semana de entrenamiento numerada seleccionada, incluidas las entradas registradas en distintas fechas del calendario."],["Select a training week to clear its log.","Selecciona una semana de entrenamiento para vaciar su registro."],["Deletion could not be saved. Your entries have been kept.","No se pudo guardar la eliminación. Se conservaron tus entradas."],["Entries moved to Deleted sessions.","Entradas trasladadas a Sesiones eliminadas."],["Restoring adds a historical entry to the log. It does not replace your current workout or its checkmarks.","Restaurar añade una entrada histórica al registro. No sustituye tu entrenamiento actual ni sus marcas."],["Deleted entries remain on this device and in exported backups until you remove the app data.","Las entradas eliminadas permanecen en este dispositivo y en las copias exportadas hasta que borres los datos de la app."],["Session restored as a historical entry.","Sesión restaurada como entrada histórica."],
    ['Log','Registro'],['Training log','Registro de entrenamiento'],['Weekly overview','Resumen semanal'],['All training weeks','Todas las semanas de entrenamiento'],['Training week','Semana de entrenamiento'],
    ['Saved sessions','Sesiones guardadas'],['Open or partial sessions','Sesiones abiertas o parciales'],['Exercises marked done','Ejercicios marcados como hechos'],['Session details','Detalles de la sesión'],
    ['Saved session','Sesión guardada'],['In progress','En curso'],['Partial session','Sesión parcial'],['Current session','Sesión actual'],
    ['First recorded on','Primer registro el'],['Last updated','Última actualización'],['Session saved on','Sesión guardada el'],['Recorded details','Detalles registrados'],
    ['No sessions recorded for this selection.','No hay sesiones registradas para esta selección.'],['Check Done on an exercise or save a session to add it here.','Marca Hecho en un ejercicio o guarda una sesión para añadirla aquí.'],
    ['Completed exercises and saved sessions appear together here. Repeating a routine creates a separate entry when you use Start another session.','Aquí se muestran juntos los ejercicios completados y las sesiones guardadas. Repetir una rutina crea una entrada independiente al usar Iniciar otra sesión.'],
    ['Start another session','Iniciar otra sesión'],['Start another session?','¿Iniciar otra sesión?'],['Keep current session','Conservar la sesión actual'],
    ['The current attempt stays in Log. The new attempt starts with unchecked exercises and equipment. Your movement choices, level and time stay selected.','El intento actual queda en Registro. El nuevo intento empieza con ejercicios y equipo sin marcar. Se conservan los movimientos, el nivel y el tiempo elegidos.'],
    ['New session ready. The previous attempt is kept in Log.','Nueva sesión lista. El intento anterior se conserva en Registro.'],['View weekly log','Ver registro semanal'],
    ['Prescribed work, not measured performance. Times are when you recorded the work, not automatic workout start or finish times.','Trabajo indicado, no rendimiento medido. Las horas corresponden al registro, no al inicio o final automáticos del entrenamiento.'],
    ['Marked done','Marcado como hecho'],['Not marked done','Sin marcar como hecho'],['Sets','Series'],['Repetitions / distance','Repeticiones / distancia'],['Work seconds','Segundos de trabajo'],['Rest seconds','Segundos de descanso'],
    ['Plan at the time of recording','Plan al registrar'],['Time available','Tiempo disponible'],['Readiness','Estado de recuperación'],['Coaching load','Carga del boxeo'],['Tired','Cansado'],['Unknown','Sin confirmar'],['Technical / light','Técnico / suave'],['Hard','Intenso'],
    ['Reset affects this attempt only. Earlier attempts remain in Log.','El restablecimiento afecta solo a este intento. Los intentos anteriores quedan en Registro.'],
    ['Only the selected training week is shown. Choose All training weeks to see the full history.','Solo se muestra la semana de entrenamiento seleccionada. Elige Todas las semanas de entrenamiento para ver el historial completo.'],
    ['Original scheduled weekday unavailable','Día programado original no disponible'],['Settings not recorded','Ajustes no registrados']
  ];
  for(let week=1;week<=8;week++)pairs.push(['Week '+week,'Semana '+week]);
  for(const [en,es] of pairs)window.ROUNDWORK_ES[en]=es;
  window.ROUNDWORK_HISTORY_TEXT=pairs.map(pair=>pair[0]);
  return {recordSettings,cleanRecord,restore,hasWork,checkpoint,startAnother,records,newId,visibleExercises,deleteRecords,deleteWeek,deletedRecords,restoreDeleted,editRecord};
})();
