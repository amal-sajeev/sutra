import { db } from '../db/database';

/**
 * Seeds a complete demo project: "The Chagos Directive"
 * Returns the new project ID.
 */
export async function seedDemoProject(): Promise<number> {
  return db.transaction('rw', [
    db.projects, db.chapters, db.scenes, db.characters,
    db.relationships, db.ideas, db.timelineEvents,
    db.characterAppearances, db.snapshots,
  ], async () => {
    const now = Date.now();

    // ────────────────────────────────────────
    // PROJECT
    // ────────────────────────────────────────
    const projectId = await db.projects.add({
      title: 'The Chagos Directive',
      oneSentence: 'An augmented RAW operative must infiltrate a seized island nation in the Indian Ocean to disable stolen nuclear launch systems before a geopolitical crisis spirals beyond recovery.',
      oneParag: 'Ten years ago, India\'s Research and Analysis Wing quietly began Project Vajra — a super-soldier program operating on a threadbare budget, modifying adult volunteers with enhanced reflexes, cognitive speed, and endurance. When a breakaway LTTE faction calling itself the "New Tigers" seizes the Chagos Archipelago, overruns the US base at Diego Garcia, and declares a new island nation called Kalimaran, the world holds its breath. The faction has acquired missile launch systems and nuclear payloads. One American sailor, rescued by Tamil fishermen, relays critical intel to Indian intelligence. RAW dispatches its sole operational asset — Major Arjun Khalsa — to infiltrate the island, plant a cyber-virus to permanently disable the launch firmware, and extract without triggering US intervention or nuclear escalation. But on the island, nothing is what the briefing promised.',
      createdAt: now - 86400000 * 14,
      updatedAt: now,
      settings: {},
    });

    // ────────────────────────────────────────
    // CHARACTERS
    // ────────────────────────────────────────
    const arjunId = await db.characters.add({
      projectId,
      name: 'Major Arjun Khalsa',
      color: '#2563eb',
      description: 'Project Vajra\'s sole operational super-soldier. 34 years old, born in Chandigarh. Former Para SF officer who volunteered for augmentation after losing his squad in a botched Kashmir operation. The modifications gave him enhanced reflexes, accelerated healing, and a cognitive processing speed roughly 4x normal — but at the cost of chronic migraines, emotional blunting, and a body that burns through calories at a terrifying rate. Quiet, methodical, haunted. Carries a worn copy of the Japji Sahib.',
      role: 'Protagonist',
      motivation: 'Redemption for his lost squad; proving that Vajra — and he — was worth the cost.',
      goal: 'Infiltrate Kalimaran, upload the virus to the launch systems, extract clean.',
      conflict: 'His augmentations are degrading. He was built for short bursts, not a sustained solo mission. And the people on this island are not all enemies.',
      epiphany: 'The line between soldier and weapon is thinner than he was told. He must choose which he is.',
    });

    const meeraId = await db.characters.add({
      projectId,
      name: 'Dr. Meera Nair',
      color: '#0d9488',
      description: 'RAW\'s chief cyberwarfare specialist and the architect of the Kali virus — the firmware attack designed to brick the launch systems permanently. 29, from Kochi. IIT Madras graduate, recruited straight from her PhD. Brilliant, impatient, and deeply uncomfortable that her code is now a weapon of state. Communicates with Arjun via encrypted burst transmissions. Has never been in the field.',
      role: 'Mission Support / Tech Lead',
      motivation: 'Intellectual pride — she built this, and she needs it to work. But also a growing horror at what happens if it doesn\'t.',
      goal: 'Guide Arjun through the upload procedure remotely; keep the virus from being detected.',
      conflict: 'She designed the virus for a specific hardware configuration. The intel might be wrong.',
    });

    const vikramId = await db.characters.add({
      projectId,
      name: 'Colonel Vikram Singh',
      color: '#6b7280',
      description: 'Arjun\'s handler and the man who built Project Vajra from nothing. 52, a career RAW officer with grey temples and a smoker\'s rasp. Pragmatic to the point of cruelty. He fought for a decade to keep Vajra funded, and now his one asset is walking into a situation that could end the program — or justify its existence forever. Operates from a secure facility in Delhi.',
      role: 'Handler / Mentor',
      motivation: 'Prove Vajra works. Protect India\'s strategic position. Keep Arjun alive — in that order.',
      goal: 'Run the operation cleanly from Delhi; manage the political fallout.',
      conflict: 'The Americans are breathing down his neck. If they find out India has a super-soldier on their seized base, the diplomatic situation becomes catastrophic.',
    });

    const kumaranId = await db.characters.add({
      projectId,
      name: 'Kumaran',
      color: '#ea580c',
      description: 'Self-styled "First Minister" of Kalimaran. Born Kumaran Thevarasa, 48, a former LTTE logistics commander who survived the 2009 defeat and spent a decade rebuilding in the shadows. Charismatic, patient, ruthless when necessary. He doesn\'t see himself as a terrorist — he sees himself as a nation-builder, and the nuclear arsenal is his insurance policy against the world. Speaks softly. Carries no weapon personally.',
      role: 'Antagonist',
      motivation: 'A sovereign Tamil homeland. After decades of broken promises and genocide, he will carve one from the sea itself.',
      goal: 'Establish Kalimaran as a recognized nuclear state. Force the world to negotiate.',
      conflict: 'He knows his window is closing. The Americans will come. India will come. He needs the world to blink first.',
      epiphany: 'He built a nation on a threat. Nations built on threats do not survive.',
    });

    const selvamId = await db.characters.add({
      projectId,
      name: 'Dr. Selvam',
      color: '#eab308',
      description: 'Kalimaran\'s nuclear physicist. 56, formerly of BARC (Bhabha Atomic Research Centre) before he disappeared in 2017. A Tamil Brahmin who grew disillusioned with India\'s treatment of Sri Lankan Tamils. Thin, bespectacled, speaks in a near-whisper. He is the one who made the warheads functional. He is also the one who knows, in his bones, that they should never be used.',
      role: 'Conflicted Ally of Antagonist',
      motivation: 'Tamil solidarity — but also scientific legacy. He wants to prove he could do it.',
      goal: 'Maintain the weapons as a credible deterrent without ever launching.',
      conflict: 'Kumaran may not share his restraint. And the launch systems have a dead-man\'s switch he didn\'t approve.',
    });

    const jimmyId = await db.characters.add({
      projectId,
      name: 'PO2 James "Jimmy" Holt',
      color: '#dc2626',
      description: 'US Navy Petty Officer Second Class, 26, from Beaumont, Texas. Sonar technician stationed at Diego Garcia. During the New Tigers\' assault, he was thrown from a patrol boat into open water. Spent 11 hours floating before Tamil fishing boats found him. Sunburned, dehydrated, traumatized — but his debriefing provided the critical intel on the base layout and the launch system locations. Currently in protective custody in Chennai.',
      role: 'Intelligence Source',
      motivation: 'Survive. Get home. Make sure his dead shipmates didn\'t die for nothing.',
      goal: 'Provide accurate intel; eventually be repatriated to the US.',
      conflict: 'He doesn\'t trust Indian intelligence. He saw what the New Tigers did to his crew.',
    });

    const priyaId = await db.characters.add({
      projectId,
      name: 'Priya Ramanathan',
      color: '#16a34a',
      description: 'Tamil fisherwoman, 31, from a village near Rameswaram. Her family has fished the waters between India and Sri Lanka for generations. She captains a small trawler with her brother. She pulled Jimmy Holt from the water and, instead of turning him over immediately, hid him for two days while she assessed the situation. Practical, fearless, and deeply suspicious of all governments. Speaks broken English learned from tourist season.',
      role: 'Catalyst / Ground Contact',
      motivation: 'Protect her family. She owes nothing to any flag.',
      goal: 'Stay out of the intelligence agencies\' crosshairs.',
      conflict: 'RAW wants to use her fishing network as a logistics pipeline to the island. She knows the cost of saying yes — and the cost of saying no.',
    });

    const chenId = await db.characters.add({
      projectId,
      name: 'Rear Admiral Chen Wei',
      color: '#1e3a5f',
      description: 'US Navy, INDOPACOM staff. 50, second-generation Chinese-American from Annapolis. He was the senior officer to escape Diego Garcia and is now coordinating the American response from a carrier group in the Arabian Sea. Professional, cold under pressure, and deeply unhappy that the Indians seem to be running a parallel operation he can\'t see. Has standing orders to retake the base — but also standing orders not to trigger a nuclear exchange.',
      role: 'Geopolitical Pressure / Rival',
      motivation: 'American national security. Recovering Diego Garcia. Not starting World War III.',
      goal: 'Coordinate the US military response; find out what India is really doing.',
      conflict: 'If India\'s operation goes sideways, his carrier group is in the blast radius.',
    });

    // ────────────────────────────────────────
    // RELATIONSHIPS
    // ────────────────────────────────────────
    await db.relationships.bulkAdd([
      { projectId, characterAId: arjunId, characterBId: vikramId, type: 'mentor', label: 'Handler / creator of Vajra' },
      { projectId, characterAId: arjunId, characterBId: meeraId, type: 'ally', label: 'Mission partnership; growing trust' },
      { projectId, characterAId: arjunId, characterBId: kumaranId, type: 'enemy', label: 'Operative vs. target' },
      { projectId, characterAId: kumaranId, characterBId: selvamId, type: 'ally', label: 'Uneasy alliance; shared cause, different limits' },
      { projectId, characterAId: jimmyId, characterBId: priyaId, type: 'ally', label: 'Rescuer and rescued; mutual debt' },
      { projectId, characterAId: vikramId, characterBId: chenId, type: 'rival', label: 'Geopolitical tension; parallel operations' },
      { projectId, characterAId: arjunId, characterBId: priyaId, type: 'ally', label: 'She provides his route to the island' },
      { projectId, characterAId: kumaranId, characterBId: chenId, type: 'enemy', label: 'Seized his base; nuclear standoff' },
    ]);

    // ────────────────────────────────────────
    // CHAPTERS & SCENES
    // ────────────────────────────────────────

    // --- CHAPTER 1 ---
    const ch1Id = await db.chapters.add({ projectId, title: 'Part I — Vajra', order: 0 });

    const sc1_1 = await db.scenes.add({
      chapterId: ch1Id, projectId, title: 'The Tenth Year', order: 0, status: 'draft',
      lastEditedAt: now - 86400000 * 2,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'The needle went in below the seventh cervical vertebra. Arjun felt it as a cold thread unreeling down his spine, then nothing at all for exactly four seconds — he counted, because counting was the only thing that still worked when the augmentation suite kicked over — and then everything.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Sound first. The fluorescent hum of the lights overhead, which should have been inaudible, resolved into a rich sixty-hertz drone with overtones he could individually identify. The drip of saline into the IV bag beside him ticked at 0.3-second intervals, each drop a discrete acoustic event. Dr. Chandra\'s breathing across the room: 16 breaths per minute, slightly elevated, the faint whistle of a deviated septum she\'d never had corrected.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Then the pain arrived.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'It was not dramatic pain. Not the searing white-out of a bullet wound or the deep alarm of a broken bone. It was a headache — the kind that started behind the eyes and settled into the temples like concrete setting. The Vajra migraines. Ten years of them now, and they had never gotten better. Dr. Chandra said the neural pathways were simply not designed to carry this much traffic. She said it the way a civil engineer might note that a bridge was rated for ten tonnes but was currently holding forty.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Cognitive suite nominal," Chandra said, reading her tablet. "Reflex integration at 3.7x baseline. Metabolic rate—" She frowned. "You need to eat, Major. Your blood glucose is dropping."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"After," Arjun said.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"After what?"' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He didn\'t answer. He was looking at the bank of monitors on the far wall, where a satellite image showed a crescent of white sand and dark jungle in an empty blue ocean. The Chagos Archipelago. Diego Garcia. Now, apparently, something else entirely.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Colonel Vikram Singh stood in the doorway. He hadn\'t knocked — he never knocked — but Arjun had heard his footsteps in the corridor eight seconds ago, the particular scuff of his left shoe where the sole was wearing thin, the faint creak of the leather holster he still wore out of habit even in a building where everyone was already on the same side.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Major," Vikram said. "We have a situation."' }] },
        ],
      }),
    });

    const sc1_2 = await db.scenes.add({
      chapterId: ch1Id, projectId, title: 'The Sailor', order: 1, status: 'draft',
      lastEditedAt: now - 86400000 * 5,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'They found the American floating face-down in the Palk Strait, twelve nautical miles southeast of Rameswaram, drifting with the current like a piece of debris from a wreck that hadn\'t been reported. Priya saw him first — or rather, her brother Muthu saw the shape and called it driftwood, and Priya saw the shape and called it a man, and she was right.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'They hauled him over the gunwale of the trawler. He was sunburned raw, his lips cracked into a geography of dried blood, his Navy working uniform bleached pale by salt and sun. He vomited seawater onto the deck and then passed out. He did not wake up for nine hours.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Priya did not call the coast guard. She did not call anyone. She took the American to her house, put him on the cot where her father had died, and gave him water with salt and sugar dissolved in it, the way her mother had taught her to treat dehydration. Then she sat in the doorway with a cup of tea and thought about what to do.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'She was not naive. A white man in a Navy uniform washing up in the Palk Strait meant something had happened — something large, something military, something that would bring other men in uniforms to her village asking questions. She had lived through the war years, when the Sri Lankan Navy and the Indian Navy and the LTTE all operated in these waters, and she had learned that the safest place during a war between giants was wherever the giants were not looking.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'When he woke, he spoke English too fast for her to follow. She caught words: base, attack, missiles, Diego. He grabbed her wrist and said, very clearly, "I need to contact my command." She removed his hand gently and gave him more water.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"First you drink," she said. "Then we talk."' }] },
        ],
      }),
    });

    const sc1_3 = await db.scenes.add({
      chapterId: ch1Id, projectId, title: 'The Briefing', order: 2, status: 'draft',
      lastEditedAt: now - 86400000,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'The briefing room was three levels underground and smelled of concrete dust and stale coffee. Vikram had cleared everyone except Arjun and Dr. Meera Nair, who sat at the far end of the table with her laptop open and her leg bouncing under the desk in a rhythm that Arjun\'s augmented perception catalogued automatically: anxious, 140 BPM, probably caffeinated.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Seventy-two hours ago," Vikram said, pointing to the wall screen, "a force of approximately three hundred fighters seized the United States Naval Support Facility at Diego Garcia. They arrived in fishing trawlers, cargo vessels, and two decommissioned Sri Lankan Navy patrol boats. The assault lasted four hours. Twenty-seven American personnel were killed. The rest evacuated by helicopter to the carrier group."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He clicked. The screen showed a man — lean, grey-templed, in a pressed white shirt. No uniform. No insignia.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Kumaran Thevarasa. Former LTTE logistics network. We thought he was dead. He wasn\'t. He spent ten years building a new organization — they call themselves the New Tigers — and he has just declared the Chagos Archipelago to be the sovereign nation of Kalimaran." Vikram paused. "He also has four Agni-III intermediate-range ballistic missiles with nuclear warheads."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'The room was quiet. Meera\'s leg stopped bouncing.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"How?" Arjun said.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"We don\'t know yet. Stolen, bought, or built — the sourcing is still being traced. What we do know is that the launch systems are operational. The American sailor we recovered confirmed visual sighting of mobile launch platforms being moved into hardened positions." Vikram looked at Arjun directly. "The Americans are positioning a carrier strike group. The Chinese are watching. The Security Council is in emergency session. And everyone — everyone — is very aware that one mistake turns the Indian Ocean into a radioactive bathtub."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Meera spoke for the first time. "I built something." She turned her laptop screen toward them. Lines of code scrolled — dense, precise, elegant in the way that weapons are sometimes elegant. "It\'s called Kali. It\'s a firmware-level attack that will permanently disable the launch control systems. Not just shut them down — brick them. Fuse the guidance processors. The missiles become very expensive paperweights."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Catch?" Arjun said.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"It has to be uploaded directly to the launch control hardware. Air-gapped system. No remote access. Someone has to physically connect to the console and run the payload." She looked at him. "And they have to do it without being detected, because the system has a dead-man\'s protocol. If it detects tampering, it initiates an automatic launch sequence."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun looked at the satellite image of the island. White sand. Dark jungle. A runway cutting through it like a scar.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"When do I leave?" he said.' }] },
        ],
      }),
    });

    // --- CHAPTER 2 ---
    const ch2Id = await db.chapters.add({ projectId, title: 'Part II — The Crossing', order: 1 });

    const sc2_1 = await db.scenes.add({
      chapterId: ch2Id, projectId, title: 'The Fisherman\'s Route', order: 0, status: 'draft',
      lastEditedAt: now - 86400000 * 3,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Priya\'s trawler was called the Meenakshi, after the goddess with fish-shaped eyes. It was forty-two feet of painted wood and rust-streaked iron, powered by a Kirloskar diesel engine that coughed black smoke and sounded like it was arguing with itself. It smelled of fish guts, brine, and the jasmine oil that Priya used in her hair.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun stood on the dock at Tuticorin in civilian clothes — loose cotton shirt, dhoti, rubber chappals — and looked at the boat and thought about all the ways this could go wrong. His augmented mind helpfully catalogued them: engine failure in open ocean, interception by the New Tigers\' patrol boats, detection by American SIGINT assets, the simple mathematics of a forty-two-foot trawler in Indian Ocean swells.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"You look like a man who has never been on a boat," Priya said, emerging from the wheelhouse.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"I\'ve been on boats."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Navy boats. With engines that work and toilets that flush." She looked him over with the frank assessment of someone who evaluated the seaworthiness of things for a living. "You eat too much. You\'ll eat all our provisions."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'She was right about that. His metabolic rate — a side effect of the augmentation — meant he consumed roughly 6,000 calories a day just to maintain function. Under stress, closer to 8,000. He had brought high-density ration bars, protein concentrate, glucose tablets. Enough for five days. The crossing would take three if the weather held.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"I packed my own food," he said.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Good." She started the engine. The Kirloskar protested, then settled into its broken rhythm. "Because I\'m not sharing my fish curry with a government man."' }] },
        ],
      }),
    });

    const sc2_2 = await db.scenes.add({
      chapterId: ch2Id, projectId, title: 'Open Water', order: 1, status: 'draft',
      lastEditedAt: now - 86400000 * 4,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Two days out from the coast, the ocean became a different thing entirely. The water turned from the muddy green of the continental shelf to a blue so deep it looked black. The horizon was a perfect unbroken circle in every direction, and the sky above was the same blue as the water below, so that the Meenakshi seemed to float in an infinite sphere of colour.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun sat on the bow with his encrypted satellite phone, receiving Meera\'s burst transmissions. She sent data in compressed packages — updated satellite imagery of the island, patrol schedules derived from signals intelligence, the latest iteration of the Kali virus payload. He absorbed the information at the accelerated rate his augmentation allowed, building a three-dimensional model of the target in his mind with the precision of an architect.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'The base layout was roughly what Jimmy Holt had described, but there were differences. New construction on the eastern shore — prefabricated buildings, probably housing. A second checkpoint on the road between the runway and the original command centre. And the launch platforms had been moved again, repositioned under camouflage netting in the tree line north of the lagoon.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He memorised it all, then deleted the transmissions. In the heat of the afternoon, with the engine off to conserve fuel and the Meenakshi drifting on the current, he heard Priya singing in the wheelhouse — an old Tamil song, something about the sea and lovers and a shore that was always too far away.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'His phone buzzed. Vikram: STATUS.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He typed back: ON SCHEDULE. 30 HOURS.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Then a second message from Vikram: US CARRIER GROUP MOVING SOUTH. WINDOW CLOSING. DO NOT BE LATE.' }] },
        ],
      }),
    });

    const sc2_3 = await db.scenes.add({
      chapterId: ch2Id, projectId, title: 'Landfall', order: 2, status: 'draft',
      lastEditedAt: now - 3600000 * 6,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'They approached the island at 0300, running without lights. Priya knew these waters — or at least she knew how to read water, which was nearly the same thing. She brought the Meenakshi in through a gap in the reef on the southern side that didn\'t appear on any nautical chart, threading between coral heads that would have gutted a larger vessel.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun went over the side into chest-deep water that was warmer than he expected. He held a waterproof bag above his head — the Kali payload on a hardened drive, plus a compact toolkit, a knife, and a suppressed pistol that Vikram had insisted on and that Arjun hoped he wouldn\'t need. He waded to shore and crouched in the tree line, waiting for his senses to adjust.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'The augmentation made the darkness navigable. Not night vision in the electronic sense — his eyes were still human eyes — but his brain processed the available light with a ruthless efficiency that pulled shapes from shadows. He could see the coconut palms. The curve of the beach. The distant orange glow of the main base, two kilometres to the north. And closer, maybe three hundred metres away, a patrol: two figures, AK-pattern rifles, walking the beach in a pattern that suggested training but not discipline.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He waited until they passed, counted their interval, and moved into the jungle.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Behind him, the Meenakshi\'s engine coughed once, faintly, and then Priya was gone — pulling back out through the reef gap, headed for the fishing grounds east of the archipelago where she would wait, looking like any other Tamil trawler, until the signal came or three days passed without one.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun was alone.' }] },
        ],
      }),
    });

    // --- CHAPTER 3 ---
    const ch3Id = await db.chapters.add({ projectId, title: 'Part III — Inside the Wire', order: 2 });

    const sc3_1 = await db.scenes.add({
      chapterId: ch3Id, projectId, title: 'The New Nation', order: 0, status: 'draft',
      lastEditedAt: now - 3600000 * 12,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Kalimaran was not what Arjun had expected.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'The briefing had painted it as a military occupation — armed men, barricades, the paranoid infrastructure of a hostile force dug in on stolen ground. And some of that was true: there were checkpoints, patrols, gun emplacements overlooking the lagoon. But there were also children.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He watched from the tree line as a group of Tamil families — women in saris, men in lungis, kids chasing each other between prefabricated housing units — went about what looked like ordinary morning routines. Cooking fires. Laundry strung between buildings. A man fixing a generator while a small girl handed him tools in the wrong order. Someone had planted a garden.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Kumaran hadn\'t just seized a military base. He\'d brought people. Settlers. He was building something.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun filed this away and kept moving. The residential area was south of the runway. The launch systems were north, in the hardened positions near the original American weapons storage facility. Between them: the command centre, now flying a flag he didn\'t recognise — orange and black, with a tiger\'s head and a rising sun. The flag of a country that had existed for less than a week.' }] },
        ],
      }),
    });

    const sc3_2 = await db.scenes.add({
      chapterId: ch3Id, projectId, title: 'The Launch Bay', order: 1, status: 'draft',
      lastEditedAt: now - 3600000 * 2,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'The launch control facility was in the hardened bunker the Americans had built during the Cold War. Arjun found it on the second night, after mapping the patrol routes and identifying a gap in the perimeter where the jungle grew close enough to the fence to provide cover.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'The bunker was guarded, but not as heavily as he\'d feared. Four men on the exterior, rotating on six-hour shifts. Two more inside — technicians, judging by their body language and the fact that they carried sidearms rather than rifles. Arjun counted the cameras: three exterior, fisheye lenses, probably feeding to a monitoring station in the command centre.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He pressed the encrypted transmitter embedded beneath the skin behind his left ear. Two short taps — the signal for Meera.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Her voice came through bone conduction, vibrating his skull. "I\'m here."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"I have eyes on the target. It\'s a modified Titan IIIC bunker. The Americans upgraded it — blast doors, air filtration, the works. The launch consoles should be on the second sublevel."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Should be."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"That\'s what I said."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'A pause. Then: "Arjun, the dead-man\'s protocol. If the system detects an unauthorized access attempt, it begins a sixty-second automated launch countdown. Sixty seconds. That\'s not a lot of time to run the Kali payload and verify it\'s propagated through all four launch control nodes."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"How long does the upload take?"' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Forty-three seconds in testing. But that was on a clean bench. In the field, with whatever modifications they\'ve made to the firmware—" She trailed off. "I don\'t know. Maybe fifty. Maybe more."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Sixty seconds to prevent a nuclear launch. Fifty of which would be spent waiting for a progress bar.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"I\'ll find a way," Arjun said.' }] },
        ],
      }),
    });

    const sc3_3 = await db.scenes.add({
      chapterId: ch3Id, projectId, title: 'Kumaran\'s Court', order: 2, status: 'draft',
      lastEditedAt: now - 3600000,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'He didn\'t plan to meet Kumaran. It happened because of the garden.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'On the third morning, moving through the settlement in the stolen clothes of a maintenance worker, Arjun paused at the small garden he\'d noticed before. Someone had planted curry leaves, coriander, green chillies, and a row of tomato plants staked with bamboo. It was meticulous work — the rows straight, the soil dark and turned. Whoever tended this garden loved it.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"You\'re new."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun turned. The man standing behind him was lean, grey-templed, in a pressed white shirt. No weapon. A cup of tea in one hand. Eyes that were sharp and patient in the way of someone who had survived by being both.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Kumaran.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"I came with the last boat," Arjun said, in Tamil. The cover Vikram had built for him — a mechanic from Jaffna, skilled with generators and diesel engines, exactly the kind of person a new nation would need.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"You\'re looking at my garden," Kumaran said.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"It\'s a good garden."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"My mother grew curry leaves on our balcony in Jaffna. That was before the bombing. Before many things." He sipped his tea. "A nation needs many things, brother. Guns and flags, yes. But also gardens. Also people who look at gardens the way you just did — with recognition."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun said nothing. His augmented senses were cataloguing everything: Kumaran\'s pulse (visible at the neck, 68 BPM, calm), the two armed men standing twenty metres away trying to look casual, the faint smell of gun oil from inside the command building behind them.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"What is your name?" Kumaran asked.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Kannan."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Welcome to Kalimaran, Kannan." Kumaran extended his hand. "Come. I\'ll show you what we\'re building."' }] },
        ],
      }),
    });

    // --- CHAPTER 4 ---
    const ch4Id = await db.chapters.add({ projectId, title: 'Part IV — Kali', order: 3 });

    const sc4_1 = await db.scenes.add({
      chapterId: ch4Id, projectId, title: 'The Upload', order: 0, status: 'draft',
      lastEditedAt: now - 1800000,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '[SCENE IN PROGRESS — Arjun gains access to the launch bunker during a shift change. The upload sequence. The dead-man\'s protocol triggers. Sixty seconds.]' }] },
        ],
      }),
    });

    const sc4_2 = await db.scenes.add({
      chapterId: ch4Id, projectId, title: 'Selvam\'s Choice', order: 1, status: 'draft',
      lastEditedAt: now - 600000,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '[SCENE IN PROGRESS — Dr. Selvam discovers the intrusion. He must choose: alert Kumaran and save the weapons, or let the virus run and save the world from the weapons he built.]' }] },
        ],
      }),
    });

    const sc4_3 = await db.scenes.add({
      chapterId: ch4Id, projectId, title: 'Sixty Seconds', order: 2, status: 'draft',
      lastEditedAt: now - 120000,
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '[SCENE IN PROGRESS — The climax. Countdown. Arjun, Selvam, and the progress bar. The carrier group watching from the horizon. Vikram in Delhi. Meera talking Arjun through it. Ten seconds of margin. Maybe less.]' }] },
        ],
      }),
    });

    // ────────────────────────────────────────
    // TIMELINE EVENTS
    // ────────────────────────────────────────
    await db.timelineEvents.add({
      projectId, title: 'Diego Garcia Falls', position: 0.05, width: 0.04,
      color: '#dc2626', description: 'New Tigers seize the US naval base. 27 Americans killed. Kumaran declares Kalimaran.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Jimmy Rescued', position: 0.12, width: 0.03,
      color: '#16a34a', description: 'Priya pulls PO2 Holt from the Palk Strait.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Arjun Deploys', position: 0.25, width: 0.03,
      color: '#2563eb', description: 'Major Khalsa departs Tuticorin aboard the Meenakshi.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Landfall', position: 0.40, width: 0.03,
      color: '#2563eb', description: 'Arjun reaches the Chagos Archipelago. Priya withdraws.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Base Infiltration', position: 0.55, width: 0.06,
      color: '#ea580c', description: 'Arjun enters the settlement, maps the base, discovers the civilian population.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Kumaran Contact', position: 0.65, width: 0.03,
      color: '#ea580c', description: 'Arjun meets Kumaran face-to-face in the garden.',
    });

    await db.timelineEvents.add({
      projectId, title: 'The Upload', position: 0.82, width: 0.06,
      color: '#7c3aed', description: 'Kali virus deployment. Dead-man protocol triggers. 60-second countdown.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Nuclear Standoff', position: 0.92, width: 0.06,
      color: '#dc2626', description: 'US carrier group moves to strike range. India holds its breath.',
    });

    // ────────────────────────────────────────
    // CHARACTER APPEARANCES  (fortune: 0 = ill fortune, 0.5 = neutral, 1 = good fortune)
    // ────────────────────────────────────────

    // Arjun — descends from stoic resolve into moral crisis
    await db.characterAppearances.bulkAdd([
      { characterId: arjunId, projectId, sceneId: sc1_1, position: 0.03, fortune: 0.50, note: 'Augmentation check. Project Vajra lab.' },
      { characterId: arjunId, projectId, sceneId: sc1_3, position: 0.18, fortune: 0.45, note: 'Receives the mission briefing. Weight of it.' },
      { characterId: arjunId, projectId, sceneId: sc2_1, position: 0.28, fortune: 0.60, note: 'Boards the Meenakshi. Action at last.' },
      { characterId: arjunId, projectId, sceneId: sc2_2, position: 0.35, fortune: 0.55, note: 'Open water. Receives intel from Meera.' },
      { characterId: arjunId, projectId, sceneId: sc2_3, position: 0.42, fortune: 0.65, note: 'Landfall on the island. Clean insertion.' },
      { characterId: arjunId, projectId, sceneId: sc3_1, position: 0.52, fortune: 0.35, note: 'Discovers civilians on the island.' },
      { characterId: arjunId, projectId, sceneId: sc3_2, position: 0.45, fortune: 0.50, note: 'Recons the launch bunker.' },
      { characterId: arjunId, projectId, sceneId: sc3_3, position: 0.67, fortune: 0.30, note: 'Meets Kumaran face to face. Shaken.' },
      { characterId: arjunId, projectId, sceneId: sc4_1, position: 0.83, fortune: 0.25, note: 'Begins the upload. Dead-man triggers.' },
      { characterId: arjunId, projectId, sceneId: sc4_3, position: 0.93, fortune: 0.15, note: 'The countdown. Everything on the line.' },
    ]);

    // Kumaran — rises triumphant, then collapses
    await db.characterAppearances.bulkAdd([
      { characterId: kumaranId, projectId, position: 0.05, fortune: 0.90, note: 'Leads the assault on Diego Garcia. Triumph.' },
      { characterId: kumaranId, projectId, sceneId: sc3_1, position: 0.50, fortune: 0.85, note: 'His settlement. His flag. A nation born.' },
      { characterId: kumaranId, projectId, sceneId: sc3_3, position: 0.67, fortune: 0.80, note: 'Meets Arjun in the garden. Magnanimous.' },
      { characterId: kumaranId, projectId, position: 0.88, fortune: 0.20, note: 'Learns of the intrusion. Everything crumbles.' },
    ]);

    // Meera — anxious arc, peaks at her moment then plunges
    await db.characterAppearances.bulkAdd([
      { characterId: meeraId, projectId, sceneId: sc1_3, position: 0.18, fortune: 0.60, note: 'Presents the Kali virus. Confident.' },
      { characterId: meeraId, projectId, sceneId: sc2_2, position: 0.35, fortune: 0.55, note: 'Sends intel via burst transmission.' },
      { characterId: meeraId, projectId, sceneId: sc3_2, position: 0.60, fortune: 0.50, note: 'Talks Arjun through the bunker. Tense.' },
      { characterId: meeraId, projectId, sceneId: sc4_1, position: 0.83, fortune: 0.30, note: 'Guides the upload remotely. Her code vs. reality.' },
      { characterId: meeraId, projectId, sceneId: sc4_3, position: 0.93, fortune: 0.15, note: 'The countdown. Her code vs. the clock.' },
    ]);

    // Vikram — steady command, slowly losing control
    await db.characterAppearances.bulkAdd([
      { characterId: vikramId, projectId, sceneId: sc1_1, position: 0.05, fortune: 0.55, note: 'Arrives with the situation.' },
      { characterId: vikramId, projectId, sceneId: sc1_3, position: 0.18, fortune: 0.60, note: 'Delivers the briefing. In command.' },
      { characterId: vikramId, projectId, sceneId: sc2_2, position: 0.35, fortune: 0.45, note: 'Sends warning about the carrier group.' },
      { characterId: vikramId, projectId, position: 0.90, fortune: 0.25, note: 'Managing the political crisis from Delhi. Walls closing.' },
    ]);

    // Priya — rises through courage
    await db.characterAppearances.bulkAdd([
      { characterId: priyaId, projectId, sceneId: sc1_2, position: 0.10, fortune: 0.70, note: 'Rescues Jimmy Holt. Decisive.' },
      { characterId: priyaId, projectId, sceneId: sc2_1, position: 0.28, fortune: 0.75, note: 'Captains the Meenakshi. Her domain.' },
      { characterId: priyaId, projectId, sceneId: sc2_3, position: 0.42, fortune: 0.65, note: 'Navigates the reef. Drops Arjun. Alone now.' },
    ]);

    // Jimmy — crashes, then slowly climbs from rock bottom
    await db.characterAppearances.bulkAdd([
      { characterId: jimmyId, projectId, position: 0.05, fortune: 0.10, note: 'Diego Garcia falls. Thrown into the water.' },
      { characterId: jimmyId, projectId, sceneId: sc1_2, position: 0.10, fortune: 0.25, note: 'Pulled from the sea by Priya.' },
      { characterId: jimmyId, projectId, sceneId: sc1_3, position: 0.16, fortune: 0.35, note: 'His intel informs the briefing. Purpose found.' },
    ]);

    // Chen Wei — controlled descent into a no-win scenario
    await db.characterAppearances.bulkAdd([
      { characterId: chenId, projectId, position: 0.08, fortune: 0.30, note: 'Escapes Diego Garcia. Takes command of response.' },
      { characterId: chenId, projectId, position: 0.45, fortune: 0.45, note: 'Carrier group positions south. Regaining control.' },
      { characterId: chenId, projectId, position: 0.90, fortune: 0.20, note: 'Moves to strike range. The weight of the call.' },
    ]);

    // Selvam — quiet peak, then devastating fall
    await db.characterAppearances.bulkAdd([
      { characterId: selvamId, projectId, position: 0.04, fortune: 0.70, note: 'Makes the warheads functional. His masterwork.' },
      { characterId: selvamId, projectId, sceneId: sc3_2, position: 0.58, fortune: 0.55, note: 'Works in the launch bunker. Routine dread.' },
      { characterId: selvamId, projectId, sceneId: sc4_2, position: 0.85, fortune: 0.20, note: 'Discovers the intrusion. His choice.' },
      { characterId: selvamId, projectId, sceneId: sc4_3, position: 0.93, fortune: 0.10, note: 'The countdown. What does he do?' },
    ]);

    // ────────────────────────────────────────
    // IDEAS
    // ────────────────────────────────────────
    const ideaData = [
      { content: 'What if the augmentation is slowly killing Arjun? A ticking clock beyond the mission — he has months, not years. Adds personal stakes to a geopolitical thriller.', tags: ['character', 'stakes'], createdAt: now - 86400000 * 10 },
      { content: 'The Kali virus should have an unintended side effect — maybe it corrupts not just the launch firmware but also the base\'s power grid. Arjun has to escape in darkness.', tags: ['plot', 'tech'], createdAt: now - 86400000 * 8 },
      { content: 'Priya\'s fishing network as an intelligence asset is more interesting than it seems — these Tamil fishermen have been crossing borders illegally for generations. They ARE an intelligence network, just not for any state.', tags: ['worldbuilding', 'character'], createdAt: now - 86400000 * 7 },
      { content: 'Kumaran should be sympathetic. He\'s not wrong about what happened to the Tamils. The reader should finish the book feeling uneasy about who the real villain is — is it the man who stole nuclear weapons, or the world that made him feel he needed to?', tags: ['theme', 'character'], createdAt: now - 86400000 * 6 },
      { content: 'Dr. Selvam as the conscience of the bomb — the man who built it but never wanted it used. His choice at the climax is the moral centre of the book. Not Arjun\'s mission. Selvam\'s choice.', tags: ['theme', 'character', 'climax'], createdAt: now - 86400000 * 5 },
      { content: 'The dead-man\'s protocol is the scariest thing in the book. Not a person deciding to launch — a SYSTEM deciding to launch because it detected tampering. Remove human agency from nuclear war and see what happens.', tags: ['theme', 'tech', 'tension'], createdAt: now - 86400000 * 4 },
      { content: 'Research: how do air-gapped systems actually work in military contexts? What physical access would be needed? USB? Direct console? Need technical accuracy here.', tags: ['research', 'tech'], createdAt: now - 86400000 * 3 },
      { content: 'Rear Admiral Chen Wei should have a scene where he realises India has someone on the island. Not from intel — from the ABSENCE of intel. India is too calm. That\'s how an intelligence officer thinks.', tags: ['plot', 'character'], createdAt: now - 86400000 * 2 },
      { content: 'The garden scene with Kumaran is the heart of the book. Two enemies who don\'t know they\'re enemies yet, talking about curry leaves. That\'s the kind of moment that makes a thriller literary.', tags: ['craft', 'scene'], createdAt: now - 86400000 },
      { content: 'End the book ambiguously. The missiles are disabled but Kalimaran still exists. Kumaran is still alive. The Tamil families are still there. The political problem hasn\'t been solved — only the nuclear one. Let the reader sit with that.', tags: ['ending', 'theme'], createdAt: now - 3600000 * 12 },
      { content: 'Title alternatives: "Sixty Seconds," "The Tiger\'s Garden," "Vajra," "Dead Man\'s Switch," "The Chagos Directive"', tags: ['meta'], createdAt: now - 3600000 * 6 },
      { content: 'Arjun should carry a copy of Japji Sahib. Small detail but it grounds him — he\'s Sikh, he was raised with this, and the augmentation took many things from him but not this.', tags: ['character', 'detail'], createdAt: now - 3600000 * 3 },
    ];

    for (const idea of ideaData) {
      await db.ideas.add({
        projectId,
        content: idea.content,
        createdAt: idea.createdAt,
        tags: idea.tags,
      });
    }

    // ────────────────────────────────────────
    // SNAPSHOTS (one example)
    // ────────────────────────────────────────
    await db.snapshots.add({
      sceneId: sc1_1,
      projectId,
      name: 'First draft opening',
      note: 'Original opening before I rewrote the needle scene. Started with Arjun running on a treadmill instead. Less immediate.',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Arjun ran. The treadmill belt hummed beneath his feet at 28 kilometres per hour — a dead sprint for a normal human, a working pace for him — and the monitors arrayed around the room captured everything: heart rate, VO2 max, neural response times, the electrical patterns of a brain that had been rebuilt to process the world four times faster than it was designed to.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'He had been running for forty-seven minutes. He was not tired. He was, however, hungry.' }] },
        ],
      }),
      createdAt: now - 86400000 * 12,
    });

    await db.snapshots.add({
      sceneId: sc3_3,
      projectId,
      name: 'Garden scene v1',
      note: 'First attempt at the Kumaran meeting. Too confrontational — rewrote to be quieter, more unsettling.',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Kumaran found him near the perimeter fence, which was the worst possible place to be found. Arjun\'s cover story was ready — lost, looking for the generator building — but Kumaran didn\'t ask. He simply looked at Arjun with eyes that had been evaluating threats for thirty years and said, "Walk with me."' }] },
        ],
      }),
      createdAt: now - 86400000 * 3,
    });

    return projectId;
  });
}
