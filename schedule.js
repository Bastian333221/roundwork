/* Weekday assignments are separate from stable routine IDs and existing log keys. */
window.RoundworkSchedule=(()=>{
  'use strict';
  const ids=['mon','tue','wed','thu','fri','sat','sun'];
  const identity=()=>Object.fromEntries(ids.map(id=>[id,id]));
  function mapping(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return identity();
    const values=ids.map(id=>value[id]);
    if(values.some(id=>!ids.includes(id))||new Set(values).size!==7)return identity();
    return Object.fromEntries(ids.map(id=>[id,value[id]]));
  }
  function cleanSchedules(value){
    const out={};
    if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const week of ['2','4','6','8'])if(Object.hasOwn(value,week))out[week]=mapping(value[week]);
    return out;
  }
  function cleanRecovery(value){
    const out={};
    if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const [key,choice] of Object.entries(value))if(/^[2468]:(mon|tue|wed|thu|fri|sat|sun)$/.test(key)&&typeof choice==='boolean')out[key]=choice;
    return out;
  }
  function recoveryChoices(state){
    const out=cleanRecovery(state.recoveryDays);
    // Older recorded recovery sessions retain their original meaning.
    for(const week of [2,4,6,8])for(const id of ['fri','sun']){
      const key=week+':'+id;
      const prescription=state.sessions?.[key]?.prescription;
      if(!Object.hasOwn(out,key)&&(state.logs?.[key+':rest']||(Array.isArray(prescription)&&prescription.some(item=>item?.exercise==='rest'))))out[key]=true;
    }
    return out;
  }
  function routine(day,state){
    if(state.week%2!==0)return day;
    if(state.recoveryDays?.[state.week+':'+day.id]===true){
      const rest=window.BOXING_DATA.days.find(item=>item.id==='fri');
      return {...rest,id:day.id,templateId:'fri',title:'Recovery',label:day.label};
    }
    if(!['fri','sun'].includes(day.id))return day;
    const skills=window.BOXING_DATA.days.find(item=>item.id==='tue');
    return {...skills,id:day.id,templateId:'tue',label:day.label,title:day.id==='fri'?'Skills & aerobic A':'Skills & aerobic B',items:skills.items.filter(item=>!item.conditioning)};
  }
  const calendarDay=(value,routine)=>ids.find(id=>mapping(value)[id]===routine);
  function move(value,routine,target){
    const out=mapping(value),source=calendarDay(out,routine);
    if(!source||!ids.includes(target))return out;
    [out[source],out[target]]=[out[target],out[source]];
    return out;
  }
  function shift(value,start){
    const current=mapping(value);
    if(!ids.includes(start))return current;
    const offset=(ids.indexOf(start)-ids.indexOf(calendarDay(current,'mon'))+7)%7;
    return Object.fromEntries(ids.map((id,index)=>[ids[(index+offset)%7],current[id]]));
  }
  function consecutiveStrength(value,recovery=[]){
    if(recovery.includes('mon')||recovery.includes('wed'))return false;
    const current=mapping(value),a=ids.indexOf(calendarDay(current,'mon')),b=ids.indexOf(calendarDay(current,'wed'));
    return Math.abs(a-b)===1||Math.abs(a-b)===6;
  }
  function dateLabel(value,language='en'){
    if(typeof value!=='string'||!value.trim())return null;
    const date=new Date(value);
    return Number.isFinite(date.getTime())?new Intl.DateTimeFormat(language==='es'?'es-CO':'en-US',{weekday:'long',year:'numeric',month:'short',day:'numeric'}).format(date):null;
  }
  const pairs=[['Two power-and-strength sessions, skills and aerobic options, and two coached sessions. Choose your recovery days. Your lifting weeks stay unchanged.','Dos sesiones de potencia y fuerza, opciones de técnica y trabajo aeróbico y dos sesiones con entrenador. Elige tus días de recuperación. Tus semanas de pesas no cambian.'],["Skills & aerobic A","Técnica y trabajo aeróbico A"],["Skills & aerobic B","Técnica y trabajo aeróbico B"],["Skills A","Técnica A"],["Skills B","Técnica B"],["Recovery","Recuperación"],["Make this a recovery day","Elegir recuperación para este día"],["Resume planned session","Retomar la sesión prevista"],["Recovery is your choice on any day. Friday and Sunday offer skills and easy aerobic work. Available workouts are not a recommendation to train every day.","Puedes elegir recuperación cualquier día. El viernes y el domingo ofrecen técnica y trabajo aeróbico suave. Tener rutinas disponibles no es una recomendación de entrenar todos los días."],["Recovery selected for this routine. Other days and existing records are kept.","Recuperación elegida para esta rutina. Se conservan los otros días y los registros existentes."],["Planned session restored. Existing records are kept.","Sesión prevista restaurada. Se conservan los registros existentes."],["Choose your recovery days; review your total workload with your coach and keep the prescribed rests between sets.","Elige tus días de recuperación; revisa la carga total con tu entrenador y conserva los descansos indicados entre series."],["Monday: power + strength + sled. Tuesday: technique + aerobic work + optional ropes. Wednesday: power + strength. Thursday and Saturday: coaching. Friday and Sunday: optional skills + easy aerobic work. Choose recovery on any day from its menu.","Lunes: potencia + fuerza + trineo. Martes: técnica + trabajo aeróbico + cuerdas opcionales. Miércoles: potencia + fuerza. Jueves y sábado: boxeo. Viernes y domingo: técnica + trabajo aeróbico suave opcionales. Elige recuperación cualquier día desde su menú."],
    ['Choose training plan','Elegir plan de entrenamiento'],['Close menu','Cerrar menú'],['Current plan','Plan actual'],
    ['Choose a routine for this weekday. Its current weekday exchanges routines with this day.','Elige una rutina para este día. Su día actual intercambia rutinas con este día.'],
    ['Click a weekday to choose its training plan.','Pulsa un día de la semana para elegir su plan de entrenamiento.'],
    ['Default schedule. Click a weekday in Session to choose its training plan.','Horario original. Pulsa un día en Sesión para elegir su plan de entrenamiento.'],
    ['Adapt this week','Adapta esta semana'],['Routine','Rutina'],['Scheduled for','Programada para'],
    ['Start first strength routine on','Iniciar la primera rutina de fuerza el'],['Shift entire week','Desplazar toda la semana'],
    ['Every session moves, including coaching and recovery. Days that pass Sunday wrap to Monday.','Se desplazan todas las sesiones, incluidas las de boxeo y recuperación. Los días posteriores al domingo pasan al lunes.'],
    ['Move selected routine to','Mover la rutina seleccionada al'],['Move and exchange','Mover e intercambiar'],
    ['The destination routine exchanges weekdays with this routine.','La rutina de destino intercambia su día con esta rutina.'],
    ['Exchanges with','Se intercambia con'],['Already on this weekday.','Ya está en este día de la semana.'],
    ['Restore original weekdays','Restaurar los días originales'],
    ['Weekday assignments change; exercise choices, equipment checks and completion dates stay with each routine.','Cambian los días asignados; los ejercicios elegidos, las confirmaciones de equipo y las fechas de realización permanecen con cada rutina.'],
    ['Schedule updated. Completed work stays with its routine.','Horario actualizado. El trabajo completado permanece con su rutina.'],
    ['Original weekdays restored. Your routine records are kept.','Días originales restaurados. Se conservan los registros de tus rutinas.'],
    ['Rescheduling does not assess recovery. Review the changed order with your coach; keep the prescribed rests and recovery days.','Cambiar el horario no evalúa tu recuperación. Revisa el nuevo orden con tu entrenador; conserva los descansos indicados y los días de recuperación.'],
    ['Strength sessions are on consecutive weekdays. Review recovery spacing with your coach before training.','Las sesiones de fuerza están en días consecutivos. Revisa el tiempo de recuperación con tu entrenador antes de entrenar.'],
    ['Recovery guidance','Orientación sobre recuperación'],['Coaching A','Boxeo A'],['Coaching B','Boxeo B'],
    ['Recovery A','Recuperación A'],['Recovery B','Recuperación B'],['Power A','Potencia A'],['Power B','Potencia B'],['Skills','Técnica'],
    ['Session recorded on','Sesión registrada el'],['Routine record','Registro de la rutina'],['Completed on','Completado el'],['Exercise completion dates','Fechas de realización de los ejercicios'],
    ['No exercises recorded for this routine yet.','Todavía no hay ejercicios registrados para esta rutina.'],['Date unavailable','Fecha no disponible'],
    ['Reset this routine log','Restablecer el registro de esta rutina'],['Routine progress','Progreso de la rutina'],
    ['Mark each exercise after its prescribed sets. Your record follows the routine when its weekday changes.','Marca cada ejercicio después de sus series indicadas. El registro sigue a la rutina cuando cambia su día.'],
    ['Selected manually','Seleccionado manualmente'],['Saved for this routine','Guardado para esta rutina'],
    ['Changing choices keeps this routine’s completed work. Do not repeat an exercise simply because the routine moved.','Cambiar opciones conserva el trabajo completado de esta rutina. No repitas un ejercicio solo porque la rutina cambió de día.'],
    ['This resets the selected routine’s completion marks for this training week. Weekday assignments and other routines stay saved.','Esto restablece las marcas de realización de la rutina seleccionada en esta semana de entrenamiento. Se conservan los días asignados y las otras rutinas.'],
    ['Default schedule. Use Adapt this week to move sessions.','Horario original. Usa Adapta esta semana para mover sesiones.']
  ];
  for(const [en,es] of pairs)window.ROUNDWORK_ES[en]=es;
  window.ROUNDWORK_SCHEDULE_TEXT=pairs.map(pair=>pair[0]);
  return {ids,identity,mapping,cleanSchedules,cleanRecovery,recoveryChoices,routine,calendarDay,move,shift,consecutiveStrength,dateLabel};
})();
