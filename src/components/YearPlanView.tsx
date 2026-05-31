import React, { useState } from 'react';
import { CalendarEvent, PlannerState, ImportantDate } from '../types';
import { generateCalendarGrid, MONTHS_EN, MONTHS_ZH, DAYS_EN, DAYS_ZH } from '../utils/calendar';
import { ensureYearPlan, newTodo } from '../utils/storage';
import { getDailyTodosForYear } from '../utils/promotedTodos';
import { Calendar, Award, Compass, MessageSquare, Plus, Trash2, CalendarCheck } from 'lucide-react';

interface YearPlanViewProps {
  state: PlannerState;
  selectedYear: string;
  onSetYear: (year: string) => void;
  onUpdateState: (newState: PlannerState) => void;
  onNavigateToMonth: (monthIndex: number) => void;
  onNavigateToDay: (dateStr: string) => void;
}

export const YearPlanView: React.FC<YearPlanViewProps> = ({
  state,
  selectedYear,
  onSetYear,
  onUpdateState,
  onNavigateToMonth,
  onNavigateToDay
}) => {
  const isZh = state.settings.language === 'zh';
  const yearPlan = ensureYearPlan(state, selectedYear);
  const keyword = yearPlan.keyword;
  const goals = yearPlan.goals;
  const importantDates = yearPlan.importantDates;
  const review = yearPlan.review;
  const completedGoalsCount = goals.filter((goal) => goal.completed).length;
  const totalGoalsCount = goals.length;
  const promotedTodos = getDailyTodosForYear(state.dailyPlans, selectedYear);
  const yearCalendarEvents = Object.entries(state.calendarEvents)
    .filter(([dateKey]) => dateKey.startsWith(`${selectedYear}-`))
    .flatMap(([dateKey, events]) => ((events || []) as CalendarEvent[]).map((event) => ({ dateKey, event })))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const handleUpdateYearPlan = (updatedPlan: typeof yearPlan) => {
    const updatedYearPlans = { ...state.yearPlans, [selectedYear]: updatedPlan };
    onUpdateState({ ...state, yearPlans: updatedYearPlans });
  };

  // Propagate text changes directly to root state
  const handleKeywordChange = (val: string) => {
    handleUpdateYearPlan({ ...yearPlan, keyword: val });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    handleUpdateYearPlan({ ...yearPlan, goals: [...goals, newTodo(newGoalInput.trim())] });
    setNewGoalInput('');
  };

  const handleGoalChange = (id: string, val: string) => {
    handleUpdateYearPlan({
      ...yearPlan,
      goals: goals.map((goal) => goal.id === id ? { ...goal, text: val } : goal),
    });
  };

  const handleGoalToggle = (id: string) => {
    handleUpdateYearPlan({
      ...yearPlan,
      goals: goals.map((goal) => goal.id === id ? { ...goal, completed: !goal.completed } : goal),
    });
  };

  const handleGoalDelete = (id: string) => {
    handleUpdateYearPlan({
      ...yearPlan,
      goals: goals.filter((goal) => goal.id !== id),
    });
  };

  const handleMilestoneAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTitle) return;
    const newM: ImportantDate = {
      id: Math.random().toString(36).substr(2, 9),
      date: newDate.toUpperCase(),
      title: newTitle
    };
    const updatedMilestones = [...importantDates, newM];
    handleUpdateYearPlan({ ...yearPlan, importantDates: updatedMilestones });
    setNewDate('');
    setNewTitle('');
    setShowAddMilestone(false);
  };

  const handleMilestoneDelete = (id: string) => {
    const updatedMilestones = importantDates.filter(m => m.id !== id);
    handleUpdateYearPlan({ ...yearPlan, importantDates: updatedMilestones });
  };

  const handleReviewChange = (val: string) => {
    handleUpdateYearPlan({ ...yearPlan, review: val });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Year Selection Selector & Subheader */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-tertiary-fixed gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-primary">
            {isZh ? `${selectedYear}年度计划` : `${selectedYear} Yearly Blueprint`}
          </h2>
          <p className="text-xs text-on-surface-variant/80 mt-1">
            {isZh 
              ? '俯瞰新的一年。在网格纸上标注人生的理路，为每一片落日倾注时间。' 
              : 'Gaze upon your annual layout. Chart the course on textured washi paper blocks.'}
          </p>
        </div>

        {/* Dynamic Year Selectors */}
        <div className="flex gap-2 items-center">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">{isZh ? '选择年' : 'Blueprint'}</label>
          <div className="flex border border-tertiary-fixed rounded bg-surface overflow-hidden">
            {['2024', '2025', '2026'].map((yr) => (
              <button
                key={yr}
                onClick={() => onSetYear(yr)}
                className={`px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-primary text-on-primary'
                    : 'hover:bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Year Header Description: Keywords and Goals */}
      <div className="bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-tertiary-fixed shadow-[0px_4px_20px_rgba(0,0,0,0.02)] paper-sheet">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Section 1: Yearly Keyword */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-primary" />
              <label className="font-sans text-xs font-bold text-primary uppercase tracking-widest">
                {isZh ? '年度关键词' : 'Yearly Keyword'}
              </label>
            </div>
            <div className="relative border-b-[0.5px] border-tertiary-fixed pb-2 group">
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder={isZh ? '意图' : 'Intentionality'}
                className="paper-input w-full bg-transparent border-none focus:ring-0 p-0 font-serif text-3xl italic text-secondary font-bold placeholder:opacity-30"
              />
            </div>
            <p className="text-xs text-tertiary leading-relaxed">
              {isZh 
                ? '挑选一个核心词汇作为你这一年生活决策、精力和专注力的原点与基石。' 
                : 'Choose a single core word to anchor your thoughts and direct energy throughout the year.'}
            </p>
          </div>

          {/* Section 2: Yearly Goals */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-primary" />
              <label className="font-sans text-xs font-bold text-primary uppercase tracking-widest">
                {isZh ? '年度核心目标' : 'Yearly Primary Goals'}
              </label>
            </div>
            <div className="space-y-4">
              <form onSubmit={handleAddGoal} className="flex gap-2">
                <input
                  type="text"
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  placeholder={isZh ? '新增年度目标...' : 'Add a yearly goal...'}
                  className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
                />
                <button
                  type="submit"
                  className="px-2 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary-container shrink-0 cursor-pointer"
                >
                  {isZh ? '新增' : 'Add'}
                </button>
              </form>

              {goals.length === 0 ? (
                <p className="text-xs text-tertiary italic py-4">
                  {isZh ? '还没有年度目标。先写下一个小而清楚的方向。' : 'No yearly goals yet. Start with one clear direction.'}
                </p>
              ) : goals.map((g, idx) => (
                <div key={g.id} className="flex items-center gap-3 group">
                  <button
                    type="button"
                    onClick={() => handleGoalToggle(g.id)}
                    className={`paper-checkbox w-4 h-4 border border-secondary flex items-center justify-center transition-all shrink-0 ${
                      g.completed ? 'bg-secondary-container/60' : 'bg-transparent'
                    }`}
                    title={isZh ? '切换完成状态' : 'Toggle complete'}
                  >
                    {g.completed && <span className="text-secondary font-mono text-[9px] font-bold leading-none">X</span>}
                  </button>
                  <span className="font-sans text-xs font-bold text-tertiary">{String(idx + 1).padStart(2, '0')}</span>
                  <input
                    type="text"
                    value={g.text}
                    onChange={(e) => handleGoalChange(g.id, e.target.value)}
                    placeholder={idx === 3 ? '...' : (isZh ? '写下你的核心设想...' : 'Write your core intention...')}
                    className={`paper-input w-full bg-transparent border-none border-b-[0.5px] border-tertiary-fixed hover:border-primary-container focus:ring-0 focus:border-primary py-1 font-sans text-sm placeholder:opacity-30 transition-all ${
                      g.completed ? 'line-through text-on-surface-variant/40 italic' : 'text-on-surface'
                    }`}
                  />
                  <button
                    onClick={() => handleGoalDelete(g.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:text-error transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 12 Mini Months Grid (Bird's-eye View) */}
      <div className="bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-tertiary-fixed shadow-[0px_4px_20px_rgba(0,0,0,0.02)] paper-sheet">
        <header className="flex justify-between items-end mb-6 border-b-[0.5px] border-tertiary-fixed pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h3 className="font-serif text-lg font-bold text-primary">
              {isZh ? `${selectedYear}年 年度纵览` : `${selectedYear} Bird's-eye Grid`}
            </h3>
          </div>
          <span className="text-xs text-tertiary italic">
            {isZh ? '点击月份名称进入月度，点击日期跳转单日' : 'Click months to open grid, click days to jump to journal'}
          </span>
        </header>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
          {Array.from({ length: 12 }).map((_, mIdx) => {
            const yrNum = parseInt(selectedYear);
            const gridCells = generateCalendarGrid(yrNum, mIdx);
            const monthName = isZh ? MONTHS_ZH[mIdx] : MONTHS_EN[mIdx];
            const weekDays = isZh ? DAYS_ZH : DAYS_EN;
            
            return (
              <div 
                key={mIdx} 
                className="group border border-transparent hover:border-tertiary-fixed/33 p-2.5 rounded-lg transition-all duration-300 bg-surface-container-low/20 hover:bg-surface-container-low/60"
              >
                {/* Header month block */}
                <div 
                  onClick={() => onNavigateToMonth(mIdx)}
                  className="flex justify-between items-center mb-2.5 pb-1 border-b border-dashed border-tertiary-fixed/50 cursor-pointer text-primary hover:text-secondary transition-colors"
                >
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider">
                    {monthName}
                  </h4>
                  <span className="font-mono text-[10px] opacity-60">
                    {String(mIdx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Days matrix */}
                <div className="grid grid-cols-7 gap-px text-center">
                  {/* Weekday indicator */}
                  {weekDays.map((d, dIdx) => (
                    <span key={dIdx} className="text-[7px] font-bold text-tertiary-container/80 tracking-tighter block mb-1">
                      {isZh ? d : d.charAt(0)}
                    </span>
                  ))}

                  {/* Day cells */}
                  {gridCells.map((cell, cIdx) => {
                    const isSunday = cIdx % 7 === 0;
                    const isSaturday = cIdx % 7 === 6;
                    
                    return (
                      <span
                        key={cIdx}
                        onClick={() => {
                          if (cell.isCurrentMonth) {
                            onNavigateToDay(cell.dateKey);
                          }
                        }}
                        className={`aspect-square flex items-center justify-center font-mono text-[9px] rounded-full transition-colors ${
                          !cell.isCurrentMonth 
                            ? 'opacity-20 pointer-events-none' 
                            : 'cursor-pointer hover:bg-secondary-container hover:text-on-secondary-container text-on-surface-variant'
                        } ${
                          (isSunday || isSaturday) && cell.isCurrentMonth ? 'text-error/75' : ''
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    );
                  })}
                </div>

                {/* Mini bar accent for Techo line art decoration */}
                <div className="h-4 border-t-[0.5px] border-tertiary-fixed/40 mt-3 pt-1 flex items-center gap-1.5 opacity-60">
                  <div className="w-2/3 h-[2px] bg-secondary-container rounded-full" />
                  <div className="w-1/3 h-[2px] bg-tertiary-fixed rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom section: Split Milestone Dates & Reflection Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-tertiary-fixed shadow-[0px_4px_20px_rgba(0,0,0,0.02)] paper-panel">
          <div className="flex items-center gap-2 mb-5">
            <CalendarCheck size={18} className="text-secondary" />
            <h3 className="font-serif text-lg font-bold text-primary">
              {isZh ? '年度重要事项' : 'Important Yearly Items'}
            </h3>
          </div>
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {promotedTodos.length === 0 ? (
              <p className="text-xs text-tertiary italic text-center py-6">
                {isZh ? '今年还没有从日计划标记的重要事项' : 'No important daily items marked for this year yet.'}
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
                <span className="font-mono text-[10px] text-tertiary shrink-0">{dateKey}</span>
                <span className={`text-xs ${todo.completed ? 'line-through text-on-surface-variant/45 italic' : 'text-on-surface'}`}>
                  {todo.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-tertiary-fixed shadow-[0px_4px_20px_rgba(0,0,0,0.02)] paper-panel">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={18} className="text-primary" />
            <h3 className="font-serif text-lg font-bold text-primary">
              {isZh ? '年度日历事件 / 节假日' : 'Yearly Calendar Events / Holidays'}
            </h3>
          </div>
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {yearCalendarEvents.length === 0 ? (
              <p className="text-xs text-tertiary italic text-center py-6">
                {isZh ? '今年还没有导入日历事件或节假日' : 'No calendar events imported for this year yet.'}
              </p>
            ) : yearCalendarEvents.map(({ dateKey, event }) => (
              <div key={`${dateKey}-${event.id}`} className="flex items-center gap-2 border-b border-dashed border-tertiary-fixed/40 pb-1.5">
                <span className="font-mono text-[10px] text-tertiary shrink-0">{dateKey}</span>
                <span className="px-2 py-0.5 rounded-sm border border-tertiary-fixed bg-surface-container-low text-[10px] text-tertiary">
                  {event.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Milestone lists */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-tertiary-fixed shadow-[0px_4px_20px_rgba(0,0,0,0.02)] paper-panel">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-secondary" />
              <h3 className="font-serif text-lg font-bold text-primary">
                {isZh ? '重要纪念日与里程碑' : 'Important Milestone Dates'}
              </h3>
            </div>
            
            <button
              onClick={() => setShowAddMilestone(!showAddMilestone)}
              className="px-2 py-1 border border-tertiary-fixed hover:border-primary text-[10px] font-bold uppercase rounded flex items-center gap-1 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
            >
              <Plus size={12} />
              <span>{isZh ? '添加' : 'Add'}</span>
            </button>
          </div>

          {/* Inline Milestone Creation Forms */}
          {showAddMilestone && (
            <form onSubmit={handleMilestoneAdd} className="bg-surface-container-low p-4 rounded mb-6 border border-tertiary-fixed animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-tertiary ml-0.5">{isZh ? '日期 (如 OCT 24)' : 'Date (e.g., OCT 24)'}</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    placeholder="OCT 24"
                    className="paper-input w-full text-xs font-mono p-1.5 border border-tertiary-fixed rounded bg-surface focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-tertiary ml-0.5">{isZh ? '说明/事件' : 'Intention Label'}</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    placeholder={isZh ? '写数码排毒或旅行...' : 'Autumn Wilderness Picnic...'}
                    className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded bg-surface focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(false)}
                  className="px-2 py-1 text-tertiary-container hover:text-primary"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 bg-primary text-on-primary rounded font-bold"
                >
                  {isZh ? '保存' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* Milestones list displays */}
          <div className="space-y-4">
            {importantDates.length === 0 ? (
              <p className="text-xs text-tertiary italic text-center py-6">
                {isZh ? '尚无记录。点击右上方 [添加] 自定义年度重点日期。' : 'No milestones logged. Tap [Add] to log critical dates.'}
              </p>
            ) : (
              importantDates.map((m) => (
                <div key={m.id} className="flex items-center gap-4 group">
                  <span className="w-16 font-sans text-xs font-bold text-secondary uppercase tracking-wider">{m.date}</span>
                  <div className="flex-grow border-b border-tertiary-fixed pb-2 group-hover:border-primary transition-colors flex items-center justify-between">
                    <span className="text-xs text-on-surface">{m.title}</span>
                    <button
                      onClick={() => handleMilestoneDelete(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:text-error transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Annual Review Reflection Questions */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg p-6 md:p-8 border border-tertiary-fixed shadow-[0px_4px_20px_rgba(0,0,0,0.02)] paper-panel">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={18} className="text-primary" />
            <h3 className="font-serif text-lg font-bold text-primary">
              {isZh ? `${selectedYear}年度复盘与体悟` : `${selectedYear} Yearly Reflection`}
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wider">
                {isZh ? '年度复盘' : 'Yearly Review'}
              </p>
              <textarea
                value={review}
                onChange={(e) => handleReviewChange(e.target.value)}
                placeholder={isZh ? '回顾今年的快乐、教训、变化，以及下一年想保留的节奏...' : 'Reflect on joy, lessons, changes, and the rhythm you want to keep...'}
                rows={6}
                className="paper-input w-full bg-transparent border-none border-b-[0.5px] border-tertiary-fixed focus:ring-0 focus:border-primary p-0 text-xs italic text-on-surface-variant resize-none h-32"
              />
            </div>

            {/* Progress indicators */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-[10px] text-tertiary font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <CalendarCheck size={12} className="text-primary" />
                  <span>
                    {isZh 
                      ? `已完成 ${completedGoalsCount} / ${totalGoalsCount} 目标` 
                      : `Completed ${completedGoalsCount}/${totalGoalsCount} Goals`}
                  </span>
                </span>
                <span>{isZh ? '最后更新: 五月' : 'Last updated: May'}</span>
              </div>
              
              {/* Progress Bar meter */}
              <div className="w-full h-1 bg-surface-container rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-primary hover:bg-primary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, (completedGoalsCount / (totalGoalsCount || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
