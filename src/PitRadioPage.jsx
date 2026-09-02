import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowSquareOut,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "@phosphor-icons/react";
import { usePitRadio } from "./PitRadioContext.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { PIT_RADIO_GEOMETRY } from "./data/pit-radio-geometry.js";

const withBase = (path) => /^https?:\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const neteasePlaylistUrl = "https://music.163.com/playlist?id=17374864309";

function getPointerDistance(point, target) {
  return Math.hypot(point.x - target.x, point.y - target.y);
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];

    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-9) return null;
    for (let index = column; index <= size; index += 1) augmented[column][index] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

function getFourCornerMatrix(width, height, corners) {
  const source = [[0, 0], [width, 0], [width, height], [0, height]];
  const matrix = [];
  const vector = [];

  source.forEach(([x, y], index) => {
    const [targetX, targetY] = corners[index];
    matrix.push([x, y, 1, 0, 0, 0, -targetX * x, -targetX * y]);
    vector.push(targetX);
    matrix.push([0, 0, 0, x, y, 1, -targetY * x, -targetY * y]);
    vector.push(targetY);
  });

  const values = solveLinearSystem(matrix, vector);
  if (!values) return "none";
  const [a, b, c, d, e, f, g, h] = values;
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}

function useProjectedPlayer(turntableRef) {
  const [style, setStyle] = useState({ opacity: 0 });

  useLayoutEffect(() => {
    const turntable = turntableRef.current;
    if (!turntable) return undefined;

    const update = () => {
      // Project in the turntable's own 1535×1024 coordinate plane.
      // getBoundingClientRect() includes the outer tilt/scale and would apply
      // that perspective twice, which is what caused the screen to drift.
      const width = turntable.clientWidth;
      const height = turntable.clientHeight;
      const scaleX = width / PIT_RADIO_GEOMETRY.canvas.width;
      const scaleY = height / PIT_RADIO_GEOMETRY.canvas.height;
      const player = PIT_RADIO_GEOMETRY.player;
      const flatWidth = player.flatWidth * scaleX;
      const flatHeight = player.flatHeight * scaleY;
      const corners = player.corners.map(([x, y]) => [
        x * scaleX + player.offsetX,
        y * scaleY + player.offsetY,
      ]);
      corners[1][0] += player.expandRight;
      corners[2][0] += player.expandRight;
      corners[2][1] += player.expandBottom;
      corners[3][1] += player.expandBottom;

      setStyle({
        width: `${flatWidth}px`,
        height: `${flatHeight}px`,
        opacity: 1,
        transform: getFourCornerMatrix(flatWidth, flatHeight, corners),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(turntable);
    return () => observer.disconnect();
  }, [turntableRef]);

  return style;
}

export function PitRadioPage() {
  const [drag, setDrag] = useState(null);
  const [tonearmDrag, setTonearmDrag] = useState(null);
  const turntableRef = useRef(null);
  const platterRef = useRef(null);
  const tonearmDragRef = useRef(null);
  const playerStyle = useProjectedPlayer(turntableRef);
  const {
    stations,
    selectedId,
    selectedTrack,
    playlistMeta,
    playbackPhase,
    playerReady,
    playerError,
    needleDown,
    guideStep,
    chooseStation: tuneStation,
    stepStation,
    lowerNeedle: playFromNeedle,
    togglePlayback,
  } = usePitRadio();

  const chooseStation = (stationId) => {
    setDrag(null);
    setTonearmDrag(null);
    tonearmDragRef.current = null;
    tuneStation(stationId);
  };

  const lowerNeedle = () => {
    setTonearmDrag(null);
    tonearmDragRef.current = null;
    playFromNeedle();
  };

  const handleTonearmPointerDown = (event) => {
    if (needleDown || !playerReady || playerError || guideStep === 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const platter = platterRef.current?.getBoundingClientRect();
    const target = platter
      ? { x: platter.left + platter.width / 2, y: platter.top + platter.height / 2 }
      : { x: event.clientX - 1, y: event.clientY + 1 };
    const nextDrag = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      target,
      startDistance: getPointerDistance({ x: event.clientX, y: event.clientY }, target),
      progress: 0,
      moved: 0,
    };
    tonearmDragRef.current = nextDrag;
    setTonearmDrag(nextDrag);
  };

  const handleTonearmPointerMove = (event) => {
    const current = tonearmDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    const distance = getPointerDistance(point, current.target);
    const platterWidth = platterRef.current?.getBoundingClientRect().width ?? 240;
    const magneticDistance = platterWidth * 0.58;
    const travel = Math.max(current.startDistance - magneticDistance, 1);
    const progress = Math.min(1, Math.max(0, (current.startDistance - distance) / travel));
    const nextDrag = {
      ...current,
      progress,
      moved: Math.hypot(event.clientX - current.originX, event.clientY - current.originY),
    };
    tonearmDragRef.current = nextDrag;
    setTonearmDrag(nextDrag);
  };

  const handleTonearmPointerUp = (event) => {
    const current = tonearmDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const platterWidth = platterRef.current?.getBoundingClientRect().width ?? 240;
    const isInsideMagneticZone = getPointerDistance(
      { x: event.clientX, y: event.clientY },
      current.target,
    ) <= platterWidth * 0.68;
    const shouldLower = current.moved < 7 || current.progress >= 0.58 || isInsideMagneticZone;
    tonearmDragRef.current = null;
    setTonearmDrag(null);
    if (shouldLower) lowerNeedle();
  };

  const handlePointerDown = (event, stationId) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      stationId,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      x: 0,
      y: 0,
    });
  };

  const handlePointerMove = (event) => {
    setDrag((current) => {
      if (!current || current.pointerId !== event.pointerId) return current;
      return {
        ...current,
        x: event.clientX - current.originX,
        y: event.clientY - current.originY,
      };
    });
  };

  const handlePointerUp = (event, stationId) => {
    const platter = platterRef.current?.getBoundingClientRect();
    const pointer = { x: event.clientX, y: event.clientY };
    const target = platter
      ? { x: platter.left + platter.width / 2, y: platter.top + platter.height / 2 }
      : pointer;
    const moved = drag ? Math.hypot(drag.x, drag.y) : 0;
    const dropThreshold = platter ? Math.max(platter.width * 0.42, 120) : 120;

    if (moved < 7) {
      chooseStation(stationId);
    } else if (getPointerDistance(pointer, target) <= dropThreshold) {
      chooseStation(stationId);
    } else {
      setDrag(null);
    }
  };

  return (
    <main className="pit-radio-shell">
      <SiteHeader activePath="radio" />

      <section className="pit-radio-stage" aria-labelledby="pit-radio-title">
        <div className="pit-radio-copy">
          <h1 id="pit-radio-title" aria-label="坑底电台 PIT FM">
            <span className="pit-radio-cn-title">坑底电台</span>
            <span className="pit-radio-en-title"><b>PIT</b><b>FM</b></span>
          </h1>
          <p className="pit-radio-manifesto">
            把她们放上唱片，<em>放下唱针。</em>
          </p>
          <p className="pit-radio-side-note">PIT RADIO<br />ON AIR 24/7</p>
        </div>

        <div className="pit-radio-howto" aria-label="坑底电台玩法说明">
          <img src={withBase("assets/pit-radio/how-to-paper-v3.webp")} alt="" aria-hidden="true" decoding="async" data-page-critical="true" />
          <ol>
            <li><strong>选一张 CP 贴纸</strong><span>点按，或拖到唱片中央</span></li>
            <li><strong>唱片等待落针</strong><span>歌曲信号已经接通</span></li>
            <li><strong>转动唱针</strong><span>放到唱片上开始播放</span></li>
          </ol>
        </div>

        <div className="pit-radio-console">
          <div className="pit-radio-machine-stack">
            <img
              className="pit-radio-broadcast-card"
              src={withBase("assets/pit-radio/pit-fm-broadcast-card-v1.webp")}
              alt="PIT FM 坑底广播卡"
              decoding="async"
              data-page-critical="true"
            />

            <div
              className={`pit-radio-turntable is-${playbackPhase}${needleDown ? " has-needle-down" : ""}${tonearmDrag ? " is-dragging-tonearm" : ""}`}
              ref={turntableRef}
              aria-label={`当前调频：${selectedTrack.cpName}，${selectedTrack.trackTitle}`}
              style={{
                "--tonearm-rest-angle": `${PIT_RADIO_GEOMETRY.tonearm.restAngle}deg`,
                "--tonearm-play-angle": `${PIT_RADIO_GEOMETRY.tonearm.playAngle}deg`,
                "--tonearm-angle": `${PIT_RADIO_GEOMETRY.tonearm.restAngle + (tonearmDrag?.progress ?? 0) * (PIT_RADIO_GEOMETRY.tonearm.playAngle - PIT_RADIO_GEOMETRY.tonearm.restAngle)}deg`,
              }}
              onPointerMove={handleTonearmPointerMove}
              onPointerUp={handleTonearmPointerUp}
              onPointerCancel={() => {
                tonearmDragRef.current = null;
                setTonearmDrag(null);
              }}
            >
            <div className="pit-radio-record-plane" ref={platterRef}>
              <div className="pit-radio-record-spin">
                <div className="pit-radio-vinyl" role="img" aria-label="黑胶唱片">
                  <span className="pit-radio-vinyl-texture" aria-hidden="true" />
                </div>
                <img
                  key={selectedTrack.id}
                  className="pit-radio-center-sticker"
                  src={withBase(selectedTrack.cpArtwork)}
                  alt={`${selectedTrack.cpName} 已贴在黑胶中央`}
                  decoding="async"
                  data-page-critical="true"
                />
              </div>
            </div>
            <img
              className="pit-radio-chassis"
              src={withBase("assets/pit-radio/turntable-chassis-record-backing-v3.webp")}
              alt="黑色撕纸边坑底唱机"
              decoding="async"
              fetchPriority="high"
              data-page-critical="true"
            />
            <span className="pit-radio-platter-rim" aria-hidden="true" />

            <div className="pit-radio-player-slot" style={playerStyle}>
              <div className={`pit-radio-player-guide${guideStep === 3 ? " is-visible" : ""}`} aria-hidden="true">
                <b>03</b>
                <span>{playbackPhase === "playing" ? "正在播放" : "接通信号中"}</span>
              </div>
              <div className="pit-radio-player-pending" role="group" aria-label={`${selectedTrack.cpName} 网易云歌曲播放器`}>
                  <div className="pit-radio-track-cover">
                    <img src={selectedTrack.cover} alt={`${selectedTrack.trackTitle} 歌曲封面`} decoding="async" fetchPriority="high" data-page-critical="true" />
                  </div>
                  <div className="pit-radio-track-copy">
                    <span>{`NETEASE PLAYLIST · ${selectedTrack.playlistPosition}/${playlistMeta.trackCount}`}</span>
                    <strong>{selectedTrack.trackTitle}</strong>
                    <small>{playerError ? "站内播放暂不可用" : playerReady ? needleDown ? `${selectedTrack.cpName} · ${selectedTrack.trackArtist}` : `等待唱针落下 · ${selectedTrack.cpName}` : "网易云音源加载中…"}</small>
                    <i aria-hidden="true" />
                  </div>
                  <div className="pit-radio-controls">
                    <button type="button" onClick={() => stepStation(-1)} aria-label="上一首歌">
                      <SkipBack weight="fill" />
                    </button>
                    <button
                      className="pit-radio-play"
                      type="button"
                      onClick={togglePlayback}
                      disabled={!playerReady || !needleDown}
                      aria-label={!needleDown ? "请先放下唱针" : playbackPhase !== "idle" ? "暂停音乐" : "播放音乐"}
                    >
                      {playbackPhase !== "idle" ? <Pause weight="fill" /> : <Play weight="fill" />}
                    </button>
                    <button type="button" onClick={() => stepStation(1)} aria-label="下一首歌">
                      <SkipForward weight="fill" />
                    </button>
                  </div>
                </div>
            </div>
            <img
              className="pit-radio-tonearm"
              src={withBase("assets/pit-radio/turntable-tonearm-v2.webp")}
              alt=""
              aria-hidden="true"
              decoding="async"
              data-page-critical="true"
            />
            <button
              className="pit-radio-tonearm-control"
              type="button"
              aria-label={needleDown ? "唱针已放下" : "拖动或点按唱针开始播放"}
              disabled={!playerReady || playerError || needleDown || guideStep === 1}
              onPointerDown={handleTonearmPointerDown}
              onPointerMove={handleTonearmPointerMove}
              onPointerUp={handleTonearmPointerUp}
              onPointerCancel={() => {
                tonearmDragRef.current = null;
                setTonearmDrag(null);
              }}
            />
            <div className={`pit-radio-needle-guide${guideStep === 2 && !needleDown ? " is-visible" : ""}`} aria-hidden="true">
              <p><b>02</b>转动唱针<br /><span>DROP THE NEEDLE</span></p>
              <svg viewBox="0 0 110 90" role="presentation">
                <path d="M105 79 C78 78 51 65 27 34" />
                <path d="M32 51 L27 34 L44 38" />
              </svg>
            </div>
            </div>

            <div className="pit-radio-stations" aria-label="选择一对 CP 调频">
              {stations.map((station) => {
                const isDragging = drag?.stationId === station.id;
                return (
                  <button
                    className={`pit-radio-station ${station.position}${selectedId === station.id ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
                    key={station.id}
                    type="button"
                    aria-pressed={selectedId === station.id}
                    aria-label={`选择 ${station.name} 的 ${station.trackCount} 首歌曲`}
                    onPointerDown={(event) => handlePointerDown(event, station.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => handlePointerUp(event, station.id)}
                    onPointerCancel={() => setDrag(null)}
                    style={isDragging ? { "--drag-x": `${drag.x}px`, "--drag-y": `${drag.y}px` } : undefined}
                  >
                    <img src={withBase(station.sticker)} alt="" draggable="false" loading="eager" decoding="async" fetchPriority={selectedId === station.id ? "high" : "auto"} data-page-critical="true" />
                    <span>{station.trackCount} TRACKS</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`pit-radio-drop-label${guideStep === 1 ? " is-visible" : ""}`} aria-hidden="true">
            <p><b>01</b>贴纸吸附处<br /><span>DROP CP HERE</span></p>
            <svg className="pit-radio-drop-arrow" viewBox="0 0 100 44" role="presentation">
              <path className="pit-radio-drop-arrow-ghost" d="M3 39 C33 39 57 41 75 28 C84 22 89 14 92 5" />
              <path d="M3 37 C32 38 57 39 75 27 C84 21 89 13 92 4" />
              <path d="M82 7 L92 4 L93 14" />
            </svg>
          </div>

        </div>

        <p className="pit-radio-source-note">
          <span>网易云歌单音源 · 权利归原权利人</span>
          <a className="pit-radio-playlist-link" href={neteasePlaylistUrl} target="_blank" rel="noreferrer">
            网易云完整歌单 <ArrowSquareOut aria-hidden="true" />
          </a>
          <a href={selectedTrack.officialUrl} target="_blank" rel="noreferrer">
            播放异常时打开歌曲页面 <ArrowSquareOut aria-hidden="true" />
          </a>
        </p>
      </section>
    </main>
  );
}
