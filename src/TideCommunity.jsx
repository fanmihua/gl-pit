import {
  ChatCircleDots,
  Eye,
  Heart,
  PaperPlaneTilt,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  isCommunityConfigured,
  loadCommunityReactionState,
  loadCommunityStats,
  loadPublishedCommunityQuotes,
  loadPublishedComments,
  recordCommunityView,
  submitCommunityComment,
  toggleCommunityReaction,
} from "./community-api.js";
import { collectedQuotes, getTideTargetKey, tideWordsPageTarget } from "./data/tide-words.js";
import "./tide-community.css";

const emptyStats = Object.freeze({ comments: 0, likes: 0, uniqueVisitors: 0, views: 0 });
const nicknameStorageKey = "glfans:community-nickname:v1";

function readSavedNickname() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(nicknameStorageKey) || "";
  } catch {
    return "";
  }
}

function saveNickname(nickname) {
  try {
    window.localStorage.setItem(nicknameStorageKey, nickname);
  } catch {
    // The form still works when local storage is unavailable.
  }
}

function formatCommunityError(error) {
  const message = error?.message || "互动服务暂时没有回应，请稍后再试。";
  if (message.includes("rate_limit")) return "留言有点密集，先歇十分钟再来。";
  if (message.includes("comment_body")) return "留言需要 2—400 个字。";
  if (message.includes("nickname")) return "昵称请控制在 24 个字以内。";
  if (message.includes("JWT") || message.includes("session")) return "匿名身份没有接通，请刷新后再试。";
  return message;
}

function mergeTargetStats(current, targetType, targetId, nextStats) {
  const key = getTideTargetKey(targetType, targetId);
  return {
    ...current,
    [key]: {
      ...(current[key] ?? emptyStats),
      ...nextStats,
    },
  };
}

