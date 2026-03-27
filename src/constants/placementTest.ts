export type PlacementQuestionType = "recognition" | "definition" | "usage";

export interface PlacementQuestion {
  id: string;
  type: PlacementQuestionType;
  level: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // A1 — Recognition
  {
    id: "q1",
    type: "recognition",
    level: "A1",
    question: 'Do you know the word "basic"?',
    options: ["Yes, I know it", "I've seen it", "No idea"],
    correctIndex: 0,
  },
  // A2 — Definition
  {
    id: "q2",
    type: "definition",
    level: "A2",
    question: 'What does "collaborate" mean?',
    options: [
      "To compete against someone",
      "To work together with others",
      "To argue strongly",
      "To ignore a request",
      "No idea",
    ],
    correctIndex: 1,
  },
  // B1 — Recognition
  {
    id: "q3",
    type: "recognition",
    level: "B1",
    question: 'Do you know the word "ambiguous"?',
    options: ["Yes, I know it", "I've seen it", "No idea"],
    correctIndex: 0,
  },
  // B1 — Usage
  {
    id: "q4",
    type: "usage",
    level: "B1",
    question:
      'Is this sentence correct? "The contract was deemed void due to a breach of terms."',
    options: ["Yes, correct", "No, incorrect", "No idea"],
    correctIndex: 0,
  },
  // B2 — Definition
  {
    id: "q5",
    type: "definition",
    level: "B2",
    question: 'What does "mitigation" mean?',
    options: [
      "Making something worse",
      "Completely removing a problem",
      "Reducing the severity of something",
      "Ignoring a risk",
      "No idea",
    ],
    correctIndex: 2,
  },
  // B2 — Recognition
  {
    id: "q6",
    type: "recognition",
    level: "B2",
    question: 'Do you know the word "exacerbate"?',
    options: ["Yes, I know it", "I've seen it", "No idea"],
    correctIndex: 0,
  },
  // B2 — Usage
  {
    id: "q7",
    type: "usage",
    level: "B2",
    question:
      'Is this sentence correct? "Her eloquent speech persuaded the jury effectively."',
    options: ["Yes, correct", "No, incorrect", "No idea"],
    correctIndex: 0,
  },
  // C1 — Definition
  {
    id: "q8",
    type: "definition",
    level: "C1",
    question: 'What does "juxtaposition" mean?',
    options: [
      "A legal term for ownership",
      "Placing two contrasting things side by side",
      "A type of argument structure",
      "A medical procedure",
      "No idea",
    ],
    correctIndex: 1,
  },
  // C1 — Recognition
  {
    id: "q9",
    type: "recognition",
    level: "C1",
    question: 'Do you know the word "equivocal"?',
    options: ["Yes, I know it", "I've seen it", "No idea"],
    correctIndex: 0,
  },
  // C1 — Definition
  {
    id: "q10",
    type: "definition",
    level: "C1",
    question: 'What does "perfunctory" mean?',
    options: [
      "Done thoroughly and carefully",
      "Carried out with minimal effort",
      "Highly technical in nature",
      "Emotionally driven",
      "No idea",
    ],
    correctIndex: 1,
  },
];
