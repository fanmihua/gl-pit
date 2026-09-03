import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Question, X } from "@phosphor-icons/react";
import { withBase } from "../../lib/assets.js";

export function RadioHowToContent({ critical = false }) {
  return <>
    <img src={withBase("assets/pit-radio/how-to-paper-v3.webp")} alt="" aria-hidden="true" decoding="async" data-page-critical={critical || undefined} />
    <ol>
      <li><strong>选一对 CP</strong><span>点一下贴纸，也可以拖入唱片</span></li>
      <li><strong>落针，开始听</strong><span>点播放或唱针，也可以拖动唱针</span></li>
      <li><strong>换首她们的歌</strong><span>点下一首，或点列表图标选歌</span></li>
    </ol>
  </>;
}

export function MobileRadioHelp() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector("button")?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      root.style.overflow = previousOverflow;
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <button
      type="button"
      className="pit-radio-help-toggle"
      ref={triggerRef}
      aria-label="查看坑底电台玩法说明"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="pit-radio-help"
      onClick={() => setOpen(true)}
    ><span><Question size={16} />怎么玩</span></button>
    {open && createPortal(
      <dialog
        id="pit-radio-help"
        className="pit-radio-help-dialog"
        ref={dialogRef}
        aria-label="坑底电台玩法说明"
        onCancel={(event) => { event.preventDefault(); setOpen(false); }}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
      >
        <div className="pit-radio-help-panel">
          <div className="pit-radio-howto">
            <RadioHowToContent />
            <button className="pit-radio-help-close" type="button" aria-label="关闭玩法说明" onClick={() => setOpen(false)}><X size={20} /></button>
          </div>
        </div>
      </dialog>,
      document.body,
    )}
  </>;
}
