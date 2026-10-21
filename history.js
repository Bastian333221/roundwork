/* Session instances retain completed and partial attempts independently of routine templates. */
window.RoundworkHistory=(()=>{
  'use strict';
  const keyPattern=/^[1-8]:(mon|tue|wed|thu|fri|sat|sun)$/;
  const idPattern=/^(?:legacy|session)-[a-zA-Z0-9_-]{1,90}$/;
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const date=x=>typeof x==='string'&&x.trim()&&Number.isFinite(new Date(x).getTime())?x:null;
  const known=id=>window.BOXING_DATA.exercises.some(ex=>ex.id===id);
  const text=(x,n=500)=>typeof x==='string'?x.slice(0,n):'';
  function dose(value){
    if(!object(value))return {};
    const out={};
    for(const key of ['sets','reps','rest','seconds','notes','skip','gated']){
      const v=value[key];
      if(v===null||typeof v==='boolean'||typeof v==='string'||typeof v==='number'&&Number.isFinite(v))out[key]=typeof v==='string'?v.slice(0,5000):v;
    }
    return out;
  }
  function cleanRecord(value,id){
    if(!object(value)||!idPattern.test(id)||!keyPattern.test(value.week+':'+value.routine))return null;
    const week=Number(value.week),routine=value.routine;
    const rawExercises=(Array.isArray(value.exercises)?value.exercises:[]).filter(x=>object(x)&&known(x.slot)&&known(x.exercise)).map(x=>({slot:x.slot,exercise:x.exercise,at:date(x.at),settings:object(x.settings)?window.RoundworkPlanner.cleanChoice(x.settings,routine):null,dose:dose(x.dose)}));
    const exercises=[...new Map(rawExercises.map(item=>[item.slot,item])).values()];
    const prescription=(Array.isArray(value.prescription)?value.prescription:[]).filter(x=>object(x)&&known(x.exercise)&&known(x.selected)).map(x=>({exercise:x.exercise,selected:x.selected,dose:dose(x.dose)}));
    return {id,week,routine,title:text(value.title,200),scheduledDay:window.RoundworkSchedule.ids.includes(value.scheduledDay)?value.scheduledDay:null,firstRecordedAt:date(value.firstRecordedAt),updatedAt:date(value.updatedAt),finishedAt:date(value.finishedAt),closedAt:date(value.closedAt),settings:object(value.settings)?window.RoundworkPlanner.cleanChoice(value.settings,routine):null,readiness:['normal','tired'].includes(value.readiness)?value.readiness:null,coachLoad:['unknown','technical','hard'].includes(value.coachLoad)?value.coachLoad:null,prescription,exercises,equipmentChecks:window.RoundworkChoices.cleanEquipmentChecks(value.equipmentChecks)};
  }
  function hasWork(state,key){return !!state.sessions?.[key]||Object.keys(state.logs||{}).some(k=>k.startsWith(key+':'));}
  function capture(state,key,id,meta={},previous){
    const [week,routine]=key.split(':'),session=state.sessions?.[key];
    const exercises=Object.entries(state.logs||{}).filter(([k,v])=>k.startsWith(key+':')&&object(v)).map(([k,v])=>({slot:k.slice(key.length+1),exercise:v.exercise||v.selected||k.slice(key.length+1),at:v.at,settings:v.settings,dose:v.dose}));
    const dates=[...exercises.map(x=>date(x.at)),date(session?.at)].filter(Boolean).sort((a,b)=>new Date(a)-new Date(b));
    const day=window.BOXING_DATA.days.find(d=>d.id===routine);
    const title=window.RoundworkSchedule.routine(day,{week:Number(week),recoveryDays:state.recoveryDays}).title;
    return cleanRecord({week:Number(week),routine,title:previous?.title||meta.title||title,scheduledDay:previous?previous.scheduledDay:meta.scheduledDay,firstRecordedAt:previous?.firstRecordedAt||dates[0]||null,updatedAt:session?.updatedAt||dates.at(-1)||null,finishedAt:session?.at,settings:session?.settings||exercises.find(item=>item.settings)?.settings||previous?.settings||(!previous?meta.settings:null),readiness:session?.readiness||previous?.readiness||(!previous?meta.readiness:null),coachLoad:session?.coachLoad||previous?.coachLoad||(!previous?meta.coachLoad:null),prescription:session?.prescription||previous?.prescription||meta.prescription,exercises,equipmentChecks:Object.fromEntries(Object.entries(state.equipmentChecks||{}).filter(([k])=>k.startsWith(key+':')))},id);
  }
  function restore(state){
    const sessionHistory={},activeSessions={};
    if(object(state.sessionHistory))for(const [id,value] of Object.entries(state.sessionHistory)){const clean=cleanRecord(value,id);if(clean)sessionHistory[id]=clean;}
    if(object(state.activeSessions))for(const [key,id] of Object.entries(state.activeSessions)){
      if(!keyPattern.test(key)||typeof id!=='string'||!idPattern.test(id))continue;
      const record=sessionHistory[id];
      if(!record||(!record.closedAt&&record.week+':'+record.routine===key))activeSessions[key]=id;
    }
    const cleanState={...state,sessionHistory,activeSessions};
    const keys=new Set([...Object.keys(state.sessions||{}),...Object.keys(state.logs||{}).map(k=>k.split(':').slice(0,2).join(':'))]);
    for(const key of keys){
      if(!keyPattern.test(key)||activeSessions[key]||!hasWork(state,key))continue;
      let id='legacy-'+key.replace(':','-');while(sessionHistory[id])id+='-copy';
      sessionHistory[id]=capture(cleanState,key,id);activeSessions[key]=id;
    }
    return {sessionHistory,activeSessions};
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
    state.activeSessions={...state.activeSessions,[key]:newId(state)};
  }
  function records(state,week='all'){
    return Object.values(state.sessionHistory||{}).filter(record=>week==='all'||record.week===Number(week)).sort((a,b)=>(new Date(b.firstRecordedAt||0)-new Date(a.firstRecordedAt||0))||b.id.localeCompare(a.id));
  }
  const pairs=[
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
  return {cleanRecord,restore,hasWork,checkpoint,startAnother,records};
})();
