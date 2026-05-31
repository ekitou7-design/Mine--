import React from 'react';
import { ViewType, PlannerState } from './types';
import { BookOpen, Calendar, Compass, Layers, Globe, Settings } from 'lucide-react';

interface NavbarProps {
  currentView: ViewType;
  onSetView: (view: ViewType) => void;
  state: PlannerState;
  onToggleLanguage: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSetView,
  state,
  onToggleLanguage,
  onOpenSettings
}) => {
  const isZh = state.settings.language === 'zh';

  const menuItems = [
    { view: 'cover' as ViewType, labelZh: '封皮', labelEn: 'Cover', icon: BookOpen },
    { view: 'year' as ViewType, labelZh: '年度', labelEn: 'Year', icon: Compass },
    { view: 'month' as ViewType, labelZh: '月度', labelEn: 'Month', icon: Calendar },
    { view: 'daily' as ViewType, labelZh: '每日', labelEn: 'Daily', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-tertiary-fixed/60 py-3.5 px-4 md:px-8 text-on-surface">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left side: branding logos */}
        <div 
          onClick={() => onSetView('cover')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center bg-surface-container group-hover:border-primary transition-all">
            <span className="font-serif italic font-bold text-sm text-primary">M</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-serif text-sm font-bold tracking-tight text-primary leading-none">Mine</h1>
            <span className="text-[9px] font-sans text-secondary tracking-widest uppercase block mt-0.5">
              {isZh ? '数码手账本' : 'Digital Techo'}
            </span>
          </div>
        </div>

        {/* Middle tabs navigation */}
        <nav className="flex items-center border border-tertiary-fixed rounded p-0.5 bg-surface-container-low select-none">
          {menuItems.map(({ view, labelZh, labelEn, icon: Icon }) => {
            const isActive = currentView === view;
            return (
              <button
                key={view}
                onClick={() => onSetView(view)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-sm cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Icon size={13} />
                <span className="hidden md:inline">{isZh ? labelZh : labelEn}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side toolbar control buttons */}
        <div className="flex items-center gap-3">
          
          {/* Language trigger switch */}
          <button
            onClick={onToggleLanguage}
            title={isZh ? '切换语言 / Toggle Language' : 'Toggle Language'}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-tertiary-fixed hover:border-primary bg-surface-container-lowest rounded text-xs text-on-surface-variant font-bold transition-all cursor-pointer"
          >
            <Globe size={13} className="text-secondary" />
            <span className="font-mono text-[10px] uppercase">{isZh ? 'EN' : '中文'}</span>
          </button>

          {/* Backup & reset setup button */}
          <button
            onClick={onOpenSettings}
            title={isZh ? '笔记本管理与备份' : 'Backups & Settings'}
            className="p-1.5 border border-tertiary-fixed hover:border-primary bg-surface-container-lowest rounded text-on-surface-variant hover:text-primary transition-all cursor-pointer"
          >
            <Settings size={14} />
          </button>

        </div>

      </div>
    </header>
  );
};
