window.RoundworkPerformanceUI=(()=>{
  'use strict';
  function create(c){
    const P=window.RoundworkPerformance,D=window.BOXING_DATA,e=c.esc,$=selector=>document.querySelector(selector),t=value=>window.RoundworkI18n?.translate(value)||value;
    let editor=null,manual=null,comparison='';
    const copy=value=>JSON.parse(JSON.stringify(value));
    const name=id=>P.catalogue(c.getState()).find(ex=>ex.id===id)?.name||id;
    const val=value=>value===null||value===undefined?'':value;
    const dateHTML=record=>record.performedDate?'<span>Performed on</span>: <span data-no-i18n>'+e(P.dateLabel(record.performedDate,window.RoundworkI18n?.language))+'</span>':'<span>Recorded on</span>: '+c.historyTime(record.firstRecordedAt);
    function actualHTML(value){
      const actual=P.actual(value);if(!actual)return '<p class="actual-empty"><span>Actual work performed</span>: <span>Not recorded</span></p>';
      return '<div class="actual-summary"><strong>Actual work performed</strong><p>'+e(P.loadLabels[actual.loadType])+'</p>'+(actual.sets.length?'<ol>'+actual.sets.map(row=>'<li>'+(row.weight!==null?e(row.weight)+' '+e(actual.unit):['bodyweight','unquantified'].includes(actual.loadType)?'<span>'+e(P.loadLabels[actual.loadType])+'</span>':'<span>Weight</span>: <span>Not recorded</span>')+' · <span>Repetitions</span>: '+(row.reps!==null?e(row.reps):'<span>Not recorded</span>')+'</li>').join('')+'</ol>':'<p>Sets not recorded</p>')+(actual.time?'<p><span>Time performed</span>: '+actual.time.value+' <span>'+(actual.time.unit==='min'?'Minutes':'Seconds')+'</span></p>':'')+(actual.distance?'<p><span>Distance performed</span>: '+actual.distance.value+' <span>'+(actual.distance.unit==='yd'?'Yards':'Metres')+'</span></p>':'')+(actual.notes?'<p data-no-i18n>'+e(actual.notes)+'</p>':'')+'</div>';
    }
    function button(slot,recordId){const state=c.getState(),value=recordId?state.sessionHistory[recordId]?.exercises.find(entry=>entry.slot===slot)?.actual:state.logs[c.logKey(state.day,slot)]?.actual;return '<button class="text-button" '+(recordId?'data-history-actual="'+e(recordId)+'" data-actual-slot="'+e(slot)+'"':'data-current-actual="'+e(slot)+'"')+'>'+(value?'Edit actuals':'Record actuals')+'</button>';}
    function readEditor(){
      if(!editor)return;
      const a=editor.actual;
      a.loadType=$('#actual-load-type')?.value||a.loadType;a.unit=$('#actual-unit')?.value||a.unit;
      a.sets=[...document.querySelectorAll('[data-actual-row]')].map(row=>({weight:row.querySelector('[data-set-weight]')?.value??'',reps:row.querySelector('[data-set-reps]')?.value??''}));
      a.time={value:$('#actual-seconds')?.value??'',unit:$('#actual-time-unit')?.value||'s'};a.distance={value:$('#actual-metres')?.value??'',unit:$('#actual-distance-unit')?.value||'m'};a.notes=$('#actual-notes')?.value||'';
    }
    function showEditor(){
      const a=editor.actual,weighted=!['bodyweight','unquantified'].includes(a.loadType);
      c.openModal(c.modalHeader('Actual work performed',editor.name||name(editor.exercise)).replace('<h2 id="modal-title">', '<h2 '+(editor.exercise.startsWith('user:')?'data-no-i18n ':'')+'id="modal-title">')+'<div class="modal-content"><p>Leave unknown values blank. Enter the work you actually performed; prescribed numbers are not filled in for you.</p><div class="actual-options"><label><span>Load basis</span><select class="panel-select" id="actual-load-type">'+P.loadTypes.map(type=>'<option value="'+type+'" '+(type===a.loadType?'selected':'')+'>'+e(P.loadLabels[type])+'</option>').join('')+'</select></label><label><span>Weight unit</span><select class="panel-select" id="actual-unit"><option value="kg" '+(a.unit==='kg'?'selected':'')+'>kg</option><option value="lb" '+(a.unit==='lb'?'selected':'')+'>lb</option></select></label></div><div class="actual-table"><div class="actual-row actual-table-head"><span>Set</span><span>Weight</span><span>Repetitions</span><span></span></div>'+a.sets.map((row,index)=>'<div class="actual-row" data-actual-row><span>'+(index+1)+'</span><input class="actual-number" type="number" min="0" step="any" inputmode="decimal" data-set-weight aria-label="Weight" value="'+e(val(row.weight))+'" '+(weighted?'':'disabled')+'><input class="actual-number" type="number" min="0" step="1" inputmode="numeric" data-set-reps aria-label="Repetitions" value="'+e(val(row.reps))+'"><button class="icon-button" data-remove-set="'+index+'" aria-label="Remove set">×</button></div>').join('')+'</div><button class="text-button" data-add-set>Add set</button><div class="actual-options"><label><span>Time performed</span><input class="panel-select" type="number" min="0" step="any" id="actual-seconds" value="'+e(val(a.time?.value??a.seconds))+'"></label><label><span>Time unit</span><select class="panel-select" id="actual-time-unit"><option value="s" '+(a.time?.unit!=='min'?'selected':'')+'>Seconds</option><option value="min" '+(a.time?.unit==='min'?'selected':'')+'>Minutes</option></select></label><label><span>Distance performed</span><input class="panel-select" type="number" min="0" step="any" id="actual-metres" value="'+e(val(a.distance?.value??a.metres))+'"></label><label><span>Distance unit</span><select class="panel-select" id="actual-distance-unit"><option value="m" '+(a.distance?.unit!=='yd'?'selected':'')+'>Metres</option><option value="yd" '+(a.distance?.unit==='yd'?'selected':'')+'>Yards</option></select></label></div><label class="form-label" for="actual-notes">Equipment / performance notes</label><textarea class="notes-field" id="actual-notes" data-no-i18n>'+e(a.notes||'')+'</textarea><p id="actual-error" class="form-error" role="alert"></p><p class="session-day-note">Saving records this exercise as performed. It does not confirm equipment or change the workout prescription.</p><div class="history-actions"><button class="button button-ghost" '+(editor.kind==='manual'?'data-back-manual':'data-close')+'>'+(editor.kind==='manual'?'Back to past session':'Cancel')+'</button><button class="button button-primary" data-save-actual>Save performed exercise</button></div></div>','actual-editor');
    }
    function openActual(target){
      let existing=null,exercise,displayName;
      if(target.kind==='current'){
        const item=c.currentSession().items.find(item=>item.exercise===target.slot);if(!item)return;
        exercise=c.exerciseFor(item).id;existing=c.getState().logs[c.logKey(c.getState().day,target.slot)]?.actual;
      }else if(target.kind==='addition'){
        const state=c.getState(),row=P.definitions(state.sessionAdditions?.[state.week+':'+state.day]).find(row=>row.slot===target.slot);if(!row)return;exercise=row.exercise;displayName=row.customName;existing=state.logs[c.logKey(state.day,target.slot)]?.actual;
      }else if(target.kind==='history'){
        const record=c.getState().sessionHistory[target.recordId],entry=record?.exercises.find(entry=>entry.slot===target.slot)||record?.customizations?.find(row=>row.slot===target.slot);if(!entry)return;
        exercise=entry.exercise;displayName=entry.customName;existing=entry.actual;
      }else{
        readManual();const entry=manual?.exercises.find(entry=>entry.slot===target.slot);if(!entry)return;
        exercise=entry.exercise;displayName=entry.customName||manual.customizations?.find(row=>row.slot===target.slot)?.customName;existing=entry.actual;
      }
      editor={...target,exercise,name:displayName,actual:existing?copy(existing):{loadType:'total',unit:'kg',sets:[{weight:null,reps:null}],seconds:null,metres:null,notes:''}};
      if(!editor.actual.sets.length)editor.actual.sets=[{weight:null,reps:null}];showEditor();
    }
    function saveActual(){
      readEditor();const validInputs=[...document.querySelectorAll('#modal-root input[type="number"]')].every(input=>!input.validity||input.validity.valid);const actual=validInputs?P.actual(editor.actual):null;
      if(!actual){$('#actual-error').textContent=t('Use non-negative numbers, whole repetitions, and at least one performed value or note.');return;}
      const state=c.getState(),now=new Date().toISOString();
      if(editor.kind==='manual'){
        manual.exercises=manual.exercises.map(entry=>entry.slot===editor.slot?{...entry,performed:true,actual}:entry);editor=null;showManual();return;
      }
      if(editor.kind==='current'){
        const item=c.currentSession().items.find(item=>item.exercise===editor.slot);if(!item||c.exerciseFor(item).id!==editor.exercise)return;
        const key=c.logKey(state.day,editor.slot),old=state.logs[key];
        state.logs={...state.logs,[key]:{exercise:editor.exercise,at:old?.at||now,settings:old?.settings||c.sessionChoice(),dose:old?.dose||c.getDose(item,c.exerciseFor(item)),actual}};
      }else if(editor.kind==='addition'){
        const definition=P.definitions(state.sessionAdditions?.[state.week+':'+state.day]).find(row=>row.slot===editor.slot&&row.exercise===editor.exercise);if(!definition)return;const key=c.logKey(state.day,editor.slot),old=state.logs[key];state.logs={...state.logs,[key]:{exercise:editor.exercise,at:old?.at||now,settings:null,dose:{},actual}};
      }else{
        const record=state.sessionHistory[editor.recordId];if(!record)return;
        state.sessionHistory={...state.sessionHistory,[record.id]:{...record,updatedAt:now,exercises:record.exercises.some(entry=>entry.slot===editor.slot)?record.exercises.map(entry=>entry.slot===editor.slot?{...entry,actual}:entry):[...record.exercises,{slot:editor.slot,exercise:editor.exercise,customName:editor.name||'',section:record.customizations?.find(row=>row.slot===editor.slot)?.section||null,at:now,settings:null,dose:{},actual}]}};
        const prefix=record.week+':'+record.routine,key=prefix+':'+editor.slot;
        if(state.activeSessions[prefix]===record.id&&(!state.logs[key]||state.logs[key].exercise===editor.exercise))state.logs={...state.logs,[key]:{exercise:editor.exercise,at:now,settings:null,dose:{},...state.logs[key],actual}};
      }
      c.persist();c.closeModal();c.render();c.toast('Actual work saved.');editor=null;
    }
    function routineOptions(){
      return D.days.map(day=>({id:day.id,title:window.RoundworkSchedule.routine(day,{week:2,recoveryDays:{}}).title})).concat({id:'recovery',title:'Recovery'});
    }
    function readManual(){
      if(!manual||!$('#manual-week'))return;
      manual.week=Number($('#manual-week').value);manual.selection=$('#manual-routine').value;manual.performedDate=$('#manual-date').value;
      for(const entry of manual.exercises){const row=$('[data-manual-slot="'+entry.slot+'"]');if(!row)continue;entry.performed=!!row.querySelector('[data-manual-performed]')?.checked;}
    }
    function openManual(recordId){
      const record=recordId?c.getState().sessionHistory[recordId]:null;if(recordId&&record?.source!=='manual')return;
      manual={id:record?.id,week:record?.week||c.getLogWeek(),selection:record?(record.title==='Recovery'?'recovery':record.routine):'',performedDate:record?.performedDate||'',customizations:record?copy(record.customizations||[]):[],exercises:record?record.exercises.map(entry=>({slot:entry.slot,exercise:entry.exercise,customName:entry.customName,section:entry.section,performed:true,actual:entry.actual})):[]};showManual();
    }
    function showManual(){
      c.openModal(c.modalHeader('Manual entry','Log a completed workout')+'<div class="modal-content"><p>Mark only the exercises you remember performing. Unknown weights and repetitions can stay blank. This does not change your current schedule or session.</p><div class="actual-options"><label><span>Training week</span><select class="panel-select" id="manual-week">'+Array.from({length:8},(_,index)=>'<option value="'+(index+1)+'" '+(manual.week===index+1?'selected':'')+'>Week '+(index+1)+'</option>').join('')+'</select></label><label><span>Date performed</span><input class="panel-select" type="date" id="manual-date" max="'+P.today()+'" value="'+e(manual.performedDate)+'" required></label></div><label class="form-label" for="manual-routine">Routine performed</label><select class="panel-select" id="manual-routine"><option value="">Choose a routine</option>'+routineOptions().map(option=>'<option value="'+option.id+'" '+(manual.selection===option.id?'selected':'')+'>'+e(option.title)+'</option>').join('')+'</select><p class="session-day-note">Changing the routine keeps exercises you have already marked or entered.</p><div class="manual-exercises">'+manual.exercises.map(entry=>{const custom=manual.customizations?.find(row=>row.slot===entry.slot),options=custom?[{id:entry.exercise,name:custom.customName||name(entry.exercise)}]:entry.slot.startsWith('extra-')?D.exercises:window.RoundworkChoices.options(entry.slot);return '<section class="manual-exercise" data-manual-slot="'+e(entry.slot)+'"><label class="manual-performed"><input type="checkbox" data-manual-performed '+(entry.performed?'checked':'')+'><span>Performed</span></label><select class="panel-select" data-manual-movement="'+e(entry.slot)+'" aria-label="Choose an exercise">'+options.map(ex=>'<option '+(custom?.customName?'data-no-i18n ':'')+'value="'+e(ex.id)+'" '+(entry.exercise===ex.id?'selected':'')+'>'+e(ex.name)+'</option>').join('')+'</select>'+actualHTML(entry.actual)+'<button class="text-button" data-manual-actual="'+e(entry.slot)+'">'+(entry.actual?'Edit actuals':'Record actuals')+'</button> <button class="text-button" '+(custom?'data-edit-manual-addition':'data-customize-manual')+'="'+e(entry.slot)+'">Customize exercise</button></section>';}).join('')+'</div>'+(manual.selection?'<button class="button button-ghost" data-manual-custom>Add exercise</button><label class="form-label" for="manual-extra">Add another exercise</label><select class="panel-select" id="manual-extra"><option value="">Choose an exercise</option>'+D.exercises.filter(ex=>!manual.exercises.some(entry=>entry.exercise===ex.id)).map(ex=>'<option value="'+e(ex.id)+'">'+e(ex.name)+'</option>').join('')+'</select><button class="text-button" data-manual-add>Add another exercise</button>':'')+'<p id="manual-error" class="form-error" role="alert"></p><div class="history-actions"><button class="button button-ghost" data-close>Cancel</button><button class="button button-primary" data-save-manual>'+(manual.id?'Save changes':'Save past session')+'</button></div></div>','manual-session');
    }
    function saveManual(){
      readManual();const state=c.getState(),record=P.addManual(state,{...manual,routine:manual.selection==='recovery'?'fri':manual.selection,recovery:manual.selection==='recovery'});
      if(!record){$('#manual-error').textContent=t('Choose a routine and a valid date no later than today. Each performed exercise must appear only once.');return;}
      c.persist();c.closeModal();c.setLogWeek(String(record.week));c.showLog();c.toast('Past session saved in Log.');manual=null;
    }
    function comparisonHTML(records){
      const ids=[...new Set(records.flatMap(record=>window.RoundworkHistory.visibleExercises(record).filter(entry=>entry.actual).map(entry=>entry.exercise)))];
      if(!ids.includes(comparison))comparison='';
      const rows=comparison?P.comparisons(records,comparison):[];
      return '<section class="comparison-panel"><h2>Compare across sessions</h2><p>Compare the same exercise variation, equipment and load basis. Entries are self-reported; the app does not estimate strength gains or increase your training load.</p><label class="form-label" for="compare-exercise">Compare exercise</label><select class="panel-select" id="compare-exercise"><option value="">Choose an exercise</option>'+ids.map(id=>'<option '+(id.startsWith('user:')?'data-no-i18n ':'')+'value="'+e(id)+'" '+(id===comparison?'selected':'')+'>'+e(name(id))+'</option>').join('')+'</select>'+(!ids.length?'<p>Record actuals on an exercise to compare it here.</p>':'')+(rows.length?'<div class="comparison-scroll"><table class="comparison-table"><thead><tr><th>Date performed</th><th>Routine</th><th>Actual sets and repetitions</th></tr></thead><tbody>'+rows.map(({record,entry})=>'<tr><td>'+dateHTML(record)+'</td><td>'+e(record.title)+'</td><td>'+actualHTML(entry.actual)+'</td></tr>').join('')+'</tbody></table></div>':'')+'</section>';
    }
    function click(data,button){
      if(data.currentActual){openActual({kind:'current',slot:data.currentActual});return true;}
      if(data.historyActual){openActual({kind:'history',slot:data.actualSlot,recordId:data.historyActual});return true;}
      if(data.manualActual){openActual({kind:'manual',slot:data.manualActual});return true;}
      if(button.hasAttribute('data-save-actual')){if(editor)saveActual();return true;}
      if(button.hasAttribute('data-add-set')){if(editor){readEditor();if(editor.actual.sets.length<100)editor.actual.sets.push({weight:null,reps:null});showEditor();}return true;}
      if(Object.hasOwn(data,'removeSet')){if(editor){readEditor();editor.actual.sets.splice(Number(data.removeSet),1);showEditor();}return true;}
      if(button.hasAttribute('data-back-manual')){editor=null;showManual();return true;}
      if(button.hasAttribute('data-add-past')){openManual();return true;}
      if(data.editManual){openManual(data.editManual);return true;}
      if(button.hasAttribute('data-save-manual')){if(manual)saveManual();return true;}
      if(button.hasAttribute('data-manual-add')){readManual();const exercise=$('#manual-extra')?.value;if(exercise){let index=1;while(manual.exercises.some(entry=>entry.slot==='extra-'+index))index++;manual.exercises.push({slot:'extra-'+index,exercise,performed:true,actual:null});showManual();}return true;}
      return false;
    }
    function change(target){
      if(['actual-load-type','actual-unit','actual-time-unit','actual-distance-unit'].includes(target.id)&&editor){readEditor();showEditor();return true;}
      if(target.id==='manual-routine'&&manual){readManual();if(!manual.exercises.some(entry=>entry.performed||entry.actual)&&manual.selection){const day=D.days.find(day=>day.id===(manual.selection==='recovery'?'fri':manual.selection)),routine=window.RoundworkSchedule.routine(day,{week:2,recoveryDays:manual.selection==='recovery'?{'2:fri':true}:{}});manual.exercises=routine.items.map(item=>({slot:item.exercise,exercise:item.exercise,performed:false,actual:null}));}showManual();return true;}
      if(target.dataset?.manualMovement&&manual){readManual();manual.exercises=manual.exercises.map(entry=>entry.slot===target.dataset.manualMovement?{...entry,exercise:target.value,actual:null}:entry);showManual();return true;}
      if(target.id==='compare-exercise'){comparison=target.value;c.render();return true;}
      return false;
    }
    return {actualHTML,button,dateHTML,comparisonHTML,click,change,openActual,openManual,readManual,showManual,getManual:()=>manual};
  }
  return {create};
})();
