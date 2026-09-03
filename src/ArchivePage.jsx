import { withBase } from "./lib/assets.js";
import { useEffect, useRef, useState } from "react";
import { useMobileLayout } from "./hooks/useMobileLayout.js";
import { ArchiveYearPage } from "./ArchiveYearPage.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { archiveDramasByYear, archiveRepresentativeIds, archiveYearList } from "./data/archive-dramas.js";
import "./archive-page.css";

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
  const isMobile = useMobileLayout();
  const [activeIndex, setActiveIndex] = useState(2);
  const activeIndexRef = useRef(2);
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startScroll: 0, moved: false, nativeTouch: false });
  const scrollFrameRef = useRef(0);
  const lastScrollAtRef = useRef(-Infinity);

  const selectRoll = (index, shouldScroll = true) => {
    const nextIndex = Math.max(0, Math.min(archiveYears.length - 1, index));
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    if (shouldScroll) {
      const track = trackRef.current;
      const target = track?.querySelector(`[data-roll-index="${nextIndex}"]`);
      if (track && target) {
        track.scrollTo({
          left: track.scrollLeft + target.getBoundingClientRect().left + target.clientWidth / 2 - track.getBoundingClientRect().left - track.clientWidth / 2,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let layoutFrame = 0;
    let lastWidth = -1;
    const centerCurrentRoll = () => {
      window.cancelAnimationFrame(layoutFrame);
      layoutFrame = window.requestAnimationFrame(() => {
        const target = track.querySelector(`[data-roll-index="${activeIndexRef.current}"]`);
        if (!target) return;
        const targetRect = target.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        track.scrollTo({
          left: track.scrollLeft + targetRect.left + targetRect.width / 2 - trackRect.left - trackRect.width / 2,
          behavior: "instant",
        });
      });
    };
    // Keep the same year centered when rotating a phone or resizing the preview.
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== lastWidth) {
        lastWidth = entry.contentRect.width;
        centerCurrentRoll();
      }
    });
    observer.observe(track);
    centerCurrentRoll();
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = 0;
    };
  }, [isMobile]);

  const syncVisibleRoll = () => {
    if (!isMobile) return;
    lastScrollAtRef.current = performance.now();
    if (scrollFrameRef.current) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      const track = trackRef.current;
      if (!track) return;
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      for (const frame of track.querySelectorAll(".archive-film-frame")) {
        const rect = frame.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = Number(frame.dataset.rollIndex);
        }
      }
      activeIndexRef.current = nearestIndex;
      setActiveIndex(nearestIndex);
    });
  };

  const startDrag = (event) => {
    const track = trackRef.current;
    if (!track || !event.isPrimary || event.button !== 0) return;
    const nativeTouch = isMobile && event.pointerType !== "mouse";
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startScroll: track.scrollLeft,
      // A tap during a fling stops it without accidentally opening a year.
      moved: nativeTouch && performance.now() - lastScrollAtRef.current < 140,
      nativeTouch,
    };
    if (nativeTouch) return;
    track.setPointerCapture(event.pointerId);
    track.classList.add("is-dragging");
  };

  const dragRoll = (event) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.hypot(delta, event.clientY - dragRef.current.startY) > 6) dragRef.current.moved = true;
    if (dragRef.current.nativeTouch) return;
    track.scrollLeft = dragRef.current.startScroll - delta;
  };

  const endDrag = (event) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (dragRef.current.nativeTouch) return;
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

  const cancelDrag = (event) => {
    // Native touch scrolling cancels the pointer stream; cancellation is never a tap.
    dragRef.current.active = false;
    dragRef.current.moved = true;
    const track = trackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track?.classList.remove("is-dragging");
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
            onPointerCancel={cancelDrag}
            onScroll={syncVisibleRoll}
            aria-label="泰百剧集年度胶卷"
          >
            {archiveYears.map((roll, index) => (
              <button
                className={`archive-film-frame${activeIndex === index ? " is-active" : ""}`}
                type="button"
                data-roll-index={index}
                aria-pressed={activeIndex === index}
                onClick={(event) => {
                  if (event.detail === 0 || !dragRef.current.moved) {
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
