import { db } from '../db/database';

/**
 * Seeds a complete demo project: "Alice's Adventures in Wonderland"
 * Uses verbatim text from Lewis Carroll's original (public domain).
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
      title: 'Alice\'s Adventures in Wonderland',
      oneSentence: 'A young girl falls down a rabbit hole into a fantastical underground world where she encounters peculiar creatures, attends a mad tea-party, plays croquet with a tyrannical queen, and ultimately stands trial before waking to discover it was all a dream.',
      oneParag: 'On a drowsy summer afternoon, Alice follows a White Rabbit down his hole and tumbles into Wonderland — a place where the rules of logic, size, and propriety are cheerfully broken. She drinks potions that shrink her, eats cakes that make her giant, and wanders through a landscape populated by a hookah-smoking Caterpillar, a vanishing Cheshire Cat, a Duchess who finds morals in everything, and a Hatter trapped in an eternal tea-time. Deeper in, she discovers the court of the Queen of Hearts, a tyrant who sentences everyone to beheading over a game of croquet played with flamingos and hedgehogs. At the trial of the Knave of Hearts — accused of stealing tarts — Alice finally finds her voice, grows to full size, and denounces the court as nothing but a pack of cards, scattering them into the air and waking on the riverbank with her head in her sister\'s lap.',
      createdAt: now - 86400000 * 14,
      updatedAt: now,
      settings: {},
    });

    // ────────────────────────────────────────
    // CHARACTERS
    // ────────────────────────────────────────
    const aliceId = await db.characters.add({
      projectId,
      name: 'Alice',
      color: '#2563eb',
      description: 'A curious and adventurous seven-year-old girl who falls down a rabbit hole into Wonderland. She is polite, well-educated, and fond of her cat Dinah. Throughout her journey she struggles with constant changes to her size and identity, often reciting lessons incorrectly and puzzling over the nonsensical logic of Wonderland\'s inhabitants. Despite her confusion, she maintains a fundamental sense of justice and propriety that ultimately leads her to challenge the Queen\'s court.',
      role: 'Protagonist',
      motivation: 'Curiosity — she follows the White Rabbit simply because she has never seen a rabbit with a waistcoat-pocket or a watch.',
      goal: 'Find her way through Wonderland, reach the beautiful garden she glimpsed through the tiny door, and make sense of the world she has fallen into.',
      conflict: 'She cannot control her own size, cannot get straight answers from anyone, and increasingly doubts her own identity ("Who in the world am I?").',
      epiphany: 'She realizes the creatures of Wonderland have no real power over her — "You\'re nothing but a pack of cards!" — and wakes up.',
    });

    const whiteRabbitId = await db.characters.add({
      projectId,
      name: 'The White Rabbit',
      color: '#dc2626',
      description: 'A fussy, anxious rabbit in a waistcoat who is perpetually late. He carries a pocket watch, wears gloves, and serves as herald to the King and Queen of Hearts. He is the first Wonderland creature Alice encounters, and her pursuit of him is what draws her into the adventure. He is officious and easily flustered, constantly worried about the Duchess and the Queen.',
      role: 'Catalyst / Herald',
      motivation: 'Desperate anxiety about punctuality and his duties to the court.',
      goal: 'Arrive on time, carry out his duties, and avoid the Queen\'s wrath.',
      conflict: 'He is always late, always losing things (his gloves, his fan), and always on the edge of panic.',
    });

    const cheshireCatId = await db.characters.add({
      projectId,
      name: 'The Cheshire Cat',
      color: '#7c3aed',
      description: 'A grinning cat who can appear and disappear at will, sometimes leaving only his smile behind. He belongs to the Duchess but acts entirely independently. He is philosophical in a maddening way, offering Alice cryptic but oddly truthful advice. He is the only creature in Wonderland who seems fully self-aware — he freely admits that everyone, including himself, is mad.',
      role: 'Guide / Trickster',
      motivation: 'Amusement. He enjoys the absurdity of Wonderland and Alice\'s attempts to impose logic on it.',
      goal: 'None in particular — he is content to appear, philosophize, and vanish.',
      conflict: 'The Queen orders his beheading, but you cannot behead a creature that is only a head.',
    });

    const queenId = await db.characters.add({
      projectId,
      name: 'The Queen of Hearts',
      color: '#ea580c',
      description: 'The tyrannical ruler of Wonderland, a playing-card queen with a volcanic temper. Her solution to every problem is "Off with his head!" She presides over a chaotic croquet game played with live flamingos and hedgehogs, and demands absolute obedience from her subjects. Despite her fearsome reputation, most of her execution orders are quietly pardoned by the King behind her back.',
      role: 'Antagonist',
      motivation: 'Absolute authority. She cannot tolerate being contradicted, defied, or beaten at croquet.',
      goal: 'Maintain her tyrannical rule over Wonderland and execute anyone who displeases her.',
      conflict: 'Nobody actually carries out her sentences. Her power is theatrical — a fact Alice eventually perceives.',
      epiphany: 'None — she never changes. Alice\'s growth is what breaks the spell.',
    });

    const hatterId = await db.characters.add({
      projectId,
      name: 'The Mad Hatter',
      color: '#eab308',
      description: 'A hatter trapped in a perpetual tea-party because Time has stopped for him at six o\'clock — punishment for "murdering the time" during a concert for the Queen. He is eccentric, rude, asks unanswerable riddles ("Why is a raven like a writing-desk?"), and makes personal remarks. He appears again at the trial as a nervous witness, still carrying his teacup.',
      role: 'Eccentric / Comic Figure',
      motivation: 'Passing the time — literally, since Time refuses to move for him.',
      goal: 'Continue his eternal tea-party. Later, survive his testimony at the trial.',
      conflict: 'Trapped in an endless routine; terrified of the Queen.',
    });

    const caterpillarId = await db.characters.add({
      projectId,
      name: 'The Caterpillar',
      color: '#0d9488',
      description: 'A large blue caterpillar who sits atop a mushroom smoking a hookah. He is languid, enigmatic, and somewhat condescending. He asks Alice the central question of the book — "Who are you?" — and is unsatisfied with every answer. Despite his dismissive manner, he gives Alice the crucial information about the mushroom that lets her control her size.',
      role: 'Mentor / Sage',
      motivation: 'He seems interested in the philosophical question of identity, though he expresses it through indifference.',
      goal: 'Interrogate Alice about who she is. Deliver his cryptic wisdom and depart.',
      conflict: 'He is irritable and easily offended — Alice must navigate his moods to get useful information.',
    });

    const duchessId = await db.characters.add({
      projectId,
      name: 'The Duchess',
      color: '#16a34a',
      description: 'An ugly duchess with a sharp chin who lives in a pepper-filled kitchen with a violent cook and a baby that turns into a pig. She is initially hostile but later becomes excessively friendly, hanging on Alice\'s arm and finding a moral in everything. She is terrified of the Queen, who has ordered her execution for boxing the Queen\'s ears.',
      role: 'Moralist / Comic Relief',
      motivation: 'Finding the moral of things — she insists everything has a moral, "if only you can find it."',
      goal: 'Survive the Queen\'s displeasure; impart her dubious wisdom to Alice.',
      conflict: 'She is under sentence of execution and desperately trying to stay in the Queen\'s good graces.',
    });

    const mockTurtleId = await db.characters.add({
      projectId,
      name: 'The Mock Turtle',
      color: '#6b7280',
      description: 'A melancholy creature with the body of a turtle and the head and tail of a calf (he is, after all, the ingredient of mock turtle soup). He weeps constantly as he tells Alice about his school days under the sea — Reeling and Writhing, Ambition, Distraction, Uglification, and Derision. His sadness is comic but also strangely touching. He sings "Beautiful Soup" with great feeling.',
      role: 'Melancholy Storyteller',
      motivation: 'Nostalgia — he is consumed by memory of his school days and the Lobster Quadrille.',
      goal: 'Tell his story. Be heard. Sing his song.',
      conflict: 'He cannot stop crying long enough to tell his tale properly, and no one truly listens.',
    });

    // ────────────────────────────────────────
    // RELATIONSHIPS
    // ────────────────────────────────────────
    await db.relationships.bulkAdd([
      { projectId, characterAId: aliceId, characterBId: whiteRabbitId, type: 'ally', label: 'Pursuit and curiosity — he leads her into Wonderland' },
      { projectId, characterAId: aliceId, characterBId: cheshireCatId, type: 'ally', label: 'Cryptic guide — "we\'re all mad here"' },
      { projectId, characterAId: aliceId, characterBId: queenId, type: 'enemy', label: 'Protagonist vs. tyrant — "Off with her head!"' },
      { projectId, characterAId: aliceId, characterBId: hatterId, type: 'ally', label: 'Bewildered acquaintance at the mad tea-party' },
      { projectId, characterAId: aliceId, characterBId: caterpillarId, type: 'mentor', label: '"Who are YOU?" — cryptic wisdom about identity' },
      { projectId, characterAId: queenId, characterBId: duchessId, type: 'enemy', label: 'The Duchess is under sentence of execution' },
      { projectId, characterAId: duchessId, characterBId: aliceId, type: 'ally', label: 'Unwanted closeness — finding morals in everything' },
      { projectId, characterAId: mockTurtleId, characterBId: aliceId, type: 'ally', label: 'He tells her his life story; she is his reluctant audience' },
    ]);

    // ────────────────────────────────────────
    // CHAPTERS & SCENES
    // ────────────────────────────────────────

    // --- PART I: Down the Rabbit-Hole (original Ch. 1-3) ---
    const ch1Id = await db.chapters.add({ projectId, title: 'Part I — Down the Rabbit-Hole', order: 0 });

    const sc1_1 = await db.scenes.add({
      chapterId: ch1Id, projectId, title: 'Down the Rabbit-Hole', order: 0, status: 'draft',
      lastEditedAt: now - 86400000 * 2,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!” (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'In another moment down went Alice after it, never once considering how in the world she was to get out again.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled “ORANGE MARMALADE”, but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Well!” thought Alice to herself, “after such a fall as this, I shall think nothing of tumbling down stairs! How brave they’ll all think me at home! Why, I wouldn’t say anything about it, even if I fell off the top of the house!” (Which was very likely true.)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Down, down, down. Would the fall never come to an end? “I wonder how many miles I’ve fallen by this time?” she said aloud. “I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—” (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) “—yes, that’s about the right distance—but then I wonder what Latitude or Longitude I’ve got to?” (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Presently she began again. “I wonder if I shall fall right through the earth! How funny it’ll seem to come out among the people that walk with their heads downward! The Antipathies, I think—” (she was rather glad there was no one listening, this time, as it didn’t sound at all the right word) “—but I shall have to ask them what the name of the country is, you know. Please, Ma’am, is this New Zealand or Australia?” (and she tried to curtsey as she spoke—fancy curtseying as you’re falling through the air! Do you think you could manage it?) “And what an ignorant little girl she’ll think me for asking! No, it’ll never do to ask: perhaps I shall see it written up somewhere.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Down, down, down. There was nothing else to do, so Alice soon began talking again. “Dinah’ll miss me very much to-night, I should think!” (Dinah was the cat.) “I hope they’ll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me! There are no mice in the air, I’m afraid, but you might catch a bat, and that’s very like a mouse, you know. But do cats eat bats, I wonder?” And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, “Do cats eat bats? Do cats eat bats?” and sometimes, “Do bats eat cats?” for, you see, as she couldn’t answer either question, it didn’t much matter which way she put it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, “Now, Dinah, tell me the truth: did you ever eat a bat?” when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over.' }] },
        ],
      }),
    });

    const sc1_2 = await db.scenes.add({
      chapterId: ch1Id, projectId, title: 'The Pool of Tears', order: 1, status: 'draft',
      lastEditedAt: now - 86400000 * 5,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: '“Curiouser and curiouser!” cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); “now I’m opening out like the largest telescope that ever was! Good-bye, feet!” (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off). “Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I’m sure I shan’t be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can;—but I must be kind to them,” thought Alice, “or perhaps they won’t walk the way I want to go! Let me see: I’ll give them a new pair of boots every Christmas.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'And she went on planning to herself how she would manage it. “They must go by the carrier,” she thought; “and how funny it’ll seem, sending presents to one’s own feet! And how odd the directions will look!' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice’s Right Foot, Esq., Hearthrug, near the Fender, (with Alice’s love).' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Oh dear, what nonsense I’m talking!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“You ought to be ashamed of yourself,” said Alice, “a great girl like you,” (she might well say this), “to go on crying in this way! Stop this moment, I tell you!” But she went on all the same, shedding gallons of tears, until there was a large pool all round her, about four inches deep and reaching half down the hall.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'After a time she heard a little pattering of feet in the distance, and she hastily dried her eyes to see what was coming. It was the White Rabbit returning, splendidly dressed, with a pair of white kid gloves in one hand and a large fan in the other: he came trotting along in a great hurry, muttering to himself as he came, “Oh! the Duchess, the Duchess! Oh! won’t she be savage if I’ve kept her waiting!” Alice felt so desperate that she was ready to ask help of any one; so, when the Rabbit came near her, she began, in a low, timid voice, “If you please, sir—” The Rabbit started violently, dropped the white kid gloves and the fan, and skurried away into the darkness as hard as he could go.' }] },
        ],
      }),
    });

    const sc1_3 = await db.scenes.add({
      chapterId: ch1Id, projectId, title: 'A Caucus-Race and a Long Tale', order: 2, status: 'draft',
      lastEditedAt: now - 86400000 * 7,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'They were indeed a queer-looking party that assembled on the bank—the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life. Indeed, she had quite a long argument with the Lory, who at last turned sulky, and would only say, “I am older than you, and must know better;” and this Alice would not allow without knowing how old it was, and, as the Lory positively refused to tell its age, there was no more to be said.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'At last the Mouse, who seemed to be a person of authority among them, called out, “Sit down, all of you, and listen to me! I’ll soon make you dry enough!” They all sat down at once, in a large ring, with the Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she felt sure she would catch a bad cold if she did not get dry very soon.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Ahem!” said the Mouse with an important air, “are you all ready? This is the driest thing I know. Silence all round, if you please! ‘William the Conqueror, whose cause was favoured by the pope, was soon submitted to by the English, who wanted leaders, and had been of late much accustomed to usurpation and conquest. Edwin and Morcar, the earls of Mercia and Northumbria—’”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Ugh!” said the Lory, with a shiver.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I beg your pardon!” said the Mouse, frowning, but very politely: “Did you speak?”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Not I!” said the Lory hastily.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I thought you did,” said the Mouse. “—I proceed. ‘Edwin and Morcar, the earls of Mercia and Northumbria, declared for him: and even Stigand, the patriotic archbishop of Canterbury, found it advisable—’”' }] },
        ],
      }),
    });

    // --- PART II: Curious Encounters (original Ch. 4-6) ---
    const ch2Id = await db.chapters.add({ projectId, title: 'Part II — Curious Encounters', order: 1 });

    const sc2_1 = await db.scenes.add({
      chapterId: ch2Id, projectId, title: 'The Rabbit Sends in a Little Bill', order: 0, status: 'draft',
      lastEditedAt: now - 86400000 * 3,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'It was the White Rabbit, trotting slowly back again, and looking anxiously about as it went, as if it had lost something; and she heard it muttering to itself “The Duchess! The Duchess! Oh my dear paws! Oh my fur and whiskers! She’ll get me executed, as sure as ferrets are ferrets! Where can I have dropped them, I wonder?” Alice guessed in a moment that it was looking for the fan and the pair of white kid gloves, and she very good-naturedly began hunting about for them, but they were nowhere to be seen—everything seemed to have changed since her swim in the pool, and the great hall, with the glass table and the little door, had vanished completely.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Very soon the Rabbit noticed Alice, as she went hunting about, and called out to her in an angry tone, “Why, Mary Ann, what are you doing out here? Run home this moment, and fetch me a pair of gloves and a fan! Quick, now!” And Alice was so much frightened that she ran off at once in the direction it pointed to, without trying to explain the mistake it had made.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“He took me for his housemaid,” she said to herself as she ran. “How surprised he’ll be when he finds out who I am! But I’d better take him his fan and gloves—that is, if I can find them.” As she said this, she came upon a neat little house, on the door of which was a bright brass plate with the name “W. RABBIT,” engraved upon it. She went in without knocking, and hurried upstairs, in great fear lest she should meet the real Mary Ann, and be turned out of the house before she had found the fan and gloves.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“How queer it seems,” Alice said to herself, “to be going messages for a rabbit! I suppose Dinah’ll be sending me on messages next!” And she began fancying the sort of thing that would happen: “‘Miss Alice! Come here directly, and get ready for your walk!’ ‘Coming in a minute, nurse! But I’ve got to see that the mouse doesn’t get out.’ Only I don’t think,” Alice went on, “that they’d let Dinah stop in the house if it began ordering people about like that!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'By this time she had found her way into a tidy little room with a table in the window, and on it (as she had hoped) a fan and two or three pairs of tiny white kid gloves: she took up the fan and a pair of the gloves, and was just going to leave the room, when her eye fell upon a little bottle that stood near the looking-glass. There was no label this time with the words “DRINK ME,” but nevertheless she uncorked it and put it to her lips. “I know something interesting is sure to happen,” she said to herself, “whenever I eat or drink anything; so I’ll just see what this bottle does. I do hope it’ll make me grow large again, for really I’m quite tired of being such a tiny little thing!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'It did so indeed, and much sooner than she had expected: before she had drunk half the bottle, she found her head pressing against the ceiling, and had to stoop to save her neck from being broken. She hastily put down the bottle, saying to herself “That’s quite enough—I hope I shan’t grow any more—As it is, I can’t get out at the door—I do wish I hadn’t drunk quite so much!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alas! it was too late to wish that! She went on growing, and growing, and very soon had to kneel down on the floor: in another minute there was not even room for this, and she tried the effect of lying down with one elbow against the door, and the other arm curled round her head. Still she went on growing, and, as a last resource, she put one arm out of the window, and one foot up the chimney, and said to herself “Now I can do no more, whatever happens. What will become of me?”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Luckily for Alice, the little magic bottle had now had its full effect, and she grew no larger: still it was very uncomfortable, and, as there seemed to be no sort of chance of her ever getting out of the room again, no wonder she felt unhappy.' }] },
        ],
      }),
    });

    const sc2_2 = await db.scenes.add({
      chapterId: ch2Id, projectId, title: 'Advice from a Caterpillar', order: 1, status: 'draft',
      lastEditedAt: now - 86400000 * 4,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'The Caterpillar and Alice looked at each other for some time in silence: at last the Caterpillar took the hookah out of its mouth, and addressed her in a languid, sleepy voice.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Who are you?” said the Caterpillar.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This was not an encouraging opening for a conversation. Alice replied, rather shyly, “I—I hardly know, sir, just at present—at least I know who I was when I got up this morning, but I think I must have been changed several times since then.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“What do you mean by that?” said the Caterpillar sternly. “Explain yourself!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I can’t explain myself, I’m afraid, sir,” said Alice, “because I’m not myself, you see.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I don’t see,” said the Caterpillar.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I’m afraid I can’t put it more clearly,” Alice replied very politely, “for I can’t understand it myself to begin with; and being so many different sizes in a day is very confusing.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“It isn’t,” said the Caterpillar.' }] },
        ],
      }),
    });

    const sc2_3 = await db.scenes.add({
      chapterId: ch2Id, projectId, title: 'Pig and Pepper', order: 2, status: 'draft',
      lastEditedAt: now - 86400000 * 6,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'For a minute or two she stood looking at the house, and wondering what to do next, when suddenly a footman in livery came running out of the wood—(she considered him to be a footman because he was in livery: otherwise, judging by his face only, she would have called him a fish)—and rapped loudly at the door with his knuckles. It was opened by another footman in livery, with a round face, and large eyes like a frog; and both footmen, Alice noticed, had powdered hair that curled all over their heads. She felt very curious to know what it was all about, and crept a little way out of the wood to listen.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The Fish-Footman began by producing from under his arm a great letter, nearly as large as himself, and this he handed over to the other, saying, in a solemn tone, “For the Duchess. An invitation from the Queen to play croquet.” The Frog-Footman repeated, in the same solemn tone, only changing the order of the words a little, “From the Queen. An invitation for the Duchess to play croquet.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Then they both bowed low, and their curls got entangled together.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice laughed so much at this, that she had to run back into the wood for fear of their hearing her; and when she next peeped out the Fish-Footman was gone, and the other was sitting on the ground near the door, staring stupidly up into the sky.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice went timidly up to the door, and knocked.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“There’s no sort of use in knocking,” said the Footman, “and that for two reasons. First, because I’m on the same side of the door as you are; secondly, because they’re making such a noise inside, no one could possibly hear you.” And certainly there was a most extraordinary noise going on within—a constant howling and sneezing, and every now and then a great crash, as if a dish or kettle had been broken to pieces.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Please, then,” said Alice, “how am I to get in?”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“There might be some sense in your knocking,” the Footman went on without attending to her, “if we had the door between us. For instance, if you were inside, you might knock, and I could let you out, you know.” He was looking up into the sky all the time he was speaking, and this Alice thought decidedly uncivil. “But perhaps he can’t help it,” she said to herself; “his eyes are so very nearly at the top of his head. But at any rate he might answer questions.—How am I to get in?” she repeated, aloud.' }] },
        ],
      }),
    });

    // --- PART III: Madness and Royalty (original Ch. 7-9) ---
    const ch3Id = await db.chapters.add({ projectId, title: 'Part III — Madness and Royalty', order: 2 });

    const sc3_1 = await db.scenes.add({
      chapterId: ch3Id, projectId, title: 'A Mad Tea-Party', order: 0, status: 'draft',
      lastEditedAt: now - 3600000 * 12,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'There was a table set out under a tree in front of the house, and the March Hare and the Hatter were having tea at it: a Dormouse was sitting between them, fast asleep, and the other two were using it as a cushion, resting their elbows on it, and talking over its head. “Very uncomfortable for the Dormouse,” thought Alice; “only, as it’s asleep, I suppose it doesn’t mind.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The table was a large one, but the three were all crowded together at one corner of it: “No room! No room!” they cried out when they saw Alice coming. “There’s plenty of room!” said Alice indignantly, and she sat down in a large arm-chair at one end of the table.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Have some wine,” the March Hare said in an encouraging tone.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice looked all round the table, but there was nothing on it but tea. “I don’t see any wine,” she remarked.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“There isn’t any,” said the March Hare.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Then it wasn’t very civil of you to offer it,” said Alice angrily.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“It wasn’t very civil of you to sit down without being invited,” said the March Hare.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I didn’t know it was your table,” said Alice; “it’s laid for a great many more than three.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Your hair wants cutting,” said the Hatter. He had been looking at Alice for some time with great curiosity, and this was his first speech.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“You should learn not to make personal remarks,” Alice said with some severity; “it’s very rude.”' }] },
        ],
      }),
    });

    const sc3_2 = await db.scenes.add({
      chapterId: ch3Id, projectId, title: 'The Queen\'s Croquet-Ground', order: 1, status: 'draft',
      lastEditedAt: now - 3600000 * 6,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'A large rose-tree stood near the entrance of the garden: the roses growing on it were white, but there were three gardeners at it, busily painting them red. Alice thought this a very curious thing, and she went nearer to watch them, and just as she came up to them she heard one of them say, “Look out now, Five! Don’t go splashing paint over me like that!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“I couldn’t help it,” said Five, in a sulky tone; “Seven jogged my elbow.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'On which Seven looked up and said, “That’s right, Five! Always lay the blame on others!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“You’d better not talk!” said Five. “I heard the Queen say only yesterday you deserved to be beheaded!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“What for?” said the one who had spoken first.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“That’s none of your business, Two!” said Seven.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Yes, it is his business!” said Five, “and I’ll tell him—it was for bringing the cook tulip-roots instead of onions.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Seven flung down his brush, and had just begun “Well, of all the unjust things—” when his eye chanced to fall upon Alice, as she stood watching them, and he checked himself suddenly: the others looked round also, and all of them bowed low.' }] },
        ],
      }),
    });

    const sc3_3 = await db.scenes.add({
      chapterId: ch3Id, projectId, title: 'The Mock Turtle\'s Story', order: 2, status: 'draft',
      lastEditedAt: now - 3600000 * 2,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: '“You can’t think how glad I am to see you again, you dear old thing!” said the Duchess, as she tucked her arm affectionately into Alice’s, and they walked off together.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice was very glad to find her in such a pleasant temper, and thought to herself that perhaps it was only the pepper that had made her so savage when they met in the kitchen.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“When I’m a Duchess,” she said to herself, (not in a very hopeful tone though), “I won’t have any pepper in my kitchen at all. Soup does very well without—Maybe it’s always pepper that makes people hot-tempered,” she went on, very much pleased at having found out a new kind of rule, “and vinegar that makes them sour—and camomile that makes them bitter—and—and barley-sugar and such things that make children sweet-tempered. I only wish people knew that: then they wouldn’t be so stingy about it, you know—”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'She had quite forgotten the Duchess by this time, and was a little startled when she heard her voice close to her ear. “You’re thinking about something, my dear, and that makes you forget to talk. I can’t tell you just now what the moral of that is, but I shall remember it in a bit.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Perhaps it hasn’t one,” Alice ventured to remark.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Tut, tut, child!” said the Duchess. “Everything’s got a moral, if only you can find it.” And she squeezed herself up closer to Alice’s side as she spoke.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice did not much like keeping so close to her: first, because the Duchess was very ugly; and secondly, because she was exactly the right height to rest her chin upon Alice’s shoulder, and it was an uncomfortably sharp chin. However, she did not like to be rude, so she bore it as well as she could.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“The game’s going on rather better now,” she said, by way of keeping up the conversation a little.' }] },
        ],
      }),
    });

    // --- PART IV: The Trial (original Ch. 10-12) ---
    const ch4Id = await db.chapters.add({ projectId, title: 'Part IV — The Trial', order: 3 });

    const sc4_1 = await db.scenes.add({
      chapterId: ch4Id, projectId, title: 'The Lobster Quadrille', order: 0, status: 'draft',
      lastEditedAt: now - 1800000,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'The Mock Turtle sighed deeply, and drew the back of one flapper across his eyes. He looked at Alice, and tried to speak, but for a minute or two sobs choked his voice. “Same as if he had a bone in his throat,” said the Gryphon: and it set to work shaking him and punching him in the back. At last the Mock Turtle recovered his voice, and, with tears running down his cheeks, he went on again:—' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“You may not have lived much under the sea—” (“I haven’t,” said Alice)—“and perhaps you were never even introduced to a lobster—” (Alice began to say “I once tasted—” but checked herself hastily, and said “No, never”) “—so you can have no idea what a delightful thing a Lobster Quadrille is!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“No, indeed,” said Alice. “What sort of a dance is it?”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Why,” said the Gryphon, “you first form into a line along the sea-shore—”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Two lines!” cried the Mock Turtle. “Seals, turtles, salmon, and so on; then, when you’ve cleared all the jelly-fish out of the way—”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“That generally takes some time,” interrupted the Gryphon.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“—you advance twice—”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Each with a lobster as a partner!” cried the Gryphon.' }] },
        ],
      }),
    });

    const sc4_2 = await db.scenes.add({
      chapterId: ch4Id, projectId, title: 'Who Stole the Tarts?', order: 1, status: 'draft',
      lastEditedAt: now - 600000,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'The King and Queen of Hearts were seated on their throne when they arrived, with a great crowd assembled about them—all sorts of little birds and beasts, as well as the whole pack of cards: the Knave was standing before them, in chains, with a soldier on each side to guard him; and near the King was the White Rabbit, with a trumpet in one hand, and a scroll of parchment in the other. In the very middle of the court was a table, with a large dish of tarts upon it: they looked so good, that it made Alice quite hungry to look at them—“I wish they’d get the trial done,” she thought, “and hand round the refreshments!” But there seemed to be no chance of this, so she began looking at everything about her, to pass away the time.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice had never been in a court of justice before, but she had read about them in books, and she was quite pleased to find that she knew the name of nearly everything there. “That’s the judge,” she said to herself, “because of his great wig.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The judge, by the way, was the King; and as he wore his crown over the wig, (look at the frontispiece if you want to see how he did it,) he did not look at all comfortable, and it was certainly not becoming.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“And that’s the jury-box,” thought Alice, “and those twelve creatures,” (she was obliged to say “creatures,” you see, because some of them were animals, and some were birds,) “I suppose they are the jurors.” She said this last word two or three times over to herself, being rather proud of it: for she thought, and rightly too, that very few little girls of her age knew the meaning of it at all. However, “jury-men” would have done just as well.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The twelve jurors were all writing very busily on slates. “What are they doing?” Alice whispered to the Gryphon. “They can’t have anything to put down yet, before the trial’s begun.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“They’re putting down their names,” the Gryphon whispered in reply, “for fear they should forget them before the end of the trial.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Stupid things!” Alice began in a loud, indignant voice, but she stopped hastily, for the White Rabbit cried out, “Silence in the court!” and the King put on his spectacles and looked anxiously round, to make out who was talking.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice could see, as well as if she were looking over their shoulders, that all the jurors were writing down “stupid things!” on their slates, and she could even make out that one of them didn’t know how to spell “stupid,” and that he had to ask his neighbour to tell him. “A nice muddle their slates’ll be in before the trial’s over!” thought Alice.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'One of the jurors had a pencil that squeaked. This of course, Alice could not stand, and she went round the court and got behind him, and very soon found an opportunity of taking it away. She did it so quickly that the poor little juror (it was Bill, the Lizard) could not make out at all what had become of it; so, after hunting all about for it, he was obliged to write with one finger for the rest of the day; and this was of very little use, as it left no mark on the slate.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Herald, read the accusation!” said the King.' }] },
        ],
      }),
    });

    const sc4_3 = await db.scenes.add({
      chapterId: ch4Id, projectId, title: 'Alice\'s Evidence', order: 2, status: 'draft',
      lastEditedAt: now - 120000,
      content: JSON.stringify({
        type: 'doc',
        content: [
        { type: 'paragraph', content: [{ type: 'text', text: '“Here!” cried Alice, quite forgetting in the flurry of the moment how large she had grown in the last few minutes, and she jumped up in such a hurry that she tipped over the jury-box with the edge of her skirt, upsetting all the jurymen on to the heads of the crowd below, and there they lay sprawling about, reminding her very much of a globe of goldfish she had accidentally upset the week before.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Oh, I beg your pardon!” she exclaimed in a tone of great dismay, and began picking them up again as quickly as she could, for the accident of the goldfish kept running in her head, and she had a vague sort of idea that they must be collected at once and put back into the jury-box, or they would die.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“The trial cannot proceed,” said the King in a very grave voice, “until all the jurymen are back in their proper places—all,” he repeated with great emphasis, looking hard at Alice as he said so.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Alice looked at the jury-box, and saw that, in her haste, she had put the Lizard in head downwards, and the poor little thing was waving its tail about in a melancholy way, being quite unable to move. She soon got it out again, and put it right; “not that it signifies much,” she said to herself; “I should think it would be quite as much use in the trial one way up as the other.”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'As soon as the jury had a little recovered from the shock of being upset, and their slates and pencils had been found and handed back to them, they set to work very diligently to write out a history of the accident, all except the Lizard, who seemed too much overcome to do anything but sit with its mouth open, gazing up into the roof of the court.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Who cares for you?” said Alice, (she had grown to her full size by this time.) “You’re nothing but a pack of cards!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'At this the whole pack rose up into the air, and came flying down upon her: she gave a little scream, half of fright and half of anger, and tried to beat them off, and found herself lying on the bank, with her head in the lap of her sister, who was gently brushing away some dead leaves that had fluttered down from the trees upon her face.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Wake up, Alice dear!” said her sister; “Why, what a long sleep you’ve had!”' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '“Oh, I’ve had such a curious dream!” said Alice, and she told her sister, as well as she could remember them, all these strange Adventures of hers that you have just been reading about; and when she had finished, her sister kissed her, and said, “It was a curious dream, dear, certainly: but now run in to your tea; it’s getting late.” So Alice got up and ran off, thinking while she ran, as well she might, what a wonderful dream it had been.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'But her sister sat still just as she left her, leaning her head on her hand, watching the setting sun, and thinking of little Alice and all her wonderful Adventures, till she too began dreaming after a fashion, and this was her dream:—' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'First, she dreamed of little Alice herself, and once again the tiny hands were clasped upon her knee, and the bright eager eyes were looking up into hers—she could hear the very tones of her voice, and see that queer little toss of her head to keep back the wandering hair that would always get into her eyes—and still as she listened, or seemed to listen, the whole place around her became alive with the strange creatures of her little sister’s dream.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The long grass rustled at her feet as the White Rabbit hurried by—the frightened Mouse splashed his way through the neighbouring pool—she could hear the rattle of the teacups as the March Hare and his friends shared their never-ending meal, and the shrill voice of the Queen ordering off her unfortunate guests to execution—once more the pig-baby was sneezing on the Duchess’s knee, while plates and dishes crashed around it—once more the shriek of the Gryphon, the squeaking of the Lizard’s slate-pencil, and the choking of the suppressed guinea-pigs, filled the air, mixed up with the distant sobs of the miserable Mock Turtle.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'So she sat on, with closed eyes, and half believed herself in Wonderland, though she knew she had but to open them again, and all would change to dull reality—the grass would be only rustling in the wind, and the pool rippling to the waving of the reeds—the rattling teacups would change to tinkling sheep-bells, and the Queen’s shrill cries to the voice of the shepherd boy—and the sneeze of the baby, the shriek of the Gryphon, and all the other queer noises, would change (she knew) to the confused clamour of the busy farm-yard—while the lowing of the cattle in the distance would take the place of the Mock Turtle’s heavy sobs.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Lastly, she pictured to herself how this same little sister of hers would, in the after-time, be herself a grown woman; and how she would keep, through all her riper years, the simple and loving heart of her childhood: and how she would gather about her other little children, and make their eyes bright and eager with many a strange tale, perhaps even with the dream of Wonderland of long ago: and how she would feel with all their simple sorrows, and find a pleasure in all their simple joys, remembering her own child-life, and the happy summer days.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'THE END' }] },
        ],
      }),
    });

    // ────────────────────────────────────────
    // TIMELINE EVENTS
    // ────────────────────────────────────────
    await db.timelineEvents.add({
      projectId, title: 'Down the Rabbit-Hole', position: 0.05, width: 0.04,
      color: '#2563eb', description: 'Alice follows the White Rabbit and falls down the rabbit-hole into Wonderland.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Drink Me / Eat Me', position: 0.12, width: 0.03,
      color: '#7c3aed', description: 'Alice shrinks and grows repeatedly, cries a pool of tears, and meets the Mouse.',
    });

    await db.timelineEvents.add({
      projectId, title: 'Meets the Caterpillar', position: 0.28, width: 0.03,
      color: '#0d9488', description: '"Who are YOU?" The Caterpillar interrogates Alice and reveals the mushroom\'s power.',
    });

    await db.timelineEvents.add({
      projectId, title: 'The Cheshire Cat Appears', position: 0.38, width: 0.03,
      color: '#7c3aed', description: '"We\'re all mad here." The Cat directs Alice to the Hatter and the March Hare.',
    });

    await db.timelineEvents.add({
      projectId, title: 'A Mad Tea-Party', position: 0.50, width: 0.06,
      color: '#eab308', description: 'The Hatter, the March Hare, and the Dormouse at their eternal tea-time.',
    });

    await db.timelineEvents.add({
      projectId, title: 'The Queen\'s Croquet-Ground', position: 0.62, width: 0.06,
      color: '#ea580c', description: 'Painting the roses red. Croquet with flamingos. "Off with her head!"',
    });

    await db.timelineEvents.add({
      projectId, title: 'The Mock Turtle\'s Story', position: 0.75, width: 0.04,
      color: '#6b7280', description: 'The Gryphon and the Mock Turtle tell Alice about school under the sea.',
    });

    await db.timelineEvents.add({
      projectId, title: '"You\'re nothing but a pack of cards!"', position: 0.92, width: 0.06,
      color: '#dc2626', description: 'The trial of the Knave. Alice grows to full size, defies the Queen, and wakes up.',
    });

    // ────────────────────────────────────────
    // CHARACTER APPEARANCES  (fortune: 0 = ill fortune, 0.5 = neutral, 1 = good fortune)
    // ────────────────────────────────────────

    // Alice — fluctuates through confusion and wonder, rising to triumph
    await db.characterAppearances.bulkAdd([
      { characterId: aliceId, projectId, sceneId: sc1_1, position: 0.03, fortune: 0.60, note: 'Follows the White Rabbit. Curiosity and wonder.' },
      { characterId: aliceId, projectId, sceneId: sc1_2, position: 0.10, fortune: 0.25, note: 'Shrinks, grows, cries a pool of tears. Identity crisis begins.' },
      { characterId: aliceId, projectId, sceneId: sc1_3, position: 0.18, fortune: 0.40, note: 'The Caucus-Race. Bewildered but adapting.' },
      { characterId: aliceId, projectId, sceneId: sc2_1, position: 0.28, fortune: 0.30, note: 'Trapped in the White Rabbit\'s house, grown enormous.' },
      { characterId: aliceId, projectId, sceneId: sc2_2, position: 0.35, fortune: 0.35, note: '"Who are YOU?" Caterpillar challenges her identity.' },
      { characterId: aliceId, projectId, sceneId: sc2_3, position: 0.42, fortune: 0.45, note: 'The Duchess\'s kitchen. The baby becomes a pig.' },
      { characterId: aliceId, projectId, sceneId: sc3_1, position: 0.52, fortune: 0.40, note: 'The Mad Tea-Party. Frustrated by nonsense.' },
      { characterId: aliceId, projectId, sceneId: sc3_2, position: 0.62, fortune: 0.30, note: 'The Queen\'s croquet-ground. Danger.' },
      { characterId: aliceId, projectId, sceneId: sc3_3, position: 0.75, fortune: 0.50, note: 'Listens to the Mock Turtle. Growing more confident.' },
      { characterId: aliceId, projectId, sceneId: sc4_2, position: 0.88, fortune: 0.70, note: 'The trial. She begins to grow again.' },
      { characterId: aliceId, projectId, sceneId: sc4_3, position: 0.95, fortune: 0.90, note: '"You\'re nothing but a pack of cards!" Triumph and awakening.' },
    ]);

    // White Rabbit — anxious throughout, slightly rises at court
    await db.characterAppearances.bulkAdd([
      { characterId: whiteRabbitId, projectId, sceneId: sc1_1, position: 0.03, fortune: 0.35, note: '"Oh dear! Oh dear! I shall be late!"' },
      { characterId: whiteRabbitId, projectId, sceneId: sc2_1, position: 0.25, fortune: 0.25, note: 'Sends Alice (mistaken for Mary Ann) into his house.' },
      { characterId: whiteRabbitId, projectId, sceneId: sc4_2, position: 0.88, fortune: 0.55, note: 'Herald at the trial. In his element, barely.' },
    ]);

    // Cheshire Cat — serene and unchanging
    await db.characterAppearances.bulkAdd([
      { characterId: cheshireCatId, projectId, sceneId: sc2_3, position: 0.44, fortune: 0.80, note: 'First appearance. "We\'re all mad here."' },
      { characterId: cheshireCatId, projectId, sceneId: sc3_2, position: 0.65, fortune: 0.80, note: 'Appears at the croquet-ground. Unbeheadable.' },
    ]);

    // Queen of Hearts — powerful but increasingly defied
    await db.characterAppearances.bulkAdd([
      { characterId: queenId, projectId, sceneId: sc3_2, position: 0.62, fortune: 0.90, note: '"Off with her head!" Absolute power on the croquet-ground.' },
      { characterId: queenId, projectId, sceneId: sc4_2, position: 0.88, fortune: 0.70, note: 'Presides over the trial. "Sentence first — verdict afterwards."' },
      { characterId: queenId, projectId, sceneId: sc4_3, position: 0.95, fortune: 0.15, note: 'Alice defies her. The cards fly. Power broken.' },
    ]);

    // Mad Hatter — stuck in his loop
    await db.characterAppearances.bulkAdd([
      { characterId: hatterId, projectId, sceneId: sc3_1, position: 0.52, fortune: 0.50, note: '"Why is a raven like a writing-desk?" The eternal tea-party.' },
      { characterId: hatterId, projectId, sceneId: sc4_2, position: 0.88, fortune: 0.20, note: 'Nervous witness at the trial. Still carrying his teacup.' },
    ]);

    // Caterpillar — brief, authoritative
    await db.characterAppearances.bulkAdd([
      { characterId: caterpillarId, projectId, sceneId: sc2_2, position: 0.35, fortune: 0.70, note: '"Who are YOU?" Sits on his mushroom, smoking his hookah.' },
    ]);

    // Duchess — rises and falls
    await db.characterAppearances.bulkAdd([
      { characterId: duchessId, projectId, sceneId: sc2_3, position: 0.42, fortune: 0.40, note: 'Hostile in her pepper-filled kitchen.' },
      { characterId: duchessId, projectId, sceneId: sc3_2, position: 0.64, fortune: 0.55, note: 'Reappears at croquet, excessively friendly. Morals in everything.' },
    ]);

    // Mock Turtle — melancholy throughout
    await db.characterAppearances.bulkAdd([
      { characterId: mockTurtleId, projectId, sceneId: sc3_3, position: 0.75, fortune: 0.30, note: 'Weeping as he tells his school story.' },
      { characterId: mockTurtleId, projectId, sceneId: sc4_1, position: 0.82, fortune: 0.25, note: 'The Lobster Quadrille. "Beautiful Soup."' },
    ]);

    // ────────────────────────────────────────
    // IDEAS
    // ────────────────────────────────────────
    const ideaData = [
      { content: '"Who in the world am I? Ah, that\'s the great puzzle!" — the central question of the book. Alice\'s identity shifts with her size. Every creature asks who she is and she cannot answer. Identity is not fixed in Wonderland.', tags: ['theme', 'identity'], createdAt: now - 86400000 * 10 },
      { content: 'The logic of nonsense: Wonderland operates by its own strict internal rules. The Mad Hatter\'s tea-party is frozen at six o\'clock because he "murdered the time." The Caucus-Race ends when everyone wins. Nonsense is not the absence of logic — it is an alternative logic.', tags: ['theme', 'structure'], createdAt: now - 86400000 * 8 },
      { content: 'Carroll\'s parodies of Victorian morality tales: "How Doth the Little Crocodile" (parodying Isaac Watts), "You Are Old, Father William" (parodying Southey), "Twinkle, Twinkle, Little Bat" (parodying Jane Taylor). Every improving verse comes out wrong in Wonderland.', tags: ['craft', 'satire'], createdAt: now - 86400000 * 7 },
      { content: 'The Queen\'s croquet game as political satire: the rules change arbitrarily, the Queen always wins, and everyone pretends this is normal. "They\'re dreadfully fond of beheading people here; the great wonder is, that there\'s any one left alive!"', tags: ['theme', 'satire'], createdAt: now - 86400000 * 6 },
      { content: 'Size as metaphor for childhood: Alice is always the wrong size — too big for the door, too small for the table. Children experience this daily in an adult world. The mushroom that lets her control her size is her first real power.', tags: ['theme', 'symbolism'], createdAt: now - 86400000 * 5 },
      { content: 'The trial scene inverts all justice: verdict before evidence, sentence before verdict, accusations that explain nothing. Carroll, a logician, is showing what happens when the forms of reason are kept but the substance is removed.', tags: ['theme', 'climax'], createdAt: now - 86400000 * 4 },
      { content: 'The Cheshire Cat\'s grin remaining after the cat has gone — Carroll was a mathematician (Charles Dodgson). This is abstraction made literal: the property of a thing persisting after the thing itself has vanished. A smile without a cat.', tags: ['symbolism', 'math'], createdAt: now - 86400000 * 3 },
      { content: 'The sister\'s coda at the end is often overlooked but it\'s crucial: she imagines Alice grown up, telling these stories to other children. The dream is preserved through storytelling. The book is about the book.', tags: ['ending', 'meta'], createdAt: now - 86400000 * 2 },
      { content: 'Alice\'s growth in the courtroom is both literal and figurative. She has been shrinking and growing all story without control. Now, at the climax, she grows because she is finally asserting herself. Size = agency.', tags: ['character', 'climax'], createdAt: now - 86400000 },
      { content: '"Begin at the beginning," the King said gravely, "and go on till you come to the end: then stop." — The only sensible piece of advice in the entire book, and it\'s given during the most nonsensical scene.', tags: ['craft', 'irony'], createdAt: now - 3600000 * 12 },
      { content: 'Every character Alice meets gives her advice she didn\'t ask for: the Caterpillar, the Duchess, the Cheshire Cat, the Mock Turtle. None of it is useful in any practical sense. But all of it is true in some sideways fashion.', tags: ['theme', 'character'], createdAt: now - 3600000 * 6 },
      { content: 'The "Eat Me" / "Drink Me" motif: Alice consumes Wonderland and Wonderland consumes her. She is always eating or drinking something that transforms her. Consumption as transformation. The final act is refusing to be consumed by the trial.', tags: ['symbolism', 'structure'], createdAt: now - 3600000 * 3 },
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
    // SNAPSHOTS
    // ────────────────────────────────────────
    await db.snapshots.add({
      sceneId: sc1_1,
      projectId,
      name: 'Opening — first draft note',
      note: 'Alternate version starting from "Alice was beginning to get very tired" — tried cutting the first paragraph shorter for pacing. Kept the full version for faithfulness.',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or co...' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '[Trimmed opening for faster hook — went back to Carroll\'s original pacing]' }] },
        ],
      }),
      createdAt: now - 86400000 * 12,
    });

    await db.snapshots.add({
      sceneId: sc4_3,
      projectId,
      name: 'Trial climax — condensed version',
      note: 'Tried cutting the trial to just the verdict-and-cards moment. Lost too much buildup. The jury comedy is essential.',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '"No, no!" said the Queen. "Sentence first — verdict afterwards."' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Stuff and nonsense!" said Alice loudly. "The idea of having the sentence first!"' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Off with her head!" the Queen shouted at the top of her voice. Nobody moved.' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '"Who cares for you?" said Alice, (she had grown to her full size by this time.) "You\'re nothing but a pack of cards!"' }] },
        ],
      }),
      createdAt: now - 86400000 * 3,
    });

    return projectId;
  });
}
