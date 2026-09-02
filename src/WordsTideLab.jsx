import {
  CrownSimple,
  DotsSixVertical,
  Heart,
  Quotes,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader.jsx";
import "./words-tide-lab.css";

const collectedQuotes = [
  { id: "q-01", text: "这次真的不一样。", speaker: "匿名坑底人" },
  { id: "q-02", text: "两眼一睁就是磕。", speaker: "匿名坑底人" },
  { id: "q-03", text: "正主虚情热演，粉丝假意上头。", speaker: "匿名坑底人" },
  { id: "q-04", text: "卖得专业就打赏，惹怒粉丝就换推。", speaker: "匿名坑底人" },
  { id: "q-05", text: "只是售后，入坑三月都懂。", speaker: "匿名坑底人" },
  { id: "q-06", text: "可以嗑，但不要嗑得那么执着。", speaker: "匿名坑底人" },
  { id: "q-07", text: "每对 CP 在自己 CP 粉眼中都是真情侣。", speaker: "匿名坑底人" },
  { id: "q-08", text: "在别家 CP 粉眼里都一眼假。", speaker: "匿名坑底人" },
  { id: "q-09", text: "路过的狗都得说一句好配。", speaker: "匿名坑底人" },
  { id: "q-10", text: "谁家 CP 这么好磕？哦，原来是我家的。", speaker: "匿名坑底人" },
  { id: "q-11", text: "般配，已经说累了。", speaker: "匿名坑底人" },
  { id: "q-12", text: "剧外也是一种浪漫。", speaker: "匿名坑底人" },
  { id: "q-13", text: "我不入蛊谁入蛊？", speaker: "匿名坑底人" },
  { id: "q-14", text: "滞后磕 CP 就是爽。", speaker: "匿名坑底人" },
  { id: "q-15", text: "早期的糖也是糖。", speaker: "匿名坑底人" },
  { id: "q-16", text: "只是同事？只是姐妹？谈了两年了？", speaker: "匿名坑底人" },
  { id: "q-17", text: "谁嗑谁上头。", speaker: "匿名坑底人" },
  { id: "q-18", text: "现实比剧本会写。", speaker: "匿名坑底人" },
];

const frequencyWords = [
  { name: "我懂", value: 118, x: 8, y: 54, tone: "hot", tilt: -0.6 },
  { name: "救命", value: 122, x: 25, y: 30, tone: "hot", tilt: 0.5 },
  { name: "真的", value: 128, x: 43.5, y: 18, tone: "hot", tilt: 0 },
  { name: "感动", value: 115, x: 58, y: 40, tone: "hot", tilt: -0.4 },
  { name: "支持", value: 110, x: 70.5, y: 53, tone: "hot", tilt: 0.4, slug: "support" },
  { name: "想你", value: 84, x: 79, y: 64.5, tone: "hot", tilt: -0.5 },
  { name: "朋友", value: 73, x: 86.5, y: 74, tone: "hot", tilt: 0.4, labelShift: -8, slug: "friend" },
  { name: "CP", value: 52, x: 94, y: 86, tone: "hot", tilt: -0.4, labelShift: -4, labelLift: 25, slug: "cp" },
  { name: "喜欢", value: 44, x: 101.5, y: 92, tone: "hot", tilt: 0.3, labelShift: -36, labelBelow: true },
];

const flowPointDelay = (x) => (
  `${Math.max(180, Math.round((((x * 10) + 220) / 1280) * 1050 - 12))}ms`
);

const evidenceCardLayouts = [
  { tilt: -1.15, y: 7, cover: "assets/column/rival-lover/overview/01-kqpjbbks9obs.webp" },
  { tilt: .65, y: -4 },
  { tilt: -.8, y: 5, cover: "assets/column/us/overview/01-jxntbv0oxoli.webp" },
  { tilt: .55, y: 0 },
  { tilt: -1.1, y: 8 },
  { tilt: .75, y: -5, cover: "assets/column/designing-love/overview/01-ft0abcnezobo.webp" },
  { tilt: -.55, y: 4 },
  { tilt: .9, y: 0, cover: "assets/column/poisonous-love/overview/01-uksdb8nmjojx.webp" },
  { tilt: -1, y: 7 },
  { tilt: .6, y: -4 },
  { tilt: -.7, y: 4, cover: "assets/column/my-secret-words/overview/01-suakby2xcohn.webp" },
  { tilt: 1.05, y: 0 },
  { tilt: -.6, y: 5 },
  { tilt: .8, y: -4, cover: "assets/column/affair/overview/01-biwwbh7aeo6p.webp" },
  { tilt: -.9, y: 4 },
  { tilt: .5, y: 0 },
  { tilt: -1, y: 6 },
  { tilt: .7, y: -3 },
];

const evidenceOrderStorageKey = "gl-pit:evidence-card-order:v1";
const initialEvidenceOrder = collectedQuotes.map((_, index) => index);

function readEvidenceOrder() {
  if (typeof window === "undefined") return initialEvidenceOrder;

  try {
    const saved = JSON.parse(window.sessionStorage.getItem(evidenceOrderStorageKey));
    return Array.isArray(saved) && saved.length === initialEvidenceOrder.length ? saved : initialEvidenceOrder;
  } catch {
    return initialEvidenceOrder;
  }
}

function EvidenceCard({ item, index = 0, isDragging, dragOffset, onPointerDown, onPointerMove, onPointerUp, onKeyDown }) {
  const layout = evidenceCardLayouts[index];
  const copyLength = Array.from(item.text).length;
  const copySize = copyLength <= 9 ? "short-copy" : copyLength >= 16 ? "long-copy" : "medium-copy";

  return (
    <article
      className={`words-repo-quote-card ${copySize}${layout.cover ? " has-cover" : " no-cover"}${isDragging ? " is-dragging" : ""}`}
      style={{
        "--card-tilt": `${layout.tilt}deg`,
        "--card-y": `${layout.y}px`,
        "--drag-x": `${dragOffset?.x || 0}px`,
        "--drag-y": `${dragOffset?.y || 0}px`,
      }}
      data-evidence-index={index}
      tabIndex={0}
      aria-grabbed={isDragging}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className="words-repo-quote-copy">
        <Quotes aria-hidden="true" weight="fill" />
        <blockquote>{item.text}</blockquote>
        <footer>
          <strong>— {item.speaker}</strong>
        </footer>
      </div>
      {layout.cover ? (
        <div className="words-repo-quote-cover">
          <img src={layout.cover} alt="" loading="lazy" decoding="async" draggable="false" />
        </div>
      ) : null}
      <span className="words-repo-drag-handle" aria-hidden="true"><DotsSixVertical weight="bold" /></span>
      {index % 6 === 0 ? <Heart className="words-repo-card-heart" weight="regular" aria-hidden="true" /> : null}
    </article>
  );
}

function EvidenceCanvas() {
  const [order, setOrder] = useState(readEvidenceOrder);
  const [drag, setDrag] = useState(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(evidenceOrderStorageKey, JSON.stringify(order));
    } catch {
      // Reordering still works when session storage is unavailable.
    }
  }, [order]);

  const beginDrag = (event, cardIndex) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      cardIndex,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setDrag({ cardIndex, x: 0, y: 0 });
  };

  const moveDrag = (event, cardIndex) => {
    const active = dragRef.current;
    if (!active || active.cardIndex !== cardIndex || active.pointerId !== event.pointerId) return;

    setDrag({
      cardIndex,
      x: event.clientX - active.startX,
      y: event.clientY - active.startY,
    });
  };

  const finishDrag = (event) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;

    const moved = Math.hypot(event.clientX - active.startX, event.clientY - active.startY) > 24;
    const cards = Array.from(canvasRef.current?.querySelectorAll(".words-repo-quote-card") || []);
    const source = cards.find((card) => Number(card.dataset.evidenceIndex) === active.cardIndex);
    const sourceRect = source?.getBoundingClientRect();
    let targetIndex = null;
    let nearestDistance = Infinity;

    if (moved && sourceRect) {
      cards.forEach((card) => {
        const candidateIndex = Number(card.dataset.evidenceIndex);
        if (candidateIndex === active.cardIndex) return;
        const rect = card.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        if (distance < nearestDistance && distance < Math.max(rect.width, rect.height) * .72) {
          nearestDistance = distance;
          targetIndex = candidateIndex;
        }
      });
    }

    if (targetIndex !== null) {
      setOrder((current) => {
        const next = [...current];
        const sourcePosition = next.indexOf(active.cardIndex);
        const targetPosition = next.indexOf(targetIndex);
        [next[sourcePosition], next[targetPosition]] = [next[targetPosition], next[sourcePosition]];
        return next;
      });
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDrag(null);
  };

  const moveWithKeyboard = (event, cardIndex) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const width = canvasRef.current?.clientWidth || 1200;
    const columns = width < 520 ? 1 : width < 800 ? 2 : width < 1680 ? 3 : 4;
    const delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : columns;
    setOrder((current) => {
      const sourcePosition = current.indexOf(cardIndex);
      const targetPosition = Math.max(0, Math.min(current.length - 1, sourcePosition + delta));
      if (sourcePosition === targetPosition) return current;
      const next = [...current];
      [next[sourcePosition], next[targetPosition]] = [next[targetPosition], next[sourcePosition]];
      return next;
    });
  };

  return (
    <div className="words-snap-canvas" ref={canvasRef} aria-describedby="words-canvas-instructions">
      {order.map((cardIndex) => (
        <EvidenceCard
          item={collectedQuotes[cardIndex]}
          index={cardIndex}
          isDragging={drag?.cardIndex === cardIndex}
          dragOffset={drag?.cardIndex === cardIndex ? drag : null}
          key={collectedQuotes[cardIndex].id}
          onPointerDown={(event) => beginDrag(event, cardIndex)}
          onPointerMove={(event) => moveDrag(event, cardIndex)}
          onPointerUp={finishDrag}
          onKeyDown={(event) => moveWithKeyboard(event, cardIndex)}
        />
      ))}
    </div>
  );
}

