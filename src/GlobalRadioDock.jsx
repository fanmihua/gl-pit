import { t } from "./i18n/runtime.js";
import { withBase } from "./lib/assets.js";
import { Pause, Play } from "@phosphor-icons/react";
import { usePitRadio } from "./PitRadioContext.jsx";


export function GlobalRadioDock({ hidden = false }) {
  const {
    selectedTrack,
    radioActivated,
    playbackPhase,
    playerReady,
    playerError,
    needleDown,
    togglePlayback,
  } = usePitRadio();

  if (hidden || !radioActivated) return null;

  const playbackActive = needleDown && playbackPhase !== "idle";

  const handleClick = () => {
    if (needleDown) {
      togglePlayback();
      return;
    }
    window.location.hash = "#/radio";
  };

  return (
    <button
      className={`pit-radio-floating-record is-${playbackPhase}`}
      type="button"
      onClick={handleClick}
      disabled={needleDown && (!playerReady || playerError)}
      aria-label={t(!needleDown ? "返回坑底电台放下唱针" : playbackActive ? "暂停音乐" : "继续播放音乐")}
    >
      <span className="pit-radio-floating-disc" aria-hidden="true">
        {t(selectedTrack && <img src={withBase(selectedTrack.cpArtwork)} alt="" />)}
      </span>
      <span className="pit-radio-floating-action" aria-hidden="true">
        {t(playbackActive ? <Pause weight="fill" /> : <Play weight="fill" />)}
      </span>
    </button>
  );
}
