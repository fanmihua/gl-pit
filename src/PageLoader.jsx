import { t } from "./i18n/runtime.js";
import "./page-loader.css";

export function PageLoader({
  className = "",
  kicker = "glfans",
  label = "正在翻到这一页",
  progress = null,
}) {
  const normalizedProgress = progress === null ? null : Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <section className={`page-loader${className ? ` ${className}` : ""}`} aria-live="polite" aria-busy="true">
      <div className="page-loader-panel">
        <span>{t(kicker)}</span>
        <strong>{t(label)}</strong>
        <div
          className={`page-loader-track${normalizedProgress === null ? " is-indeterminate" : ""}`}
          role="progressbar"
          aria-label={t(label)}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={normalizedProgress ?? undefined}
        >
          <i style={normalizedProgress === null ? undefined : { "--load-progress": `${normalizedProgress}%` }} />
        </div>
        <small>{t(normalizedProgress === null ? "LOADING" : `${String(normalizedProgress).padStart(2, "0")}%`)}</small>
      </div>
    </section>
  );
}
