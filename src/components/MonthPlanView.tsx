import React, { useState } from 'react';
import { PlannerState, MonthPlan } from '../types';
import { generateCalendarGrid, getTodayDateKey, MONTHS_EN, MONTHS_ZH, DAYS_EN, DAYS_ZH } from '../utils/calendar';
import { ensureMonthPlan, newTodo } from '../utils/storage';
import { ChevronLeft, ChevronRight, HelpCircle, Check, Plus, Trash2, Calendar, Target, CheckSquare, Edit, Notebook, Paperclip } from 'lucide-react';

interface MonthPlanViewProps {
  state: PlannerState;
  selectedDateStr: string; // YYYY-MM-DD
  onSetSelectedDateStr: (date: string) => void;
  onUpdateState: (newState: PlannerState) => void;
  onNavigateToDay: (dateStr: string) => void;
  onNavigateToWeek: (dateStr?: string) => void;
  selectedYear: string;
  onSetYear: (yr: string) => void;
}

export const MonthPlanView: React.FC<MonthPlanViewProps> = ({
  state,
  selectedDateStr,
  onSetSelectedDateStr,
  onUpdateState,
  onNavigateToDay,
  onNavigateToWeek,
  selectedYear,
  onSetYear
}) => {
  const isZh = state.settings.language === 'zh';
  
  // Extract month and year from selectedDateStr (or fallback)
  const [dateObj, setDateObj] = useState(() => {
    const parts = selectedDateStr.split('-');
    const parsedYear = parseInt(parts[0]);
    const parsedMonth = parseInt(parts[1]);
    return {
      year: Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear(),
      month: Number.isFinite(parsedMonth) ? parsedMonth - 1 : new Date().getMonth()
    };
  });

  const yearStr = String(dateObj.year);
  const monthKey = `${yearStr}-${String(dateObj.month + 1).padStart(2, '0')}`;

  // Get monthly plan from state, or load default empty one if missing
  const monthlyPlan: MonthPlan = ensureMonthPlan(state, monthKey);

  // State for adding events
  const [selectedCellDateKey, setSelectedCellDateKey] = useState<string | null>(null);
  const [editingEventText, setEditingEventText] = useState('');

  // Helpers for simple month scrolling
  const handlePrevMonth = () => {
    setDateObj(prev => {
      let newM = prev.month - 1;
      let newY = prev.year;
      if (newM < 0) {
        newM = 11;
        newY = prev.year - 1;
      }
      onSetYear(String(newY)); // synchronise global selected year
      onSetSelectedDateStr(`${newY}-${String(newM + 1).padStart(2, '0')}-01`);
      return { year: newY, month: newM };
    });
    setSelectedCellDateKey(null);
  };

  const handleNextMonth = () => {
    setDateObj(prev => {
      let newM = prev.month + 1;
      let newY = prev.year;
      if (newM > 11) {
        newM = 0;
        newY = prev.year + 1;
      }
      onSetYear(String(newY)); // synchronise global selected year
      onSetSelectedDateStr(`${newY}-${String(newM + 1).padStart(2, '0')}-01`);
      return { year: newY, month: newM };
    });
    setSelectedCellDateKey(null);
  };

  const handleJumpToToday = () => {
    const todayParts = getTodayDateKey().split('-');
    const newY = parseInt(todayParts[0]) || 2026;
    const parsedMonth = parseInt(todayParts[1]);
    const newM = Number.isFinite(parsedMonth) ? parsedMonth - 1 : new Date().getMonth();
    setDateObj({ year: newY, month: newM });
    onSetSelectedDateStr(`${newY}-${String(newM + 1).padStart(2, '0')}-01`);
    onSetYear(String(newY));
    setSelectedCellDateKey(null);
  };

  // State modifiers for monthly content
  const handleUpdateMonthlyPlan = (updated: MonthPlan) => {
    const updatedPlans = { ...state.monthPlans, [monthKey]: updated };
    onUpdateState({ ...state, monthPlans: updatedPlans });
  };

  // Focus list actions
  const handleAddFocus = () => {
    const defaultText = isZh ? '新的月度中心 Focus...' : 'New Monthly Focus Intention...';
    const updatedList = [...monthlyPlan.goals, defaultText];
    handleUpdateMonthlyPlan({ ...monthlyPlan, goals: updatedList });
  };

  const handleFocusChange = (idx: number, val: string) => {
    const updatedList = [...monthlyPlan.goals];
    updatedList[idx] = val;
    handleUpdateMonthlyPlan({ ...monthlyPlan, goals: updatedList });
  };

  const handleDeleteFocus = (idx: number) => {
    const updatedList = monthlyPlan.goals.filter((_, i) => i !== idx);
    handleUpdateMonthlyPlan({ ...monthlyPlan, goals: updatedList });
  };

  // Todo list actions
  const [newTodoInput, setNewTodoInput] = useState('');
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) return;
    const updatedList = [...monthlyPlan.todos, newTodo(newTodoInput.trim())];
    handleUpdateMonthlyPlan({ ...monthlyPlan, todos: updatedList });
    setNewTodoInput('');
  };

  const handleToggleTodo = (id: string) => {
    const updatedList = monthlyPlan.todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    handleUpdateMonthlyPlan({ ...monthlyPlan, todos: updatedList });
  };

  const handleDeleteTodo = (id: string) => {
    const updatedList = monthlyPlan.todos.filter(t => t.id !== id);
    handleUpdateMonthlyPlan({ ...monthlyPlan, todos: updatedList });
  };

  // Review area actions
  const handleReviewChange = (val: string) => {
    handleUpdateMonthlyPlan({ ...monthlyPlan, review: val });
  };

  // Day Event logging
  const handleOpenEventEditor = (dateKey: string) => {
    setSelectedCellDateKey(dateKey);
    setEditingEventText(monthlyPlan.dayNotes[dateKey] || '');
  };

  const handleDayNoteChange = (value: string) => {
    if (selectedCellDateKey === null) return;
    setEditingEventText(value);

    const updatedDayNotes = { ...monthlyPlan.dayNotes };
    if (value.trim()) {
      updatedDayNotes[selectedCellDateKey] = value;
    } else {
      delete updatedDayNotes[selectedCellDateKey];
    }
    handleUpdateMonthlyPlan({ ...monthlyPlan, dayNotes: updatedDayNotes });
  };

  // Generate date calculations
  const gridCells = generateCalendarGrid(dateObj.year, dateObj.month);
  const monthName = isZh ? MONTHS_ZH[dateObj.month] : MONTHS_EN[dateObj.month];
  const weekDays = isZh ? DAYS_ZH : DAYS_EN;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Month Header Controller Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-tertiary-fixed gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-primary">
            {monthName} {dateObj.year}
          </h2>
          <p className="text-xs text-on-surface-variant/80 mt-1">
            {isZh 
              ? '把琐事安放在格子里。本月的重点与复盘将与月历并行，形成内省的回环。' 
              : 'Settle schedules inside structured grids. Side notes align month focuses.'}
          </p>
        </div>

        {/* Nav arrows */}
        <div className="flex gap-2">
          <button 
            onClick={handleJumpToToday}
            className="px-3 py-1.5 border border-tertiary-fixed text-[11px] font-bold rounded uppercase hover:bg-surface-container bg-surface transition-all cursor-pointer"
          >
            {isZh ? '返回今日所在月' : 'Today Month'}
          </button>
          <button
            onClick={() => onNavigateToWeek(selectedDateStr)}
            className="px-3 py-1.5 border border-tertiary-fixed text-[11px] font-bold rounded uppercase hover:bg-surface-container bg-surface transition-all cursor-pointer"
          >
            {isZh ? '查看本周计划' : 'Week Plan'}
          </button>
          
          <div className="flex border border-tertiary-fixed rounded bg-surface overflow-hidden">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-surface-container transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-full w-[0.5px] bg-tertiary-fixed" />
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-surface-container transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main split dashboard block: Calendar grid vs Notes Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: 7x6/7x5 Hobonichi grid calendar sheet */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-lg border border-tertiary-fixed shadow-[0px_4px_25px_rgba(0,0,0,0.015)] overflow-hidden paper-sheet">
          
          {/* Calendar sheet header info */}
          <div className="bg-surface-container-low px-4 py-2 border-b border-tertiary-fixed flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold tracking-widest text-secondary uppercase flex items-center gap-1.5">
              <Calendar size={12} className="text-primary" />
              <span>{isZh ? '月度网格日历' : 'Washi Grid Journal'}</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
              <span className="text-[10px] font-serif text-tertiary italic">{isZh ? '点格子以添加日程标记或总结' : 'Tap any cell to write notes'}</span>
            </div>
          </div>

          {/* Calendar main board grids */}
          <div className="grid grid-cols-7 border-t border-l border-transparent calendar-day-board">
            
            {/* Weekday columns headings */}
            {weekDays.map((wd, wdIdx) => (
              <div 
                key={wdIdx} 
                className="py-3 text-center border-b border-r border-tertiary-fixed/40 bg-surface-container-low/50"
              >
                <span className="font-sans text-[10px] font-bold text-secondary">
                  {wd}
                </span>
              </div>
            ))}

            {/* Individual Day Grids */}
            {gridCells.map((cell, cIdx) => {
              const parts = cell.dateKey.split('-');
              const hasEvents = monthlyPlan.dayNotes[cell.dateKey] && cell.isCurrentMonth;
              const isSunday = cIdx % 7 === 0;
              const isSaturday = cIdx % 7 === 6;
              const isSelectedToday = cell.dateKey === selectedDateStr;

              return (
                <div
                  key={cIdx}
                  onClick={() => cell.isCurrentMonth && onNavigateToDay(cell.dateKey)}
                  className={`aspect-square p-2 border-b border-r border-tertiary-fixed/30 hover:bg-surface-container-low/40 transition-all relative flex flex-col justify-between group cursor-pointer select-none ${
                    !cell.isCurrentMonth ? 'opacity-20 pointer-events-none bg-surface-container-low/20' : ''
                  } ${
                    isSelectedToday ? 'bg-secondary-fixed/50 ring-1 ring-inset ring-secondary/30' : ''
                  }`}
                >
                  {/* Top: Day Num and jump icons */}
                  <div className="flex justify-between items-start">
                    <span className={`font-mono text-xs font-bold ${
                      (isSunday || isSaturday) && cell.isCurrentMonth ? 'text-error/75' : 'text-on-surface'
                    }`}>
                      {cell.dayNumber}
                    </span>
                    
                    {/* Hover Jump to Daily Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEventEditor(cell.dateKey);
                      }}
                      title={isZh ? '编辑月历简短备注' : 'Edit short month note'}
                      className="opacity-0 group-hover:opacity-100 p-0.5 pointer-events-auto bg-surface border border-tertiary text-on-surface-variant hover:text-primary rounded text-[9px] font-bold uppercase hover:bg-surface-container transition-all"
                    >
                      Note
                    </button>
                  </div>

                  {/* Body: Events text markup list mimicking handwriting */}
                  <div className="flex-grow mt-1.5 flex flex-col justify-end overflow-hidden">
                    {hasEvents && (
                      <div className="bg-primary-container/10 border-l border-primary px-1 py-0.5 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="font-sans text-[9px] md:text-[10px] text-primary select-none font-medium leading-tight">
                          {monthlyPlan.dayNotes[cell.dateKey]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tiny background Grid Pattern for textures */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-[0.13] pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: focus lists, checkboxes list review */}
        <div className="lg:col-span-4 space-y-6">

          {/* Popover / Overlay Drawer inside sidebar for Event Editing */}
          {selectedCellDateKey !== null && (
            <div className="bg-surface rounded-lg border border-primary p-5 shadow-lg space-y-3 animate-in slide-in-from-right duration-200 paper-panel">
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-tertiary-fixed">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Edit size={12} />
                  <span>{isZh ? `编辑 ${selectedCellDateKey} 简短备注` : `Edit ${selectedCellDateKey} Note`}</span>
                </span>
                <span className="text-[10px] font-mono text-tertiary uppercase">{yearStr}-{String(dateObj.month + 1).padStart(2, '0')}</span>
              </div>
              <input
                type="text"
                value={editingEventText}
                onChange={(e) => handleDayNoteChange(e.target.value)}
                placeholder={isZh ? '输入本假日安排，如: 园艺清理 / 深度开发...' : 'Enter schedules, e.g., Garden Cleanup...'}
                className="paper-input w-full text-xs p-2 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-surface-bright"
                autoFocus
              />
              <div className="flex justify-end gap-2 text-[11px]">
                <button
                  onClick={() => setSelectedCellDateKey(null)}
                  className="px-2.5 py-1 border border-tertiary text-on-surface hover:bg-surface-container rounded transition-colors"
                >
                  {isZh ? '关闭' : 'Close'}
                </button>
              </div>
            </div>
          )}
          
          {/* Section 1: This month focus points bullets */}
          <div className="bg-surface-container-lowest rounded-lg border border-tertiary-fixed p-6 shadow-sm space-y-4 paper-panel">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Target size={14} className="text-secondary" />
                <span>{isZh ? '本月聚焦 Focus' : "This Month's Focus"}</span>
              </h3>
              <button
                onClick={handleAddFocus}
                className="p-1 border border-tertiary-fixed hover:border-primary rounded text-tertiary hover:text-primary transition-all cursor-pointer"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {monthlyPlan.goals.length === 0 ? (
                <p className="text-xs text-tertiary italic py-4 text-center">
                  {isZh ? '无重点指标。点击 [+] 添加本月主要任务聚焦。' : 'No focus bullets loaded. Press [+] to create focus.'}
                </p>
              ) : (
                monthlyPlan.goals.map((fText, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                    <input
                      type="text"
                      value={fText}
                      onChange={(e) => handleFocusChange(index, e.target.value)}
                      className="paper-input w-full text-xs bg-transparent border-none border-b border-transparent focus:border-tertiary-fixed hover:border-tertiary-fixed/40 p-0.5 text-on-surface"
                    />
                    <button
                      onClick={() => handleDeleteFocus(index)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: This month to-do checklist */}
          <div className="bg-surface-container-lowest rounded-lg border border-tertiary-fixed p-6 shadow-sm space-y-4 paper-panel">
            <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <CheckSquare size={14} className="text-secondary" />
              <span>{isZh ? '本月待办 Checklist' : "This Month's To-Do"}</span>
            </h3>

            {/* Form for quick add */}
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                placeholder={isZh ? '添加待办事项...' : 'Add monthly task...'}
                className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
              />
              <button
                type="submit"
                className="px-2 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary-container shrink-0 cursor-pointer"
              >
                {isZh ? '新增' : 'Add'}
              </button>
            </form>

            {/* Log item checkboxes */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {monthlyPlan.todos.length === 0 ? (
                <p className="text-xs text-tertiary italic text-center py-4">
                  {isZh ? '待办事项已全部完成。' : 'No items inside checklist.'}
                </p>
              ) : (
                monthlyPlan.todos.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between group gap-2">
                    <div 
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-grow select-none"
                    >
                      {/* Paper checkmark custom button */}
                      <div className={`paper-checkbox w-4.5 h-4.5 border border-secondary flex items-center justify-center transition-all ${
                        todo.completed ? 'bg-secondary-container/60' : 'bg-transparent'
                      }`}>
                        {todo.completed && (
                          <span className="text-secondary font-mono text-[10px] font-bold select-none leading-none">X</span>
                        )}
                      </div>
                      
                      <span className={`text-xs ${
                        todo.completed 
                          ? 'line-through text-on-surface-variant/40 italic' 
                          : 'text-on-surface'
                      }`}>
                        {todo.text}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Monthly Review box */}
          <div className="bg-surface-container border border-tertiary-fixed rounded-lg p-6 space-y-4 paper-panel">
            <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5">
              <Notebook size={14} className="text-secondary" />
              <span>{isZh ? '本月总结与复盘 Reflections' : 'Monthly Reflections'}</span>
            </h3>

            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block">
              {isZh ? '★ 本月目标、收获与复盘' : '★ MONTHLY GOALS, WINS & REVIEW'}
            </label>
            <textarea
              value={monthlyPlan.review}
              onChange={(e) => handleReviewChange(e.target.value)}
              placeholder={isZh ? '回顾这个月的重点、成就、阻力，以及下月可以优化的地方...' : 'Review this month\'s focus, wins, blockers, and next improvements...'}
              rows={5}
              className="paper-input w-full bg-surface-bright border border-tertiary-fixed/60 rounded p-2 text-xs italic text-on-surface-variant resize-none focus:outline-none focus:border-primary"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
