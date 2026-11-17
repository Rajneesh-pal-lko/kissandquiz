// Looping demo of the partner's view (pure CSS animation, no JS).
// Uses a real question from the bank (#29) so the preview matches the game.
import { AnimatedEmoji, Emoji } from "./Emoji";

const OPTIONS = ["Biryani", "Rajma / chole chawal", "Dal chawal", "Maggi"];
const TARGET = 3;

export default function QuizPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <AnimatedEmoji name="heart_with_arrow" code="1f498" size={92} eager className="sticker s1" />
      <Emoji code="1f970" size={58} eager className="sticker s2" />
      <Emoji code="1f525" size={50} eager className="sticker s3" />
      <div className="preview-card">
        <div className="pv-top">
          <div className="pv-avatar">R</div>
          <div className="pv-who">
            Riya&apos;s quiz
            <small>Aarav is guessing · 4 of 10</small>
          </div>
        </div>
        <div className="pv-progress">
          <span />
        </div>
        <p className="pv-q">What&apos;s Riya&apos;s favourite comfort meal?</p>
        <ul className="pv-opts">
          {OPTIONS.map((o, i) => (
            <li key={o} className={i === TARGET ? "pv-opt target" : "pv-opt"}>
              <span className="key">{"ABCD"[i]}</span>
              {o}
              {i === TARGET && (
                <>
                  <span className="pv-tag">Riya&apos;s answer ✓</span>
                  <span className="pv-tap" />
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="pv-toast">
          <Emoji code="1f389" size={26} eager />
          Aarav got it! <b>+1</b>
        </div>
      </div>
    </div>
  );
}
