import { useEffect, useRef, useState } from "react";
import { ArchiveYearPage } from "./ArchiveYearPage.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { archiveDramasByYear, archiveRepresentativeIds, archiveYearList } from "./data/archive-dramas.js";
import "./archive-page.css";

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const withArchivePoster = (path) => `${withBase(path)}?v=20260902-hd`;

const archiveYears = archiveYearList.map((year) => {
  const dramas = archiveDramasByYear[year];
  const representative = dramas.find((drama) => drama.id === archiveRepresentativeIds[year]) || dramas[0];
  return { year, count: dramas.length, ...representative };
});

const cornerRolls = [
  { id: "freenbecky", image: "assets/home/freenbecky-card-v1.webp", width: 1000, height: 667 },
  { id: "lingorm", image: "assets/home/lingorm-card-v1.webp", width: 1000, height: 1000 },
  { id: "emibonnie", image: "assets/home/emibonnie-card-v1.webp", width: 1000, height: 667 },
  { id: "janjingjing", image: "assets/home/janjingjing-card-v1.webp", width: 1000, height: 914 },
];

export function ArchivePage() {
  const [, year, eventId] = window.location.hash.replace(/^#\/?/, "").split("/");
  return year ? <ArchiveYearPage year={year} eventId={eventId} /> : <ArchiveOverview />;
}

function ArchiveOverview() {
  const [activeIndex, setActiveIndex] = useState(2);
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const selectRoll = (index, shouldScroll = true) => {
    const nextIndex = Math.max(0, Math.min(archiveYears.length - 1, index));
    setActiveIndex(nextIndex);
    if (shouldScroll) {
      const track = trackRef.current;
      const target = track?.querySelector(`[data-roll-index="${nextIndex}"]`);
      if (track && target) {
        track.scrollTo({
          left: Math.max(0, target.offsetLeft - (track.clientWidth - target.clientWidth) / 2),
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const track = trackRef.current;
      const target = track?.querySelector(`[data-roll-index="${activeIndex}"]`);
      if (track && target) {
        track.scrollLeft = Math.max(0, target.offsetLeft - (track.clientWidth - target.clientWidth) / 2);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const startDrag = (event) => {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { active: true, startX: event.clientX, startScroll: track.scrollLeft, moved: false };
    track.setPointerCapture(event.pointerId);
    track.classList.add("is-dragging");
  };

  const dragRoll = (event) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 6) dragRef.current.moved = true;
    track.scrollLeft = dragRef.current.startScroll - delta;
  };

  const endDrag = (event) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.classList.remove("is-dragging");

    // Pointer capture keeps dragging reliable, but it can retarget the final
    // click to the film track. Resolve a stationary pointer release back to
    // the frame underneath so a normal click still opens the year.
    if (!wasMoved) {
      const frame = document.elementFromPoint(event.clientX, event.clientY)?.closest(".archive-film-frame");
      const index = Number(frame?.dataset.rollIndex);
      if (frame && Number.isInteger(index)) {
        selectRoll(index, false);
        window.location.hash = `#/archive/${archiveYears[index].year}`;
      }
    }
  };

  return (
    <main className="archive-page">
      <SiteHeader activePath="archive" />
      <section className="archive-stage" aria-labelledby="archive-title">
        <div className="archive-corner-collages" aria-hidden="true">
          {cornerRolls.map((roll, index) => (
            <img
              className={`archive-corner-card archive-corner-card-${index + 1}`}
              src={withArchivePoster(roll.image)}
              width={roll.width}
              height={roll.height}
              alt=""
              loading="eager"
              decoding="async"
              fetchPriority={index < 2 ? "high" : "auto"}
              data-page-critical="true"
              key={roll.id}
            />
          ))}
        </div>

        <header className="archive-masthead">
          <div className="archive-title-doodles" aria-hidden="true">
            <img className="archive-doodle-image archive-doodle-loop" src={withBase("assets/about/annotation-loop-arrow-v1.webp")} alt="" />
            <img className="archive-doodle-image archive-doodle-accent" src={withBase("assets/about/annotation-loop-arrow-v1.webp")} alt="" />
            <img className="archive-doodle-image archive-doodle-heart-one" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" />
            <img className="archive-doodle-image archive-doodle-heart-two" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" />
          </div>
          <h1 id="archive-title">
            <span aria-hidden="true">
              {["考", "古", "档", "案"].map((character) => <i key={character}>{character}</i>)}
            </span>
            <strong>PIT ARCHIVE</strong>
          </h1>
          <p><span>拖动胶卷，翻出那些</span><em>心动时刻</em><span>。</span></p>
        </header>

        <div className="archive-film-heading">
          <span>按年份归档</span>
          <p aria-live="polite">
            <span>当前年份</span>
            <strong>{archiveYears[activeIndex].year}</strong>
            <b>{String(activeIndex + 1).padStart(2, "0")} / {String(archiveYears.length).padStart(2, "0")}</b>
          </p>
        </div>

        <div className="archive-film-shell">
          <div
            className="archive-film-track"
            ref={trackRef}
            onPointerDown={startDrag}
            onPointerMove={dragRoll}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            aria-label="泰百剧集年度胶卷"
          >
            {archiveYears.map((roll, index) => (
              <button
                className={`archive-film-frame${activeIndex === index ? " is-active" : ""}`}
                type="button"
                data-roll-index={index}
                aria-pressed={activeIndex === index}
                onClick={() => {
                  if (!dragRef.current.moved) {
                    selectRoll(index, false);
                    window.location.hash = `#/archive/${roll.year}`;
                  }
                  dragRef.current.moved = false;
                }}
                key={roll.year}
              >
                <span className="archive-film-photo">
                  <img
                    src={withArchivePoster(roll.image)}
                    width={roll.width}
                    height={roll.height}
                    alt={`${roll.year} 年代表剧集《${roll.title}》封面`}
                    style={{ "--archive-focus": roll.focus }}
                    draggable="false"
                    loading="eager"
                    decoding="async"
                    fetchPriority={index === activeIndex ? "high" : "auto"}
                    data-page-critical="true"
                  />
                </span>
                <span className="archive-year-stamp">
                  <b>ARCHIVE YEAR</b>
                  <strong>{roll.year}</strong>
                  <small>{roll.count} 部剧集</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
