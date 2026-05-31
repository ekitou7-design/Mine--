import React, { useRef, useState } from 'react';
import { PlannerState } from '../types';
import { CalendarDays, CalendarRange, CheckSquare, Layers, Sparkles, SunMedium } from 'lucide-react';
import { formatFullEnglishDate, formatFullChineseDate, getWeekKey } from '../utils/calendar';
import { ensureDailyPlan, ensureWeekPlan } from '../utils/storage';

interface PlannerCoverProps {
  state: PlannerState;
  todayDateStr: string;
  onOpenDaily: () => void;
  onOpenWeek: () => void;
  onOpenMonth: () => void;
  onOpenYear: () => void;
}

export const PlannerCover: React.FC<PlannerCoverProps> = ({
  state,
  todayDateStr,
  onOpenDaily,
  onOpenWeek,
  onOpenMonth,
  onOpenYear,
}) => {
  const isZh = state.settings.language === 'zh';
  const plannerRef = useRef<HTMLDivElement>(null);
  const todayPlan = ensureDailyPlan(state, todayDateStr);
  const weekPlan = ensureWeekPlan(state, getWeekKey(todayDateStr));
  const visibleTodos = todayPlan.todos.slice(0, 3);

  const [transformStyle, setTransformStyle] = useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [transitionStyle, setTransitionStyle] = useState<string>('transform 0.5s ease-out');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!plannerRef.current) return;
    const { left, top, width, height } = plannerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setTransitionStyle('transform 0.1s ease-out');
    setTransformStyle(`perspective(1000px) rotateX(${(y - 0.5) * 4}deg) rotateY(${(x - 0.5) * -4}deg)`);
  };

  const handleMouseLeave = () => {
    setTransitionStyle('transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)');
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };

  const shortcuts = [
    { label: isZh ? '今日计划' : 'Today', icon: SunMedium, onClick: onOpenDaily },
    { label: isZh ? '本周计划' : 'Week', icon: Layers, onClick: onOpenWeek },
    { label: isZh ? '本月计划' : 'Month', icon: CalendarDays, onClick: onOpenMonth },
    { label: isZh ? '年度计划' : 'Year', icon: CalendarRange, onClick: onOpenYear },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-2 min-h-[calc(100vh-140px)] w-full overflow-hidden select-none">
      <div
        ref={plannerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: transformStyle, transition: transitionStyle }}
        className="relative w-full max-w-5xl min-h-[720px] md:min-h-[640px] bg-surface-bright rounded-lg shadow-2xl flex overflow-hidden ring-1 ring-tertiary-fixed/60 transform-gpu"
      >
        <div className="w-8 md:w-12 h-full bg-surface-container-high spine-effect border-r border-tertiary-fixed hidden md:block" />

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 py-8 px-6 md:py-12 md:px-10 relative notebook-edge bg-[#fcf9f4] linen-texture">
          <section className="flex flex-col justify-between gap-8 text-center lg:text-left">
            <div className="space-y-4">
              <span className="font-sans text-[11px] font-bold text-secondary tracking-[0.25em] uppercase opacity-75">
                {isZh ? '手账系列' : 'The Techo Collection'}
              </span>
              <h2 className="font-serif text-5xl md:text-6xl text-primary font-bold leading-none tracking-tight">
                Mine
              </h2>
              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <div className="h-[0.5px] w-8 bg-tertiary-fixed" />
                <span className="font-serif text-lg md:text-xl italic text-secondary">
                  {todayDateStr.slice(0, 4)}
                </span>
                <div className="h-[0.5px] w-8 bg-tertiary-fixed" />
              </div>
              <p className="font-serif text-lg text-on-surface-variant leading-relaxed">
                {isZh ? formatFullChineseDate(todayDateStr) : formatFullEnglishDate(todayDateStr)}
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-primary/40 flex items-center justify-center bg-surface-container-low/40">
                <Sparkles size={24} className="text-primary/70" />
              </div>
            </div>

            <div className="opacity-60">
              <span className="font-serif text-[10px] text-secondary italic tracking-widest uppercase block">
                {isZh ? '极简数字伴侣 • 为专注而生' : 'Minimalist Digital Companion • Designed for Focus'}
              </span>
            </div>
          </section>

          <section className="paper-sheet rounded-lg border border-tertiary-fixed/80 p-5 md:p-6 bg-surface-container-lowest/80 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="paper-panel rounded border border-tertiary-fixed/60 p-4 space-y-2 bg-surface-bright/70">
                <h3 className="font-sans text-[10px] font-bold text-primary uppercase tracking-widest">
                  {isZh ? '今日最重要的事' : 'Most Important Today'}
                </h3>
                <p className={`font-serif text-base italic leading-relaxed ${todayPlan.topPriority ? 'text-on-surface' : 'text-tertiary/70'}`}>
                  {todayPlan.topPriority || (isZh ? '今天最重要的一件事还没有写' : 'The most important thing is not written yet.')}
                </p>
              </div>

              <div className="paper-panel rounded border border-tertiary-fixed/60 p-4 space-y-2 bg-surface-bright/70">
                <h3 className="font-sans text-[10px] font-bold text-primary uppercase tracking-widest">
                  {isZh ? '本周重点' : 'Weekly Focus'}
                </h3>
                <p className={`font-serif text-base italic leading-relaxed ${weekPlan.focus ? 'text-on-surface' : 'text-tertiary/70'}`}>
                  {weekPlan.focus || (isZh ? '本周重点还没有写' : 'Weekly focus is not written yet.')}
                </p>
              </div>
            </div>

            <div className="paper-panel rounded border border-tertiary-fixed/60 p-4 bg-surface-bright/70 space-y-3">
              <h3 className="font-sans text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <CheckSquare size={13} className="text-secondary" />
                <span>{isZh ? '今日待办' : "Today's Todos"}</span>
              </h3>
              {visibleTodos.length === 0 ? (
                <p className="text-xs text-tertiary/75 italic py-2">
                  {isZh ? '今天还没有待办' : 'No todos for today yet.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {visibleTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2">
                      <span className={`paper-checkbox w-4 h-4 border border-secondary flex items-center justify-center shrink-0 ${
                        todo.completed ? 'bg-secondary-container/60' : 'bg-transparent'
                      }`}>
                        {todo.completed && <span className="text-secondary font-mono text-[9px] font-bold leading-none">X</span>}
                      </span>
                      <span className={`text-xs ${todo.completed ? 'line-through text-on-surface-variant/45 italic' : 'text-on-surface'}`}>
                        {todo.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-dashed border-tertiary-fixed/70">
              {shortcuts.map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="paper-panel rounded border border-tertiary-fixed/70 bg-surface-container-low/40 hover:bg-surface-container px-3 py-4 transition-all cursor-pointer flex flex-col items-center gap-2 text-on-surface-variant hover:text-primary"
                >
                  <Icon size={17} className="text-secondary" />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
