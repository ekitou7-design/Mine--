import { DailyPlan, TodoItem } from '../types';
import { formatMonthKey, getWeekDatesFromDateKey } from './calendar';

export interface PromotedTodo {
  dateKey: string;
  todo: TodoItem;
}

const getPromotedTodos = (
  dailyPlans: Record<string, DailyPlan>,
  predicate: (dateKey: string, todo: TodoItem) => boolean
): PromotedTodo[] => (
  Object.entries(dailyPlans)
    .flatMap(([dateKey, plan]) => plan.todos
      .filter((todo) => predicate(dateKey, todo))
      .map((todo) => ({ dateKey, todo }))
    )
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
);

export const getDailyTodosForWeek = (
  dailyPlans: Record<string, DailyPlan>,
  anchorDateKey: string
): PromotedTodo[] => {
  const weekDates = new Set(getWeekDatesFromDateKey(anchorDateKey));
  return getPromotedTodos(
    dailyPlans,
    (dateKey, todo) => weekDates.has(dateKey) && Boolean(todo.showIn?.week)
  );
};

export const getDailyTodosForMonth = (
  dailyPlans: Record<string, DailyPlan>,
  monthKey: string
): PromotedTodo[] => (
  getPromotedTodos(
    dailyPlans,
    (dateKey, todo) => formatMonthKey(dateKey) === monthKey && Boolean(todo.showIn?.month)
  )
);

export const getDailyTodosForYear = (
  dailyPlans: Record<string, DailyPlan>,
  year: string
): PromotedTodo[] => (
  getPromotedTodos(
    dailyPlans,
    (dateKey, todo) => dateKey.startsWith(`${year}-`) && Boolean(todo.showIn?.year)
  )
);
