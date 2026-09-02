import { HeartStraight } from "@phosphor-icons/react";
import { RIGHTS_SHORT_NOTICE } from "./rights.js";
import "./global-footer.css";

export function GlobalFooter() {
  return (
    <footer className="global-footer" aria-label="glfans 全站页尾">
      <a className="global-footer-brand" href="#/about" aria-label="关于 glfans">glfans</a>
      <span className="global-footer-credits">
        <span><b>Content</b> / Conceal</span>
        <span><b>Design &amp; Dev</b> / 范米花儿</span>
      </span>
      <span className="global-footer-love" tabIndex="0">
        <i>love is love</i>
        <HeartStraight weight="fill" aria-hidden="true" />
      </span>
      <p className="global-footer-rights">
        <span>{RIGHTS_SHORT_NOTICE}</span>
        <a href="#/about/rights">权利说明与反馈</a>
      </p>
    </footer>
  );
}
