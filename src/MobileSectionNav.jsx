import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, FilmStrip, Files, ImageSquare, Pause, Play, Quotes, VinylRecord, X } from "@phosphor-icons/react";
import { MOBILE_NAVIGATION } from "./app/mobile-navigation.js";
import { mobileRadioControls } from "./app/mobile-radio-controls.js";
import { usePitRadio } from "./PitRadioContext.jsx";
import { useMobileLayout } from "./hooks/useMobileLayout.js";
import "./mobile-section-nav.css";

const icons = { "tide-words": Quotes, archive: FilmStrip, column: Files, memes: ImageSquare, radio: VinylRecord };

export function MobileSectionNav({ activePath }) {
  const radio = usePitRadio();
  const { selectedTrack, togglePlayback } = radio;
  const [tap, setTap] = useState({ id: null, count: 0 });
  const [radioOpen, setRadioOpen] = useState(false);
  const isMobile = useMobileLayout();
  const radioPanelId = useId();
  const radioPanelRef = useRef(null);
  const controls = mobileRadioControls({ ...radio, activePath });

  useEffect(() => {
    const panel = radioPanelRef.current;
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }, [activePath, isMobile]);

  return (
    <nav className="mobile-section-nav" aria-label="栏目导航">
      <div className="mobile-section-tabs">
        {MOBILE_NAVIGATION.map((item) => {
          const Icon = icons[item.id];
          const active = activePath === item.id;
          const playing = item.id === "radio" && controls.isPlaying;
          const quickControls = item.id === "radio" && controls.showQuickControls;
          const Tab = quickControls ? "button" : "a";
          return (
            <Tab
              key={item.id}
              {...(quickControls ? {
                type: "button", popoverTarget: radioPanelId,
                "aria-expanded": radioOpen, "aria-controls": radioPanelId,
              } : { href: item.href })}
              className={`mobile-section-tab mobile-section-tab--${item.id}${playing ? " is-playing" : ""}`}
              aria-label={quickControls ? `${item.label}，${controls.status}，打开播放控制` : item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => setTap((previous) => ({ id: item.id, count: previous.count + 1 }))}
            >
              <span className="mobile-tab-paper">
                <span
                  key={tap.id === item.id ? tap.count : 0}
                  className={`mobile-tab-icon${tap.id === item.id ? " is-tapped" : ""}`}
                  aria-hidden="true"
                ><Icon size={24} weight={active ? "fill" : "regular"} /></span>
                <span className="mobile-tab-label">{item.shortLabel}</span>
                {playing && <span className="mobile-tab-playing" aria-label="正在播放" />}
              </span>
            </Tab>
          );
        })}
      </div>
      <section
        id={radioPanelId}
        ref={radioPanelRef}
        popover="auto"
        className="mobile-radio-controls"
        aria-label="电台快捷控制"
        onToggle={(event) => setRadioOpen(event.newState === "open")}
      >
        <header>
          <span>坑底电台</span>
          <button className="dialog-close-button" type="button" popoverTarget={radioPanelId} popoverTargetAction="hide" aria-label="关闭电台快捷控制"><X size={20} /></button>
        </header>
        <p className="mobile-radio-track">{selectedTrack?.trackTitle}</p>
        <p className="mobile-radio-state" aria-live="polite">{selectedTrack?.cpName} · {controls.status}</p>
        <div className="mobile-radio-actions">
          <button type="button" disabled={controls.disabled} onClick={togglePlayback}>
            {controls.canPause ? <Pause size={20} weight="fill" aria-hidden="true" /> : <Play size={20} weight="fill" aria-hidden="true" />}
            {controls.action}
          </button>
          <a href="#/radio" onClick={() => radioPanelRef.current?.hidePopover()}>进入电台<ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>
    </nav>
  );
}
