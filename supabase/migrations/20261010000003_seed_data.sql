-- =====================================================================
-- TECHNORITI '26 - Supabase Seed Data Migration
-- Migration: 20261010000003_seed_data.sql
-- Description: Seeds 29 competitions, categories, rules, prizes, sponsors, 
--              content sections, navigation items, and accommodation options
-- =====================================================================

-- 1. SEED EVENT CATEGORIES
INSERT INTO public.event_categories (id, name, slug, description, sort_order) VALUES
('robotics', 'Robotics & Hardware', 'robotics', 'Combat bots, line-followers, aquatic bots and embedded hardware challenges.', 1),
('coding', 'Coding & Cyber', 'coding', 'Hackathons, digital forensics, algorithmic challenges and bug hunting arenas.', 2),
('design', 'Design & Civil', 'design', 'Structural modeling, CAD design, land surveying and engineering simulations.', 3),
('gaming', 'Esports & Gaming', 'gaming', 'Competitive esports titles, tactical FPS tournaments and strategic e-chess.', 4),
('quizzes', 'Quizzes & Literary', 'quizzes', 'High-voltage trivia, street theater, debates, photography and cinematography.', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. SEED 29 EVENTS
INSERT INTO public.events (
    id, title, slug, category_id, short_desc, registration_fee, fee_type, prize_pool,
    first_prize, second_prize, third_prize, team_size_min, team_size_max,
    event_date, event_time, venue, registration_status, is_published, sort_order,
    coordinator_name, coordinator_phone
) VALUES
-- ROBOTICS
('robowar', 'RoboWar', 'robowar', 'robotics', 'The ultimate battle arena. Build a wired/wireless combat bot capable of overpowering, flipping, or knocking opponents into hazards.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:00 AM', 'Robotics Arena, BCE Bhagalpur', 'open', true, 1, 'Shubham Thakur / Vinit Kumar', '9166344621 / 8302534925'),
('robosoccer', 'RoboSoccer', 'robosoccer', 'robotics', 'Design an agile soccer bot with pushing/hitting mechanisms to score goals and defend against rival machines.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '11:00 AM', 'Indoor Sports Complex, BCE Bhagalpur', 'open', true, 2, 'Md. Aman Ansari / Madan Kumar Jha', '9546684329 / 7360983955'),
('dhanush', 'Dhanush – LFR', 'dhanush-lfr', 'robotics', 'Autonomous line-following robot challenge following the Gandiv bow concept through complex black line tracks & checkpoints.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:30 AM', 'ECE Lab Hall, BCE Bhagalpur', 'open', true, 3, 'Manish Kumar / Saurav Singh', '9523338938 / 8340488701'),
('matsya', 'Matsya – AquaBot', 'matsya-aquabot', 'robotics', 'Aquatic robotics event navigating through floating hurdles while catching targeted balls in open water arena.', 200, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '02:00 PM', 'College Lake Arena, BCE Bhagalpur', 'open', true, 4, 'Varun Singh / Deepankar Pandey', '9334634930 / 9102977705'),
('electrotechnovation', 'ElectroTechnovation', 'electrotechnovation', 'robotics', 'Flagship embedded system circuit innovation arena solving real-world automation, energy, and smart technology challenges.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '11:00 AM', 'Electrical Engineering Block', 'open', true, 5, 'Ranjan Kumar / Sudhanshu', '8210355418 / 9304193615'),
('arduino', 'Arduino Effect', 'arduino-effect', 'robotics', 'Design responsive embedded hardware solutions on microcontrollers with real-time sensors, LCD displays and actuation.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '01:30 PM', 'IoT & Embedded Lab, BCE Bhagalpur', 'open', true, 6, 'Gaurav Kumar / Amit Kumar', '9341490218 / 7488924045'),
('boatmaking', 'Boat Making Challenge', 'boat-making-challenge', 'robotics', 'Fabricate buoyant, streamlined boats powered by small electric motors to race along a straight water track with fastest sprint times.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '03:00 PM', 'Hydraulics Laboratory, BCE Bhagalpur', 'open', true, 7, 'Ashish Kumar / Suraj Kumar', '7903456789 / 9876543210'),
('electronicsproject', 'Electronics Project Exhibition', 'electronics-project-exhibition', 'robotics', 'Demonstrate innovative working hardware prototypes, embedded IoT devices, and automation models to academic & industry juries.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:00 AM', 'Central Seminar Hall, BCE Bhagalpur', 'open', true, 8, 'Amit Kumar / Aushutosh Ranjan', '7257929573 / 8863971241'),

-- CODING & CYBER
('hackathon', '36-Hour Hackathon', '36-hour-hackathon', 'coding', 'Sprint 36-hour software marathon solving real-world challenges with innovative software, UI/UX, and technical execution.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '09:00 AM', 'Computer Center, BCE Bhagalpur', 'open', true, 9, 'Aniket / Himanshu Vishwas', '8802632032 / 9128571355'),
('forensic', 'Forensic Hackathon', 'forensic-hackathon', 'coding', 'Organized with CFET New Delhi & HHFC Patna. Investigate digital forensic clues, network intrusions, and cyber-crime files.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 2, 4, 'December 2026', '11:00 AM', 'Cyber Forensics Lab, BCE Bhagalpur', 'open', true, 10, 'Dev Raj Dev / Shailendra', '9631766064 / 7295084407'),
('competitive', 'Competitive Programming', 'competitive-programming', 'coding', 'High-speed algorithmic contest by Debuggerzz Club. Solve DSA problems in C, C++, Java, or Python.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '02:00 PM', 'Computer Center Lab 1', 'open', true, 11, 'Dev Raj Dev / Himanshu Vishwas', '9631766064 / 9128571355'),
('blindcoding', 'Blind Coding', 'blind-coding', 'coding', 'Write complete syntactically correct code in C/C++ with the computer monitor powered off!', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '03:30 PM', 'Computer Center Lab 2', 'open', true, 12, 'Anukul Anand / Ankit Srivastava', '7633072155 / 6200271610'),
('bughunting', 'Bug Hunting', 'bug-hunting', 'coding', 'Spot vulnerabilities, logic flaws, and hidden exploits in live application targets under a 2-hour timer.', 50, 'member', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 2, 'December 2026', '04:00 PM', 'Software Engineering Lab', 'open', true, 13, 'Aniket / Aakash Bhardwaj', '8802632032 / 9113490269'),
('memecircuit', 'MeMe Circuit', 'meme-circuit', 'coding', 'Combine humor, meme culture, and tech savviness to create hilarious original tech/engineering memes on designated topics.', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '01:00 PM', 'Multimedia Studio, BCE Bhagalpur', 'open', true, 14, 'Rishu Kumar / Ayush Sharma', '9123456780 / 9876501234'),
('matlab', 'MATLAB Simulation Challenge', 'matlab-simulation-challenge', 'coding', 'Model and simulate dynamic engineering systems, signal processing pipelines, or power grid models in MATLAB & Simulink.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '02:30 PM', 'Simulation Center, BCE Bhagalpur', 'open', true, 15, 'Priyanshu / Rohit Kumar', '7890123456 / 8901234567'),

-- GAMING
('freefire', 'Free-Fire Championship', 'free-fire-championship', 'gaming', 'Battle royale and 4v4 Clash Squad esports showdown. Coordinate strategies, push ranks, and claim the Technoriti gaming trophy.', 300, 'team', '₹6,000', 'Squad: Rs 3000', 'Squad: Rs 2000', 'BR: Rs 1000', 4, 4, 'December 2026', '05:00 PM', 'Esports Arena (Online / LAN Stage)', 'open', true, 16, 'Dev Raj Dev / Ratan Kumar', '9631766064 / 9142750917'),
('echess', 'E-Chess Tournament', 'e-chess-tournament', 'gaming', 'Mind game battle of tactical masters conducted on international chess clocks. Rapid & Blitz knockout formats.', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '10:00 AM', 'Library Reading Hall, BCE Bhagalpur', 'open', true, 17, 'Sumit Kumar / Rahul Anand', '7856341290 / 9431876523'),

-- DESIGN & CIVIL
('bridgemaking', 'Bridge Making Challenge', 'bridge-making-challenge', 'design', 'Construct truss bridge models using specified wooden sticks & adhesive tested on point load deflection machines.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:30 AM', 'Civil Engineering Structural Lab', 'open', true, 18, 'Aman Kumar / Vivek Sharma', '9334567812 / 8210987654'),
('surveyking', 'Survey King', 'survey-king', 'design', 'Field surveying challenge testing rapid leveling, transit theodolite triangulation, and contour mapping on campus grounds.', 50, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '01:00 PM', 'Main Campus Field, BCE Bhagalpur', 'open', true, 19, 'Md. Danish / Saurabh Kumar', '8765432109 / 9876123450'),
('autocad', 'AutoCAD Design Clash', 'autocad-design-clash', 'design', 'Fastest precision 2D drafting & 3D civil/mechanical modeling contest under time constraints with exact GD&T tolerances.', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '11:30 AM', 'CAD/CAM Laboratory, BCE Bhagalpur', 'open', true, 20, 'Vikash Singh / Ravi Ranjan', '7654321098 / 8901234578'),
('solidworks', 'SolidWorks 3D Challenge', 'solidworks-3d-challenge', 'design', 'Model complex mechanical assemblies, parametric components, and render mechanical movements under competitive pressure.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '03:00 PM', 'Mechanical CAD Center', 'open', true, 21, 'Nitish Kumar / Deepak Verma', '9123456789 / 7890564321'),
('projectpresentation', 'Project Presentation', 'project-presentation', 'design', 'Present innovative research papers, prototype concepts, or engineering project synopses before our expert academic evaluation panel.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '02:00 PM', 'Auditorium Hall B, BCE Bhagalpur', 'open', true, 22, 'Rajnish Kumar / Sneha Sinha', '8765432190 / 9431234567'),

-- QUIZZES & LITERARY
('zerocarbon', 'Zero Carbon Debate', 'zero-carbon-debate', 'quizzes', 'Parliamentary debate on sustainability, green hydrogen, nuclear energy, carbon taxation, and environmental engineering policy.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '11:00 AM', 'Humanities Seminar Hall', 'open', true, 23, 'Ananya Kumari / Aditya Prakash', '9123456711 / 8210987611'),
('cinematography', 'Cinematography Contest', 'cinematography-contest', 'quizzes', 'Create cinematic short films capturing campus life, technical innovation, or futuristic narrative themes in Full HD.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '04:00 PM', 'Auditorium Main Stage', 'open', true, 24, 'Ritik Raj / Shubhashish', '9876543212 / 8765432123'),
('photography', 'Photography Contest', 'photography-contest', 'quizzes', 'Freeze decisive moments of techfest emotion, motion blur, and architectural aesthetics across BCE Bhagalpur campus.', 50, 'member', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 2, 'December 2026', '02:00 PM', 'Open Air Gallery, BCE Bhagalpur', 'open', true, 25, 'Abhinav Kumar / Tanya Singh', '7890123499 / 8901234599'),
('electromania', 'ElectroMania Quiz', 'electromania-quiz', 'quizzes', 'Rapid-fire quiz testing electronic circuit trivia, semiconductor history, quantum computing breakthroughs, and technical concepts.', 200, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 2, 4, 'December 2026', '12:00 PM', 'ECE Department Hall', 'open', true, 26, 'Siddharth Kumar / Rohit Jha', '9123456782 / 8210987652'),
('nukkad', 'Nukkad (Street Play)', 'nukkad-street-play', 'quizzes', 'Energetic street plays addressing technology ethics, cybersecurity awareness, social reform, or scientific education.', 200, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 6, 15, 'December 2026', '04:30 PM', 'Administrative Block Lawn', 'open', true, 27, 'Prashant Kumar / Shreya Raj', '9431234568 / 8765432101'),
('generalquiz', 'General Quiz Challenge', 'general-quiz-challenge', 'quizzes', 'Comprehensive trivia challenge covering world history, space discoveries, pop culture, geography, and technological milestones.', 100, 'team', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 2, 3, 'December 2026', '01:30 PM', 'Central Library Hall', 'open', true, 28, 'Alok Kumar / Neha Kumari', '9123456799 / 7890123411'),
('scitechquiz', 'SciTech Grand Quiz', 'scitech-grand-quiz', 'quizzes', 'The definitive flagship science and technology quiz testing deep engineering trivia, computing pioneers, and space missions.', 100, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 2, 3, 'December 2026', '03:30 PM', 'Main Auditorium, BCE Bhagalpur', 'open', true, 29, 'Adarsh Raj / Swati Priya', '8210987644 / 9431234590')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_desc = EXCLUDED.short_desc,
    registration_fee = EXCLUDED.registration_fee,
    fee_type = EXCLUDED.fee_type,
    prize_pool = EXCLUDED.prize_pool,
    coordinator_name = EXCLUDED.coordinator_name,
    coordinator_phone = EXCLUDED.coordinator_phone;

-- 3. SEED EVENT PRIZES (1st and 2nd for each event)
INSERT INTO public.event_prizes (event_id, position, prize_title, prize_amount) VALUES
('robowar', 1, '1st Prize / Champion', 'Rs 3000'),
('robowar', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('robosoccer', 1, '1st Prize / Champion', 'Rs 3000'),
('robosoccer', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('dhanush', 1, '1st Prize / Champion', 'Rs 3000'),
('dhanush', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('matsya', 1, '1st Prize / Champion', 'Rs 3000'),
('matsya', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('hackathon', 1, '1st Prize / Best Innovation', 'Rs 3000'),
('hackathon', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('forensic', 1, '1st Prize / Master Investigator', 'Rs 3000'),
('forensic', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('competitive', 1, '1st Prize / Algorithmic Master', 'Rs 3000'),
('competitive', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('blindcoding', 1, '1st Prize / Precision Coder', 'Rs 2000'),
('blindcoding', 2, '2nd Prize / Runner Up', 'Rs 1000'),
('bughunting', 1, '1st Prize / Top Security Researcher', 'Rs 2000'),
('bughunting', 2, '2nd Prize / Runner Up', 'Rs 1000')
ON CONFLICT (event_id, position) DO NOTHING;

-- 4. SEED EVENT RULES (Sample Key Rules)
INSERT INTO public.event_rules (event_id, rule_number, rule_text) VALUES
('robowar', 1, 'Dimensions: Bot must fit in a 300 x 300 x 300 mm box. Weight limit: 10 kg maximum.'),
('robowar', 2, 'Power source: Electrically powered, maximum potential difference 18V DC at any point.'),
('robowar', 3, 'Arena hazards: Central hole depth is 300 mm. Out of arena = 15 pts, Immovable opponent = 30 pts.'),
('robosoccer', 1, 'Bot weight limit: 5 kg. Maximum dimensions: 30 x 30 x 30 cm.'),
('robosoccer', 2, 'Voltage at any electrical connection must not exceed 12V DC.'),
('dhanush', 1, 'Strictly autonomous; maximum bot dimensions 25 x 25 x 25 cm, mass 1 kg.'),
('dhanush', 2, 'Voltage must not exceed 12V DC. Must have a physical start & stop button.'),
('hackathon', 1, 'Teams must bring their own laptops and development equipment.'),
('hackathon', 2, 'Specific problem statements will be revealed at the commencement.')
ON CONFLICT (event_id, rule_number) DO NOTHING;

-- 5. SEED SPONSORS
INSERT INTO public.sponsors (name, tier, emblem, subtitle, website_url, sort_order) VALUES
('CFET New Delhi', 'technical', 'CFET', 'Centre for Forensic Excellence & Tech', 'https://cfet.org.in', 1),
('HHFC Patna', 'patron', 'HHFC', 'Patronized Cyber Security Org', 'https://hhfc.org', 2),
('DST Bihar', 'patron', 'DST', 'Dept of Science & Technology Bihar', 'https://state.bihar.gov.in/dst', 3),
('Debuggerzz Club', 'student_media', 'DBG', 'Coding & Cyber Security Community', 'https://bcebhagalpur.ac.in', 4),
('Campus TV & Radio', 'student_media', 'TV', 'Media & Broadcasting Crew', 'https://bcebhagalpur.ac.in', 5),
('ESROS Robotics', 'technical', 'ESROS', 'Robotics Arena Engineers', 'https://esros.in', 6)
ON CONFLICT DO NOTHING;

-- 6. SEED ACCOMMODATION OPTIONS
INSERT INTO public.accommodation_options (id, title, room_type, description, daily_lodging_fee, daily_food_fee, group_discount_threshold, group_discount_amount, available_beds) VALUES
('bce_hostel_standard', 'Standard Campus Hostel', 'Boys & Girls Hostel Blocks', 'Clean, secure hostel rooms inside BCE Bhagalpur campus with 24-hr security, hot water, and college mess dining included.', 50, 125, 4, 150, 300)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 7. SEED NAVIGATION ITEMS
INSERT INTO public.navigation_items (label, destination_url, is_external, open_in_new_tab, sort_order) VALUES
('ABOUT', 'about', false, false, 1),
('COMPETITIONS', 'competitions', false, false, 2),
('ACCOMMODATION', 'accommodation', false, false, 3),
('SPONSORS', 'sponsors', false, false, 4),
('REGISTER', 'register', false, false, 5)
ON CONFLICT DO NOTHING;

-- 8. SEED SITE SETTINGS
INSERT INTO public.site_settings (key, value, description) VALUES
('general_fest_info', '{
    "fest_name": "TECHNORITI \'26",
    "edition": "2026",
    "college_name": "Bhagalpur College of Engineering",
    "college_tag": "BCE BHAGALPUR",
    "dates": "December 2026",
    "countdown_target": "2026-12-18T09:00:00+05:30",
    "total_competitions": 29,
    "prize_pool_display": "₹1,00,000+",
    "registration_open": true
}'::jsonb, 'Core festival metadata displayed across hero and header'),
('accommodation_policy', '{
    "lodging_fee_daily": 50,
    "food_fee_daily": 125,
    "boys_coordinator": "Prof. Kumar Jyotiraditya (7004618331)",
    "girls_coordinator": "Prof. Sarika Kushwaha (7321018753)",
    "check_in": "December 2026, 6:00 AM",
    "check_out": "December 2026, 10:00 PM"
}'::jsonb, 'Campus accommodation tariffs and logistics contact numbers')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value;

-- 9. SEED CONTENT SECTIONS
INSERT INTO public.content_sections (id, title, subtitle, content, metadata, sort_order) VALUES
('about_principal', 'Dr. Bimlesh Kumar', 'Principal, Bhagalpur College of Engineering', 
'Education prepares a person to meet new challenges, scale fresh heights and lead a successful life. We, therefore, at BCE Bhagalpur, would like to encourage all students to strive for the best and achieve excellence by way of inclusiveness, integrity, innovation and creativity.', 
'{"portrait_src": "principal-portrait.png", "designation": "HEAD OF INSTITUTION"}'::jsonb, 1),
('about_convenors', 'Fest Convenors', 'Department Leadership', 
'Prof. Ranjan Kumar Mishra (HOD, Department of Chemistry) & Prof. Shashank Shekhar (HOD, Department of Humanities)', 
'{"convenors": [{"name": "Prof. Ranjan Kumar Mishra", "dept": "Chemistry"}, {"name": "Prof. Shashank Shekhar", "dept": "Humanities"}]}'::jsonb, 2),
('about_legacy', 'BCE Legacy', 'Estd. 1960', 
'Bhagalpur College of Engineering is one of the premier technical colleges in Bihar. Technoriti brings together over 1,500 innovators across robotics, coding, cyber forensics, aerospace design, and core engineering branches.', 
'{"established": 1960, "location": "Bhagalpur, Bihar"}'::jsonb, 3)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content;
