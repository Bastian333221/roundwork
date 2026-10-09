/* Display-only localization preserves workout logic, input values and active timers. */
(() => {
  'use strict';
  const catalog = window.ROUNDWORK_ES, folded = new Map(Object.keys(catalog).map(k=>[k.toLowerCase(),k]));
  let language = 'en';
  try { if (localStorage.getItem('roundwork.language') === 'es') language = 'es'; } catch (_) {}
  const fold = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function spanish(value, depth=0) {
    if (depth > 8) return value;
    if (Object.hasOwn(catalog,value)) return catalog[value];
    const key = folded.get(value.toLowerCase());
    if (key) return value === value.toUpperCase() ? catalog[key].toUpperCase() : catalog[key];
    const t = s => spanish(s,depth+1);
    const rules = [
      [/^Week (\d+) · (Lifting|Boxing)$/,(_,n,type)=>`Semana ${n} · ${type==='Lifting'?'Pesas':'Boxeo'}`],
      [/^WEEK (\d+) · (BOXING FOCUS|YOUR LIFTING ROUTINE)$/,(_,n,type)=>`SEMANA ${n} · ${type==='BOXING FOCUS'?'ENFOQUE DE BOXEO':'TU RUTINA DE PESAS'}`],
      [/^WEEK (\d+) OF 8$/,(_,n)=>`SEMANA ${n} DE 8`],
      [/^WEEK (\d+)$/,(_,n)=>`SEMANA ${n}`],
      [/^(\d+) MOVEMENTS & ALTERNATIVES$/,(_,n)=>`${n} MOVIMIENTOS Y ALTERNATIVAS`],
      [/^(\d+) MOVEMENTS$/,(_,n)=>`${n} MOVIMIENTOS`],
      [/^(\d+) equipment items to confirm$/,(_,n)=>`${n} elementos de equipo por confirmar`],
      [/^(\d+) AVAILABLE · (\d+) TO CONFIRM$/,(_,a,b)=>`${a} DISPONIBLES · ${b} POR CONFIRMAR`],
      [/^(0\d+) \/ TRAINING PRINCIPLE$/,(_,n)=>`${n} / PRINCIPIO DE ENTRENAMIENTO`],
      [/^FRAME (\d+) \/ 3$/,(_,n)=>`IMAGEN ${n} / 3`],
      [/^Mark (complete|incomplete): (.+)$/,(_,mode,name)=>`${mode==='complete'?'Marcar completado':'Marcar pendiente'}: ${t(name)}`],
      [/^(.+): (yes|no|not sure)$/,(_,name,status)=>`${t(name)}: ${{yes:'sí',no:'no','not sure':'no estoy seguro'}[status]}`],
      [/^Replaces (.+)\.$/,(_,name)=>`Sustituye ${t(name)}.`],
      [/^(Rest|Work|REST|WORK) · (.+)$/,(_,type,name)=>`${/rest/i.test(type)?'Descanso':'Trabajo'} · ${t(name)}`],
      [/^(\d+(?:[–-]\d+)?) (?:reps|controlled reps|quick reps)$/,(_,n)=>`${n} ${value.includes('controlled')?'repeticiones controladas':value.includes('quick')?'repeticiones rápidas':'repeticiones'}`],
      [/^(\d+(?:[–-]\d+)?) each (side|leg)$/,(_,n,part)=>`${n} por ${part==='side'?'lado':'pierna'}`],
      [/^(\d+(?:[–-]\d+)?) seconds each side$/,(_,n)=>`${n} segundos por lado`],
      [/^(\d+(?:[–-]\d+)?) seconds$/,(_,n)=>`${n} segundos`],
      [/^(\d+(?:[–-]\d+)?) (minutes|metres|seconds work|sec|min easy)$/,(_,n,unit)=>`${n} ${{minutes:'minutos',metres:'metros','seconds work':'segundos de trabajo',sec:'s','min easy':'min suaves'}[unit]}`],
      [/^(\d+)-minute round$/,(_,n)=>`Asalto de ${n} minutos`],
      [/^(\d+) metres · easy load$/,(_,n)=>`${n} metros · carga suave`],
      [/^(\d+) seconds · easy (waves|pedalling|marching)$/,(_,n,mode)=>`${n} segundos · ${{waves:'ondas suaves',pedalling:'pedaleo suave',marching:'marcha suave'}[mode]}`],
      [/^Planned intermediate block: (.+) × (.+) \/ (\d+) sec rest\.\s+(.+)$/,(_,sets,reps,rest,tail)=>`Bloque intermedio previsto: ${sets} × ${t(reps)} / ${rest} s de descanso. ${tail.split(/(?<=\.)\s+/).map(t).join(' ')}`],
      [/^This removes completion marks for Week (\d+), (.+) only\. Other sessions stay saved\.$/,(_,n,day)=>`Elimina las marcas de la semana ${n}, ${t(day)}, únicamente. Las otras sesiones siguen guardadas.`],
      [/^(\d+) of (\d+) movements marked complete\. It is fine to finish with skipped movements—only the exercises you marked are counted\.$/,(_,a,b)=>`${a} de ${b} movimientos marcados como completados. Puedes terminar con movimientos omitidos; solo se cuentan los ejercicios que marcaste.`],
      [/^(.+) Session records are manual and stay on this device\.$/,(_,first)=>`${t(first)} Los registros de sesiones son manuales y se guardan en este dispositivo.`],
      [/^ROUNDWORK — Your boxing companion$/,()=> 'ROUNDWORK — Tu guía de boxeo'],
      [/^(.+) ([↗↓✓])$/,(_,label,arrow)=>`${t(label)} ${arrow}`]
    ];
    for (const [pattern, replace] of rules) if (pattern.test(value)) return value.replace(pattern,replace);
    // Joined labels and SVG titles share the same authored translations as their individual parts.
    for (const separator of [' · ',' + ',' — ',': ']) if (value.includes(separator)) return value.split(separator).map(t).join(separator);
    if (value === '/ LIFTING') return '/ PESAS';
    if (value === '✓') return value;
    return value;
  }
  function translate(value, target=language) {
    const text=String(value), middle=text.trim();
    return target==='es' && middle ? text.replace(middle,spanish(middle)) : text;
  }
  const originals = new WeakMap();
  function localizeText(node) {
    let record=originals.get(node);
    if (!record || node.nodeValue!==record.last) record={source:node.nodeValue,last:node.nodeValue};
    const next=translate(record.source);
    if (node.nodeValue!==next) node.nodeValue=next;
    record.last=next;originals.set(node,record);
  }
  const attributes = new WeakMap(), attributeNames=['aria-label','placeholder','title'];
  function apply(root=document.body) {
    if (root.nodeType===3) { if (!root.parentElement?.closest('script,style,textarea,[data-no-i18n]')) localizeText(root); return; }
    if (!root.querySelectorAll || root.closest?.('script,style,textarea,[data-no-i18n]')) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) if (!node.parentElement?.closest('script,style,textarea,[data-no-i18n]')) localizeText(node);
    for (const element of [root,...root.querySelectorAll('[aria-label],[placeholder],[title]')]) {
      if (element.closest?.('[data-no-i18n]')) continue;
      const saved=attributes.get(element)||{};
      for (const name of attributeNames) if (element.hasAttribute?.(name)) {
        const current=element.getAttribute(name), record=saved[name];
        const source=record && current===record.last ? record.source : current, next=translate(source);
        if (current!==next) element.setAttribute(name,next);
        saved[name]={source,last:next};
      }
      attributes.set(element,saved);
    }
  }
  function controls() {
    document.documentElement.lang=language;
    document.title=translate('ROUNDWORK — Your boxing companion');
    document.querySelectorAll('[data-language]').forEach(button=>{
      const selected=button.dataset.language===language;
      button.setAttribute('aria-pressed',String(selected));button.classList.toggle('active',selected);
    });
    document.querySelectorAll('.language-switch').forEach(group=>group.setAttribute('aria-label',language==='es'?'Idioma de la aplicación':'App language'));
  }
  function setLanguage(next) {
    if (!['en','es'].includes(next)) return;
    language=next;
    try { localStorage.setItem('roundwork.language',language); } catch (_) {}
    apply();controls();document.dispatchEvent(new CustomEvent('roundwork-language'));
  }
  window.RoundworkI18n={translate,spanish,fold,apply,setLanguage,get language(){return language;}};
  document.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(button)setLanguage(button.dataset.language);});
  new MutationObserver(records=>{
    const roots=new Set();
    for (const record of records) {
      if (record.type==='childList') record.addedNodes.forEach(n=>roots.add(n));
      else roots.add(record.target);
    }
    roots.forEach(root=>apply(root));
  }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributeNames});
  apply();controls();
})();