function FrequencyFlow() {
  return (
    <div className="words-frequency-flow" aria-label="词频实时演化图">
      <div className="words-flow-chart">
        <svg className="words-flow-lines" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="flow-pink-gradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#ff5ca8" />
              <stop offset="30%" stopColor="#090909" />
              <stop offset="100%" stopColor="#090909" />
            </linearGradient>
            <filter id="flow-rough" x="-3%" y="-8%" width="106%" height="116%">
              <feTurbulence type="fractalNoise" baseFrequency=".012 .055" numOctaves="1" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale=".7" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <path
            className="flow-line flow-line-hot"
            d="M-220 332 C-95 334 20 325 80 216 C120 144 205 116 250 120 C318 124 370 72 435 72 C492 72 527 150 580 160 C631 170 664 209 705 212 C742 215 760 255 790 258 C824 262 836 295 865 296 C900 298 912 343 940 344 C972 345 990 365 1015 368 C1032 370 1048 372 1060 373"
          />
        </svg>

        {frequencyWords.map((word) => (
          <span
            className="words-flow-guide"
            style={{
              "--guide-x": `${word.x}%`,
              "--guide-y": `${word.y}%`,
              "--point-delay": flowPointDelay(word.x),
            }}
            aria-hidden="true"
            key={`${word.name}-guide`}
          />
        ))}

        {frequencyWords.map((word) => (
          <div
            className={`words-flow-point is-${word.tone}${word.labelBelow ? " is-label-below" : ""}${word.slug ? ` word-${word.slug}` : ""}`}
            style={{
              "--point-x": `${word.x}%`,
              "--point-y": `${word.y}%`,
              "--point-tilt": `${word.tilt}deg`,
              "--point-label-shift": `${word.labelShift || 0}px`,
              "--point-label-lift": `${word.labelLift || 13}px`,
              "--point-delay": flowPointDelay(word.x),
            }}
            key={word.name}
          >
            <span className="words-flow-node" aria-hidden="true" />
            <b>
              <span>{word.name}</span>
              <small aria-label={`，词频 ${word.value}`}>/ {word.value}</small>
            </b>
          </div>
        ))}

        <CrownSimple className="words-flow-icon words-flow-crown" weight="bold" aria-hidden="true" />
        <Heart className="words-flow-icon words-flow-heart-two" weight="regular" aria-hidden="true" />
      </div>
    </div>
  );
}

