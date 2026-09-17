/**
 * One move inside a sprint.
 *
 * Every move type follows the same contract: attempt it on paper first, then
 * reveal, then say honestly how it went. Self-marking is the point. The app
 * cannot tell whether a student really recalled something, and pretending
 * otherwise would make the confidence scores worthless.
 */

import { useEffect, useState } from 'react';

import type { Move, MoveOutcome } from '../engine/types';

const TYPE_LABEL: Record<Move['type'], string> = {
  recall: 'Quick recall',
  mcq: 'Diagnostic',
  explain: 'Explain it to a Year 7',
  exam: 'Exam style',
  match: 'Matching',
  worked: 'Worked problem',
  brainDump: 'Brain dump',
};

export function MoveCard({
  move,
  index,
  total,
  onAnswer,
}: {
  move: Move;
  index: number;
  total: number;
  onAnswer: (outcome: MoveOutcome) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  // A new move always starts hidden, whatever the last one was doing.
  useEffect(() => {
    setRevealed(false);
    setChoice(null);
    setStep(0);
  }, [move.id]);

  const chosen = move.type === 'mcq' && choice !== null ? move.options[choice] : null;

  return (
    <article className="move">
      <div className="row-between">
        <p className="eyebrow">{TYPE_LABEL[move.type]}</p>
        <p className="eyebrow">
          {index + 1} of {total}
        </p>
      </div>

      <h2>{move.prompt}</h2>
      {move.type === 'exam' && move.marks > 0 ? <p className="dim">{move.marks} marks</p> : null}

      {move.type === 'mcq' ? (
        <div className="options">
          {move.options.map((option, optionIndex) => {
            const picked = choice === optionIndex;
            const answered = choice !== null;
            return (
              <button
                key={option.text}
                type="button"
                className={`option ${picked ? 'option--picked' : ''} ${
                  answered && option.correct ? 'option--correct' : ''
                }`}
                disabled={answered}
                onClick={() => setChoice(optionIndex)}
              >
                <span>{option.text}</span>
                {answered && picked && option.misconception ? (
                  <span className="why">{option.misconception}</span>
                ) : null}
                {answered && option.correct && !picked ? (
                  <span className="why">This was the answer.</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {move.type === 'match' ? (
        <div className="pairs">
          {move.pairs.map((pair) => (
            <div className="pair" key={pair.left}>
              <span>{pair.left}</span>
              <span>{revealed ? pair.right : '?'}</span>
            </div>
          ))}
        </div>
      ) : null}

      {move.type === 'worked' ? (
        <div className="steps">
          {move.steps.slice(0, step + 1).map((item, stepIndex) => (
            <div className="stack-sm" key={item.prompt}>
              <p className="eyebrow">Step {stepIndex + 1}</p>
              <p>{item.prompt}</p>
              {stepIndex < step || revealed ? <p className="reveal">{item.reveal}</p> : null}
            </div>
          ))}
          {step < move.steps.length - 1 ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setStep(step + 1);
                setRevealed(false);
              }}
            >
              Show this step, then the next
            </button>
          ) : null}
        </div>
      ) : null}

      {move.type === 'brainDump' && revealed ? (
        <div className="list">
          <p className="eyebrow">A good dump would include</p>
          {move.checklist.map((item) => (
            <p key={item}>· {item}</p>
          ))}
        </div>
      ) : null}

      {move.type === 'exam' && revealed ? (
        <div className="list">
          <p className="eyebrow">Mark scheme</p>
          {move.markScheme.map((item) => (
            <p key={item}>· {item}</p>
          ))}
        </div>
      ) : null}

      {(move.type === 'recall' || move.type === 'explain') && revealed ? (
        <div className="list">
          <p className="eyebrow">Model answer</p>
          <p>{move.modelAnswer}</p>
        </div>
      ) : null}

      {move.type !== 'mcq' && !revealed ? (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            if (move.type === 'worked') setStep(move.steps.length - 1);
            setRevealed(true);
          }}
        >
          {move.type === 'worked' ? 'Reveal the working' : 'I have attempted it. Reveal.'}
        </button>
      ) : null}

      {chosen ? (
        <RateRow
          labels={['Got it', 'Lucky guess', 'Wrong']}
          onPick={onAnswer}
          suggested={chosen.correct ? 'solid' : 'missed'}
        />
      ) : null}

      {move.type !== 'mcq' && revealed ? (
        <RateRow labels={['Solid', 'Shaky', 'Missed it']} onPick={onAnswer} />
      ) : null}
    </article>
  );
}

/**
 * Honest self-marking, three buttons. On a multiple choice move the app
 * already knows whether the answer was right, so the middle option exists only
 * for a student who admits they guessed.
 */
function RateRow({
  labels,
  onPick,
  suggested,
}: {
  labels: [string, string, string];
  onPick: (outcome: MoveOutcome) => void;
  suggested?: MoveOutcome;
}) {
  const outcomes: MoveOutcome[] = ['solid', 'shaky', 'missed'];
  return (
    <div className="rate">
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          className={suggested === outcomes[index] ? 'suggested' : ''}
          onClick={() => onPick(outcomes[index])}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
