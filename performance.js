/* Self-reported performance is separate from the prescribed training dose. */
window.RoundworkPerformance=(()=>{
  'use strict';
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const loadTypes=['total','perHand','bodyweight','assistance','unquantified'];
  const loadLabels={total:'Total external load',perHand:'Per dumbbell / hand',bodyweight:'Bodyweight',assistance:'Assistance',unquantified:'Unquantified resistance'};
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
    const seconds=number(value.seconds),metres=number(value.metres),notes=typeof value.notes==='string'?value.notes.trim().slice(0,2000):'';
    if(Number.isNaN(seconds)||Number.isNaN(metres)||!sets.length&&seconds===null&&metres===null&&!notes)return null;
    return {loadType:value.loadType,unit:value.unit,sets,seconds,metres,notes};
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
    const id=old?.id||window.RoundworkHistory.newId(state),now=new Date().toISOString(),seen=new Set(),slots=new Set(),exercises=[];
    for(const entry of input.exercises){
      if(!entry.performed)continue;
      if(!window.BOXING_DATA.exercises.some(ex=>ex.id===entry.exercise)||seen.has(entry.exercise))return null;
      const slot=entry.slot;
      if(slots.has(slot)||!window.BOXING_DATA.exercises.some(ex=>ex.id===slot)&&!/^extra-\d+$/.test(slot))return null;
      seen.add(entry.exercise);slots.add(slot);
      const measured=entry.actual?actual(entry.actual):null;if(entry.actual&&!measured)return null;
      const previous=old?.exercises.find(ex=>ex.slot===slot&&ex.exercise===entry.exercise);
      exercises.push({slot,exercise:entry.exercise,at:previous?.at||now,settings:null,dose:{},actual:measured});
    }
    const record=window.RoundworkHistory.cleanRecord({id,week,routine:day.id,title:input.recovery?'Recovery':window.RoundworkSchedule.routine(day,{week:2,recoveryDays:{}}).title,source:'manual',performedDate,enteredAt:old?.enteredAt||now,firstRecordedAt:old?.firstRecordedAt||now,updatedAt:now,finishedAt:old?.finishedAt||now,closedAt:old?.closedAt||now,settings:null,exercises,prescription:[],equipmentChecks:{}},id);
    if(!record)return null;
    state.sessionHistory={...state.sessionHistory,[id]:record};return record;
  }
  function comparisons(records,exercise){
    return records.flatMap(record=>record.exercises.filter(entry=>entry.exercise===exercise&&entry.actual).map(entry=>({record,entry}))).sort((a,b)=>(b.record.performedDate||b.record.firstRecordedAt||'').localeCompare(a.record.performedDate||a.record.firstRecordedAt||''));
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
  return {loadTypes,loadLabels,actual,dateOnly,today,dateLabel,addManual,comparisons};
})();
