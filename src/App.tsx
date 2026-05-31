import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { PlannerState, ViewType } from './types';
import { getInitialState } from './initialData';
import { getTodayDateKey, createDateKey } from './utils/calendar';
import { loadPlannerData, savePlannerData } from './utils/storage';
import { Navbar } from './Navbar';
import { PlannerCover } from './components/PlannerCover';
import { YearPlanView } from './components/YearPlanView';
import { MonthPlanView } from './components/MonthPlanView';
import { WeekPlanView } from './components/WeekPlanView';
import { DailyPlanView } from './components/DailyPlanView';
import { SettingsModal } from './components/SettingsModal';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const todayDateKey = getTodayDateKey();

  // 1. Initialise core planner state from localStorage or load presets
  const [state, setState] = useState<PlannerState>(() => loadPlannerData());

  // 2. Navigation Active View state
  const [currentView, setCurrentView] = useState<ViewType>('cover');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateKey);
  const [selectedYear, setSelectedYear] = useState<string>(todayDateKey.slice(0, 4));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 3. Save state to Local Storage upon modifications
  useEffect(() => {
    savePlannerData(state);
  }, [state]);

  // 4. Global Action Handlers
  const handleUpdateState = (newState: PlannerState) => {
    setState(newState);
  };

  const handleToggleLanguage = () => {
    const nextLang = state.settings.language === 'zh' ? 'en' : 'zh';
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        language: nextLang
      }
    }));
  };

  const handleResetState = () => {
    const fresh = getInitialState();
    setState(fresh);
    setSelectedDateStr(todayDateKey);
    setSelectedYear(todayDateKey.slice(0, 4));
    setCurrentView('cover');
  };

  // 5. Section jumping converters
  const handleNavigateToMonth = (monthIndex: number) => {
    setSelectedDateStr(createDateKey(selectedYear, monthIndex));
    setCurrentView('month');
  };

  const handleNavigateToDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedYear(dateStr.slice(0, 4));
    setCurrentView('daily');
  };

  const handleNavigateToWeek = (dateStr = selectedDateStr) => {
    setSelectedDateStr(dateStr);
    setSelectedYear(dateStr.slice(0, 4));
    setCurrentView('week');
  };

  const handleNavigateToCurrentMonth = () => {
    setSelectedDateStr(createDateKey(todayDateKey.slice(0, 4), Number(todayDateKey.slice(5, 7)) - 1));
    setSelectedYear(todayDateKey.slice(0, 4));
    setCurrentView('month');
  };

  const handleNavigateToCurrentYear = () => {
    setSelectedDateStr(todayDateKey);
    setSelectedYear(todayDateKey.slice(0, 4));
    setCurrentView('year');
  };

  const isZh = state.settings.language === 'zh';
  const appStyle = {
    '--color-primary': state.settings.themeColor,
    '--color-primary-container': state.settings.themeColor,
  } as CSSProperties;

  return (
    <div
      className="paper-app min-h-screen bg-surface-bright flex flex-col relative selection:bg-secondary-container selection:text-on-secondary-container"
      data-paper-style={state.settings.paperStyle}
      style={appStyle}
    >
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.28] mix-blend-multiply z-[110] paper-fiber-overlay" />

      {/* Navigation Header */}
      <Navbar 
        currentView={currentView}
        onSetView={setCurrentView}
        state={state}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main active layout with Framer Motion page transitions */}
      <main className="flex-grow py-6 px-4 md:py-10 md:px-8 max-w-7xl w-full mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + '-' + selectedYear + '-' + selectedDateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            {currentView === 'cover' && (
              <PlannerCover 
                state={state}
                todayDateStr={todayDateKey}
                onOpenDaily={() => handleNavigateToDay(todayDateKey)}
                onOpenWeek={() => handleNavigateToWeek(todayDateKey)}
                onOpenMonth={handleNavigateToCurrentMonth}
                onOpenYear={handleNavigateToCurrentYear}
              />
            )}

            {currentView === 'year' && (
              <YearPlanView 
                state={state}
                selectedYear={selectedYear}
                onSetYear={setSelectedYear}
                onUpdateState={handleUpdateState}
                onNavigateToMonth={handleNavigateToMonth}
                onNavigateToDay={handleNavigateToDay}
              />
            )}

            {currentView === 'month' && (
              <MonthPlanView 
                state={state}
                selectedDateStr={selectedDateStr}
                onSetSelectedDateStr={setSelectedDateStr}
                onUpdateState={handleUpdateState}
                onNavigateToDay={handleNavigateToDay}
                onNavigateToWeek={handleNavigateToWeek}
                selectedYear={selectedYear}
                onSetYear={setSelectedYear}
              />
            )}

            {currentView === 'week' && (
              <WeekPlanView
                state={state}
                selectedDateStr={selectedDateStr}
                onSetSelectedDateStr={setSelectedDateStr}
                onUpdateState={handleUpdateState}
                onNavigateToDay={handleNavigateToDay}
                onSetYear={setSelectedYear}
              />
            )}

            {currentView === 'daily' && (
              <DailyPlanView 
                state={state}
                selectedDateStr={selectedDateStr}
                onSetSelectedDateStr={setSelectedDateStr}
                onUpdateState={handleUpdateState}
                onNavigateToWeek={handleNavigateToWeek}
                onSetYear={setSelectedYear}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Settings management overlay panels modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        selectedDateStr={selectedDateStr}
        selectedYear={selectedYear}
        onUpdateState={handleUpdateState}
        onReset={handleResetState}
      />

      {/* Subtle desk bottom footer note */}
      <footer className="py-6 border-t border-tertiary-fixed/40 text-center opacity-65 text-[10px] text-tertiary selection:bg-transparent">
        <div>
          {isZh 
            ? '© 2026 Mine. 慢生活实践手册 • 本地加密存储已就绪' 
            : '© 2026 Mine. Slow Life Companion • Local Storage encrypted secure state active.'}
        </div>
      </footer>

    </div>
  );
}
