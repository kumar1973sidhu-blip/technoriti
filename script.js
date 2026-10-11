/**
 * TECHNORITI '26 - BCE BHAGALPUR
 * Clean Portal Engine with Canvas Scroll Animation & Interactive Drawers
 */

(function () {
  'use strict';

  // =====================================================================
  // 1. DATA: 29 COMPETITIONS (TECHNORITI '26)
  // =====================================================================
  const COMPETITIONS_DATA = [
    {
      id: 'robowar',
      title: 'RoboWar',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'The ultimate battle arena. Build a wired/wireless combat bot capable of overpowering, flipping, or knocking opponents into hazards.',
      rules: [
        'Dimensions: Bot must fit in a 300 x 300 x 300 mm box. Weight limit: 10 kg maximum.',
        'Power source: Electrically powered, maximum potential difference 18V DC at any point.',
        'Arena hazards: Thrusters present at sides can hit at any time. Central hole depth is 300 mm.',
        'Points: Out of arena = 15 pts, Dump in central hole = 10 pts, Immovable opponent = 30 pts.',
        'Three elimination rounds: 1st round 4 mins, 2nd round 6 mins, 3rd round 10 mins.'
      ],
      coordinator: 'Shubham Thakur: 9166344621 | Vinit Kumar: 8302534925'
    },
    {
      id: 'robosoccer',
      title: 'RoboSoccer',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Design an agile soccer bot with pushing/hitting mechanisms to score goals and defend against rival machines.',
      rules: [
        'Bot weight limit: 5 kg. Maximum dimensions: 30 x 30 x 30 cm.',
        'Voltage at any electrical connection must not exceed 12V DC.',
        'Match duration: 10 minutes total (two 4-minute halves).',
        'Scoring: Goal scored fetches 2 points in Round 1; in Round 2, goals before center line fetch 5 points.',
        'Penalty: If wheels touch the D line, -1 penalty point awarded to opponent.'
      ],
      coordinator: 'Md. Aman Ansari: 9546684329 | Madan Kumar Jha: 7360983955'
    },
    {
      id: 'dhanush',
      title: 'Dhanush – LFR',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Autonomous line-following robot challenge following the Gandiv bow concept through complex black line tracks & checkpoints.',
      rules: [
        'Strictly autonomous; maximum bot dimensions 25 x 25 x 25 cm, mass 1 kg.',
        'Voltage must not exceed 12V DC. Must have a physical start & stop button.',
        'Score formula: (300 - time)*2 + 50 bonus at destination + 5 per correct LED glow on turns + node points.',
        'Special star nodes award 20 points in Round 1 and 30 points in Round 2.',
        'Trial of 3 minutes will be given with maximum 2 retakes.'
      ],
      coordinator: 'Manish Kumar: 9523338938 | Saurav Singh: 8340488701'
    },
    {
      id: 'matsya',
      title: 'Matsya – AquaBot',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 200 / team',
      feeNum: 200,
      feeType: 'team',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Aquatic robotics event navigating through floating hurdles while catching targeted balls in open water arena.',
      rules: [
        'Robots can be manual or semi-autonomous waterproof floating bots.',
        'Game starts from the center of water arena with 5-minute time limit.',
        'Scoring: Red ball collected and placed in fixed dock = 5 points; other balls = 2 points.',
        'Minimum contact with obstacles required for higher agility score.'
      ],
      coordinator: 'Varun Singh: 9334634930 | Deepankar Pandey: 9102977705'
    },
    {
      id: 'hackathon',
      title: '36-Hour Hackathon',
      category: 'coding',
      categoryLabel: 'Coding & Cyber',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 3 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Sprint 36-hour software marathon solving real-world challenges with innovative software, UI/UX, and technical execution.',
      rules: [
        'Teams must bring their own laptops and development equipment.',
        'Specific problem statements will be revealed at the commencement.',
        'Judged on Innovation & Creativity, UX & Design, Technical Complexity, and Feasibility.',
        'All participants must carry their original college institute ID card.'
      ],
      coordinator: 'Aniket: 8802632032 | Himanshu Vishwas: 9128571355'
    },
    {
      id: 'forensic',
      title: 'Forensic Hackathon',
      category: 'coding',
      categoryLabel: 'Coding & Cyber',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '2 - 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Organized with CFET New Delhi & HHFC Patna. Investigate digital forensic clues, network intrusions, and cyber-crime files.',
      rules: [
        'Contest consists of MCQ Round (20 marks), Q&A Round (40 marks), and Forensic Task Challenge (40 marks).',
        'Requires laptop with min 4GB RAM, basic open-source forensics tool installations.',
        'Evaluated by certified cyber-crime and digital forensics investigators on accuracy and analysis.'
      ],
      coordinator: 'Dev Raj Dev: 9631766064 | Shailendra: 7295084407'
    },
    {
      id: 'competitive',
      title: 'Competitive Programming',
      category: 'coding',
      categoryLabel: 'Coding & Cyber',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '3 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'High-speed algorithmic contest by Debuggerzz Club. Solve DSA problems in C, C++, Java, or Python.',
      rules: [
        'Conducted on campus computer workstations provided by BCE Bhagalpur.',
        'Ranking decided by number of problems solved, least execution time, and penalty for wrong submissions.',
        'No external electronic devices or printed code snippets allowed.'
      ],
      coordinator: 'Dev Raj Dev: 9631766064 | Himanshu Vishwas: 9128571355'
    },
    {
      id: 'blindcoding',
      title: 'Blind Coding',
      category: 'coding',
      categoryLabel: 'Coding & Cyber',
      date: 'December 2026',
      fee: 'Rs. 100 / participant',
      feeNum: 100,
      feeType: 'person',
      teamSize: 'Individual',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: 'Write complete syntactically correct code in C/C++ with the computer monitor powered off!',
      rules: [
        'Round 1: 2 questions (easy complexity) - 20 minutes duration.',
        'Round 2: 2 questions (medium/high complexity) - 30 minutes duration.',
        'Any attempt to switch on or tilt the monitor leads to immediate disqualification.',
        'Rough scratch paper is provided for logic building before typing.'
      ],
      coordinator: 'Anukul Anand: 7633072155 | Ankit Srivastava: 6200271610'
    },
    {
      id: 'bughunting',
      title: 'Bug Hunting',
      category: 'coding',
      categoryLabel: 'Coding & Cyber',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 2 Members',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: 'Spot vulnerabilities, logic flaws, and hidden exploits in live application targets under a 2-hour timer.',
      rules: [
        'Teams must work independently without sharing endpoints with rival teams.',
        'Bugs scored based on Severity, Impact, and Reproducibility.',
        'Top 3 teams with highest verified scoring vulnerabilities win.'
      ],
      coordinator: 'Aniket: 8802632032 | Aakash Bhardwaj: 9113490269'
    },
    {
      id: 'freefire',
      title: 'Free-Fire Championship',
      category: 'gaming',
      categoryLabel: 'Esports & Gaming',
      date: 'December 2026',
      fee: 'Squad: Rs. 300 / BR: Rs. 200',
      feeNum: 300,
      feeType: 'team',
      teamSize: 'Squad / Solo',
      prizes: 'Total Cash Pool: Rs 5000',
      shortDesc: 'Mobile esports battle across Clash Squad (4v4) Bermuda and Battle Royale Remastered.',
      rules: [
        'Strictly mobile smartphones and tablets only. PCs and emulators are completely banned.',
        'Clash Squad (8 teams max), Battle Royale Squad (8 teams max), Solo (24 players max).',
        'Character skill: OFF for Clash Squad, Unlimited ammo ON.',
        'Zero tolerance policy for third-party scripts, hacks, or toxic conduct.'
      ],
      coordinator: 'Prince Kumar: 8521837306 | Aditya Kumar: 8764157232'
    },
    {
      id: 'echess',
      title: 'E-Chess Tournament',
      category: 'gaming',
      categoryLabel: 'Esports & Gaming',
      date: 'December 2026',
      fee: 'Rs. 100 / participant',
      feeNum: 100,
      feeType: 'person',
      teamSize: 'Individual',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: 'Rapid tactical chess battle played on Chess.com on campus with strict FIDE competitive regulations.',
      rules: [
        'All year students eligible. Played via verified Chess.com app on campus.',
        'Knockout format; initial round game time limit 10 minutes rapid.',
        'FIDE official fair play and touch-move rules apply.'
      ],
      coordinator: 'Prakash: 8102862029 | Aakash Bhardwaj: 9113490269'
    },
    {
      id: 'bridgemaking',
      title: 'Bridge Making',
      category: 'design',
      categoryLabel: 'Design & Civil',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 5 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Construct high-efficiency truss bridges using popsicle sticks & Fevicol, then test them to destruction with hydraulic load.',
      rules: [
        'Materials: 150 wooden ice cream sticks, Fevicol, 1 cutter, rubber bands provided on spot.',
        'Dimensions: Length 48-56 cm, Width 12-16 cm, Height 12-16 cm. Max weight: 550 grams.',
        'Efficiency Formula = (Load at failure / Weight of bridge) * 100%.',
        'Clearance required for a 10 x 8 x 8 cm box to pass through span.'
      ],
      coordinator: 'Vivek Kumar: 8271415745 | Amrit Kumar: 9060948263'
    },
    {
      id: 'surveyking',
      title: 'Survey King',
      category: 'design',
      categoryLabel: 'Design & Civil',
      date: 'December 2026',
      fee: 'Rs. 50 / head',
      feeNum: 50,
      feeType: 'person',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Demonstrate elite field surveying, leveling, theodolite measurement, and rapid topography plotting.',
      rules: [
        'MCQ screening test conducted if over 5 teams participate.',
        'Practical field test: Teams unable to set up and zero instruments accurately are eliminated on spot.',
        'Equal time given to all teams; evaluated on accuracy of measurements.'
      ],
      coordinator: 'Ujjawal Kumar | Sonali Kumari: 8340757415'
    },
    {
      id: 'autocad',
      title: 'AutoCAD Design',
      category: 'design',
      categoryLabel: 'Design & Civil',
      date: 'December 2026',
      fee: 'Rs. 100 / participant',
      feeNum: 100,
      feeType: 'person',
      teamSize: 'Individual',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: 'Draft precision 2D engineering drawings and 3D wireframe models within a strict 2-hour window.',
      rules: [
        'AutoCAD modern workstation version used for the competition.',
        '2 hours given to complete complete orthogonal projections and dimensions.',
        'Scoring based on geometric accuracy, layer management, and earliest finish time.'
      ],
      coordinator: 'Saurav Kumar: 8340799753 | Shivraj Gupta: 7277992301'
    },
    {
      id: 'solidworks',
      title: 'SolidWorks Challenge',
      category: 'design',
      categoryLabel: 'Design & Civil',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Individual',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: '3-stage 3D mechanical CAD challenge: Part Drawing, Advanced Part Parametrics, and Assembly Modeling.',
      rules: [
        'Stages: 1) Part drawing, 2) Advanced part drawing, 3) Assembly modeling with mates.',
        'Models from websites (GrabCAD etc.) strictly disqualified.',
        'Evaluated on completeness, ANSI drafting standards, constraint accuracy, and speed.'
      ],
      coordinator: 'Kumar Gaurav: 7424947994 | Atul Ambastha: 7999312149'
    },
    {
      id: 'boatmaking',
      title: 'Boat Making',
      category: 'design',
      categoryLabel: 'Design & Civil',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 5 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Craft buoyant scale boats from popsicle sticks & waterproof wrap, loading incremental weights until sinking.',
      rules: [
        'Max boat weight: 250 grams. Length: 45-60 cm, Width: 15-20 cm.',
        'Must float in water for at least 15 seconds before weights are continuously added every 5 seconds.',
        'Efficiency = (Weight at sink / Weight of boat) * 100%.'
      ],
      coordinator: 'Vinit Kumar: 8302534925 | Rohit Anand: 8873948459'
    },
    {
      id: 'electrotechnovation',
      title: 'ElectroTechnovation',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '4 - 5 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Showcase innovative electrical/electronic prototypes solving modern energy and engineering bottlenecks.',
      rules: [
        'Abstract submission ahead of event required with clear problem statement.',
        'Live demonstration of prototype model + Poster presentation (10 pts) + Technical interview (25 pts).',
        'Marking: Research (10), Design (15), Construction/Testing (20), Creativity (20).'
      ],
      coordinator: 'Ansh Roshan: 7488717742 | Nitish Kumar: 8862812398'
    },
    {
      id: 'arduinoeffect',
      title: 'Arduino Effect',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Showcase microcontroller embedded systems, IoT sensors, and autonomous hardware built with Arduino.',
      rules: [
        'Must be based on Arduino hardware; teams bring their own kits/modules.',
        'Judged on hardware circuit soldering/breadboarding, firmware code efficiency, and utility.'
      ],
      coordinator: 'Madan Kumar Jha: 7360983955'
    },
    {
      id: 'zerocarbon',
      title: 'Zero Carbon Debate',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Debate on "Innovative Aspects of Sustainable Development & Role of Carbon in Energy" across prelim & cross-questioning rounds.',
      rules: [
        'Each team has 2 for and 2 against speakers.',
        'Round 1 prelim evaluation, followed by Round 2 cross-questioning with panel of judges.',
        'Top 2 winners awarded on both FOR and AGAINST sides.'
      ],
      coordinator: 'Shaziya Shaheen: 9110136452 | Manisha Kumari: 7991176142'
    },
    {
      id: 'electromania',
      title: 'ElectroMania Quiz',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 200 / team',
      feeNum: 200,
      feeType: 'team',
      teamSize: '4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'High-energy Basic Electrical Engineering quiz with objective rounds, buzzer questions, and rapid negative marking finale.',
      rules: [
        'Round 1: Objective Questions (20s per question).',
        'Round 2: Rapid Fire with shared digital buzzer app (15s per question).',
        'Round 3 Finale: +3 marks for correct answer, -1 for wrong answer.'
      ],
      coordinator: 'Arnava Kumar Sinha: 6376330348 | Aanchal: 7061598342'
    },
    {
      id: 'memecircuit',
      title: 'MeMe Circuit',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 100 / participant',
      feeNum: 100,
      feeType: 'person',
      teamSize: 'Individual',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: 'Engineering humor contest! Create viral, high-IQ original tech memes hosted on LinkedIn and Telegram.',
      rules: [
        'Round 1: Technical video memes. Round 2: Picture memes on Engineering Life on LinkedIn.',
        'Final Rapid Round: Offline on campus with surprise templates provided.',
        'Only 100% original content (#OC) allowed with Technoriti watermark.'
      ],
      coordinator: 'Shivam Acharya: 8102142526 | Satyam Kumar: 7488540332'
    },
    {
      id: 'matlab',
      title: 'MATLAB Simulation',
      category: 'coding',
      categoryLabel: 'Coding & Cyber',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '2 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Demonstrate computational mathematics, matrix operations, plotting, and Simulink block simulation.',
      rules: [
        'Phased challenge: 1) 10 MCQ Quiz (10 mins), 2) Operation/Plotting (10 mins), 3) Dynamic Simulation (10 mins).',
        'Systems provided by BCE Department; physical question paper delivered.'
      ],
      coordinator: 'Neeraj Kumar: 9661914543 | Gaurav Kumar: 8271834650'
    },
    {
      id: 'cinematography',
      title: 'Cinematography',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 10 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Produce impactful short films on campus capturing technology, human emotions, or social awareness under 10 minutes.',
      rules: [
        'Total duration max 10 mins (including credits); minimum 720p resolution in MP4/MOV.',
        'Footage must be original and captured during the event; no archived stock footage.',
        'Judged on storytelling, cinematography framing, color grading, and emotional resonance.'
      ],
      coordinator: 'Kumar Chandra Bhanu: 9122068634'
    },
    {
      id: 'photography',
      title: 'Photography Contest',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: 'Max 4 Members',
      prizes: '1st: Rs 2000 • 2nd: Rs 1000',
      shortDesc: 'Frame stunning visual moments across campus. Basic color balance and RAW grading allowed; filter apps prohibited.',
      rules: [
        'High-resolution JPG/PNG submission; camera or mobile camera allowed.',
        'Minor exposure & color corrections allowed; composite images & AI filters strictly banned.',
        'Judged by professional photographers on composition, lighting, and narrative.'
      ],
      coordinator: 'Kumar Chandra Bhanu: 9122068634'
    },
    {
      id: 'nukkad',
      title: 'Nukkad (Street Play)',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 200 / team',
      feeNum: 200,
      feeType: 'team',
      teamSize: '6 - 20 Members',
      prizes: 'Trophy & Certificates',
      shortDesc: 'Channel the raw power of street theatre in a 360-degree open-air arena delivering powerful social messages.',
      rules: [
        'Time limit: 20 minutes from empty stage to empty stage.',
        'Only acoustic live instruments allowed (teams bring their own dholak/harmonica).',
        'Scoring: Content & Message (40%), Acting/Diction (25%), Improvisation (20%), Direction (15%).'
      ],
      coordinator: 'Kundan Kumar: 7260964188 | Kumar Gaurav: 7424947994'
    },
    {
      id: 'generalquiz',
      title: 'General Quiz',
      category: 'quizzes',
      categoryLabel: 'Quizzes & Literary',
      date: 'December 2026',
      fee: 'Rs. 100 / team',
      feeNum: 100,
      feeType: 'team',
      teamSize: '2 Members',
      prizes: 'Trophy & Certificates',
      shortDesc: 'General knowledge, technology history, science, sports, and pop culture audio/visual buzzer showdown.',
      rules: [
        'Max 1 team of 2 members per participating college.',
        'Multiple rounds: Direct questions (2 marks), Pass/Bounce (1 mark). Rapid buzzer finale.',
        'Decisions of the Quiz Master are final and binding.'
      ],
      coordinator: 'Kumar Chandra Bhanu: 9122068634 | Prameet Kumar: 9608261133'
    },
    {
      id: 'electronicsproject',
      title: 'Electronics Project Exhibition',
      category: 'robotics',
      categoryLabel: 'Robotics & Hardware',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '2 - 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Exhibition of pre-built Electronics & Communication hardware projects with live PowerPoint defense.',
      rules: [
        'Abstract submission required ahead of event.',
        '20 minutes presentation + 5 minutes grace time using PPT.',
        'Evaluation: Research, Design Methodology, Construction/Testing, Creativity, and Q&A defense.'
      ],
      coordinator: 'Ravi Ranjan Jha: 7371871498 | Sunny Kumar: 9525773569'
    },
    {
      id: 'projectpresentation',
      title: 'Project Making & Presentation',
      category: 'design',
      categoryLabel: 'Design & Civil',
      date: 'December 2026',
      fee: 'Rs. 50 / member',
      feeNum: 50,
      feeType: 'member',
      teamSize: '2 - 4 Members',
      prizes: '1st: Rs 3000 • 2nd: Rs 2000',
      shortDesc: 'Comprehensive engineering prototype showcase spanning interdisciplinary branches with PPT presentation.',
      rules: [
        'Presentation time limit max 15 minutes in English.',
        'Equal speaking time distribution among team members.',
        'Evaluation: Model & Innovation (60%), Presentation (20%), Topic Relevance (20%).'
      ],
      coordinator: 'Amit Kumar: 7257929573 | Aushutosh Ranjan: 8863971241'
    }
  ];

  // =====================================================================
  // 2. CANVAS SCROLL ENGINE (170 FRAMES SMOOTH SCRUBBING)
  // =====================================================================
  const TOTAL_FRAMES = 170;
  const INITIAL_BATCH_SIZE = 25;
  const CONCURRENT_LOAD_LIMIT = 8;
  const LERP_FACTOR = 0.16;

  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderProgress = document.getElementById('loader-progress');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderStatus = document.getElementById('loader-status');
  const startBtn = document.getElementById('start-btn');

  const audioToggle = document.getElementById('audio-toggle');
  const audioIconOff = document.getElementById('audio-icon-off');
  const audioIconOn = document.getElementById('audio-icon-on');
  const cursorGlow = document.getElementById('cursor-glow');

  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentFrameFloat = 0;
  let targetFrame = 0;
  let lastRenderedFrame = -1;
  let isAudioActive = false;
  let audioContext = null;
  let masterGain = null;

  function getFrameSrc(index) {
    const numStr = String(index + 1).padStart(3, '0');
    return `/ezgif-frame-${numStr}.jpg`;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    if (lastRenderedFrame >= 0) {
      drawFrame(lastRenderedFrame);
    }
  }

  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) {
      let fallbackImg = null;
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (images[index - offset] && images[index - offset].complete) {
          fallbackImg = images[index - offset];
          break;
        }
        if (images[index + offset] && images[index + offset].complete) {
          fallbackImg = images[index + offset];
          break;
        }
      }
      if (!fallbackImg) return;
      renderImageToCanvas(fallbackImg);
      return;
    }
    renderImageToCanvas(img);
    lastRenderedFrame = index;
  }

  function renderImageToCanvas(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const destW = iw * ratio;
    const destH = ih * ratio;
    const destX = (cw - destW) / 2;
    const destY = (ch - destH) / 2;

    ctx.drawImage(img, 0, 0, iw, ih, destX, destY, destW, destH);
  }

  function initPreloader() {
    let loadQueue = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) loadQueue.push(i);

    let activeLoads = 0;

    function loadNext() {
      if (loadQueue.length === 0) return;
      if (activeLoads >= CONCURRENT_LOAD_LIMIT) return;

      const idx = loadQueue.shift();
      activeLoads++;

      const img = new Image();
      img.decoding = 'async';
      img.src = getFrameSrc(idx);

      img.onload = () => {
        images[idx] = img;
        loadedCount++;
        activeLoads--;

        if (idx === 0) drawFrame(0);

        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        loaderProgress.style.width = `${pct}%`;
        loaderPercent.textContent = `${pct}%`;
        loaderStatus.textContent = `Streaming frames (${loadedCount}/${TOTAL_FRAMES})...`;

        if (loadedCount === INITIAL_BATCH_SIZE && !startBtn.dataset.revealed) {
          startBtn.dataset.revealed = 'true';
          startBtn.classList.remove('hidden');
          loaderStatus.textContent = 'Buffer ready. Step into Technoriti!';
        }

        if (loadedCount >= TOTAL_FRAMES) {
          loaderStatus.textContent = 'All frames loaded in Full HD.';
        }

        loadNext();
      };

      img.onerror = () => {
        loadedCount++;
        activeLoads--;
        loadNext();
      };

      loadNext();
    }

    for (let i = 0; i < CONCURRENT_LOAD_LIMIT; i++) loadNext();
  }

  function dismissLoader() {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 700);
    drawFrame(0);
  }

  function renderLoop() {
    const delta = targetFrame - currentFrameFloat;
    if (Math.abs(delta) > 0.001) {
      currentFrameFloat += delta * LERP_FACTOR;
    } else {
      currentFrameFloat = targetFrame;
    }

    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameFloat)));
    if (frameIndex !== lastRenderedFrame) {
      drawFrame(frameIndex);
    }

    requestAnimationFrame(renderLoop);
  }

  // --- Wheel & Touch Canvas Scrubbing ---
  function setupScrollInteractions() {
    window.addEventListener('wheel', (e) => {
      // Don't scrub background while a drawer panel is open
      const openDrawer = document.querySelector('.slide-panel-overlay.open');
      if (openDrawer) return;

      targetFrame += e.deltaY * 0.08;
      if (targetFrame < 0) targetFrame = 0;
      if (targetFrame > TOTAL_FRAMES - 1) targetFrame = TOTAL_FRAMES - 1;
    }, { passive: true });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const openDrawer = document.querySelector('.slide-panel-overlay.open');
      if (openDrawer) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      targetFrame += deltaY * 0.1;
      if (targetFrame < 0) targetFrame = 0;
      if (targetFrame > TOTAL_FRAMES - 1) targetFrame = TOTAL_FRAMES - 1;
      touchStartY = touchY;
    }, { passive: true });
  }

  // --- Web Audio Synthesizer ---
  function initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0, audioContext.currentTime);
      masterGain.connect(audioContext.destination);

      const freqs = [77.78, 116.54, 196.00, 293.66];
      freqs.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + idx * 80, audioContext.currentTime);

        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.03, audioContext.currentTime);
        lfoGain.gain.setValueAtTime(180, audioContext.currentTime);
        lfo.connect(filter.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.12 / freqs.length, audioContext.currentTime);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start();
      });
    } catch (err) {
      console.warn('Web Audio error:', err);
    }
  }

  function toggleAudio() {
    if (!audioContext) initAudio();
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();

    isAudioActive = !isAudioActive;
    if (isAudioActive) {
      masterGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 1.2);
      audioIconOff.classList.add('hidden');
      audioIconOn.classList.remove('hidden');
    } else {
      masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.6);
      audioIconOff.classList.remove('hidden');
      audioIconOn.classList.add('hidden');
    }
  }

  // =====================================================================
  // 3. SLIDE-OUT DRAWER PANELS & 3D PERSPECTIVE ROOM ENGINE
  // =====================================================================
  let currentRoomAngle = 0;
  let targetRoomAngle = 0;
  const roomAngles = [0, 90, 180, 270];
  const wallLabels = ['VIEW 01 // STAY & TARIFF', 'VIEW 02 // TV LOUNGE', 'VIEW 03 // FACILITIES & TARIFFS', 'VIEW 04 // FAQS'];
  const roomBox = document.getElementById('room-3d-box');
  const roomAngleText = document.getElementById('room-angle-text');
  const roomPills = document.querySelectorAll('.room-pill');

  window.rotateRoomTo = function (deg) {
    targetRoomAngle = deg;
    currentRoomAngle = deg;
    if (roomBox) {
      roomBox.style.setProperty('--room-rotate', `${deg}deg`);
    }

    // Determine closest index of [0, 90, 180, 270]
    let closestIdx = 0;
    let minDiff = 9999;
    const normDeg = ((deg % 360) + 360) % 360;
    roomAngles.forEach((a, i) => {
      const normA = ((a % 360) + 360) % 360;
      const diff = Math.min(Math.abs(normDeg - normA), 360 - Math.abs(normDeg - normA));
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    if (roomAngleText) {
      roomAngleText.textContent = wallLabels[closestIdx] || 'VIEW 01 // STAY & TARIFF';
    }

    roomPills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === closestIdx);
    });

    const roomWalls = [
      document.querySelector('.wall-front'),
      document.querySelector('.wall-right'),
      document.querySelector('.wall-back'),
      document.querySelector('.wall-left')
    ];
    roomWalls.forEach((w, idx) => {
      if (w) w.classList.toggle('active-wall', idx === closestIdx);
    });
  };

  function setup3DRoomInteractions() {
    const accomOverlay = document.getElementById('accommodation-panel');
    const stage = document.getElementById('room-3d-stage');
    if (!accomOverlay || !stage) return;

    // Scroll down inside accommodation rotates room (to next viewpoint)
    let wheelDebounce = 0;
    accomOverlay.addEventListener('wheel', (e) => {
      if (!accomOverlay.classList.contains('open')) return;
      
      // If hovering inside the FAQ accordion list on Wall 4, allow internal vertical scroll
      if (e.target && e.target.closest('.wall-content-left')) return;

      e.preventDefault();
      const now = Date.now();
      if (now - wheelDebounce < 350) return; // Smooth pacing between walls
      wheelDebounce = now;

      let curIdx = 0;
      let minDiff = 9999;
      const normCur = ((targetRoomAngle % 360) + 360) % 360;
      roomAngles.forEach((a, i) => {
        const normA = ((a % 360) + 360) % 360;
        const diff = Math.min(Math.abs(normCur - normA), 360 - Math.abs(normCur - normA));
        if (diff < minDiff) {
          minDiff = diff;
          curIdx = i;
        }
      });

      if (e.deltaY > 0) {
        curIdx = (curIdx + 1) % roomAngles.length;
      } else {
        curIdx = (curIdx - 1 + roomAngles.length) % roomAngles.length;
      }
      window.rotateRoomTo(roomAngles[curIdx]);
    }, { passive: false });

    // Click and drag to orbit room
    let isDragging = false;
    let dragStartX = 0;
    let initialAngle = 0;

    stage.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons, inputs, links, pills, cards, or modals
      if (e.target.closest('button, a, input, select, label, .room-pill, .room-top-bar, .modal-backdrop, .service-choice-card, .service-both-option, .screenshot60-book-btn, .clickable')) return;
      isDragging = true;
      dragStartX = e.clientX;
      initialAngle = targetRoomAngle;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !roomBox) return;
      const dx = e.clientX - dragStartX;
      const tempAngle = initialAngle - dx * 0.35;
      roomBox.style.setProperty('--room-rotate', `${tempAngle}deg`);
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.clientX - dragStartX;
      let curIdx = 0;
      let minDiff = 9999;
      const normCur = (((initialAngle - dx * 0.35) % 360) + 360) % 360;
      roomAngles.forEach((a, i) => {
        const normA = ((a % 360) + 360) % 360;
        const diff = Math.min(Math.abs(normCur - normA), 360 - Math.abs(normCur - normA));
        if (diff < minDiff) {
          minDiff = diff;
          curIdx = i;
        }
      });
      window.rotateRoomTo(roomAngles[curIdx]);
    });

    // Mobile touch swipe to rotate
    let touchStartY = 0;
    let touchStartX = 0;
    stage.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, a, input, select, label, .room-pill, .room-top-bar, .modal-backdrop, .service-choice-card, .service-both-option, .screenshot60-book-btn, .clickable')) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      if (e.target.closest('button, a, input, select, label, .room-pill, .room-top-bar, .modal-backdrop, .service-choice-card, .service-both-option, .screenshot60-book-btn, .clickable')) return;
      const touchEndY = e.changedTouches[0].clientY;
      const dy = touchStartY - touchEndY;
      if (Math.abs(dy) > 45) {
        let curIdx = 0;
        let minDiff = 9999;
        const normCur = ((targetRoomAngle % 360) + 360) % 360;
        roomAngles.forEach((a, i) => {
          const normA = ((a % 360) + 360) % 360;
          const diff = Math.min(Math.abs(normCur - normA), 360 - Math.abs(normCur - normA));
          if (diff < minDiff) {
            minDiff = diff;
            curIdx = i;
          }
        });
        if (dy > 0) {
          curIdx = (curIdx + 1) % roomAngles.length;
        } else {
          curIdx = (curIdx - 1 + roomAngles.length) % roomAngles.length;
        }
        window.rotateRoomTo(roomAngles[curIdx]);
      }
    }, { passive: true });
  }

  // TV Stream Live Loop in Wall 2
  function initTvScreenStream() {
    const tvCanvas = document.getElementById('tv-stream-canvas');
    if (!tvCanvas) return;
    const tvCtx = tvCanvas.getContext('2d');
    let tvFrameIdx = 0;

    function renderTv() {
      if (images[tvFrameIdx] && images[tvFrameIdx].complete) {
        tvCtx.drawImage(images[tvFrameIdx], 0, 0, tvCanvas.width, tvCanvas.height);
      }
      tvFrameIdx = (tvFrameIdx + 1) % TOTAL_FRAMES;
      setTimeout(renderTv, 1000 / 24);
    }
    renderTv();
  }

  // Countdown timer in Wall 1
  function initRoomCountdown() {
    const targetDate = new Date('2026-12-18T09:00:00+05:30').getTime();
    function updateTimer() {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('room-timer-days');
      const hEl = document.getElementById('room-timer-hours');
      const mEl = document.getElementById('room-timer-min');
      const sEl = document.getElementById('room-timer-sec');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  window.openPanel = function (panelName) {
    // Close other panels first
    document.querySelectorAll('.slide-panel-overlay').forEach(p => p.classList.remove('open'));
    
    const target = document.getElementById(`${panelName}-panel`);
    if (target) {
      target.classList.add('open');
      if (panelName === 'accommodation') {
        window.rotateRoomTo(0);
      }
    }

    // Highlight dock links
    document.querySelectorAll('.dock-link').forEach(link => {
      const match = link.getAttribute('onclick') && link.getAttribute('onclick').includes(panelName);
      link.classList.toggle('active', !!match);
    });

    // Highlight top nav items
    document.querySelectorAll('.nav-item').forEach(btn => {
      const match = btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(panelName);
      btn.classList.toggle('active', !!match);
    });
  };

  window.closeAllPanels = function () {
    document.querySelectorAll('.slide-panel-overlay').forEach(p => p.classList.remove('open'));
    if (typeof window.closeMobileDrawer === 'function') window.closeMobileDrawer();
    document.querySelectorAll('.dock-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('onclick') && link.getAttribute('onclick').includes('closeAllPanels'));
    });
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  };

  window.handleOverlayClick = function (e, panelName) {
    if (e.target && e.target.classList.contains('slide-panel-overlay')) {
      window.closeAllPanels();
    }
  };

  // =====================================================================
  // 4. COMPETITIONS RENDERING & DETAILS MODAL
  // =====================================================================
  function getThemedCategoryFallback(category, title) {
    const cat = (category || '').toLowerCase();
    let themeColor = '#00f0ff';
    let iconSvg = '';
    const label = (title || 'ARENA').toUpperCase();

    if (cat.includes('robot')) {
      themeColor = '#00f0ff';
      iconSvg = `<polygon points="200,60 255,92 255,158 200,190 145,158 145,92" fill="none" stroke="#00f0ff" stroke-width="3.5"/><circle cx="180" cy="115" r="7" fill="#00ff88"/><circle cx="220" cy="115" r="7" fill="#00ff88"/><line x1="175" y1="145" x2="225" y2="145" stroke="#00f0ff" stroke-width="3"/><line x1="200" y1="35" x2="200" y2="60" stroke="#00f0ff" stroke-width="3"/><circle cx="200" cy="30" r="5" fill="#00ffff"/>`;
    } else if (cat.includes('cod') || cat.includes('cyber') || cat.includes('hack')) {
      themeColor = '#00ff88';
      iconSvg = `<rect x="125" y="65" width="150" height="95" rx="8" fill="#070c18" stroke="#00ff88" stroke-width="3"/><polyline points="150,102 168,112 150,122" fill="none" stroke="#00ff88" stroke-width="3.5"/><line x1="178" y1="122" x2="205" y2="122" stroke="#00ffff" stroke-width="3.5"/><line x1="135" y1="78" x2="265" y2="78" stroke="rgba(0,255,136,0.25)" stroke-width="2"/>`;
    } else if (cat.includes('gam') || cat.includes('esport')) {
      themeColor = '#ec4899';
      iconSvg = `<rect x="135" y="75" width="130" height="75" rx="24" fill="#0b0f19" stroke="#ec4899" stroke-width="3.5"/><circle cx="165" cy="110" r="10" fill="none" stroke="#00f0ff" stroke-width="2.5"/><path d="M160,110 L170,110 M165,105 L165,115" stroke="#00f0ff" stroke-width="2.5"/><circle cx="215" cy="104" r="5" fill="#f43f5e"/><circle cx="230" cy="116" r="5" fill="#38bdf8"/>`;
    } else if (cat.includes('design') || cat.includes('civil') || cat.includes('cad')) {
      themeColor = '#38bdf8';
      iconSvg = `<polygon points="200,65 265,102 200,140 135,102" fill="none" stroke="#38bdf8" stroke-width="3"/><polygon points="135,102 200,140 200,180 135,142" fill="none" stroke="#0284c7" stroke-width="3"/><polygon points="265,102 200,140 200,180 265,142" fill="none" stroke="#38bdf8" stroke-width="3"/>`;
    } else {
      themeColor = '#fbbf24';
      iconSvg = `<circle cx="200" cy="112" r="42" fill="none" stroke="#fbbf24" stroke-width="3"/><polygon points="200,82 205,102 225,102 210,114 215,134 200,122 185,134 190,114 175,102 195,102" fill="#fbbf24"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225">
      <defs>
        <radialGradient id="bgG" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
        <linearGradient id="gridG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${themeColor}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="transparent"/>
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill="url(#bgG)"/>
      <path d="M0,0 L400,225 M400,0 L0,225" stroke="url(#gridG)" stroke-width="1"/>
      <circle cx="200" cy="115" r="70" fill="none" stroke="${themeColor}" stroke-opacity="0.2" stroke-dasharray="4 6"/>
      ${iconSvg}
      <text x="200" y="195" font-family="monospace, sans-serif" font-size="11" font-weight="bold" fill="${themeColor}" text-anchor="middle" letter-spacing="2.5">TECHNORITI // ${escapeHtml(label.slice(0, 22))}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const EVENT_COVER_IMAGES = {
    'robowar': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=700&q=80',
    'robosoccer': 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=700&q=80',
    'dhanush': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80',
    'matsya': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=700&q=80',
    'hackathon': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=700&q=80',
    'forensic': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=700&q=80',
    'competitive': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=700&q=80',
    'blindcoding': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=80',
    'bughunting': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=700&q=80',
    'freefire': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    'chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=80',
    'bridgemaking': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=700&q=80',
    'surveyking': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=700&q=80',
    'autocad': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80',
    'solidworks': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=700&q=80',
    'boatmaking': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=700&q=80',
    'electrotechnovation': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=700&q=80',
    'arduinoeffect': 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=700&q=80',
    'zerocarbon': 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=700&q=80',
    'memecircuit': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=700&q=80',
    'matlab': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&q=80',
    'cinematography': 'https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?auto=format&fit=crop&w=700&q=80',
    'photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80',
    'electromania': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80',
    'nukkad': 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=700&q=80',
    'generalquiz': 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=700&q=80',
    'electronicsproject': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=700&q=80',
    'projectpres': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=700&q=80'
  };

  function renderEventCards(grid, items) {
    grid.innerHTML = items.map(item => {
      const fallbackUrl = getThemedCategoryFallback(item.category, item.title);
      const coverUrl = item.coverImage || EVENT_COVER_IMAGES[item.id] || fallbackUrl;
      const prizeShort = (item.prizes || '').split('•')[0] || 'Trophy & Prize';

      return `
      <div class="event-card" data-id="${item.id}" onclick="this.classList.toggle('expanded')">
        <!-- 1. Media Area (Always Visible) -->
        <div class="event-card-media">
          <img class="event-cover-img" src="${coverUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackUrl}';">
          <div class="event-media-overlay"></div>
          <div class="event-card-top-floater">
            <span class="event-category-badge">${escapeHtml(item.categoryLabel || item.category)}</span>
            <span class="event-prize-tag">${escapeHtml(prizeShort)}</span>
          </div>
        </div>

        <!-- 2. Base Card Body: Visible when mouse is NOT on card -->
        <div class="event-card-body">
          <h3 class="event-name">${escapeHtml(item.title)}</h3>
          <p class="event-desc">${escapeHtml(item.shortDesc)}</p>
          <div class="event-actions">
            <button type="button" class="view-rules-btn" onclick="event.stopPropagation(); window.openCompModal('${item.id}')">
              RULES & DETAILS
            </button>
            <button type="button" class="quick-reg-btn" onclick="event.stopPropagation(); window.quickRegisterForEvent('${escapeHtml(item.title)}')">
              REGISTER
            </button>
          </div>
        </div>

        <!-- 3. Translucent Animated HUD Overlay: Slides in when pointer hovers over card -->
        <div class="event-card-hover-overlay">
          <div class="echo-header">
            <span class="echo-badge">ARENA INTEL // DEC 2026</span>
            <h4 class="echo-title">${escapeHtml(item.title)}</h4>
          </div>

          <div class="echo-specs-grid">
            <div class="echo-spec-cell">
              <span class="echo-key">📅 DATE & TIME</span>
              <span class="echo-val">${escapeHtml(item.date)}</span>
            </div>
            <div class="echo-spec-cell">
              <span class="echo-key">💳 ENTRY FEE</span>
              <span class="echo-val highlight-fee">${escapeHtml(item.fee)}</span>
            </div>
            <div class="echo-spec-cell">
              <span class="echo-key">👥 TEAM FORMAT</span>
              <span class="echo-val">${escapeHtml(item.teamSize)}</span>
            </div>
            <div class="echo-spec-cell">
              <span class="echo-key">🏆 PRIZE POOL</span>
              <span class="echo-val highlight-gold">${escapeHtml(item.prizes)}</span>
            </div>
            <div class="echo-spec-cell full-width">
              <span class="echo-key">📞 COORDINATOR</span>
              <span class="echo-val coord-val">${escapeHtml(item.coordinator || 'Technoriti Desk')}</span>
            </div>
          </div>

          <div class="echo-actions">
            <button type="button" class="view-rules-btn" onclick="event.stopPropagation(); window.openCompModal('${item.id}')">
              RULES & DETAILS
            </button>
            <button type="button" class="quick-reg-btn" onclick="event.stopPropagation(); window.quickRegisterForEvent('${escapeHtml(item.title)}')">
              REGISTER NOW
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
  }

  async function renderCompetitions(filter = 'all') {
    const grid = document.getElementById('competitions-grid');
    if (!grid) return;

    const filtered = filter === 'all' 
      ? COMPETITIONS_DATA 
      : COMPETITIONS_DATA.filter(item => item.category === filter);

    // 1. Initial immediate render from buffer (zero wait / instant UX)
    renderEventCards(grid, filtered);

    // 2. Dynamic live sync with Supabase if online
    if (window.TechnoritiDB) {
      try {
        const liveEvents = await window.TechnoritiDB.getCompetitions(filter);
        if (liveEvents && liveEvents.length > 0) {
          const mapped = liveEvents.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category_id,
            categoryLabel: e.category?.name || 'Competition Arena',
            coverImage: e.cover_image || null,
            date: e.event_date || 'December 2026',
            fee: e.fee_type === 'team' ? `Rs. ${e.registration_fee} / team` : (e.fee_type === 'person' ? `Rs. ${e.registration_fee} / person` : `Rs. ${e.registration_fee} / member`),
            feeNum: e.registration_fee,
            feeType: e.fee_type,
            teamSize: e.team_size_max === 1 ? 'Individual' : `Max ${e.team_size_max} Members`,
            prizes: e.prize_pool,
            shortDesc: e.short_desc,
            rules: [],
            coordinator: `${e.coordinator_name || ''}: ${e.coordinator_phone || ''}`
          }));
          renderEventCards(grid, mapped);
        }
      } catch (err) {
        // Graceful silent fallback to in-memory dataset
      }
    }
  }

  function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCompetitions(btn.dataset.filter);
      });
    });
  }

  window.openCompModal = async function (id) {
    let item = COMPETITIONS_DATA.find(c => c.id === id);

    // Dynamic fetch from Supabase if online
    if (window.TechnoritiDB) {
      try {
        const liveDetails = await window.TechnoritiDB.getEventDetails(id);
        if (liveDetails && liveDetails.event) {
          const ev = liveDetails.event;
          const prizesStr = (liveDetails.prizes && liveDetails.prizes.length > 0)
            ? liveDetails.prizes.map(p => `${p.prize_title}: ${p.prize_amount}`).join(' • ')
            : (ev.prize_pool || 'Trophy & Cash Prize');
          const rulesArr = (liveDetails.rules && liveDetails.rules.length > 0)
            ? liveDetails.rules.map(r => r.rule_text)
            : (item?.rules || []);

          item = {
            id: ev.id,
            title: ev.title,
            categoryLabel: ev.category_id || 'Competition Arena',
            prizes: prizesStr,
            shortDesc: ev.short_desc,
            rules: rulesArr,
            coordinator: `${ev.coordinator_name || 'Event Lead'}: ${ev.coordinator_phone || 'Campus Desk'}`
          };
        }
      } catch (e) {}
    }

    if (!item) return;

    const modalContainer = document.getElementById('modal-content-container');
    modalContainer.innerHTML = `
      <h2 class="modal-event-title">${escapeHtml(item.title)}</h2>
      <div class="modal-badges-row">
        <span class="event-category-badge">${escapeHtml(item.categoryLabel)}</span>
        <span class="event-prize-tag">${escapeHtml(item.prizes)}</span>
      </div>
      <p style="color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">${escapeHtml(item.shortDesc)}</p>
      
      <div class="modal-section-h">KEY EVENT RULES & SPECIFICATIONS</div>
      <ul class="modal-rules-list">
        ${(item.rules || []).map(rule => `<li>${escapeHtml(rule)}</li>`).join('')}
      </ul>

      <div class="modal-contact-box">
        <strong style="color:#fff; display:block; margin-bottom:4px;">EVENT COORDINATORS:</strong>
        <span>${escapeHtml(item.coordinator)}</span>
      </div>

      <div class="modal-cta-row">
        <button class="primary-glow-btn" onclick="window.closeCompModal(); window.quickRegisterForEvent('${escapeHtml(item.title)}')">
          PROCEED TO REGISTER
        </button>
      </div>
    `;

    document.getElementById('comp-modal').classList.add('open');
  };

  window.closeCompModal = function (e) {
    if (e && e.target && e.target.classList.contains('modal-dialog')) return;
    document.getElementById('comp-modal').classList.remove('open');
  };

  window.quickRegisterForEvent = function (eventTitle) {
    window.openPanel('register');
    const select = document.getElementById('reg-event');
    if (!select) return;

    for (let opt of select.options) {
      if (opt.value.toLowerCase().includes(eventTitle.toLowerCase()) || 
          eventTitle.toLowerCase().includes(opt.value.toLowerCase())) {
        select.value = opt.value;
        break;
      }
    }
    window.updateFeeSummary();
  };

  // =====================================================================
  // 5. REGISTRATION FORM & LIVE FEE CALCULATOR
  // =====================================================================
  window.updateFeeSummary = function () {
    const eventSelect = document.getElementById('reg-event');
    const teamSizeSelect = document.getElementById('reg-team-size');
    const lodgingCheck = document.getElementById('reg-opt-lodging');
    const foodingCheck = document.getElementById('reg-opt-fooding');
    const daysSelect = document.getElementById('reg-service-days');
    const daysGroup = document.getElementById('reg-service-days-group');

    const summaryEventFee = document.getElementById('summary-event-fee');
    const lodgingRow = document.getElementById('reg-lodging-row');
    const summaryLodgingFee = document.getElementById('summary-lodging-fee');
    const lodgingCalcDesc = document.getElementById('reg-lodging-calc-desc');
    const foodingRow = document.getElementById('reg-fooding-row');
    const summaryFoodingFee = document.getElementById('summary-fooding-fee');
    const foodingCalcDesc = document.getElementById('reg-fooding-calc-desc');
    const summaryTotalFee = document.getElementById('summary-total-fee');

    if (!eventSelect || !teamSizeSelect) return;

    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const unitFee = parseInt(selectedOption?.dataset?.fee, 10) || 50;
    const feeType = selectedOption?.dataset?.type || 'member';
    const teamSize = parseInt(teamSizeSelect.value, 10) || 1;

    let eventCost = feeType === 'member' ? unitFee * teamSize : unitFee;

    const isLodging = lodgingCheck ? lodgingCheck.checked : false;
    const isFooding = foodingCheck ? foodingCheck.checked : false;

    if (daysGroup) {
      daysGroup.style.display = (isLodging || isFooding) ? 'block' : 'none';
    }

    const serviceDays = parseInt(daysSelect?.value, 10) || 2;
    const lodgingCost = isLodging ? (50 * serviceDays * teamSize) : 0;
    const foodingCost = isFooding ? (125 * serviceDays * teamSize) : 0;

    if (lodgingRow) {
      lodgingRow.style.display = isLodging ? 'flex' : 'none';
      if (summaryLodgingFee) summaryLodgingFee.textContent = `₹${lodgingCost}`;
      if (lodgingCalcDesc) lodgingCalcDesc.textContent = `₹50 × ${serviceDays}d × ${teamSize}p`;
    }

    if (foodingRow) {
      foodingRow.style.display = isFooding ? 'flex' : 'none';
      if (summaryFoodingFee) summaryFoodingFee.textContent = `₹${foodingCost}`;
      if (foodingCalcDesc) foodingCalcDesc.textContent = `₹125 × ${serviceDays}d × ${teamSize}p`;
    }

    if (summaryEventFee) summaryEventFee.textContent = `₹${eventCost}`;
    if (summaryTotalFee) summaryTotalFee.textContent = `₹${eventCost + lodgingCost + foodingCost}`;
  };

  window.handleRegistration = async function (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>RECORDING IN SUPABASE...</span>`;
    }

    const name = document.getElementById('reg-fullname').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const college = document.getElementById('reg-college').value;
    const eventSelect = document.getElementById('reg-event');
    const eventTitle = eventSelect.value;
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const unitFee = parseInt(selectedOption?.dataset?.fee, 10) || 50;
    const feeType = selectedOption?.dataset?.type || 'member';
    const teamSize = parseInt(document.getElementById('reg-team-size').value, 10) || 1;
    const isLodging = document.getElementById('reg-opt-lodging')?.checked || false;
    const isFooding = document.getElementById('reg-opt-fooding')?.checked || false;
    const serviceDays = parseInt(document.getElementById('reg-service-days')?.value, 10) || 2;

    let eventCost = feeType === 'member' ? unitFee * teamSize : unitFee;
    let lodgingCost = isLodging ? (50 * serviceDays * teamSize) : 0;
    let foodingCost = isFooding ? (125 * serviceDays * teamSize) : 0;
    let totalServicesCost = lodgingCost + foodingCost;
    let totalCost = eventCost + totalServicesCost;

    // Find eventId slug
    const matchedComp = COMPETITIONS_DATA.find(c => c.title.toLowerCase() === eventTitle.toLowerCase());
    const eventId = matchedComp ? matchedComp.id : eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    let dbSaved = false;
    if (window.TechnoritiDB) {
      try {
        await window.TechnoritiDB.submitRegistration({
          fullName: name,
          email: email,
          phone: phone,
          college: college,
          eventId: eventId,
          eventTitle: eventTitle,
          teamSize: teamSize,
          lodgingRequired: isLodging,
          foodingRequired: isFooding,
          serviceDays: serviceDays,
          eventFee: eventCost,
          accommodationFee: totalServicesCost,
          totalAmount: totalCost
        });
        dbSaved = true;
      } catch (err) {
        console.warn('[Technoriti Supabase] Saved locally (cloud sync pending):', err.message);
      }
    }

    const servicesDesc = (isLodging && isFooding) ? ' + Hostel Lodging & Campus Mess' : (isLodging ? ' + Hostel Lodging' : (isFooding ? ' + Campus Mess Food' : ''));
    const successMsg = document.getElementById('success-msg');
    if (successMsg) {
      successMsg.textContent = `Welcome, ${name}! Your registration for ${eventTitle}${servicesDesc} has been securely recorded ${dbSaved ? 'in the Technoriti database' : ''} (Total: ₹${totalCost}). Please carry your verification slip and college NOC to BCE Bhagalpur in December 2026.`;
    }

    document.getElementById('success-modal').classList.add('open');
    form.reset();
    window.updateFeeSummary();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  };

  // =====================================================================
  // 5B. CHOOSE YOUR SERVICES & ACCOMMODATION BOOKING FLOW
  // =====================================================================
  let selectedServiceChoice = 'both'; // 'lodging', 'fooding', or 'both'

  window.openAccomServiceSelector = function (presetChoice) {
    if (typeof window.closeMobileDrawer === 'function') {
      window.closeMobileDrawer();
    }

    const selectorModal = document.getElementById('accom-service-selection-modal');
    if (!selectorModal) {
      window.openAccomBookingModal(presetChoice);
      return;
    }

    selectorModal.classList.add('open');
    window.selectAccomServiceChoice(presetChoice || selectedServiceChoice || 'both');
  };

  window.closeAccomServiceSelector = function (e) {
    if (e && e.target && e.target.classList.contains('service-selector-dialog')) return;
    const modal = document.getElementById('accom-service-selection-modal');
    if (modal) modal.classList.remove('open');
  };

  window.selectAccomServiceChoice = function (choice) {
    selectedServiceChoice = choice || 'both';

    const cardLodging = document.getElementById('choice-card-lodging');
    const cardFooding = document.getElementById('choice-card-fooding');
    const cardBoth = document.getElementById('choice-card-both');
    const continueBtn = document.getElementById('btn-selector-continue');

    if (cardLodging) cardLodging.classList.toggle('selected', selectedServiceChoice === 'lodging');
    if (cardFooding) cardFooding.classList.toggle('selected', selectedServiceChoice === 'fooding');
    if (cardBoth) cardBoth.classList.toggle('selected', selectedServiceChoice === 'both');

    if (continueBtn) {
      if (selectedServiceChoice === 'lodging') {
        continueBtn.innerHTML = `<span>Continue with Lodging Only (₹50/day) →</span>`;
      } else if (selectedServiceChoice === 'fooding') {
        continueBtn.innerHTML = `<span>Continue with Fooding Only (₹125/day) →</span>`;
      } else {
        continueBtn.innerHTML = `<span>Continue with Both Services (₹175/day) →</span>`;
      }
    }
  };

  window.proceedToAccomBookingForm = function () {
    const selectorModal = document.getElementById('accom-service-selection-modal');
    if (selectorModal) selectorModal.classList.remove('open');

    const bookingModal = document.getElementById('accom-booking-modal');
    if (!bookingModal) return;

    const lodgingCheck = document.getElementById('accom-opt-lodging');
    const foodingCheck = document.getElementById('accom-opt-fooding');

    if (selectedServiceChoice === 'lodging') {
      if (lodgingCheck) lodgingCheck.checked = true;
      if (foodingCheck) foodingCheck.checked = false;
    } else if (selectedServiceChoice === 'fooding') {
      if (lodgingCheck) lodgingCheck.checked = false;
      if (foodingCheck) foodingCheck.checked = true;
    } else {
      if (lodgingCheck) lodgingCheck.checked = true;
      if (foodingCheck) foodingCheck.checked = true;
    }

    bookingModal.classList.add('open');
    window.updateAccomServiceVisibility();
    window.updateAccomFeeSummary();
  };

  window.returnToAccomServiceSelector = function () {
    const bookingModal = document.getElementById('accom-booking-modal');
    if (bookingModal) bookingModal.classList.remove('open');

    window.openAccomServiceSelector(selectedServiceChoice);
  };

  window.openAccomBookingModal = function (serviceType) {
    window.openAccomServiceSelector(serviceType);
  };

  window.closeAccomBookingModal = function (e) {
    if (e && e.target && e.target.classList.contains('modal-dialog')) return;
    const modal = document.getElementById('accom-booking-modal');
    if (modal) modal.classList.remove('open');
  };

  window.updateAccomServiceVisibility = function () {
    const lodgingCheck = document.getElementById('accom-opt-lodging');
    const foodingCheck = document.getElementById('accom-opt-fooding');
    const hostelGroup = document.getElementById('accom-hostel-group');
    const hostelSelect = document.getElementById('accom-hostel');
    const foodPrefGroup = document.getElementById('accom-food-pref-group');
    const modalTitle = document.getElementById('accom-modal-title');
    const modalSubtitle = document.getElementById('accom-modal-subtitle');

    const isLodging = lodgingCheck ? lodgingCheck.checked : false;
    const isFooding = foodingCheck ? foodingCheck.checked : false;

    if (hostelGroup && hostelSelect) {
      if (isLodging) {
        hostelGroup.style.display = 'block';
        hostelSelect.required = true;
      } else {
        hostelGroup.style.display = 'none';
        hostelSelect.required = false;
      }
    }

    if (foodPrefGroup) {
      foodPrefGroup.style.display = isFooding ? 'block' : 'none';
    }

    if (modalTitle && modalSubtitle) {
      if (isLodging && isFooding) {
        modalTitle.textContent = 'CAMPUS HOSTEL & MESS BOOKING';
        modalSubtitle.textContent = 'Lodging ₹50/day + Food ₹125/day inside BCE Bhagalpur Campus';
      } else if (isLodging) {
        modalTitle.textContent = 'CAMPUS HOSTEL LODGING BOOKING';
        modalSubtitle.textContent = 'Secure campus hostel accommodation (₹50/day) inside BCE Bhagalpur Campus';
      } else if (isFooding) {
        modalTitle.textContent = 'CAMPUS MESS FOODING PASS';
        modalSubtitle.textContent = '3 hygienic daily meals (₹125/day) at BCE Bhagalpur Campus Mess';
      } else {
        modalTitle.textContent = 'CAMPUS ACCOMMODATION & MESS';
        modalSubtitle.textContent = 'Please select at least one service below';
      }
    }
  };

  window.updateAccomBookingType = function () {
    const typeSel = document.getElementById('accom-booking-type');
    const membersGroup = document.getElementById('accom-members-group');
    const membersSel = document.getElementById('accom-members');
    if (!typeSel || !membersSel) return;

    if (typeSel.value === 'solo') {
      membersSel.value = '1';
      membersSel.disabled = true;
      if (membersGroup) membersGroup.style.opacity = '0.6';
    } else {
      membersSel.disabled = false;
      if (membersGroup) membersGroup.style.opacity = '1';
      if (membersSel.value === '1') {
        membersSel.value = '4';
      }
    }
  };

  window.updateAccomHostelBlock = function () {
    const genderSel = document.getElementById('accom-gender');
    const hostelSel = document.getElementById('accom-hostel');
    if (!genderSel || !hostelSel) return;
    if (genderSel.value === 'female') {
      hostelSel.value = 'Girls Hostel Block';
    } else {
      hostelSel.value = 'Boys Hostel Block';
    }
  };

  window.updateAccomFeeSummary = function () {
    const daysSel = document.getElementById('accom-days');
    const membersSel = document.getElementById('accom-members');
    const lodgingCheck = document.getElementById('accom-opt-lodging');
    const foodingCheck = document.getElementById('accom-opt-fooding');

    const days = parseInt(daysSel?.value, 10) || 2;
    const members = parseInt(membersSel?.value, 10) || 1;
    const isLodging = lodgingCheck ? lodgingCheck.checked : false;
    const isFooding = foodingCheck ? foodingCheck.checked : false;

    const lodgingTotal = isLodging ? (50 * days * members) : 0;
    const foodTotal = isFooding ? (125 * days * members) : 0;
    const subtotal = lodgingTotal + foodTotal;

    // Group discounts: flat Rs 150 off on 4+ members; flat Rs 250 off on 12+ members (if lodging is booked)
    let discount = 0;
    if (isLodging) {
      if (members >= 12) {
        discount = 250;
      } else if (members >= 4) {
        discount = 150;
      }
    }

    const grandTotal = Math.max(0, subtotal - discount);

    // Update DOM elements
    const calcDays = document.getElementById('af-calc-days');
    const calcMembers = document.getElementById('af-calc-members');
    const lodgingRow = document.getElementById('af-lodging-row');
    const lodgingTotalEl = document.getElementById('af-lodging-total');
    const foodRow = document.getElementById('af-food-row');
    const foodDays = document.getElementById('af-food-days');
    const foodMembers = document.getElementById('af-food-members');
    const foodTotalEl = document.getElementById('af-food-total');
    const discountRow = document.getElementById('af-discount-row');
    const discountEl = document.getElementById('af-discount-amount');
    const grandTotalEl = document.getElementById('af-grand-total');

    if (calcDays) calcDays.textContent = days;
    if (calcMembers) calcMembers.textContent = members;
    if (lodgingRow) lodgingRow.style.display = isLodging ? 'flex' : 'none';
    if (lodgingTotalEl) lodgingTotalEl.textContent = `₹${lodgingTotal}`;

    if (foodRow) foodRow.style.display = isFooding ? 'flex' : 'none';
    if (foodDays) foodDays.textContent = days;
    if (foodMembers) foodMembers.textContent = members;
    if (foodTotalEl) foodTotalEl.textContent = `₹${foodTotal}`;

    if (discountRow) {
      if (discount > 0) {
        discountRow.style.display = 'flex';
        if (discountEl) discountEl.textContent = `-₹${discount}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal}`;
  };

  window.handleAccomBookingSubmit = async function (form) {
    const errorBanner = document.getElementById('accom-error-banner');
    if (errorBanner) {
      errorBanner.style.display = 'none';
      errorBanner.textContent = '';
    }

    const btn = document.getElementById('accom-submit-btn');
    const originalText = btn ? btn.innerHTML : '';

    const name = document.getElementById('accom-name').value.trim();
    const roll = document.getElementById('accom-roll')?.value.trim() || 'N/A';
    const college = document.getElementById('accom-college').value.trim();
    const branch = document.getElementById('accom-branch')?.value.trim() || 'General';
    const phone = document.getElementById('accom-phone').value.trim();
    const email = document.getElementById('accom-email').value.trim();
    const bookingType = document.getElementById('accom-booking-type')?.value || 'solo';
    const gender = document.getElementById('accom-gender').value;
    const hostel = document.getElementById('accom-hostel').value;
    const days = parseInt(document.getElementById('accom-days').value, 10) || 2;
    const members = parseInt(document.getElementById('accom-members').value, 10) || 1;
    const isLodging = document.getElementById('accom-opt-lodging')?.checked || false;
    const isFooding = document.getElementById('accom-opt-fooding')?.checked || false;
    const arrival = document.getElementById('accom-arrival').value.trim();
    const notes = document.getElementById('accom-notes').value.trim();

    // Must select at least one service
    if (!isLodging && !isFooding) {
      const msg = 'Please select at least one service: Lodging / Hostel or Fooding / Campus Mess.';
      if (errorBanner) {
        errorBanner.textContent = msg;
        errorBanner.style.display = 'block';
      } else {
        alert(msg);
      }
      return;
    }

    // Strict 10-digit phone validation
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const msg = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      if (errorBanner) {
        errorBanner.textContent = msg;
        errorBanner.style.display = 'block';
      } else {
        alert(msg);
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>VERIFYING & RECORDING IN SUPABASE...</span>`;
    }

    const lodgingTotal = isLodging ? (50 * days * members) : 0;
    const foodTotal = isFooding ? (125 * days * members) : 0;
    let discount = (isLodging && members >= 12) ? 250 : ((isLodging && members >= 4) ? 150 : 0);
    const totalAmount = Math.max(0, lodgingTotal + foodTotal - discount);
    const dailyRate = (isLodging ? 50 : 0) + (isFooding ? 125 : 0);

    if (!window.TechnoritiDB) {
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
      const errMsg = 'Technoriti database connection is unavailable. Please check your internet connection.';
      if (errorBanner) {
        errorBanner.textContent = errMsg;
        errorBanner.style.display = 'block';
      } else {
        alert(errMsg);
      }
      return;
    }

    try {
      const res = await window.TechnoritiDB.submitAccommodationBooking({
        fullName: name,
        rollNumber: roll,
        college: college,
        branch: branch,
        phone: cleanPhone,
        email: email,
        gender: gender,
        bookingType: bookingType === 'group' ? `Group (${members} members)` : 'Solo',
        hostelBlock: isLodging ? hostel : 'Not Applicable (Campus Mess Pass)',
        daysCount: days,
        occupants: members,
        dailyRate: dailyRate,
        totalFee: totalAmount,
        lodgingRequired: isLodging,
        foodRequired: isFooding,
        arrival: arrival,
        preferences: `Roll: ${roll} | Branch: ${branch} | Type: ${bookingType} | Diet: ${isFooding ? (document.getElementById('accom-food-pref')?.value || 'veg') : 'N/A'} | Arrival: ${arrival || 'Dec 2026'} | Notes: ${notes || 'None'}`
      });

      // ONLY show success if Supabase confirmed success!
      if (!res || !res.success || !res.booking) {
        throw new Error('Supabase did not confirm the booking record.');
      }

      const realBookingId = res.booking.id ? (res.booking.id.length > 8 ? res.booking.id.slice(0, 8).toUpperCase() : res.booking.id) : `BCE-${Date.now().toString().slice(-4)}`;
      const bookingRef = `ACCOM-BCE-${realBookingId}`;

      // Close booking modal
      window.closeAccomBookingModal();

      // Populate and open success modal
      const refEl = document.getElementById('accom-success-ref');
      const summaryEl = document.getElementById('accom-success-summary');
      if (refEl) refEl.textContent = bookingRef;
      if (summaryEl) {
        let servicesText = '';
        if (isLodging && isFooding) {
          servicesText = 'Hostel Lodging + Campus Mess Food';
        } else if (isLodging) {
          servicesText = 'Hostel Lodging Only';
        } else {
          servicesText = 'Campus Mess Dining Pass Only';
        }
        const locationText = isLodging ? `at ${hostel}` : 'at Campus Dining Hall';
        summaryEl.textContent = `Hello ${name} (Roll: ${roll}, Branch: ${branch})! Your reservation for [${servicesText}] for ${members} person(s) for ${days} days ${locationText} has been verified and recorded in the Technoriti database. Total confirmed tariff: ₹${totalAmount}.`;
      }

      const successModal = document.getElementById('accom-success-modal');
      if (successModal) successModal.classList.add('open');

      form.reset();
      window.updateAccomFeeSummary();
    } catch (err) {
      console.error('[Technoriti Supabase] Accommodation booking error:', err);
      const errMsg = `Database Error: ${err.message || 'Failed to submit accommodation booking to Supabase.'}`;
      if (errorBanner) {
        errorBanner.textContent = errMsg;
        errorBanner.style.display = 'block';
      } else {
        alert(errMsg);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  };

  // FAQ Accordion Handler
  window.toggleFaq = function (el) {
    if (!el) return;
    el.classList.toggle('active');
  };

  // Mobile Navigation Drawer Handlers (Concetto Style)
  window.toggleMobileDrawer = function () {
    const overlay = document.getElementById('mobile-nav-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    const isOpen = overlay && overlay.classList.contains('open');
    if (isOpen) {
      window.closeMobileDrawer();
    } else {
      if (overlay) overlay.classList.add('open');
      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
      document.body.classList.add('mobile-drawer-open');
    }
  };

  window.closeMobileDrawer = function () {
    const overlay = document.getElementById('mobile-nav-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    if (overlay) overlay.classList.remove('open');
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('mobile-drawer-open');
  };

  // =====================================================================
  // 6. INITIALIZATION & BRIGHT NEON LEAF CUSTOM CURSOR ENGINE
  // =====================================================================
  const leafCursor = document.getElementById('neon-leaf-cursor');
  const trailContainer = document.getElementById('leaf-trail-container');
  let lastSporeX = -100;
  let lastSporeY = -100;

  function spawnNeonSpore(x, y) {
    if (!trailContainer) return;
    const spore = document.createElement('div');
    spore.className = 'neon-spore';
    spore.style.left = `${x}px`;
    spore.style.top = `${y}px`;

    // Organic drift angles and offsets
    const dx = (Math.random() - 0.5) * 24;
    const dy = 8 + Math.random() * 18;
    const rot = (Math.random() - 0.5) * 60;
    spore.style.setProperty('--dx', `${dx}px`);
    spore.style.setProperty('--dy', `${dy}px`);
    spore.style.setProperty('--rot', `${rot}deg`);

    trailContainer.appendChild(spore);
    setTimeout(() => spore.remove(), 650);
  }

  function setupNeonLeafCursor() {
    if (!leafCursor) return;

    // Completely disable on mobile and touchscreen devices
    if (window.matchMedia && window.matchMedia('(hover: none) or (pointer: coarse)').matches) {
      if (leafCursor) leafCursor.style.display = 'none';
      if (trailContainer) trailContainer.style.display = 'none';
      if (cursorGlow) cursorGlow.style.display = 'none';
      return;
    }

    window.addEventListener('mousemove', (e) => {
      const x = e.clientX;
      const y = e.clientY;

      // Align leaf's optical sharp pointer tip (at 2, 2 in SVG) directly with mouse
      leafCursor.style.transform = `translate3d(${x - 2}px, ${y - 2}px, 0)`;
      leafCursor.classList.add('visible');

      // Update ambient follower glow
      if (cursorGlow) {
        cursorGlow.style.left = `${x}px`;
        cursorGlow.style.top = `${y}px`;
      }

      // Check if hovering over clickable or interactive elements
      const target = e.target;
      const isInteractive = target && target.closest(
        'button, a, input, select, .dock-link, .nav-item, .event-card, .price-box-card, .filter-btn, .partner-cell, .coord-box-dr, .drawer-close-btn, .action-btn, [role="button"]'
      );

      if (isInteractive) {
        leafCursor.classList.add('cursor-hover');
      } else {
        leafCursor.classList.remove('cursor-hover');
      }

      // Spawn glowing bioluminescent spores along movement trail
      const dist = Math.hypot(x - lastSporeX, y - lastSporeY);
      if (dist > 14) {
        spawnNeonSpore(x + 2, y + 2);
        lastSporeX = x;
        lastSporeY = y;
      }
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      leafCursor.classList.add('cursor-down');
      // Extra burst on click
      if (lastSporeX > 0) {
        for (let i = 0; i < 3; i++) {
          spawnNeonSpore(lastSporeX, lastSporeY);
        }
      }
    });

    window.addEventListener('mouseup', () => {
      leafCursor.classList.remove('cursor-down');
    });

    document.addEventListener('mouseleave', () => {
      leafCursor.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
      leafCursor.classList.add('visible');
    });
  }

  function attachEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    setupNeonLeafCursor();

    startBtn.addEventListener('click', dismissLoader);
    audioToggle.addEventListener('click', toggleAudio);

    // Mobile Hamburger Button & Drawer Event Listeners
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.toggleMobileDrawer();
      });
    }

    const drawerCloseBtn = document.getElementById('mobile-drawer-close');
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeMobileDrawer();
      });
    }

    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    if (mobileNavOverlay) {
      mobileNavOverlay.addEventListener('click', (e) => {
        if (e.target === mobileNavOverlay) {
          window.closeMobileDrawer();
        }
      });
    }

    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        window.closeMobileDrawer();
        if (action === 'home') {
          window.closeAllPanels();
        } else if (action === 'competitions' || action === 'accommodation' || action === 'about' || action === 'sponsors' || action === 'register') {
          window.openPanel(action);
        } else if (action === 'lodging') {
          window.openAccomServiceSelector('lodging');
        } else if (action === 'fooding') {
          window.openAccomServiceSelector('fooding');
        }
      });
    });

    // Accommodation Booking Buttons (Front Wall, Logistics Strip, FAQs, and secondary triggers)
    document.querySelectorAll('#accom-book-btn-front, #accom-book-btn-strip, #accom-book-btn-faq, .screenshot60-book-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openAccomServiceSelector();
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openAccomServiceSelector();
      });
    });

    setupScrollInteractions();

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.closeAllPanels();
        window.closeCompModal();
        if (typeof window.closeMobileDrawer === 'function') window.closeMobileDrawer();
        if (typeof window.closeAccomServiceSelector === 'function') window.closeAccomServiceSelector();
        if (typeof window.closeAccomBookingModal === 'function') window.closeAccomBookingModal();
        const successModal = document.getElementById('success-modal');
        if (successModal) successModal.classList.remove('open');
        const accomSuccess = document.getElementById('accom-success-modal');
        if (accomSuccess) accomSuccess.classList.remove('open');
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          targetFrame = Math.min(TOTAL_FRAMES - 1, targetFrame + 4);
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          targetFrame = Math.max(0, targetFrame - 4);
        }
      }
    });
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function hydrateDynamicCmsContent() {
    if (!window.TechnoritiDB) return;

    try {
      // 1. Hydrate Site Settings & Hero
      const settings = await window.TechnoritiDB.getSiteSettings();
      if (settings) {
        const fest = settings.general_fest_info;
        if (fest) {
          if (fest.fest_name) {
            document.querySelectorAll('.brand-title').forEach(el => el.textContent = fest.fest_name);
            const loaderTitle = document.querySelector('.loader-title');
            if (loaderTitle) loaderTitle.textContent = fest.fest_name;
            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
              const span = startBtn.querySelector('span');
              if (span) span.textContent = `Enter ${fest.fest_name}`;
            }
          }
          if (fest.college_tag) {
            document.querySelectorAll('.brand-tag').forEach(el => el.textContent = fest.college_tag);
          }
          if (fest.cta_primary_text) {
            const regBtnText = document.querySelector('.cyber-btn-register .btn-text');
            if (regBtnText) regBtnText.textContent = fest.cta_primary_text;
          }
          if (fest.registration_btn_visible === false) {
            const regBtn = document.querySelector('.cyber-btn-register');
            if (regBtn) regBtn.style.display = 'none';
          }
        }

        // Announcement Ticker
        const ann = settings.announcement_banner;
        if (ann && ann.enabled && ann.text) {
          let ticker = document.getElementById('public-announcement-ticker');
          if (!ticker) {
            ticker = document.createElement('div');
            ticker.id = 'public-announcement-ticker';
            document.body.prepend(ticker);
            document.body.classList.add('has-announcement');
          }
          ticker.className = `announcement-ticker priority-${ann.priority || 'normal'}`;
          ticker.innerHTML = `
            <span>📢 ${escapeHtml(ann.text)}</span>
            ${ann.link_url ? `<a href="${escapeHtml(ann.link_url)}">Check Details ↗</a>` : ''}
          `;
        }

        // Accommodation Policy
        const accom = settings.accommodation_policy;
        if (accom) {
          const boysCoordEl = document.querySelector('.coord-pill-box:first-child .cp-name');
          if (accom.boys_coordinator && boysCoordEl) {
            boysCoordEl.textContent = accom.boys_coordinator;
          }
          const girlsCoordEl = document.querySelector('.coord-pill-box:last-child .cp-name');
          if (accom.girls_coordinator && girlsCoordEl) {
            girlsCoordEl.textContent = accom.girls_coordinator;
          }
        }

        // SEO Meta
        const seo = settings.seo_metadata;
        if (seo && seo.site_title) {
          document.title = seo.site_title;
        }

        // Mobile Hero Visibility Controls
        applyMobileHeroVisibility(settings.mobile_hero_visibility);
      }

      // 2. Hydrate Navigation Items
      const navItems = await window.TechnoritiDB.getNavigationItems(true);
      if (navItems && navItems.length > 0) {
        const navList = document.querySelector('.nav-links');
        if (navList) {
          navList.innerHTML = navItems.map(item => {
            if (item.is_external) {
              return `<li><a href="${escapeHtml(item.destination_url)}" class="nav-item" ${item.open_in_new_tab ? 'target="_blank" rel="noopener"' : ''} style="text-decoration:none;">${escapeHtml(item.label)}</a></li>`;
            } else {
              return `<li><button class="nav-item" onclick="window.openPanel('${escapeHtml(item.destination_url)}')">${escapeHtml(item.label)}</button></li>`;
            }
          }).join('');
        }
      }

      // 3. Hydrate Leadership & Content Sections
      const sections = await window.TechnoritiDB.getContentSections();
      if (sections && sections.length > 0) {
        const principal = sections.find(s => s.id === 'about_principal');
        if (principal) {
          const pName = document.querySelector('.principal-name, .spotlight-title');
          if (pName && principal.title) pName.textContent = principal.title;
          const pQuote = document.querySelector('.principal-quote, .spotlight-quote');
          if (pQuote && principal.content) pQuote.textContent = `"${principal.content}"`;
          const pPort = document.querySelector('.principal-portrait');
          if (pPort && principal.metadata?.portrait_src) pPort.src = principal.metadata.portrait_src;
        }
      }

      // 4. Hydrate Accommodation FAQs
      const faqs = await window.TechnoritiDB.getAccommodationFAQs();
      if (faqs && Array.isArray(faqs) && faqs.length > 0) {
        const faqList = document.getElementById('room-faq-list');
        if (faqList) {
          faqList.innerHTML = faqs.map(faq => `
            <div class="faq-item" onclick="window.toggleFaq(this)">
              <div class="faq-question">
                <span>${escapeHtml(faq.question)}</span>
                <span class="faq-toggle-icon">+</span>
              </div>
              <div class="faq-answer">
                ${escapeHtml(faq.answer)}
              </div>
            </div>
          `).join('');
        }
      }

      // 5. Hydrate Sponsors with Click-Through Links & Logos
      const sponsors = await window.TechnoritiDB.getSponsors();
      if (sponsors && sponsors.length > 0) {
        const partnerGrids = document.querySelectorAll('.partners-grid-dr');
        if (partnerGrids.length > 0) {
          const cellsHtml = sponsors.map(s => {
            const logoMarkup = s.logo_url
              ? `<img src="${escapeHtml(s.logo_url)}" alt="${escapeHtml(s.name)}" class="sponsor-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="p-emblem" style="display:none;">${escapeHtml(s.emblem || '⚡')}</div>`
              : `<div class="p-emblem">${escapeHtml(s.emblem || '⚡')}</div>`;

            return `
              <div class="partner-cell">
                ${logoMarkup}
                <strong>${escapeHtml(s.name)}</strong>
                <p>${escapeHtml(s.subtitle || (s.tier ? s.tier.replace('_', ' ').toUpperCase() : 'Festival Partner'))}</p>
              </div>
            `;
          }).join('');
          partnerGrids.forEach(g => g.innerHTML = cellsHtml);
        }
      }
    } catch (err) {
      console.warn('Hydration note:', err.message);
    }
  }

  function applyMobileHeroVisibility(cfg) {
    const m = cfg || {
      show_tagline: false,
      show_theme: false,
      show_event_date: false,
      show_edition_card: false,
      show_competition_count: false,
      show_prize_pool: false,
      show_college_tag: true,
      show_cta_buttons: true
    };

    const badge = document.getElementById('hero-badge-tagline');
    if (badge) badge.classList.toggle('mobile-forced-show', !!m.show_tagline);

    const theme = document.getElementById('hero-theme-text');
    if (theme) theme.classList.toggle('mobile-forced-show', !!m.show_theme);

    const dateCue = document.getElementById('hero-date-text');
    if (dateCue) dateCue.classList.toggle('mobile-forced-show', !!m.show_event_date);

    const statEdition = document.getElementById('hero-stat-edition');
    if (statEdition) statEdition.classList.toggle('mobile-forced-show', !!m.show_edition_card);

    const statComps = document.getElementById('hero-stat-comps');
    if (statComps) statComps.classList.toggle('mobile-forced-show', !!m.show_competition_count);

    const statPrize = document.getElementById('hero-stat-prize');
    if (statPrize) statPrize.classList.toggle('mobile-forced-show', !!m.show_prize_pool);

    const collegeTag = document.getElementById('hero-college-name');
    if (collegeTag) collegeTag.classList.toggle('mobile-forced-hide', m.show_college_tag === false);

    const ctaGroup = document.getElementById('hero-cta-group');
    if (ctaGroup) ctaGroup.classList.toggle('mobile-forced-hide', m.show_cta_buttons === false);

    const statsContainer = document.getElementById('hero-stats-container');
    const hasVisibleStats = !!(m.show_edition_card || m.show_competition_count || m.show_prize_pool);
    if (statsContainer) {
      statsContainer.classList.toggle('mobile-has-visible-stats', hasVisibleStats);
    }
  }

  function init() {
    applyMobileHeroVisibility();
    resizeCanvas();
    attachEventListeners();
    renderCompetitions('all');
    setupFilterButtons();
    initPreloader();
    setup3DRoomInteractions();
    initTvScreenStream();
    initRoomCountdown();
    window.rotateRoomTo(0);
    hydrateDynamicCmsContent();
    requestAnimationFrame(renderLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
