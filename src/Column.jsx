import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  CalendarDots,
  DownloadSimple,
  DotsNine,
  HeartStraight,
  NotePencil,
  Paperclip,
  Question,
  Sparkle,
  TelevisionSimple,
  UsersThree,
} from "@phosphor-icons/react";
import columnData from "./data/column-data.json";
import { PageLoader } from "./PageLoader.jsx";
import { RepoFilmStrip } from "./RepoFilmStrip.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { ARTICLE_MEDIA_NOTICE } from "./rights.js";
import "./magazine.css";
import "./meme-game.css";

function withBase(assetPath) {
  if (!assetPath) return "";
  if (/^https?:\/\//.test(assetPath)) return assetPath;
  return `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, "")}`;
}

function renderChildren(node, keyPrefix) {
  return Array.from(node.childNodes).map((child, index) => renderNode(child, `${keyPrefix}-${index}`));
}

function nodeHasMeaningfulContent(node) {
  if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
  if (node.nodeType !== Node.ELEMENT_NODE) return false;

  const tag = node.tagName.toLowerCase();
  if (tag === "img") return Boolean(node.getAttribute("href"));
  if (tag === "bitable") return false;
  return Array.from(node.childNodes).some(nodeHasMeaningfulContent);
}

function describeColumn(column) {
  const media = Array.from(column.querySelectorAll("img[href]"));
  const textNodes = Array.from(column.querySelectorAll("p, h1, h2, h3, blockquote, quote, li, callout, table"));
  const textLength = textNodes.reduce((total, node) => total + (node.textContent?.trim().length || 0), 0);
  return {
    hasMedia: media.length > 0,
    hasText: textLength > 0,
    mediaCount: media.length,
    textLength,
  };
}

function renderNode(node, key, layoutIndex = null) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  const children = renderChildren(node, key);
  const text = node.textContent?.trim() ?? "";

  if (tag === "doc" || tag === "fragment" || tag === "column") {
    const className = tag === "column" ? "fs-column" : tag === "fragment" ? "fs-fragment" : undefined;
    return <div className={className} key={key}>{children}</div>;
  }

  if (tag === "grid") {
    const columns = Array.from(node.children).filter((child) => {
      return child.tagName.toLowerCase() === "column" && nodeHasMeaningfulContent(child);
    });
    if (columns.length === 0) return null;

    const profiles = columns.map(describeColumn);
    const hasMedia = profiles.some((profile) => profile.hasMedia);
    const hasText = profiles.some((profile) => profile.hasText);
    const mediaCount = profiles.reduce((total, profile) => total + profile.mediaCount, 0);
    const textLength = profiles.reduce((total, profile) => total + profile.textLength, 0);
    const isSplit = columns.length > 1 && hasMedia && hasText;
    const template = columns.map((column) => `${Number(column.getAttribute("width-ratio")) || 1}fr`).join(" ");
    const layoutClasses = ["fs-grid", "article-section"];
    if (layoutIndex !== null) {
      if (isSplit) {
        layoutClasses.push("article-layout-split");
        layoutClasses.push(layoutIndex % 2 === 0 ? "article-layout-media-left" : "article-layout-media-right");
        if (textLength < mediaCount * 260) {
          layoutClasses.push("article-layout-media-heavy");
          layoutClasses.push(mediaCount === 1 ? "article-media-count-one" : "article-media-count-many");
        } else if (textLength > Math.max(640, mediaCount * 520)) {
          layoutClasses.push("article-layout-copy-heavy");
        }
      } else if (hasMedia && !hasText) {
        layoutClasses.push("article-layout-gallery");
      } else if (hasText && !hasMedia) {
        layoutClasses.push("article-layout-text");
      } else {
        layoutClasses.push("article-layout-single");
      }
    }
    return (
      <div
        className={layoutClasses.join(" ")}
        data-section={layoutIndex === null ? undefined : String(layoutIndex + 1).padStart(2, "0")}
        style={{ "--fs-columns": template }}
        key={key}
      >
        {columns.map((column, index) => (
          <div
            className={`fs-column${profiles[index].hasMedia ? " is-media" : ""}${profiles[index].hasText ? " is-copy" : ""}`}
            key={`${key}-column-${index}`}
          >
            {renderChildren(column, `${key}-column-${index}`)}
          </div>
        ))}
      </div>
    );
  }

  if (tag === "title") return <h1 className="fs-title" key={key}>{children}</h1>;
  if (tag === "h1") return <h2 className="fs-heading fs-heading-one" key={key}>{children}</h2>;
  if (tag === "h2") return <h2 className="fs-heading fs-heading-two" key={key}>{children}</h2>;
  if (tag === "h3") return <h3 className="fs-heading fs-heading-three" key={key}>{children}</h3>;

  if (tag === "p") {
    if (!text && node.children.length === 0) return <div className="fs-spacer" aria-hidden="true" key={key} />;
    const isSpeaker = /^[\p{L}\p{N}.'’·_\-\s]{1,24}[：:]$/u.test(text);
    return (
      <p
        className={`fs-paragraph${isSpeaker ? " is-speaker" : ""}`}
        style={{ textAlign: node.getAttribute("align") || undefined }}
        key={key}
      >
        {children}
      </p>
    );
  }

  if (tag === "img") {
    return (
      <figure className="fs-figure" key={key}>
        <img
          src={withBase(node.getAttribute("href"))}
          alt={node.getAttribute("name") || "文章配图"}
          width={node.getAttribute("width") || undefined}
          height={node.getAttribute("height") || undefined}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
        <figcaption className="fs-rights-caption">{ARTICLE_MEDIA_NOTICE}</figcaption>
      </figure>
    );
  }

  if (tag === "a") {
    return (
      <a href={node.getAttribute("href") || "#"} target="_blank" rel="noreferrer" key={key}>
        {children}
      </a>
    );
  }

  if (tag === "b" || tag === "strong") return <strong key={key}>{children}</strong>;
  if (tag === "i" || tag === "em") return <em key={key}>{children}</em>;
  if (tag === "u") return <u key={key}>{children}</u>;
  if (tag === "del" || tag === "s" || tag === "strike") return null;
  if (tag === "blockquote" || tag === "quote") return <blockquote className="fs-quote" key={key}>{children}</blockquote>;
  if (tag === "hr") return <hr className="fs-rule" key={key} />;
  if (tag === "br") return <br key={key} />;

  if (tag === "span") {
    return <span style={{ color: node.getAttribute("text-color") || undefined }} key={key}>{children}</span>;
  }

  if (tag === "ul") return <ul className="fs-list" key={key}>{children}</ul>;
  if (tag === "ol") return <ol className="fs-list" key={key}>{children}</ol>;
  if (tag === "li") return <li key={key}>{children}</li>;

  if (tag === "callout") {
    return (
      <aside
        className="fs-callout"
        style={{
          backgroundColor: node.getAttribute("background-color") || undefined,
          borderColor: node.getAttribute("border-color") || undefined,
        }}
        key={key}
      >
        <span aria-hidden="true">{node.getAttribute("emoji")}</span>
        <div>{children}</div>
      </aside>
    );
  }

  if (tag === "table") return <div className="fs-table-wrap" key={key}><table>{children}</table></div>;
  if (tag === "thead") return <thead key={key}>{children}</thead>;
  if (tag === "tbody") return <tbody key={key}>{children}</tbody>;
  if (tag === "tr") return <tr key={key}>{children}</tr>;
  if (tag === "th") return <th key={key}>{children}</th>;
  if (tag === "td") return <td key={key}>{children}</td>;
  if (tag === "bitable") return null;

  return <div className={`fs-block fs-${tag}`} key={key}>{children}</div>;
}

export function ArticleDocument({ xml, overview = false, hideTitle = false, hideLeadHeading = false }) {
  const document = useMemo(() => {
    const parsed = new DOMParser().parseFromString(`<doc>${xml}</doc>`, "application/xml");
    return parsed.querySelector("parsererror") ? null : parsed.documentElement;
  }, [xml]);

  if (!document) return <p className="column-empty">这篇内容暂时无法解析。</p>;

  const nodes = Array.from(document.childNodes).filter((node) => {
    if (!overview || node.nodeType !== Node.ELEMENT_NODE) return true;
    return node.tagName.toLowerCase() !== "fragment";
  });

  let leadHeadingRemoved = false;
  const content = (overview
    ? Array.from(document.querySelector("fragment")?.childNodes ?? []).filter((node) => {
        return node.nodeType !== Node.ELEMENT_NODE || node.tagName.toLowerCase() !== "h1";
      })
    : nodes).filter((node) => {
      const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName.toLowerCase() : "";
      if (hideTitle && tag === "title") return false;
      if (hideLeadHeading && !leadHeadingRemoved && tag === "h1") {
        leadHeadingRemoved = true;
        return false;
      }
      return nodeHasMeaningfulContent(node);
    });

  let gridIndex = 0;
  const blocks = [];
  let flowNodes = [];
  const flushFlow = () => {
    if (flowNodes.length === 0) return;
    const flowIndex = blocks.length;
    blocks.push(
      <section className="article-flow" key={`flow-${flowIndex}`}>
        {flowNodes.map((node, index) => renderNode(node, `flow-${flowIndex}-${index}`))}
      </section>,
    );
    flowNodes = [];
  };

  content.forEach((node, index) => {
    const isGrid = node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "grid";
    if (!isGrid) {
      flowNodes.push(node);
      return;
    }
    flushFlow();
    blocks.push(renderNode(node, `fs-${index}`, gridIndex++));
  });
  flushFlow();

  return (
    <div className={overview ? "article-document is-overview" : "article-document"}>
      {blocks}
    </div>
  );
}

function formatArticleTitle(collectionTitle, articleTitle) {
  const compactCollection = collectionTitle.replace(/\s+/g, "");
  const compactArticle = articleTitle.replace(/\s+/g, "");
  let subject = articleTitle;

  if (compactArticle.startsWith(compactCollection)) {
    let consumed = 0;
    let sourceIndex = 0;
    while (sourceIndex < articleTitle.length && consumed < compactCollection.length) {
      if (!/\s/.test(articleTitle[sourceIndex])) consumed += 1;
      sourceIndex += 1;
    }
    subject = articleTitle.slice(sourceIndex);
  }

  subject = subject
    .replace(/^[-—–:：\s]+/, "")
    .replace(/(repo|ep)(?=\s*\d)/gi, (label) => (label.toLowerCase() === "repo" ? "Repo" : "EP"))
    .replace(/\brepo\b/gi, "Repo")
    .replace(/\bep\b/gi, "EP")
    .replace(/([\p{Script=Han}])(?=(?:Repo|EP)\s*\d)/gu, "$1 ")
    .replace(/([A-Za-z]+)\s*(\d{2}(?:-\d{2})?)/g, "$1 $2")
    .replace(/([\p{Script=Han}])(\d{2})(?=$|[（(])/gu, "$1 $2")
    .replace(/(\d{2})-(\d{2})/g, "$1–$2");

  return subject || articleTitle;
}

function ArticleMastheadSubject({ subject }) {
  const episodeMatch = subject.match(/^(.*?)(\s+EP\s*\d+(?:[–-]\d+)?)$/i);
  if (!episodeMatch) return subject;

  return (
    <>
      {episodeMatch[1].trim()}
      <span className="article-masthead-episode">{episodeMatch[2].trim()}</span>
    </>
  );
}

function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}

function useArticleReveal(articleRef, articleSlug) {
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return undefined;
    const nodes = Array.from(root.querySelectorAll(".fs-grid, .article-flow, .fs-callout, .fs-quote"));
    nodes.forEach((node) => node.classList.add("article-reveal"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }),
      { threshold: 0.12 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [articleRef, articleSlug]);
}

const memeCollection = [
  {
    id: "001",
    title: "我决定不认真了",
    note: "每一次郑重退坑的标准表情。",
    src: "assets/fan-memes/reaction-no-serious.webp",
    alt: "聊天气泡写着我决定不认真了，下方是一位穿红衣服的女性无奈地拨头发",
    downloadName: "glfans-我决定不认真了.webp",
  },
  {
    id: "002",
    title: "不会真情实感了",
    note: "通常出现在下一次真情实感之前。",
    src: "assets/fan-memes/reaction-no-emotion.webp",
    alt: "圆角聊天气泡写着不会真情实感了，其中真情二字为绿色",
    downloadName: "glfans-不会真情实感了.webp",
  },
  {
    id: "003",
    title: "轻松绷住",
    note: "飞书原版表情包库收录。",
    src: "assets/fan-memes/reaction-light-relaxed.webp",
    alt: "一张模糊的黑白熊猫头表情，嘴角努力保持平静",
    downloadName: "glfans-轻松绷住.webp",
  },
  {
    id: "004",
    title: "女同越来越多",
    note: "飞书原版表情包库收录。",
    src: "assets/fan-memes/reaction-many-lesbians.webp",
    alt: "黑色背景上的文字表情包，写着 less is more 和女同越来越多",
    downloadName: "glfans-女同越来越多.webp",
  },
  {
    id: "005",
    title: "我是个失败的拉拉",
    note: "飞书原版表情包库收录。",
    src: "assets/fan-memes/reaction-failed-lesbian.webp",
    alt: "戴着纸袋的猫咪表情，配字我是个失败的拉拉",
    downloadName: "glfans-我是个失败的拉拉.webp",
  },
];

const memeGameCriticalAssets = [
  "assets/meme-game/meme-camera-three-quarter-empty-v2.webp",
  "assets/repo-handdrawn-heart-pink.webp",
  "assets/repo-handdrawn-underline-pink.webp",
  ...memeCollection.map((meme) => meme.src),
];

const memeCaptureDeck = memeCollection;

let memeGameAssetsPrimed = false;

function preloadMemeAsset(assetPath) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const settle = async () => {
      if (settled) return;
      settled = true;

      if (image.naturalWidth > 0 && typeof image.decode === "function") {
        try {
          await image.decode();
        } catch {
          // The image has already loaded; decoding can still reject in some browsers.
        }
      }

      resolve();
    };

    image.decoding = "async";
    image.onload = settle;
    image.onerror = settle;
    image.src = withBase(assetPath);
  });
}

