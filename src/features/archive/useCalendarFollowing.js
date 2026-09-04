import { useEffect, useState } from 'react';

const storageKey = 'glfans:calendar-following:v1';
const empty = { seriesIds: [], onlyFollowing: false };
function readPreferences() {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey));
    if (!value || !Array.isArray(value.seriesIds)) return empty;
    return { seriesIds: [...new Set(value.seriesIds.filter((id) => typeof id === 'string'))], onlyFollowing: value.onlyFollowing === true };
  } catch {
    return empty;
  }
}

export function useCalendarFollowing() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [preferences]);
  useEffect(() => {
    const sync = (event) => {
      if (event.storageArea === window.localStorage && (event.key === storageKey || event.key === null)) setPreferences(readPreferences());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const toggleSeries = (id) => setPreferences((current) => ({ ...current, seriesIds: current.seriesIds.includes(id) ? current.seriesIds.filter((item) => item !== id) : [...current.seriesIds, id] }));
  const setOnlyFollowing = (onlyFollowing) => setPreferences((current) => ({ ...current, onlyFollowing }));
  return { ...preferences, toggleSeries, setOnlyFollowing, saveFailed };
}
