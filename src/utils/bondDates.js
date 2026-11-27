export const bondEndDateFromDuration = (joiningDate, duration) => {
  const match = String(duration || "")
    .trim()
    .match(/^(\d+)\s*(day|days|month|months|year|years)$/i);
  if (!joiningDate || !match) return "";
  const [year, month, day] = String(joiningDate).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isInteger(amount) || amount < 1 || amount > (unit.startsWith("day") ? 36500 : 1200))
    return "";
  if (unit.startsWith("day")) date.setUTCDate(date.getUTCDate() + amount);
  else {
    const offset = amount * (unit.startsWith("year") ? 12 : 1);
    const targetMonth = date.getUTCMonth() + offset;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;
    const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
    date.setUTCFullYear(targetYear, normalizedMonth, Math.min(date.getUTCDate(), lastDay));
  }
  return date.toISOString().slice(0, 10);
};

export const bondPeriodLabel = (duration, joiningDate, endDate) => {
  if (!duration) return "N/A";
  const effectiveEndDate = endDate || bondEndDateFromDuration(joiningDate, duration);
  if (!joiningDate || !effectiveEndDate) return duration;
  const format = (value) => {
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-GB");
  };
  return `${duration} (${format(joiningDate)} - ${format(effectiveEndDate)})`;
};
