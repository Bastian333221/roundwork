/* Evidence-informed programming rules, not a clinically validated prescription engine. */
window.RoundworkPlanner = (() => {
  'use strict';
  const levels=['rookie','intermediate','advanced'];
  const times=[30,45,60,75,90,105,120];
  const defaults={mon:105,tue:60,wed:75,thu:60,fri:30,sat:60,sun:30};
  const cleanChoice=(x={},day='mon')=>({level:levels.includes(x?.level)?x.level:'intermediate',minutes:times.includes(x?.minutes)?x.minutes:(defaults[day]||60),progressionReady:x?.progressionReady===true});
  function cleanSettings(settings) {
    const out={};
    if(!settings||typeof settings!=='object'||Array.isArray(settings))return out;
    for(const [key,value] of Object.entries(settings))if(/^[1-8]:(mon|tue|wed|thu|fri|sat|sun)$/.test(key))out[key]=cleanChoice(value,key.split(':')[1]);
    return out;
  }
  const workSeconds=(dose,ex)=>{
    if(dose.skip)return 0;
    const sides=/each (side|leg)/.test(dose.reps||'')?2:1;
    if(dose.seconds)return Number(dose.seconds)*sides;
    const n=Number((String(dose.reps).match(/\d+(?:[–-]\d+)?/)||['8'])[0].split(/[–-]/).pop());
    return n*sides*(ex.id==='sled'?3:ex.category==='Power'?8:4);
  };
  function estimate(items) {
    // Rest after every displayed set plus setup/transition time; allow two minutes for checking the plan.
    return 120+items.reduce((sum,item)=>{
      const d=item.adaptedDose,ex=item.selectedExercise;
      if(d.skip)return sum;
      const setup=['sled','ropes','rotation','chestThrow'].includes(ex.id)?90:60;
      return sum+setup+Number(d.sets||1)*(workSeconds(d,ex)+Number(d.rest||0));
    },0);
  }
  function plan(day,choice,context,resolve,doseFor,exerciseById) {
    choice=cleanChoice(choice,day.id);
    if(['thu','sat'].includes(day.id))return {kind:'coach',items:day.items,minutes:60,choice,notes:[choice.minutes<60?'Coaching is scheduled for 45–60 minutes. Arrange a shorter session with your coach; the app does not shorten sparring or coaching.':'Follow your coach’s session. Extra available time does not add sparring or hard conditioning.']};
    if(['fri','sun'].includes(day.id))return {kind:'rest',items:day.items,minutes:0,choice,notes:['Keep this a recovery day. An optional comfortable 10–20-minute walk is enough; the time selector does not create a hard workout.']};
    const {level,minutes}=choice;
    const tired=context.readiness==='tired',hard=context.coachLoad!=='technical'||tired;
    const rookie=level==='rookie',advanced=level==='advanced';
    const items=[],removed=[];
    const add=(item,ex,d)=>items.push({...item,selectedExercise:ex,adaptedDose:d});
    const notes=[rookie?'Rookie: learn stable bodyweight movements and relaxed coach-taught shadowboxing. No jumps, throws or hard rope/sled intervals.':advanced?'Advanced: familiar movements, controlled strength effort, and fully rested power sets. No maximal lifts, depth jumps or all-out intervals.':'Intermediate: familiar jumps and throws, controlled strength sets, and repeatable conditioning when recovered.'];
    notes.push('Time is a ceiling, not a target. Shorter sessions reduce volume; rest and warm-up are preserved. Stop when technique or speed falls.');
    if(!choice.progressionReady&&context.week>2)notes.push('Starting-week volume is held until you confirm good recovery and movement quality for progression.');
    for(const source of day.items){
      const item={...source};
      let ex=resolve(item.exercise),d={...doseFor(item,ex)};
      if(!ex)continue;
      const category=ex.category;
      if(rookie&&category==='Power'){removed.push(item.exercise);continue;}
      if(rookie){
        const bandsReady=['bands','bandAnchor','floor'].every(id=>context.equipment?.[id]==='yes');
        const simpler={squat:'splitSquat',press:'pushup',hinge:'bridge',lunge:'splitSquat',pallof:'deadbug',sidePlank:'deadbug',row:bandsReady?'bandRow':null}[item.exercise];
        if(simpler&&!window.RoundworkChoices?.validSelection(item.exercise,context.swaps?.[`${context.week}:${day.id}:${item.exercise}`],level)){ex=exerciseById(simpler);d={...doseFor(item,ex)};}
      }
      if(item.exercise==='warmup'){d={...d,sets:1,seconds:480,reps:'8 minutes',rest:0};}
      else if(item.exercise==='cooldown'){d={...d,sets:1,seconds:180,reps:'3 minutes',rest:0};}
      else if(category==='Power'){
        d.sets=tired?2:advanced?4:3;d.rest=180;
        d.notes='Reset each repetition. Rest 180 seconds after each set; stop if speed or landing quality declines.';
      }else if(['Strength','Trunk control'].includes(ex.category)){
        if(ex.category==='Strength'){
          d.sets=rookie?2:advanced?Math.min(3,Number(d.sets||2)+1):Number(d.sets||2);
          d.rest=advanced?180:120;
          if(rookie){d.reps=/each (side|leg)/.test(d.reps)?'6 each side':ex.id==='bridge'?'10 reps':'8 reps';d.seconds=null;}
          d.notes=rookie?'Use an easy, controlled load or bodyweight. Leave at least 4 good repetitions in reserve.':advanced?'Use a familiar load; leave 2–3 good repetitions in reserve. No grinding or automatic weight increase.':'Use a familiar load; leave 3 good repetitions in reserve. No grinding or automatic weight increase.';
        }else{d.sets=2;d.rest=60;if(['sidePlank','kneeSidePlank','frontPlank','suitcaseCarry'].includes(ex.id)){d.seconds=rookie?15:advanced?25:20;d.reps=ex.id==='frontPlank'?`${d.seconds} seconds`:`${d.seconds} seconds each side`;}else{d.reps=rookie?'6 each side':'8 each side';d.seconds=null;}d.notes='Move slowly and breathe normally. Stop before position deteriorates.';}
        if(tired)d.sets=Math.max(1,d.sets-1);
      }else if(item.exercise==='shadow'){
        d={...d,sets:tired?2:rookie?2:advanced?4:3,seconds:rookie?60:120,reps:rookie?'1-minute round':'2-minute round',rest:60,notes:'Relaxed coach-taught footwork and combinations. Keep balance; this is technique practice, not a maximal punching circuit.'};
      }else if(item.exercise==='bike'){
        const cap=tired?15:rookie?25:advanced?45:35;
        const target=minutes>=90?cap:Math.min(cap,Number(d.seconds||1200)/60);
        d={...d,sets:1,seconds:target*60,reps:`${target} minutes`,rest:0,notes:'Conversational pace, about 3–5/10 effort. Slow down if you cannot speak comfortably.'};
      }
      // Equipment substitutions remain strength slots; never attach interval timing to a step-up or squat.
      if(item.conditioning){
        const isInterval=['ropes','bikeIntervals','marchIntervals'].includes(ex.id),isSled=ex.id==='sled';
        if(rookie&&(isInterval||isSled)){
          d={...d,sets:2,rest:isSled?90:60,reps:isSled?'10 metres · easy load':ex.id==='ropes'?'10 seconds · easy waves':ex.id==='bikeIntervals'?'10 seconds · easy pedalling':'10 seconds · easy marching',seconds:isSled?null:10,gated:true,skip:tired,notes:'Easy familiarisation only, about 4/10 effort. Skip if fatigued.'};
        }else if(!hard&&!rookie){
          if(isSled){d.sets=advanced?5:Number(d.sets);d.rest=120;d.notes='Repeatable 7/10 effort. No grinding or sprints; friction changes load.';}
          if(isInterval){d.sets=advanced?8:Number(d.sets);d.seconds=20;d.reps='20 seconds work';d.rest=advanced?60:40;d.notes=advanced?'Repeatable 7–8/10 effort, 60 seconds easy recovery. Never all-out.':'Repeatable 7/10 effort, 40 seconds easy recovery. Never all-out.';}
        }
        if(tired){d.skip=true;d.gated=true;d.notes='Skip this conditioning slot when tired. Recover for coached boxing.';}
      }
      if(rookie&&item.exercise==='sidePlank'&&items.some(x=>x.selectedExercise.id==='deadbug'))continue;
      if(items.some(x=>x.selectedExercise.id===ex.id)){removed.push(item.exercise);continue;}
      d.planned={...d};
      add(item,ex,d);
    }
    if(rookie&&day.id!=='tue'&&!items.some(x=>x.exercise==='shadow')){
      const ex=exerciseById('shadow');
      items.splice(1,0,{exercise:'shadow',selectedExercise:ex,adaptedDose:{sets:2,reps:'1-minute round',seconds:60,rest:60,notes:'Relaxed coach-taught stance and footwork; keep balance.',skip:false,gated:false}});
    }
    const over=()=>estimate(items)>minutes*60;
    const remove=item=>{removed.push(item.exercise);items.splice(items.indexOf(item),1);};
    // First shorten easy cardio. Then reduce optional slots; never compress rests to fit.
    const cardio=items.find(x=>x.exercise==='bike');
    if(cardio)while(over()&&cardio.adaptedDose.seconds>300){cardio.adaptedDose.seconds-=60;cardio.adaptedDose.reps=`${cardio.adaptedDose.seconds/60} minutes`;}
    for(const item of [...items].filter(x=>x.selectedExercise.category==='Trunk control'))if(over())remove(item);
    const powers=items.filter(x=>x.selectedExercise.category==='Power');
    if(powers.length>1&&over())remove(powers[0]);
    for(const item of items.filter(x=>x.conditioning)){
      while(over()&&item.adaptedDose.sets>2)item.adaptedDose.sets--;
      if(over())remove(item);
    }
    for(const item of items.filter(x=>['Strength','Power','Technique'].includes(x.selectedExercise.category))){
      const min=item.selectedExercise.category==='Power'?2:1;
      while(over()&&item.adaptedDose.sets>min)item.adaptedDose.sets--;
    }
    if(cardio&&items.includes(cardio)&&over())remove(cardio);
    const secondaryLeg=items.find(x=>x.exercise==='lunge');
    if(secondaryLeg&&over())remove(secondaryLeg);
    for(const item of [...items].filter(x=>x.selectedExercise.category==='Power'))if(over())remove(item);
    // This final trim is only for exceptional long substitutions at the minimum budget.
    for(const item of [...items].filter(x=>x.exercise==='shadow'))if(over()&&day.id!=='tue')remove(item);
    if(over())throw Error('Session cannot fit with protected warm-up and recovery.');
    if(removed.length)notes.push('Some optional exercises or sets were removed to fit your time. Do not add them back as a finisher.');
    notes.push('Estimates include displayed rests, setup and transitions. Gym queues and learning a movement can take longer; finish with the cooldown when your time is up.');
    return {kind:'gym',items,minutes:Math.ceil(estimate(items)/60),choice,removed,notes};
  }
  return {levels,times,defaults,cleanChoice,cleanSettings,plan,estimate};
})();
