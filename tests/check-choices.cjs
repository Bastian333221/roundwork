const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const base=path.join(__dirname,'..');let checks=0,plans=0;const ok=(v,msg)=>{assert(v,msg);checks++};
const noop=()=>{},elements=new Map();const get=key=>{if(!elements.has(key))elements.set(key,{addEventListener:noop,classList:{add:noop,remove:noop,toggle:noop},setAttribute:noop,focus:noop,textContent:'',innerHTML:'',hidden:false});return elements.get(key);};
const events={},saved={};const document={body:{style:{}},getElementById:get,querySelector:get,querySelectorAll:()=>[],addEventListener:(name,handler)=>events[name]=handler};
const ctx={window:{scrollTo:noop},document,localStorage:{getItem:()=>null,setItem:(key,value)=>saved[key]=value},location:{hash:''},history:{replaceState:noop},setInterval:noop,clearInterval:noop,setTimeout:noop,clearTimeout:noop,console,URL,Date,Map,Set,navigator:{}};
vm.createContext(ctx);for(const f of ['data.js','es.js','es-ui.js','evidence.js','videos.js','planner.js','planner-ui.js','choices.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx);
let app=fs.readFileSync(path.join(base,'app.js'),'utf8').replace(/  render\(\);\s*\}\)\(\);\s*$/,'  window.test={getDose,currentSession,sessionOptions,exerciseCard,renderSession,movementMenu,chooseMovement,getState:()=>state,setState:s=>{state={...baseState,...s}}};\n})();');vm.runInContext(app,ctx);
const D=ctx.window.BOXING_DATA,P=ctx.window.RoundworkPlanner,T=ctx.window.test,before=JSON.stringify(D);
const allYes=Object.fromEntries(D.equipment.map(e=>[e.id,'yes']));
const gearCases=[allYes,{},Object.fromEntries(D.equipment.map(e=>[e.id,'no'])),{floor:'yes',mat:'yes',bands:'yes',bandAnchor:'yes',ropes:'no',sled:'no',step:'no',dumbbells:'no',bench:'no',cable:'no',pulldown:'no',bike:'yes'}];
for(const week of [2,4,6,8])for(const day of ['mon','tue','wed'])for(const level of P.levels)for(const minutes of P.times)for(const coachLoad of ['unknown','technical','hard'])for(const readiness of ['normal','tired'])for(const equipment of gearCases){
  const choice={level,minutes,progressionReady:true};T.setState({week,day,coachLoad,readiness,equipment,sessionSettings:{[week+':'+day]:choice}});const p=T.currentSession();plans++;
  const label=JSON.stringify({week,day,level,minutes,coachLoad,readiness,equipment});
  ok(p.minutes<=minutes,'Budget overflow '+label);ok(p.items[0].exercise==='warmup'&&p.items[0].adaptedDose.seconds>=480,'Warm-up protected '+label);ok(p.items.at(-1).exercise==='cooldown'&&p.items.at(-1).adaptedDose.seconds>=180,'Cooldown protected '+label);
  ok(p.items.some(x=>['Strength','Technique','Aerobic'].includes(x.selectedExercise.category)),'Useful training remains '+label);
  for(const item of p.items){const d=item.adaptedDose,ex=item.selectedExercise;
    ok(Number.isInteger(d.sets)&&d.sets>0&&Number.isFinite(d.rest)&&d.rest>=0,'Finite dose '+label);
    if(ex.category==='Power')ok(d.rest>=180&&d.sets<=4&&level!=='rookie','Power rests and rookie restriction '+label);
    if(ex.category==='Strength')ok(d.rest>=120,'Strength rest preserved '+label);
    if(item.conditioning&&['ropes','bikeIntervals','marchIntervals','sled'].includes(ex.id)&&!d.skip){if(coachLoad!=='technical'||level==='rookie')ok(d.gated&&d.sets<=2,'No hard intervals when gated '+label);else ok(d.sets<=(ex.id==='sled'?5:8),'Hard volume bounded '+label);}
    if(readiness==='tired'&&item.conditioning)ok(d.skip,'Tired conditioning skipped '+label);
    if(['stepup','splitSquat'].includes(ex.id))ok(!d.seconds,'Resistance substitution does not inherit rope/sled interval units '+label);
  }
}
function example(level,minutes,extra={}){T.setState({week:2,day:'mon',coachLoad:'technical',readiness:'normal',equipment:allYes,sessionSettings:{'2:mon':{level,minutes,...extra}}});return T.currentSession();}
const short=example('intermediate',45),long=example('intermediate',120);
ok(short.minutes<=45,'Requested intermediate / 45-minute example');ok(long.items.length>short.items.length,'Longer budget retains more movements');
ok(short.items.some(x=>x.selectedExercise.category==='Strength'),'Short session includes resistance work');
const rookie=example('rookie',60);ok(rookie.items.some(x=>x.selectedExercise.id==='bandRow'),'Rookie band resistance when confirmed');ok(!rookie.items.some(x=>x.selectedExercise.category==='Power'),'Rookie does not inherit explosive drills');
for(const minutes of [90,105,120]){const p=example('advanced',minutes);ok(p.items.filter(x=>x.conditioning&&x.selectedExercise.id==='sled').every(x=>x.adaptedDose.sets<=5),'Extra time never creates extra hard sled sets');}
T.setState({week:6,day:'tue',coachLoad:'technical',readiness:'normal',equipment:allYes,sessionSettings:{'6:tue':{level:'intermediate',minutes:120,progressionReady:false}}});let p=T.currentSession();ok(p.items.find(x=>x.exercise==='ropes').adaptedDose.sets===6,'Hold starting volume until progression confirmed');
T.setState({week:6,day:'tue',coachLoad:'technical',readiness:'normal',equipment:allYes,sessionSettings:{'6:tue':{level:'intermediate',minutes:120,progressionReady:true}}});p=T.currentSession();ok(p.items.find(x=>x.exercise==='ropes').adaptedDose.sets===8,'Confirmed progression permitted');
for(const day of ['thu','sat'])for(const minutes of P.times){T.setState({week:2,day,sessionSettings:{['2:'+day]:{level:'advanced',minutes}}});p=T.currentSession();ok(p.kind==='coach'&&p.items.length===1&&p.items[0].exercise==='coach','Coach plan remains external');if(minutes===30)ok(p.notes[0].includes('shorter session'),'Coaching time conflict explicit');}
for(const day of ['fri','sun']){T.setState({week:2,day,sessionSettings:{['2:'+day]:{level:'advanced',minutes:120}}});p=T.currentSession();ok(p.kind==='rest'&&p.minutes===0&&p.items[0].exercise==='rest','Two-hour choice preserves rest');}
const clean=P.cleanSettings({'2:mon':{level:'unsafe',minutes:999,progressionReady:'true'},bad:{level:'advanced',minutes:120},'6:tue':{level:'rookie',minutes:45,progressionReady:true}});ok(Object.keys(clean).length===2&&clean['2:mon'].level==='intermediate'&&clean['2:mon'].minutes===105&&!clean['2:mon'].progressionReady,'Invalid settings safely normalised');ok(clean['6:tue'].minutes===45&&clean['6:tue'].level==='rookie','Valid backup choices retained');
ok(JSON.stringify(D)===before,'Canonical routine never mutated');
const index=fs.readFileSync(path.join(base,'index.html'),'utf8'),sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');ok(index.indexOf('planner-ui.js')<index.indexOf('i18n.js'),'Planning translations load before translator');ok(sw.includes('planner.js?v=1.4.1')&&sw.includes('planner-ui.js?v=1.4.1'),'Adaptive code available offline');
const mobile=fs.readFileSync(path.join(base,'mobile.js'),'utf8');ok(mobile.includes('cleanSettings(x.sessionSettings)'),'Import preserves sanitised day settings');
for(const day of D.days){T.setState({week:2,day:day.id});T.renderSession();ok(get('main').innerHTML.includes('id="level-select"')&&get('main').innerHTML.includes('id="duration-select"'),'Both day menus rendered '+day.id);}
T.setState({week:2,day:'mon',equipment:allYes,coachLoad:'technical'});events.change({target:{id:'duration-select',value:'45'}});events.change({target:{id:'level-select',value:'rookie'}});ok(T.currentSession().choice.level==='rookie'&&T.currentSession().choice.minutes===45,'Control events replan current day');ok(JSON.parse(saved['roundwork.v1']).sessionSettings['2:mon'].minutes===45,'Per-day choices persisted');
events.click({target:{classList:{contains:()=>false},closest:()=>({dataset:{day:'tue'},hasAttribute:()=>false})}});ok(T.currentSession().choice.minutes===60&&T.currentSession().choice.level==='intermediate','Different day retains independent defaults');
events.click({target:{classList:{contains:()=>false},closest:()=>({dataset:{day:'mon'},hasAttribute:()=>false})}});ok(T.currentSession().choice.minutes===45&&T.currentSession().choice.level==='rookie','Returning to day restores its choices');
T.setState({week:1,day:'mon'});T.renderSession();ok(get('main').innerHTML.includes('select class="panel-select" id="duration-select" disabled')&&get('main').innerHTML.includes('Chest + back'),'Lifting routine preserved and adaptation disabled');
console.log(`${checks} planner checks passed across ${plans} combinations: budgets, levels, rests, resistance, fatigue, equipment, progression, coached days, recovery, backups and unchanged lifting data.`);
console.log('Intermediate / 45 min: '+short.items.map(x=>`${x.selectedExercise.name}: ${x.adaptedDose.sets} x ${x.adaptedDose.reps}, ${x.adaptedDose.rest}s rest`).join(' | ')+'; estimated '+short.minutes+' min.');


