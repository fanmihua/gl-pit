// Phone pins get their own full-width row; desktop keeps the existing distribution.
export function buildEvidenceLayout(order, pinnedIds, columnCount, mobile) {
  const pinSet = new Set(pinnedIds);
  const pinned = mobile ? order.filter((id) => pinSet.has(id)) : [];
  const regular = mobile ? order.filter((id) => !pinSet.has(id)) : order;
  const columns = Array.from({ length: Math.max(1, columnCount) }, () => []);
  regular.forEach((id, index) => columns[index % columns.length].push(id));
  return [
    ...(pinned.length ? [{ pinned: true, cardIds: pinned }] : []),
    ...columns.map((cardIds) => ({ pinned: false, cardIds })),
  ];
}
