/**
 * The Lock In domain model.
 *
 * Shapes here are deliberately flat and serialisable: the MVP keeps everything
 * on the device, and the same records map onto Postgres rows when the backend
 * described in section 10 of the spec arrives.
 */

export type ExamBoard = 'AQA' | 'Edexcel' | 'OCR' | 'WJEC/Eduqas' | 'CCEA';

/** Maths and the sciences are tiered; most subjects are not. */
export type Tier = 'Foundation' | 'Higher';

/** Depth 1 subjects have authored move banks. Depth 2 subjects get frameworks. */
export type Depth = 1 | 2;

export type YearGroup = 10 | 11;

/* Content ---------------------------------------------------------------- */

export type MoveType =
  | 'recall' // short answer, self-marked against a model answer
  | 'mcq' // multiple choice, distractors built from common misconceptions
  | 'explain' // explain it to a Year 7
  | 'exam' // exam-style question with a mark scheme reveal
  | 'match' // quote or key term matching
  | 'worked' // structured worked problem, one step at a time
  | 'brainDump'; // depth 2 framework: write everything, then self-correct

interface MoveBase {
  id: string;
  topicId: string;
  /** Specification reference, e.g. "AQA 8300 A18". Every move carries one. */
  specRef: string;
  type: MoveType;
  prompt: string;
  /** Roughly how long this move takes, in seconds. Used to size a sprint. */
  seconds: number;
}

export interface RecallMove extends MoveBase {
  type: 'recall';
  modelAnswer: string;
}

export interface McqOption {
  text: string;
  correct?: boolean;
  /** Why a student picks this wrong answer. Shown after they answer. */
  misconception?: string;
}

export interface McqMove extends MoveBase {
  type: 'mcq';
  options: McqOption[];
}

export interface ExplainMove extends MoveBase {
  type: 'explain';
  modelAnswer: string;
}

export interface ExamMove extends MoveBase {
  type: 'exam';
  marks: number;
  markScheme: string[];
}

export interface MatchMove extends MoveBase {
  type: 'match';
  pairs: Array<{ left: string; right: string }>;
}

export interface WorkedMove extends MoveBase {
  type: 'worked';
  steps: Array<{ prompt: string; reveal: string }>;
}

export interface BrainDumpMove extends MoveBase {
  type: 'brainDump';
  /** Things a good brain dump would mention, revealed after the attempt. */
  checklist: string[];
}

export type Move =
  | RecallMove
  | McqMove
  | ExplainMove
  | ExamMove
  | MatchMove
  | WorkedMove
  | BrainDumpMove;

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  specRef: string;
  /** Present when a topic only applies to one tier. */
  tier?: Tier;
  /** Present for English Literature topics tied to a set text. */
  setTextId?: string;
}

export interface SetText {
  id: string;
  name: string;
}

export interface SubjectDefinition {
  id: string;
  name: string;
  depth: Depth;
  boards: ExamBoard[];
  tiered?: boolean;
  setTexts?: SetText[];
}

/* The student ------------------------------------------------------------ */

export interface StudentSubject {
  subjectId: string;
  board: ExamBoard;
  tier?: Tier;
  setTextIds?: string[];
}

export type KeyDateKind = 'mock' | 'exam';

export interface KeyDate {
  subjectId: string;
  kind: KeyDateKind;
  /** YYYY-MM-DD, local. */
  date: string;
}

/**
 * How well the student knows a topic, 0 (untouched) to 5 (solid), plus the
 * spacing schedule that decides when it should come back.
 */
export interface TopicState {
  topicId: string;
  confidence: number;
  seenCount: number;
  /** Epoch millis of the last sprint that covered this topic. */
  lastSeenAt: number | null;
  /** Epoch millis from which this topic is worth revisiting. */
  dueAt: number | null;
  /** Move ids answered, newest last, so a sprint can avoid repeats. */
  seenMoveIds: string[];
}

/* Sprints ---------------------------------------------------------------- */

export type MoveOutcome = 'solid' | 'shaky' | 'missed';

export interface MoveResult {
  moveId: string;
  type: MoveType;
  outcome: MoveOutcome;
  answeredAt: number;
}

export type SprintStatus = 'running' | 'completed' | 'abandoned';

export interface Sprint {
  id: string;
  subjectId: string;
  topicId: string;
  plannedMinutes: number;
  startedAt: number;
  endedAt: number | null;
  status: SprintStatus;
  moveIds: string[];
  results: MoveResult[];
}

/** A candidate the engine offers on the home screen. */
export interface SprintSuggestion {
  subjectId: string;
  topicId: string;
  minutes: number;
  /** The one-line "why this" shown under the card. */
  reason: string;
  score: number;
}

export interface StudentProfile {
  yearGroup: YearGroup;
  subjects: StudentSubject[];
  keyDates: KeyDate[];
  /** HH:MM, the single daily nudge. */
  notificationTime: string | null;
  defaultMinutes: number;
  /** Sprints per week the student is aiming for. */
  weeklyTarget: number;
  /** Section 11: parent visibility is opt-in, by the student. */
  parentSummaryOptIn: boolean;
  parentEmail: string | null;
}
