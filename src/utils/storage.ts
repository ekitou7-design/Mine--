import { createEmptyDailyPlan, createEmptyMonthPlan, createEmptyWeekPlan, createEmptyYearPlan, getInitialState } from '../initialData';
import { DailyPlan, EisenhowerMatrix, HabitItem, MonthPlan, PlannerData, ScheduleItem, TodoItem, WeekPlan, YearPlan } from '../types';

export const PLANNER_STORAGE_KEY = 'mine_planner_data_v2';
const LEGACY_STORAGE_KEY = 'mine_planner_data_v1';

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const emptyEisenhower = (): EisenhowerMatrix => ({
  urgentImportant: [],
  importantNotUrgent: [],
  urgentNotImportant: [],
  notUrgentNotImportant: [],
});

const normalizeTodos = (items: unknown, prefix: string): TodoItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `${prefix}_${index}`, text: item, completed: false };
    }
    const value = item as Partial<TodoItem>;
    return {
      id: value.id || `${prefix}_${index}`,
      text: value.text || '',
      completed: Boolean(value.completed),
    };
  });
};

const normalizeSchedule = (schedule: unknown): ScheduleItem[] => {
  if (Array.isArray(schedule)) {
    return schedule.map((item, index) => {
      const value = item as Partial<ScheduleItem>;
      return {
        id: value.id || `schedule_${index}`,
        time: value.time || '',
        text: value.text || '',
      };
    });
  }

  if (schedule && typeof schedule === 'object') {
    return Object.entries(schedule as Record<string, string>).map(([time, text], index) => ({
      id: `schedule_${index}`,
      time,
      text: text || '',
    }));
  }

  return [];
};

const normalizeHabits = (items: unknown, prefix: string): HabitItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `${prefix}_${index}`, text: item, completedDates: [] };
    }

    const value = item as Partial<HabitItem> & { completed?: boolean };
    return {
      id: value.id || `${prefix}_${index}`,
      text: value.text || '',
      completedDates: Array.isArray(value.completedDates)
        ? value.completedDates
        : value.completed
          ? []
          : [],
    };
  });
};

const normalizeEisenhower = (value: unknown): EisenhowerMatrix => {
  const matrix = value as Partial<EisenhowerMatrix> | undefined;
  return {
    urgentImportant: Array.isArray(matrix?.urgentImportant) ? matrix.urgentImportant : [],
    importantNotUrgent: Array.isArray(matrix?.importantNotUrgent) ? matrix.importantNotUrgent : [],
    urgentNotImportant: Array.isArray(matrix?.urgentNotImportant) ? matrix.urgentNotImportant : [],
    notUrgentNotImportant: Array.isArray(matrix?.notUrgentNotImportant) ? matrix.notUrgentNotImportant : [],
  };
};

const normalizeDailyPlan = (value: unknown): DailyPlan => {
  const plan = value as Partial<DailyPlan> & {
    todayTodo?: TodoItem[];
    journal?: string;
  };

  return {
    topPriority: plan?.topPriority || '',
    mood: plan?.mood === undefined || plan?.mood === null ? '' : String(plan.mood),
    weather: plan?.weather || '',
    todos: normalizeTodos(plan?.todos || plan?.todayTodo, 'daily_todo'),
    schedule: normalizeSchedule(plan?.schedule),
    notes: plan?.notes || '',
    diary: plan?.diary || plan?.journal || '',
    eisenhower: normalizeEisenhower(plan?.eisenhower || emptyEisenhower()),
  };
};

const normalizeMonthPlan = (value: unknown, monthKey: string): MonthPlan => {
  const plan = value as Partial<MonthPlan> & {
    focusList?: string[];
    todoList?: TodoItem[];
    reviewSuccesses?: string;
    reviewReflections?: string;
    events?: Record<string, string>;
  };

  const dayNotes: Record<string, string> = {};
  const rawDayNotes = plan?.dayNotes || plan?.events || {};
  Object.entries(rawDayNotes).forEach(([key, note]) => {
    const dateKey = key.includes('-') ? key : `${monthKey}-${String(key).padStart(2, '0')}`;
    dayNotes[dateKey] = String(note || '');
  });

  return {
    goals: Array.isArray(plan?.goals) ? plan.goals : (plan?.focusList || []),
    todos: normalizeTodos(plan?.todos || plan?.todoList, 'month_todo'),
    dayNotes,
    review: plan?.review || [plan?.reviewSuccesses, plan?.reviewReflections].filter(Boolean).join('\n\n'),
  };
};

const normalizeWeekPlan = (value: unknown): WeekPlan => {
  const plan = value as Partial<WeekPlan> | undefined;
  const rawDays = plan?.days && typeof plan.days === 'object' ? plan.days : {};

  return {
    focus: plan?.focus || '',
    todos: normalizeTodos(plan?.todos, 'week_todo'),
    days: Object.fromEntries(
      Object.entries(rawDays).map(([dateKey, text]) => [dateKey, String(text || '')])
    ),
    habits: normalizeHabits(plan?.habits, 'habit'),
    review: plan?.review || '',
  };
};

