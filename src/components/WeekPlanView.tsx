import React, { useState } from 'react';
import { PlannerState, WeekPlan } from '../types';
import { addWeeksToDateKey, formatFullChineseDate, formatFullEnglishDate, getTodayDateKey, getWeekDatesFromDateKey, getWeekKey } from '../utils/calendar';
import { ensureWeekPlan, newHabit, newTodo } from '../utils/storage';
import { getDailyTodosForWeek } from '../utils/promotedTodos';
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, ClipboardList, Heart, Plus, Target, Trash2 } from 'lucide-react';

interface WeekPlanViewProps {
  state: PlannerState;
  selectedDateStr: string;
  onSetSelectedDateStr: (date: string) => void;
  onUpdateState: (newState: PlannerState) => void;
  onNavigateToDay: (dateStr: string) => void;
  onSetYear: (year: string) => void;
}

const WEEKDAY_ZH = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const WEEKDAY_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const WeekPlanView: React.FC<WeekPlanViewProps> = ({
  state,
  selectedDateStr,
  onSetSelectedDateStr,
  onUpdateState,
  onNavigateToDay,
  onSetYear,
}) => {
  const isZh = state.settings.language === 'zh';
  const weekKey = getWeekKey(selectedDateStr);
  const weekDates = getWeekDatesFromDateKey(selectedDateStr);
  const weekPlan: WeekPlan = ensureWeekPlan(state, weekKey);
  const promotedTodos = getDailyTodosForWeek(state.dailyPlans, selectedDateStr);

  const [newTodoInput, setNewTodoInput] = useState('');
  const [newHabitInput, setNewHabitInput] = useState('');

  const handleUpdateWeekPlan = (updatedPlan: WeekPlan) => {
    onUpdateState({
      ...state,
      weekPlans: {
        ...state.weekPlans,
        [weekKey]: updatedPlan,
      },
    });
  };

  const jumpToWeek = (dateKey: string) => {
    onSetSelectedDateStr(dateKey);
    onSetYear(dateKey.slice(0, 4));
  };

  const handlePrevWeek = () => jumpToWeek(addWeeksToDateKey(selectedDateStr, -1));
  const handleNextWeek = () => jumpToWeek(addWeeksToDateKey(selectedDateStr, 1));
  const handleThisWeek = () => jumpToWeek(getTodayDateKey());

  const handleFocusChange = (focus: string) => {
    handleUpdateWeekPlan({ ...weekPlan, focus });
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) return;
    handleUpdateWeekPlan({ ...weekPlan, todos: [...weekPlan.todos, newTodo(newTodoInput.trim())] });
    setNewTodoInput('');
  };

  const handleTodoTextChange = (id: string, text: string) => {
    handleUpdateWeekPlan({
      ...weekPlan,
      todos: weekPlan.todos.map((todo) => todo.id === id ? { ...todo, text } : todo),
    });
  };

  const handleToggleTodo = (id: string) => {
    handleUpdateWeekPlan({
      ...weekPlan,
      todos: weekPlan.todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo),
    });
  };

  const handleDeleteTodo = (id: string) => {
    handleUpdateWeekPlan({ ...weekPlan, todos: weekPlan.todos.filter((todo) => todo.id !== id) });
  };

  const handleDayPlanChange = (dateKey: string, text: string) => {
    const updatedDays = { ...weekPlan.days };
    if (text.trim()) {
      updatedDays[dateKey] = text;
    } else {
      delete updatedDays[dateKey];
    }
    handleUpdateWeekPlan({ ...weekPlan, days: updatedDays });
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitInput.trim()) return;
    handleUpdateWeekPlan({ ...weekPlan, habits: [...weekPlan.habits, newHabit(newHabitInput.trim())] });
    setNewHabitInput('');
  };

  const handleHabitTextChange = (id: string, text: string) => {
    handleUpdateWeekPlan({
      ...weekPlan,
      habits: weekPlan.habits.map((habit) => habit.id === id ? { ...habit, text } : habit),
    });
  };

  const handleToggleHabitDate = (habitId: string, dateKey: string) => {
    handleUpdateWeekPlan({
      ...weekPlan,
      habits: weekPlan.habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const isDone = habit.completedDates.includes(dateKey);
        return {
          ...habit,
          completedDates: isDone
            ? habit.completedDates.filter((key) => key !== dateKey)
            : [...habit.completedDates, dateKey],
        };
      }),
    });
  };

  const handleDeleteHabit = (id: string) => {
    handleUpdateWeekPlan({ ...weekPlan, habits: weekPlan.habits.filter((habit) => habit.id !== id) });
  };

  const handleReviewChange = (review: string) => {
    handleUpdateWeekPlan({ ...weekPlan, review });
  };

  const rangeText = `${weekDates[0].replace(/-/g, '.')} - ${weekDates[6].replace(/-/g, '.')}`;
  const weekdayLabels = isZh ? WEEKDAY_ZH : WEEKDAY_EN;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-tertiary-fixed gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-primary">
            {isZh ? '周计划' : 'Weekly Plan'} · {rangeText}
          </h2>
          <p className="text-xs text-on-surface-variant/80 mt-1">
            {weekKey} · {isZh ? '把一周摊开，给每天留一点清晰余地。' : 'Lay out the week with quiet room for each day.'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleThisWeek}
            className="px-3 py-1.5 border border-tertiary-fixed text-[11px] font-bold rounded uppercase hover:bg-surface-container bg-surface transition-all cursor-pointer"
          >
            {isZh ? '回到本周' : 'This Week'}
          </button>
          <div className="flex border border-tertiary-fixed rounded bg-surface overflow-hidden">
            <button onClick={handlePrevWeek} className="p-1.5 hover:bg-surface-container transition-colors cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <div className="h-full w-[0.5px] bg-tertiary-fixed" />
            <button onClick={handleNextWeek} className="p-1.5 hover:bg-surface-container transition-colors cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg border border-tertiary-fixed paper-sheet overflow-hidden">
          <div className="p-6 md:p-8 space-y-7">
            <section className="space-y-3">
              <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <Target size={12} className="text-secondary" />
                <span>{isZh ? '本周重点' : 'Weekly Focus'}</span>
              </span>
              <input
                type="text"
                value={weekPlan.focus}
                onChange={(e) => handleFocusChange(e.target.value)}
                placeholder={isZh ? '这一周最想稳稳推进什么？' : 'What do you want to move forward this week?'}
                className="paper-input w-full bg-transparent border-none border-b border-dashed border-tertiary-fixed/80 focus:ring-0 focus:border-primary px-0 py-2 font-serif text-lg italic text-on-surface placeholder:opacity-35"
              />
            </section>

            <section className="space-y-4">
              <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <CalendarDays size={12} className="text-secondary" />
                <span>{isZh ? '七日简短计划' : 'Seven-Day Notes'}</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weekDates.map((dateKey, index) => (
                  <div key={dateKey} className="rounded border border-tertiary-fixed/60 bg-surface-container-lowest grid-paper p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onNavigateToDay(dateKey)}
                        className="font-mono text-[10px] font-bold text-primary hover:text-secondary transition-colors"
                      >
                        {weekdayLabels[index]} · {dateKey.slice(5)}
                      </button>
                      <span className="text-[9px] text-tertiary">
                        {isZh ? formatFullChineseDate(dateKey).split(' ')[1] : formatFullEnglishDate(dateKey).split(',')[0]}
                      </span>
                    </div>
                    {(state.calendarEvents[dateKey] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(state.calendarEvents[dateKey] || []).map((event) => (
                          <span
                            key={event.id}
                            className="px-1.5 py-0.5 rounded-sm border border-tertiary-fixed bg-surface-container-low text-[9px] text-tertiary"
                            title={event.source}
                          >
                            {event.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={weekPlan.days[dateKey] || ''}
                      onChange={(e) => handleDayPlanChange(dateKey, e.target.value)}
                      placeholder={isZh ? '今日安排...' : 'Plan for this day...'}
                      rows={3}
                      className="paper-input w-full text-xs bg-transparent border-none focus:ring-0 resize-none text-on-surface-variant placeholder:opacity-30 leading-6"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <ClipboardList size={12} className="text-secondary" />
                <span>{isZh ? '来自日计划的重要事项' : 'Important Items From Daily Plans'}</span>
              </span>
              <div className="rounded border border-tertiary-fixed/60 bg-surface-container-lowest p-3 space-y-2">
                {promotedTodos.length === 0 ? (
                  <p className="text-xs text-tertiary italic py-2">
                    {isZh ? '本周还没有从日计划标记的重要事项' : 'No important daily items marked for this week yet.'}
                  </p>
                ) : promotedTodos.map(({ dateKey, todo }) => (
                  <button
                    key={`${dateKey}-${todo.id}`}
                    onClick={() => onNavigateToDay(dateKey)}
                    className="w-full flex items-center gap-2 text-left hover:bg-surface-container-low/50 rounded px-1 py-1 transition-colors"
                  >
                    <span className={`paper-checkbox w-4 h-4 border border-secondary flex items-center justify-center shrink-0 ${todo.completed ? 'bg-secondary-container/60' : 'bg-transparent'}`}>
                      {todo.completed && <span className="text-secondary font-mono text-[9px] font-bold leading-none">X</span>}
                    </span>
                    <span className="font-mono text-[10px] text-tertiary shrink-0">{dateKey.slice(5)}</span>
                    <span className={`text-xs ${todo.completed ? 'line-through text-on-surface-variant/45 italic' : 'text-on-surface'}`}>
                      {todo.text}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <Heart size={12} className="text-secondary" />
                <span>{isZh ? '本周复盘' : 'Weekly Review'}</span>
              </span>
              <textarea
                value={weekPlan.review}
                onChange={(e) => handleReviewChange(e.target.value)}
                placeholder={isZh ? '这一周哪些事值得留下？下周想调整什么？' : 'What is worth keeping from this week? What changes next week?'}
                rows={6}
                className="paper-input w-full bg-transparent border border-tertiary-fixed/50 rounded p-3 text-xs italic text-on-surface-variant resize-none focus:outline-none focus:border-primary grid-paper"
              />
            </section>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="bg-surface-container-lowest rounded-lg border border-tertiary-fixed p-6 shadow-sm space-y-4 paper-panel">
            <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <ClipboardList size={14} className="text-secondary" />
              <span>{isZh ? '本周待办' : 'Weekly Todos'}</span>
            </h3>

            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                placeholder={isZh ? '添加本周待办...' : 'Add weekly task...'}
                className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
              />
              <button type="submit" className="px-3 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary-container transition-colors shrink-0 cursor-pointer">
                {isZh ? '新增' : 'Add'}
              </button>
            </form>

            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
              {weekPlan.todos.length === 0 ? (
                <p className="text-xs text-tertiary italic text-center py-4">
                  {isZh ? '本周待办为空。' : 'No weekly todos yet.'}
                </p>
              ) : weekPlan.todos.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between group gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id)}
                    className="paper-checkbox w-4 h-4 border border-secondary flex items-center justify-center transition-all shrink-0"
                  >
                    {todo.completed && <span className="text-secondary font-mono text-[9px] font-bold leading-none">X</span>}
                  </button>
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                    className={`paper-input flex-grow bg-transparent border-none border-b border-transparent hover:border-tertiary-fixed/40 focus:border-primary focus:ring-0 p-0.5 text-xs ${
                      todo.completed ? 'line-through text-on-surface-variant/40 italic' : 'text-on-surface'
                    }`}
                  />
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-lg border border-tertiary-fixed p-6 shadow-sm space-y-4 paper-panel">
            <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <CheckSquare size={14} className="text-secondary" />
              <span>{isZh ? '习惯打卡' : 'Habit Tracker'}</span>
            </h3>

            <form onSubmit={handleAddHabit} className="flex gap-2">
              <input
                type="text"
                value={newHabitInput}
                onChange={(e) => setNewHabitInput(e.target.value)}
                placeholder={isZh ? '添加习惯，如：早睡 / 阅读...' : 'Add habit, e.g. Reading...'}
                className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
              />
              <button type="submit" className="px-3 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary-container transition-colors shrink-0 cursor-pointer">
                {isZh ? '新增' : 'Add'}
              </button>
            </form>

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_repeat(7,24px)_20px] gap-1 items-center text-[9px] font-bold text-tertiary uppercase">
                <span>{isZh ? '习惯' : 'Habit'}</span>
                {weekdayLabels.map((label) => <span key={label} className="text-center">{label.slice(0, 1)}</span>)}
                <span />
              </div>
              {weekPlan.habits.length === 0 ? (
                <p className="text-xs text-tertiary italic text-center py-4">
                  {isZh ? '还没有习惯打卡。' : 'No habits yet.'}
                </p>
              ) : weekPlan.habits.map((habit) => (
                <div key={habit.id} className="grid grid-cols-[1fr_repeat(7,24px)_20px] gap-1 items-center group">
                  <input
                    type="text"
                    value={habit.text}
                    onChange={(e) => handleHabitTextChange(habit.id, e.target.value)}
                    className="paper-input min-w-0 bg-transparent border-none border-b border-transparent hover:border-tertiary-fixed/40 focus:border-primary focus:ring-0 p-0.5 text-xs text-on-surface"
                  />
                  {weekDates.map((dateKey) => {
                    const checked = habit.completedDates.includes(dateKey);
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => handleToggleHabitDate(habit.id, dateKey)}
                        className={`paper-checkbox w-5 h-5 border border-secondary flex items-center justify-center transition-all ${
                          checked ? 'bg-secondary-container/60' : 'bg-transparent'
                        }`}
                        title={dateKey}
                      >
                        {checked && <span className="text-secondary font-mono text-[9px] font-bold leading-none">X</span>}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-tertiary hover:text-error transition-all cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
