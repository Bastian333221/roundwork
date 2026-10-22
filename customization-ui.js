window.RoundworkCustomizationUI=(()=>{
  'use strict';
  const P=()=>window.RoundworkPerformance;
  const sectionFor=slot=>({warmup:'warmup',jump:'power',rotation:'power',chestThrow:'power',squat:'strength',press:'strength',row:'strength',hinge:'strength',lunge:'strength',pulldown:'strength',pallof:'core',sidePlank:'core',shadow:'technique',bike:'conditioning',sled:'conditioning',ropes:'conditioning',cooldown:'cooldown'})[slot]||'other';
  function create(c){
    const e=c.esc,$=selector=>document.querySelector(selector),name=id=>window.BOXING_DATA.exercises.find(ex=>ex.id===id)?.name||id,t=value=>window.RoundworkI18n?.translate(value)||value;
    let draft=null;
    function additions(){return P().definitions(c.getState().sessionAdditions?.[c.sessionKey()]);}
    function replaced(slot){return additions().some(row=>row.replaces===slot);}
    function entryName(entry){return entry.customName||name(entry.exercise);}
    function targets(kind,record){
      const rows=kind==='history'?[...(record?.prescription||[]),...(record?.exercises||[]).map(entry=>({exercise:entry.slot,selected:entry.exercise}))]:kind==='manual'?(c.performanceUI.getManual()?.exercises||[]).map(entry=>({exercise:entry.slot,selected:entry.exercise})):c.currentSession().items.map(item=>({exercise:item.exercise,selected:c.exerciseFor(item).id}));
      return [...new Map(rows.filter(row=>window.BOXING_DATA.exercises.some(ex=>ex.id===row.exercise)).map(row=>[row.exercise,{slot:row.exercise,name:name(row.selected)}])).values()];
    }
    function open(target={kind:'current'}){
      const state=c.getState();let rows,record=null;
      if(target.kind==='history'){record=state.sessionHistory[target.recordId];if(!record)return;rows=P().definitions(record.customizations);}
      else if(target.kind==='manual'){c.performanceUI.readManual();if(!c.performanceUI.getManual())return;rows=P().definitions(c.performanceUI.getManual().customizations);}
      else rows=additions();
      const old=rows.find(row=>row.slot===target.slot);
      draft={...target,old,slot:old?.slot||P().newSlot(),selection:old?.exercise||'__custom__',customName:old?.customName||'',section:old?.section||sectionFor(target.replaces),replaces:old?.replaces||target.replaces||'',equipment:old?.equipment||'',guideUrl:old?.guideUrl||'',guideExercise:old?.guideExercise||'',guideNotes:old?.guideNotes||'',targets:targets(target.kind,record)};
      show();
    }
    function show(){
      const catalogue=P().catalogue(c.getState());
      c.openModal(c.modalHeader('Customize exercise','Add exercise')+'<div class="modal-content"><p>Keep as an addition or choose which original exercise it replaces.</p><p>Choose a library movement for its existing illustrations and videos. For a custom movement, attach your own demonstration and notes.</p><label class="form-label" for="custom-selection">Choose from library</label><select class="panel-select" id="custom-selection"><option value="__custom__" '+(draft.selection==='__custom__'?'selected':'')+'>Custom exercise</option>'+catalogue.map(ex=>'<option '+(ex.custom?'data-no-i18n ':'')+'value="'+e(ex.id)+'" '+(draft.selection===ex.id?'selected':'')+'>'+e(ex.name)+'</option>').join('')+'</select><label class="form-label" for="custom-name">Exercise name</label><input class="panel-select" id="custom-name" maxlength="120" value="'+e(draft.customName)+'" data-no-i18n><div class="actual-options"><label><span>Exercise section</span><select class="panel-select" id="custom-section">'+P().sections.map(section=>'<option value="'+section+'" '+(draft.section===section?'selected':'')+'>'+e(P().sectionLabels[section])+'</option>').join('')+'</select></label><label><span>Replace an exercise</span><select class="panel-select" id="custom-replaces"><option value="">Add alongside</option>'+draft.targets.map(row=>'<option value="'+row.slot+'" '+(draft.replaces===row.slot?'selected':'')+'>'+e(row.name)+'</option>').join('')+'</select></label></div><label class="form-label" for="custom-equipment">Exercise equipment</label><input class="panel-select" id="custom-equipment" maxlength="250" value="'+e(draft.equipment)+'" data-no-i18n><label class="form-label" for="custom-guide">Technique reference (HTTPS, optional)</label><input class="panel-select" id="custom-guide" type="url" value="'+e(draft.guideUrl)+'" data-no-i18n><label class="form-label" for="custom-guide-exercise">Related guide (optional)</label><select class="panel-select" id="custom-guide-exercise"><option value="">No related guide</option>'+window.BOXING_DATA.exercises.map(ex=>'<option value="'+e(ex.id)+'" '+(draft.guideExercise===ex.id?'selected':'')+'>'+e(ex.name)+'</option>').join('')+'</select><label class="form-label" for="custom-guide-notes">Your setup and technique notes</label><textarea class="notes-field" id="custom-guide-notes" maxlength="2000" data-no-i18n>'+e(draft.guideNotes)+'</textarea><p class="session-day-note">Custom exercise details are your entries.</p><p>Custom notes and guide links are not automatic workout prescriptions.</p>'+(draft.kind==='history'?'<p>Adding to a saved session records the exercise as performed.</p>':'')+'<p id="custom-error" class="form-error" role="alert"></p><div class="history-actions"><button class="button button-ghost" '+(draft.kind==='manual'?'data-custom-back-manual':'data-close')+'>Cancel</button><button class="button button-primary" data-save-custom>Save exercise</button></div></div>','custom-exercise');
    }
    function read(){
      draft.selection=$('#custom-selection').value;draft.customName=$('#custom-name').value;draft.section=$('#custom-section').value;draft.replaces=$('#custom-replaces').value;draft.equipment=$('#custom-equipment').value;draft.guideUrl=$('#custom-guide').value;draft.guideExercise=$('#custom-guide-exercise')?.value||'';draft.guideNotes=$('#custom-guide-notes')?.value||'';
    }
    function save(){
      read();const state=c.getState(),chosen=P().catalogue(state).find(ex=>ex.id===draft.selection);
      const customName=(draft.selection==='__custom__'?draft.customName:chosen?.custom?chosen.name:'').trim().replace(/\s+/g,' ').slice(0,120);
      const exercise=draft.selection==='__custom__'?P().customId(customName):draft.selection;
      const input={slot:draft.slot,exercise,customName,section:draft.section,replaces:draft.replaces,equipment:draft.equipment,guideUrl:draft.guideUrl,guideExercise:draft.guideExercise,guideNotes:draft.guideNotes};
      let row=P().definition(input);
      if(row&&draft.kind==='manual'){
        const manual=c.performanceUI.getManual(),existing=P().definitions(manual.customizations);
        if(existing.some(item=>item.slot!==row.slot&&row.replaces&&item.replaces===row.replaces))row=null;
        else{manual.customizations=existing.some(item=>item.slot===row.slot)?existing.map(item=>item.slot===row.slot?row:item):[...existing,row];const previous=manual.exercises.find(entry=>entry.slot===row.slot);manual.exercises=previous?manual.exercises.map(entry=>entry.slot===row.slot?{...entry,exercise:row.exercise,customName:row.customName,section:row.section}:entry):[...manual.exercises,{slot:row.slot,exercise:row.exercise,customName:row.customName,section:row.section,performed:true,actual:null}];}
      }else if(row)row=draft.kind==='history'?P().addToRecord(state,draft.recordId,row):P().setAddition(state,c.sessionKey(),row);
      if(!row){$('#custom-error').textContent=t('Enter a name or choose a library exercise, a section, and a valid HTTPS reference if supplied.');return;}
      const target=draft.kind==='history'?{kind:'history',recordId:draft.recordId,slot:row.slot}:draft.kind==='manual'?{kind:'manual',slot:row.slot}:{kind:'addition',slot:row.slot};
      if(draft.kind!=='manual'){if(c.persist()===false){$('#custom-error').textContent=t('Changes could not be saved. Keep this page open and export a backup of your unsaved work.');return;}c.closeModal();c.render();c.performanceUI.openActual(target);}else{c.performanceUI.showManual();c.performanceUI.openActual(target);}draft=null;
    }
    function card(row){
      const state=c.getState(),record=state.logs[c.sessionKey()+':'+row.slot],known=window.BOXING_DATA.exercises.some(ex=>ex.id===row.exercise);
      return '<article class="exercise-card custom-exercise-card '+(record?'completed':'')+'" data-custom-card="'+e(row.slot)+'"><div class="card-top"><div class="exercise-main"><span class="category-tag">Your exercise</span> <span class="pill">'+e(P().sectionLabels[row.section])+'</span><h3 '+(row.customName?'data-no-i18n':'')+'>'+e(entryName(row))+'</h3>'+(row.replaces?'<p><span>Replaces</span>: '+e(name(row.replaces))+'</p>':'')+(row.equipment?'<p data-no-i18n>'+e(row.equipment)+'</p>':'')+'</div><label class="completion-control"><input type="checkbox" data-custom-complete="'+e(row.slot)+'" '+(record?'checked':'')+'><span>Done</span></label></div>'+c.performanceUI.actualHTML(record?.actual)+'<div class="card-actions"><button class="text-button" data-addition-actual="'+e(row.slot)+'">'+(record?.actual?'Edit actuals':'Record actuals')+'</button><button class="text-button" data-edit-session-addition="'+e(row.slot)+'">Customize exercise</button><button class="text-button" data-remove-session-addition="'+e(row.slot)+'">Remove added exercise</button>'+c.customGuideUI.button(row)+'</div></article>';
    }
    function section(slot){return additions().filter(row=>row.replaces===slot).map(card).join('');}
    function extras(){return additions().filter(row=>!row.replaces).sort((a,b)=>P().sections.indexOf(a.section)-P().sections.indexOf(b.section)).map(card).join('');}
    function list(items,renderer){
      const rows=additions(),shown=new Set(),sections=new Set();let html='';
      const add=row=>{if(!shown.has(row.slot)){html+=card(row);shown.add(row.slot);}};
      for(const [index,item] of items.entries()){
        const role=sectionFor(item.exercise);
        if(role==='cooldown')for(const row of rows.filter(row=>!row.replaces&&row.section!=='cooldown'))add(row);
        if(!sections.has(role)){for(const row of rows.filter(row=>!row.replaces&&row.section===role))add(row);sections.add(role);}
        const replacement=rows.find(row=>row.replaces===item.exercise);if(replacement)add(replacement);else html+=renderer(item,index);
      }
      for(const row of rows)add(row);return html;
    }
    function visibleCurrent(){const state=c.getState(),replacedSlots=new Set(additions().map(row=>row.replaces).filter(Boolean));return Object.entries(state.logs).filter(([key])=>key.startsWith(c.sessionKey()+':')&&!replacedSlots.has(key.slice(c.sessionKey().length+1)));}
    function click(data,button){
      if(button.hasAttribute('data-add-session-exercise')){open({kind:'current'});return true;}
      if(data.customizeOriginal){open({kind:'current',replaces:data.customizeOriginal});return true;}
      if(data.editSessionAddition){open({kind:'current',slot:data.editSessionAddition});return true;}
      if(data.addLogExercise){open({kind:'history',recordId:data.addLogExercise});return true;}
      if(data.editLogAddition){open({kind:'history',recordId:data.editLogAddition,slot:data.customSlot});return true;}
      if(button.hasAttribute('data-manual-custom')){open({kind:'manual'});return true;}
      if(data.customizeManual){open({kind:'manual',replaces:data.customizeManual});return true;}
      if(data.editManualAddition){open({kind:'manual',slot:data.editManualAddition});return true;}
      if(button.hasAttribute('data-custom-back-manual')){c.performanceUI.showManual();return true;}
      if(button.hasAttribute('data-save-custom')){if(draft)save();return true;}
      if(data.additionActual){c.performanceUI.openActual({kind:'addition',slot:data.additionActual});return true;}
      if(data.removeSessionAddition){const state=c.getState(),key=c.sessionKey(),slot=data.removeSessionAddition;if(!window.confirm(t('Remove this added exercise and its recorded values? The original exercise is restored. Earlier sessions stay saved.')))return true;state.sessionAdditions={...state.sessionAdditions,[key]:additions().filter(row=>row.slot!==slot)};state.logs={...state.logs};delete state.logs[key+':'+slot];c.persist();c.render();return true;}
      return false;
    }
    function change(target){
      if(target.id==='custom-selection'&&draft){read();const chosen=P().catalogue(c.getState()).find(ex=>ex.id===draft.selection);draft.customName=chosen?.custom?chosen.name:'';show();return true;}
      if(target.dataset?.customComplete){const state=c.getState(),key=c.sessionKey()+':'+target.dataset.customComplete,row=additions().find(row=>row.slot===target.dataset.customComplete);if(!row)return true;if(target.checked){if(!state.logs[key])state.logs={...state.logs,[key]:{exercise:row.exercise,at:new Date().toISOString(),settings:null,dose:{},actual:null}};}else{if(state.logs[key]?.actual&&!window.confirm(t('Remove this completion and its recorded actuals? Earlier sessions stay saved.'))){c.render();return true;}state.logs={...state.logs};delete state.logs[key];}c.persist();c.render();return true;}
      return false;
    }
    return {open,click,change,additions,replaced,card,section,extras,list,visibleCurrent};
  }
  const pairs=[
    ['Add exercise','Añadir ejercicio'],['Customize exercise','Personalizar ejercicio'],['Exercise section','Sección del ejercicio'],['Exercise name','Nombre del ejercicio'],['Custom exercise','Ejercicio personalizado'],['Choose from library','Elegir de la biblioteca'],['Exercise equipment','Equipo del ejercicio'],['Technique reference (HTTPS, optional)','Referencia de técnica (HTTPS, opcional)'],['Add alongside','Añadir junto a los otros'],['Replace an exercise','Sustituir un ejercicio'],['Save exercise','Guardar ejercicio'],['Your exercise','Tu ejercicio'],['Your additions','Tus ejercicios añadidos'],
    ['Your additions are not included in the planner’s time estimate.','Tus ejercicios añadidos no se incluyen en el tiempo estimado del plan.'],['Replaced in this session','Sustituido en esta sesión'],['Original details are retained below.','Los detalles originales se conservan abajo.'],['Remove added exercise','Quitar ejercicio añadido'],
    ['Remove this added exercise and its recorded values? The original exercise is restored. Earlier sessions stay saved.','¿Quitar este ejercicio añadido y sus valores registrados? Se restaura el ejercicio original. Se conservan las sesiones anteriores.'],
    ['Enter a name or choose a library exercise, a section, and a valid HTTPS reference if supplied.','Introduce un nombre o elige un ejercicio de la biblioteca, una sección y una referencia HTTPS válida si la incluyes.'],
    ['Time performed','Tiempo realizado'],['Time unit','Unidad de tiempo'],['Seconds','Segundos'],['Minutes','Minutos'],['Distance performed','Distancia realizada'],['Distance unit','Unidad de distancia'],['Metres','Metros'],['Yards','Yardas'],['Custom exercise details are your entries.','Los detalles del ejercicio personalizado son tus registros.'],['Your reference link','Tu enlace de referencia'],['Conditioning / aerobic','Acondicionamiento / aeróbico'],['Core / trunk','Abdominales / tronco'],['Other work','Otro trabajo'],
    ['Adding to a saved session records the exercise as performed.','Añadir a una sesión guardada registra el ejercicio como realizado.'],['Keep as an addition or choose which original exercise it replaces.','Déjalo como añadido o elige el ejercicio original que sustituye.'],['Replaces','Sustituye']
  ];
  for(const [en,es] of pairs)window.ROUNDWORK_ES[en]=es;
  window.ROUNDWORK_CUSTOMIZATION_TEXT=pairs.map(pair=>pair[0]);
  return {create,sectionFor};
})();
