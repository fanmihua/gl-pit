import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import neteasePlaylist from "./data/netease-playlist.json";
import { nextSequentialTrack, nextStationTrack, tracksForStation, trackSwitchMode } from "./data/pit-radio-playback.js";

import { pitRadioTrackCatalog, pitRadioStations } from "./features/radio/radio-catalog.js";

export { pitRadioTrackCatalog, pitRadioStations } from "./features/radio/radio-catalog.js";

const PitRadioContext = createContext(null);

export function PitRadioProvider({ children }) {
  const [radioActivated, setRadioActivated] = useState(() => window.location.hash.startsWith("#/radio"));
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [playbackPhase, setPlaybackPhase] = useState("idle");
  const [playerError, setPlayerError] = useState(false);
  const [needleDown, setNeedleDown] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [guideStep, setGuideStep] = useState(1);
  const audioRef = useRef(null);
  const selectedTrackRef = useRef(null);
  const guideTimerRef = useRef(null);

  const selectedTrack = useMemo(
    () => pitRadioTrackCatalog.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId],
  );
  const selectedStation = useMemo(
    () => pitRadioStations.find((station) => station.id === selectedTrack?.cpId) ?? null,
    [selectedTrack],
  );
  const selectedId = selectedTrack?.cpId;
  const stationTracks = tracksForStation(pitRadioTrackCatalog, selectedId);
  const stationTrackPosition = stationTracks.findIndex((track) => track.id === selectedTrackId) + 1;
  const playerReady = radioActivated;

  useEffect(() => {
    if (radioActivated) return undefined;
    const activateOnRadioRoute = () => {
      if (window.location.hash.startsWith("#/radio")) setRadioActivated(true);
    };
    window.addEventListener("hashchange", activateOnRadioRoute);
    activateOnRadioRoute();
    return () => window.removeEventListener("hashchange", activateOnRadioRoute);
  }, [radioActivated]);

  useEffect(() => () => window.clearTimeout(guideTimerRef.current), []);

  const prepareAudio = (track) => {
    const audio = audioRef.current;
    if (!audio || !track?.audioUrl) return null;
    if (audio.dataset.trackId !== track.id) {
      audio.src = track.audioUrl;
      audio.dataset.trackId = track.id;
      audio.load();
    }
    return audio;
  };

  const playAudio = (track) => {
    const audio = prepareAudio(track);
    if (!audio) return;
    const playPromise = audio.play();
    playPromise?.catch((error) => {
      if (error?.name === "AbortError") return;
      if (selectedTrackRef.current?.id !== track.id) return;
      setPlayerError(true);
      setNeedleDown(false);
      setGuideStep(2);
      setPlaybackPhase("idle");
    });
  };

  const chooseTrack = (trackId, { autoPlay = false } = {}) => {
    const track = pitRadioTrackCatalog.find((item) => item.id === trackId);
    if (!track) return;
    if (track.id === selectedTrackRef.current?.id) return;

    const { keepNeedle, resume } = trackSwitchMode(
      selectedTrackRef.current, track, needleDown, audioRef.current?.paused ?? true,
    );
    const shouldPlay = resume || (autoPlay && keepNeedle);

    window.clearTimeout(guideTimerRef.current);
    audioRef.current?.pause();
    selectedTrackRef.current = track;
    setSelectedTrackId(trackId);
    setPlayerError(false);
    setNeedleDown(keepNeedle);
    setGuideStep(keepNeedle ? 0 : 2);
    setPlaybackPhase(shouldPlay ? "cueing" : "idle");
    prepareAudio(track);
    if (shouldPlay) playAudio(track);
  };

  const chooseStation = (stationId) => {
    const station = pitRadioStations.find((item) => item.id === stationId);
    if (!station) return;
    if (station.id === selectedTrackRef.current?.cpId) return;
    chooseTrack(station.firstTrackId);
  };

  const stepStation = (offset) => {
    const next = nextStationTrack(pitRadioTrackCatalog, selectedTrackRef.current, offset);
    if (next) chooseTrack(next.id);
  };

  const lowerNeedle = () => {
    const track = selectedTrackRef.current;
    if (!track || !playerReady || needleDown) return;
    setPlayerError(false);
    setNeedleDown(true);
    setPlaybackPhase("cueing");
    setGuideStep(3);
    window.clearTimeout(guideTimerRef.current);
    guideTimerRef.current = window.setTimeout(() => setGuideStep(0), 3200);
    playAudio(track);
  };

  const togglePlayback = () => {
    if (!playerReady || !selectedTrackRef.current) return;
    if (!needleDown) {
      lowerNeedle();
      return;
    }
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.pause();
    else playAudio(selectedTrackRef.current);
  };

  const handleAudioPlaying = () => {
    setPlayerError(false);
    setPlaybackPhase("playing");
  };

  const handleAudioPause = () => {
    if (audioRef.current?.paused) setPlaybackPhase("idle");
  };

  const handleAudioEnded = () => {
    if (repeatOne) return;
    const next = nextSequentialTrack(pitRadioTrackCatalog, selectedTrackRef.current);
    if (next && needleDown) chooseTrack(next.id, { autoPlay: true });
    else setPlaybackPhase("idle");
  };

  const handleAudioError = () => {
    setPlayerError(true);
    setNeedleDown(false);
    setGuideStep(2);
    setPlaybackPhase("idle");
  };

  const value = {
    stations: pitRadioStations,
    tracks: pitRadioTrackCatalog,
    selectedId,
    selectedStation,
    selectedTrack,
    stationTracks,
    stationTrackPosition,
    playlistMeta: {
      id: neteasePlaylist.playlistId,
      name: neteasePlaylist.name,
      trackCount: pitRadioTrackCatalog.length,
      playableCount: pitRadioTrackCatalog.length,
    },
    radioActivated,
    playbackPhase,
    playerReady,
    playerError,
    needleDown,
    repeatOne,
    toggleRepeatOne: () => setRepeatOne((enabled) => !enabled),
    guideStep,
    chooseStation,
    chooseTrack,
    stepStation,
    lowerNeedle,
    togglePlayback,
  };

  return (
    <PitRadioContext.Provider value={value}>
      {radioActivated && (
        <audio
          className="pit-radio-global-audio"
          ref={audioRef}
          preload="metadata"
          loop={repeatOne}
          onPlay={() => setPlaybackPhase("cueing")}
          onPlaying={handleAudioPlaying}
          onCanPlay={() => {
            if (needleDown && !audioRef.current?.paused) setPlaybackPhase("playing");
          }}
          onWaiting={() => setPlaybackPhase("cueing")}
          onPause={handleAudioPause}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
        />
      )}
      {children}
    </PitRadioContext.Provider>
  );
}

export function usePitRadio() {
  const context = useContext(PitRadioContext);
  if (!context) throw new Error("usePitRadio must be used within PitRadioProvider");
  return context;
}
