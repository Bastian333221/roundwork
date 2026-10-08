const fs=require('fs'),vm=require('vm'),assert=require('assert');
const base=__dirname+'/../';
const noop=()=>{},document={body:{querySelectorAll:()=>[]},documentElement:{},createTreeWalker:()=>({nextNode:()=>null}),querySelectorAll:()=>[],querySelector:()=>null,addEventListener:noop,dispatchEvent:noop};
const stored={},context={window:{},document,NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}},CustomEvent:class{},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},Map,Set,console};
vm.createContext(context);
for(const file of ['data.js','es.js','es-ui.js','evidence.js','videos.js','planner.js','planner-ui.js','i18n.js','diagrams.js'])vm.runInContext(fs.readFileSync(base+file,'utf8'),context);
const D=context.window.BOXING_DATA,I=context.window.RoundworkI18n,E=context.window.ROUNDWORK_EVIDENCE;
let checks=0,missing=[];const ok=(condition,msg)=>{assert(condition,msg);checks++};
const check=value=>{if(typeof value!=='string')return;const es=I.translate(value,'es');if(es===value&&!['No','Pallof press'].includes(value)&&!/^\d+(?:[–-]\d+)? min$/.test(value))missing.push(value);ok(I.translate(value,'en')===value,'English changed: '+value);const numbers=s=>s.match(/\d+(?:[–-]\d+)?/g)||[];ok(JSON.stringify(numbers(value))===JSON.stringify(numbers(es)),'Numeric dose changed: '+value);};
for(const ex of D.exercises){for(const field of ['name','category','purpose','setup','substitutionNote'])check(ex[field]);for(const field of ['steps','cues','avoid'])ex[field].forEach(check);for(const field of ['doseOverride','techniqueDoseOverride']){check(ex[field]?.reps);check(ex[field]?.notes);}check(ex.source.label);}
function doses(item){check(item.reps);check(item.notes);if(item.techniqueDose)doses(item.techniqueDose);Object.values(item.progression||{}).forEach(doses);}
D.equipment.forEach(g=>check(g.name));D.days.forEach(d=>{[d.label,d.title,d.description].forEach(check);d.items.forEach(doses)});check(D.review.summary);D.review.points.forEach(check);D.progression.forEach(p=>{check(p.title);check(p.detail)});D.sources.forEach(s=>{check(s.label);check(s.note)});
for(const source of E.sources){['title','design','finding','application','limit'].forEach(field=>check(source[field]));ok(/^https:\/\//.test(source.url),'Source must be HTTPS');ok(['research','guideline','practice'].includes(source.type),'Source type');if(source.type!=='practice')ok(source.originalTitle&&source.doi,'Scientific citation metadata');}
for(const type of context.window.ExerciseDemo.types)for(let frame=0;frame<3;frame++){
  const svg=context.window.ExerciseDemo.render(type,frame);
  for(const match of svg.matchAll(/<(?:text|title)[^>]*>(.*?)<\/(?:text|title)>/g)){
    const text=match[1].replaceAll('&amp;','&').replaceAll('&#39;',"'");
    ok(I.translate(text,'es')!==text || text==='JAB','Untranslated diagram: '+text);
  }
}
for(const ex of D.exercises)ok(E.groups.some(g=>g.exercises.includes(ex.id)),'Evidence mapping missing '+ex.id);
context.window.ROUNDWORK_PLANNER_TEXT.forEach(check);
const before=JSON.stringify(D);I.setLanguage('es');ok(document.documentElement.lang==='es','Spanish document language');ok(stored['roundwork.language']==='es','Persistent language');ok(I.translate('20 seconds work')==='20 segundos de trabajo','Timed work translation');ok(I.fold('Miércoles')==='miercoles','Accent-insensitive search');I.setLanguage('en');ok(JSON.stringify(D)===before,'Language switch must not mutate training data');
ok(!missing.length,'Untranslated content:\n'+[...new Set(missing)].join('\n'));
console.log(`${checks} language/content checks passed; ${D.exercises.length} exercise guides and ${E.sources.length} evidence summaries covered.`);
