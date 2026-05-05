// export type PlacementQuestionType = "recognition" | "definition" | "usage";

// export interface PlacementQuestion {
//   id: string;
//   type: PlacementQuestionType;
//   level: string;
//   question: string;
//   options: string[];
//   correctIndex: number;
// }

// export type PlacementQuestionType =
//   | "recognition" // Vocabulary — Do you know this word?
//   | "definition" // Vocabulary — What does X mean?
//   | "usage" // Vocabulary — Is this sentence correct?
//   | "readingComprehension"; // Reading — passage + comprehension question

// export interface PlacementQuestion {
//   id: string;
//   type: PlacementQuestionType;
//   skill: "vocabulary" | "reading";
//   level: string; // "A1" | "A2" | "B1" | "B2" | "C1"
//   question: string;
//   passage?: string; // Used for readingComprehension
//   options: string[];
//   correctIndex: number;
// }

// export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [];

export type PlacementQuestionType =
  | "recognition"
  | "definition"
  | "usage"
  | "readingComprehension";

export interface PlacementQuestion {
  id: string;
  type: PlacementQuestionType;
  skill: "vocabulary" | "reading";
  level: string;
  question: string;
  passage?: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "q_vocab_A1_x7k2m",
    type: "recognition",
    skill: "vocabulary",
    level: "A1",
    question: "Which word means a place where people sleep and live?",
    options: ["office", "house", "garden", "school"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A1_p3n8q",
    type: "definition",
    skill: "vocabulary",
    level: "A1",
    question: "What does the word 'hungry' mean?",
    options: [
      "feeling tired",
      "feeling cold",
      "wanting to eat food",
      "wanting to sleep",
    ],
    correctIndex: 2,
  },
  {
    id: "q_vocab_A1_h9j4v",
    type: "recognition",
    skill: "vocabulary",
    level: "A1",
    question: "Which word describes the color of the sky on a clear day?",
    options: ["green", "red", "blue", "yellow"],
    correctIndex: 2,
  },
  {
    id: "q_vocab_A1_m2b6s",
    type: "usage",
    skill: "vocabulary",
    level: "A1",
    question:
      "Choose the correct word to complete the sentence: 'She goes to _____ to learn and study.'",
    options: ["hospital", "market", "school", "park"],
    correctIndex: 2,
  },
  {
    id: "q_vocab_A1_add1",
    type: "definition",
    skill: "vocabulary",
    level: "A1",
    question: "What does the word 'always' mean?",
    options: ["sometimes", "never", "every time", "once"],
    correctIndex: 2,
  },
  {
    id: "q_vocab_A1_add2",
    type: "usage",
    skill: "vocabulary",
    level: "A1",
    question: "Choose the correct word: 'I ____ an apple every day.'",
    options: ["eat", "drink", "sleep", "run"],
    correctIndex: 0,
  },
  {
    id: "q_vocab_A2_7f3k2",
    type: "recognition",
    skill: "vocabulary",
    level: "A2",
    question: "Which word means the opposite of 'expensive'?",
    options: ["heavy", "cheap", "large", "modern"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_2x8q5",
    type: "usage",
    skill: "vocabulary",
    level: "A2",
    question: "Choose the sentence that uses the word 'borrow' correctly.",
    options: [
      "She borrowed her umbrella to her friend.",
      "He borrowed some money from his brother.",
      "They borrowed the shop with new items.",
      "I borrowed my bag at the door.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_4r6t9",
    type: "recognition",
    skill: "vocabulary",
    level: "A2",
    question:
      "Which word describes how something feels when you touch it and it is not rough?",
    options: ["loud", "smooth", "narrow", "bright"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_5h0w3",
    type: "definition",
    skill: "vocabulary",
    level: "A2",
    question: "What does the word 'arrive' mean?",
    options: [
      "to leave a place quickly",
      "to get to a place",
      "to look for something",
      "to carry heavy things",
    ],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_1b3n7",
    type: "usage",
    skill: "vocabulary",
    level: "A2",
    question: "Which sentence uses the word 'usually' correctly?",
    options: [
      "She usually to the park every Sunday.",
      "He is usually walks in the morning.",
      "They usually eat lunch at noon.",
      "I usually went there yesterday.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_vocab_A2_add1",
    type: "definition",
    skill: "vocabulary",
    level: "A2",
    question:
      "Which word means 'a period of time when you do not work and you can travel or rest'?",
    options: ["meeting", "holiday", "appointment", "schedule"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B1_2d8f5a",
    type: "usage",
    skill: "vocabulary",
    level: "B1",
    question:
      "Choose the best word to complete the sentence: 'The scientist made an important ______ that changed our understanding of the disease.'",
    options: ["discovery", "invention", "creation", "production"],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B1_7c1b9e",
    type: "definition",
    skill: "vocabulary",
    level: "B1",
    question:
      "Which word best matches this definition: 'a person who travels to a place for pleasure or interest'?",
    options: ["resident", "immigrant", "tourist", "commuter"],
    correctIndex: 2,
  },
  {
    id: "q_vocab_B1_8a6c2b",
    type: "recognition",
    skill: "vocabulary",
    level: "B1",
    question: "Which word is closest in meaning to 'frequently'?",
    options: ["rarely", "occasionally", "often", "suddenly"],
    correctIndex: 2,
  },
  {
    id: "q_vocab_B1_3f7e1d",
    type: "definition",
    skill: "vocabulary",
    level: "B1",
    question:
      "Which word best matches this definition: 'to officially end a law, system, or practice'?",
    options: ["establish", "abolish", "introduce", "reform"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B1_add1",
    type: "recognition",
    skill: "vocabulary",
    level: "B1",
    question: "Which word means 'to provide or give something that is needed'?",
    options: ["prevent", "refuse", "supply", "consume"],
    correctIndex: 2,
  },
  {
    id: "q_vocab_B1_add2",
    type: "usage",
    skill: "vocabulary",
    level: "B1",
    question:
      "Complete the sentence: 'She had to ______ the meeting because she was sick.'",
    options: ["cancel", "attend", "organize", "continue"],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B2_4821",
    type: "recognition",
    skill: "vocabulary",
    level: "B2",
    question: "Which word is closest in meaning to 'ambiguous'?",
    options: ["unclear", "unfair", "unlikely", "unnecessary"],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B2_7364",
    type: "definition",
    skill: "vocabulary",
    level: "B2",
    question: "What does the word 'eloquent' mean?",
    options: [
      "Able to express ideas clearly and persuasively",
      "Extremely knowledgeable about a subject",
      "Willing to help others without expecting reward",
      "Showing strong feelings of anger",
    ],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B2_2047",
    type: "recognition",
    skill: "vocabulary",
    level: "B2",
    question:
      "Which word best replaces 'mitigate' in the sentence: 'We need to mitigate the risks associated with the new policy.'?",
    options: ["reduce", "ignore", "celebrate", "create"],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B2_3356",
    type: "usage",
    skill: "vocabulary",
    level: "B2",
    question: "Select the sentence in which 'scrutinize' is used correctly.",
    options: [
      "The teacher asked the students to scrutinize their answers before submitting the exam.",
      "She scrutinized her friend with a warm and welcoming smile.",
      "The government decided to scrutinize the new park with fresh flowers.",
      "He scrutinized a song loudly during the celebration.",
    ],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B2_add1",
    type: "definition",
    skill: "vocabulary",
    level: "B2",
    question: "What does the word 'inevitable' mean?",
    options: [
      "certain to happen",
      "easy to forget",
      "hard to understand",
      "open to change",
    ],
    correctIndex: 0,
  },
  {
    id: "q_vocab_B2_add2",
    type: "usage",
    skill: "vocabulary",
    level: "B2",
    question: "Which sentence uses 'fluctuate' correctly?",
    options: [
      "The line fluctuated straight across the page.",
      "Prices at the market fluctuate depending on the season.",
      "She decided to fluctuate her room with new paint.",
      "The team won because they fluctuated together.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_7x3k9",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question:
      "Which word most precisely describes someone who pretends to have moral standards or beliefs that they do not actually possess?",
    options: ["sycophant", "hypocrite", "demagogue", "misanthrope"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_5nt1r",
    type: "usage",
    skill: "vocabulary",
    level: "C1",
    question:
      "Choose the sentence in which the word 'mitigate' is used correctly.",
    options: [
      "The new law was designed to mitigate the severity of the penalties.",
      "She decided to mitigate her opinion after the debate.",
      "The scientist mitigated a new theory about climate change.",
      "He mitigated his colleagues with constant interruptions.",
    ],
    correctIndex: 0,
  },
  {
    id: "q_vocab_C1_8bw4z",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question:
      "Which of the following words best describes a government or system ruled by a small group of people who hold exclusive power?",
    options: ["theocracy", "oligarchy", "meritocracy", "plutocracy"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_3hj6f",
    type: "definition",
    skill: "vocabulary",
    level: "C1",
    question: "What does the adjective 'perfidious' mean?",
    options: [
      "excessively cautious and hesitant",
      "deceitful and untrustworthy; guilty of betrayal",
      "overly generous to the point of extravagance",
      "stubbornly resistant to change or reform",
    ],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_9ck2v",
    type: "usage",
    skill: "vocabulary",
    level: "C1",
    question: "Select the sentence in which 'exacerbate' is used correctly.",
    options: [
      "The medication helped to exacerbate the patient's recovery.",
      "Cutting funding for schools will only exacerbate the inequality gap.",
      "The committee exacerbated a compromise after lengthy negotiations.",
      "She exacerbated the crowd with her inspiring speech.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_4yl5d",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question:
      "Which word best describes a piece of writing or speech that uses irony and humor to criticize or expose foolishness, especially in politics or society?",
    options: ["elegy", "polemic", "satire", "soliloquy"],
    correctIndex: 2,
  },
  {
    id: "q_reading_A1_7x2k1",
    type: "readingComprehension",
    skill: "reading",
    level: "A1",
    passage:
      "My name is Sara. I am eight years old. I have a cat. Her name is Mimi.",
    question: "How old is Sara?",
    options: [
      "Six years old",
      "Seven years old",
      "Eight years old",
      "Nine years old",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_A1_5n8q3",
    type: "readingComprehension",
    skill: "reading",
    level: "A1",
    passage:
      "Anna has two brothers. Their names are Ben and Sam. They live in a small house.",
    question: "How many brothers does Anna have?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 1,
  },
  {
    id: "q_reading_A1_1r4t4",
    type: "readingComprehension",
    skill: "reading",
    level: "A1",
    passage:
      "It is Monday. The weather is cold and rainy. Maria wears a coat and boots.",
    question: "What is the weather like?",
    options: [
      "Hot and sunny",
      "Windy and dry",
      "Cold and rainy",
      "Warm and cloudy",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_A1_2h5j6",
    type: "readingComprehension",
    skill: "reading",
    level: "A1",
    passage:
      "My dad works in a hospital. He is a doctor. He helps sick people every day.",
    question: "What is the writer's dad's job?",
    options: ["Teacher", "Driver", "Doctor", "Cook"],
    correctIndex: 2,
  },
  {
    id: "q_reading_A1_6b3c7",
    type: "readingComprehension",
    skill: "reading",
    level: "A1",
    passage:
      "Lucy has a red bag. She puts her books and pencils in the bag. She takes it to school every morning.",
    question: "What does Lucy put in her bag?",
    options: [
      "Food and water",
      "Toys and games",
      "Books and pencils",
      "Clothes and shoes",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_A2_7x3k1",
    type: "readingComprehension",
    skill: "reading",
    level: "A2",
    passage:
      "Maria goes to the market every Saturday morning. She buys fresh vegetables and fruit for her family. She always tries to find the best prices.",
    question: "When does Maria go to the market?",
    options: [
      "Every Sunday afternoon",
      "Every Saturday morning",
      "Every Friday evening",
      "Every Saturday evening",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_A2_9m2p4",
    type: "readingComprehension",
    skill: "reading",
    level: "A2",
    passage:
      "Tom wanted to go to the park, but it was raining heavily outside. He decided to stay home and read a book instead. He enjoyed the story very much.",
    question: "Why did Tom stay home?",
    options: [
      "He was tired",
      "He had no money",
      "It was raining outside",
      "The park was closed",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_A2_4h8q2",
    type: "readingComprehension",
    skill: "reading",
    level: "A2",
    passage:
      "Anna has a small dog named Biscuit. She takes him for a walk every evening after dinner. Biscuit loves to run and play in the garden.",
    question: "What does Biscuit like to do?",
    options: [
      "Sleep all day",
      "Swim in the river",
      "Eat a lot of food",
      "Run and play in the garden",
    ],
    correctIndex: 3,
  },
  {
    id: "q_reading_A2_2r5n9",
    type: "readingComprehension",
    skill: "reading",
    level: "A2",
    passage:
      "The school library is open from Monday to Friday. Students can borrow up to three books at a time. They must return the books within two weeks.",
    question: "How many books can a student borrow at one time?",
    options: ["One", "Two", "Three", "Four"],
    correctIndex: 2,
  },
  {
    id: "q_reading_A2_6t1w8",
    type: "readingComprehension",
    skill: "reading",
    level: "A2",
    passage:
      "Peter works at a bakery near his house. He starts work very early in the morning to prepare fresh bread. His customers always say the bread smells wonderful.",
    question: "What do Peter's customers say about the bread?",
    options: [
      "It is too expensive",
      "It smells wonderful",
      "It is not fresh",
      "It tastes too sweet",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_A2_3b6v5",
    type: "readingComprehension",
    skill: "reading",
    level: "A2",
    passage:
      "Lucy sent a message to her friend to say she would be late for lunch. She missed her bus and had to wait for the next one. Her friend said it was no problem.",
    question: "Why was Lucy going to be late?",
    options: [
      "She forgot about the lunch",
      "She was sick",
      "She missed her bus",
      "She was still at work",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B1_7x3kp",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "Maria had been preparing for her job interview for weeks. She researched the company, practised common questions, and even bought a new outfit. When the day finally arrived, she felt nervous but ready.",
    question:
      "What is the best description of Maria's feelings on the day of the interview?",
    options: [
      "Completely calm and relaxed",
      "Anxious but prepared",
      "Excited and overconfident",
      "Worried and unprepared",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_B1_9m2wq",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "The new library in town opened last month and has already become very popular. It offers free Wi-Fi, a children's reading corner, and evening book clubs for adults. Many residents say it has brought the community closer together.",
    question:
      "According to the passage, what effect has the library had on the community?",
    options: [
      "It has caused disagreements among residents.",
      "It has encouraged people to move to the town.",
      "It has helped bring people in the community closer.",
      "It has replaced other local meeting places.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B1_4t8hn",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "Although Tom enjoyed his work as a graphic designer, he often felt isolated working from home alone every day. He decided to rent a desk at a local co-working space three days a week to be around other people.",
    question: "Why did Tom decide to use a co-working space?",
    options: [
      "His home office did not have the right equipment.",
      "His employer required him to work outside the home.",
      "He wanted to feel less lonely during his working week.",
      "He needed a quieter place to concentrate on his projects.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B1_2r6lv",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "The weather forecast warned of heavy rain and strong winds throughout the weekend. Despite this, hundreds of visitors still attended the outdoor music festival, wrapping themselves in raincoats and sharing umbrellas.",
    question: "What can be inferred about the festival visitors?",
    options: [
      "They were unaware of the bad weather forecast.",
      "They were disappointed and left the festival early.",
      "They were determined to enjoy the event regardless of the weather.",
      "They had been given free tickets and felt obliged to attend.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B1_5j1yd",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "Sarah's teacher wrote in her report that she was a hardworking student who always submitted her assignments on time. However, the teacher also noted that Sarah rarely participated in class discussions and seemed hesitant to share her opinions.",
    question: "What does the teacher's report suggest about Sarah?",
    options: [
      "She is both responsible and outspoken.",
      "She is diligent but lacks confidence in expressing herself.",
      "She is talented but often submits her work late.",
      "She is shy and therefore performs poorly in her studies.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_B1_8c4nz",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "The restaurant had received excellent reviews online, so James booked a table for his parents' anniversary dinner. Unfortunately, the service was slow, and one of the dishes arrived cold. James decided he would not return.",
    question: "What is the overall tone of the passage?",
    options: [
      "Positive, because the restaurant had good reviews",
      "Neutral, because James had no strong feelings about the experience",
      "Disappointed, because the restaurant did not meet expectations",
      "Angry, because James complained to the management",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B1_3e9bw",
    type: "readingComprehension",
    skill: "reading",
    level: "B1",
    passage:
      "Every summer, thousands of tourists visit the small coastal village of Porto Fino. Local shop owners welcome the extra income, but many long-term residents complain that the crowded streets and rising prices are making their daily lives more difficult.",
    question:
      "According to the passage, how do long-term residents feel about the tourists?",
    options: [
      "They are completely supportive of the increased tourism.",
      "They have mixed feelings, but the passage focuses on their concerns.",
      "They are indifferent to the tourists visiting their village.",
      "They want the local government to ban tourism entirely.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_B2_7x3k1",
    type: "readingComprehension",
    skill: "reading",
    level: "B2",
    passage:
      "Despite the overwhelming evidence supporting climate change, a vocal minority continues to dispute the scientific consensus, often citing isolated studies that have been widely discredited. Governments worldwide are under increasing pressure to implement policies that balance economic growth with environmental responsibility. However, critics argue that without binding international agreements, individual national efforts will remain largely symbolic.",
    question:
      "What is the main concern expressed in the passage regarding national environmental efforts?",
    options: [
      "They are too expensive to implement effectively.",
      "They lack scientific backing from researchers.",
      "They may have little real impact without global cooperation.",
      "They are opposed by the majority of citizens.",
      "They focus too heavily on economic growth.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B2_9m2p4",
    type: "readingComprehension",
    skill: "reading",
    level: "B2",
    passage:
      "The rapid expansion of remote work has fundamentally altered the traditional office dynamic, prompting companies to reconsider the necessity of large, centralised workspaces. While many employees report higher productivity and improved work-life balance, managers frequently express concerns about maintaining team cohesion and company culture. This tension has led many organisations to adopt hybrid models as a compromise.",
    question:
      "Why have many organisations adopted hybrid work models, according to the passage?",
    options: [
      "To reduce the salaries paid to remote employees.",
      "To address both the benefits of remote work and concerns about team cohesion.",
      "To comply with new government regulations on office space.",
      "To improve the productivity of managers specifically.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_B2_4f8t2",
    type: "readingComprehension",
    skill: "reading",
    level: "B2",
    passage:
      "Artificial intelligence is increasingly being used in medical diagnostics, with some algorithms demonstrating accuracy rates that rival those of experienced physicians. Nevertheless, medical ethicists caution that over-reliance on such technology risks undermining the patient-doctor relationship, which remains a cornerstone of effective healthcare. They advocate for AI to serve as a supplementary tool rather than a replacement for human judgement.",
    question:
      "What is the tone of the medical ethicists' position as described in the passage?",
    options: [
      "Enthusiastically supportive of AI in medicine.",
      "Completely opposed to any use of AI in healthcare.",
      "Cautiously accepting, with important reservations.",
      "Indifferent to the developments in AI diagnostics.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B2_1r6n9",
    type: "readingComprehension",
    skill: "reading",
    level: "B2",
    passage:
      "Urban planners in several major cities have begun prioritising pedestrian zones and cycling infrastructure over car-friendly roads, a shift driven by both environmental targets and public health initiatives. While businesses in affected areas initially feared a decline in foot traffic, subsequent studies have shown that pedestrianised zones often lead to increased consumer spending. The evidence has gradually softened opposition from local business associations.",
    question:
      "What does the passage suggest about the initial reaction of businesses to pedestrianised zones?",
    options: [
      "They were enthusiastic about the potential increase in customers.",
      "They were worried that fewer customers would visit their shops.",
      "They actively campaigned for the removal of car lanes.",
      "They had no strong opinion on the urban planning changes.",
      "They immediately saw an increase in revenue.",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_B2_3j5h6",
    type: "readingComprehension",
    skill: "reading",
    level: "B2",
    passage:
      "A recent longitudinal study found that children who engage in regular creative play develop stronger problem-solving skills and greater emotional resilience than those whose leisure time is predominantly screen-based. Researchers were careful to note, however, that the findings do not imply that all screen time is detrimental, as educational content can also foster cognitive development. The study calls for a more nuanced public conversation about children's media consumption.",
    question:
      "Which of the following best describes the researchers' conclusion about screen time?",
    options: [
      "All screen time is harmful to children's development.",
      "Screen time has no measurable effect on children.",
      "Creative play is beneficial, but not all screen time should be considered negative.",
      "Educational screen content is more effective than creative play.",
      "Parents should eliminate screen time for children under ten.",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_B2_8b2v5",
    type: "readingComprehension",
    skill: "reading",
    level: "B2",
    passage:
      "The growing trend of 'slow travel' encourages tourists to spend extended periods in fewer destinations rather than rushing through multiple countries in a short time. Advocates claim this approach fosters deeper cultural understanding and reduces the environmental footprint associated with frequent flights. Critics, however, contend that it remains an option available only to those with the financial means and flexible schedules to afford longer trips.",
    question: "What criticism of slow travel is raised in the passage?",
    options: [
      "It causes more environmental damage than conventional tourism.",
      "It prevents tourists from experiencing a variety of cultures.",
      "It is not genuinely beneficial for local economies.",
      "It is not accessible to everyone due to financial and time constraints.",
    ],
    correctIndex: 3,
  },
  {
    id: "q_reading_C1_7x2k9",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "The committee's decision to shelve the proposed legislation was met with barely concealed outrage by advocacy groups, who had spent years lobbying for its passage. While officials cited procedural concerns, many observers interpreted the move as a calculated capitulation to powerful industry interests.",
    question:
      "What is the most accurate description of the author's tone in this passage?",
    options: [
      "Neutral and purely informational",
      "Subtly critical of the committee's decision",
      "Sympathetic toward the officials' procedural concerns",
      "Openly celebratory of the industry's influence",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_C1_3m8pq",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "Despite the novelist's reputation for unflinching social critique, her latest work takes a conspicuously introspective turn, dwelling on the interior lives of characters rather than the systemic forces that shaped them. Critics remain divided on whether this represents artistic maturation or a retreat from her earlier ambitions.",
    question: "What can be inferred about the novelist's previous works?",
    options: [
      "They were primarily focused on characters' psychological development",
      "They were largely ignored by critics",
      "They engaged more directly with broader social and political issues",
      "They were considered less technically accomplished than her latest novel",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_C1_9n4wr",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "The resurgence of interest in stoic philosophy among corporate executives has been met with skepticism by academics, who argue that the philosophy is being selectively appropriated to justify resilience in the face of systemic inequality rather than to encourage genuine ethical reflection.",
    question:
      "According to the passage, why are academics skeptical of executives' interest in stoicism?",
    options: [
      "They believe stoicism is too complex for a corporate setting",
      "They think executives misunderstand the historical origins of stoicism",
      "They argue it is being used to rationalize enduring injustice rather than critically examining it",
      "They feel that stoicism has no practical relevance in modern life",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_C1_5t1lz",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "The architect's insistence on using exclusively reclaimed materials was initially dismissed as idealistic posturing, yet the completed structure has since become a landmark cited in sustainability discourse worldwide. What was once seen as an impediment to the project's viability is now heralded as its defining virtue.",
    question:
      "Which of the following best captures the central idea of the passage?",
    options: [
      "Reclaimed materials are always superior to conventional building materials",
      "A commitment once viewed as a liability has come to be regarded as the project's greatest strength",
      "The architect faced significant financial difficulties during construction",
      "Sustainability in architecture is only achievable with substantial public funding",
    ],
    correctIndex: 1,
  },
  {
    id: "q_reading_C1_2b6ey",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "Epidemiologists warn that the conflation of correlation with causation in media reporting on health studies continues to mislead the public, fostering unwarranted anxieties about benign behaviors while simultaneously breeding complacency toward genuinely documented risks.",
    question:
      "What problem does the passage identify with media reporting on health studies?",
    options: [
      "Journalists rarely consult qualified epidemiologists before publishing",
      "Media outlets tend to focus exclusively on rare diseases",
      "Inaccurate interpretation of statistical relationships distorts public perception of risk",
      "Health studies are too technical for general audiences to understand",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_C1_8f3uj",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "The diplomat's carefully worded statement neither confirmed nor denied the existence of back-channel negotiations, a rhetorical strategy that seasoned analysts recognized as a deliberate attempt to preserve deniability while keeping all parties sufficiently engaged to prevent a breakdown in talks.",
    question:
      "What can be inferred about the diplomat's primary objective in making the statement?",
    options: [
      "To publicly confirm that negotiations were progressing successfully",
      "To discourage further media speculation about the talks",
      "To maintain flexibility and avoid commitment while sustaining the negotiation process",
      "To signal to one party that the talks had already concluded",
    ],
    correctIndex: 2,
  },
  {
    id: "q_reading_C1_4c9vd",
    type: "readingComprehension",
    skill: "reading",
    level: "C1",
    passage:
      "Proponents of universal basic income often invoke pilot studies conducted in Scandinavian countries as definitive proof of the policy's viability, yet these studies were limited in scope, duration, and demographic diversity, making broad extrapolation methodologically precarious.",
    question:
      "What is the author's implicit argument regarding the use of Scandinavian pilot studies?",
    options: [
      "Universal basic income has been proven ineffective in all contexts studied",
      "The studies are being cited with more confidence than their limitations warrant",
      "Scandinavian countries are uniquely unsuitable for testing economic policies",
      "Proponents of universal basic income are deliberately misrepresenting the data",
    ],
    correctIndex: 1,
  },

  {
    id: "q_vocab_A1_extra1",
    type: "recognition",
    skill: "vocabulary",
    level: "A1",
    question: "Test question A1 - 1",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A1_extra2",
    type: "recognition",
    skill: "vocabulary",
    level: "A1",
    question: "Test question A1 - 2",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A1_extra3",
    type: "recognition",
    skill: "vocabulary",
    level: "A1",
    question: "Test question A1 - 3",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A1_extra4",
    type: "recognition",
    skill: "vocabulary",
    level: "A1",
    question: "Test question A1 - 4",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_extra1",
    type: "recognition",
    skill: "vocabulary",
    level: "A2",
    question: "Test question A2 - 1",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_extra2",
    type: "recognition",
    skill: "vocabulary",
    level: "A2",
    question: "Test question A2 - 2",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_extra3",
    type: "recognition",
    skill: "vocabulary",
    level: "A2",
    question: "Test question A2 - 3",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_A2_extra4",
    type: "recognition",
    skill: "vocabulary",
    level: "A2",
    question: "Test question A2 - 4",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B1_extra1",
    type: "recognition",
    skill: "vocabulary",
    level: "B1",
    question: "Test question B1 - 1",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B1_extra2",
    type: "recognition",
    skill: "vocabulary",
    level: "B1",
    question: "Test question B1 - 2",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B1_extra3",
    type: "recognition",
    skill: "vocabulary",
    level: "B1",
    question: "Test question B1 - 3",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B1_extra4",
    type: "recognition",
    skill: "vocabulary",
    level: "B1",
    question: "Test question B1 - 4",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B2_extra1",
    type: "recognition",
    skill: "vocabulary",
    level: "B2",
    question: "Test question B2 - 1",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B2_extra2",
    type: "recognition",
    skill: "vocabulary",
    level: "B2",
    question: "Test question B2 - 2",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B2_extra3",
    type: "recognition",
    skill: "vocabulary",
    level: "B2",
    question: "Test question B2 - 3",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_B2_extra4",
    type: "recognition",
    skill: "vocabulary",
    level: "B2",
    question: "Test question B2 - 4",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_extra1",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question: "Test question C1 - 1",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_extra2",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question: "Test question C1 - 2",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_extra3",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question: "Test question C1 - 3",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "q_vocab_C1_extra4",
    type: "recognition",
    skill: "vocabulary",
    level: "C1",
    question: "Test question C1 - 4",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
];
