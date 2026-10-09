/* Small original mechanics diagrams; instructional outlines, not technique assessment. */
(() => {
  const base=window.ExerciseDemo,types=['jumpRope','walkingBody','walkingDumbbell','walkingBarbell','bodySquat','bodyHinge','wallPushup','cableRow','birdDog','kneeSidePlank','frontPlank','suitcaseCarry','rower','footwork','defence'];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const line=(pts,color='#26392f',width=7)=>`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const circle=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#26392f"/>`;
  const db=(x,y)=>line([[x-13,y],[x+13,y]],'#d86032',4)+line([[x-13,y-7],[x-13,y+7]],'#26392f',6)+line([[x+13,y-7],[x+13,y+7]],'#26392f',6);
  const person=(head,shoulder,hip,legs,arms)=>circle(...head,12)+line([head,shoulder],undefined,6)+line([shoulder,hip],undefined,12)+legs.map(p=>line([hip,...p])).join('')+arms.map(p=>line([shoulder,...p])).join('');
  function render(type,frame=0){
    if(!types.includes(type))return base.render(type,frame);
    if(['bodySquat','bodyHinge'].includes(type))return base.render(type==='bodySquat'?'squat':'hinge',frame).replace(/<g transform="translate\([^>]+>.*?<\/g>/g,'');
    const f=((Number(frame)||0)%3+3)%3,a=f===1;
    const ex=window.BOXING_DATA.exercises.find(e=>e.demo===type)||window.BOXING_DATA.exercises.find(e=>e.id===type);
    let s=line([[30,211],[390,211]],'#c7cbbb',2);
    if(type==='jumpRope'){
      const y=a?-8:0;s+=person([205,64+y],[205,86+y],[205,145+y],[[[190,178+y],[192,208+y]],[[220,178+y],[217,208+y]]],[[[179,112+y],[166,131+y]],[[231,112+y],[244,131+y]]]);
      s+=`<path d="M166 ${131+y} Q${f===2?205:65} ${f===2?250:0} 244 ${131+y}" fill="none" stroke="#d86032" stroke-width="3"/>`;
    }else if(type.startsWith('walking')){
      const x=f===2?50:0;s+=person([193+x,65],[193+x,88],[193+x,a?150:143],a?[[[243,173],[254,210]],[[145,199],[125,209]]]:[[[178+x,177],[178+x,209]],[[209+x,177],[213+x,209]]],type==='walkingBarbell'?[[[159+x,116],[148+x,94]],[[230+x,116],[239+x,94]]]:[[[172+x,123],[170+x,150]],[[217+x,120],[220+x,149]]]);
      if(type==='walkingDumbbell')s+=db(170+x,154)+db(220+x,154);
      if(type==='walkingBarbell')s+=line([[130+x,94],[254+x,94]],'#d86032',4)+line([[135+x,83],[135+x,105]],undefined,10)+line([[249+x,83],[249+x,105]],undefined,10);
      s+=line([[280,180],[338,180]],'#d86032',3)+line([[329,172],[338,180],[329,188]],'#d86032',3);
    }else if(type==='birdDog'){
      s+=person([126,113],[155,128],[244,129],a?[[[283,130],[330,129]],[[249,177],[280,210]]]:[[[245,177],[284,210]],[[231,177],[263,209]]],a?[[[112,130],[67,130]],[[164,173],[166,209]]]:[[[158,172],[163,209]],[[174,172],[181,209]]]);
    }else if(type==='frontPlank'){
      s+=person([113,a?130:137],[140,a?146:154],[235,a?177:195],[[[285,a?193:209],[338,210]],[[273,a?189:209],[323,210]]],[[[140,209],[94,210]],[[149,205],[106,210]]]);
    }else if(type==='kneeSidePlank'){
      s+=person([113,126],[139,145],[229,a?188:195],[[[277,211],[321,211]],[[265,207],[312,207]]],[[[139,207],[92,209]],[[166,149],[188,156]]]);
    }else if(type==='suitcaseCarry'||type==='footwork'||type==='defence'){
      s+=person([203,66],[203,89],[200,146],[[[a?181:188,178],[a?173:186,209]],[[a?229:215,177],[a?243:219,209]]],type==='suitcaseCarry'?[[[178,122],[177,156]],[[224,122],[226,143]]]:[[[176,110],[182,a&&type==='defence'?75:94]],[[230,108],[228,83]]]);
      if(type==='suitcaseCarry')s+=db(177,162);
      if(type==='footwork')s+=line([[266,185],[323,185]],'#d86032',3)+line([[314,178],[323,185],[314,192]],'#d86032',3);
    }else if(type==='wallPushup'){
      s+=line([[316,44],[316,212]],'#839387',9);
      s+=person([a?255:223,83],[a?252:220,104],[a?220:203,158],[[[197,185],[189,210]],[[209,185],[199,210]]],[[[a?280:269,125],[314,105]],[[a?280:269,117],[314,96]]]);
    }else if(type==='cableRow'||type==='rower'){
      s+=line([[120,199],[312,199]],'#839387',7)+line([[340,70],[340,199]],'#839387',8);
      const hand=a?[193,132]:[279,139],rowing=type==='rower';
      s+=person([186,rowing&&!a?95:75],[192,rowing&&!a?117:98],[192,170],[[[260,rowing&&!a?139:174],[296,194]],[[256,rowing&&!a?148:179],[285,195]]],[[[a?208:235,137],hand],[[a?210:238,130],[hand[0],hand[1]-7]]]);
      s+=line([hand,[340,140]],'#d86032',2)+line([[165,178],[216,178]],'#839387',9);
    }
    const name=ex?.name||type,step=ex?.steps?.[f]||'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="${esc(name+': '+step)}"><title>${esc(name+' — '+step)}</title><rect width="420" height="260" rx="14" fill="#f8f5ed"/><text x="210" y="24" text-anchor="middle" font-size="12" fill="#26392f">${esc(name)}</text>${s}<text x="210" y="245" text-anchor="middle" font-size="12" fill="#26392f">${['SETUP','CONTROL','RETURN'][f]}</text></svg>`;
  }
  window.ExerciseDemo={...base,render,types:[...base.types,...types]};
})();
