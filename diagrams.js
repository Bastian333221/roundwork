(function () {
  'use strict';
  const INK = '#26392f', MUTED = '#839387', ORANGE = '#d86032', SOFT = '#e9e5d9';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const line = (a,b,color=INK,width=7,extra='') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
  const poly = (p,color=INK,width=7,extra='') => `<polyline points="${p.map(x=>x.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const circ = (x,y,r,color=INK,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${extra}/>`;
  const rect = (x,y,w,h,color=SOFT,r=4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}"/>`;
  const text = (x,y,s,size=12,color=INK,anchor='middle') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" font-family="system-ui,sans-serif">${esc(s)}</text>`;
  const arrow = (a,b,color=ORANGE) => { const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,u=[dx/len,dy/len],p=[-u[1],u[0]]; return line(a,b,color,2.5)+`<path d="M${b[0]-u[0]*9+p[0]*4},${b[1]-u[1]*9+p[1]*4} L${b[0]},${b[1]} L${b[0]-u[0]*9-p[0]*4},${b[1]-u[1]*9-p[1]*4}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`; };
  const curve = (d,color=ORANGE,width=2.5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  function person(p) {
    let s='';
    if(p.farArm) s+=poly([p.shoulder,...p.farArm],MUTED,7);
    if(p.farLeg) s+=poly([p.hip,...p.farLeg],MUTED,8);
    s+=line(p.shoulder,p.hip,INK,13);
    s+=line(p.head,p.shoulder,INK,7);
    if(p.leg) s+=poly([p.hip,...p.leg],INK,8);
    if(p.arm) s+=poly([p.shoulder,...p.arm],INK,7);
    s+=circ(p.head[0],p.head[1],13,INK);
    if(p.arm) s+=circ(...p.arm[p.arm.length-1],4,ORANGE);
    return s;
  }
  function dumbbell(x,y,angle=0) {return `<g transform="translate(${x} ${y}) rotate(${angle})">${line([-11,0],[11,0],MUTED,4)}${rect(-16,-8,7,16,INK,2)}${rect(9,-8,7,16,INK,2)}</g>`;}
  function ball(x,y) {return circ(x,y,12,ORANGE)+curve(`M${x-8} ${y-8} Q${x+3} ${y} ${x-8} ${y+8}`,'#a64326',1.5);}
  const floor = () => line([30,212],[390,212],'#c7cbbb',2);
  const standing = (arm=[[224,109],[230,127]]) => ({head:[200,65],shoulder:[200,87],hip:[198,145],leg:[[213,177],[221,208]],farLeg:[[183,177],[178,208]],arm,farArm:[[182,111],[188,130]]});
  const bench = () => rect(133,156,165,12,MUTED)+line([151,166],[151,208],MUTED,6)+line([281,166],[281,208],MUTED,6);
  const info = {
    jump:['Vertical jump',['Set a balanced stance','Drive up; arms follow','Land softly and reset'],['SETUP','TAKE OFF','LAND']],
    rotationalThrow:['Rotational medicine-ball throw',['Load beside your rear hip','Turn feet and hips toward wall','Release; finish facing wall'],['LOAD','ROTATE','RELEASE']],
    chestThrow:['Medicine-ball chest pass',['Ball at chest; knees soft','Drive both hands forward','Release toward a suitable wall'],['SETUP','DRIVE','RELEASE']],
    squat:['Squat',['Brace; feet planted','Bend hips and knees together','Stand tall without leaning back'],['SETUP','LOWER','STAND']],
    benchPress:['Dumbbell bench press',['Feet firm; dumbbells over chest','Lower with forearms upright','Press up under control'],['SETUP','LOWER','PRESS']],
    row:['Chest-supported dumbbell row',['Chest supported; arms hanging','Pull elbows toward your hips','Lower slowly; chest stays down'],['SETUP','PULL','LOWER']],
    oneArmRow:['Supported one-arm row',['One hand and knee on the bench','Pull working elbow toward hip','Lower slowly; torso stays still'],['SETUP','PULL','LOWER']],
    inclinePushup:['Fast incline push-up',['Hands on a stable secured bench','Lower chest under control','Push quickly; hands stay planted'],['SETUP','LOWER','PRESS']],
    stepup:['Low step-up',['Place whole foot on stable step','Drive through leading leg','Step down with control'],['SETUP','STEP UP','RETURN']],
    pallof:['Pallof press',['Stand sideways to the anchor','Press out without turning','Bring hands back to chest'],['SETUP','PRESS','RETURN']],
    hinge:['Romanian deadlift',['Stand tall; knees slightly soft','Push hips back; keep spine long','Drive through feet to stand'],['SETUP','HINGE','STAND']],
    lunge:['Reverse lunge',['Stand tall and balanced','Step back; lower under control','Push through front foot to return'],['SETUP','STEP BACK','RETURN']],
    pulldown:['Lat pulldown',['Sit tall; grip overhead','Pull toward upper chest','Let arms rise with control'],['SETUP','PULL','RETURN']],
    sidePlank:['Side plank',['Elbow below shoulder; feet stacked','Lift hips into a straight line','Lower gently to reset'],['SETUP','HOLD','LOWER']],
    sled:['Sled push',['Hands firm; long neutral spine','Drive one leg into the floor','Alternate legs; keep torso stable'],['SETUP','DRIVE','SWITCH']],
    ropes:['Alternating battle-rope waves',['Soft knees; grip both rope ends','Raise one hand, lower the other','Switch hands; send waves forward'],['SETUP','WAVE','SWITCH']],
    bike:['Stationary cycling',['Adjust seat; settle into position','Pedal smoothly; shoulders relaxed','Keep a steady, controlled rhythm'],['SETUP','PEDAL','CONTINUE']],
    walk:['Easy walk or jog',['Stand relaxed; look ahead','Step naturally beneath your body','Switch legs; keep breathing easy'],['SETUP','STEP','SWITCH']],
    shadow:['Shadowboxing: jab and return',['Set your coach-taught guard','Extend a relaxed jab','Return hand to guard; stay balanced'],['GUARD','JAB','RETURN']],
    pushup:['Push-up',['Hands below shoulders; body straight','Lower chest with control','Press away from the floor'],['SETUP','LOWER','PRESS']],
    deadbug:['Dead bug',['Back gently supported; limbs raised','Reach opposite arm and leg away','Return; repeat on the other side'],['SETUP','REACH','RETURN']],
    bridge:['Glute bridge',['Lie down; feet flat near hips','Lift hips without arching your back','Lower with control'],['SETUP','LIFT','LOWER']],
    splitSquat:['Split squat',['Set a stable split stance','Lower straight down; feet stay put','Press through your feet to rise'],['SETUP','LOWER','RISE']],
    bandRow:['Standing resistance-band row',['Anchor securely; arms forward','Pull elbows back beside ribs','Reach forward with control'],['SETUP','PULL','RETURN']],
    warmup:['Warm-up: easy march',['Begin with easy, relaxed steps','Lift one knee comfortably','Switch legs and swing arms'],['START','MARCH','SWITCH']],
    cooldown:['Cooldown: relaxed breathing',['Slow to a comfortable walk','Breathe in without forcing it','Breathe out; let shoulders relax'],['SLOW DOWN','INHALE','EXHALE']],
    coach:['Coached boxing practice',['Begin in your usual guard','Rehearse the assigned technique','Return to guard for feedback'],['PREPARE','PRACTISE','RESET']],
    rest:['Recovery day',['Choose a comfortable position','Take a slow, easy breath','Relax; no workout required'],['REST','BREATHE IN','BREATHE OUT']]
  };
  function render(type,frame=0) {
    if(!info[type]) type='warmup';
    const f=((Number(frame)||0)%3+3)%3, active=f===1;
    const meta=info[type]; let s=floor();
    switch(type) {
      case 'jump': {
        const poses=[
          {head:[195,87],shoulder:[194,108],hip:[171,153],leg:[[214,174],[206,208]],farLeg:[[184,179],[168,208]],arm:[[174,133],[145,132]],farArm:[[179,125],[151,114]]},
          {head:[204,39],shoulder:[204,60],hip:[203,113],leg:[[208,148],[210,176]],farLeg:[[191,148],[189,177]],arm:[[221,38],[225,20]],farArm:[[186,39],[181,22]]},
          {head:[202,91],shoulder:[198,112],hip:[179,158],leg:[[216,177],[211,208]],farLeg:[[189,177],[176,208]],arm:[[226,127],[235,108]],farArm:[[177,135],[164,119]]}
        ]; s+=person(poses[f]); if(active)s+=arrow([263,145],[263,72]); if(f===2)s+=arrow([260,148],[260,186]); break;
      }
      case 'rotationalThrow': {
        s+=rect(350,39,12,173,MUTED,0)+text(355,30,'WALL',10);
        const hands=[[160,132],[249,101],[292,91]][f];
        s+=person({head:[210,65],shoulder:[210,89],hip:[202,146],leg:[[222,177],[239,208]],farLeg:[[176,180],[159,208]],arm:[[hands[0]-18,hands[1]-6],hands],farArm:[[hands[0]-30,hands[1]+5],[hands[0]-4,hands[1]+5]]});
        s+=ball(f===2?320:hands[0]+8,f===2?88:hands[1]);
        s+=circ(77,127,30,SOFT)+text(77,179,'HIP TURN',10)+line([77,127],[f===0?56:101,f===0?113:121],INK,5)+curve('M57 101 A32 32 0 0 1 108 133')+arrow([108,130],[104,141]);
        if(f>0)s+=arrow([291,65],[335,65]); break;
      }
      case 'chestThrow': {
        s+=rect(347,45,11,167,MUTED,0)+text(350,34,'WALL',10);
        const hands=[[230,104],[273,98],[286,97]][f];
        s+=person({...standing(),arm:[[f===0?214:241,112],hands],farArm:[[f===0?211:240,119],[hands[0],hands[1]+6]]});
        s+=ball(f===2?316:hands[0]+7,f===2?92:hands[1]); if(f>0)s+=arrow([287, sixty()],[335,sixty()]); break;
      }
      case 'squat': {
        const p=active?{head:[218,101],shoulder:[211,122],hip:[171,161],leg:[[220,171],[223,207]],farLeg:[[190,179],[177,208]],arm:[[237,138],[260,118]],farArm:[[221,140],[248,122]]}:standing([[226,109],[247,90]]);
        s+=person(p); if(active)s+=arrow([123,112],[123,166]);else if(f===2)s+=arrow([123,167],[123,108]); break;
      }
      case 'benchPress': {
        s+=bench();
        const hand=active?[212,130]:[196,75];
        s+=person({head:[158,136],shoulder:[182,141],hip:[247,145],leg:[[278,170],[284,208]],farLeg:[[262,173],[266,208]],arm:[active?[220,152]:[193,108],hand],farArm:[active?[203,158]:[179,107],[hand[0]-15,hand[1]+4]]});
        s+=dumbbell(...hand)+dumbbell(hand[0]-15,hand[1]+4);s+=arrow(active?[111,85]:[111,136],active?[111,135]:[111,84]);break;
      }
      case 'oneArmRow': {
        s+=rect(156,154,156,12,MUTED)+line([173,166],[173,208],MUTED,6)+line([292,166],[292,208],MUTED,6);
        const hand=active?[221,128]:[235,186];
        s+=person({head:[270,91],shoulder:[247,111],hip:[177,125],leg:[[144,170],[124,208]],farLeg:[[185,151],[222,153]],farArm:[[269,135],[283,151]],arm:[active?[236,139]:[242,149],hand]});
        s+=dumbbell(...hand)+arrow(active?[332,184]:[332,130],active?[332,130]:[332,184]);break;
      }
      case 'inclinePushup': {
        s+=rect(105,157,110,12,MUTED)+line([121,169],[121,209],MUTED,6)+line([198,169],[198,209],MUTED,6);
        const y=active?125:93;
        s+=person({head:[133,y-9],shoulder:[153,y+8],hip:[239,active?169:153],leg:[[285,191],[334,208]],farLeg:[[283,192],[324,209]],arm:[active?[126,145]:[160,133],[164,155]],farArm:[active?[150,149]:[179,132],[185,155]]});
        s+=arrow(active?[83,92]:[83,143],active?[83,141]:[83,92]);break;
      }
      case 'stepup': {
        s+=rect(226,176,103,35,MUTED);
        const p=active?{head:[259,39],shoulder:[258,61],hip:[259,114],leg:[[261,148],[264,173]],farLeg:[[231,143],[218,175]],arm:[[279,87],[280,116]],farArm:[[240,89],[237,114]]}:{head:[201,67],shoulder:[201,89],hip:[200,144],leg:[[246,145],[260,173]],farLeg:[[188,178],[179,208]],arm:[[222,114],[229,140]],farArm:[[183,115],[179,143]]};
        s+=person(p)+arrow(active?[343,177]:[343,115],active?[343,116]:[343,176]);break;
      }
      case 'row': {
        s+=poly([[139,165],[220,105]],MUTED,13)+line([179,138],[196,208],MUTED,7)+line([135,208],[253,208],MUTED,5);
        const hand=active?[207,126]:[223,187];
        s+=person({head:[245,90],shoulder:[225,112],hip:[168,154],leg:[[131,181],[111,208]],farLeg:[[176,181],[190,208]],arm:[active?[251,125]:[224,150],hand],farArm:[active?[235,132]:[211,153],[hand[0]-12,hand[1]+7]]});
        s+=dumbbell(...hand)+dumbbell(hand[0]-12,hand[1]+7);s+=arrow(active?[284,175]:[284,122],active?[284,122]:[284,175]); break;
      }
      case 'pallof': {
        s+=rect(54,57,8,155,MUTED)+circ(62,105,4,ORANGE)+text(65,45,'ANCHOR',10);
        const hand=active?[263,108]:[210,108];
        s+=line([63,105],hand,ORANGE,3);
        s+=person({...standing(),arm:[[active?238:224,120],hand],farArm:[[active?236:187,118],[hand[0],hand[1]+3]]});
        s+=text(316,152,'No turn',11);if(active)s+=arrow([228,83],[264,83]);break;
      }
      case 'hinge': {
        const p=active?{head:[259,107],shoulder:[235,120],hip:[172,146],leg:[[200,176],[204,208]],farLeg:[[174,178],[176,208]],arm:[[236,151],[235,178]],farArm:[[222,152],[224,179]]}:{...standing(),arm:[[211,116],[212,149]],farArm:[[188,118],[186,151]]};
        s+=person(p)+dumbbell(...p.arm[1])+dumbbell(...p.farArm[1]); if(active)s+=arrow([163,134],[125,134])+line([174,134],[239,108],ORANGE,2,'stroke-dasharray="4 4"');break;
      }
      case 'lunge': case 'splitSquat': {
        const low=active; const split=type==='splitSquat';
        const p=low?{head:[207,96],shoulder:[206,118],hip:[204,167],leg:[[247,169],[250,208]],farLeg:[[157,201],[117,208]],arm:[[223,143],[219,162]],farArm:[[190,143],[185,159]]}:split?{head:[201,58],shoulder:[202,80],hip:[202,135],leg:[[237,166],[251,208]],farLeg:[[155,164],[119,208]],arm:[[219,107],[224,132]],farArm:[[184,107],[178,130]]}:standing();
        s+=person(p);if(low)s+=arrow([287,124],[287,177]);if(type==='lunge'&&f===1)s+=arrow([176,224],[119,224]);break;
      }
      case 'pulldown': {
        s+=rect(119,30,8,181,MUTED)+line([123,35],[251,35],MUTED,6)+rect(166,174,85,10,MUTED)+line([204,183],[204,211],MUTED,6);
        const y=active?118: sixty();s+=line([204,37],[204,y],MUTED,2)+line([165,y],[246,y],INK,5);
        s+=person({head:[204,90],shoulder:[204,112],hip:[204,169],leg:[[245,174],[250,209]],farLeg:[[168,173],[161,210]],arm:[active?[236,136]:[232,89],[243,y]],farArm:[active?[174,137]:[178,86],[167,y]]});
        s+=arrow(active?[292,65]:[292,129],active?[292,127]:[292,65]);break;
      }
      case 'sidePlank': {
        s+=rect(80,210,261,5,SOFT);const y=active?174:193;
        s+=person({head:[132,133],shoulder:[153,151],hip:[222,y],leg:[[273,active?191:197],[322,208]],farLeg:[[276,active?192:201],[322,207]],arm:[[146,207],[111,207]],farArm:[[192,160],[221,y-5]]});
        s+=arrow(active?[226,194]:[226,166],active?[226,167]:[226,193]);break;
      }
      case 'sled': {
        s+=rect(278,195,93,13,MUTED)+line([299,195],[300,100],MUTED,8)+line([350,195],[350,119],MUTED,7)+rect(309,173,40,20,INK)+rect(314,163,30,10,ORANGE);
        const p={head:[251,88],shoulder:[233,108],hip:[185,151],arm:[[267,115],[299,109]],farArm:[[271,125],[298,120]],leg:f===2?[[156,183],[128,208]]:[[194,175],[211,208]],farLeg:f===2?[[203,168],[209,208]]:[[151,178],[124,208]]};
        s+=person(p)+arrow([312, seventy()],[367,seventy()]); break;
      }
      case 'ropes': {
        s+=rect(366,143,13,68,MUTED)+circ(369,162,5,INK);
        const a=f===0?[[158,132],[180,148]]:f===1?[[165,111],[186,99]]:[[158,149],[180,170]];
        const b=f===0?[[157,145],[179,161]]:f===1?[[158,153],[181,175]]:[[165,115],[184,103]];
        s+=person({head:[128,75],shoulder:[128,97],hip:[113,153],leg:[[145,179],[145,208]],farLeg:[[99,178],[86,208]],arm:a,farArm:b});
        if(f===0) s+=curve(`M180 148 Q260 204 369 162`,ORANGE,4)+curve(`M179 161 Q275 216 369 162`,MUTED,4);
        else {const y=a[1][1],z=b[1][1]; s+=curve(`M180 ${y} C207 ${y-30} 215 ${y+52} 240 148 S277 195 300 157 S339 147 369 162`,ORANGE,4)+curve(`M181 ${z} C208 ${z+15} 217 ${z-53} 241 163 S279 118 304 157 S340 181 369 162`,MUTED,4);}
        s+=arrow([214,97],[214,125])+arrow([224,175],[224,148]);break;
      }
      case 'bike': {
        s+=circ(151,180,28,SOFT)+circ(273,180,28,SOFT)+poly([[151,180],[185,139],[214,180],[151,180]],MUTED,4)+poly([[214,180],[258,132],[273,180]],MUTED,4)+line([172,134],[198,134],INK,5)+poly([[258,133],[261,101],[279,101]],MUTED,5)+circ(214,180,7,INK);
        const ankle=f===1?[218,201]:f===2?[204,159]:[232,183];
        s+=person({head:[219, sixty()],shoulder:[207,81],hip:[181,130],arm:[[244,93],[262,101]],farArm:[[231,103],[258,106]],leg:[[225,137],ankle],farLeg:[[190,163],[f===1?209:223,f===1?160:198]]});s+=line([214,180],ankle,ORANGE,3);break;
      }
      case 'walk':case 'warmup':case 'cooldown': {
        const high=type==='warmup', phase=f===2?-1:1;
        const p=f===0?standing():{head:[202, sixty()],shoulder:[202,82],hip:[201,143],leg:[[201+phase*23,high?152:174],[201+phase*33,high?175:207]],farLeg:[[201-phase*18,175],[201-phase*28,208]],arm:[[202-phase*25,107],[202-phase*28,high?88:124]],farArm:[[202+phase*23,108],[202+phase*32,133]]};
        s+=person(p);if(type==='cooldown')s+=curve(active?'M273 131 Q310 112 278 93':'M278 93 Q310 112 273 131',ORANGE,3)+text(318,161,active?'IN':'OUT',11);break;
      }
      case 'shadow':case 'coach': {
        const p={head:[190,67],shoulder:[190,89],hip:[193,145],leg:[[219,175],[235,208]],farLeg:[[173,178],[156,208]],arm:active?[[236,87],[279,85]]:[[217,105],[216, seventy()]],farArm:[[178,110],[190,79]]};
        s+=person(p); if(active)s+=arrow([250,64],[285,64]);if(type==='coach')s+=rect(320,115,41,52,SOFT)+poly([[329,140],[337,148],[351,129]],ORANGE,3)+text(341,183,'COACH',10);break;
      }
      case 'pushup': {
        const y=active?170:123;
        s+=person({head:[126,y-8],shoulder:[149,y],hip:[235,y+30],leg:[[285,active?193:181],[334,208]],farLeg:[[284,active?194:186],[326,209]],arm:[active?[125,190]:[150,165],[159,208]],farArm:[active?[144,187]:[169,166],[179,208]]});
        s+=arrow(active?[93,137]:[93,185],active?[93,184]:[93,138]); break;
      }
      case 'deadbug': {
        s+=rect(58,209,304,6,SOFT);
        s+=person({head:[122,190],shoulder:[147,197],hip:[216,198],leg:active?[[259,195],[303,204]]:[[219,151],[262,151]],farLeg:[[224,153],[261,151]],arm:active?[[108,199],[ seventy(),201]]:[[157,160],[160,126]],farArm:[[160,161],[163,126]]});
        if(active)s+=arrow([286,178],[316,198])+arrow([110,176],[ seventy(),187]);break;
      }
      case 'bridge': {
        s+=rect(84,209,258,6,SOFT);
        s+=person({head:[119,193],shoulder:[145,199],hip:[218,active?150:196],leg:[[267,146],[295,207]],farLeg:[[259,150],[283,207]],arm:[[175,205],[204,205]],farArm:[[178,209],[208,209]]});
        s+=arrow(active?[222,190]:[222,162],active?[222,164]:[222,190]);break;
      }
      case 'bandRow': {
        s+=rect(343,62,9,150,MUTED)+circ(343,116,4,ORANGE)+text(343,49,'ANCHOR',10);
        const hand=active?[215,127]:[275,116];s+=line([343,116],hand,ORANGE,3);
        s+=person({...standing(),arm:[active?[175,126]:[235,118],hand],farArm:[active?[182,134]:[238,125],[hand[0],hand[1]+5]]});
        s+=arrow(active?[274,92]:[224,92],active?[226,92]:[274,92]);break;
      }
      case 'rest': {
        s+=rect(161,167,91,12,MUTED)+line([170,180],[170,209],MUTED,6)+line([239,180],[239,209],MUTED,6);
        s+=person({head:[194,84],shoulder:[194,106],hip:[199,164],leg:[[247,166],[248,208]],farLeg:[[227,171],[224,208]],arm:[[215,139],[242,161]],farArm:[[183,136],[194,166]]});
        s+=circ(307,106,active?24:18,SOFT)+text(307,110,f===0?'REST':active?'IN':'OUT',11);break;
      }
    }
    const dots=[0,1,2].map(i=>circ(365+i*12,16,3.5,i===f?ORANGE:'#d0d4c8')).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="${esc(meta[0]+': '+meta[1][f])}" style="width:100%;height:auto;display:block"><title>${esc(meta[0]+' — '+meta[2][f]+': '+meta[1][f])}</title><rect width="420" height="260" rx="14" fill="#f8f5ed"/>${text(17,21,meta[2][f],10,ORANGE,'start')}${dots}${s}${text(210,246,meta[1][f],12)}</svg>`;
  }
  function sixty(){return 60;}
  function seventy(){return 70;}
  window.ExerciseDemo = { render, count:3, types:Object.keys(info) };
})();
