/**
 * Authored move bank: Combined Science, Forces and Cell biology.
 *
 * Forces is here because it is the worked example in section 6.1 of the spec
 * ("your Physics mock is in 12 days and you have not touched Forces yet").
 * Topic ids are shared with the triple science subjects where the content is
 * the same, so a triple student and a combined student can both be served.
 */

import type { Move } from '../../engine/types';

const forces = 'combined-science.forces';
const cells = 'combined-science.cell-biology';

export const SCIENCE_MOVES: Move[] = [
  {
    id: 'sci.for.01',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'recall',
    seconds: 60,
    prompt: 'Define a scalar and a vector, and give two examples of each.',
    modelAnswer:
      'A scalar has magnitude only: speed, mass, energy, distance. A vector has magnitude and direction: velocity, force, weight, acceleration, momentum.',
  },
  {
    id: 'sci.for.02',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'mcq',
    seconds: 45,
    prompt: 'A 6 kg bag is lifted. What is its weight on Earth (g = 9.8 N/kg)?',
    options: [
      { text: '58.8 N', correct: true },
      { text: '6 N', misconception: 'Mass in kilograms is not weight. Weight = mass × gravitational field strength.' },
      { text: '0.61 N', misconception: 'Mass was divided by g instead of multiplied.' },
      { text: '58.8 kg', misconception: 'Right number, wrong unit. Weight is a force, measured in newtons.' },
    ],
  },
  {
    id: 'sci.for.03',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'worked',
    seconds: 150,
    prompt:
      'A car of mass 1200 kg accelerates from rest to 24 m/s in 8 s. Find the resultant force. Work each step on paper first.',
    steps: [
      { prompt: 'Find the acceleration.', reveal: 'a = Δv / t = 24 / 8 = 3 m/s².' },
      { prompt: 'Which equation links force, mass and acceleration?', reveal: 'F = m × a (Newton\'s second law).' },
      { prompt: 'Calculate the force with units.', reveal: 'F = 1200 × 3 = 3600 N.' },
    ],
  },
  {
    id: 'sci.for.04',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'recall',
    seconds: 60,
    prompt: 'State Newton\'s three laws in your own words.',
    modelAnswer:
      'First: an object stays still or keeps moving at constant velocity unless a resultant force acts. Second: resultant force = mass × acceleration. Third: when two objects interact, the forces on each are equal in size and opposite in direction.',
  },
  {
    id: 'sci.for.05',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'exam',
    seconds: 180,
    marks: 4,
    prompt:
      'Explain how the stopping distance of a car changes on a wet road, and why. (4 marks)',
    markScheme: [
      'Stopping distance = thinking distance + braking distance.',
      'Thinking distance is unchanged by the road surface; it depends on reaction time.',
      'Braking distance increases because there is less friction between tyres and road.',
      'So the total stopping distance increases, and a larger gap is needed.',
    ],
  },
  {
    id: 'sci.for.06',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'mcq',
    seconds: 60,
    prompt: 'A skydiver reaches terminal velocity. What is true at that moment?',
    options: [
      { text: 'Weight and air resistance are equal, so the resultant force is zero', correct: true },
      { text: 'There are no forces acting on the skydiver', misconception: 'Balanced forces are not the same as no forces.' },
      { text: 'The skydiver stops moving', misconception: 'Zero resultant force means constant velocity, not zero velocity.' },
      { text: 'Air resistance is greater than weight', misconception: 'That would slow the skydiver down, not hold a steady speed.' },
    ],
  },
  {
    id: 'sci.for.07',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'explain',
    seconds: 120,
    prompt: 'Explain to a Year 7 why a passenger lurches forward when a bus brakes.',
    modelAnswer:
      'The bus slows because the brakes push backwards on it, but nothing pushes backwards on the passenger straight away. Their body keeps moving at the old speed until the seat belt or the seat in front pushes on them. That is Newton\'s first law: things keep doing what they were doing until a force changes it.',
  },
  {
    id: 'sci.for.08',
    topicId: forces,
    specRef: 'Combined Science · Physics · Forces',
    type: 'worked',
    seconds: 150,
    prompt: 'A spring with spring constant 40 N/m is extended by 0.15 m. Find the force, then the energy stored.',
    steps: [
      { prompt: 'Which equation gives the force?', reveal: 'F = k × e (Hooke\'s law), valid up to the limit of proportionality.' },
      { prompt: 'Calculate the force.', reveal: 'F = 40 × 0.15 = 6 N.' },
      { prompt: 'Now the energy stored.', reveal: 'E = 0.5 × k × e² = 0.5 × 40 × 0.0225 = 0.45 J.' },
    ],
  },
  {
    id: 'sci.cel.01',
    topicId: cells,
    specRef: 'Combined Science · Biology · Cell biology',
    type: 'match',
    seconds: 120,
    prompt: 'Match each organelle to its job. Cover the right column first.',
    pairs: [
      { left: 'Nucleus', right: 'Contains DNA and controls the cell' },
      { left: 'Mitochondria', right: 'Site of aerobic respiration' },
      { left: 'Ribosomes', right: 'Where proteins are made' },
      { left: 'Cell membrane', right: 'Controls what enters and leaves' },
      { left: 'Chloroplast', right: 'Absorbs light for photosynthesis' },
    ],
  },
  {
    id: 'sci.cel.02',
    topicId: cells,
    specRef: 'Combined Science · Biology · Cell biology',
    type: 'recall',
    seconds: 60,
    prompt: 'Give three differences between a prokaryotic and a eukaryotic cell.',
    modelAnswer:
      'Prokaryotic cells are much smaller, have no nucleus (DNA is a single loop plus plasmids) and have no membrane-bound organelles such as mitochondria. Eukaryotic cells have a nucleus, membrane-bound organelles and are typically 10 to 100 times larger.',
  },
  {
    id: 'sci.cel.03',
    topicId: cells,
    specRef: 'Combined Science · Biology · Cell biology',
    type: 'worked',
    seconds: 150,
    prompt: 'A cell is 0.05 mm across and appears 10 mm across in an image. Find the magnification.',
    steps: [
      { prompt: 'Write the equation.', reveal: 'magnification = size of image / size of real object.' },
      { prompt: 'Put both lengths in the same unit.', reveal: 'Image 10 mm, object 0.05 mm. Same unit already, so no conversion needed.' },
      { prompt: 'Calculate.', reveal: '10 / 0.05 = ×200. Magnification has no units.' },
    ],
  },
  {
    id: 'sci.cel.04',
    topicId: cells,
    specRef: 'Combined Science · Biology · Cell biology',
    type: 'mcq',
    seconds: 60,
    prompt: 'Which statement about osmosis is correct?',
    options: [
      {
        text: 'Water moves through a partially permeable membrane from a dilute to a more concentrated solution',
        correct: true,
      },
      {
        text: 'Solute moves from high to low concentration',
        misconception: 'That is diffusion of the solute. Osmosis is about the movement of water.',
      },
      {
        text: 'Water moves from concentrated to dilute',
        misconception: 'Reversed. Water moves down its own concentration gradient, so towards the concentrated solution.',
      },
      {
        text: 'Osmosis requires energy from respiration',
        misconception: 'That is active transport. Osmosis and diffusion are passive.',
      },
    ],
  },
  {
    id: 'sci.cel.05',
    topicId: cells,
    specRef: 'Combined Science · Biology · Cell biology',
    type: 'explain',
    seconds: 120,
    prompt: 'Explain to a Year 7 what stem cells are and why doctors are interested in them.',
    modelAnswer:
      'Stem cells are unspecialised cells that can turn into other kinds of cell. In an embryo they can become almost any cell; in adult bone marrow they become blood cells. Doctors are interested because they could replace cells that have been damaged, for example in diabetes or paralysis, though there are ethical arguments about using embryos.',
  },
  {
    id: 'sci.cel.06',
    topicId: cells,
    specRef: 'Combined Science · Biology · Cell biology',
    type: 'exam',
    seconds: 180,
    marks: 3,
    prompt:
      'Explain why root hair cells have a large surface area and many mitochondria. (3 marks)',
    markScheme: [
      'Large surface area increases the rate of absorption of water and mineral ions.',
      'Mineral ions are absorbed by active transport, against the concentration gradient.',
      'Active transport requires energy from respiration, which is released by the mitochondria.',
    ],
  },
];