function MemePickupPage() {
  const [assetsReady, setAssetsReady] = useState(memeGameAssetsPrimed);
  const [preparedAssetCount, setPreparedAssetCount] = useState(
    memeGameAssetsPrimed ? memeGameCriticalAssets.length : 0,
  );
  const [phase, setPhase] = useState("idle");
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [activeFilmIndex, setActiveFilmIndex] = useState(-1);
  const [capturedFilms, setCapturedFilms] = useState([]);
  const [targetSlotIndex, setTargetSlotIndex] = useState(0);
  const [archiveMotion, setArchiveMotion] = useState(null);
  const timersRef = useRef([]);
  const filmstripRef = useRef(null);
  const printRef = useRef(null);
  const filmLandingRef = useRef(null);
  const nextCaptureNumberRef = useRef(1);
  const isDeckExhausted = capturedFilms.length >= memeCaptureDeck.length;

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => {
    document.body.classList.add("meme-game-active");
    return () => {
      clearTimers();
      document.body.classList.remove("meme-game-active");
    };
  }, []);

  useEffect(() => {
    if (memeGameAssetsPrimed) return undefined;

    let active = true;
    let completed = 0;
    let revealTimer = 0;
    let revealFrame = 0;
    const startedAt = window.performance.now();

    const revealInterface = () => {
      if (!active || memeGameAssetsPrimed) return;
      memeGameAssetsPrimed = true;
      revealFrame = window.requestAnimationFrame(() => {
        if (active) setAssetsReady(true);
      });
    };

    Promise.all(memeGameCriticalAssets.map(async (assetPath) => {
      await preloadMemeAsset(assetPath);
      completed += 1;
      if (active) setPreparedAssetCount(completed);
    })).then(() => {
      const elapsed = window.performance.now() - startedAt;
      revealTimer = window.setTimeout(revealInterface, Math.max(0, 280 - elapsed));
    });

    const safetyTimer = window.setTimeout(revealInterface, 15000);

    return () => {
      active = false;
      window.clearTimeout(revealTimer);
      window.clearTimeout(safetyTimer);
      window.cancelAnimationFrame(revealFrame);
    };
  }, []);

  const startCapture = () => {
    if (phase !== "idle" || isDeckExhausted) return;

    clearTimers();
    const capturedMemeIds = new Set(capturedFilms.map((meme) => meme.id));
    const candidates = memeCaptureDeck.filter((meme) => !capturedMemeIds.has(meme.id));
    const sourceMeme = candidates[Math.floor(Math.random() * candidates.length)];
    if (!sourceMeme) return;
    const captureNumber = nextCaptureNumberRef.current;
    const capturedAt = new Date();
    nextCaptureNumberRef.current += 1;
    const nextMeme = {
      ...sourceMeme,
      captureId: `${sourceMeme.id}-${captureNumber}`,
      filmId: String(captureNumber).padStart(2, "0"),
      capturedAt: capturedAt.toISOString(),
      capturedTime: [capturedAt.getHours(), capturedAt.getMinutes(), capturedAt.getSeconds()]
        .map((part) => String(part).padStart(2, "0"))
        .join(":"),
    };
    const targetIndex = capturedFilms.length;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusAt = reduceMotion ? 20 : 260;
    const revealAt = reduceMotion ? 40 : 1180;
    const archiveAt = reduceMotion ? 60 : 1640;
    const archiveDuration = reduceMotion ? 80 : 1050;

    const beginArchive = () => {
      const sourceRect = printRef.current?.getBoundingClientRect();
      const targetRect = filmLandingRef.current?.getBoundingClientRect();

      if (sourceRect && targetRect) {
        setArchiveMotion({
          x: targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2),
          y: targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2),
          scale: targetRect.width / printRef.current.offsetWidth,
        });
      }

      setPhase("archiving");
      timersRef.current.push(window.setTimeout(() => {
        setCapturedFilms((currentFilms) => [...currentFilms, nextMeme]);
        setActiveFilmIndex(targetIndex);
        setSelectedMeme(null);
        setArchiveMotion(null);
        setPhase("idle");
      }, archiveDuration));
    };

    setSelectedMeme(nextMeme);
    setActiveFilmIndex(-1);
    setTargetSlotIndex(targetIndex);
    setArchiveMotion(null);
    setPhase("focusing");
    timersRef.current.push(window.setTimeout(() => setPhase("ejecting"), focusAt));
    timersRef.current.push(window.setTimeout(() => setPhase("revealed"), revealAt));
    timersRef.current.push(window.setTimeout(beginArchive, archiveAt));
  };

  if (!assetsReady) {
    const progress = Math.round((preparedAssetCount / memeGameCriticalAssets.length) * 100);

    return <PageLoader className="meme-game-loader" kicker="MEME PIT" label="正在装填表情包" progress={progress} />;
  }

  return (
    <section className={`meme-game meme-game-${phase} meme-game-assets-ready${isDeckExhausted ? " is-complete" : ""}`} aria-labelledby="meme-game-title">
      <div className="meme-game-hero">
        <div className="meme-game-intro">
          <img
            className="meme-title-heart"
            src={withBase("assets/repo-handdrawn-heart-pink.webp")}
            alt=""
            aria-hidden="true"
          />
          <h1 className="meme-game-heading" id="meme-game-title" aria-label="MEME PIT">
            <span className="meme-heading-line is-meme" aria-hidden="true">
              {Array.from("MEME").map((character, index) => <i key={`${character}-${index}`}>{character}</i>)}
            </span>
            <strong className="meme-heading-line is-pit" aria-hidden="true">
              {Array.from("PIT").map((character, index) => <i key={`${character}-${index}`}>{character}</i>)}
            </strong>
            <img
              className="meme-title-underline"
              src={withBase("assets/repo-handdrawn-underline-pink.webp")}
              alt=""
              aria-hidden="true"
            />
          </h1>
          <p className="meme-game-tagline">
            请看镜头，<em>保持嘴硬</em>
            <span className="meme-title-spark" aria-hidden="true"><Sparkle weight="fill" /></span>
          </p>
        </div>

        <div className={`instant-camera-stage is-${phase}`}>
          <div className="instant-camera-visual">
            {selectedMeme && !["idle", "focusing"].includes(phase) && (
              <div className="instant-print-rail">
                <figure
                  className="instant-print"
                  ref={printRef}
                  style={archiveMotion ? {
                    "--archive-x": `${archiveMotion.x}px`,
                    "--archive-y": `${archiveMotion.y}px`,
                    "--archive-scale": archiveMotion.scale,
                  } : undefined}
                >
                  <span className="instant-print-photo">
                    <img src={withBase(selectedMeme.src)} alt={selectedMeme.alt} />
                    <i className="instant-print-wash" aria-hidden="true" />
                  </span>
                  <figcaption>
                    <b>[{selectedMeme.filmId}]</b>
                    <time dateTime={selectedMeme.capturedAt}>{selectedMeme.capturedTime}</time>
                  </figcaption>
                </figure>
              </div>
            )}

            <img
              className="instant-camera-image"
              src={withBase("assets/meme-game/meme-camera-three-quarter-empty-v2.webp")}
              alt="带轻微侧视厚度的黑色与奶油白拍立得相机"
              decoding="async"
              fetchPriority="high"
            />

            <button
              className="instant-camera-shutter"
              type="button"
              aria-label={isDeckExhausted ? "5 张表情包已全部收齐" : "按下快门拍一张表情包"}
              onClick={startCapture}
              disabled={phase !== "idle" || isDeckExhausted}
            />
            <span className="instant-camera-focus-label" aria-hidden="true">
              <i />
              {isDeckExhausted && phase === "idle"
                ? "今天已收齐"
                : phase === "focusing"
                ? "对焦中"
                : phase === "ejecting"
                  ? "出片中"
                  : phase === "developing"
                    ? "显影中"
                    : phase === "revealed"
                      ? "已显影"
                    : phase === "archiving"
                      ? "已收好"
                      : "按住对焦"}
            </span>
          </div>
        </div>
      </div>

      <div className="meme-filmstrip-shell">
        <div className="meme-filmstrip" ref={filmstripRef}>
          <div className="meme-filmstrip-track">
            {Array.from({ length: 6 }).map((_, index) => {
              const meme = capturedFilms[index];
              const showCompletionNote = isDeckExhausted && index === memeCaptureDeck.length;

              return (
                <span
                  className={`meme-film-slot${phase === "archiving" && targetSlotIndex === index ? " is-receiving" : ""}`}
                  key={`film-slot-${index}`}
                  ref={targetSlotIndex === index ? filmLandingRef : null}
                >
                  {meme ? (
                    <article
                      className={`meme-film-card is-filled${activeFilmIndex === index ? " is-active" : ""}`}
                      aria-label={`第 ${meme.filmId} 张表情包：${meme.title}，拍摄于 ${meme.capturedTime}`}
                    >
                      <span className="meme-film-image"><img src={withBase(meme.src)} alt="" /></span>
                      <span className="meme-film-number">[{meme.filmId}]</span>
                      <span className="meme-film-card-actions">
                        <a
                          href={withBase(meme.src)}
                          download={meme.downloadName}
                          aria-label={`下载表情包：${meme.title}`}
                          title="下载这张"
                        >
                          <DownloadSimple aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          onClick={startCapture}
                          disabled={phase !== "idle" || isDeckExhausted}
                          aria-label={isDeckExhausted ? "5 张表情包已全部收齐" : "再拍一张表情包"}
                          title={isDeckExhausted ? "今天已经全部收齐" : "再拍一张"}
                        >
                          <ArrowCounterClockwise aria-hidden="true" />
                        </button>
                      </span>
                      <time className="meme-film-time" dateTime={meme.capturedAt}>{meme.capturedTime}</time>
                    </article>
                  ) : showCompletionNote ? (
                    <span className="meme-film-complete" role="status" aria-live="polite">
                      <strong>胶卷拍空啦</strong>
                      <small>5 张嘴硬证据全到手，<br />再按就要拍到真心了。</small>
                    </span>
                  ) : (
                    <span className="meme-film-placeholder" aria-hidden="true">
                      <span className="meme-film-image"><Question className="meme-film-empty-mark" weight="bold" /></span>
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <p className="meme-download-notice">
        表情包仅供粉丝交流使用，相关素材权利归原权利人。
      </p>
    </section>
  );
}

const collectionCoverFocus = {
  "rival-lover": { card: "50% 10%", strip: "50% 18%" },
  us: { strip: "50% 58%" },
  "designing-love": { strip: "50% 41%" },
  "poisonous-love": { strip: "50% 18%" },
  "my-secret-words": { strip: "50% 38%" },
  affair: { strip: "50% 40%" },
};

function CollectionCard({ collection, index }) {
  const visibleArticleCount = collection.articles.filter((article) => !article.hidden).length;
  const coverFocus = collectionCoverFocus[collection.slug];

  return (
    <a
      className={`collection-card collection-card-${index + 1} collection-card-${collection.slug}`}
      href={`#/column/${collection.slug}`}
      style={{ "--collection-card-focus": coverFocus?.card ?? "50% 50%" }}
    >
      {index === 0 && (
        <>
          <span className="card-decoration card-paperclip" aria-hidden="true"><Paperclip /></span>
          <span className="card-decoration card-heart-doodle" aria-hidden="true">
            <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" decoding="async" />
          </span>
        </>
      )}
      {index === 2 && (
        <span className="card-decoration card-evidence-stamp" aria-hidden="true">
          <span>EVIDENCE</span><HeartStraight weight="fill" /><span>LOVE</span>
        </span>
      )}
      {index === 5 && <span className="card-decoration card-pink-tape" aria-hidden="true" />}
      <div className="collection-cover">
        <img src={withBase(collection.cover)} alt={`${collection.title}合集封面`} loading="lazy" decoding="async" />
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="collection-card-copy">
        <span>{collection.issue}</span>
        <h2>{collection.title}</h2>
        <p>{visibleArticleCount} 篇 Repo / 侧写</p>
        <ArrowRight aria-hidden="true" />
      </div>
    </a>
  );
}

const collectionEditorialNotes = {
  "rival-lover": { roman: "ENEMIES WITH BENEFITS" },
  us: { roman: "OUR LOVE" },
  "designing-love": { roman: "DESIGNING LOVE" },
  "poisonous-love": { roman: "POISONOUS LOVE" },
  "my-secret-words": { roman: "MY SECRET WORDS" },
  affair: { roman: "THE AFFAIR" },
};

function CollectionDisplayTitle({ title }) {
  const characters = Array.from(title);

  return (
    <h1 aria-label={title}>
      {characters.map((character, index) => (
        <span className={index === characters.length - 1 ? "is-pink" : undefined} aria-hidden="true" key={`${character}-${index}`}>
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </h1>
  );
}

function ArticleCardTitle({ label }) {
  const parts = label.split(/\s*·\s*/).filter(Boolean);
  if (parts.length > 1) {
    return (
      <h3 className="article-card-title article-card-title-split">
        <strong>{parts[0]}</strong>
        <small>{parts.slice(1).map((part, index) => (
          <Fragment key={part}>
            {index > 0 && <i aria-hidden="true">·</i>}
            {part}
          </Fragment>
        ))}</small>
      </h3>
    );
  }

  const pendingMatch = label.match(/^(.*?)(（[^）]+）)$/);
  if (pendingMatch) {
    return (
      <h3 className="article-card-title article-card-title-split">
        <strong>{pendingMatch[1].trim()}</strong>
        <small>{pendingMatch[2]}</small>
      </h3>
    );
  }

  return <h3 className="article-card-title">{label}</h3>;
}

const collectionFactIcons = [CalendarDots, NotePencil, TelevisionSimple, UsersThree];

function CollectionFacts({ xml }) {
  const facts = useMemo(() => {
    const parsed = new DOMParser().parseFromString(`<doc>${xml}</doc>`, "application/xml");
    const infoColumn = Array.from(parsed.querySelectorAll("grid > column")).at(-1);
    if (!infoColumn) return [];

    const paragraphs = Array.from(infoColumn.children).filter((node) => node.tagName.toLowerCase() === "p");
    const findFact = (pattern) => paragraphs.find((node) => pattern.test(node.textContent?.trim() ?? ""));
    const selected = [
      findFact(/首播/),
      findFact(/放送时间|播放时间/),
      findFact(/播出平台|制作公司/),
      findFact(/主要演员/),
    ].filter(Boolean);

    return selected.map((node, index) => {
      let text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (/主要演员/.test(text)) {
        const list = node.nextElementSibling?.tagName.toLowerCase() === "ul"
          ? Array.from(node.nextElementSibling.querySelectorAll("li")).map((item) => item.textContent?.trim()).filter(Boolean)
          : [];
        if (list.length) text = `${text} ${list.join(" / ")}`;
      }
      const separator = text.search(/[：:]/);
      const label = separator >= 0 ? text.slice(0, separator).trim() : text;
      const value = separator >= 0 ? text.slice(separator + 1).trim() : "";
      const emphasis = node.querySelector("a")?.textContent?.trim() ?? "";
      return { label, value, emphasis, icon: collectionFactIcons[index] };
    });
  }, [xml]);

  return (
    <dl className="collection-facts">
      {facts.map((fact) => {
        const Icon = fact.icon;
        const emphasisIndex = fact.emphasis ? fact.value.indexOf(fact.emphasis) : -1;
        return (
          <div className="collection-fact-row" key={fact.label}>
            <Icon weight="bold" aria-hidden="true" />
            <div className="collection-fact-copy">
              <dt>{fact.label}：</dt>
              <dd>
                {emphasisIndex >= 0 ? (
                  <>
                    {fact.value.slice(0, emphasisIndex)}
                    <strong>{fact.emphasis}</strong>
                    {fact.value.slice(emphasisIndex + fact.emphasis.length)}
                  </>
                ) : fact.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

function ColumnIndex() {
  return (
    <>
      <section className="column-index-hero">
        <img
          className="hero-ghost-word"
          src={withBase("assets/repo-hero-ghost-word.webp")}
          width="1680"
          height="595"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          data-page-critical="true"
        />
        <div className="hero-hand-note">
          <span>Love is not a feeling.</span>
          <span>It&apos;s Evidence.</span>
          <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" decoding="async" />
        </div>
        <div className="column-index-title">
          <h1>
            <span><b>Repo</b><i>文</i></span>
            <em aria-label="证据目录">
              {["证", "据", "目", "录"].map((character) => <span aria-hidden="true" key={character}>{character}</span>)}
            </em>
          </h1>
          <p>每一份心动，都有迹可循。</p>
          <span className="hero-title-underline" aria-hidden="true" />
          <span className="hero-title-arrow" aria-hidden="true">↗</span>
          <span className="hero-label hero-label-left">LOVE ARCHIVE / 06 COLLECTIONS</span>
        </div>
        <aside className="hero-reading-note">
          <div>
            <span>READING NOTE</span>
            <strong>这次真的不一样</strong>
            <p>but 理性磕糖</p>
          </div>
        </aside>
        <span className="hero-label hero-note-label">ROMANCE / EVIDENCE / ARCHIVE</span>
        <DotsNine className="hero-pink-grid" weight="bold" aria-hidden="true" />
      </section>

      <RepoFilmStrip critical />

      <section className="collection-index" aria-label="专栏合集">
        {columnData.collections.map((collection, index) => (
          <CollectionCard collection={collection} index={index} key={collection.slug} />
        ))}
      </section>

      <section className="repo-index-note" aria-labelledby="repo-index-note-title">
        <div className="repo-index-note-heading">
          <span>ARCHIVE NOTE</span>
          <h2 id="repo-index-note-title">目前包含已有泰百repo及二创类文章共<strong>21</strong>篇：</h2>
        </div>
        <div className="repo-pending-copy">
          <span>待更新：</span>
          <p><strong>宿敌恋人</strong><small>ep9-ep10</small></p>
          <p><strong>月下之影</strong><small>片段</small></p>
        </div>
      </section>

    </>
  );
}

function CollectionView({ collection }) {
  const collectionIndex = columnData.collections.findIndex((item) => item.slug === collection.slug);
  const collectionNumber = String(collectionIndex + 1).padStart(2, "0");
  const editorial = collectionEditorialNotes[collection.slug] ?? {
    roman: collection.slug.replaceAll("-", " ").toUpperCase(),
  };
  const visibleArticles = collection.articles.filter((article) => !article.hidden);

  return (
    <>
      <section className={`collection-hero collection-collage collection-collage-${collectionIndex + 1}`}>
        <div className="collection-collage-hero">
          <img
            className="collection-ghost-repo"
            src={withBase("assets/repo-hero-ghost-word.webp")}
            width="1680"
            height="595"
            alt=""
            aria-hidden="true"
            decoding="async"
            data-page-critical="true"
          />
          <a
            className="collection-issue-badge"
            href="#/column"
            aria-label="返回全部合集"
            title="返回全部合集"
          >
            <span>← 返回合集</span>
            <strong>{collectionNumber}</strong>
          </a>
          <div className="collection-title-paper">
            <CollectionDisplayTitle title={collection.title} />
            <p>{editorial.roman}</p>
            <img src={withBase("assets/repo-handdrawn-underline-pink.webp")} alt="" aria-hidden="true" decoding="async" />
          </div>
          <figure className="collection-hero-photo">
            <img className="collection-photo-frame" src={withBase("assets/repo-collection-poster-frame-v1.webp")} alt="" aria-hidden="true" decoding="async" data-page-critical="true" />
            <img className="collection-cover-art" src={withBase(collection.cover)} alt={`${collection.title}合集封面`} decoding="async" fetchPriority="high" data-page-critical="true" />
            <img className="collection-photo-brush" src={withBase("assets/repo-collection-pink-brush-v1.webp")} alt="" aria-hidden="true" decoding="async" data-page-critical="true" />
            <Paperclip aria-hidden="true" />
            <img className="collection-photo-heart collection-photo-heart-top" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" decoding="async" />
            <img className="collection-photo-heart collection-photo-heart-side" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" decoding="async" />
          </figure>
          <div className="collection-title-caption" aria-hidden="true">
            <span>Love is not a feeling.</span>
            <span>It&apos;s <b>Evidence.</b></span>
          </div>
          <div className="collection-dossier">
            <CollectionFacts xml={collection.summaryXml} />
          </div>
          <span className="collection-dossier-repo">ROMANCE / EVIDENCE / ARCHIVE</span>
          <DotsNine className="collection-hero-dots" weight="bold" aria-hidden="true" />
        </div>
      </section>

      <section className="article-index" aria-label={`${collection.title}文章列表`}>
        <div className="article-index-heading">
          <span>EVIDENCE ARCHIVE</span>
          <h2>这一坑的 <em>Repo</em></h2>
        </div>
        <div className={`article-grid article-grid-count-${Math.min(visibleArticles.length, 4)}`}>
          {visibleArticles.map((article, index) => (
            <a
              className={`article-card article-card-${index + 1} article-card-style-${index % 2 === 0 ? "a" : "b"}`}
              href={`#/column/${collection.slug}/${article.slug}`}
              key={article.slug}
            >
              <img
                className="article-card-material"
                src={withBase(index % 2 === 0
                  ? "assets/repo-article-card-frame-a-v1.webp"
                  : "assets/repo-article-card-frame-b-v1.webp")}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              <div className="article-card-image">
                <img src={withBase(article.cover || collection.cover)} alt="" loading="lazy" decoding="async" />
              </div>
              <div>
                <span>ARTICLE / {String(index + 1).padStart(2, "0")}</span>
                <ArticleCardTitle label={article.label} />
                <ArrowRight aria-hidden="true" />
              </div>
            </a>
          ))}
        </div>
        <div className="collection-detail-end" aria-label={`${collection.title}合集结束`}>
          <span>REPO 文专栏</span>
          <span>LOVE IS EVIDENCE.</span>
        </div>
      </section>
    </>
  );
}

function ArticleView({ collection, article }) {
  const articleRef = useRef(null);
  const progress = useReadingProgress();
  useArticleReveal(articleRef, article.slug);
  const visibleArticles = collection.articles.filter((item) => !item.hidden);
  const articleIndex = visibleArticles.findIndex((item) => item.slug === article.slug);
  const articleNumber = String(articleIndex + 1).padStart(2, "0");
  const articleSubject = formatArticleTitle(collection.title, article.title);
  const nextArticle = visibleArticles[articleIndex + 1];
  const articleImages = useMemo(() => {
    return Array.from(article.xml.matchAll(/<img\b[^>]*\bhref="([^"]+)"/g), (match) => match[1]);
  }, [article.xml]);
  const mastheadImage = articleImages[0] || article.cover || collection.cover;

  return (
    <article className="article-view article-magazine" ref={articleRef}>
      <div className="article-toolbar">
        <a className="article-toolbar-back" href={`#/column/${collection.slug}`}>
          <ArrowLeft aria-hidden="true" />
          <span>返回{collection.title}</span>
        </a>
        <span className="article-toolbar-title">
          <small>ARTICLE / {articleNumber}</small>
          <strong>{articleSubject}</strong>
        </span>
        <span className="article-toolbar-track" aria-hidden="true">
          <i style={{ transform: `scaleX(${Math.max(progress, 0.012)})` }} />
        </span>
        <span className="article-toolbar-percent">阅读进度 {Math.round(progress * 100)}%</span>
      </div>
      <header className="article-masthead">
        <div className="article-masthead-copy">
          <span className="article-masthead-kicker">ARTICLE / {articleNumber}</span>
          <h1 aria-label={article.title}>
            <span>{collection.title}</span>
            <strong><ArticleMastheadSubject subject={articleSubject} /></strong>
          </h1>
          <span className="article-masthead-underline" aria-hidden="true" />
        </div>
        <figure className="article-masthead-still" aria-hidden="true">
          <img src={withBase(mastheadImage)} alt="" decoding="async" fetchPriority="high" data-page-critical="true" />
        </figure>
        <aside className="article-masthead-note">
          <span>EDGE NOTE</span>
          <p>{article.label}</p>
        </aside>
      </header>
      <ArticleDocument xml={article.xml} hideTitle hideLeadHeading />
      <aside className="article-rights-note" aria-label="文章配图权利说明">
        <strong>图像与资料说明</strong>
        <span>{ARTICLE_MEDIA_NOTICE}</span>
        <a href="#/about/rights">查看完整说明</a>
      </aside>
      {nextArticle && (
        <nav className="article-next-nav" aria-label="下一篇文章">
          <span>NEXT ARTICLE</span>
          <a href={`#/column/${collection.slug}/${nextArticle.slug}`}>
            <small>下一篇</small>
            <strong>{formatArticleTitle(collection.title, nextArticle.title)}</strong>
            <ArrowRight aria-hidden="true" />
          </a>
        </nav>
      )}
    </article>
  );
}

function readRoute() {
  return window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}

export function ColumnExperience() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const collection = columnData.collections.find((item) => item.slug === route[1]);
  const article = collection?.articles.find((item) => item.slug === route[2] && !item.hidden);
  const isMemePickup = route[0] === "memes";

  return (
    <main className="column-shell">
      <SiteHeader activePath={isMemePickup ? "memes" : "column"} />
      {isMemePickup && <MemePickupPage />}
      {!isMemePickup && !collection && <ColumnIndex />}
      {!isMemePickup && collection && !article && <CollectionView collection={collection} />}
      {!isMemePickup && collection && article && <ArticleView collection={collection} article={article} />}
    </main>
  );
}
