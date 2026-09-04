import { useCallback, useEffect, useState } from "react";
import { archiveDramasByYear } from "../../data/archive-dramas.js";

function updateArchiveUrl(year, eventId) {
  const nextHash = eventId ? `#/archive/${year}/${eventId}` : `#/archive/${year}`;
  window.history.replaceState(null, "", nextHash);
}

export function useArchiveSelection(year, eventId) {
  const yearEvents = archiveDramasByYear[year] || [];
  const hasArchiveEvents = yearEvents.length > 0;
  const initialEvent = yearEvents.find((event) => event.id === eventId) || yearEvents[0] || null;
  const [selectedId, setSelectedId] = useState(initialEvent?.id || "");

  useEffect(() => {
    if (!hasArchiveEvents) return;
    const next = yearEvents.find((event) => event.id === eventId) || yearEvents[0];
    setSelectedId(next.id);
  }, [eventId, hasArchiveEvents, year]);

  const selectedEvent = yearEvents.find((event) => event.id === selectedId) || initialEvent;
  const selectedIndex = Math.max(0, yearEvents.findIndex((event) => event.id === selectedEvent?.id));

  const selectEvent = useCallback((event) => {
    setSelectedId(event.id);
    updateArchiveUrl(year, event.id);
  }, [year]);

  return { yearEvents, hasArchiveEvents, selectedEvent, selectedIndex, selectEvent };
}
