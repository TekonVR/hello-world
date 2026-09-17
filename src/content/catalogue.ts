/**
 * The subject catalogue.
 *
 * Section 7 of the spec sets out two depths. Depth 1 subjects have authored
 * move banks (see ./banks). Depth 2 subjects still know their specification
 * and still get sequenced sprints, but the moves are structured self-study
 * frameworks rather than authored questions.
 *
 * Specification references here are human-readable placeholders. Real board
 * references are attached by the content pipeline in section 7, where every
 * move carries an author, a reviewer and a reference.
 */

import type { SubjectDefinition, Tier, Topic } from '../engine/types';

const ALL_BOARDS = ['AQA', 'Edexcel', 'OCR', 'WJEC/Eduqas', 'CCEA'] as const;

export interface SubjectSeed extends SubjectDefinition {
  topicNames: string[];
  /** Topics that only exist at Higher tier. */
  higherOnly?: string[];
  /** For English Literature: which set text each topic belongs to. */
  setTextOf?: Record<string, string>;
}

/** Every subject is offered for every board unless it says otherwise. */
function subject(seed: Omit<SubjectSeed, 'boards'> & { boards?: SubjectSeed['boards'] }): SubjectSeed {
  return { boards: [...ALL_BOARDS], ...seed };
}

export const SUBJECTS: SubjectSeed[] = [
  /* Depth 1: the subjects that carry the majority of entries ---------------- */
  subject({
    id: 'maths',
    name: 'Maths',
    depth: 1,
    tiered: true,
    topicNames: [
      'Quadratic equations',
      'Ratio and proportion',
      'Straight line graphs',
      'Pythagoras and trigonometry',
      'Probability',
      'Percentages and interest',
      'Simultaneous equations',
      'Circle theorems',
      'Vectors',
      'Standard form and indices',
    ],
    higherOnly: ['Circle theorems', 'Vectors'],
  }),
  subject({
    id: 'english-language',
    name: 'English Language',
    depth: 1,
    topicNames: [
      'Paper 1 Q2: language analysis',
      'Paper 1 Q3: structure',
      'Paper 1 Q4: evaluation',
      'Paper 1 Q5: descriptive writing',
      'Paper 2 Q2: summary and inference',
      'Paper 2 Q4: comparing viewpoints',
      'Paper 2 Q5: writing to argue',
      'Spelling, punctuation and grammar',
    ],
  }),
  subject({
    id: 'english-literature',
    name: 'English Literature',
    depth: 1,
    setTexts: [
      { id: 'macbeth', name: 'Macbeth' },
      { id: 'inspector-calls', name: 'An Inspector Calls' },
      { id: 'christmas-carol', name: 'A Christmas Carol' },
      { id: 'power-conflict', name: 'Power and Conflict poetry' },
    ],
    topicNames: [
      'Macbeth: key quotations',
      'Macbeth: ambition and guilt',
      'Macbeth: context and the Jacobean audience',
      'An Inspector Calls: responsibility',
      'An Inspector Calls: the Inspector as a device',
      'A Christmas Carol: Scrooge as a redemptive arc',
      'A Christmas Carol: poverty and Victorian context',
      'Power and Conflict: Ozymandias and London',
      'Power and Conflict: comparing presentations of power',
    ],
    setTextOf: {
      'Macbeth: key quotations': 'macbeth',
      'Macbeth: ambition and guilt': 'macbeth',
      'Macbeth: context and the Jacobean audience': 'macbeth',
      'An Inspector Calls: responsibility': 'inspector-calls',
      'An Inspector Calls: the Inspector as a device': 'inspector-calls',
      'A Christmas Carol: Scrooge as a redemptive arc': 'christmas-carol',
      'A Christmas Carol: poverty and Victorian context': 'christmas-carol',
      'Power and Conflict: Ozymandias and London': 'power-conflict',
      'Power and Conflict: comparing presentations of power': 'power-conflict',
    },
  }),
  subject({
    id: 'combined-science',
    name: 'Combined Science',
    depth: 1,
    tiered: true,
    topicNames: [
      'Cell biology',
      'Organisation and the digestive system',
      'Infection and response',
      'Bioenergetics',
      'Atomic structure and the periodic table',
      'Bonding, structure and properties',
      'Quantitative chemistry',
      'Chemical changes',
      'Energy',
      'Electricity',
      'Particle model of matter',
      'Forces',
      'Waves',
    ],
  }),
  subject({
    id: 'biology',
    name: 'Biology (triple)',
    depth: 1,
    tiered: true,
    topicNames: [
      'Cell biology',
      'Organisation',
      'Infection and response',
      'Bioenergetics',
      'Homeostasis and response',
      'Inheritance, variation and evolution',
      'Ecology',
    ],
  }),
  subject({
    id: 'chemistry',
    name: 'Chemistry (triple)',
    depth: 1,
    tiered: true,
    topicNames: [
      'Atomic structure and the periodic table',
      'Bonding, structure and properties',
      'Quantitative chemistry',
      'Chemical changes',
      'Energy changes',
      'Rates of reaction',
      'Organic chemistry',
      'Chemical analysis',
      'Chemistry of the atmosphere',
      'Using resources',
    ],
  }),
  subject({
    id: 'physics',
    name: 'Physics (triple)',
    depth: 1,
    tiered: true,
    topicNames: [
      'Energy',
      'Electricity',
      'Particle model of matter',
      'Atomic structure',
      'Forces',
      'Waves',
      'Magnetism and electromagnetism',
      'Space physics',
    ],
  }),

  /* Depth 2: structured self-study at launch -------------------------------- */
  subject({
    id: 'history',
    name: 'History',
    depth: 2,
    topicNames: [
      'Medicine through time',
      'The Elizabethans',
      'Germany 1890 to 1945',
      'Conflict and tension: the inter-war years',
      'The American West',
      'Cold War superpower relations',
      'Norman England',
      'Source skills and interpretations',
    ],
  }),
  subject({
    id: 'geography',
    name: 'Geography',
    depth: 2,
    topicNames: [
      'Tectonic hazards',
      'Weather hazards and climate change',
      'Ecosystems and tropical rainforests',
      'Hot deserts and cold environments',
      'Coastal landscapes',
      'River landscapes',
      'Urban issues and challenges',
      'The changing economic world',
      'Resource management',
      'Fieldwork and geographical skills',
    ],
  }),
  subject({
    id: 'religious-studies',
    name: 'Religious Studies',
    depth: 2,
    topicNames: [
      'Christian beliefs and teachings',
      'Christian practices',
      'Islam: beliefs and teachings',
      'Islam: practices',
      'Relationships and families',
      'Religion and life',
      'Religion, peace and conflict',
      'Religion, crime and punishment',
    ],
  }),
  subject({
    id: 'french',
    name: 'French',
    depth: 2,
    tiered: true,
    topicNames: [
      'Identity and family vocabulary',
      'Free time and hobbies',
      'Local area and town',
      'Holidays and travel',
      'School and studies',
      'Future plans and work',
      'The present tense',
      'The perfect and imperfect tenses',
      'The future and conditional tenses',
      'Speaking: photo card and role play',
    ],
  }),
  subject({
    id: 'spanish',
    name: 'Spanish',
    depth: 2,
    tiered: true,
    topicNames: [
      'Identity and family vocabulary',
      'Free time and hobbies',
      'Local area and town',
      'Holidays and travel',
      'School and studies',
      'Future plans and work',
      'The present tense',
      'The preterite and imperfect tenses',
      'The future and conditional tenses',
      'Speaking: photo card and role play',
    ],
  }),
  subject({
    id: 'german',
    name: 'German',
    depth: 2,
    tiered: true,
    topicNames: [
      'Identity and family vocabulary',
      'Free time and hobbies',
      'Local area and town',
      'Holidays and travel',
      'School and studies',
      'Cases and word order',
      'The present and perfect tenses',
      'Speaking: photo card and role play',
    ],
  }),
  subject({
    id: 'business',
    name: 'Business',
    depth: 2,
    topicNames: [
      'Enterprise and entrepreneurship',
      'Spotting a business opportunity',
      'Putting a business idea into practice',
      'Making the business effective',
      'Marketing mix',
      'Business operations',
      'Finance: cash flow and break-even',
      'Human resources',
      'Growth and globalisation',
      'Ethics and the environment',
    ],
  }),
  subject({
    id: 'computer-science',
    name: 'Computer Science',
    depth: 2,
    topicNames: [
      'Algorithms and computational thinking',
      'Searching and sorting algorithms',
      'Programming fundamentals',
      'Data representation: binary and hex',
      'Data representation: images and sound',
      'Computer systems and the CPU',
      'Memory and storage',
      'Networks and protocols',
      'Cyber security',
      'Ethical, legal and environmental impacts',
    ],
  }),
  subject({
    id: 'pe',
    name: 'PE',
    depth: 2,
    topicNames: [
      'The skeletal and muscular systems',
      'The cardiovascular and respiratory systems',
      'Movement analysis',
      'Physical training and fitness testing',
      'Sports psychology',
      'Health, fitness and wellbeing',
      'Socio-cultural influences',
      'Use of data in sport',
    ],
  }),
  subject({
    id: 'music',
    name: 'Music',
    depth: 2,
    topicNames: [
      'Elements of music and key terms',
      'Set works analysis',
      'Western classical tradition',
      'Popular music',
      'World and traditional music',
      'Composition techniques',
      'Listening exam technique',
    ],
  }),
  subject({
    id: 'drama',
    name: 'Drama',
    depth: 2,
    topicNames: [
      'Set text: plot and characters',
      'Practitioners and styles',
      'Design elements: set, lighting, sound, costume',
      'Performance vocabulary',
      'Live theatre review',
      'Devising log',
      'Written exam technique',
    ],
  }),
  subject({
    id: 'art',
    name: 'Art & Design',
    depth: 2,
    topicNames: [
      'Artist research and analysis',
      'Formal elements',
      'Media experiments and refinement',
      'Developing ideas and annotation',
      'Personal response planning',
      'Exam preparation timeline',
    ],
  }),
  subject({
    id: 'design-technology',
    name: 'Design & Technology',
    depth: 2,
    topicNames: [
      'Materials and their properties',
      'New and emerging technologies',
      'Energy generation and storage',
      'Mechanical devices and movement',
      'Manufacturing processes',
      'Design strategies and iterative design',
      'Ecological and social footprint',
      'Maths in design and technology',
    ],
  }),
  subject({
    id: 'food',
    name: 'Food Preparation and Nutrition',
    depth: 2,
    topicNames: [
      'Macronutrients and micronutrients',
      'Diet, nutrition and health',
      'Food science: cooking and heat transfer',
      'Food safety and spoilage',
      'Food provenance and sustainability',
      'Food choice and sensory evaluation',
      'NEA planning and exam technique',
    ],
  }),
  subject({
    id: 'media-studies',
    name: 'Media Studies',
    depth: 2,
    topicNames: [
      'Media language',
      'Representation',
      'Media industries',
      'Audiences',
      'Set products: analysis',
      'Theoretical framework and theorists',
      'Exam technique',
    ],
  }),
  subject({
    id: 'psychology',
    name: 'Psychology',
    depth: 2,
    topicNames: [
      'Memory',
      'Perception',
      'Development',
      'Research methods',
      'Social influence',
      'Language, thought and communication',
      'Psychological problems',
    ],
  }),
  subject({
    id: 'sociology',
    name: 'Sociology',
    depth: 2,
    topicNames: [
      'Families',
      'Education',
      'Crime and deviance',
      'Social stratification',
      'Sociological theories',
      'Research methods',
      'Applying studies and evidence',
    ],
  }),
  subject({
    id: 'statistics',
    name: 'Statistics',
    depth: 2,
    topicNames: [
      'Collecting data and sampling',
      'Representing data',
      'Averages and spread',
      'Scatter diagrams and correlation',
      'Probability and distributions',
      'Index numbers and time series',
      'The statistical enquiry cycle',
    ],
  }),
  subject({
    id: 'citizenship',
    name: 'Citizenship',
    depth: 2,
    topicNames: [
      'Rights and responsibilities',
      'Democracy and government',
      'Law and the justice system',
      'The UK and the wider world',
      'Taking citizenship action',
      'Identity and diversity',
    ],
  }),
  subject({
    id: 'economics',
    name: 'Economics',
    depth: 2,
    topicNames: [
      'Markets, supply and demand',
      'Production and productivity',
      'The labour market',
      'Economic objectives and policy',
      'International trade',
      'Market failure',
      'Data response technique',
    ],
  }),
];

