import React, { useState } from 'react';
import { PlannerState, DailyPlan, EisenhowerMatrix } from '../types';
import { addDaysToDateKey, formatFullEnglishDate, formatFullChineseDate, getTodayDateKey } from '../utils/calendar';
import { ensureDailyPlan, newScheduleItem, newTodo } from '../utils/storage';
import { 
  Sun, Cloud, CloudRain, Snowflake, Wind, Trash2, Plus, 
  ChevronLeft, ChevronRight, Check, Heart, HelpCircle, 
  Clock, CheckSquare, Award, ArrowRight, Eye, ClipboardList
} from 'lucide-react';

interface DailyPlanViewProps {
  state: PlannerState;
  selectedDateStr: string; // "YYYY-MM-DD"
  onSetSelectedDateStr: (date: string) => void;
  onUpdateState: (newState: PlannerState) => void;
  onNavigateToWeek: (dateStr?: string) => void;
  onSetYear: (yr: string) => void;
}

const DEFAULT_SCHEDULE_HOURS = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];

const SERENE_QUOTES = [
  { zh: "心存正念，专注细节。在无声的笔尖下，安放岁月的波澜。", en: "Stillness of the mind is the key to clarity in design and focus." },
  { zh: "缓步而行，在每一个格子里灌注深思熟愧的灵魂。", en: "Walk on serene steps. Inscribe deliberate thoughts inside structured grids." },
  { zh: "极简不是退让，而是对生命最本真光亮的主动抉择。", en: "Minimalism is not subtraction; it is the deliberate embrace of essence." },
  { zh: "静水流深，日日是好日。凡所发生，皆有其意图。", en: "Deep waters flow in silent circles. Every single dawn is a beautiful beginning." }
];

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({
  state,
  selectedDateStr,
  onSetSelectedDateStr,
  onUpdateState,
  onNavigateToWeek,
  onSetYear
}) => {
  const isZh = state.settings.language === 'zh';

  // Get active day state or load default template
  const dailyPlan: DailyPlan = ensureDailyPlan(state, selectedDateStr);

  // State for adding quadrant items
  const [quadrantInputs, setQuadrantInputs] = useState({
    urgentImportant: '',
    importantNotUrgent: '',
    urgentNotImportant: '',
    notUrgentNotImportant: ''
  });

  // State for a new checklist item
  const [newTodoInput, setNewTodoInput] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleText, setNewScheduleText] = useState('');
  
  const handlePrevDay = () => {
    const prevDate = addDaysToDateKey(selectedDateStr, -1);
    onSetSelectedDateStr(prevDate);
    const targetYr = prevDate.split('-')[0];
    onSetYear(targetYr);
  };

  const handleNextDay = () => {
    const nextDate = addDaysToDateKey(selectedDateStr, 1);
    onSetSelectedDateStr(nextDate);
    const targetYr = nextDate.split('-')[0];
    onSetYear(targetYr);
  };

  const handleJumpToToday = () => {
    const today = getTodayDateKey();
    onSetSelectedDateStr(today);
    onSetYear(today.slice(0, 4));
  };

  // State modifiers
  const handleUpdateDailyPlan = (updatedPlan: DailyPlan) => {
    const updatedPlansObj = { ...state.dailyPlans, [selectedDateStr]: updatedPlan };
    onUpdateState({ ...state, dailyPlans: updatedPlansObj });
  };

  const handleSetWeather = (w: string) => {
    handleUpdateDailyPlan({ ...dailyPlan, weather: w });
  };

  const handleSetMood = (m: string) => {
    handleUpdateDailyPlan({ ...dailyPlan, mood: m });
  };

  const handleTopPriorityChange = (value: string) => {
    handleUpdateDailyPlan({ ...dailyPlan, topPriority: value });
  };

  // Schedule timeline editing
  const handleScheduleChange = (hour: string, value: string) => {
    const existing = dailyPlan.schedule.find((item) => item.time === hour);
    const updatedSchedule = value.trim() === ''
      ? dailyPlan.schedule.filter((item) => item.time !== hour)
      : existing
        ? dailyPlan.schedule.map((item) => item.time === hour ? { ...item, text: value } : item)
        : [...dailyPlan.schedule, newScheduleItem(hour, value)];
    handleUpdateDailyPlan({ ...dailyPlan, schedule: updatedSchedule });
  };

  const handleAddScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTime.trim() || !newScheduleText.trim()) return;
    const time = newScheduleTime.trim();
    const existing = dailyPlan.schedule.find((item) => item.time === time);
    const updatedSchedule = existing
      ? dailyPlan.schedule.map((item) => item.time === time ? { ...item, text: newScheduleText.trim() } : item)
      : [...dailyPlan.schedule, newScheduleItem(time, newScheduleText.trim())];
    handleUpdateDailyPlan({ ...dailyPlan, schedule: updatedSchedule });
    setNewScheduleTime('');
    setNewScheduleText('');
  };

  // Quadrants Addition / deletion helpers
  const handleAddQuadrantItem = (quadrant: keyof EisenhowerMatrix) => {
    const text = quadrantInputs[quadrant].trim();
    if (!text) return;

    const currentList = dailyPlan.eisenhower[quadrant] || [];
    const updatedList = [...currentList, text];
    
    const updatedEisenhower = {
      ...dailyPlan.eisenhower,
      [quadrant]: updatedList
    };

    handleUpdateDailyPlan({ ...dailyPlan, eisenhower: updatedEisenhower });
    setQuadrantInputs(prev => ({ ...prev, [quadrant]: '' }));
  };

  const handleDeleteQuadrantItem = (quadrant: keyof EisenhowerMatrix, index: number) => {
    const currentList = dailyPlan.eisenhower[quadrant] || [];
    const updatedList = currentList.filter((_, i) => i !== index);
    
    const updatedEisenhower = {
      ...dailyPlan.eisenhower,
      [quadrant]: updatedList
    };

    handleUpdateDailyPlan({ ...dailyPlan, eisenhower: updatedEisenhower });
  };

  // Checklist adding / deletion / toggling
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) return;
    
    const updatedTodo = [...dailyPlan.todos, newTodo(newTodoInput.trim())];
    handleUpdateDailyPlan({ ...dailyPlan, todos: updatedTodo });
    setNewTodoInput('');
  };

  const handleToggleTodo = (id: string) => {
    const updatedTodo = dailyPlan.todos.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleUpdateDailyPlan({ ...dailyPlan, todos: updatedTodo });
  };

  const handleTodoTextChange = (id: string, text: string) => {
    const updatedTodo = dailyPlan.todos.map(item =>
      item.id === id ? { ...item, text } : item
    );
    handleUpdateDailyPlan({ ...dailyPlan, todos: updatedTodo });
  };

  const handleDeleteTodo = (id: string) => {
    const updatedTodo = dailyPlan.todos.filter(item => item.id !== id);
    handleUpdateDailyPlan({ ...dailyPlan, todos: updatedTodo });
  };

  const handleNotesChange = (text: string) => {
    handleUpdateDailyPlan({ ...dailyPlan, notes: text });
  };

  const handleDiaryChange = (text: string) => {
    handleUpdateDailyPlan({ ...dailyPlan, diary: text });
  };

  // Choose quote based on a simple math modulo of the current day to inspire focus
  const dayStrNum = parseInt(selectedDateStr.split('-')[2]) || 0;
  const activeQuote = SERENE_QUOTES[dayStrNum % SERENE_QUOTES.length];
  const scheduleHours = Array.from(new Set([
    ...DEFAULT_SCHEDULE_HOURS,
    ...dailyPlan.schedule.map((item) => item.time)
  ])).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Date, Weather, and Mood controller */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 border-b border-tertiary-fixed gap-4">
        
        {/* Date paginator */}
        <div className="flex items-center gap-3">
          <div className="flex border border-tertiary-fixed rounded bg-surface overflow-hidden">
            <button 
              onClick={handlePrevDay} 
              className="p-2 hover:bg-surface-container-low transition-colors cursor-pointer"
              title={isZh ? '前一天' : 'Previous Day'}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-6 w-[0.5px] bg-tertiary-fixed self-center" />
            <button 
              onClick={handleNextDay} 
              className="p-2 hover:bg-surface-container-low transition-colors cursor-pointer"
              title={isZh ? '后一天' : 'Next Day'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            onClick={handleJumpToToday}
            className="px-3 py-1.5 border border-tertiary-fixed text-[11px] font-bold rounded hover:bg-surface-container bg-surface transition-all cursor-pointer"
          >
            {isZh ? '返回今日' : 'Today'}
          </button>

          <button
            onClick={() => onNavigateToWeek(selectedDateStr)}
            className="px-3 py-1.5 border border-tertiary-fixed text-[11px] font-bold rounded hover:bg-surface-container bg-surface transition-all cursor-pointer"
          >
            {isZh ? '进入本周计划' : 'Week Plan'}
          </button>
          
          <div className="ml-1">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-primary">
              {isZh ? formatFullChineseDate(selectedDateStr) : formatFullEnglishDate(selectedDateStr)}
            </h2>
            <p className="text-[10px] font-mono text-tertiary uppercase tracking-widest mt-0.5">
              Techo Ledger NO. {selectedDateStr.replace(/-/g, '/')}
            </p>
          </div>
        </div>

        {/* Weather status and Emotional bubbles */}
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Weather picker */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{isZh ? '天气' : 'Weather'}</span>
            <div className="flex border border-tertiary p-0.5 rounded-sm bg-surface-bright space-x-0.5">
              <button 
                onClick={() => handleSetWeather('sunny')}
                className={`p-1 rounded-sm transition-all cursor-pointer ${dailyPlan.weather === 'sunny' ? 'bg-secondary-container text-secondary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                title="Sunny"
              >
                <Sun size={13} />
              </button>
              <button 
                onClick={() => handleSetWeather('cloudy')}
                className={`p-1 rounded-sm transition-all cursor-pointer ${dailyPlan.weather === 'cloudy' ? 'bg-secondary-container text-secondary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                title="Cloudy"
              >
                <Cloud size={13} />
              </button>
              <button 
                onClick={() => handleSetWeather('rainy')}
                className={`p-1 rounded-sm transition-all cursor-pointer ${dailyPlan.weather === 'rainy' ? 'bg-secondary-container text-secondary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                title="Rainy"
              >
                <CloudRain size={13} />
              </button>
              <button 
                onClick={() => handleSetWeather('snowy')}
                className={`p-1 rounded-sm transition-all cursor-pointer ${dailyPlan.weather === 'snowy' ? 'bg-secondary-container text-secondary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                title="Snowy"
              >
                <Snowflake size={13} />
              </button>
              <button 
                onClick={() => handleSetWeather('windy')}
                className={`p-1 rounded-sm transition-all cursor-pointer ${dailyPlan.weather === 'windy' ? 'bg-secondary-container text-secondary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                title="Windy"
              >
                <Wind size={13} />
              </button>
            </div>
          </div>

          {/* Mood scale (1-5 minimalist circles) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{isZh ? '心智/情绪' : 'Mood'}</span>
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => handleSetMood(String(level))}
                  className={`w-5 h-5 rounded-full border border-secondary text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${
                    dailyPlan.mood === String(level)
                      ? 'bg-primary text-on-primary border-primary scale-105' 
                      : 'text-secondary hover:bg-surface-container-low bg-transparent'
                  }`}
                  title={`${level}/5`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Main split work board: Notebook design sheets vs Action columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Ruled Papier ledger page */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg border border-tertiary-fixed shadow-[0px_4px_25px_rgba(0,0,0,0.012)] relative overflow-hidden linen-texture paper-sheet">
          
          {/* Top aesthetic picture collage block */}
          <div className="relative aspect-[3/1] w-full overflow-hidden border-b border-tertiary-fixed local-poster">
            <div className="absolute inset-x-0 bottom-0 p-3 flex justify-between items-end">
              <span className="font-serif italic text-xs text-primary tracking-widest font-medium">No. 2026.05 - Zenith Stationery</span>
              <span className="text-[9px] font-mono text-tertiary/80 block uppercase tracking-wide">
                Local Paper Texture
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Section A: Top Priority */}
            <div className="space-y-3">
              <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <Eye size={12} className="text-secondary" />
                <span>{isZh ? '今日最重要的事' : 'Most Important Today'}</span>
              </span>
              <input
                type="text"
                value={dailyPlan.topPriority}
                onChange={(e) => handleTopPriorityChange(e.target.value)}
                placeholder={isZh ? '今天最想完成什么？' : 'What do you most want to complete today?'}
                className="paper-input w-full bg-transparent border-none border-b border-dashed border-tertiary-fixed/80 focus:ring-0 focus:border-primary px-0 py-2 font-serif text-lg italic text-on-surface placeholder:opacity-35"
              />
            </div>

            {/* Section B: Daily Schedule timeline */}
            <div className="space-y-4">
              <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <Clock size={12} className="text-secondary" />
                <span>{isZh ? '日程与时间规整 Timetable' : 'Daily Timeline Ledger'}</span>
              </span>

              <div className="space-y-1 divide-y divide-dashed divide-tertiary-fixed/30 bg-surface-container-lowest grid-paper rounded border border-tertiary-fixed/50 overflow-hidden">
                {scheduleHours.map((hour) => {
                  const entry = dailyPlan.schedule.find((item) => item.time === hour)?.text || '';
                  
                  return (
                    <div key={hour} className="flex hover:bg-surface-container-low/20 transition-all items-center py-2 px-3 gap-4">
                      {/* Hour Bullet info */}
                      <div className="w-10 text-right font-mono text-[11px] font-bold text-secondary tracking-tighter shrink-0 select-none">
                        {hour}
                      </div>
                      
                      <div className="h-4 w-[0.5px] bg-tertiary-fixed/60 shrink-0" />
                      
                      {/* Inline Input text */}
                      <input
                        type="text"
                        value={entry}
                        onChange={(e) => handleScheduleChange(hour, e.target.value)}
                        placeholder="--"
                        className="paper-input flex-grow bg-transparent border-none focus:ring-0 p-0 text-xs font-sans text-on-surface placeholder:opacity-10"
                      />
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddScheduleItem} className="flex gap-2">
                <input
                  type="time"
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="paper-input w-24 text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
                />
                <input
                  type="text"
                  value={newScheduleText}
                  onChange={(e) => setNewScheduleText(e.target.value)}
                  placeholder={isZh ? '添加自定义时间安排...' : 'Add custom schedule item...'}
                  className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
                />
                <button
                  type="submit"
                  className="px-3 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary-container transition-colors shrink-0 cursor-pointer"
                >
                  {isZh ? '添加' : 'Add'}
                </button>
              </form>
            </div>

            {/* Section C: Free Notes */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                  <CheckSquare size={12} className="text-secondary" />
                  <span>{isZh ? '自由笔记 Notes' : 'Free Notes'}</span>
                </span>
                <span className="text-[9px] font-mono text-tertiary italic">{isZh ? '自动即时保存' : 'Auto-saves locally'}</span>
              </div>

              <div className="relative w-full rounded border border-tertiary-fixed/60 shadow-[inset_0px_2px_8px_rgba(0,0,0,0.015)] overflow-hidden">
                <textarea
                  value={dailyPlan.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder={isZh ? '今天有什么值得记录？临时想法、会议记录、灵感、碎片任务...' : 'What is worth recording today? Loose notes, ideas, small reminders...'}
                  rows={5}
                  className="paper-input w-full text-xs font-sans leading-6 p-4 bg-transparent border-none focus:ring-0 text-on-surface-variant resize-none outline-none relative z-10 grid-paper select-text placeholder:opacity-30"
                />
              </div>
            </div>

            {/* Section D: Ruled Diary Text Area */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="font-sans text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                  <Heart size={12} className="text-secondary" />
                  <span>{isZh ? '日记总结与内心自留地' : 'Diary Reflection Leaf'}</span>
                </span>
                <span className="text-[9px] font-mono text-tertiary italic">{isZh ? '自动即时保存' : 'Auto-saves locally'}</span>
              </div>

              {/* lined-paper grid- backed handwriting field */}
              <div className="relative w-full rounded border border-tertiary-fixed/60 shadow-[inset_0px_2px_8px_rgba(0,0,0,0.015)] overflow-hidden">
                <textarea
                  value={dailyPlan.diary}
                  onChange={(e) => handleDiaryChange(e.target.value)}
                  placeholder={
                    isZh 
                      ? '今日复盘：完成了什么？遇见了什么？有什么值得感谢或留给明天？' 
                      : 'Today review: What did you finish, notice, appreciate, or leave for tomorrow?'
                  }
                  rows={8}
                  className="paper-input w-full text-xs font-serif leading-8 p-4 bg-transparent border-none focus:ring-0 text-on-surface-variant resize-none outline-none relative z-10 grid-paper select-text placeholder:opacity-30"
                  style={{ lineHeight: '2rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Eisenhower Quadrants & checklists */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section A: Eisenhower Priority Matrix (Decision helper) */}
          <div className="bg-surface-container-lowest rounded-lg border border-tertiary-fixed p-6 shadow-sm space-y-4 paper-panel">
            <header className="flex justify-between items-baseline">
              <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Award size={14} className="text-secondary" />
                <span>{isZh ? '四象限任务优先级' : 'Eisenhower Matrices'}</span>
              </h3>
              <span className="text-[9px] font-mono text-tertiary/75 uppercase select-none">{isZh ? '高效决策' : 'Fast Prioritization'}</span>
            </header>

            {/* Matrix 2X2 grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Box 1: Urgent & Important */}
              <div className="border border-tertiary-fixed/60 rounded p-3 bg-surface-container-low/10 flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-bold text-error uppercase tracking-wider select-none">
                  {isZh ? 'Ⅰ · 紧急重要' : 'I · Urgent & Important'}
                </span>

                {/* Items lists */}
                <div className="space-y-1.5 min-h-[70px] max-h-[140px] overflow-y-auto pr-0.5">
                  {(dailyPlan.eisenhower.urgentImportant || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-on-surface-variant group/item border-b border-dotted border-tertiary-fixed pb-0.5">
                      <span className="leading-snug truncate pr-1">• {item}</span>
                      <button
                        onClick={() => handleDeleteQuadrantItem('urgentImportant', idx)}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adding form row */}
                <div className="flex gap-1.5 mt-2 pt-1 border-t border-dashed border-tertiary-fixed/40">
                  <input
                    type="text"
                    value={quadrantInputs.urgentImportant}
                    onChange={(e) => setQuadrantInputs(prev => ({ ...prev, urgentImportant: e.target.value }))}
                    placeholder={isZh ? '新增...' : 'Add...'}
                    className="paper-input w-full text-[10px] p-1 border border-tertiary-fixed rounded bg-transparent focus:outline-none focus:border-error"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuadrantItem('urgentImportant')}
                  />
                  <button 
                    onClick={() => handleAddQuadrantItem('urgentImportant')}
                    className="p-1 text-error bg-error/10 hover:bg-error hover:text-white transition-all rounded"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Box 2: Important & Not Urgent */}
              <div className="border border-tertiary-fixed/60 rounded p-3 bg-surface-container-low/10 flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider select-none">
                  {isZh ? 'Ⅱ · 重要非紧急' : 'II · Focus & Strategic'}
                </span>

                {/* Items lists */}
                <div className="space-y-1.5 min-h-[70px] max-h-[140px] overflow-y-auto pr-0.5">
                  {(dailyPlan.eisenhower.importantNotUrgent || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-on-surface-variant group/item border-b border-dotted border-tertiary-fixed pb-0.5">
                      <span className="leading-snug truncate pr-1">• {item}</span>
                      <button
                        onClick={() => handleDeleteQuadrantItem('importantNotUrgent', idx)}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adding form row */}
                <div className="flex gap-1.5 mt-2 pt-1 border-t border-dashed border-tertiary-fixed/40">
                  <input
                    type="text"
                    value={quadrantInputs.importantNotUrgent}
                    onChange={(e) => setQuadrantInputs(prev => ({ ...prev, importantNotUrgent: e.target.value }))}
                    placeholder={isZh ? '新增...' : 'Add...'}
                    className="paper-input w-full text-[10px] p-1 border border-tertiary-fixed rounded bg-transparent focus:outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuadrantItem('importantNotUrgent')}
                  />
                  <button 
                    onClick={() => handleAddQuadrantItem('importantNotUrgent')}
                    className="p-1 text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all rounded"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Box 3: Urgent & Not Important */}
              <div className="border border-tertiary-fixed/60 rounded p-3 bg-surface-container-low/10 flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider select-none">
                  {isZh ? 'Ⅲ · 紧急非重要' : 'III · Delegate & Sync'}
                </span>

                {/* Items lists */}
                <div className="space-y-1.5 min-h-[70px] max-h-[140px] overflow-y-auto pr-0.5">
                  {(dailyPlan.eisenhower.urgentNotImportant || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-on-surface-variant group/item border-b border-dotted border-tertiary-fixed pb-0.5">
                      <span className="leading-snug truncate pr-1">• {item}</span>
                      <button
                        onClick={() => handleDeleteQuadrantItem('urgentNotImportant', idx)}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adding form row */}
                <div className="flex gap-1.5 mt-2 pt-1 border-t border-dashed border-tertiary-fixed/40">
                  <input
                    type="text"
                    value={quadrantInputs.urgentNotImportant}
                    onChange={(e) => setQuadrantInputs(prev => ({ ...prev, urgentNotImportant: e.target.value }))}
                    placeholder={isZh ? '新增...' : 'Add...'}
                    className="paper-input w-full text-[10px] p-1 border border-tertiary-fixed rounded bg-transparent focus:outline-none focus:border-secondary"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuadrantItem('urgentNotImportant')}
                  />
                  <button 
                    onClick={() => handleAddQuadrantItem('urgentNotImportant')}
                    className="p-1 text-secondary bg-secondary/10 hover:bg-secondary hover:text-white transition-all rounded"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Box 4: Not Urgent & Not Important */}
              <div className="border border-tertiary-fixed/60 rounded p-3 bg-surface-container-low/10 flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider select-none">
                  {isZh ? 'Ⅳ · 琐碎与删除' : 'IV · Trim & Minimize'}
                </span>

                {/* Items lists */}
                <div className="space-y-1.5 min-h-[70px] max-h-[140px] overflow-y-auto pr-0.5">
                  {(dailyPlan.eisenhower.notUrgentNotImportant || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-on-surface-variant group/item border-b border-dotted border-tertiary-fixed pb-0.5">
                      <span className="leading-snug truncate pr-1">• {item}</span>
                      <button
                        onClick={() => handleDeleteQuadrantItem('notUrgentNotImportant', idx)}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 text-tertiary hover:text-error transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adding form row */}
                <div className="flex gap-1.5 mt-2 pt-1 border-t border-dashed border-tertiary-fixed/40">
                  <input
                    type="text"
                    value={quadrantInputs.notUrgentNotImportant}
                    onChange={(e) => setQuadrantInputs(prev => ({ ...prev, notUrgentNotImportant: e.target.value }))}
                    placeholder={isZh ? '新增...' : 'Add...'}
                    className="paper-input w-full text-[10px] p-1 border border-tertiary-fixed rounded bg-transparent focus:outline-none focus:border-tertiary"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuadrantItem('notUrgentNotImportant')}
                  />
                  <button 
                    onClick={() => handleAddQuadrantItem('notUrgentNotImportant')}
                    className="p-1 text-tertiary bg-tertiary/10 hover:bg-tertiary hover:text-white transition-all rounded"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Section B: Today's Focus Todo Checklist */}
          <div className="bg-surface-container-lowest rounded-lg border border-tertiary-fixed p-6 shadow-sm space-y-4 paper-panel">
            <h3 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <ClipboardList size={14} className="text-secondary" />
              <span>{isZh ? '单独今日待办 Checklist' : "Today's Checklist"}</span>
            </h3>

            {/* Form list adding */}
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                placeholder={isZh ? '添写今日重点关注...' : 'Water terrasse plants...'}
                className="paper-input w-full text-xs p-1.5 border border-tertiary-fixed rounded focus:outline-none focus:border-primary text-on-surface bg-transparent"
              />
              <button
                type="submit"
                className="px-3 bg-primary text-on-primary rounded text-xs font-bold hover:bg-primary-container transition-colors shrink-0 cursor-pointer"
              >
                {isZh ? '新待办' : 'Log'}
              </button>
            </form>

            {/* Log list rows */}
            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {(dailyPlan.todos || []).length === 0 ? (
                <p className="text-xs text-tertiary italic text-center py-4">
                  {isZh ? '今日无额外待办。' : 'Checklist is clear.'}
                </p>
              ) : (
                (dailyPlan.todos || []).map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between group gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                      title={isZh ? '切换完成状态' : 'Toggle complete'}
                    >
                      {/* Checkboxes border */}
                      <div className={`paper-checkbox w-4 h-4 border border-secondary flex items-center justify-center transition-all shrink-0 ${
                        todo.completed ? 'bg-secondary-container/60' : 'bg-transparent'
                      }`}>
                        {todo.completed && (
                          <span className="text-secondary font-mono text-[9px] font-bold select-none leading-none">X</span>
                        )}
                      </div>
                    </button>

                    <input
                      type="text"
                      value={todo.text}
                      onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                      className={`paper-input flex-grow bg-transparent border-none border-b border-transparent hover:border-tertiary-fixed/40 focus:border-primary focus:ring-0 p-0.5 text-xs ${
                        todo.completed 
                          ? 'line-through text-on-surface-variant/40 italic' 
                          : 'text-on-surface'
                      }`}
                    />
                    
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

          {/* Section C: Meditative Zen Quote leaf card */}
          <div className="bg-surface-container-low/40 rounded p-5 border border-dashed border-tertiary-fixed/80">
            <p className="text-[10px] font-sans text-secondary font-semibold uppercase tracking-widest pl-1 mb-2">
              {isZh ? '◇ 静心语录' : '◇ MENTAL MINDFULNESS'}
            </p>
            <p className="font-serif text-xs italic text-on-surface-variant leading-relaxed pl-1">
              " {isZh ? activeQuote.zh : activeQuote.en} "
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
