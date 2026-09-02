import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader.jsx";
import { archiveDramasByYear, archiveYearList } from "./data/archive-dramas.js";
import "./archive-year-page.css";

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const withArchivePoster = (path) => `${withBase(path)}?v=20260902-hd`;

function formatArchiveDate(date) {
  if (!date) return "待公布";
  return date.replaceAll("-", ".");
}

function formatArchiveRange(event) {
  if (!event.endDate) return `${formatArchiveDate(event.startDate)} 起`;
  return `${formatArchiveDate(event.startDate)} — ${formatArchiveDate(event.endDate)}`;
}

function updateArchiveUrl(year, eventId) {
  const nextHash = eventId ? `#/archive/${year}/${eventId}` : `#/archive/${year}`;
  window.history.replaceState(null, "", nextHash);
}

export function ArchiveYearPage({ year, eventId }) {
  const yearEvents = archiveDramasByYear[year] || [];
  const hasArchiveEvents = yearEvents.length > 0;
  const initialEvent = yearEvents.find((event) => event.id === eventId) || yearEvents[0] || null;
  const [selectedId, setSelectedId] = useState(initialEvent?.id || "");
  const filmRef = useRef(null);
  const filmDragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  useEffect(() => {
    if (!hasArchiveEvents) return;
    const next = yearEvents.find((event) => event.id === eventId) || yearEvents[0];
    setSelectedId(next.id);
  }, [eventId, hasArchiveEvents, year]);

  const selectedEvent = yearEvents.find((event) => event.id === selectedId) || initialEvent;
  const selectedIndex = Math.max(0, yearEvents.findIndex((event) => event.id === selectedEvent?.id));

  const selectEvent = (event) => {
    setSelectedId(event.id);
    updateArchiveUrl(year, event.id);
  };

  const startFilmDrag = (event) => {
    const track = filmRef.current;
    if (!track) return;
    filmDragRef.current = { active: true, startX: event.clientX, startScroll: track.scrollLeft, moved: false };
    track.setPointerCapture(event.pointerId);
    track.classList.add("is-dragging");
  };

  const dragFilm = (event) => {
    const track = filmRef.current;
    if (!track || !filmDragRef.current.active) return;
    const delta = event.clientX - filmDragRef.current.startX;
    if (Math.abs(delta) > 6) filmDragRef.current.moved = true;
    track.scrollLeft = filmDragRef.current.startScroll - delta;
  };

  const endFilmDrag = (event) => {
    const track = filmRef.current;
    if (!track || !filmDragRef.current.active) return;
    const wasMoved = filmDragRef.current.moved;
    filmDragRef.current.active = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.classList.remove("is-dragging");

    if (!wasMoved) {
      const card = document.elementFromPoint(event.clientX, event.clientY)?.closest(".archive-event-card");
      const next = yearEvents.find((item) => item.id === card?.dataset.eventId);
      if (next) selectEvent(next);
    }
  };

  return (
    <main className="archive-year-page">
      <SiteHeader activePath="archive" />
      <div className="archive-year-main">
        <a
          className="archive-year-back"
          href="#/archive"
          aria-label="返回全部年份"
          title="返回全部年份"
          onClick={(event) => {
            event.preventDefault();
            window.location.hash = "#/archive";
          }}
        >
          <span>← 返回年份</span>
          <strong>{year}</strong>
        </a>

        <section className="archive-year-hero" aria-labelledby="archive-year-title">
          <header className="archive-year-masthead">
            <h1 id="archive-year-title">
              <span className="archive-year-cn-title" aria-label="年度胶卷">
                {["年", "度", "胶", "卷"].map((character) => (
                  <i aria-hidden="true" key={character}>{character}</i>
                ))}
              </span>
              <strong>YEAR ARCHIVE</strong>
            </h1>
            <p className="archive-year-tag">拖动剧集胶卷，看看这年<span>播了什么</span>。</p>

          </header>

          {hasArchiveEvents ? (
            <>
              <figure
                className="archive-year-preview"
                style={{
                  "--archive-media-ratio": selectedEvent.width / selectedEvent.height,
                  "--archive-event-focus": selectedEvent.focus,
                }}
              >
                <div className="archive-year-preview-frame">
                  <img
                    className="archive-year-preview-art"
                    src={withArchivePoster(selectedEvent.image)}
                    width={selectedEvent.width}
                    height={selectedEvent.height}
                    alt={`${selectedEvent.title}《${selectedEvent.titleEn}》剧集封面`}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    data-page-critical="true"
                  />
                </div>
                <figcaption>
                  <span>FRAME {String(selectedIndex + 1).padStart(2, "0")} / {year}</span>
                  <b>{selectedEvent.titleEn}</b>
                </figcaption>
                <span className="archive-year-preview-edge" aria-hidden="true">GL / ARCHIVE</span>
              </figure>

              <aside className="archive-year-summary" aria-live="polite">
                <time dateTime={selectedEvent.startDate}>{formatArchiveRange(selectedEvent)}</time>
                <h2>{selectedEvent.title}</h2>
                <small className="archive-year-original-title">{selectedEvent.titleEn}</small>
                <dl className="archive-year-facts">
                  <div><dt>播出</dt><dd>{selectedEvent.weekday} · {selectedEvent.status}</dd></div>
                  <div><dt>集数</dt><dd>{selectedEvent.episodes ? `${selectedEvent.episodes} 集` : "待公布"}</dd></div>
                  <div><dt>平台</dt><dd>{selectedEvent.platforms.join(" / ") || selectedEvent.company || "待公布"}</dd></div>
                </dl>
                <div className="archive-year-cast">
                  <span>主演</span>
                  <p>{selectedEvent.cast?.join(" / ") || "演员资料整理中"}</p>
                </div>
                <span className="archive-year-summary-brush" aria-hidden="true" />
                <p>{selectedEvent.summary}</p>
                <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" data-page-critical="true" />
              </aside>
            </>
          ) : (
            <section className="archive-year-empty">
              <span>{year}</span>
              <h2>这一年没有入档剧集</h2>
              <p>当前档案只收录以女性爱情为主线、已经正式播出或确认档期的泰国系列剧。</p>
              <a href="#/archive/2022">从 2022《GAP》开始看</a>
            </section>
          )}
        </section>

        <div className="archive-year-switcher-row">
          <nav className="archive-year-switcher" aria-label="切换年份">
            {archiveYearList.map((item) => (
              <a
                className={item === year ? "is-active" : ""}
                href={`#/archive/${item}`}
                onClick={(event) => {
                  event.preventDefault();
                  window.location.hash = `#/archive/${item}`;
                }}
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
          <img className="archive-year-loop" src={withBase("assets/about/annotation-loop-arrow-v1.webp")} alt="" aria-hidden="true" data-page-critical="true" />
          <p className="archive-year-count" aria-label={`${year} 年共收录 ${yearEvents.length} 部剧集`}>
            <span>本年收录</span>
            <strong>{String(yearEvents.length).padStart(2, "0")}</strong>
            <span>部剧集</span>
          </p>
        </div>

        {hasArchiveEvents && (
          <section className="archive-event-browser" aria-label={`${year} 年泰百剧集胶卷`}>
            <div
              className="archive-event-film-track"
              ref={filmRef}
              onPointerDown={startFilmDrag}
              onPointerMove={dragFilm}
              onPointerUp={endFilmDrag}
              onPointerCancel={endFilmDrag}
            >
              {yearEvents.map((event) => (
                <button
                  className={`archive-event-card${selectedEvent.id === event.id ? " is-active" : ""}`}
                  type="button"
                  onClick={() => selectEvent(event)}
                  aria-pressed={selectedEvent.id === event.id}
                  data-event-id={event.id}
                  key={event.id}
                >
                  <img
                    src={withArchivePoster(event.image)}
                    width={event.width}
                    height={event.height}
                    alt=""
                    style={{ "--archive-event-focus": event.focus }}
                    draggable="false"
                    loading={selectedEvent.id === event.id ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={selectedEvent.id === event.id ? "high" : "low"}
                  />
                  <span>
                    <time>{formatArchiveDate(event.startDate)}</time>
                    <b>{event.title}</b>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
