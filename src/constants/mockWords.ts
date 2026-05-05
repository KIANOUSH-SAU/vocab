import type { Word } from "@/types";

export const MOCK_WORDS: Word[] = [
  // ── Engineering ─────────────────────────────────────────────────────────────
  {
    id: "w001",
    word: "feasibility",
    phonetic: "/ˌfiːzəˈbɪlɪti/",
    partOfSpeech: "noun",
    definition: "The state of being possible or likely to be achieved.",
    exampleSentence:
      "The team ran a feasibility study before committing to the new bridge design.",
    contextPassage:
      "Before any project breaks ground, engineers conduct a feasibility study to assess technical, financial, and timeline constraints. A positive feasibility outcome gives stakeholders the confidence to allocate resources. Without it, even brilliant designs may never leave the drawing board.",
    level: "B1",
    usabilityScore: 9,
    audioUrl: "",
  },
  {
    id: "w002",
    word: "iterative",
    phonetic: "/ˈɪtərətɪv/",
    partOfSpeech: "adjective",
    definition:
      "Involving repetition of a process with the aim of approaching a desired result.",
    exampleSentence:
      "The software team used an iterative approach, releasing small updates every two weeks.",
    contextPassage:
      "Modern engineering relies heavily on iterative development cycles. Rather than delivering a finished product all at once, teams refine their work through repeated testing and feedback loops. This iterative process reduces risk and improves the final outcome significantly.",
    level: "B2",
    usabilityScore: 9,
    audioUrl: "",
  },
  {
    id: "w003",
    word: "thermal",
    phonetic: "/ˈθɜːrməl/",
    partOfSpeech: "adjective",
    definition: "Relating to heat.",
    exampleSentence:
      "The thermal insulation in the building reduces heating costs by 30%.",
    contextPassage:
      "Engineers carefully consider thermal properties when designing buildings and machines. Poor thermal management can lead to equipment failure or energy waste. Selecting the right materials with appropriate thermal resistance is a core engineering skill.",
    level: "B1",
    usabilityScore: 8,
    audioUrl: "",
  },
  {
    id: "w004",
    word: "redundancy",
    phonetic: "/rɪˈdʌndənsi/",
    partOfSpeech: "noun",
    definition:
      "The inclusion of extra components that can take over in case of failure.",
    exampleSentence:
      "The power system was designed with built-in redundancy to prevent outages.",
    contextPassage:
      "In critical engineering systems, redundancy is not waste — it is insurance. A redundant backup generator, for example, ensures that hospitals keep running during a power cut. Engineers build redundancy into designs wherever the cost of failure is high.",
    level: "B2",
    usabilityScore: 8,
    audioUrl: "",
  },
  {
    id: "w005",
    word: "prototype",
    phonetic: "/ˈprəʊtətaɪp/",
    partOfSpeech: "noun",
    definition:
      "A first model of something from which other versions are developed.",
    exampleSentence:
      "They built a prototype of the new engine to test its performance.",
    contextPassage:
      "A prototype is an engineer's most honest answer to a design question. It transforms an idea on paper into something that can be held, tested, and improved. Building a prototype early in the process saves time and money by revealing flaws before mass production begins.",
    level: "A2",
    usabilityScore: 10,
    audioUrl: "",
  },

  // ── Health ───────────────────────────────────────────────────────────────────
  {
    id: "w006",
    word: "prognosis",
    phonetic: "/prɒɡˈnəʊsɪs/",
    partOfSpeech: "noun",
    definition: "A forecast of the likely outcome of a disease or situation.",
    exampleSentence:
      "The doctor gave a positive prognosis after reviewing the latest test results.",
    contextPassage:
      "When a patient receives a diagnosis, the next critical piece of information is the prognosis. A prognosis is the doctor's best assessment of how the condition will progress over time. It guides both treatment decisions and the patient's own planning for the future.",
    level: "B2",
    usabilityScore: 9,
    audioUrl: "",
  },
  {
    id: "w007",
    word: "inflammation",
    phonetic: "/ˌɪnfləˈmeɪʃən/",
    partOfSpeech: "noun",
    definition:
      "A physical reaction to injury or infection, marked by redness, heat, and swelling.",
    exampleSentence:
      "Ice is applied to sports injuries to reduce inflammation and pain.",
    contextPassage:
      "Inflammation is the body's natural defense mechanism against injury and infection. While short-term inflammation aids healing, chronic inflammation is linked to serious conditions like heart disease and arthritis. Managing inflammation through diet, medication, and rest is central to many treatment plans.",
    level: "B1",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w008",
    word: "chronic",
    phonetic: "/ˈkrɒnɪk/",
    partOfSpeech: "adjective",
    definition: "Persisting for a long time or constantly recurring.",
    exampleSentence:
      "He has been managing chronic back pain for several years.",
    contextPassage:
      "Unlike acute conditions that resolve quickly, chronic illnesses persist over months or years. Chronic diseases such as diabetes or hypertension require ongoing management rather than a single cure. Healthcare professionals focus on improving quality of life and slowing disease progression for chronic patients.",
    level: "B1",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w009",
    word: "dosage",
    phonetic: "/ˈdəʊsɪdʒ/",
    partOfSpeech: "noun",
    definition: "The size and frequency of a dose of medicine.",
    exampleSentence:
      "Follow the prescribed dosage carefully and do not exceed two tablets per day.",
    contextPassage:
      "Getting the dosage right is one of the most critical aspects of medical treatment. Too little of a medication may be ineffective, while too much can cause serious side effects. Doctors calculate dosage based on the patient's weight, age, kidney function, and the severity of their condition.",
    level: "A2",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w010",
    word: "resilience",
    phonetic: "/rɪˈzɪliəns/",
    partOfSpeech: "noun",
    definition: "The ability to recover quickly from difficulties.",
    exampleSentence:
      "Mental resilience is as important as physical fitness in healthcare workers.",
    contextPassage:
      "In health contexts, resilience refers to the body's and mind's ability to bounce back after stress, illness, or trauma. Building resilience through exercise, sleep, and social connection has measurable health benefits. Healthcare providers increasingly focus on resilience as a pillar of preventive medicine.",
    level: "B1",
    usabilityScore: 9,
    audioUrl: "",
  },

  // ── Law ──────────────────────────────────────────────────────────────────────
  {
    id: "w011",
    word: "jurisdiction",
    phonetic: "/ˌdʒʊərɪsˈdɪkʃən/",
    partOfSpeech: "noun",
    definition:
      "The official power to make legal decisions within a particular area.",
    exampleSentence:
      "The case was dismissed because the court lacked jurisdiction over the matter.",
    contextPassage:
      "Jurisdiction determines which court or authority has the right to hear a case. A crime committed in one country may not be prosecutable in another if that country lacks jurisdiction. Understanding jurisdictional boundaries is a foundational concept in both domestic and international law.",
    level: "B2",
    usabilityScore: 9,
    audioUrl: "",
  },
  {
    id: "w012",
    word: "liability",
    phonetic: "/ˌlaɪəˈbɪlɪti/",
    partOfSpeech: "noun",
    definition: "The state of being legally responsible for something.",
    exampleSentence:
      "The company accepted liability for the accident and agreed to pay compensation.",
    contextPassage:
      "Liability is at the heart of most civil legal disputes. When a party is found liable, they are legally required to remedy the harm they caused, typically through financial compensation. Businesses purchase insurance specifically to manage liability risks that arise from their operations.",
    level: "B1",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w013",
    word: "precedent",
    phonetic: "/ˈpresɪdənt/",
    partOfSpeech: "noun",
    definition:
      "An earlier event or decision that serves as a guide or rule for future situations.",
    exampleSentence:
      "The landmark ruling set a precedent for how similar cases would be handled.",
    contextPassage:
      "In common law systems, precedent is the backbone of legal reasoning. Judges look to past decisions — known as case law — to decide current disputes consistently. A strong precedent from a higher court is binding on lower courts, ensuring predictability and fairness in the legal system.",
    level: "B2",
    usabilityScore: 9,
    audioUrl: "",
  },

  // ── Sports ───────────────────────────────────────────────────────────────────
  {
    id: "w014",
    word: "endurance",
    phonetic: "/ɪnˈdjʊərəns/",
    partOfSpeech: "noun",
    definition: "The ability to sustain prolonged physical or mental effort.",
    exampleSentence:
      "Marathon runners spend months building their endurance through long training runs.",
    contextPassage:
      "Endurance is the foundation of almost every sport that lasts more than a few seconds. Training for endurance means conditioning the heart, lungs, and muscles to perform efficiently over time. Athletes who neglect endurance training often fade in the final stages of competition.",
    level: "B1",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w015",
    word: "agility",
    phonetic: "/əˈdʒɪlɪti/",
    partOfSpeech: "noun",
    definition: "The ability to move quickly and easily.",
    exampleSentence:
      "The footballer's agility allowed her to change direction faster than her opponents.",
    contextPassage:
      "Agility is the ability to change direction quickly and accurately while maintaining control of the body. In sports like football, tennis, and basketball, agility often determines who wins a crucial moment. Coaches use ladder drills and cone exercises to develop agility in their athletes.",
    level: "B1",
    usabilityScore: 9,
    audioUrl: "",
  },

  // ── Education ────────────────────────────────────────────────────────────────
  {
    id: "w016",
    word: "curriculum",
    phonetic: "/kəˈrɪkjʊləm/",
    partOfSpeech: "noun",
    definition:
      "The subjects comprising a course of study in a school or college.",
    exampleSentence:
      "The school updated its curriculum to include digital literacy and coding.",
    contextPassage:
      "A well-designed curriculum is the roadmap of an education system. It defines what students learn, in what order, and by what standard. Schools regularly revise their curriculum to reflect changes in society, technology, and the needs of the workforce.",
    level: "B1",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w017",
    word: "assessment",
    phonetic: "/əˈsesmənt/",
    partOfSpeech: "noun",
    definition:
      "The evaluation of the nature, quality, or ability of someone or something.",
    exampleSentence:
      "Continuous assessment throughout the year gives a fairer picture than a single exam.",
    contextPassage:
      "Assessment is how educators measure what students have learned and how well teaching methods are working. Modern assessment goes beyond traditional tests to include projects, presentations, and peer review. Effective assessment provides feedback that helps both teachers and students improve.",
    level: "B1",
    usabilityScore: 10,
    audioUrl: "",
  },
  {
    id: "w018",
    word: "pedagogy",
    phonetic: "/ˈpedəɡɒdʒi/",
    partOfSpeech: "noun",
    definition: "The method and practice of teaching.",
    exampleSentence:
      "The professor's pedagogy emphasized discussion over lectures.",
    contextPassage:
      "Pedagogy is the science and art of how teaching is done. Different pedagogical approaches — from direct instruction to project-based learning — suit different subjects and student needs. A teacher who reflects on and adapts their pedagogy continuously is more likely to engage and inspire their students.",
    level: "B2",
    usabilityScore: 8,
    audioUrl: "",
  },
];
