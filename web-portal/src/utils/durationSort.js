const unitOrder = { day: 0, week: 1, month: 2 };

function durationParts(value) {
  const match = String(value || "").trim().match(/^(\d+(?:\.\d+)?)\s*(day|week|month)s?\b/i);
  return match ? { value: Number(match[1]), unit: unitOrder[match[2].toLowerCase()] } : { value: Number.POSITIVE_INFINITY, unit: Number.POSITIVE_INFINITY };
}

export function compareDurations(left, right) {
  const a = durationParts(left); const b = durationParts(right);
  return a.unit - b.unit || a.value - b.value || String(left).localeCompare(String(right));
}

export function sortDurations(durations) {
  return [...durations].sort(compareDurations);
}