export function useTideCommunity() {
  const [statsByTarget, setStatsByTarget] = useState({});
  const [quotes, setQuotes] = useState(collectedQuotes);
  const [likedTargets, setLikedTargets] = useState(() => new Set());
  const [busyTargets, setBusyTargets] = useState(() => new Set());
  const [connectionState, setConnectionState] = useState(isCommunityConfigured ? "connecting" : "unconfigured");
  const [activeQuote, setActiveQuote] = useState(null);
  const [quoteComments, setQuoteComments] = useState([]);
  const [quoteCommentsState, setQuoteCommentsState] = useState("idle");
  const [guestbookComments, setGuestbookComments] = useState([]);
  const [guestbookState, setGuestbookState] = useState(isCommunityConfigured ? "loading" : "idle");

  const getStats = useCallback((targetType, targetId) => (
    statsByTarget[getTideTargetKey(targetType, targetId)] ?? emptyStats
  ), [statsByTarget]);

  const refreshStats = useCallback(async () => {
    if (!isCommunityConfigured) return;
    const nextStats = await loadCommunityStats();
    setStatsByTarget(nextStats);
  }, []);

  const closeQuote = useCallback(() => setActiveQuote(null), []);

  useEffect(() => {
    if (!isCommunityConfigured) return undefined;
    let alive = true;

    Promise.all([
      loadCommunityStats(),
      loadCommunityReactionState(),
      loadPublishedComments(tideWordsPageTarget.targetType, tideWordsPageTarget.targetId, 12),
      loadPublishedCommunityQuotes(),
    ])
      .then(([nextStats, nextLikedTargets, nextGuestbookComments, nextQuotes]) => {
        if (!alive) return;
        setStatsByTarget(nextStats);
        setLikedTargets(new Set(nextLikedTargets));
        setGuestbookComments(nextGuestbookComments);
        setQuotes(nextQuotes);
        setGuestbookState("ready");
        setConnectionState("ready");
      })
      .catch(() => {
        if (!alive) return;
        setGuestbookState("error");
        setConnectionState("error");
      });

    recordCommunityView(tideWordsPageTarget.targetType, tideWordsPageTarget.targetId)
      .then((row) => {
        if (!alive || !row) return;
        setStatsByTarget((current) => mergeTargetStats(
          current,
          tideWordsPageTarget.targetType,
          tideWordsPageTarget.targetId,
          {
            uniqueVisitors: Number(row.unique_visitor_count ?? 0),
            views: Number(row.view_count ?? 0),
          },
        ));
      })
      .catch(() => {
        // Reading the page remains available when analytics cannot be recorded.
      });

    return () => {
      alive = false;
    };
  }, []);

  const toggleReaction = useCallback(async (targetType, targetId) => {
    if (!isCommunityConfigured) return;
    const key = getTideTargetKey(targetType, targetId);
    if (busyTargets.has(key)) return;

    setBusyTargets((current) => new Set(current).add(key));
    try {
      const result = await toggleCommunityReaction(targetType, targetId);
      setLikedTargets((current) => {
        const next = new Set(current);
        if (result.liked) next.add(key);
        else next.delete(key);
        return next;
      });
      setStatsByTarget((current) => mergeTargetStats(current, targetType, targetId, { likes: result.likes }));
    } catch {
      setConnectionState("error");
    } finally {
      setBusyTargets((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }, [busyTargets]);

  const openQuote = useCallback(async (quote) => {
    setActiveQuote(quote);
    setQuoteComments([]);
    if (!isCommunityConfigured) {
      setQuoteCommentsState("idle");
      return;
    }

    setQuoteCommentsState("loading");
    const viewPromise = recordCommunityView("quote", quote.id)
      .then((row) => {
        if (!row) return;
        setStatsByTarget((current) => mergeTargetStats(current, "quote", quote.id, {
          uniqueVisitors: Number(row.unique_visitor_count ?? 0),
          views: Number(row.view_count ?? 0),
        }));
      })
      .catch(() => {});

    try {
      const comments = await loadPublishedComments("quote", quote.id, 30);
      setQuoteComments(comments);
      setQuoteCommentsState("ready");
    } catch {
      setQuoteCommentsState("error");
    }
    await viewPromise;
  }, []);

  const submitComment = useCallback(async ({ targetType, targetId, nickname, body }) => {
    const cleanedNickname = nickname.trim() || "匿名坑底人";
    const cleanedBody = body.trim();
    try {
      await submitCommunityComment({
        targetType,
        targetId,
        nickname: cleanedNickname,
        body: cleanedBody,
      });
      saveNickname(cleanedNickname === "匿名坑底人" ? "" : cleanedNickname);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: formatCommunityError(error) };
    }
  }, []);

  return {
    activeQuote,
    busyTargets,
    closeQuote,
    configured: isCommunityConfigured,
    connectionState,
    getStats,
    guestbookComments,
    guestbookState,
    isLiked: (targetType, targetId) => likedTargets.has(getTideTargetKey(targetType, targetId)),
    openQuote,
    quoteComments,
    quoteCommentsState,
    quotes,
    refreshStats,
    submitComment,
    toggleReaction,
  };
}

export function CommunityReactionButton({ busy = false, compact = false, disabled = false, liked = false, likes = 0, onClick }) {
  return (
    <button
      className={`community-reaction${liked ? " is-liked" : ""}${compact ? " is-compact" : ""}`}
      type="button"
      aria-label={liked ? `取消心动，当前 ${likes} 次` : `送出心动，当前 ${likes} 次`}
      aria-pressed={liked}
      disabled={disabled || busy}
      onClick={onClick}
    >
      <Heart weight={liked ? "fill" : "regular"} aria-hidden="true" />
      <span>{likes}</span>
    </button>
  );
}

export function TideCommunitySummary({ community }) {
  const stats = community.getStats(tideWordsPageTarget.targetType, tideWordsPageTarget.targetId);
  const pageKey = getTideTargetKey(tideWordsPageTarget.targetType, tideWordsPageTarget.targetId);

  return (
    <section className="tide-community-summary" aria-labelledby="tide-community-title">
      <div className="tide-community-summary-copy">
        <span>PIT ACTIVITY / LIVE ARCHIVE</span>
        <h2 id="tide-community-title">坑底正在发生</h2>
        <p>有人路过，有人心动，也有人留下了一句。</p>
      </div>
      <dl className="tide-community-stats">
        <div>
          <dt><Eye aria-hidden="true" />路过</dt>
          <dd>{stats.views}</dd>
        </div>
        <div>
          <dt><Heart aria-hidden="true" />心动</dt>
          <dd>{stats.likes}</dd>
        </div>
        <div>
          <dt><ChatCircleDots aria-hidden="true" />回声</dt>
          <dd>{stats.comments}</dd>
        </div>
      </dl>
      <div className="tide-community-summary-action">
        <CommunityReactionButton
          busy={community.busyTargets.has(pageKey)}
          disabled={!community.configured}
          liked={community.isLiked(tideWordsPageTarget.targetType, tideWordsPageTarget.targetId)}
          likes={stats.likes}
          onClick={() => community.toggleReaction(tideWordsPageTarget.targetType, tideWordsPageTarget.targetId)}
        />
        <small>{community.configured ? "给整个坑底文学送一次心动" : "互动服务等待 Supabase 配置"}</small>
      </div>
    </section>
  );
}

function CommunityCommentList({ comments, state }) {
  if (state === "loading") {
    return <p className="community-comments-state"><SpinnerGap className="is-spinning" aria-hidden="true" /> 正在捞回声</p>;
  }
  if (state === "error") return <p className="community-comments-state">回声暂时没有捞上来。</p>;
  if (!comments.length) return <p className="community-comments-state">这里还很安静，等第一句回声。</p>;

  return (
    <ol className="community-comment-list">
      {comments.map((comment) => (
        <li key={comment.id}>
          <header>
            <strong>{comment.nickname}</strong>
            <time dateTime={comment.created_at}>{new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(comment.created_at))}</time>
          </header>
          <p>{comment.body}</p>
        </li>
      ))}
    </ol>
  );
}

function CommunityCommentForm({ configured, onSubmit, submitLabel = "留下这句" }) {
  const [nickname, setNickname] = useState(readSavedNickname);
  const [body, setBody] = useState("");
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!configured || state === "submitting") return;
    setState("submitting");
    setMessage("");
    const result = await onSubmit({ nickname, body });
    if (result.ok) {
      setBody("");
      setState("success");
      setMessage("收到了。审核通过后，它会浮到坑底。 ");
    } else {
      setState("error");
      setMessage(result.message);
    }
  };

  return (
    <form className="community-comment-form" onSubmit={handleSubmit}>
      <label>
        <span>怎么称呼你</span>
        <input
          type="text"
          value={nickname}
          maxLength={24}
          placeholder="匿名坑底人"
          disabled={!configured}
          onChange={(event) => setNickname(event.target.value)}
        />
      </label>
      <label>
        <span>留下回声</span>
        <textarea
          value={body}
          minLength={2}
          maxLength={400}
          required
          rows={4}
          placeholder={configured ? "说点什么，接梗也行。" : "互动服务配置完成后开放留言。"}
          disabled={!configured}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <div className="community-comment-form-footer">
        <span aria-live="polite">{message}</span>
        <button type="submit" disabled={!configured || state === "submitting" || body.trim().length < 2}>
          {state === "submitting" ? <SpinnerGap className="is-spinning" aria-hidden="true" /> : <PaperPlaneTilt weight="bold" aria-hidden="true" />}
          {state === "submitting" ? "正在送出" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function TideGuestbook({ community }) {
  return (
    <section className="tide-guestbook" aria-labelledby="tide-guestbook-title">
      <div className="tide-guestbook-heading">
        <span>PUBLIC GUESTBOOK</span>
        <h2 id="tide-guestbook-title">坑底留言板</h2>
        <p>不一定要有结论，留一句也算来过。</p>
      </div>
      <div className="tide-guestbook-comments">
        <CommunityCommentList comments={community.guestbookComments} state={community.guestbookState} />
      </div>
      <CommunityCommentForm
        configured={community.configured}
        submitLabel="留在坑底"
        onSubmit={({ nickname, body }) => community.submitComment({
          targetType: tideWordsPageTarget.targetType,
          targetId: tideWordsPageTarget.targetId,
          nickname,
          body,
        })}
      />
    </section>
  );
}

export function QuoteCommentDrawer({ community }) {
  const closeButtonRef = useRef(null);
  const activeQuote = community.activeQuote;
  const stats = useMemo(() => (
    activeQuote ? community.getStats("quote", activeQuote.id) : emptyStats
  ), [activeQuote, community]);

  useEffect(() => {
    if (!activeQuote) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") community.closeQuote();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeQuote, community.closeQuote]);

  if (!activeQuote) return null;
  const targetKey = getTideTargetKey("quote", activeQuote.id);

  return createPortal(
    <div className="quote-comment-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) community.closeQuote();
    }}>
      <aside className="quote-comment-drawer" role="dialog" aria-modal="true" aria-labelledby="quote-comment-title">
        <header className="quote-comment-drawer-header">
          <span>{activeQuote.id.toUpperCase()} / PIT VOICE</span>
          <button ref={closeButtonRef} type="button" onClick={community.closeQuote} aria-label="关闭评论">
            <X weight="bold" aria-hidden="true" />
          </button>
        </header>
        <div className="quote-comment-featured">
          <blockquote id="quote-comment-title">{activeQuote.text}</blockquote>
          <small>— {activeQuote.speaker}</small>
        </div>
        <div className="quote-comment-metrics">
          <span><Eye aria-hidden="true" />{stats.views} 次翻开</span>
          <span><ChatCircleDots aria-hidden="true" />{stats.comments} 条回声</span>
          <CommunityReactionButton
            compact
            busy={community.busyTargets.has(targetKey)}
            disabled={!community.configured}
            liked={community.isLiked("quote", activeQuote.id)}
            likes={stats.likes}
            onClick={() => community.toggleReaction("quote", activeQuote.id)}
          />
        </div>
        <div className="quote-comment-scroll">
          <CommunityCommentList comments={community.quoteComments} state={community.quoteCommentsState} />
        </div>
        <CommunityCommentForm
          configured={community.configured}
          onSubmit={({ nickname, body }) => community.submitComment({
            targetType: "quote",
            targetId: activeQuote.id,
            nickname,
            body,
          })}
        />
      </aside>
    </div>,
    document.body,
  );
}
