import { withBase } from "./lib/assets.js";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowSquareOut,
  ListNumbers,
  Pause,
  Play,
  Playlist,
  RepeatOnce,
  SkipBack,
  SkipForward,
  X,
} from "@phosphor-icons/react";
import { useProjectedPlayer } from "./features/radio/useProjectedPlayer.js";
import { MobileRadioHelp, RadioHowToContent } from "./features/radio/RadioHowTo.jsx";
import { useMobileLayout } from "./hooks/useMobileLayout.js";
import { usePitRadio } from "./PitRadioContext.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { PIT_RADIO_GEOMETRY } from "./data/pit-radio-geometry.js";

const neteasePlaylistUrl = "https://music.163.com/playlist?id=17374864309";

function getPointerDistance(point, target) {
  return Math.hypot(point.x - target.x, point.y - target.y);
}

export function PitRadioPage() {
  const isMobile = useMobileLayout();
  const [drag, setDrag] = useState(null);
  const [tonearmDrag, setTonearmDrag] = useState(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const playlistRef = useRef(null);
  const playlistToggleRef = useRef(null);
  const playlistCloseRef = useRef(null);
  const turntableRef = useRef(null);
  const platterRef = useRef(null);
  const tonearmDragRef = useRef(null);
  const stationDragRef = useRef(null);
  const suppressStationClick = useRef(false);
  const suppressNeedleClick = useRef(false);
  const playerStyle = useProjectedPlayer(turntableRef);
  const {
    stations,
    selectedId,
    selectedTrack,
    selectedStation,
    stationTracks,
    stationTrackPosition,
    playbackPhase,
    playerReady,
    playerError,
    needleDown,
    repeatOne,
    toggleRepeatOne,
    guideStep,
    chooseStation: tuneStation,
    chooseTrack,
    stepStation,
    lowerNeedle: playFromNeedle,
    togglePlayback,
  } = usePitRadio();

  useLayoutEffect(() => {
    const dialog = playlistRef.current;
    if (!playlistOpen || !dialog) return undefined;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousPadding = root.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    if (scrollbarWidth > 0) {
      root.style.paddingRight = `${parseFloat(getComputedStyle(root).paddingRight) + scrollbarWidth}px`;
    }
    root.style.overflow = "hidden";
    dialog.showModal();
    playlistCloseRef.current?.focus({ preventScroll: true });

    return () => {
      root.style.overflow = previousOverflow;
      root.style.paddingRight = previousPadding;
      dialog.close();
      playlistToggleRef.current?.focus({ preventScroll: true });
    };
  }, [playlistOpen]);

  const togglePlaylist = () => {
    setPlaylistOpen((open) => !open);
  };

  const chooseFromPlaylist = (trackId) => {
    chooseTrack(trackId);
    setPlaylistOpen(false);
  };

  const handlePlaylistKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll("button:not(:disabled)");
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

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
    if (needleDown || !playerReady || !selectedTrack) return;
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
    suppressNeedleClick.current = false;
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
    suppressNeedleClick.current = current.moved >= 7;
    if (current.moved >= 7 && shouldLower) lowerNeedle();
  };

  const handlePointerDown = (event, stationId) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    suppressStationClick.current = false;
    const nextDrag = {
      stationId,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      x: 0,
      y: 0,
    };
    stationDragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const handlePointerMove = (event) => {
    const current = stationDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const nextDrag = {
      ...current,
      x: event.clientX - current.originX,
      y: event.clientY - current.originY,
    };
    stationDragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const handlePointerUp = (event, stationId) => {
    const platter = platterRef.current?.getBoundingClientRect();
    const pointer = { x: event.clientX, y: event.clientY };
    const target = platter
      ? { x: platter.left + platter.width / 2, y: platter.top + platter.height / 2 }
      : pointer;
    const current = stationDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - current.originX, event.clientY - current.originY);
    stationDragRef.current = null;
    const dropThreshold = platter ? Math.max(platter.width * 0.42, 120) : 120;

    suppressStationClick.current = moved >= 7;
    if (moved >= 7 && getPointerDistance(pointer, target) <= dropThreshold) {
      chooseStation(stationId);
    } else {
      setDrag(null);
    }
  };

  const playerActions = (
    <div className="pit-radio-player-actions">
      <div className="pit-radio-controls">
        <button type="button" disabled={stationTracks.length < 2} onClick={() => stepStation(-1)} aria-label="上一首歌">
          <SkipBack weight="fill" />
        </button>
        <button
          className="pit-radio-play"
          type="button"
          onClick={togglePlayback}
          disabled={!playerReady || !selectedTrack}
          aria-label={!selectedTrack ? "请先选择 CP" : !needleDown ? "落针播放" : playbackPhase !== "idle" ? "暂停音乐" : "播放音乐"}
        >
          {playbackPhase !== "idle" ? <Pause weight="fill" /> : <Play weight="fill" />}
        </button>
        <button type="button" disabled={stationTracks.length < 2} onClick={() => stepStation(1)} aria-label="下一首歌">
          <SkipForward weight="fill" />
        </button>
      </div>
      <div className="pit-radio-player-options">
        <button
          type="button"
          disabled={!selectedTrack}
          onClick={toggleRepeatOne}
          aria-pressed={repeatOne}
          aria-label={repeatOne ? "单曲循环，点击切换顺序播放" : "顺序播放，点击切换单曲循环"}
          title={repeatOne ? "单曲循环 · 点击切换顺序播放" : "顺序播放 · 点击切换单曲循环"}
        >
          {repeatOne ? <RepeatOnce weight="bold" /> : <ListNumbers weight="bold" />}
        </button>
        <button
          ref={playlistToggleRef}
          type="button"
          disabled={!selectedTrack}
          onClick={togglePlaylist}
          aria-expanded={Boolean(selectedTrack && playlistOpen)}
          aria-controls="pit-radio-tracklist"
          aria-haspopup="dialog"
          aria-label={playlistOpen ? "收起播放列表" : "展开播放列表"}
          title={playlistOpen ? "收起播放列表" : "展开播放列表"}
        >
          <Playlist weight="bold" />
        </button>
      </div>
    </div>
  );

  return (
    <main className="pit-radio-shell">
      <SiteHeader activePath="radio" />

      <section className="pit-radio-stage" aria-labelledby="pit-radio-title">
        <div className="pit-radio-copy">
          <h1 id="pit-radio-title" aria-label="坑底电台 PIT FM">
            <span className="pit-radio-cn-title">坑底电台</span>
            <span className="pit-radio-en-title"><b>PIT</b><b>FM</b></span>
          </h1>
          {isMobile && <MobileRadioHelp />}
          <p className="pit-radio-manifesto">
            把她们放上唱片，<em>放下唱针。</em>
          </p>
          <p className="pit-radio-side-note">PIT RADIO<br />ON AIR 24/7</p>
        </div>

        {!isMobile && (
          <div className="pit-radio-howto" aria-label="坑底电台玩法说明"><RadioHowToContent critical /></div>
        )}

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
              aria-label={selectedTrack ? `当前调频：${selectedTrack.cpName}，${selectedTrack.trackTitle}` : "尚未选择 CP"}
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
                {selectedTrack && <img
                  key={selectedTrack.id}
                  className="pit-radio-center-sticker"
                  src={withBase(selectedTrack.cpArtwork)}
                  alt={`${selectedTrack.cpName} 已贴在黑胶中央`}
                  decoding="async"
                  data-page-critical="true"
                />}
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
                <span>{playbackPhase === "playing" ? "正在播放" : "接通信号中"}</span>
              </div>
              <div className="pit-radio-player-pending" role="group" aria-label={selectedTrack ? `${selectedTrack.cpName} 歌曲播放器` : "等待选择 CP"}>
                  <div className="pit-radio-track-cover">
                    {selectedTrack && <img src={selectedTrack.cover} alt={`${selectedTrack.trackTitle} 歌曲封面`} decoding="async" fetchPriority="high" data-page-critical="true" />}
                  </div>
                  <div className="pit-radio-track-copy">
                    <span>{selectedTrack ? `${selectedTrack.cpName} · 第 ${stationTrackPosition} / ${stationTracks.length} 首` : "PIT FM · 等你选台"}</span>
                    <strong>{selectedTrack?.trackTitle ?? "先选一对 CP"}</strong>
                    <small>{!selectedTrack ? "点一下周围的贴纸" : playerError ? "播放暂不可用 · 可以重试" : needleDown ? selectedTrack.trackArtist : "点播放，唱针会自动落下"}</small>
                    {stationTracks.length > 1 && <span className="pit-radio-switch-hint">可切换歌曲 →</span>}
                  </div>
                  {!isMobile && playerActions}
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
              disabled={!playerReady || needleDown || !selectedTrack}
              onClick={(event) => {
                if (event.detail === 0 || !suppressNeedleClick.current) lowerNeedle();
                suppressNeedleClick.current = false;
              }}
              onPointerDown={handleTonearmPointerDown}
              onPointerMove={handleTonearmPointerMove}
              onPointerUp={handleTonearmPointerUp}
              onPointerCancel={() => {
                tonearmDragRef.current = null;
                setTonearmDrag(null);
              }}
            />
            <div className={`pit-radio-needle-guide${guideStep === 2 && !needleDown ? " is-visible" : ""}`} aria-hidden="true">
              <p><b>02</b>点一下，开始播放<br /><span>也可以把唱针拖向唱片</span></p>
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
                    onClick={(event) => {
                      if (event.detail === 0 || !suppressStationClick.current) chooseStation(station.id);
                      suppressStationClick.current = false;
                    }}
                    onPointerCancel={() => { stationDragRef.current = null; setDrag(null); }}
                    style={isDragging ? { "--drag-x": `${drag.x}px`, "--drag-y": `${drag.y}px` } : undefined}
                  >
                    <img src={withBase(station.sticker)} alt="" draggable="false" loading="eager" decoding="async" fetchPriority={selectedId === station.id ? "high" : "auto"} data-page-critical="true" />
                    <span className="pit-radio-station-count" aria-hidden="true">{station.trackCount} 首歌</span>
                  </button>
                );
              })}
            </div>
          </div>
          {isMobile && <div className="pit-radio-mobile-controls" role="group" aria-label="歌曲播放控制">{playerActions}</div>}

          <div className={`pit-radio-drop-label${guideStep === 1 ? " is-visible" : ""}`} aria-hidden="true">
            <p><b>01</b>点贴纸，选她们的歌<br /><span>也可以拖入唱片</span></p>
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
        </p>
      </section>

      {selectedTrack && <dialog
        ref={playlistRef}
        id="pit-radio-tracklist"
        className="pit-radio-playlist-dialog"
        aria-labelledby="pit-radio-playlist-title"
        onKeyDown={handlePlaylistKeyDown}
        onCancel={(event) => { event.preventDefault(); setPlaylistOpen(false); }}
        onClick={(event) => { if (event.target === event.currentTarget) setPlaylistOpen(false); }}
      >
        <section className="pit-radio-playlist-drawer">
          <header className="pit-radio-playlist-header">
            <img className="pit-radio-playlist-sticker" src={withBase(selectedStation.sticker)} alt="" />
            <div>
              <span>播放列表 · {stationTracks.length} 首</span>
              <h2 id="pit-radio-playlist-title">{selectedStation.name}</h2>
            </div>
            <button className="dialog-close-button" ref={playlistCloseRef} type="button" aria-label="关闭播放列表" onClick={() => setPlaylistOpen(false)}>
              <X size={22} weight="bold" />
            </button>
          </header>
          <div className="pit-radio-tracklist" key={selectedId}>
            <ol>{stationTracks.map((track, index) => <li key={track.id}>
              <button type="button" aria-current={track.id === selectedTrack.id ? "true" : undefined} onClick={() => chooseFromPlaylist(track.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span><span>{track.trackTitle}<small>{track.trackArtist}</small></span>
              </button>
            </li>)}</ol>
          </div>
        </section>
      </dialog>}
    </main>
  );
}
