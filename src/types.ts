export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  showIn?: {
    week?: boolean;
    month?: boolean;
    year?: boolean;
  };
}

export interface ImportantDate {
  id: string;
  date: string;
  title: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  text: string;
}

export interface HabitItem {
  id: string;
  text: string;
  completedDates: string[];
}

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'holiday' | 'event' | 'birthday' | 'other';
  source?: string;
  allDay?: boolean;
  color?: string;
};

export interface EisenhowerMatrix {
  urgentImportant: string[];
  importantNotUrgent: string[];
  urgentNotImportant: string[];
  notUrgentNotImportant: string[];
}

export interface YearPlan {
  keyword: string;
  goals: TodoItem[];
  importantDates: ImportantDate[];
  review: string;
}

export interface MonthPlan {
  goals: string[];
  todos: TodoItem[];
  dayNotes: Record<string, string>;
  review: string;
}

export interface WeekPlan {
  focus: string;
  todos: TodoItem[];
  days: Record<string, string>;
  habits: HabitItem[];
  review: string;
}

export interface DailyPlan {
  topPriority: string;
  mood: string;
  weather: string;
  todos: TodoItem[];
  schedule: ScheduleItem[];
  notes: string;
  diary: string;
  eisenhower: EisenhowerMatrix;
}

export interface PlannerSettings {
  themeColor: string;
  paperStyle: 'grid' | 'lined' | 'blank';
  language: 'zh' | 'en';
}

export interface PlannerData {
  yearPlans: Record<string, YearPlan>;
  monthPlans: Record<string, MonthPlan>;
  weekPlans: Record<string, WeekPlan>;
  dailyPlans: Record<string, DailyPlan>;
  calendarEvents: Record<string, CalendarEvent[]>;
  settings: PlannerSettings;
  lastSaved: string;
}

export type PlannerState = PlannerData;
export type Milestone = ImportantDate;
export type MonthlyPlan = MonthPlan;
export type YearlyPlan = YearPlan;
export type ViewType = 'cover' | 'year' | 'month' | 'week' | 'daily';
