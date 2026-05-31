import { DailyPlan, MonthPlan, PlannerData, WeekPlan, YearPlan } from '../types';
import { formatMonthKey, getWeekDatesFromWeekKey } from './calendar';
import { ensureDailyPlan, ensureMonthPlan, ensureWeekPlan, ensureYearPlan } from './storage';

const empty = (value: string) => value.trim() || '';

const todoMarkdown = (todos: { text: string; completed: boolean }[]): string => {
  if (todos.length === 0) return '- [ ] \n';
  return todos.map((todo) => `- [${todo.completed ? 'x' : ' '}] ${todo.text}`).join('\n');
};

const textBlock = (value: string): string => empty(value) || '_No entry yet._';

export const dailyPlanToMarkdown = (dateKey: string, plan: DailyPlan): string => {
  const schedule = plan.schedule
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((item) => `- **${item.time}** ${item.text}`)
    .join('\n') || '- ';

  return `# Daily Plan - ${dateKey}

## Today I Most Want To Complete
${textBlock(plan.topPriority)}

## Mood / Weather
- Mood: ${plan.mood || ''}
- Weather: ${plan.weather || ''}

## Todos
${todoMarkdown(plan.todos)}

## Timeline
${schedule}

## Notes
${textBlock(plan.notes)}

## Diary Review
${textBlock(plan.diary)}
`;
};

export const monthPlanToMarkdown = (monthKey: string, plan: MonthPlan): string => {
  const goals = plan.goals.length > 0
    ? plan.goals.map((goal) => `- ${goal}`).join('\n')
    : '- ';

  const dayNotes = Object.entries(plan.dayNotes)
    .filter(([dateKey]) => formatMonthKey(dateKey) === monthKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, note]) => `- **${dateKey}** ${note}`)
    .join('\n') || '- ';

  return `# Monthly Plan - ${monthKey}

## Goals
${goals}

## Todos
${todoMarkdown(plan.todos)}

## Day Notes
${dayNotes}

## Review
${textBlock(plan.review)}
`;
};

export const weekPlanToMarkdown = (weekKey: string, plan: WeekPlan): string => {
  const weekDates = getWeekDatesFromWeekKey(weekKey);
  const rangeText = `${weekDates[0]} - ${weekDates[6]}`;
  const dayPlans = weekDates
    .map((dateKey) => `### ${dateKey}\n${textBlock(plan.days[dateKey] || '')}`)
    .join('\n\n');
  const habitRows = plan.habits.length > 0
    ? plan.habits.map((habit) => {
      const checks = weekDates
        .map((dateKey) => habit.completedDates.includes(dateKey) ? 'x' : ' ')
        .join(' | ');
      return `| ${habit.text} | ${checks} |`;
    }).join('\n')
    : '|  |  |  |  |  |  |  |  | |';

  return `# Weekly Plan - ${rangeText}

Week: ${weekKey}

## Focus
${textBlock(plan.focus)}

## Todos
${todoMarkdown(plan.todos)}

## Daily Plans
${dayPlans}

## Habits
| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
| --- | --- | --- | --- | --- | --- | --- | --- |
${habitRows}

## Review
${textBlock(plan.review)}
`;
};

export const yearPlanToMarkdown = (year: string, plan: YearPlan): string => {
  const importantDates = plan.importantDates.length > 0
    ? plan.importantDates.map((date) => `- **${date.date}** ${date.title}`).join('\n')
    : '- ';

  return `# Yearly Plan - ${year}

## Keyword
${textBlock(plan.keyword)}

## Goals
${todoMarkdown(plan.goals)}

## Important Dates
${importantDates}

## Review
${textBlock(plan.review)}
`;
};

export const downloadMarkdown = (filename: string, markdown: string): void => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportDailyMarkdown = (plannerData: PlannerData, dateKey: string): void => {
  downloadMarkdown(`${dateKey}-daily-plan.md`, dailyPlanToMarkdown(dateKey, ensureDailyPlan(plannerData, dateKey)));
};

export const exportMonthMarkdown = (plannerData: PlannerData, monthKey: string): void => {
  downloadMarkdown(`${monthKey}-monthly-plan.md`, monthPlanToMarkdown(monthKey, ensureMonthPlan(plannerData, monthKey)));
};

export const exportWeekMarkdown = (plannerData: PlannerData, weekKey: string): void => {
  downloadMarkdown(`${weekKey}-weekly-plan.md`, weekPlanToMarkdown(weekKey, ensureWeekPlan(plannerData, weekKey)));
};

export const exportYearMarkdown = (plannerData: PlannerData, year: string): void => {
  downloadMarkdown(`${year}-yearly-plan.md`, yearPlanToMarkdown(year, ensureYearPlan(plannerData, year)));
};
