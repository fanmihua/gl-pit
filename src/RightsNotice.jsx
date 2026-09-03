import { RIGHTS_SHORT_NOTICE } from "./rights.js";
import "./rights-notice.css";

// Page-specific wording and desktop positioning stay with their existing hosts.
export function RightsNotice({ className = "", notice = RIGHTS_SHORT_NOTICE, linkLabel = "权利说明" }) {
  return (
    <p className={`site-rights-notice ${className}`}>
      <span>{notice}</span>
      <a href="#/about/rights">{linkLabel}</a>
    </p>
  );
}