const normalizeYearPlan = (value: unknown, legacy: unknown, year: string): YearPlan => {
  const plan = value as Partial<YearPlan> | undefined;
  const legacyState = legacy as {
    yearlyKeyword?: Record<string, string>;
    yearlyGoals?: Record<string, string[]>;
    yearlyMilestones?: Record<string, Array<{ id?: string; date?: string; title?: string }>>;
    yearlyReview?: Record<string, { joy?: string; lesson?: string }>;
  };

  const importantDatesSource = plan?.importantDates || legacyState.yearlyMilestones?.[year] || [];
  const reviewSource = legacyState.yearlyReview?.[year];

  return {
    keyword: plan?.keyword || legacyState.yearlyKeyword?.[year] || '',
    goals: normalizeTodos(plan?.goals || legacyState.yearlyGoals?.[year], 'year_goal'),
    importantDates: importantDatesSource.map((date, index) => ({
      id: date.id || `date_${index}`,
      date: date.date || '',
      title: date.title || '',
    })),
    review: plan?.review || [reviewSource?.joy, reviewSource?.lesson].filter(Boolean).join('\n\n'),
  };
};

export const normalizePlannerData = (raw: unknown): PlannerData => {
  const fallback = getInitialState();
  if (!raw || typeof raw !== 'object') return fallback;

  const value = raw as Partial<PlannerData> & {
    language?: 'zh' | 'en';
    monthlyPlans?: Record<string, unknown>;
    yearlyGoals?: Record<string, string[]>;
  };

  const yearKeys = new Set<string>(Object.keys(value.yearPlans || {}));
  Object.keys(value.yearlyGoals || {}).forEach((key) => yearKeys.add(key));
  if (yearKeys.size === 0) {
    Object.keys(fallback.yearPlans).forEach((key) => yearKeys.add(key));
  }

  const monthSource = value.monthPlans || value.monthlyPlans || {};
  const weekSource = value.weekPlans || {};
  const dailySource = value.dailyPlans || {};

  const yearPlans = Object.fromEntries(
    Array.from(yearKeys).map((year) => [year, normalizeYearPlan(value.yearPlans?.[year], value, year)])
  );
  const monthPlans = Object.fromEntries(
    Object.entries(monthSource).map(([monthKey, plan]) => [monthKey, normalizeMonthPlan(plan, monthKey)])
  );
  const weekPlans = Object.fromEntries(
    Object.entries(weekSource).map(([weekKey, plan]) => [weekKey, normalizeWeekPlan(plan)])
  );
  const dailyPlans = Object.fromEntries(
    Object.entries(dailySource).map(([dateKey, plan]) => [dateKey, normalizeDailyPlan(plan)])
  );

  return {
    yearPlans: { ...fallback.yearPlans, ...yearPlans },
    monthPlans: { ...fallback.monthPlans, ...monthPlans },
    weekPlans: { ...fallback.weekPlans, ...weekPlans },
    dailyPlans: { ...fallback.dailyPlans, ...dailyPlans },
    settings: {
      themeColor: value.settings?.themeColor || fallback.settings.themeColor,
      paperStyle: value.settings?.paperStyle || fallback.settings.paperStyle,
      language: value.settings?.language || value.language || fallback.settings.language,
    },
    lastSaved: value.lastSaved || new Date().toISOString(),
  };
};

export const isPlannerDataLike = (raw: unknown): boolean => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const value = raw as Record<string, unknown>;
  return Boolean(
    value.yearPlans ||
    value.monthPlans ||
    value.weekPlans ||
    value.dailyPlans ||
    value.settings ||
    value.yearlyGoals ||
    value.monthlyPlans
  );
};

const parseStoredPlannerData = (stored: string | null, label: string): PlannerData | null => {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return isPlannerDataLike(parsed) ? normalizePlannerData(parsed) : null;
  } catch (error) {
    console.error(`Failed to parse ${label} planner data:`, error);
    return null;
  }
};

export const loadPlannerData = (): PlannerData => {
  const currentData = parseStoredPlannerData(localStorage.getItem(PLANNER_STORAGE_KEY), PLANNER_STORAGE_KEY);
  if (currentData) return currentData;

  const legacyData = parseStoredPlannerData(localStorage.getItem(LEGACY_STORAGE_KEY), LEGACY_STORAGE_KEY);
  if (legacyData) return legacyData;

  return getInitialState();
};

export const savePlannerData = (plannerData: PlannerData): void => {
  try {
    localStorage.setItem(
      PLANNER_STORAGE_KEY,
      JSON.stringify({ ...plannerData, lastSaved: new Date().toISOString() })
    );
  } catch (error) {
    console.error('Failed to save planner data:', error);
  }
};

export const ensureYearPlan = (plannerData: PlannerData, year: string): YearPlan => (
  plannerData.yearPlans[year] || createEmptyYearPlan()
);

export const ensureMonthPlan = (plannerData: PlannerData, monthKey: string): MonthPlan => (
  plannerData.monthPlans[monthKey] || createEmptyMonthPlan()
);

export const ensureWeekPlan = (plannerData: PlannerData, weekKey: string): WeekPlan => (
  plannerData.weekPlans[weekKey] || createEmptyWeekPlan()
);

export const ensureDailyPlan = (plannerData: PlannerData, dateKey: string): DailyPlan => (
  plannerData.dailyPlans[dateKey] || createEmptyDailyPlan()
);

export const newTodo = (text: string): TodoItem => ({
  id: createId('todo'),
  text,
  completed: false,
});

export const newScheduleItem = (time: string, text: string): ScheduleItem => ({
  id: createId('schedule'),
  time,
  text,
});

export const newHabit = (text: string): HabitItem => ({
  id: createId('habit'),
  text,
  completedDates: [],
});