export function WordsTideLab() {
  return (
    <main className="words-tide-lab">
      <SiteHeader activePath="tide-words" />

      <section className="words-tide-hero" aria-labelledby="words-tide-title">
        <div className="words-tide-intro">
          <span className="words-tide-ghost" aria-hidden="true">WORD TIDE</span>
          <span className="words-tide-eyebrow"><i>*</i> VOICES FROM THE PIT.</span>
          <Heart className="words-tide-note-heart" weight="regular" aria-hidden="true" />
          <Heart className="words-tide-note-heart words-tide-note-heart-bottom" weight="regular" aria-hidden="true" />
          <h1 id="words-tide-title" aria-label="坑底文学">
            <span className="words-tide-title-line is-black">
              {Array.from("坑底").map((character, index) => <i aria-hidden="true" key={`${character}-${index}`}>{character}</i>)}
            </span>
            <span className="words-tide-title-line is-pink">
              {Array.from("文学").map((character, index) => <i aria-hidden="true" key={`${character}-${index}`}>{character}</i>)}
            </span>
          </h1>
          <img className="words-keyword-underline" src="assets/repo-handdrawn-underline-pink.webp" alt="" aria-hidden="true" data-page-critical="true" />
          <span className="words-tide-label">WORDS / FREQUENCY / TIDE</span>
        </div>
        <FrequencyFlow />
      </section>

      <section className="words-archive-bridge" aria-labelledby="words-archive-bridge-title">
        <span className="words-archive-bridge-rule" aria-hidden="true" />
        <div className="words-archive-bridge-copy">
          <strong id="words-archive-bridge-title">原话开始上岸</strong>
          <small>{collectedQuotes.length} VOICES</small>
        </div>
      </section>

      <section className="words-archive" id="original-words" aria-label="原话收藏">
        <p className="words-canvas-instructions" id="words-canvas-instructions">
          拖动卡片到另一张卡片的位置，释放后会吸附并交换位置；卡片不会互相重叠。
        </p>
        <EvidenceCanvas />
      </section>
    </main>
  );
}
