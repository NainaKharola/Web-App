const INDIA_OFFSET_MINUTES = 330;

// HTML date inputs send YYYY-MM-DD without a timezone. Interpret that value as
// an India calendar day so stored date comparisons are stable on any server.
function indiaDayRange(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ""))) return null;

  const [year, month, day] = dateValue.split("-").map(Number);
  const localMidnight = Date.UTC(year, month - 1, day);
  const check = new Date(localMidnight);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) return null;

  const start = new Date(localMidnight - INDIA_OFFSET_MINUTES * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { $gte: start, $lt: end };
}

module.exports = { indiaDayRange };
