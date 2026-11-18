// Landing-page art for Would You Rather: a real question from the bank (#40), with the
// partner's guess appearing on a loop (pure CSS, turns static with "reduce motion").
import { AnimatedEmoji, Emoji } from "@/components/Emoji";

export default function WyrPreview() {
  return (
    <div className="preview wyr-pv" aria-hidden="true">
      <AnimatedEmoji name="revolving_hearts" code="1f49e" size={86} eager className="sticker s1" />
      <Emoji code="1f914" size={56} eager className="sticker s2" />
      <Emoji code="1fa94" size={48} eager className="sticker s3" />
      <div className="preview-card">
        <div className="pv-top">
          <div className="pv-avatar">R</div>
          <div className="pv-who">
            Riya&apos;s game
            <small>Aarav is guessing · round 3 of 10</small>
          </div>
        </div>
        <div className="pv-progress">
          <span />
        </div>
        <p className="pv-q">Would you rather…</p>
        <div className="choices">
          <div className="choice c0">
            <span>Ghar ka khana forever</span>
            <span className="choice-tags">
              <span className="ctag">Aarav</span>
            </span>
          </div>
          <span className="or-badge">OR</span>
          <div className="choice c1">
            <span>Restaurant food every night</span>
            <span className="choice-tags">
              <span className="ctag guess">Riya? 🤔</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
