/**
 * Authored move bank: English Language, Paper 1 Question 2 (language analysis).
 *
 * English Language has no content to learn, only technique, so the moves drill
 * the shape of a good answer rather than facts.
 */

import type { Move } from '../../engine/types';

const topicId = 'english-language.paper-1-q2-language-analysis';
const specRef = 'English Language · Paper 1 · Question 2';

export const ENGLISH_LANGUAGE_MOVES: Move[] = [
  {
    id: 'lang.q2.01',
    topicId,
    specRef,
    type: 'recall',
    seconds: 60,
    prompt: 'What is Question 2 actually asking you to do, and how long should you spend on it?',
    modelAnswer:
      'Analyse how the writer uses language to achieve a specific effect, using short quotations and naming methods. It is worth 8 marks, so roughly 10 minutes including reading the extract.',
  },
  {
    id: 'lang.q2.02',
    topicId,
    specRef,
    type: 'mcq',
    seconds: 45,
    prompt: 'Which quotation choice is strongest for close analysis?',
    options: [
      { text: 'A three word phrase with one loaded verb in it', correct: true },
      { text: 'A whole sentence of twenty words', misconception: 'Long quotations leave nothing to zoom in on and eat time.' },
      { text: 'A single common word such as "the"', misconception: 'Too small to carry meaning. You need a word doing work.' },
      { text: 'A quotation from a different paragraph that sounds impressive', misconception: 'It has to answer the question, not decorate the answer.' },
    ],
  },
  {
    id: 'lang.q2.03',
    topicId,
    specRef,
    type: 'recall',
    seconds: 90,
    prompt: 'Write the four steps of one analytical paragraph, from memory.',
    modelAnswer:
      'Point about the effect. Short embedded quotation. Name the method (verb choice, simile, semantic field, sentence form). Explain the effect on the reader, then zoom in on one word and push further.',
  },
  {
    id: 'lang.q2.04',
    topicId,
    specRef,
    type: 'explain',
    seconds: 120,
    prompt:
      'A student writes: "The writer uses the word \'crawled\' which makes it more interesting for the reader." Rewrite it so it would score.',
    modelAnswer:
      'The verb "crawled" reduces the figure to something animal and slow, suggesting exhaustion rather than choice. It also implies he is close to the ground, so the reader pictures someone beaten down by the journey rather than travelling it.',
  },
  {
    id: 'lang.q2.05',
    topicId,
    specRef,
    type: 'match',
    seconds: 120,
    prompt: 'Match the method to what it does. Cover the right column first.',
    pairs: [
      { left: 'Semantic field', right: 'A group of words with related meaning that builds an atmosphere' },
      { left: 'Short declarative sentence', right: 'Lands a point abruptly and creates tension' },
      { left: 'Personification', right: 'Gives human qualities to something that is not human' },
      { left: 'Listing', right: 'Piles up detail to overwhelm or to show abundance' },
    ],
  },
  {
    id: 'lang.q2.06',
    topicId,
    specRef,
    type: 'exam',
    seconds: 180,
    marks: 8,
    prompt:
      'Plan two analytical paragraphs on how a writer creates a sense of threat in a storm description. Bullet points only, four minutes. (8 marks)',
    markScheme: [
      'Each paragraph opens with an effect, not with a quotation.',
      'Quotations are short and embedded in the sentence.',
      'Methods are named accurately and not just labelled.',
      'At least one moment of zooming in on a single word choice.',
      'Both paragraphs answer the question asked, not "the writer makes it interesting".',
    ],
  },
  {
    id: 'lang.q2.07',
    topicId,
    specRef,
    type: 'mcq',
    seconds: 45,
    prompt: 'Which is the most common way to lose marks on Question 2?',
    options: [
      { text: 'Feature spotting: naming techniques without explaining their effect', correct: true },
      { text: 'Using too many short quotations', misconception: 'Short quotations are what the question wants.' },
      { text: 'Writing about the writer rather than the narrator', misconception: 'A fair point elsewhere, but it is not the usual mark loser here.' },
      { text: 'Not writing an introduction', misconception: 'Question 2 needs no introduction. Start analysing immediately.' },
    ],
  },
  {
    id: 'lang.q2.08',
    topicId,
    specRef,
    type: 'explain',
    seconds: 120,
    prompt: 'Explain to a Year 7 the difference between describing what happens and analysing how it is written.',
    modelAnswer:
      'Describing means retelling the story: the man walked through the storm. Analysing means looking at the choices the writer made: why "staggered" instead of "walked", why the sentence stops short, what that makes the reader feel. The question is about the writing, not the events.',
  },
];
