/**
 * Authored move bank: English Literature, Macbeth.
 *
 * The second pilot from section 15. Macbeth is first by entry volume, so it is
 * the text the content pipeline is costed against.
 */

import type { Move } from '../../engine/types';

const quotesTopic = 'english-literature.macbeth-key-quotations';
const themesTopic = 'english-literature.macbeth-ambition-and-guilt';

export const ENGLISH_LITERATURE_MOVES: Move[] = [
  {
    id: 'lit.mac.01',
    topicId: quotesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth',
    type: 'match',
    seconds: 150,
    prompt: 'Match each quotation to the character who says it. Cover the right column first.',
    pairs: [
      { left: '"Fair is foul, and foul is fair"', right: 'The Witches' },
      { left: '"unsex me here"', right: 'Lady Macbeth' },
      { left: '"Is this a dagger which I see before me"', right: 'Macbeth' },
      { left: '"Out, damned spot!"', right: 'Lady Macbeth' },
      { left: '"brave Macbeth (well he deserves that name)"', right: 'The Captain' },
    ],
  },
  {
    id: 'lit.mac.02',
    topicId: quotesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth',
    type: 'recall',
    seconds: 90,
    prompt:
      'Write down, word for word, the quotation where Macbeth admits his ambition is the only thing driving him on. Then write the act and scene.',
    modelAnswer:
      '"I have no spur / To prick the sides of my intent, but only / Vaulting ambition, which o\'erleaps itself" (Act 1, Scene 7). Macbeth admits there is no justification beyond ambition, and the image of over-leaping predicts his fall.',
  },
  {
    id: 'lit.mac.03',
    topicId: quotesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth',
    type: 'explain',
    seconds: 120,
    prompt:
      'Explain to a Year 7 what Lady Macbeth means by "look like th\' innocent flower, But be the serpent under\'t".',
    modelAnswer:
      'She is telling Macbeth to act harmless while planning murder. The flower and serpent image sets appearance against reality, which runs through the whole play, and the serpent would remind a Jacobean audience of the Garden of Eden and the Fall.',
  },
  {
    id: 'lit.mac.04',
    topicId: quotesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth',
    type: 'mcq',
    seconds: 45,
    prompt: 'Which quotation best shows Macbeth has passed the point of return?',
    options: [
      {
        text: '"I am in blood / Stepped in so far that, should I wade no more, / Returning were as tedious as go o\'er"',
        correct: true,
      },
      {
        text: '"Is this a dagger which I see before me"',
        misconception: 'This is before the murder, when he is still hesitating.',
      },
      {
        text: '"Fair is foul, and foul is fair"',
        misconception: 'The Witches say this in Act 1 Scene 1, before Macbeth has appeared.',
      },
      {
        text: '"Life\'s but a walking shadow"',
        misconception: 'This shows despair after Lady Macbeth\'s death, not the turn to no return.',
      },
    ],
  },
  {
    id: 'lit.mac.05',
    topicId: themesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth · Themes',
    type: 'recall',
    seconds: 120,
    prompt:
      'Without looking: three quotations that track Lady Macbeth from control to collapse, in order.',
    modelAnswer:
      '"unsex me here" (Act 1, seizing power), "A little water clears us of this deed" (Act 2, dismissing guilt), "Out, damned spot!" (Act 5, undone by it). The arc inverts Macbeth\'s: as he hardens, she breaks.',
  },
  {
    id: 'lit.mac.06',
    topicId: themesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth · Themes',
    type: 'exam',
    seconds: 240,
    marks: 30,
    prompt:
      'Plan, do not write: "Starting with this extract, explore how Shakespeare presents ambition as destructive." Five bullet points in five minutes. (30 marks)',
    markScheme: [
      'A clear thesis about ambition, not a list of events.',
      'Extract analysed closely, then the rest of the play used to develop the argument.',
      'Method named and its effect explained, for example soliloquy, imagery, dramatic irony.',
      'Context used to support the reading, for example James I, the Gunpowder Plot, the divine right of kings.',
      'A sense of the whole play: how the ending answers the opening.',
    ],
  },
  {
    id: 'lit.mac.07',
    topicId: themesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth · Context',
    type: 'explain',
    seconds: 120,
    prompt:
      'Why would a Jacobean audience find the murder of Duncan more shocking than a modern one does?',
    modelAnswer:
      'They believed in the divine right of kings, so killing an anointed king was an attack on God\'s order, not just a crime. James I had survived the Gunpowder Plot in 1605 and traced his line to Banquo, so regicide and witchcraft were live fears, not stage fiction.',
  },
  {
    id: 'lit.mac.08',
    topicId: themesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth · Themes',
    type: 'mcq',
    seconds: 60,
    prompt:
      'Which is the strongest opening sentence for an essay on guilt in Macbeth?',
    options: [
      {
        text: 'Shakespeare presents guilt as a force that punishes the Macbeths more completely than any external justice does.',
        correct: true,
      },
      {
        text: 'In this essay I am going to write about guilt in Macbeth and how it is shown.',
        misconception: 'Announcing the essay wastes the first sentence. Lead with an argument.',
      },
      {
        text: 'Macbeth is a play written by William Shakespeare in about 1606.',
        misconception: 'Context belongs in the argument, not as a biography opener.',
      },
      {
        text: 'Guilt is a very important theme in Macbeth and is shown many times.',
        misconception: '"Important theme shown many times" says nothing an examiner can credit.',
      },
    ],
  },
  {
    id: 'lit.mac.09',
    topicId: themesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth · Methods',
    type: 'recall',
    seconds: 90,
    prompt:
      'Name three methods Shakespeare uses to show Macbeth\'s state of mind, with one example each.',
    modelAnswer:
      'Soliloquy ("Is this a dagger", showing hallucination and doubt). Blood imagery ("Will all great Neptune\'s ocean wash this blood clean", showing guilt that cannot be cleaned). Dramatic irony (Duncan calls Macbeth\'s castle pleasant as the audience knows what waits inside).',
  },
  {
    id: 'lit.mac.10',
    topicId: themesTopic,
    specRef: 'English Literature · Shakespeare · Macbeth · Themes',
    type: 'explain',
    seconds: 120,
    prompt:
      'Explain how the line "Life\'s but a walking shadow, a poor player" fits the end of Macbeth\'s arc.',
    modelAnswer:
      'Told of his wife\'s death, Macbeth reduces life to a bad actor strutting through a short part. The theatre metaphor is bleak and self-aware: the man who grasped a crown now finds all of it meaningless. It completes the fall from "brave Macbeth" to a man who feels nothing.',
  },
];
