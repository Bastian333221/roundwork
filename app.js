(() => {
  'use strict';
  const DATA = window.BOXING_DATA;
  const main = document.getElementById('main');
  if (!DATA) { main.innerHTML = '<div class="empty-state">The training guide could not load. Refresh this page to try again.</div>'; return; }
  const STORAGE_KEY = 'roundwork.v1';
  const $ = s => document.querySelector(s);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const exById = new Map((DATA.exercises || []).map(e => [e.id,e]));
  const gearById = new Map((DATA.equipment || []).map(e => [e.id,e]));
  const days = DATA.days || [];
  const baseState = {week:2,day:days[0]?.id || 'monday',equipment:{},coachLoad:'unknown',readiness:'normal',notes:'',logs:{},sessions:{},swaps:{},sessionSettings:{}};
  let state = {...baseState};
  let storageWorks = true;
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (saved && typeof saved === 'object') state = {...baseState,...saved}; }
  catch (_) { storageWorks = false; }
  if (!Number.isInteger(state.week) || state.week < 1 || state.week > 8) state.week = 2;
  if (!days.some(d => d.id === state.day)) state.day = days[0]?.id;
  for (const key of ['equipment','logs','sessions','swaps']) if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
  if (!['unknown','technical','hard'].includes(state.coachLoad)) state.coachLoad = 'unknown';
  if (!['normal','tired'].includes(state.readiness)) state.readiness = 'normal';
  if (typeof state.notes !== 'string') state.notes = '';
  state.sessionSettings=window.RoundworkPlanner?.cleanSettings(state.sessionSettings)||{};
  let activeTab = ['session','plan','exercises','gym','sources'].includes(location.hash.slice(1)) ? location.hash.slice(1) : location.hash.startsWith('#source-')?'sources':'session';
  let librarySearch = '', libraryCategory = 'all', modal = null, demoInterval = null, lastFocus = null;
  let toastTimeout;
  const timer = {duration:60,remaining:60,running:false,deadline:0,label:'REST TIMER',finished:false};
  function persist() {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); storageWorks = true; }
    catch (_) { storageWorks = false; }
    updateSaveStatus();
  }
  function updateSaveStatus() { $('#save-status').textContent = storageWorks ? 'Preferences & logs stay on this device.' : 'Storage unavailable. Changes last only while this page is open.'; }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('show'),3300); }
  function gearStatus(id) { return ['yes','no'].includes(state.equipment[id]) ? state.equipment[id] : 'unknown'; }
  function availability(ex) {
    const equipment = ex.equipment || [];
    if (equipment.some(id => gearStatus(id) === 'no')) return 'no';
    if (equipment.some(id => gearStatus(id) === 'unknown')) return 'unknown';
    return 'yes';
  }
  function equipmentNames(ex) { return (ex.equipment || []).map(id => gearById.get(id)?.name || id); }
  function logKey(day,original) { return `${state.week}:${day}:${original}`; }
  function sessionKey() { return `${state.week}:${state.day}`; }
  function getAlternatives(ex) { return (ex.alternatives || []).map(id => exById.get(typeof id === 'string' ? id : id.id)).filter(Boolean); }
  function resolveExercise(original) {
    const originalEx = exById.get(original);
    if (!originalEx) return null;
    const candidates = [originalEx,...getAlternatives(originalEx)];
    const manual = state.swaps[logKey(state.day,original)];
    if (manual) {
      const selected = candidates.find(e => e.id === manual);
      if (selected && availability(selected) !== 'no') return selected;
    }
    if (availability(originalEx) !== 'no') return originalEx;
    return candidates.find(e => availability(e) === 'yes') || candidates.find(e => availability(e) === 'unknown') || originalEx;
  }
  function getDose(item,ex,options={}) {
    if(item.adaptedDose)return item.adaptedDose;
    let dose = {...item};
    const progression = item.progression || {};
    for (const week of Object.keys(progression).map(Number).filter(n => n <= (options.week ?? state.week)).sort((a,b) => a-b)) dose = {...dose,...progression[week]};
    if (ex?.id !== item.exercise && ex?.doseOverride) dose = {...dose,...ex.doseOverride};
    const planned = {...dose};
    const gated = !!item.conditioning && (state.coachLoad !== 'technical' || state.readiness === 'tired');
    if (gated && item.techniqueDose) {
      if (typeof item.techniqueDose === 'object') dose = {...dose,...item.techniqueDose};
      else dose = {...dose,reps:item.techniqueDose,notes:'Easy equipment familiarisation only; no hard intervals.'};
      if (ex?.id !== item.exercise && ex?.techniqueDoseOverride) dose = {...dose,...ex.techniqueDoseOverride};
    }
    if (ex?.id !== item.exercise && ex?.doseOverride && gated) dose={...dose,...ex.doseOverride,...(ex.techniqueDoseOverride || {})};
    if (state.readiness === 'tired') {
      const sets = Number(dose.sets);
      if (Number.isFinite(sets) && sets > 1) dose.sets = Math.max(1,sets-1);
      const category = String(ex?.category || '').toLowerCase();
      if (/aerobic|cardio/.test(category) && dose.seconds) { dose.seconds = Math.round(Number(dose.seconds)*.75); dose.reps = `${Math.round(dose.seconds/60)} min easy`; }
    }
    dose.planned = planned;
    dose.gated = gated;
    dose.skip = gated && !item.techniqueDose;
    return dose;
  }
  function sessionChoice() { return window.RoundworkPlanner.cleanChoice(state.sessionSettings?.[sessionKey()],state.day); }
  function currentSession() {
    const day=days.find(d=>d.id===state.day)||days[0],choice=sessionChoice();
    return window.RoundworkPlanner.plan(day,choice,state,resolveExercise,(item,ex)=>getDose(item,ex,{week:choice.progressionReady?state.week:2}),id=>exById.get(id));
  }
  function exerciseFor(item) { return item?.selectedExercise || resolveExercise(item?.exercise); }
  function sessionOptions(plan,boxingWeek) {
    const c=plan.choice,disabled=boxingWeek?'':'disabled';
    return `<section class="session-options" aria-labelledby="session-options-title"><div class="section-heading"><h2 id="session-options-title">Choose this day’s session</h2><span>Saved for this week and day</span></div><div class="session-option-grid"><div><label class="form-label" for="level-select">Exercise level</label><select class="panel-select" id="level-select" aria-describedby="level-help" ${disabled}>${window.RoundworkPlanner.levels.map(level=>`<option value="${level}" ${c.level===level?'selected':''}>${{rookie:'Rookie',intermediate:'Intermediate',advanced:'Advanced'}[level]}</option>`).join('')}</select></div><div><label class="form-label" for="duration-select">Time available</label><select class="panel-select" id="duration-select" ${disabled}>${window.RoundworkPlanner.times.map(minutes=>`<option value="${minutes}" ${c.minutes===minutes?'selected':''}>${minutes} minutes</option>`).join('')}</select></div></div><p id="level-help">Choose by your experience with boxing-support exercises, not only your lifting strength. Rookie learns the basics; Intermediate knows the movements; Advanced has consistent training and coach-reviewed technique.</p>${boxingWeek&&plan.kind==='gym'?`<label class="progression-choice"><input type="checkbox" id="progression-ready" ${c.progressionReady?'checked':''}> <span>I am recovered and ready for this boxing week’s progression.</span></label><p class="plan-timing"><span>Estimated training:</span> <strong>${plan.minutes} min</strong> <span>within</span> <strong>${c.minutes} min</strong> <span>available</span></p><p class="session-day-note">Includes warm-up, cooldown, work, rests, equipment setup and transitions. Time for gym queues or learning a movement varies.</p>` : ''}${boxingWeek&&plan.kind!=='gym'?`<p class="session-day-note">${esc(plan.notes[0])}</p>`:''}${!boxingWeek?'<p>Your lifting routine stays unchanged. Level and time adaptation apply to the boxing-focused gym days.</p>':''}${boxingWeek?`<details class="adaptation-notes"><summary>How this session adapts</summary><ul>${plan.notes.map(note=>`<li>${esc(note)}</li>`).join('')}</ul><p>Resistance work includes weights, bodyweight, bands and cables when available. Power, aerobic work and conditioning are balanced across the week; a short session does not have to contain every category.</p><button class="text-button" data-go="sources">Planning evidence & limits ↗</button></details>`:''}${Object.keys(state.logs).some(key=>key.startsWith(sessionKey()+':'))?'<p class="session-day-note">Changing choices does not erase completed work. Do not repeat exercises already completed today.</p>':''}</section>`;
  }
  function categoryClass(category) { const c = String(category).toLowerCase(); return /power|explosive/.test(c) ? 'power' : /strength|resistance/.test(c) ? 'strength' : /conditioning|aerobic|cardio/.test(c) ? 'conditioning' : 'technique'; }
  function categoryTag(category) { return `<span class="category-tag ${categoryClass(category)}">${esc(category)}</span>`; }
  function svgFor(ex,frame=0) {
    try { return window.ExerciseDemo?.render(ex.demo || ex.id,frame) || '<span class="eyebrow">Follow the step-by-step guide</span>'; }
    catch (_) { return '<span class="eyebrow">Follow the step-by-step guide</span>'; }
  }
  function heroArt() { return '<svg class="hero-art" viewBox="0 0 180 220" fill="none" aria-hidden="true"><circle cx="93" cy="40" r="16" stroke="#d7df75" stroke-width="7"/><path d="M85 61 70 111 104 129 111 177M70 111 44 160 29 204M86 73 119 91 139 55M78 77 50 96 30 69M102 130 129 168 160 174" stroke="#d7df75" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="m24 65 11-7 11 13-11 9ZM135 40l15 7-5 19-16-6Z" fill="#eb5227"/></svg>'; }
  function weekSelect() { return `<div class="week-selector-wrap"><label class="form-label" for="week-select">Your training block</label><select id="week-select" class="week-selector">${Array.from({length:8},(_,i) => `<option value="${i+1}" ${state.week===i+1?'selected':''}>Week ${i+1} · ${i%2===0?'Lifting':'Boxing'}</option>`).join('')}</select></div>`; }
  function render() {
    document.querySelectorAll('[data-tab]').forEach(button => { const selected = button.dataset.tab === activeTab; button.classList.toggle('active',selected); if (selected) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); });
    const unknown = DATA.equipment.filter(e => gearStatus(e.id) === 'unknown').length;
    $('#gym-count').textContent = unknown ? String(unknown) : '✓';
    $('#gym-count').setAttribute('aria-label',unknown ? `${unknown} equipment items to confirm` : 'Equipment reviewed');
    if (activeTab === 'session') renderSession();
    else if (activeTab === 'plan') renderPlan();
    else if (activeTab === 'exercises') renderLibrary();
    else if (activeTab === 'sources') renderSources();
    else renderGym();
    updateSaveStatus();
  }
  function sidebar() {
    const day = days.find(d => d.id === state.day), items = currentSession().items;
    const completeCount = items.filter(item => state.logs[logKey(state.day,item.exercise)]).length;
    return `<aside class="session-sidebar"><section class="readiness-panel"><div class="eyebrow">BEFORE YOU START</div><h3 class="readiness-title">How are you feeling?</h3><p class="readiness-intro">Keep quality high. Adjust today to your recovery.</p><div class="readiness-options"><button class="readiness-button ${state.readiness==='normal'?'active':''}" data-readiness="normal" aria-pressed="${state.readiness==='normal'}">Ready to train</button><button class="readiness-button ${state.readiness==='tired'?'active':''}" data-readiness="tired" aria-pressed="${state.readiness==='tired'}">Feeling tired</button></div><div class="coach-settings"><label class="form-label" for="coach-load">This week's coached sessions</label><select id="coach-load" class="panel-select"><option value="unknown" ${state.coachLoad==='unknown'?'selected':''}>Not confirmed yet</option><option value="technical" ${state.coachLoad==='technical'?'selected':''}>Mostly technical / light</option><option value="hard" ${state.coachLoad==='hard'?'selected':''}>Hard conditioning / sparring</option></select><p style="margin:9px 0 0">Hard gym conditioning stays off until your coaching load is confirmed light.</p></div></section><section class="sidebar-panel"><div class="eyebrow">THE TRAINING INTENT</div><h3>Fast. Strong. Ready.</h3><div class="balance-key"><span><i></i> Power: fresh, short, fully rested</span><span><i></i> Strength: controlled, never grinding</span><span><i></i> Conditioning: matched to coaching</span></div><p style="margin-top:16px;margin-bottom:0">Power first. Strength next. Conditioning last. Resistance training is the method; strength and power are the goals.</p></section><section class="sidebar-panel"><div class="eyebrow">TODAY'S PROGRESS</div><h3>${completeCount}<span style="color:var(--muted);font-weight:400"> / ${items.length}</span> complete</h3><div class="progress-track"><span style="width:${items.length?completeCount/items.length*100:0}%"></span></div><p>Mark each exercise after its prescribed sets. Your record stays with this week and day.</p><button class="text-button" data-action="reset-session">Reset today's log</button></section></aside>`;
  }
  function renderSession() {
    const boxingWeek = state.week%2===0;
    const day = days.find(d => d.id === state.day) || days[0];
    const plan=currentSession(),items=plan.items;
    const unknown = DATA.equipment.filter(e => gearStatus(e.id) === 'unknown').length;
    main.innerHTML = `<div class="page-intro"><div><div class="page-kicker">YOUR GYM COMPANION / ADAPTABLE 8-WEEK BLOCK</div><h1 class="page-title">Make every<br>round count<span style="color:var(--orange)">.</span></h1><p class="page-description">A clear plan. The right equipment. Better work between boxing sessions.</p></div>${weekSelect()}</div><div class="session-layout"><div><section class="hero"><div class="eyebrow"><span class="status-dot"></span> WEEK ${state.week} · ${boxingWeek?'BOXING FOCUS':'YOUR LIFTING ROUTINE'}</div><h2>${boxingWeek?esc(day?.title || 'Build your foundation'):'Keep your<br>lifting rhythm.'}</h2><p>${boxingWeek?esc(plan.kind==='gym'?'Today’s exercise list reflects your level, time, equipment and recovery.':day?.description || ''):'Your established split stays yours. Thursday and Saturday coaching continue as separate sessions.'}</p><div class="hero-stats"><span>◷ ${boxingWeek?esc(plan.kind==='gym'?plan.minutes+' min':day?.minutes||'Rest'):'90–105 min'}${boxingWeek?'':' / LIFTING'}</span><span>${boxingWeek?`${items.length} MOVEMENTS`:'UNCHANGED SPLIT'}</span><span>WEEK ${state.week} OF 8</span></div>${heroArt()}</section>${boxingWeek?`<div class="day-tabs" aria-label="Training day">${days.map(d => `<button class="day-tab ${d.id===state.day?'active':''}" data-day="${esc(d.id)}" aria-pressed="${d.id===state.day}"><span class="day-full">${esc(d.label)}</span><span class="day-short">${esc(d.label.slice(0,3))}</span><small>${esc(d.short || (/coach/i.test(d.title)?'COACH':(['fri','sun'].includes(d.id)?'RECOVER':'GYM')))}</small></button>`).join('')}</div>${sessionOptions(plan,boxingWeek)}${unknown?`<div class="notice"><div><strong>Make the plan fit your gym.</strong>Confirm your equipment before training. Missing gear gets an available alternative.</div><button class="text-button" data-go="gym">Check gear ↗</button></div>`:''}${state.readiness==='tired'?'<div class="notice warning"><div><strong>Recovery adjustment is on.</strong>Reduced strength and power work, shorter easy cardio, and no hard conditioning. Stop if movement quality falls.</div></div>':''}<div class="section-heading"><h2>${items.length?'Your session':'Today’s priority'}</h2><span>${esc(day?.label || '')} · SELECTED MANUALLY</span></div><p class="session-day-note">${esc(plan.kind!=='gym'?plan.notes[0]:day?.note || 'Follow the adapted dose below. Keep the prescribed rests and finish with your cooldown when your available time is up.')}</p><div class="exercise-list">${items.map((item,i) => exerciseCard(item,i)).join('') || `<section class="recovery-card"><div class="page-kicker">${/coach/i.test(day?.title || '')?'COACH-LED SESSION':'RECOVERY IS TRAINING'}</div><h3>${esc(day?.title || 'Rest and recover')}</h3><p>${esc(day?.description || 'Take a rest day or a comfortable walk. Return ready for quality work.')}</p><p>${esc(day?.details || 'Let your coach direct boxing technique, sparring, and competition preparation.')}</p></section>`}</div><div class="complete-session"><p class="${state.sessions[sessionKey()]?'session-complete-note':''}">${state.sessions[sessionKey()]?'✓ Session recorded on this device.':'No streaks. Just consistent, quality work.'}</p><button class="button button-dark" data-action="complete-session">${state.sessions[sessionKey()]?'Edit session log':'Finish session →'}</button></div>`:sessionOptions(plan,false)+weekAContent()}</div>${sidebar()}</div>`;
  }
  function weekAContent() { return `<section class="week-a-empty" style="margin-top:19px"><div class="page-kicker">WEEK A / YOUR EXISTING PROGRAMME</div><h3>Lift the way you already do.</h3><p>Your exercises, split, and lifting progression stay unchanged. This app prescribes the boxing-focused weeks; it does not add a second lifting programme on top of Week A.</p><div class="lifting-flow"><span>Chest + back</span><span>Legs</span><span>Shoulders + arms</span><span>Repeat ↻</span></div><p><strong>Thursday + Saturday:</strong> coached boxing, 45–60 minutes. When lifting lands on a coaching day, keep the sessions separate. The 105-minute ceiling is per session.</p><p>There is no automatic calendar reset. Select your current week when you are ready.</p><button class="button button-primary" data-action="next-boxing">Preview next boxing week ↗</button></section>`; }
  function exerciseCard(item,index) {
    const original = exById.get(item.exercise), ex = exerciseFor(item);
    if (!original || !ex) return '';
    const dose = getDose(item,ex), available = availability(ex), done = !!state.logs[logKey(state.day,item.exercise)];
    const record=state.logs[logKey(state.day,item.exercise)];
    const previousDose=done && JSON.stringify(record.dose)!==JSON.stringify(dose);
    const substituted = original.id !== ex.id;
    const note = dose.notes || '';
    const equipment = (ex.equipment || []).map(id => `<span class="equipment-chip ${gearStatus(id)==='unknown'?'unknown':gearStatus(id)==='no'?'missing':''}">${esc(gearById.get(id)?.name || id)}${gearStatus(id)==='unknown'?' · confirm':gearStatus(id)==='no'?' · unavailable':''}</span>`).join('') || '<span class="equipment-chip">No equipment needed</span>';
    const restSeconds = parseDuration(dose.rest);
    const workSeconds = Number(dose.seconds) || 0;
    return `<article class="exercise-card ${done?'completed':''}" data-original="${esc(item.exercise)}"><div class="card-top"><span class="exercise-number">${String(index+1).padStart(2,'0')}</span><div class="exercise-main">${categoryTag(ex.category)}<h3 class="exercise-name">${esc(ex.name)}</h3><p class="exercise-purpose">${esc(ex.purpose)}</p><div class="equipment-line">${equipment}</div></div><button class="check-button ${done?'done':''}" data-complete="${esc(item.exercise)}" aria-label="${done?'Mark incomplete':'Mark complete'}: ${esc(ex.name)}" aria-pressed="${done}">${done?'✓':'○'}</button></div>${previousDose?'<p class="exercise-note">Completed with an earlier prescription. Do not repeat this slot today.</p>':''}${substituted?`<p class="exercise-note substitute"><strong>Replaces ${esc(original.name)}.</strong> ${esc(ex.substitutionNote || original.substitutionNote || 'Same training slot; the movement and transfer differ. Follow the dose shown here.')}</p>`:''}<div class="dose-row"><div class="dose"><strong>${esc(dose.sets ?? '—')}</strong><small>SETS</small></div><div class="dose"><strong>${esc(dose.reps || (workSeconds?`${workSeconds} sec`:'As coached'))}</strong><small>${/min|sec/.test(String(dose.reps))?'DURATION':'REPETITIONS / DISTANCE'}</small></div><div class="dose"><strong>${esc(dose.rest ? dose.rest + ' sec' : '—')}</strong><small>REST</small></div></div>${dose.gated?`<p class="exercise-note"><strong>${dose.skip?'Skip hard conditioning.':'Easy practice only.'}</strong> ${state.readiness==='tired'?'Recovery mode is on.':state.coachLoad!=='technical'?'Coaching load is not confirmed light.':'Rookie uses easy equipment practice.'}</p>`:''}${note?`<p class="exercise-note">${esc(note)}</p>`:''}${available==='no'?`<p class="exercise-note"><strong>No suitable confirmed alternative.</strong> ${esc(ex.noEquipmentNote || 'Skip this exercise until suitable equipment is available. A different movement may not replace its training benefit.')}</p>`:''}<div class="card-actions">${getAlternatives(original).length && sessionChoice().level!=='rookie'?`<button class="text-button" data-swap="${esc(item.exercise)}">Swap</button>`:''}${available==='unknown'?'<button class="text-button" data-go="gym">Confirm gear</button>':''}${restSeconds?`<button class="text-button" data-timer="${restSeconds}" data-timer-label="Rest · ${esc(ex.name)}">◷ Rest</button>`:''}${workSeconds&&!dose.skip?`<button class="text-button" data-timer="${workSeconds}" data-timer-label="Work · ${esc(ex.name)}">◷ Work</button>`:''}<button class="button button-dark" data-guide="${esc(ex.id)}">View guide <span aria-hidden="true">↗</span></button></div></article>`;
  }
  function renderPlan() {
    const review = DATA.review || {summary:'A foundation programme for boxing, built around recovery and coached practice.',points:[]};
    main.innerHTML = `<div class="page-intro"><div><div class="page-kicker">THE BIG PICTURE</div><h1 class="page-title">Built for the<br>long round<span style="color:var(--orange)">.</span></h1><p class="page-description">Alternate the emphasis. Keep your lifting intact. Progress the boxing work with intent.</p></div><span class="pill">8 WEEKS · 4 BOXING BLOCKS</span></div><div class="week-cards"><section class="week-card"><div class="eyebrow">WEEKS 1 / 3 / 5 / 7</div><h2>Your lifting week.</h2><p>Chest + back → legs → shoulders + arms → repeat. Keep the lifting routine you already know. Thursday and Saturday boxing coaching continue, in separate sessions when needed.</p><span class="pill">EXISTING PROGRAMME UNCHANGED</span></section><section class="week-card dark"><div class="eyebrow">WEEKS 2 / 4 / 6 / 8</div><h2>Your boxing week.</h2><p>Monday: power + strength + sled. Tuesday: technique + aerobic work + optional ropes. Wednesday: power + strength. Thursday and Saturday: coaching. Friday and Sunday: recover.</p><span class="pill">POWER → STRENGTH → CONDITIONING</span></section></div><section class="section-space"><div class="section-heading"><h2>The balance, reviewed.</h2><span>QUALITY COMES FIRST</span></div><p class="page-description">${esc(review.summary)}</p><div class="review-grid">${review.points.map((point,i) => `<div class="review-item"><span class="review-num">0${i+1} / TRAINING PRINCIPLE</span>${esc(typeof point==='string'?point.startsWith('All boxing-week sessions are under 105')?'Select 30–120 minutes for a boxing-focused gym day. The planner fits work and recovery inside that budget; lifting stays unchanged and coaching remains coach-led.':point:point.text || point.detail || '')}</div>`).join('')}</div></section><section class="section-space"><div class="section-heading"><h2>Progress without rushing.</h2><span>THE DOSES UPDATE WITH YOUR WEEK</span></div><div class="progression-grid">${(DATA.progression || []).map(p => `<article class="progression-card"><div class="eyebrow">WEEK ${esc(p.week)}</div><h3>${esc(p.title)}</h3><p>${esc(p.detail)}</p></article>`).join('')}</div><div class="notice"><div><strong>Progress is earned, not automatic.</strong>The later weeks show planned increases. Stay on an earlier week if technique, recovery, or coaching quality declines. Week 8 consolidates; it is not a test week.</div></div></section><section class="section-space"><div class="section-heading"><h2>Coaching stays at the centre.</h2></div><p class="page-description">This is a gym foundation, not a fight camp or a clearance to compete. Ask your coach to review your gym workload, shadowboxing themes, and tournament readiness. Demonstrations are simplified visual cues; use an in-person demonstration for unfamiliar movements.</p></section><section class="section-space"><div class="section-heading"><h2>Where the plan comes from.</h2><span>EXPERT SOURCES + PROGRAMMING JUDGEMENT</span></div><div class="sources-list">${(DATA.sources || []).map(s => `<a class="source-item" href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(s.label)} ↗</strong><p>${esc(s.note || '')}</p></a>`).join('')}</div></section>`;
  }
  function renderLibrary() {
    const categories = [...new Set(DATA.exercises.map(e => e.category))];
    main.innerHTML = `<div class="page-intro"><div><div class="page-kicker">THE MOVEMENT LIBRARY</div><h1 class="page-title">Know the move<span style="color:var(--orange)">.</span></h1><p class="page-description">Equipment, setup, step-by-step visual cues, and alternatives—ready when you reach the gym.</p></div></div><div class="library-controls"><label class="sr-only" for="exercise-search" style="position:absolute;width:1px;height:1px;overflow:hidden">Find an exercise</label><input class="search-input" id="exercise-search" type="search" placeholder="Search a movement or equipment…" value="${esc(librarySearch)}"><label class="sr-only" for="category-filter" style="position:absolute;width:1px;height:1px;overflow:hidden">Filter by training category</label><select id="category-filter" class="filter-select"><option value="all">All movements</option>${categories.map(c => `<option value="${esc(c)}" ${c===libraryCategory?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div id="library-results"></div>`;
    renderLibraryResults();
  }
  function renderLibraryResults() {
    const fold = window.RoundworkI18n?.fold || (value => String(value).toLowerCase());
    const translate = value => window.RoundworkI18n?.translate(value,'es') || value;
    const query = fold(librarySearch.trim());
    const exercises = DATA.exercises.filter(e => (libraryCategory==='all'||e.category===libraryCategory) && fold([e.name,e.purpose,...equipmentNames(e)].flatMap(value=>[value,translate(value)]).join(' ')).includes(query));
    $('#library-results').innerHTML = exercises.length ? `<div class="section-heading"><span>${exercises.length} MOVEMENTS & ALTERNATIVES</span><span>ILLUSTRATIONS + VIDEOS</span></div><div class="library-grid">${exercises.map(ex => `<article class="library-card"><div class="library-art">${categoryTag(ex.category)}${svgFor(ex,1)}</div><div class="library-body"><h3>${esc(ex.name)}</h3><p>${esc(ex.purpose)}</p><div class="library-bottom"><span>${esc(equipmentNames(ex).join(' + ') || 'Bodyweight · no equipment')}</span><button class="button button-dark button-small" data-guide="${esc(ex.id)}">See guide ↗</button></div></div></article>`).join('')}</div>` : '<div class="empty-state">No movements match your search. Try a different name or equipment type.</div>';
  }
  function renderGym() {
    const yes = DATA.equipment.filter(e => gearStatus(e.id)==='yes').length;
    const unknown = DATA.equipment.filter(e => gearStatus(e.id)==='unknown').length;
    main.innerHTML = `<div class="page-intro"><div><div class="page-kicker">MAKE IT WORK WHERE YOU TRAIN</div><h1 class="page-title">Your gym.<br>Your options<span style="color:var(--orange)">.</span></h1><p class="page-description">Tell us what is available. The session swaps missing equipment for a confirmed alternative whenever possible.</p></div></div><div class="gym-form"><div class="notice"><div><strong>“Not sure” is never treated as available.</strong>Check the equipment in person. A medicine-ball wall must be approved for throwing, and a sled needs a suitable clear lane.</div></div><div class="gym-topline"><span>${yes} AVAILABLE · ${unknown} TO CONFIRM</span><button class="text-button" data-action="reset-equipment">Reset equipment choices</button></div><div class="gym-grid">${DATA.equipment.map(e => `<div class="equipment-item"><strong id="gear-label-${esc(e.id)}">${esc(e.name)}</strong><div class="segmented" role="group" aria-labelledby="gear-label-${esc(e.id)}">${[['yes','Yes'],['no','No'],['unknown','?']].map(([value,label]) => `<button class="segment ${gearStatus(e.id)===value?'active':''}" data-gear="${esc(e.id)}" data-value="${value}" aria-label="${esc(e.name)}: ${value==='unknown'?'not sure':value}" aria-pressed="${gearStatus(e.id)===value}">${label}</button>`).join('')}</div></div>`).join('')}</div><section class="section-space"><label class="form-label" for="gym-notes">Describe your gym / notes for your coach</label><textarea class="notes-field" id="gym-notes" placeholder="For example: sled lane is upstairs; ropes need staff to attach the anchor; only a 4 kg medicine ball is available…">${esc(state.notes)}</textarea><p class="notes-help">These are saved notes, not an AI equipment assessment. Use the checklist above to change your exercise options. Nothing is sent to a coach or server.</p></section><button class="button button-primary" data-go="session">Back to my session ↗</button></div>`;
  }
  function safeUrl(url) { try { const u = new URL(url); return ['https:','http:'].includes(u.protocol) ? esc(u.href) : '#'; } catch (_) { return '#'; } }
  function renderSources() {
    const evidence=window.ROUNDWORK_EVIDENCE;
    const types={research:'Peer-reviewed research',guideline:'Guideline / consensus',practice:'Professional coaching / technique'};
    const guides=new Map();
    DATA.exercises.forEach(ex=>{if(!ex.source?.url)return;const key=ex.source.url;if(!guides.has(key))guides.set(key,{...ex.source,movements:[]});guides.get(key).movements.push(ex.name);});
    // Include specialist articles used for the plan as well as per-movement demonstration links.
    DATA.sources.forEach(source=>{if(!guides.has(source.url)&&!evidence.sources.some(s=>s.url===source.url))guides.set(source.url,{...source,movements:[]});});
    main.innerHTML=`<div class="page-intro"><div><div class="page-kicker">READ THE BASIS FOR YOUR TRAINING</div><h1 class="page-title">Evidence & sources<span style="color:var(--orange)">.</span></h1><p class="page-description">See what was consulted, what it supports, and where the evidence ends.</p></div></div><section class="evidence-intro"><h2>Research informs the plan. It does not certify it.</h2><p>ROUNDWORK combines published research, sports medicine guidance and professional coaching resources. The exact alternating schedule, exercise choices and doses are an adaptation to your training constraints; this complete routine has not been tested in a clinical or boxing trial.</p><p>Study findings below are short app-written summaries, not copied articles. Original publication details and links let you check the source yourself. Scientific summaries remain readable offline after the app is saved; external articles require internet and some full texts require access.</p><span class="pill">SOURCE REVIEW · 8 OCTOBER 2026</span></section><section class="section-space"><div class="section-heading"><h2>From evidence to your workout</h2></div><p class="page-description">These links explain the rationale for each block. Demonstration references are listed separately below.</p><div class="evidence-map">${evidence.groups.map((group,i)=>`<article id="block-${i}" class="evidence-block"><h3>${esc(group.title)}</h3><p>${group.exercises.map(id=>esc(exById.get(id).name)).join(' · ')}</p><div class="evidence-links">${group.ids.map(id=>{const source=evidence.sources.find(s=>s.id===id);return `<a href="#source-${esc(id)}">${esc(source.title)} ↓</a>`}).join('')}</div></article>`).join('')}</div></section><section class="section-space"><div class="section-heading"><h2>Research, guidelines & professional resources</h2></div><div class="evidence-list">${evidence.sources.map(source=>`<article id="source-${esc(source.id)}" class="evidence-card"><div class="eyebrow">${esc(types[source.type])}</div><h3>${esc(source.title)}</h3><p class="evidence-citation" data-no-i18n>${esc(source.citation)}</p>${source.doi?`<p class="evidence-doi" data-no-i18n>DOI: ${esc(source.doi)}</p>`:''}<p class="evidence-design">${esc(source.design)}</p>${source.originalTitle?`<details class="evidence-publication"><summary>Publication title</summary><p data-no-i18n>${esc(source.originalTitle)}</p></details>`:''}<dl><dt>What the source says</dt><dd>${esc(source.finding)}</dd><dt>How we use it</dt><dd>${esc(source.application)}</dd><dt>What it does not establish</dt><dd>${esc(source.limit)}</dd></dl><a class="button button-dark button-small" href="${safeUrl(source.url)}" target="_blank" rel="noopener noreferrer">Open original source ↗</a></article>`).join('')}</div></section><section class="section-space"><div class="section-heading"><h2>Exercise guide directory</h2></div><p class="page-description">These are technique and coaching references. A demonstration is not evidence that an exercise increases punch power. Library references cover general movement patterns; the app’s alternatives are adaptations.</p><div class="sources-list">${[...guides.values()].map(source=>`<a class="source-item" href="${safeUrl(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.label)} ↗</strong><p>${source.movements.length?source.movements.map(name=>esc(name)).join(' · '):esc(source.note || '')}</p></a>`).join('')}</div></section><section class="section-space"><div class="section-heading"><h2>Demonstration video directory</h2></div><p class="page-description">Publisher-hosted videos were located on 6 October 2026. They demonstrate technique; they do not validate this workout or its effects on punch power. Video notes explain differences from the prescribed variation. Original audio and available captions are controlled by the publisher.</p><div class="sources-list">${DATA.exercises.filter(ex=>window.ROUNDWORK_VIDEOS?.[ex.id]?.id).map(ex=>{const v=window.ROUNDWORK_VIDEOS[ex.id];return `<a class="source-item" href="${safeUrl(v.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(ex.name)} ↗</strong><p><span data-no-i18n>${esc(v.provider)}</span> · ${esc(v.title)}</p></a>`;}).join('')}</div></section><section class="evidence-intro section-space"><h2>Level and time adaptation</h2><p>Rookie uses simpler resistance movements and easy conditioning practice. Intermediate uses familiar power and strength work. Advanced adds controlled volume and longer rests, without maximal lifts or all-out finishers. Short sessions remove optional work; longer sessions mainly extend easy cardio, and may finish well before the selected time.</p><p>The estimate includes work, every displayed rest, warm-up, cooldown and setup time. Time saved is not converted into harder intervals. Technique, recovery and coaching load override the level choice. Select progression only after the previous boxing block was well tolerated.</p></section><section class="evidence-intro section-space"><h2>How the numbers were chosen</h2><p>Sled 4 × 15 m / 120 s rest and ropes 6 × 20 s / 40 s rest are intermediate starting prescriptions for this schedule, not doses proven to improve punching in a trial. Later weeks increase volume only when technique and recovery permit. Coaching intensity and tiredness reduce the hard blocks.</p><p>Level-based repetitions in reserve, recovery days, equipment substitutions and the 30–120-minute time menu are practical programming choices. The adaptation rules are not a tested boxing intervention or a guarantee of safety. Lifting stays unchanged; a qualified coach should review workload and unfamiliar equipment.</p><button class="button button-primary" data-go="session">Back to my session ↗</button></section>`;
  }
  function parseDuration(value) {
    if (typeof value === 'number') return value;
    const text = String(value || '').toLowerCase();
    const match = text.match(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(min|sec|s\b|m\b)/);
    if (!match) return 0;
    return Math.round(Number(match[2] || match[1]) * (/^m/.test(match[3])?60:1));
  }
  function openModal(html,type,details={}) {
    closeModal(false);
    lastFocus = document.activeElement;
    modal = {type,...details};
    $('#modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal ${type==='guide'?'':'small-modal'}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">${html}</section></div>`;
    document.body.style.overflow = 'hidden';
    $('#modal-root .icon-button[data-close]')?.focus();
  }
  function closeModal(restore=true) {
    clearInterval(demoInterval); demoInterval = null;
    $('#modal-root').innerHTML = ''; document.body.style.overflow = ''; modal = null;
    if (restore && lastFocus?.isConnected) lastFocus.focus();
  }
  function modalHeader(kicker,title) { const lang=window.RoundworkI18n?.language || 'en'; return `<header class="modal-header"><div><div class="eyebrow">${esc(kicker)}</div><h2 id="modal-title">${esc(title)}</h2></div><div class="modal-tools"><div class="language-switch modal-language" role="group" aria-label="${lang==='es'?'Idioma de la aplicación':'App language'}" data-no-i18n><button data-language="en" lang="en" aria-label="English" aria-pressed="${lang==='en'}" class="${lang==='en'?'active':''}">EN</button><button data-language="es" lang="es" aria-label="Español" aria-pressed="${lang==='es'}" class="${lang==='es'?'active':''}">ES</button></div><button class="icon-button" data-close aria-label="Close dialog">×</button></div></header>`; }
  function videoSection(ex) {
    const video=window.ROUNDWORK_VIDEOS?.[ex.id];
    if(!video?.id) return `<section class="video-context"><div class="eyebrow">${esc(ex.category)}</div><h3>${esc(video?.context || ex.name)}</h3><p>${esc(video?.note || ex.purpose)}</p></section>`;
    return `<section class="video-guide"><div class="video-stage" id="video-stage"><div class="video-placeholder"><span class="video-play-symbol" aria-hidden="true">▶</span><div class="eyebrow">VIDEO DEMONSTRATION</div><h3>${esc(video.title)}</h3><p data-no-i18n>${esc(video.provider)}</p><button class="button button-primary" data-video="load">Watch demonstration</button></div></div><div class="video-actions"><a class="button button-ghost button-small" href="${safeUrl(video.url)}" target="_blank" rel="noopener noreferrer">Open original video ↗</a><button class="text-button" data-video="stop" hidden>Stop video</button></div><p class="video-note">${esc(video.note)}</p><p class="video-connectivity">Videos need internet. Illustrations and written steps stay available offline after the app is saved.</p></section>`;
  }
  function loadVideo() {
    if(modal?.type!=='guide')return;
    const video=window.ROUNDWORK_VIDEOS?.[modal.exId];
    if(!video?.id || !/^[A-Za-z0-9_-]{11}$/.test(video.id))return;
    if(navigator.onLine===false){toast('Video needs internet. Use the illustrations and written steps.');return;}
    const lang=window.RoundworkI18n?.language || 'en';
    // A provider request starts only after a deliberate tap; no video is cached.
    const src=`https://www.youtube-nocookie.com/embed/${video.id}?playsinline=1&rel=0&autoplay=0&hl=${lang}&cc_lang_pref=${lang}`;
    $('#video-stage').innerHTML=`<iframe class="exercise-video" src="${src}" title="${esc(video.title)}" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    $('#modal-root [data-video="stop"]').hidden=false;
    $('#video-player-help').hidden=false;
  }
  function stopVideo() {
    if(modal?.type!=='guide' || !window.ROUNDWORK_VIDEOS?.[modal.exId]?.id)return;
    $('#modal-root .video-guide').outerHTML=videoSection(exById.get(modal.exId));
    $('#video-player-help').hidden=true;
  }
  function guide(exId) {
    const ex=exById.get(exId);if(!ex)return;
    const steps=ex.steps || [];
    const illustration=`<section class="movement-preview" aria-labelledby="movement-preview-title"><h3 id="movement-preview-title">Quick mechanics · illustrations</h3><div class="demo-visual" id="demo-visual">${svgFor(ex,0)}<span class="demo-caption">KEY POSITIONS</span></div><div class="demo-controls"><button class="button button-ghost" data-demo="prev" aria-label="Previous movement frame">←</button><span class="demo-step" id="demo-step">FRAME 1 / 3</span><button class="button button-dark" data-demo="play">Play slowly ▷</button><button class="button button-ghost" data-demo="next" aria-label="Next movement frame">→</button></div><p>Illustrations show key positions and stay available offline. Use the video for a fuller view of the movement.</p></section>`;
    const video=window.ROUNDWORK_VIDEOS?.[ex.id]?.id ? `<details class="video-details" id="video-details"><summary>Video demonstration · more detail</summary>${videoSection(ex)}<p class="video-connectivity" id="video-player-help" hidden>Tap the player’s play button. If it cannot load here, open the original video.</p></details>` : videoSection(ex);
    openModal(`${modalHeader(ex.category,ex.name)}<div class="modal-content"><div class="guide-layout"><div>${illustration}${video}<section class="guide-section"><h3>What you need</h3><p>${esc(equipmentNames(ex).join(' · ') || 'No equipment. A clear, level space.')}</p><h3>Set up</h3><p>${esc(ex.setup || '')}</p></section></div><div><p class="guide-purpose">${esc(ex.purpose)}</p><ol class="guide-steps">${steps.map((step,i)=>`<li data-guide-step="${i}">${esc(step)}</li>`).join('')}</ol>${ex.substitutionNote?`<section class="guide-section"><h3>Transfer & limits</h3><p>${esc(ex.substitutionNote)}</p></section>`:''}</div></div><div class="guide-details"><section class="guide-section"><h3>Keep in mind</h3><ul>${(ex.cues || []).map(c=>`<li>${esc(c==='Rest 90–120 seconds between sets.'?'Use the rest shown on your current session card.':c)}</li>`).join('')}</ul></section><section class="guide-section"><h3>Avoid</h3><ul>${(ex.avoid || []).map(c=>`<li>${esc(c)}</li>`).join('')}</ul></section></div><div class="guide-evidence"><button class="text-button" data-evidence="${esc(ex.id)}">Why this exercise? Evidence & sources ↗</button></div><footer class="guide-footer"><p>Demonstrations show movement technique. Follow your session’s dose and ask a coach to check unfamiliar movements.</p>${ex.source?.url?`<a class="button button-primary" href="${safeUrl(ex.source.url)}" target="_blank" rel="noopener noreferrer">${esc(ex.source.linkLabel || 'Expert reference / demo')} ↗</a>`:''}</footer></div>`,'guide',{exId,frame:0,playing:false});
    // Closing the optional video removes its player so sound cannot continue hidden.
    $('#video-details')?.addEventListener('toggle',event=>{if(!event.target.open)stopVideo();});
  }
  function updateDemo(frame) {
    if (modal?.type!=='guide') return;
    modal.frame = ((frame%3)+3)%3;
    const ex = exById.get(modal.exId);
    $('#demo-visual').innerHTML = `${svgFor(ex,modal.frame)}<span class="demo-caption">KEY POSITIONS</span>`;
    $('#demo-step').textContent = `FRAME ${modal.frame+1} / 3`;
    const length = ex.steps?.length || 0;
    const activeStep = Math.round(modal.frame * Math.max(0,length-1)/2);
    document.querySelectorAll('[data-guide-step]').forEach(el => el.classList.toggle('active',Number(el.dataset.guideStep)===activeStep));
  }
  function swap(originalId) {
    const original = exById.get(originalId); if (!original) return;
    const selected = resolveExercise(originalId);
    openModal(`${modalHeader('SAME TRAINING SLOT','Choose your movement')}<div class="modal-content"><p>Alternatives have different mechanics and boxing transfer. Choose confirmed equipment; the session dose updates where needed.</p><div class="swap-list">${[original,...getAlternatives(original)].map(ex => { const available = availability(ex); return `<button class="swap-option ${selected?.id===ex.id?'selected':''}" data-swap-original="${esc(originalId)}" data-swap-choice="${esc(ex.id)}" ${available==='no'?'disabled':''}><strong>${esc(ex.name)} ${original.id===ex.id?'· planned':''}</strong><span>${esc(equipmentNames(ex).join(' + ') || 'No equipment')} · ${available==='yes'?'Available':available==='unknown'?'Confirm equipment before training':'Unavailable'}</span>${ex.substitutionNote?`<span style="margin-top:6px">${esc(ex.substitutionNote)}</span>`:''}</button>`; }).join('')}</div></div>`,'swap');
  }
  function confirmReset(type) {
    const equipment = type==='equipment';
    openModal(`${modalHeader('LOCAL DATA',equipment?'Reset your equipment?':'Reset this session log?')}<div class="modal-content"><p>${equipment?'All equipment choices return to “not sure”. Your notes and training logs remain saved.':`This removes completion marks for Week ${state.week}, ${esc(days.find(d=>d.id===state.day)?.label || state.day)} only. Other sessions stay saved.`}</p><div style="display:flex;gap:10px"><button class="button button-ghost" data-close>Keep it</button><button class="button button-primary" data-confirm-reset="${type}">Reset ${equipment?'equipment':'session'}</button></div></div>`,'confirm');
  }
  function finishSession() {
    const day = days.find(d => d.id===state.day), items = currentSession().items;
    const complete = items.filter(item => state.logs[logKey(state.day,item.exercise)]).length;
    openModal(`${modalHeader('FINISH YOUR SESSION',state.sessions[sessionKey()]?'Your session is recorded.':'Work done. Recover well.')}<div class="modal-content"><p>${complete} of ${items.length} movements marked complete. It is fine to finish with skipped movements—only the exercises you marked are counted.</p><p>${state.readiness==='tired'?'Recovery adjustments were active today.':'Check that your next coached session still feels fresh.'} Session records are manual and stay on this device.</p><div style="display:flex;gap:10px"><button class="button button-ghost" data-close>Back</button><button class="button button-primary" data-action="save-session">${state.sessions[sessionKey()]?'Update record':'Save session'} ✓</button></div></div>`,'finish');
  }
  function setTab(tab) { if (!['session','plan','exercises','gym','sources'].includes(tab)) return; activeTab=tab; history.replaceState(null,'',`#${tab}`); render(); window.scrollTo({top:0,behavior:'instant'}); }
  function setTimer(duration,label) {
    if (timer.running && !window.confirm(window.RoundworkI18n?.translate('Replace the timer that is currently running?') || 'Replace the timer that is currently running?')) return;
    timer.duration = Math.max(1,Number(duration)||60); timer.remaining=timer.duration; timer.running=false; timer.finished=false; timer.label=label || 'REST TIMER';
    $('#timer-dock').hidden=false; updateTimer();
  }
  function updateTimer() {
    if (timer.running) {
      timer.remaining=Math.max(0,Math.ceil((timer.deadline-Date.now())/1000));
      if (timer.remaining===0) { timer.running=false; timer.finished=true; toast('Timer complete. Check your readiness before the next set.'); if (navigator.vibrate) navigator.vibrate([140,100,140]); }
    }
    $('#timer-label').textContent=timer.finished?'TIMER COMPLETE':timer.label.toUpperCase();
    const seconds=Math.max(0,Math.ceil(timer.remaining));
    $('#timer-display').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    $('#timer-toggle').textContent=timer.running?'Pause':timer.finished?'Again':'Start';
    $('#timer-dock').classList.toggle('finished',timer.finished);
  }
  $('#timer-toggle').addEventListener('click',() => { if(timer.running){timer.remaining=Math.max(0,Math.ceil((timer.deadline-Date.now())/1000));timer.running=false;}else{if(timer.remaining<=0)timer.remaining=timer.duration;timer.deadline=Date.now()+timer.remaining*1000;timer.running=true;timer.finished=false;}updateTimer(); });
  $('#timer-reset').addEventListener('click',() => {timer.running=false;timer.remaining=timer.duration;timer.finished=false;updateTimer();});
  $('#timer-close').addEventListener('click',() => {timer.running=false;$('#timer-dock').hidden=true;});
  setInterval(() => {if(timer.running)updateTimer();},200);
  document.addEventListener('visibilitychange',() => {if(!document.hidden)updateTimer();});
  document.addEventListener('click',event => {
    const button=event.target.closest('button');
    if (event.target.classList.contains('modal-backdrop')) {closeModal();return;}
    if(!button)return;
    if(button.dataset.tab){setTab(button.dataset.tab);return;}
    if(button.dataset.go){closeModal(false);setTab(button.dataset.go);return;}
    if(button.hasAttribute('data-close')){closeModal();return;}
    if(button.dataset.day){state.day=button.dataset.day;persist();render();return;}
    if(button.dataset.readiness){state.readiness=button.dataset.readiness;persist();render();toast(state.readiness==='tired'?'Recovery adjustments applied.':'Standard session doses restored.');return;}
    if(button.dataset.gear){state.equipment[button.dataset.gear]=button.dataset.value;persist();const y=window.scrollY;render();window.scrollTo(0,y);return;}
    if(button.dataset.guide){guide(button.dataset.guide);return;}
    if(button.dataset.evidence){const index=window.ROUNDWORK_EVIDENCE.groups.findIndex(group=>group.exercises.includes(button.dataset.evidence));closeModal(false);setTab('sources');document.getElementById(`block-${index}`)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(button.dataset.swap){swap(button.dataset.swap);return;}
    if(button.dataset.swapChoice){state.swaps[logKey(state.day,button.dataset.swapOriginal)]=button.dataset.swapChoice;delete state.logs[logKey(state.day,button.dataset.swapOriginal)];persist();closeModal();render();toast('Movement updated. Check its dose and guide.');return;}
    if(button.dataset.complete){const activeItem=currentSession().items.find(item=>item.exercise===button.dataset.complete);if(!activeItem)return;const ex=exerciseFor(activeItem), key=logKey(state.day,button.dataset.complete);if(!state.logs[key]&&availability(ex)!=='yes'){toast(availability(ex)==='unknown'?'Confirm this equipment in My gym before training.':'Equipment unavailable. Choose a substitute or skip this movement.');return;}const item=activeItem;if(!state.logs[key]&&item&&getDose(item,ex).skip){toast('Hard conditioning is off. Leave this block unmarked.');return;}if(state.logs[key])delete state.logs[key];else state.logs[key]={exercise:ex.id,at:new Date().toISOString(),settings:sessionChoice(),dose:getDose(item,ex)};persist();render();return;}
    if(button.dataset.timer){setTimer(button.dataset.timer,button.dataset.timerLabel);return;}
    if(button.dataset.video){if(modal?.type!=='guide')return;if(button.dataset.video==='load')loadVideo();else stopVideo();return;}
    if(button.dataset.demo){if(modal?.type!=='guide')return;if(button.dataset.demo==='play'){modal.playing=!modal.playing;clearInterval(demoInterval);button.textContent=modal.playing?'Pause Ⅱ':'Play slowly ▷';if(modal.playing)demoInterval=setInterval(()=>updateDemo((modal?.frame||0)+1),2000);}else{clearInterval(demoInterval);demoInterval=null;modal.playing=false;$('#modal-root [data-demo="play"]').textContent='Play slowly ▷';updateDemo(modal.frame+(button.dataset.demo==='next'?1:-1));}return;}
    if(button.dataset.confirmReset){const type=button.dataset.confirmReset;if(type==='equipment')state.equipment={};else{const prefix=`${state.week}:${state.day}:`;Object.keys(state.logs).filter(k=>k.startsWith(prefix)).forEach(k=>delete state.logs[k]);delete state.sessions[sessionKey()];}persist();closeModal();render();toast(type==='equipment'?'Equipment choices reset.':'This session log was reset.');return;}
    const action=button.dataset.action;
    if(action==='next-boxing'){state.week=state.week%2===0?state.week:Math.min(8,state.week+1);persist();render();}
    else if(action==='reset-equipment')confirmReset('equipment');
    else if(action==='reset-session')confirmReset('session');
    else if(action==='complete-session')finishSession();
    else if(action==='save-session'){state.sessions[sessionKey()]={at:new Date().toISOString(),readiness:state.readiness,coachLoad:state.coachLoad,settings:sessionChoice(),prescription:currentSession().items.map(item=>({exercise:item.exercise,selected:exerciseFor(item).id,dose:getDose(item,exerciseFor(item))}))};persist();closeModal();render();toast('Session saved on this device.');}
  });
  document.addEventListener('change',event => {
    if(['level-select','duration-select','progression-ready'].includes(event.target.id)){
      const choice=sessionChoice(),id=event.target.id;
      if(id==='level-select')choice.level=event.target.value;
      if(id==='duration-select')choice.minutes=Number(event.target.value);
      if(id==='progression-ready')choice.progressionReady=event.target.checked;
      state.sessionSettings[sessionKey()]=window.RoundworkPlanner.cleanChoice(choice,state.day);persist();render();$('#'+id)?.focus();toast('Session updated. Keep the prescribed rests; completed work remains recorded.');
    }
    else if(event.target.id==='week-select'){state.week=Number(event.target.value);persist();render();}
    else if(event.target.id==='coach-load'){state.coachLoad=event.target.value;persist();render();}
    else if(event.target.id==='category-filter'){libraryCategory=event.target.value;renderLibraryResults();}
  });
  document.addEventListener('input',event => {
    if(event.target.id==='exercise-search'){librarySearch=event.target.value;renderLibraryResults();}
    else if(event.target.id==='gym-notes'){state.notes=event.target.value;persist();}
  });
  document.addEventListener('keydown',event => {
    if(!modal)return;
    if(event.key==='Escape'){event.preventDefault();closeModal();return;}
    if(event.key==='Tab'){
      const elements=[...document.querySelectorAll('#modal-root button:not(:disabled),#modal-root a[href],#modal-root input,#modal-root select,#modal-root textarea,#modal-root iframe,#modal-root summary')].filter(el=>el.offsetParent!==null);
      if(!elements.length)return;
      const first=elements[0],last=elements[elements.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  $('#help-button').addEventListener('click',() => openModal(`${modalHeader('ROUNDWORK','A clear plan for the gym.')}<div class="modal-content"><p>Start with Week 2, confirm the equipment in <strong>My gym</strong>, and tell the app how demanding your coached sessions are. Every gym movement opens with illustrated mechanics and written steps. Expand the video demonstration for a fuller view.</p><p>Weeks 1, 3, 5, and 7 preserve your existing lifting routine. Weeks 2, 4, 6, and 8 provide the boxing-focused sessions. Coaching is Thursday and Saturday.</p><p>Week and day choices are manual. Nothing is inferred from today’s date. Saved equipment, notes, substitutions, and training marks stay in this browser on this device.</p><button class="button button-primary" data-close>Ready to go ↗</button></div>`,'about'));
  document.addEventListener('roundwork-language',() => { if (activeTab==='exercises') renderLibraryResults(); });
  render();
})();


