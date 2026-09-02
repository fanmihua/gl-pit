import {
  ChatCircleDots,
  CrownSimple,
  DotsSixVertical,
  Heart,
  PushPin,
  Quotes,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  QuoteCommentModal,
  TideCommunitySummary,
  TideGuestbook,
  useTideCommunity,
} from "./TideCommunity.jsx";
import { getTideTargetKey } from "./data/tide-words.js";
import { SiteHeader } from "./SiteHeader.jsx";
import "./words-tide-lab.css";

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

const evidenceOrderStorageKey = "gl-pit:evidence-card-order:v1";
const sortOptions = [
  { id: "latest", label: "最新" },
  { id: "likes", label: "心动" },
  { id: "comments", label: "回声" },
  { id: "manual", label: "我的排序" },
];

function readEvidenceOrder(items) {
  const itemIds = items.map((item) => item.id);
  if (typeof window === "undefined") return itemIds;

  try {
    const saved = JSON.parse(window.sessionStorage.getItem(evidenceOrderStorageKey));
    if (!Array.isArray(saved)) return itemIds;
    const validSavedIds = saved.filter((id) => typeof id === "string" && itemIds.includes(id));
    return [...validSavedIds, ...itemIds.filter((id) => !validSavedIds.includes(id))];
  } catch {
    return itemIds;
  }
}