/** Slug helper so topic ids are stable and readable. */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function topicId(subjectId: string, topicName: string): string {
  return `${subjectId}.${slug(topicName)}`;
}

function toTopic(seed: SubjectSeed, name: string): Topic {
  const higherOnly = seed.higherOnly?.includes(name) ?? false;
  return {
    id: topicId(seed.id, name),
    subjectId: seed.id,
    name,
    specRef: `${seed.name} · ${name}`,
    ...(higherOnly ? { tier: 'Higher' as Tier } : {}),
    ...(seed.setTextOf?.[name] ? { setTextId: seed.setTextOf[name] } : {}),
  };
}

export const SUBJECT_BY_ID: Record<string, SubjectSeed> = Object.fromEntries(
  SUBJECTS.map((seed) => [seed.id, seed]),
);

export const ALL_TOPICS: Topic[] = SUBJECTS.flatMap((seed) =>
  seed.topicNames.map((name) => toTopic(seed, name)),
);

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(
  ALL_TOPICS.map((topic) => [topic.id, topic]),
);

export function subjectName(subjectId: string): string {
  return SUBJECT_BY_ID[subjectId]?.name ?? subjectId;
}

export function topicName(id: string): string {
  return TOPIC_BY_ID[id]?.name ?? id;
}

export const SUBJECT_NAMES: Record<string, string> = Object.fromEntries(
  SUBJECTS.map((seed) => [seed.id, seed.name]),
);
