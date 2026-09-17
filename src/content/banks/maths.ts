/**
 * Authored move bank: Maths, quadratic equations.
 *
 * This is the pilot topic from section 15 of the spec ("cost the content
 * pipeline by authoring one full Maths topic"). Every move carries the
 * specification area it maps to. Distractors are built from the mistakes
 * students actually make, not from random wrong numbers.
 */

import type { Move } from '../../engine/types';

const topicId = 'maths.quadratic-equations';
const specRef = 'Maths · Algebra · Solving quadratic equations';

export const MATHS_MOVES: Move[] = [
  {
    id: 'mth.quad.01',
    topicId,
    specRef,
    type: 'recall',
    seconds: 60,
    prompt: 'Write down the quadratic formula. No notes.',
    modelAnswer: 'x = (-b ± √(b² - 4ac)) / 2a, for ax² + bx + c = 0.',
  },
  {
    id: 'mth.quad.02',
    topicId,
    specRef,
    type: 'worked',
    seconds: 150,
    prompt: 'Solve x² - 5x + 6 = 0 by factorising. Do each step on paper before you reveal it.',
    steps: [
      {
        prompt: 'Which two numbers multiply to +6 and add to -5?',
        reveal: '-2 and -3, because (-2) × (-3) = 6 and (-2) + (-3) = -5.',
      },
      { prompt: 'Write the factorised form.', reveal: '(x - 2)(x - 3) = 0' },
      {
        prompt: 'Now write both solutions.',
        reveal: 'x = 2 or x = 3. Each bracket is set equal to zero in turn.',
      },
    ],
  },
  {
    id: 'mth.quad.03',
    topicId,
    specRef,
    type: 'mcq',
    seconds: 45,
    prompt: 'What are the solutions of (x + 4)(x - 7) = 0?',
    options: [
      { text: 'x = -4 or x = 7', correct: true },
      {
        text: 'x = 4 or x = -7',
        misconception: 'Signs flipped. A bracket of (x + 4) is zero when x = -4, not +4.',
      },
      {
        text: 'x = -4 and x = -7',
        misconception: 'Only the sign in the first bracket was changed. Do each bracket separately.',
      },
      { text: 'x = 28', misconception: 'The brackets were multiplied out and set equal to a number.' },
    ],
  },
  {
    id: 'mth.quad.04',
    topicId,
    specRef,
    type: 'worked',
    seconds: 180,
    prompt: 'Solve 2x² + 3x - 2 = 0 by factorising.',
    steps: [
      { prompt: 'What is a × c?', reveal: '2 × (-2) = -4.' },
      { prompt: 'Which two numbers multiply to -4 and add to +3?', reveal: '+4 and -1.' },
      { prompt: 'Split the middle term and factorise in pairs.', reveal: '2x² + 4x - x - 2 = 2x(x + 2) - 1(x + 2) = (2x - 1)(x + 2)' },
      { prompt: 'Write the solutions.', reveal: 'x = 1/2 or x = -2.' },
    ],
  },
  {
    id: 'mth.quad.05',
    topicId,
    specRef,
    type: 'recall',
    seconds: 60,
    prompt: 'What does the discriminant b² - 4ac tell you about the roots?',
    modelAnswer:
      'Positive: two distinct real roots. Zero: one repeated root. Negative: no real roots, so the curve never crosses the x-axis.',
  },
  {
    id: 'mth.quad.06',
    topicId,
    specRef,
    type: 'mcq',
    seconds: 60,
    prompt: 'How many real roots does x² + 2x + 5 = 0 have?',
    options: [
      { text: 'None', correct: true },
      { text: 'One', misconception: 'One root means b² - 4ac = 0. Here it is 4 - 20 = -16.' },
      { text: 'Two', misconception: 'A negative discriminant means the graph never meets the x-axis.' },
      { text: 'Cannot be determined without a graph', misconception: 'The discriminant answers this without drawing anything.' },
    ],
  },
  {
    id: 'mth.quad.07',
    topicId,
    specRef,
    type: 'worked',
    seconds: 180,
    prompt: 'Solve x² + 6x + 4 = 0 by completing the square. Leave your answer in surd form.',
    steps: [
      { prompt: 'Write the first two terms as a square.', reveal: 'x² + 6x = (x + 3)² - 9' },
      { prompt: 'Now rewrite the whole equation.', reveal: '(x + 3)² - 9 + 4 = 0, so (x + 3)² = 5' },
      { prompt: 'Solve for x.', reveal: 'x + 3 = ±√5, so x = -3 ± √5.' },
    ],
  },
  {
    id: 'mth.quad.08',
    topicId,
    specRef,
    type: 'exam',
    seconds: 180,
    marks: 3,
    prompt:
      'Solve 3x² - 7x + 2 = 0. Give your answers to 2 decimal places. Show your working. (3 marks)',
    markScheme: [
      'M1: correct substitution into the quadratic formula, a = 3, b = -7, c = 2.',
      'A1: x = (7 ± √25) / 6.',
      'A1: x = 2 and x = 0.33 (2 dp). Both answers needed.',
    ],
  },
  {
    id: 'mth.quad.09',
    topicId,
    specRef,
    type: 'explain',
    seconds: 120,
    prompt:
      'Explain to a Year 7 why a quadratic can have two answers, when 2x + 6 = 0 only has one.',
    modelAnswer:
      'A quadratic has an x² in it, and squaring turns both a positive and a negative into a positive. So two different numbers can end up satisfying the same equation. On a graph, a straight line crosses the x-axis once but a parabola is a U shape that can cross it twice.',
  },
  {
    id: 'mth.quad.10',
    topicId,
    specRef,
    type: 'mcq',
    seconds: 60,
    prompt: 'The graph of y = x² - 4x + 3 crosses the x-axis at which points?',
    options: [
      { text: '(1, 0) and (3, 0)', correct: true },
      { text: '(-1, 0) and (-3, 0)', misconception: 'Signs of the roots reversed when factorising.' },
      { text: '(0, 3) only', misconception: 'That is the y-intercept, which is where x = 0, not y = 0.' },
      { text: '(2, -1)', misconception: 'That is the turning point, not a root.' },
    ],
  },
  {
    id: 'mth.quad.11',
    topicId,
    specRef,
    type: 'recall',
    seconds: 60,
    prompt: 'When is completing the square the better method, and why?',
    modelAnswer:
      'When the question asks for the turning point, for a proof, or for an exact surd answer. Completing the square puts the equation in the form (x + p)² + q, which hands you the turning point (-p, q) directly.',
  },
  {
    id: 'mth.quad.12',
    topicId,
    specRef,
    type: 'exam',
    seconds: 180,
    marks: 4,
    prompt:
      'A rectangle has length (x + 3) cm and width (x - 1) cm. Its area is 32 cm². Find x. (4 marks)',
    markScheme: [
      'M1: (x + 3)(x - 1) = 32.',
      'M1: expands to x² + 2x - 35 = 0.',
      'M1: factorises to (x + 7)(x - 5) = 0.',
      'A1: x = 5. Reject x = -7 because a length cannot be negative.',
    ],
  },
];
