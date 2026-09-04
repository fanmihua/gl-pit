import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpRight, CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';
import { getLocale, getDateLocale, t } from './i18n/runtime.js';
import { seriesName } from './i18n/proper-names.js';
import { useMobileLayout } from './hooks/useMobileLayout.js';
import { withBase } from './lib/assets.js';
import { archiveDramas } from './data/archive-dramas.js';
import schedule from './data/archive-schedule.json';
import { calendarCopy } from './features/archive/calendar-copy.js';
import { CalendarWeek } from './features/archive/CalendarWeek.jsx';
import { calendarDate, eventDate, eventStatus, monthDates, moveDate } from './features/archive/calendar-model.js';
import './archive-calendar.css';

const archiveById = new Map(archiveDramas.map((item) => [item.id, item]));
const sourcesById = new Map(schedule.series.map((item) => [item.id, item]));

export function ArchiveCalendar({ onClose, returnFocus }) {
  const locale = getLocale(), copy = calendarCopy[locale];
  const mobile = useMobileLayout();
  const dialogRef = useRef(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const focus = returnFocus || document.activeElement;
    const rootOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.calendar-close')?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
      if (focus?.isConnected) focus.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  const zone = locale === 'zh' ? 'Asia/Shanghai' : 'Asia/Bangkok';
  const [now, setNow] = useState(Date.now);
  const today = calendarDate(now, zone);
  const [selected, setSelected] = useState(() => calendarDate(Date.now(), zone));
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const eventsByDate = useMemo(() => {
    const result = new Map();
    for (const event of schedule.events) {
      if (event.needsReview) continue;
      const date = eventDate(event, zone);
      result.set(date, [...(result.get(date) || []), event]);
    }
    return result;
  }, [zone]);
  const dates = monthDates(selected);
  const dayEvents = eventsByDate.get(selected) || [];
  const covered = schedule.coverage.some((range) => range.from <= selected && selected <= range.to);
  const format = (date, options) => new Intl.DateTimeFormat(getDateLocale(), { timeZone: 'UTC', ...options }).format(new Date(`${date}T12:00:00Z`));
  const titleFor = (id) => archiveById.has(id) ? seriesName(archiveById.get(id), locale) : sourcesById.get(id)?.name || id;
  const episodeFor = (event) => event.episode ? (locale === 'zh' ? `第 ${event.episode} 集` : locale === 'th' ? `ตอนที่ ${event.episode}` : `EP. ${String(event.episode).padStart(2, '0')}`) : copy.premiere;
  const timeFor = (event) => event.airsAt ? new Intl.DateTimeFormat(getDateLocale(), { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(event.airsAt)) : copy.timeUnknown;
  const navigate = (direction) => {
    if (mobile) return setSelected(moveDate(selected, direction * 7));
    const date = new Date(`${selected.slice(0, 7)}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + direction);
    setSelected(date.toISOString().slice(0, 10));
  };
  const provenance = <><p>{copy.notice}</p><p><a href="https://glspotlight.com/airing" target="_blank" rel="noreferrer">{copy.sourceName}</a><a href="https://www.tvmaze.com" target="_blank" rel="noreferrer">TVmaze</a><span>{copy.checked}：{new Intl.DateTimeFormat(getDateLocale(), { timeZone: zone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(schedule.checkedAt))}</span></p>{now - Date.parse(schedule.checkedAt) > 8 * 86400000 && <strong>{copy.stale}</strong>}</>;
  const mobileDetails = (event) => {
    const series = sourcesById.get(event.seriesId), archive = archiveById.get(event.seriesId);
    return <>
      <div className="calendar-week-detail-header">
        {archive?.image && <img className="calendar-week-poster" src={withBase(archive.image)} alt={titleFor(event.seriesId)} loading="lazy" />}
        <div><span className="calendar-week-status">{copy[eventStatus(event, now)]}</span>
          {series?.network && <p className="calendar-week-facts">{copy.network} · {series.network}</p>}
          {!!series?.platforms.length && <p className="calendar-week-facts">{copy.availability} · {series.platforms.join(' / ')}</p>}
        </div>
      </div>
      {archive?.summary && <p>{t(archive.summary)}</p>}
      <a href={event.sourceUrl} target="_blank" rel="noreferrer">{copy.more}<ArrowUpRight size={14} /></a>
    </>;
  };
  return createPortal(<dialog className="calendar-dialog" ref={dialogRef} aria-labelledby="calendar-dialog-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="calendar-panel">
      <header className="calendar-dialog-header"><h2 id="calendar-dialog-title">{copy.title}</h2><button className="calendar-close" aria-label={copy.close} onClick={onClose}><X size={20} /></button></header>
      <div className="calendar-scroll">
    <div className="calendar-content">
      <div className="calendar-toolbar">
        <div className="calendar-period"><button onClick={() => navigate(-1)} aria-label={copy.previous}><CaretLeft size={20} /></button><h2>{format(selected, { year: 'numeric', month: 'long' })}</h2><button onClick={() => navigate(1)} aria-label={copy.next}><CaretRight size={20} /></button><button className="calendar-today" onClick={() => setSelected(today)}>{copy.today}</button></div>
        {locale === 'en' && <span className="calendar-timezone-note">Thailand time · UTC+7</span>}
      </div>
      <div className="calendar-layout">
        {mobile ? <CalendarWeek selected={selected} onSelect={setSelected} today={today} eventsByDate={eventsByDate}
          copy={copy} format={format} titleFor={titleFor} episodeFor={episodeFor} timeFor={timeFor} renderDetails={mobileDetails} /> : <section className="calendar-grid" aria-label={copy.selectDate}>
          {copy.weekdays.map((name, index) => <span className="calendar-weekday" key={index}>{name}</span>)}
          {dates.map((date) => {
            const entries = eventsByDate.get(date) || [];
            return <button key={date} className={`calendar-date${date === selected ? ' is-selected' : ''}${date === today ? ' is-today' : ''}${date.slice(0, 7) !== selected.slice(0, 7) ? ' is-outside' : ''}`}
              aria-pressed={date === selected} aria-current={date === today ? 'date' : undefined} aria-label={`${date} · ${entries.length} ${copy.count}`} onClick={() => setSelected(date)}>
              <span className="calendar-date-number">{Number(date.slice(-2))}</span>
              <span className="calendar-date-titles">{entries.map((event) => <span key={event.id}>
                <span className="calendar-date-series">{titleFor(event.seriesId)}</span>
                <span className="calendar-date-episode">{episodeFor(event)}</span>
                <span className="calendar-date-time">{timeFor(event)}</span>
              </span>)}</span>
              {entries.length > 0 && <span className="calendar-date-dot" aria-hidden="true" />}
            </button>;
          })}
        </section>}
        {!mobile && <section className="calendar-agenda" aria-label={copy.day} aria-live="polite">
          <header><span>{format(selected, { month: 'short', day: 'numeric', weekday: 'long' })}</span><b>{dayEvents.length} {copy.count}</b></header>
          {dayEvents.length ? dayEvents.map((event) => {
            const series = sourcesById.get(event.seriesId), archive = archiveById.get(event.seriesId);
            const status = eventStatus(event, now);
            return <article className="calendar-program" key={event.id}>
              <div className="calendar-program-time"><strong>{event.airsAt ? new Intl.DateTimeFormat(getDateLocale(), { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(event.airsAt)) : '—'}</strong><span className={event.needsReview ? 'needs-review' : ''}>{copy[status]}</span></div>
              <div className="calendar-program-body">
                {archive?.image && <img src={withBase(archive.image)} alt="" loading="lazy" />}
                <div><span className="calendar-episode">{episodeFor(event)}</span><h3>{titleFor(event.seriesId)}</h3>
                  {series?.network && <p>{copy.network} · {series.network}</p>}
                  {!!series?.platforms.length && <p>{copy.availability} · {series.platforms.join(' / ')}</p>}

                </div>
              </div>
              {archive?.summary && <p className="calendar-program-summary">{t(archive.summary)}</p>}
              <div className="calendar-program-links"><a href={event.sourceUrl} target="_blank" rel="noreferrer">{copy.more}<ArrowUpRight size={14} /></a></div>
            </article>;
          }) : <div className="calendar-empty"><CalendarBlank size={36} weight="light" /><h3>{covered ? copy.empty : copy.emptyOutside}</h3><p>{copy.emptyNote}</p></div>}
        </section>}
      </div>
      {mobile ? <details className="calendar-provenance calendar-provenance-disclosure"><summary>{copy.notes}</summary>{provenance}</details> : <aside className="calendar-provenance">{provenance}</aside>}
    </div>
      </div>
    </div>
  </dialog>, document.body);
}
