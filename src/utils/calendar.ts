export const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTHS_ZH = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

export const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
export const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMonthKey = (dateOrDateKey: Date | string): string => {
  if (typeof dateOrDateKey === 'string') {
    return dateOrDateKey.slice(0, 7);
  }
  return `${dateOrDateKey.getFullYear()}-${String(dateOrDateKey.getMonth() + 1).padStart(2, '0')}`;
};

export const getTodayDateKey = (): string => formatDateKey(new Date());

const getDateFromKey = (dateKey: string): Date => new Date(`${dateKey}T00:00:00`);

export const addDaysToDateKey = (dateKey: string, days: number): string => {
  const date = getDateFromKey(dateKey);
  if (isNaN(date.getTime())) return dateKey;
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
};

export const createDateKey = (year: number | string, monthIndex: number, day = 1): string => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getWeekStartDate = (dateKey: string): Date => {
  const date = getDateFromKey(dateKey);
  if (isNaN(date.getTime())) return getWeekStartDate(getTodayDateKey());
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return date;
};

export const getWeekKey = (dateKey: string): string => {
  const monday = getWeekStartDate(dateKey);
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const weekYear = thursday.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4);
  const firstMonday = getWeekStartDate(formatDateKey(firstThursday));
  const diffMs = monday.getTime() - firstMonday.getTime();
  const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
};

export const getWeekDatesFromDateKey = (dateKey: string): string[] => {
  const monday = getWeekStartDate(dateKey);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatDateKey(date);
  });
};

export const getWeekDatesFromWeekKey = (weekKey: string): string[] => {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return getWeekDatesFromDateKey(getTodayDateKey());
  const year = Number(match[1]);
  const week = Number(match[2]);
  const firstThursday = new Date(year, 0, 4);
  const firstMonday = getWeekStartDate(formatDateKey(firstThursday));
  firstMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstMonday);
    date.setDate(firstMonday.getDate() + index);
    return formatDateKey(date);
  });
};

export const addWeeksToDateKey = (dateKey: string, weeks: number): string => (
  addDaysToDateKey(dateKey, weeks * 7)
);

export const getDaysInMonth = (year: number, month: number): number => {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfWeek = (year: number, month: number): number => {
  // Returns 0 (Sunday) to 6 (Saturday)
  return new Date(year, month, 1).getDay();
};

export interface GridDay {
  dayNumber: number;
  isCurrentMonth: boolean;
  dateKey: string; // "YYYY-MM-DD"
  monthOffset: number; // -1 for previous, 0 for current, 1 for next
}

export const generateCalendarGrid = (year: number, month: number): GridDay[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  
  const grid: GridDay[] = [];
  
  // Previous month padding
  const prevMonthIndex = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDaysCount = getDaysInMonth(prevYear, prevMonthIndex);
  
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDaysCount - i;
    const dateKey = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    grid.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateKey,
      monthOffset: -1
    });
  }
  
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    grid.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateKey,
      monthOffset: 0
    });
  }
  
  // Next month padding (pad up to multiple of 7, e.g. 35 or 42 grid cells)
  const totalCellsWritten = grid.length;
  // Let's standardise on 42 grid cells or minimum multiple of 7 that fits days
  const targetCells = totalCellsWritten > 35 ? 42 : 35;
  const paddingNeeded = targetCells - totalCellsWritten;
  
  const nextMonthIndex = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  for (let d = 1; d <= paddingNeeded; d++) {
    const dateKey = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    grid.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateKey,
      monthOffset: 1
    });
  }
  
  return grid;
};

// Ordinal suffix (1st, 2nd, 3rd, etc)
export const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

export const formatFullEnglishDate = (dateStr: string): string => {
  // dateStr is "YYYY-MM-DD"
  const date = new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return dateStr;
  
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  
  return `${weekday}, ${monthName} ${day}${suffix}`;
};

export const formatFullChineseDate = (dateStr: string): string => {
  const date = new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return dateStr;
  
  const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = weekdayMap[date.getDay()];
  
  return `${year}年${month}月${day}日 ${dayOfWeek}`;
};
