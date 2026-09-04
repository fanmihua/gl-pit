import { Check, SlidersHorizontal } from '@phosphor-icons/react';
import { withBase } from '../../lib/assets.js';

export function CalendarFollowControls({ copy, onlyFollowing, setOnlyFollowing, managing, onManage, weekRange }) {
  return <div className="calendar-follow-controls">
    {weekRange && <span className="calendar-follow-range" aria-live="polite">{weekRange}</span>}
    <div className="calendar-follow-modes" role="group" aria-label={copy.filterLabel}>
      <button type="button" aria-pressed={!onlyFollowing} onClick={() => setOnlyFollowing(false)}>{copy.allSeries}</button>
      <button type="button" aria-label={copy.followingOnly} aria-pressed={onlyFollowing} onClick={() => setOnlyFollowing(true)}><span className="calendar-follow-label">{copy.followingOnly}</span><span className="calendar-follow-short" aria-hidden="true">{copy.followingShort}</span></button>
    </div>
    <button className="calendar-manage-following" type="button" aria-label={managing ? copy.done : copy.chooseSeries} aria-expanded={managing} aria-controls="calendar-follow-manager" onClick={onManage}>
      {managing ? <Check size={14} aria-hidden="true" /> : <SlidersHorizontal size={14} aria-hidden="true" />}<span className="calendar-follow-label">{managing ? copy.done : copy.chooseSeries}</span><span className="calendar-follow-short" aria-hidden="true">{managing ? copy.done : copy.chooseShort}</span>
    </button>
  </div>;
}

export function CalendarFollowManager({ copy, series, seriesIds, toggleSeries, titleFor, imageFor, saveFailed }) {
  return <section className="calendar-follow-manager" id="calendar-follow-manager" aria-label={copy.chooseSeries}>
    <p className="calendar-follow-hint">{copy.followHint}</p>
    <div className="calendar-follow-list">
      {series.map(({ id }) => <label className="calendar-follow-option" key={id}>
        <input type="checkbox" checked={seriesIds.includes(id)} onChange={() => toggleSeries(id)} />
        {imageFor(id) && <img src={withBase(imageFor(id))} alt="" loading="lazy" />}
        <span>{titleFor(id)}</span>
      </label>)}
    </div>
    <p className="calendar-follow-hint" role={saveFailed ? 'status' : undefined}>{saveFailed ? copy.followSaveFailed : copy.followLocal}</p>
  </section>;
}
