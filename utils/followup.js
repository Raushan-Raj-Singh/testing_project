/**
 * Follow-up categorization & sorting helper functions.
 */

export function getFollowupCategory(dateStr, referenceDate = new Date()) {
  if (!dateStr) return "No Date";

  let target;
  if (typeof dateStr === "string") {
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      target = new Date(year, month, day);
    } else {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "No Date";
      target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  } else {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "No Date";
    target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  if (isNaN(target.getTime())) return "No Date";

  // Normalize dates to midnight for exact calendar day comparison
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return "Upcoming";
}

const CATEGORY_ORDER = {
  Today: 1,
  Overdue: 2,
  Tomorrow: 3,
  Upcoming: 4,
  "No Date": 5,
};

const PRIORITY_ORDER = {
  High: 1,
  Medium: 2,
  Low: 3,
};

export function sortRowsByFollowupAndPriority(rows, columns = []) {
  const followupCol = columns.find((c) => c.special === "followup");
  const priorityCol = columns.find((c) => c.special === "priority");

  const today = new Date();

  return [...rows].sort((a, b) => {
    const aData = a.data || {};
    const bData = b.data || {};

    const aFollowVal = followupCol ? aData[followupCol.id] : null;
    const bFollowVal = followupCol ? bData[followupCol.id] : null;

    const aCat = getFollowupCategory(aFollowVal, today);
    const bCat = getFollowupCategory(bFollowVal, today);

    const aCatRank = CATEGORY_ORDER[aCat] || 5;
    const bCatRank = CATEGORY_ORDER[bCat] || 5;

    if (aCatRank !== bCatRank) {
      return aCatRank - bCatRank;
    }

    // Secondary sort by priority
    const aPrioVal = priorityCol ? aData[priorityCol.id] : null;
    const bPrioVal = priorityCol ? bData[priorityCol.id] : null;

    const aPrioRank = PRIORITY_ORDER[aPrioVal] || 99;
    const bPrioRank = PRIORITY_ORDER[bPrioVal] || 99;

    return aPrioRank - bPrioRank;
  });
}
