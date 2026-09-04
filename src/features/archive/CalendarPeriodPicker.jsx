export function CalendarPeriodPicker({ selected, year, years, onYearChange, onSelect, copy, format, availability }) {
  return <section className="calendar-period-picker" aria-label={copy.chooseMonth}>
    <div className="calendar-picker-years" role="group" aria-label={copy.chooseYear}>
      {years.map((value) => <button type="button" key={value} aria-pressed={value === year} disabled={![...availability.keys()].some((month) => month.startsWith(`${value}-`))} onClick={() => onYearChange(value)}>{format(`${value}-01-01`, { year: 'numeric' })}</button>)}
    </div>
    <div className="calendar-picker-months" role="group" aria-label={copy.chooseMonth}>
      {Array.from({ length: 12 }, (_, index) => {
        const date = `${year}-${String(index + 1).padStart(2, '0')}-01`;
        const available = availability.get(date.slice(0, 7));
        return <button type="button" key={date} disabled={!available} aria-pressed={selected.slice(0, 7) === date.slice(0, 7)} onClick={() => onSelect(available.firstDate)}><span>{format(date, { month: 'long' })}</span>{available && <small>{available.count === 1 && copy.monthSeriesSingle ? copy.monthSeriesSingle : copy.monthSeriesCount.replace('{count}', available.count)}</small>}</button>;
      })}
    </div>
  </section>;
}
