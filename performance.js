/* Self-reported performance is separate from the prescribed training dose. */
window.RoundworkPerformance=(()=>{
  'use strict';
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const loadTypes=['total','perHand','bodyweight','assistance','unquantified'];
  const loadLabels={total:'Total external load',perHand:'Per dumbbell / hand',bodyweight:'Bodyweight',assistance:'Assistance',unquantified:'Unquantified resistance'};
  const sections=['warmup','power','strength','technique','conditioning','core','cooldown','other'];
  const sectionLabels={warmup:'Warm-up',power:'Power',strength:'Strength',technique:'Boxing technique',conditioning:'Conditioning / aerobic',core:'Core / trunk',cooldown:'Cooldown',other:'Other work'};
  const known=id=>window.BOXING_DATA.exercises.some(ex=>ex.id===id);
  function customId(name){return 'user:'+String(name).normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');}
  function definition(value){
    if(!object(value)||typeof value.slot!=='string'||!/^custom-[a-zA-Z0-9_-]{1,90}$/.test(value.slot)||!sections.includes(value.section))return null;
    const customName=typeof value.customName==='string'?value.customName.trim().replace(/\s+/g,' ').slice(0,120):'';
    if(!known(value.exercise)&&(!customName||value.exercise!==customId(customName)))return null;
    const equipment=typeof value.equipment==='string'?value.equipment.trim().slice(0,250):'';
    let guideUrl=typeof value.guideUrl==='string'?value.guideUrl.trim().slice(0,2000):'';
    if(guideUrl){try{const url=new URL(guideUrl);if(url.protocol!=='https:'||url.username||url.password)return null;guideUrl=url.href;}catch{return null;}}
    return {slot:value.slot,exercise:value.exercise,customName:known(value.exercise)?'':customName,section:value.section,replaces:known(value.replaces)?value.replaces:null,equipment,guideUrl};
  }
  function definitions(value){
    if(!Array.isArray(value))return [];
    const slots=new Set(),replacements=new Set(),out=[];
    for(const input of value){const row=definition(input);if(!row||slots.has(row.slot)||row.replaces&&replacements.has(row.replaces))continue;slots.add(row.slot);if(row.replaces)replacements.add(row.replaces);out.push(row);}
    return out;
  }
  function cleanAdditions(value){
    const out={};if(!object(value))return out;
    for(const [key,rows] of Object.entries(value))if(/^[1-8]:(mon|tue|wed|thu|fri|sat|sun)$/.test(key))out[key]=definitions(rows);
    return out;
  }
  const newSlot=()=> 'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  function catalogue(state){
    const entries=new Map(window.BOXING_DATA.exercises.map(ex=>[ex.id,{id:ex.id,name:ex.name,custom:false}]));
    const rows=[...Object.values(state.sessionAdditions||{}).flat(),...Object.values(state.sessionHistory||{}).flatMap(record=>record.customizations||[])];
    for(const row of rows)if(row.customName)entries.set(row.exercise,{id:row.exercise,name:row.customName,custom:true});
    return [...entries.values()];
  }
  function setAddition(state,key,input){
    if(!/^[1-8]:(mon|tue|wed|thu|fri|sat|sun)$/.test(key))return null;
    const row=definition(input);if(!row)return null;
    const current=definitions(state.sessionAdditions?.[key]);
    if(current.some(item=>item.slot!==row.slot&&row.replaces&&item.replaces===row.replaces))return null;
    state.sessionAdditions={...state.sessionAdditions,[key]:current.some(item=>item.slot===row.slot)?current.map(item=>item.slot===row.slot?row:item):[...current,row]};
    const logKey=key+':'+row.slot;if(state.logs?.[logKey])state.logs={...state.logs,[logKey]:{...state.logs[logKey],exercise:row.exercise}};
    return row;
  }
  function addToRecord(state,id,input){
    const record=state.sessionHistory?.[id],row=definition(input);if(!record||!row)return null;
    const current=definitions(record.customizations);
    if(current.some(item=>item.slot!==row.slot&&row.replaces&&item.replaces===row.replaces))return null;
    const now=new Date().toISOString(),previous=record.exercises.find(entry=>entry.slot===row.slot);
    const next={...record,updatedAt:now,customizations:current.some(item=>item.slot===row.slot)?current.map(item=>item.slot===row.slot?row:item):[...current,row],exercises:previous?record.exercises.map(entry=>entry.slot===row.slot?{...entry,exercise:row.exercise,customName:row.customName,section:row.section}:entry):[...record.exercises,{slot:row.slot,exercise:row.exercise,customName:row.customName,section:row.section,at:now,settings:null,dose:{},actual:null}]};
    const clean=window.RoundworkHistory.cleanRecord(next,id);if(!clean)return null;
    state.sessionHistory={...state.sessionHistory,[id]:clean};
    const key=record.week+':'+record.routine;
    if(state.activeSessions?.[key]===id){setAddition(state,key,row);state.logs={...state.logs,[key+':'+row.slot]:{exercise:row.exercise,at:previous?.at||now,settings:null,dose:{},actual:previous?.actual||null}};}
    return row;
  }
  const number=(value,integer=false)=>{
    if(value===''||value===null||value===undefined)return null;
    const n=typeof value==='number'?value:typeof value==='string'&&/^\d+(?:[.,]\d+)?$/.test(value.trim())?Number(value.trim().replace(',','.')):NaN;
    return Number.isFinite(n)&&n>=0&&(!integer||Number.isInteger(n))?n:NaN;
  };
  function actual(value){
    if(!object(value)||!loadTypes.includes(value.loadType)||!['kg','lb'].includes(value.unit)||!Array.isArray(value.sets)||value.sets.length>100)return null;
    const sets=[];
    for(const row of value.sets){
      if(!object(row))return null;
      let weight=number(row.weight),reps=number(row.reps,true);
      if(Number.isNaN(weight)||Number.isNaN(reps))return null;
      if(['bodyweight','unquantified'].includes(value.loadType))weight=null;
      if(weight!==null||reps!==null)sets.push({weight,reps});
    }
    let seconds=number(value.seconds),metres=number(value.metres),time=null,distance=null;
    if(value.time!==undefined&&value.time!==null){if(!object(value.time)||!['s','min'].includes(value.time.unit))return null;const n=number(value.time.value);if(Number.isNaN(n))return null;seconds=n===null?null:n*(value.time.unit==='min'?60:1);if(n!==null)time={value:n,unit:value.time.unit};}else if(seconds!==null&&!Number.isNaN(seconds))time={value:seconds,unit:'s'};
    if(value.distance!==undefined&&value.distance!==null){if(!object(value.distance)||!['m','yd'].includes(value.distance.unit))return null;const n=number(value.distance.value);if(Number.isNaN(n))return null;metres=n===null?null:n*(value.distance.unit==='yd'?0.9144:1);if(n!==null)distance={value:n,unit:value.distance.unit};}else if(metres!==null&&!Number.isNaN(metres))distance={value:metres,unit:'m'};
    const notes=typeof value.notes==='string'?value.notes.trim().slice(0,2000):'';
    if(seconds!==null&&!Number.isFinite(seconds)||metres!==null&&!Number.isFinite(metres)||!sets.length&&seconds===null&&metres===null&&!notes)return null;
    return {loadType:value.loadType,unit:value.unit,sets,seconds,metres,time,distance,notes};
  }
  function dateOnly(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const parsed=new Date(value+'T12:00:00Z');
    return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?value:null;
  }
  function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function dateLabel(value,language='en'){
    return dateOnly(value)?new Intl.DateTimeFormat(language==='es'?'es-CO':'en-US',{timeZone:'UTC',weekday:'long',year:'numeric',month:'short',day:'numeric'}).format(new Date(value+'T12:00:00Z')):null;
  }
  function addManual(state,input){
    const performedDate=dateOnly(input?.performedDate),week=Number(input?.week),day=window.BOXING_DATA.days.find(d=>d.id===input?.routine);
    if(!performedDate||performedDate>today()||!Number.isInteger(week)||week<1||week>8||!day||!Array.isArray(input.exercises))return null;
    const old=input.id&&state.sessionHistory?.[input.id];
    if(input.id&&old?.source!=='manual')return null;
    const id=old?.id||window.RoundworkHistory.newId(state),now=new Date().toISOString(),seen=new Set(),slots=new Set(),exercises=[],customizations=definitions(input.customizations);
    for(const entry of input.exercises){
      if(!entry.performed)continue;
      const custom=customizations.find(row=>row.slot===entry.slot&&row.exercise===entry.exercise);
      if(!known(entry.exercise)&&!custom||seen.has(entry.exercise))return null;
      const slot=entry.slot;
      if(slots.has(slot)||!known(slot)&&!/^extra-\d+$/.test(slot)&&!custom)return null;
      seen.add(entry.exercise);slots.add(slot);
      const measured=entry.actual?actual(entry.actual):null;if(entry.actual&&!measured)return null;
      const previous=old?.exercises.find(ex=>ex.slot===slot&&ex.exercise===entry.exercise);
      exercises.push({slot,exercise:entry.exercise,customName:custom?.customName||'',section:custom?.section||null,at:previous?.at||now,settings:null,dose:{},actual:measured});
    }
    const record=window.RoundworkHistory.cleanRecord({id,week,routine:day.id,title:input.recovery?'Recovery':window.RoundworkSchedule.routine(day,{week:2,recoveryDays:{}}).title,source:'manual',performedDate,enteredAt:old?.enteredAt||now,firstRecordedAt:old?.firstRecordedAt||now,updatedAt:now,finishedAt:old?.finishedAt||now,closedAt:old?.closedAt||now,settings:null,exercises,customizations:customizations.filter(row=>exercises.some(entry=>entry.slot===row.slot)),prescription:[],equipmentChecks:{}},id);
    if(!record)return null;
    state.sessionHistory={...state.sessionHistory,[id]:record};return record;
  }
  function comparisons(records,exercise){
    return records.flatMap(record=>window.RoundworkHistory.visibleExercises(record).filter(entry=>entry.exercise===exercise&&entry.actual).map(entry=>({record,entry}))).sort((a,b)=>(b.record.performedDate||b.record.firstRecordedAt||'').localeCompare(a.record.performedDate||a.record.firstRecordedAt||''));
  }
  const pairs=[
    ['Record actuals','Registrar lo realizado'],['Edit actuals','Editar lo realizado'],['Actual work performed','Trabajo realizado'],['Prescribed work','Trabajo indicado'],
    ['Weight','Peso'],['Repetitions','Repeticiones'],['Weight unit','Unidad de peso'],['Load basis','Base del peso'],['Total external load','Peso externo total'],['Per dumbbell / hand','Por mancuerna / mano'],['Bodyweight','Peso corporal'],['Assistance','Asistencia'],['Unquantified resistance','Resistencia sin cuantificar'],
    ['Set','Serie'],['Add set','Añadir serie'],['Remove set','Quitar serie'],['Save performed exercise','Guardar ejercicio realizado'],['Cancel','Cancelar'],['Sets recorded','Series registradas'],['Sets not recorded','Series no registradas'],['Not recorded','No registrado'],
    ['Time performed (seconds)','Tiempo realizado (segundos)'],['Distance performed (metres)','Distancia realizada (metros)'],['Equipment / performance notes','Notas del equipo o rendimiento'],
    ['Leave unknown values blank. Enter the work you actually performed; prescribed numbers are not filled in for you.','Deja en blanco los valores que no recuerdes. Introduce el trabajo que realizaste; los valores indicados no se rellenan por ti.'],
    ['Saving records this exercise as performed. It does not confirm equipment or change the workout prescription.','Guardar registra este ejercicio como realizado. No confirma el equipo ni cambia el trabajo indicado.'],
    ['Use non-negative numbers, whole repetitions, and at least one performed value or note.','Usa números no negativos, repeticiones enteras y al menos un valor realizado o una nota.'],
    ['Actual work saved.','Trabajo realizado guardado.'],['Remove this completion and its recorded actuals? Earlier sessions stay saved.','¿Quitar esta marca y sus datos realizados? Se conservan las sesiones anteriores.'],
    ['Add past session','Añadir sesión anterior'],['Edit manual session','Editar sesión manual'],['Log a completed workout','Registrar un entrenamiento realizado'],['Routine performed','Rutina realizada'],['Choose a routine','Elige una rutina'],['Date performed','Fecha de realización'],['Manual entry','Entrada manual'],['Entered on','Registrado el'],['Performed on','Realizado el'],
    ['Mark only the exercises you remember performing. Unknown weights and repetitions can stay blank. This does not change your current schedule or session.','Marca solo los ejercicios que recuerdes haber realizado. Puedes dejar en blanco los pesos y las repeticiones desconocidos. Esto no cambia tu horario ni tu sesión actual.'],
    ['Performed','Realizado'],['Add another exercise','Añadir otro ejercicio'],['Choose an exercise','Elige un ejercicio'],['Save past session','Guardar sesión anterior'],['Save changes','Guardar cambios'],
    ['Choose a routine and a valid date no later than today. Each performed exercise must appear only once.','Elige una rutina y una fecha válida hasta hoy. Cada ejercicio realizado debe aparecer una sola vez.'],
    ['Past session saved in Log.','Sesión anterior guardada en Registro.'],['No individual exercises recorded.','No se registraron ejercicios individuales.'],
    ['Compare across sessions','Comparar entre sesiones'],['Compare exercise','Comparar ejercicio'],['Actual sets and repetitions','Series y repeticiones realizadas'],['Recorded on','Registrado el'],
    ['Compare the same exercise variation, equipment and load basis. Entries are self-reported; the app does not estimate strength gains or increase your training load.','Compara la misma variante, equipo y base del peso. Los datos son declarados por ti; la app no estima ganancias de fuerza ni aumenta tu carga.'],
    ['Record actuals on an exercise to compare it here.','Registra lo realizado en un ejercicio para compararlo aquí.'],
    ['Back to past session','Volver a la sesión anterior'],['Manual sessions show the date you selected. Other entries show their original recording dates.','Las sesiones manuales muestran la fecha elegida. Las otras entradas muestran sus fechas originales de registro.'],
    ['Changing the routine keeps exercises you have already marked or entered.','Cambiar la rutina conserva los ejercicios que ya marcaste o registraste.']
  ];
  for(const [en,es] of pairs)window.ROUNDWORK_ES[en]=es;
  window.ROUNDWORK_PERFORMANCE_TEXT=pairs.map(pair=>pair[0]);
  return {loadTypes,loadLabels,sections,sectionLabels,customId,definition,definitions,cleanAdditions,newSlot,catalogue,setAddition,addToRecord,actual,dateOnly,today,dateLabel,addManual,comparisons};
})();
