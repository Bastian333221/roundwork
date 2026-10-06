/* Source summaries reviewed 6 October 2026. App programming is an interpretation, not a tested protocol. */
(() => {
  const translated=[];
  const L=(en,es)=>{translated.push([en,es]);return en;};
  const sources=[
    {id:'acsm',type:'guideline',citation:'Currier BS et al. · ACSM · 2026 · Med Sci Sports Exerc 58:851–872',doi:'10.1249/MSS.0000000000003897',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/',
      title:L('ACSM resistance training position stand','Documento de posición de ACSM sobre entrenamiento de resistencia'),
      design:L('Overview of 137 systematic reviews; healthy adults. Consulted: abstract and ACSM public summary.','Síntesis de 137 revisiones sistemáticas; adultos sanos. Consultado: resumen y comunicado público de ACSM.'),
      finding:L('Progressive resistance training improves strength and power. Fast lifting actions and moderate loads can support power; training to failure is not consistently necessary.','El entrenamiento progresivo de resistencia mejora fuerza y potencia. Las acciones rápidas y cargas moderadas pueden apoyar la potencia; entrenar al fallo no es necesario de forma sistemática.'),
      application:L('Informs the strength/power distinction, controlled strength sets, fast repetitions and adaptable equipment choices.','Orienta la distinción entre fuerza y potencia, las series de fuerza controladas, las repeticiones rápidas y las opciones de equipo.'),
      limit:L('General adult guidance, not a boxing trial. The app’s three repetitions in reserve, alternating weeks and exact exercise selection are programming choices.','Guía general para adultos, no un ensayo de boxeo. Las tres repeticiones en reserva, la alternancia semanal y la selección exacta de ejercicios son decisiones de programación.')},
    {id:'dunn',type:'research',citation:'Dunn EC et al. · 2022 · J Strength Cond Res 36:1019–1025',doi:'10.1519/JSC.0000000000003585',url:'https://pubmed.ncbi.nlm.nih.gov/32218063/',
      title:L('Lower-body strength and punch impact force','Fuerza del tren inferior y fuerza de impacto del golpe'),
      design:L('Observational study of 28 highly trained male amateur boxers. Consulted: published abstract.','Estudio observacional en 28 boxeadores aficionados varones de alto nivel. Consultado: resumen publicado.'),
      finding:L('Lower-body force measures correlated with peak punch force. Upper-body strength/power measures did not show meaningful relationships in this sample.','Las medidas de fuerza del tren inferior se correlacionaron con la fuerza máxima del golpe. Las medidas de fuerza y potencia del tren superior no mostraron relaciones relevantes en esta muestra.'),
      application:L('Supports including leg strength as one component of physical preparation, without promising that any single lift makes a punch stronger.','Apoya incluir fuerza de piernas como parte de la preparación física, sin prometer que un levantamiento concreto aumente la fuerza del golpe.'),
      limit:L('Correlation does not establish cause. Results in trained men do not validate this app’s routine or guarantee the same response in other athletes.','La correlación no demuestra causalidad. Los resultados en varones entrenados no validan esta rutina ni garantizan la misma respuesta en otros deportistas.')},
    {id:'loturco',type:'research',citation:'Loturco I et al. · 2021 · J Strength Cond Res 35:2373–2378',doi:'10.1519/JSC.0000000000003165',url:'https://pubmed.ncbi.nlm.nih.gov/31009434/',
      title:L('Power training and punching impact in elite boxers','Entrenamiento de potencia e impacto del golpe en boxeadores de élite'),
      design:L('Eight Brazilian national-team boxers; three power sessions over one week. Consulted: published abstract.','Ocho boxeadores de la selección brasileña; tres sesiones de potencia en una semana. Consultado: resumen publicado.'),
      finding:L('Punching impact and lower-body exercise power improved after optimum-power-load training.','Mejoraron el impacto del golpe y la potencia en ejercicios del tren inferior tras entrenar con cargas de potencia óptima.'),
      application:L('Adds context for brief leg-power work. It does not prescribe the app’s reset jumps or medicine-ball throws.','Aporta contexto para el trabajo breve de potencia de piernas. No prescribe los saltos con pausa ni los lanzamientos de esta app.'),
      limit:L('Very small, short study with elite athletes and a different protocol. No guarantee of transfer to a new boxer; the abstract does not establish a controlled comparison.','Estudio muy pequeño y corto en atletas de élite, con un protocolo diferente. No garantiza transferencia a un boxeador nuevo; el resumen no establece una comparación controlada.')},
    {id:'boxing',type:'research',citation:'Chaabène H et al. · 2015 · Sports Med 45:337–352',doi:'10.1007/s40279-014-0274-7',url:'https://pubmed.ncbi.nlm.nih.gov/25358529/',
      title:L('Physical and physiological demands of amateur boxing','Demandas físicas y fisiológicas del boxeo aficionado'),
      design:L('Review of amateur boxing characteristics. Consulted: published abstract.','Revisión de características del boxeo aficionado. Consultado: resumen publicado.'),
      finding:L('Boxing preparation includes cardiorespiratory fitness, anaerobic capacity, strength and power. Aerobic fitness helps meet match demands and recover between rounds.','La preparación del boxeo incluye condición cardiorrespiratoria, capacidad anaeróbica, fuerza y potencia. La capacidad aeróbica ayuda a responder a las demandas del combate y a recuperar entre asaltos.'),
      application:L('Informs combining easy aerobic work, brief power work and coached skills rather than relying on a single conditioning exercise.','Orienta combinar trabajo aeróbico suave, potencia breve y técnica con entrenador, sin depender de un solo ejercicio de acondicionamiento.'),
      limit:L('A review of sport demands does not establish the ideal weekly split or validate the app’s 20–35-minute cardio doses.','Una revisión de las demandas del deporte no establece la división semanal ideal ni valida las dosis de cardio de 20–35 minutos de la app.')},
    {id:'rope-study',type:'research',citation:'Ratamess NA et al. · 2015 · J Strength Cond Res 29:2375–2387',doi:'10.1519/JSC.0000000000001053',url:'https://pubmed.ncbi.nlm.nih.gov/26049794/',
      title:L('Battle ropes: work and rest change the metabolic demand','Cuerdas de batalla: trabajo y descanso cambian la demanda metabólica'),
      design:L('Acute comparison in 22 young adults: eight 30-second rope bouts, with one- or two-minute rests. Consulted: published abstract.','Comparación aguda en 22 adultos jóvenes: ocho intervalos de cuerdas de 30 segundos con descansos de uno o dos minutos. Consultado: resumen publicado.'),
      finding:L('Rope intervals produced cardiovascular and metabolic demands; shorter rests increased those demands.','Los intervalos con cuerdas generaron demandas cardiovasculares y metabólicas; los descansos más cortos las aumentaron.'),
      application:L('Supports classifying ropes as conditioning and showing work/rest clearly, with reduced doses when coaching is hard or recovery is poor.','Apoya clasificar las cuerdas como acondicionamiento y mostrar claramente trabajo y descanso, con dosis reducidas si el boxeo es intenso o la recuperación es baja.'),
      limit:L('An acute response is not proof of long-term boxing benefit. The studied protocol differs from the app’s 6 × 20 s / 40 s starting block.','Una respuesta aguda no demuestra beneficios de boxeo a largo plazo. El protocolo estudiado difiere del bloque inicial de la app: 6 × 20 s / 40 s.')},
    {id:'sleep',type:'guideline',citation:'Walsh NP et al. · 2021 · Br J Sports Med 55:356–368',doi:'10.1136/bjsports-2020-102025',url:'https://bjsm.bmj.com/content/55/7/356',
      title:L('Athlete sleep: expert consensus','Sueño del deportista: consenso de expertos'),
      design:L('Narrative review and expert consensus. Consulted: abstract and practical recommendations.','Revisión narrativa y consenso de expertos. Consultado: resumen y recomendaciones prácticas.'),
      finding:L('Sleep needs should be individualized. Athletes can be vulnerable to insufficient sleep; workload and schedules influence recovery opportunities.','Las necesidades de sueño deben individualizarse. Los deportistas pueden dormir insuficientemente; carga y horarios influyen en la oportunidad de recuperarse.'),
      application:L('Informs the readiness check, recovery days and advice to create more sleep opportunity.','Orienta la comprobación de recuperación, los días de descanso y la recomendación de reservar más tiempo para dormir.'),
      limit:L('The app’s “tired” setting is a simple self-report adjustment, not a validated sleep assessment or a medical diagnosis.','El ajuste «estoy cansado» se basa en tu percepción; no es una evaluación validada del sueño ni un diagnóstico médico.')},
    {id:'sled-guide',type:'practice',citation:'Steven A. Morgan · NSCA Bridge · March 2019',url:'https://www.nsca.com/education/videos/bridge-series/bridge-modifying-the-sled-push-for-tactical-athletes-with-steve-morgan/',
      title:L('Sled push technique and modifications','Técnica y modificaciones del empuje de trineo'),
      design:L('Professional technique video for tactical athletes.','Vídeo profesional de técnica para deportistas del ámbito táctico.'),
      finding:L('Demonstrates sled-push modifications; it is a technique reference, not a boxing research trial.','Demuestra modificaciones del empuje de trineo; es una referencia técnica, no un ensayo científico de boxeo.'),
      application:L('Used for setup and movement cues. The app shows a clear lane, whole-body lean, controlled leg drive and adequate rest.','Se usa para la preparación y las indicaciones del movimiento: carril despejado, inclinación del cuerpo como unidad, impulso controlado de piernas y descanso.'),
      limit:L('Sled 4 × 15 m / 120 s, later progression and RPE targets were selected for this schedule. Surface friction prevents a universal kilogram prescription.','Trineo 4 × 15 m / 120 s, progresión posterior y objetivos RPE se eligieron para este horario. La fricción impide prescribir un peso universal en kilos.')},
    {id:'boxing-practice',type:'practice',citation:'Boxing Science · specialist coaching resources',url:'https://boxingscience.co.uk/improve-punching-power/',
      title:L('Applied boxing strength, power and conditioning','Aplicación de fuerza, potencia y acondicionamiento al boxeo'),
      design:L('Specialist coaching articles; practical interpretation of sport science.','Artículos de entrenamiento especializado; interpretación práctica de ciencia del deporte.'),
      finding:L('Offers exercise ideas and explanations for strength, explosive work and conditioning.','Ofrece ideas de ejercicios y explicaciones de fuerza, trabajo explosivo y acondicionamiento.'),
      application:L('Informed medicine-ball exercise selection and the training intent. Original strength, rotation and conditioning articles appear in the guide directory below.','Orientó la selección de ejercicios con balón medicinal y los objetivos del entrenamiento. Los artículos originales de fuerza, rotación y acondicionamiento figuran en el directorio inferior.'),
      limit:L('Coaching guidance is not independent clinical validation. No individual exercise is guaranteed to improve punch power.','Una guía de entrenamiento no es una validación clínica independiente. Ningún ejercicio individual garantiza mejorar la potencia de golpeo.')},
    {id:'technique',type:'practice',citation:'ACE · NASM · England Boxing · Keele University · NSCA',url:'https://www.acefitness.org/resources/everyone/exercise-library/',
      title:L('Movement demonstrations and boxing practice','Demostraciones de movimientos y práctica de boxeo'),
      design:L('Professional exercise libraries and governing-body coaching resources.','Bibliotecas profesionales de ejercicios y recursos de entrenamiento de la federación.'),
      finding:L('Provide setup and movement demonstrations. They support learning how to perform an exercise, not proof that the exact plan improves boxing.','Aportan preparación y demostraciones. Ayudan a aprender a ejecutar un ejercicio; no prueban que el plan exacto mejore el boxeo.'),
      application:L('Used for guide steps, alternatives and purposeful shadowboxing themes. Every linked guide is listed below with its associated movements.','Se usan para pasos de las guías, alternativas y temas de boxeo de sombra con objetivo. Cada guía se lista abajo con sus movimientos asociados.'),
      limit:L('App diagrams are simplified illustrations, not measurements or an assessment of your form. A coach still checks technique and competition readiness.','Los diagramas son ilustraciones simplificadas, no mediciones ni una evaluación de tu ejecución. El entrenador sigue revisando técnica y preparación para competir.')}
  ];
  const groups=[
    {title:L('Strength & resistance','Fuerza y resistencia'),ids:['acsm','dunn'],exercises:['squat','press','row','hinge','lunge','pulldown','pushup','splitSquat','bandRow','bridge','stepup']},
    {title:L('Explosive power','Potencia explosiva'),ids:['acsm','dunn','loturco','boxing-practice'],exercises:['jump','rotation','chestThrow','fastPushup']},
    {title:L('Aerobic base','Base aeróbica'),ids:['boxing','boxing-practice'],exercises:['bike','walk','easyMarch']},
    {title:L('Sled conditioning','Acondicionamiento con trineo'),ids:['sled-guide','boxing'],exercises:['sled']},
    {title:L('Rope intervals & alternatives','Intervalos con cuerdas y alternativas'),ids:['rope-study','boxing'],exercises:['ropes','bikeIntervals','marchIntervals']},
    {title:L('Trunk control & preparation','Control del tronco y preparación'),ids:['acsm','technique'],exercises:['pallof','bandPallof','sidePlank','deadbug','warmup','cooldown']},
    {title:L('Coaching & recovery','Entrenador y recuperación'),ids:['technique','sleep'],exercises:['shadow','coach','rest']}
  ];
  const originalTitles={
    acsm:'American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews',
    dunn:'Relationships Between Punch Impact Force and Upper- and Lower-Body Muscular Strength and Power in Highly Trained Amateur Boxers',
    loturco:'Transference Effect of Short-Term Optimum Power Load Training on the Punching Impact of Elite Boxers',
    boxing:'Amateur boxing: physical and physiological attributes',
    'rope-study':'Effects of Rest Interval Length on Acute Battling Rope Exercise Metabolism',
    sleep:'Sleep and the athlete: narrative review and 2021 expert consensus recommendations'
  };
  sources.forEach(source=>source.originalTitle=originalTitles[source.id]||'');
  window.ROUNDWORK_ADD_ES(translated);
  window.ROUNDWORK_EVIDENCE={sources,groups,reviewed:'2026-10-06'};
})();
