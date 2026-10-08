const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const base=path.join(__dirname,'..');let checks=0,plans=0;const ok=(v,msg)=>{assert(v,msg);checks++};
const noop=()=>{},elements=new Map();const get=key=>{if(!elements.has(key))elements.set(key,{addEventListener:noop,classList:{add:noop,remove:noop,toggle:noop},setAttribute:noop,focus:noop,textContent:'',innerHTML:'',hidden:false});return elements.get(key);};
const events={},saved={};const document={getElementById:get,querySelector:get,querySelectorAll:()=>[],addEventListener:(name,handler)=>events[name]=handler};
const ctx={window:{scrollTo:noop},document,localStorage:{getItem:()=>null,setItem:(key,value)=>saved[key]=value},location:{hash:''},history:{replaceState:noop},setInterval:noop,clearInterval:noop,setTimeout:noop,clearTimeout:noop,console,URL,Date,Map,Set,navigator:{}};
vm.createContext(ctx);for(const f of ['data.js','planner.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx);
let app=fs.readFileSync(path.join(base,'app.js'),'utf8').replace(/  render\(\);\s*\}\)\(\);\s*$/,'  window.test={getDose,currentSession,sessionOptions,exerciseCard,renderSession,setState:s=>{state={...baseState,...s}}};\n})();');vm.runInContext(app,ctx);
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
const index=fs.readFileSync(path.join(base,'index.html'),'utf8'),sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');ok(index.indexOf('planner-ui.js')<index.indexOf('i18n.js'),'Planning translations load before translator');ok(sw.includes('planner.js?v=1.3.1')&&sw.includes('planner-ui.js?v=1.3.1'),'Adaptive code available offline');
const mobile=fs.readFileSync(path.join(base,'mobile.js'),'utf8');ok(mobile.includes('cleanSettings(x.sessionSettings)'),'Import preserves sanitised day settings');
for(const day of D.days){T.setState({week:2,day:day.id});T.renderSession();ok(get('main').innerHTML.includes('id="level-select"')&&get('main').innerHTML.includes('id="duration-select"'),'Both day menus rendered '+day.id);}
T.setState({week:2,day:'mon',equipment:allYes,coachLoad:'technical'});events.change({target:{id:'duration-select',value:'45'}});events.change({target:{id:'level-select',value:'rookie'}});ok(T.currentSession().choice.level==='rookie'&&T.currentSession().choice.minutes===45,'Control events replan current day');ok(JSON.parse(saved['roundwork.v1']).sessionSettings['2:mon'].minutes===45,'Per-day choices persisted');
events.click({target:{classList:{contains:()=>false},closest:()=>({dataset:{day:'tue'},hasAttribute:()=>false})}});ok(T.currentSession().choice.minutes===60&&T.currentSession().choice.level==='intermediate','Different day retains independent defaults');
events.click({target:{classList:{contains:()=>false},closest:()=>({dataset:{day:'mon'},hasAttribute:()=>false})}});ok(T.currentSession().choice.minutes===45&&T.currentSession().choice.level==='rookie','Returning to day restores its choices');
T.setState({week:1,day:'mon'});T.renderSession();ok(get('main').innerHTML.includes('select class="panel-select" id="duration-select" disabled')&&get('main').innerHTML.includes('Chest + back'),'Lifting routine preserved and adaptation disabled');
console.log(`${checks} planner checks passed across ${plans} combinations: budgets, levels, rests, resistance, fatigue, equipment, progression, coached days, recovery, backups and unchanged lifting data.`);
console.log('Intermediate / 45 min: '+short.items.map(x=>`${x.selectedExercise.name}: ${x.adaptedDose.sets} x ${x.adaptedDose.reps}, ${x.adaptedDose.rest}s rest`).join(' | ')+'; estimated '+short.minutes+' min.');