const C=ctx.window.RoundworkChoices;
for(const [slot,ids] of Object.entries(C.groups))ok(ids.length>=3,'At least three catalog choices for '+slot);
let optionPlans=0;
for(const day of D.days.filter(d=>['mon','tue','wed'].includes(d.id)))for(const item of day.items)for(const ex of C.options(item.exercise))for(const level of P.levels)for(const minutes of [30,45,120])for(const coachLoad of ['technical','hard'])for(const readiness of ['normal','tired']){
  const key='6:'+day.id,swaps={[key+':'+item.exercise]:ex.id};
  T.setState({week:6,day:day.id,swaps,equipment:allYes,coachLoad,readiness,sessionSettings:{[key]:{level,minutes,progressionReady:true}}});
  const plan=T.currentSession();optionPlans++;
  const label=[day.id,item.exercise,ex.id,level,minutes,coachLoad,readiness].join('/');
  ok(plan.minutes<=minutes,'Choice budget '+label);
  ok(plan.items[0].exercise==='warmup'&&plan.items[0].adaptedDose.seconds===480,'Choice warm-up protected '+label);
  ok(plan.items.at(-1).exercise==='cooldown'&&plan.items.at(-1).adaptedDose.seconds===180,'Choice cooldown protected '+label);
  ok(new Set(plan.items.map(i=>i.selectedExercise.id)).size===plan.items.length,'No duplicate movements '+label);
  const active=plan.items.find(i=>i.exercise===item.exercise);
  if(active&&C.allowed(ex,level))ok(active.selectedExercise.id===ex.id,'Allowed saved choice used '+label);
  for(const i of plan.items){
    const dose=i.adaptedDose,e=i.selectedExercise;
    ok(Number.isInteger(dose.sets)&&dose.sets>0&&Number.isFinite(dose.rest),'Choice finite units '+label);
    if(e.category==='Strength')ok(!dose.seconds&&dose.rest>=120,'Chosen resistance uses repetitions and full rests '+label);
    if(e.category==='Power')ok(level!=='rookie'&&dose.rest>=180,'Chosen power readiness '+label);
    if(e.id==='walkingBarbell')ok(level==='advanced','Barbell walking lunge gated '+label);
    if(['sidePlank','kneeSidePlank','suitcaseCarry'].includes(e.id))ok(/each side/.test(dose.reps)&&dose.seconds>0,'Timed both-side core '+label);
    if(e.id==='frontPlank')ok(!/each side/.test(dose.reps)&&dose.seconds>0,'Forearm plank single timed hold '+label);
    if(['deadbug','birdDog','pallof','bandPallof'].includes(e.id))ok(/each side/.test(dose.reps)&&!dose.seconds,'Repetition core on both sides '+label);
    if(readiness==='tired'&&i.conditioning)ok(dose.skip,'Chosen conditioning skipped when tired '+label);
  }
}
function configured(day='wed',level='advanced',minutes=120,extra={}){T.setState({week:2,day,swaps:{},logs:{},coachLoad:'technical',readiness:'normal',equipment:allYes,sessionSettings:{['2:'+day]:{level,minutes}},...extra});}
configured();T.chooseMovement('lunge','walkingBarbell');ok(T.getState().swaps['2:wed:lunge']==='walkingBarbell','Barbell choice saved');ok(JSON.parse(saved['roundwork.v1']).swaps['2:wed:lunge']==='walkingBarbell','Selection survives storage');
configured('wed','rookie',120,{swaps:{'2:wed:lunge':'walkingBarbell'}});ok(!T.currentSession().items.some(i=>i.selectedExercise.id==='walkingBarbell'),'Level reduction invalidates barbell selection');
configured('wed','advanced',120,{equipment:{...allYes,barbell:'no'},swaps:{'2:wed:lunge':'walkingBarbell'}});ok(!T.currentSession().items.some(i=>i.selectedExercise.id==='walkingBarbell'),'Missing barbell triggers fallback');
configured('wed','advanced',120,{logs:{'2:wed:lunge':{selected:'lunge',dose:{sets:2}}}});const completed=JSON.stringify(T.getState().logs);T.chooseMovement('lunge','walkingBarbell');ok(!T.getState().swaps['2:wed:lunge']&&JSON.stringify(T.getState().logs)===completed,'Completed choices cannot erase logs');ok(T.movementMenu(T.currentSession()).includes('data-movement="lunge" disabled'),'Completed selection disabled');
configured('mon','intermediate');T.chooseMovement('jump','rotation');ok(!T.getState().swaps['2:mon:jump'],'Duplicate choice rejected');
configured('wed','intermediate');T.chooseMovement('sidePlank','suitcaseCarry');ok(T.movementMenu(T.currentSession()).includes('Resist lateral bending while walking'),'Specific abdominal role visible');
configured('wed','rookie');T.chooseMovement('sidePlank','frontPlank');ok(T.currentSession().items.some(i=>i.selectedExercise.id==='frontPlank'),'Explicit rookie core choice respected');
configured('mon','rookie');T.chooseMovement('warmup','warmRope');ok(T.currentSession().items[0].selectedExercise.id==='warmRope','Rookie easy jump rope permitted');
configured('mon','intermediate',30,{swaps:{'2:mon:pallof':'birdDog'}});ok(T.movementMenu(T.currentSession()).includes('Omitted for level, time or repeated movement.'),'Short-session omission explained');ok(T.getState().swaps['2:mon:pallof']==='birdDog','Omitted choice stays saved');
for(const [id,role] of Object.entries(C.trunkRoles)){ok(D.exercises.some(e=>e.id===id)&&role.length>0,'Known abdominal role '+id);}
ok(JSON.stringify(D)===before,'Options never mutate routine or library after loading');
ok(sw.includes('choices.js?v=1.4.1')&&sw.includes('choices-diagrams.js?v=1.4.1'),'New guides and selection code cached offline');
console.log(checks+' full-app choice checks passed across '+plans+' baseline and '+optionPlans+' exercise-selection plans.');