function EvidenceCard({
  busy,
  configured,
  dragOffset,
  item,
  isDragging,
  liked,
  onKeyDown,
  onLike,
  onOpen,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  stats,
}) {
  const coverPath = item.cover_path;
  const copyLength = Array.from(item.text).length;
  const copySize = copyLength <= 9 ? "short-copy" : copyLength >= 16 ? "long-copy" : "medium-copy";

  return (
    <article
      className={`words-repo-quote-card ${copySize}${coverPath ? " has-cover" : " no-cover"}${item.is_pinned ? " is-pinned" : ""}${isDragging ? " is-dragging" : ""}`}
      style={{
        "--card-tilt": "0deg",
        "--card-y": "0px",
        "--drag-x": `${dragOffset?.x || 0}px`,
        "--drag-y": `${dragOffset?.y || 0}px`,
      }}
      data-evidence-id={item.id}
      data-evidence-pinned={item.is_pinned ? "true" : "false"}
    >
      <button className="words-repo-card-open" type="button" onClick={onOpen} aria-label={`打开评论：${item.text}`} />
      {item.is_pinned ? <span className="words-repo-pinned-label"><PushPin weight="fill" aria-hidden="true" />站主置顶</span> : null}
      <div className="words-repo-quote-copy">
        <Quotes aria-hidden="true" weight="fill" />
        <blockquote>{item.text}</blockquote>
        <footer>
          <strong>— {item.speaker}</strong>
        </footer>
      </div>
      {coverPath ? (
        <div className="words-repo-quote-cover">
          <img src={coverPath} alt="" loading="lazy" decoding="async" draggable="false" />
        </div>
      ) : null}
      <button
        className={`words-repo-card-like${liked ? " is-liked" : ""}`}
        type="button"
        aria-label={liked ? `取消心动，当前 ${stats.likes} 次` : `送出心动，当前 ${stats.likes} 次`}
        aria-pressed={liked}
        disabled={!configured || busy}
        onClick={onLike}
      >
        <Heart weight={liked ? "fill" : "regular"} aria-hidden="true" />
        <span>{stats.likes}</span>
      </button>
      <span className="words-repo-card-meta" aria-label={`${stats.comments} 条评论`}>
        <ChatCircleDots weight="bold" aria-hidden="true" />
        {stats.comments}
      </span>
      {!item.is_pinned ? (
        <button
          className="words-repo-drag-handle"
          type="button"
          aria-label={`移动卡片：${item.text}`}
          aria-grabbed={isDragging}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <DotsSixVertical weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}

function EvidenceCanvas({ community }) {
  const [order, setOrder] = useState(() => readEvidenceOrder(community.quotes));
  const [sortMode, setSortMode] = useState("latest");
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

  useEffect(() => {
    const currentIds = community.quotes.map((item) => item.id);
    setOrder((current) => [
      ...currentIds.filter((id) => !current.includes(id)),
      ...current.filter((id) => currentIds.includes(id)),
    ]);
  }, [community.quotes]);

  const displayOrder = useMemo(() => {
    const pinnedIds = community.quotes.filter((quote) => quote.is_pinned).map((quote) => quote.id);
    const regularQuotes = community.quotes.filter((quote) => !quote.is_pinned);
    if (sortMode === "manual") {
      return [...pinnedIds, ...order.filter((id) => regularQuotes.some((quote) => quote.id === id))];
    }

    const sorted = [...regularQuotes].sort((left, right) => {
      if (sortMode === "likes") {
        const difference = community.getStats("quote", right.id).likes - community.getStats("quote", left.id).likes;
        if (difference) return difference;
      }
      if (sortMode === "comments") {
        const difference = community.getStats("quote", right.id).comments - community.getStats("quote", left.id).comments;
        if (difference) return difference;
      }
      return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
    });
    return [...pinnedIds, ...sorted.map((quote) => quote.id)];
  }, [community, order, sortMode]);

  const beginDrag = (event, cardId) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    if (sortMode !== "manual") {
      setOrder(displayOrder);
      setSortMode("manual");
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      cardId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setDrag({ cardId, x: 0, y: 0 });
  };

  const moveDrag = (event, cardId) => {
    const active = dragRef.current;
    if (!active || active.cardId !== cardId || active.pointerId !== event.pointerId) return;

    setDrag({
      cardId,
      x: event.clientX - active.startX,
      y: event.clientY - active.startY,
    });
  };

  const finishDrag = (event) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;

    const moved = Math.hypot(event.clientX - active.startX, event.clientY - active.startY) > 24;
    const cards = Array.from(canvasRef.current?.querySelectorAll(".words-repo-quote-card") || []);
    const source = cards.find((card) => card.dataset.evidenceId === active.cardId);
    const sourceRect = source?.getBoundingClientRect();
    let targetId = null;
    let nearestDistance = Infinity;

    if (moved && sourceRect) {
      cards.forEach((card) => {
        const candidateId = card.dataset.evidenceId;
        if (candidateId === active.cardId || card.dataset.evidencePinned === "true") return;
        const rect = card.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        if (distance < nearestDistance && distance < Math.max(rect.width, rect.height) * .72) {
          nearestDistance = distance;
          targetId = candidateId;
        }
      });
    }

    if (targetId !== null) {
      setOrder((current) => {
        const next = [...current];
        const sourcePosition = next.indexOf(active.cardId);
        const targetPosition = next.indexOf(targetId);
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

  const moveWithKeyboard = (event, cardId) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const width = canvasRef.current?.clientWidth || 1200;
    const columns = width < 520 ? 1 : width < 800 ? 2 : width < 1680 ? 3 : 4;
    const delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : columns;
    setOrder((current) => {
      const next = sortMode === "manual" ? [...current] : [...displayOrder];
      const sourcePosition = next.indexOf(cardId);
      const firstMovablePosition = community.quotes.some((quote) => quote.is_pinned) ? 1 : 0;
      const targetPosition = Math.max(firstMovablePosition, Math.min(next.length - 1, sourcePosition + delta));
      if (sourcePosition === targetPosition) return current;
      [next[sourcePosition], next[targetPosition]] = [next[targetPosition], next[sourcePosition]];
      return next;
    });
    setSortMode("manual");
  };

  return (
    <>
      <header className="words-board-toolbar">
        <div>
          <span>OPEN VOICE BOARD</span>
          <p>按你想看的方式排；拖动任意非置顶卡片，就会切到自己的排序。</p>
        </div>
        <div className="words-board-sorts" role="group" aria-label="原话排序">
          {sortOptions.map((option) => (
            <button
              className={sortMode === option.id ? "is-active" : ""}
              type="button"
              aria-pressed={sortMode === option.id}
              onClick={() => setSortMode(option.id)}
              key={option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>
      <div className="words-snap-canvas" ref={canvasRef} aria-describedby="words-canvas-instructions">
      {displayOrder.map((cardId) => {
        const itemIndex = community.quotes.findIndex((quote) => quote.id === cardId);
        const item = community.quotes[itemIndex];
        if (!item) return null;
        const targetKey = getTideTargetKey("quote", item.id);
        return (
          <EvidenceCard
            busy={community.busyTargets.has(targetKey)}
            configured={community.configured}
            item={item}
            isDragging={drag?.cardId === cardId}
            dragOffset={drag?.cardId === cardId ? drag : null}
            key={item.id}
            liked={community.isLiked("quote", item.id)}
            stats={community.getStats("quote", item.id)}
            onOpen={() => community.openQuote(item)}
            onLike={() => community.toggleReaction("quote", item.id)}
            onPointerDown={(event) => beginDrag(event, cardId)}
            onPointerMove={(event) => moveDrag(event, cardId)}
            onPointerUp={finishDrag}
            onKeyDown={(event) => moveWithKeyboard(event, cardId)}
          />
        );
      })}
      </div>
    </>
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
  const community = useTideCommunity();

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

      <TideCommunitySummary community={community} />

      <section className="words-archive" id="original-words" aria-label="原话收藏">
        <p className="words-canvas-instructions" id="words-canvas-instructions">
          点卡片看评论；按住右下角六点把手可交换位置，卡片不会互相重叠。
        </p>
        <EvidenceCanvas community={community} />
      </section>
      <TideGuestbook community={community} />
      <QuoteCommentModal community={community} />
    </main>
  );
}
