/**
 * Depth 2: structured self-study (section 7).
 *
 * Every GCSE subject is covered from day one, but for subjects without an
 * authored bank the moves are frameworks built around the specification point:
 * brain dump, self-correct against your own notes, then retrieve in a
 * different shape. It is a real revision method and it is honest about what it
 * is, which matters more than pretending there is content that is not there.
 */

import type { BrainDumpMove, ExamMove, ExplainMove, Move, RecallMove, Topic } from '../engine/types';

const GENERIC_CHECKLIST = [
  'The key terms, spelled correctly',
  'A definition in your own words',
  'A named example, case study or formula',
  'How it links to the topic before and after it',
  'The bit you always forget',
];

/**
 * The framework cycle. A sprint takes as many of these as fit its length, and
 * the order is deliberate: retrieve first, check second, never the other way
 * round.
 */
export function frameworkMoves(topic: Topic): Move[] {
  const base = { topicId: topic.id, specRef: topic.specRef };
  const name = topic.name;

  const dump: BrainDumpMove = {
    ...base,
    id: `${topic.id}.fw.1`,
    type: 'brainDump',
    seconds: 180,
    prompt: `Write down everything you know about ${name}. Paper, not phone. Keep going until you run dry.`,
    checklist: GENERIC_CHECKLIST,
  };

  const check: RecallMove = {
    ...base,
    id: `${topic.id}.fw.2`,
    type: 'recall',
    seconds: 150,
    prompt: `Open your notes or textbook on ${name}. In a different colour, add everything you missed. Then rate yourself.`,
    modelAnswer:
      'The gaps you just wrote in colour are your revision list. They are worth more than the bits you remembered.',
  };

  const terms: RecallMove = {
    ...base,
    id: `${topic.id}.fw.3`,
    type: 'recall',
    seconds: 90,
    prompt: `Five key terms for ${name}, each with a one line definition. From memory.`,
    modelAnswer: 'Check each definition against your notes. A term you cannot define is a term you cannot use in an exam.',
  };

  const explain: ExplainMove = {
    ...base,
    id: `${topic.id}.fw.4`,
    type: 'explain',
    seconds: 120,
    prompt: `Explain ${name} to a Year 7, out loud, in five sentences.`,
    modelAnswer:
      'If you had to reach for a technical word and could not unpack it, that is the part you do not understand yet.',
  };

  const example: RecallMove = {
    ...base,
    id: `${topic.id}.fw.5`,
    type: 'recall',
    seconds: 90,
    prompt: `Give one named example, case study, formula or quotation for ${name}, with the detail that makes it count.`,
    modelAnswer: 'Examiners credit specifics. A named example with a figure or a date beats a general statement every time.',
  };

  const plan: ExamMove = {
    ...base,
    id: `${topic.id}.fw.6`,
    type: 'exam',
    seconds: 180,
    marks: 0,
    prompt: `Plan an exam answer on ${name}: three points, with the evidence for each. Bullet points only.`,
    markScheme: [
      'Three distinct points, not the same point three ways.',
      'Evidence attached to each point.',
      'A conclusion that answers the question rather than restating it.',
    ],
  };

  const weak: RecallMove = {
    ...base,
    id: `${topic.id}.fw.7`,
    type: 'recall',
    seconds: 90,
    prompt: `What is the one thing about ${name} you keep forgetting? Write it out three times, then cover it and write it once more.`,
    modelAnswer: 'Deliberate repetition of the specific gap beats re-reading the whole topic.',
  };

  const summary: BrainDumpMove = {
    ...base,
    id: `${topic.id}.fw.8`,
    type: 'brainDump',
    seconds: 120,
    prompt: `Cover everything. Write the six line summary of ${name} you would want in the exam hall.`,
    checklist: ['Six lines, no more', 'Your own words', 'The bits you got wrong earlier'],
  };

  return [dump, check, terms, explain, example, plan, weak, summary];
}
