import React, { useState } from 'react';
import { PlannerSettings, PlannerState } from '../types';
import { isPlannerDataLike, normalizePlannerData } from '../utils/storage';
import { formatMonthKey, getWeekKey } from '../utils/calendar';
import { exportDailyMarkdown, exportMonthMarkdown, exportWeekMarkdown, exportYearMarkdown } from '../utils/markdownExport';
import { mergeCalendarEvents, parseIcsCalendarEvents } from '../utils/icsImport';
import { X, Copy, Check, RotateCcw, Upload, FileText, Globe, Download } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: PlannerState;
  selectedDateStr: string;
  selectedYear: string;
  onUpdateState: (newState: PlannerState) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  selectedDateStr,
  selectedYear,
  onUpdateState,
  onReset
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [calendarImportMessage, setCalendarImportMessage] = useState('');

  if (!isOpen) return null;

  const handleCopyJSON = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      navigator.clipboard.writeText(dataStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportJSON = () => {
    try {
      setImportError('');
      setImportSuccess(false);
      const parsed = JSON.parse(importText);
      
      if (isPlannerDataLike(parsed)) {
        onUpdateState(normalizePlannerData(parsed));
        setImportSuccess(true);
        setImportText('');
        setTimeout(() => {
          setImportSuccess(false);
          onClose();
        }, 1500);
      } else {
        setImportError(
          state.settings.language === 'zh'
            ? '无效的文件结构。请导入包含 yearPlans, monthPlans 或 dailyPlans 的 JSON。'
            : 'Invalid structure. Import JSON that contains yearPlans, monthPlans, or dailyPlans.'
        );
      }
    } catch (e) {
      setImportError(
        state.settings.language === 'zh'
          ? 'JSON 解析失败，请检查格式是否正确。'
          : 'JSON parsing failed. Please check the text format.'
      );
    }
  };

  const handleSettingsChange = <K extends keyof PlannerSettings>(key: K, value: PlannerSettings[K]) => {
    onUpdateState({
      ...state,
      settings: {
        ...state.settings,
        [key]: value,
      },
    });
  };

  const handleImportIcs = async (file: File | null) => {
    if (!file) return;
    try {
      setCalendarImportMessage('');
      const text = await file.text();
      const parsedEvents = parseIcsCalendarEvents(text, file.name);
      const eventCount = Object.values(parsedEvents).reduce((sum, events) => sum + events.length, 0);

      if (eventCount === 0) {
        setCalendarImportMessage(isZh ? '没有在文件中找到可导入的事件。' : 'No importable events found in this file.');
        return;
      }

      onUpdateState({
        ...state,
        calendarEvents: mergeCalendarEvents(state.calendarEvents, parsedEvents),
      });
      setCalendarImportMessage(isZh ? `已导入 ${eventCount} 个日历事件。` : `Imported ${eventCount} calendar events.`);
    } catch (error) {
      console.error(error);
      setCalendarImportMessage(isZh ? 'ICS 导入失败，请检查文件格式。' : 'ICS import failed. Please check the file format.');
    }
  };

  const handleClearCalendarEvents = () => {
    if (!window.confirm(isZh ? '确定要清空所有外部日历事件吗？日计划待办不会受影响。' : 'Clear all external calendar events? Daily todos will not be affected.')) {
      return;
    }
    onUpdateState({ ...state, calendarEvents: {} });
    setCalendarImportMessage(isZh ? '已清空外部日历事件。' : 'External calendar events cleared.');
  };

  const isZh = state.settings.language === 'zh';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#31302d]/40 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative z-10 w-full max-w-xl bg-surface border border-tertiary-fixed rounded-lg shadow-xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 text-on-surface"
      >
        <div className="flex justify-between items-center border-b border-tertiary-fixed pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold italic text-primary">Mine Tools & Backups</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 0: Appearance */}
          <div className="space-y-3">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <FileText size={13} />
              <span>{isZh ? '外观与纸张设置' : 'Appearance & Paper'}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest block">
                  {isZh ? '主题色' : 'Theme Color'}
                </span>
                <input
                  type="color"
                  value={state.settings.themeColor}
                  onChange={(e) => handleSettingsChange('themeColor', e.target.value)}
                  className="h-9 w-full rounded border border-tertiary-fixed bg-surface-container-low p-1"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest block">
                  {isZh ? '纸张样式' : 'Paper Style'}
                </span>
                <select
                  value={state.settings.paperStyle}
                  onChange={(e) => handleSettingsChange('paperStyle', e.target.value as PlannerSettings['paperStyle'])}
                  className="h-9 w-full rounded border border-tertiary-fixed bg-surface-container-low px-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="grid">{isZh ? '网格纸' : 'Grid'}</option>
                  <option value="lined">{isZh ? '横线纸' : 'Lined'}</option>
                  <option value="blank">{isZh ? '空白纸' : 'Blank'}</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest flex items-center gap-1">
                  <Globe size={11} />
                  <span>{isZh ? '语言' : 'Language'}</span>
                </span>
                <select
                  value={state.settings.language}
                  onChange={(e) => handleSettingsChange('language', e.target.value as PlannerSettings['language'])}
                  className="h-9 w-full rounded border border-tertiary-fixed bg-surface-container-low px-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
            <p className="text-[10px] text-tertiary">
              {isZh ? '这些设置会自动保存，刷新页面后仍会保留。' : 'These settings auto-save and remain after refresh.'}
            </p>
          </div>

          <hr className="border-tertiary-fixed" />

          {/* Section 1: Data Backup Export */}
          <div className="space-y-2">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
              {isZh ? '导出本地状态备份' : 'Export Daily Techo Backup'}
            </h4>
            <p className="text-xs text-on-surface-variant/80">
              {isZh 
                ? 'Mine 采用本地离线存储技术，您可以将所有笔记结构复制并保存，以免清除浏览器缓存时数据丢失。' 
                : 'All logs persist in local offline storage. Copy this structured content to back up your planner.'}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCopyJSON}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-tertiary-fixed hover:border-primary bg-surface-container-low hover:bg-surface-container text-xs rounded transition-all w-full md:w-auto font-medium"
              >
                {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                <span>{copied ? (isZh ? '复制成功！' : 'Copied!') : (isZh ? '复制数据 JSON' : 'Copy State JSON')}</span>
              </button>
            </div>
          </div>

          <hr className="border-tertiary-fixed" />

          {/* Section 1.5: Calendar Events */}
          <div className="space-y-3">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
              {isZh ? '导入日历事件 / 节假日' : 'Import Calendar Events / Holidays'}
            </h4>
            <p className="text-xs text-on-surface-variant/80 leading-relaxed">
              {isZh
                ? '你可以从 Apple Calendar、Google Calendar 或其他日历导出 .ics 文件后导入。当前版本只保存在本地浏览器，不保存 Apple ID 或密码，不接 iCloud 登录，也不接 CalDAV。'
                : 'Export an .ics file from Apple Calendar, Google Calendar, or another calendar and import it here. This version only stores events locally in your browser. No Apple ID, password, iCloud login, or CalDAV connection is used.'}
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2 border border-tertiary-fixed hover:border-primary bg-surface-container-low hover:bg-surface-container text-xs rounded transition-all font-medium cursor-pointer">
                <Upload size={14} />
                <span>{isZh ? '选择 .ics 文件导入' : 'Choose .ics file'}</span>
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  className="hidden"
                  onChange={(e) => {
                    handleImportIcs(e.target.files?.[0] || null);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <button
                onClick={handleClearCalendarEvents}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-error/40 hover:bg-error hover:text-white text-xs rounded transition-all font-medium text-error"
              >
                <RotateCcw size={14} />
                <span>{isZh ? '清空外部日历事件' : 'Clear calendar events'}</span>
              </button>
            </div>
            {calendarImportMessage && (
              <p className="text-xs text-tertiary font-medium">{calendarImportMessage}</p>
            )}
          </div>

          <hr className="border-tertiary-fixed" />

          {/* Section 2: Markdown Export */}
          <div className="space-y-2">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Download size={13} />
              <span>{isZh ? '导出 Markdown' : 'Export Markdown'}</span>
            </h4>
            <p className="text-xs text-on-surface-variant/80">
              {isZh
                ? '下载当前日、周、月、年的 Markdown 文件，可直接放进 Obsidian。'
                : 'Download Markdown files for the current day, week, month, or year. Obsidian-friendly.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <button
                onClick={() => exportDailyMarkdown(state, selectedDateStr)}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-tertiary-fixed hover:border-primary bg-surface-container-low hover:bg-surface-container text-xs rounded transition-all font-medium"
              >
                <Download size={13} />
                <span>{isZh ? '当前日计划' : 'Current Day'}</span>
              </button>
              <button
                onClick={() => exportWeekMarkdown(state, getWeekKey(selectedDateStr))}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-tertiary-fixed hover:border-primary bg-surface-container-low hover:bg-surface-container text-xs rounded transition-all font-medium"
              >
                <Download size={13} />
                <span>{isZh ? '当前周计划' : 'Current Week'}</span>
              </button>
              <button
                onClick={() => exportMonthMarkdown(state, formatMonthKey(selectedDateStr))}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-tertiary-fixed hover:border-primary bg-surface-container-low hover:bg-surface-container text-xs rounded transition-all font-medium"
              >
                <Download size={13} />
                <span>{isZh ? '当前月计划' : 'Current Month'}</span>
              </button>
              <button
                onClick={() => exportYearMarkdown(state, selectedYear)}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-tertiary-fixed hover:border-primary bg-surface-container-low hover:bg-surface-container text-xs rounded transition-all font-medium"
              >
                <Download size={13} />
                <span>{isZh ? '当前年计划' : 'Current Year'}</span>
              </button>
            </div>
          </div>

          <hr className="border-tertiary-fixed" />

          {/* Section 2: Data Import */}
          <div className="space-y-2">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
              {isZh ? '导入状态备份' : 'Import Saved Planner Data'}
            </h4>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={
                isZh 
                  ? '在此处粘贴之前导出的 JSON 数据结构...' 
                  : 'Paste your previously exported planner state JSON here...'
              }
              rows={4}
              className="w-full text-xs font-mono p-3 bg-surface-container-low border border-tertiary-fixed rounded focus:outline-none focus:border-primary transition-all text-on-surface-variant resize-none"
            />
            {importError && (
              <p className="text-xs text-error font-medium">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-xs text-primary font-bold">
                {isZh ? '✓ 备份数据导入成功！页面即将重载' : '✓ Data imported successfully! Reloading...'}
              </p>
            )}
            <button
              onClick={handleImportJSON}
              disabled={!importText.trim()}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-xs rounded transition-all font-semibold ${
                importText.trim()
                  ? 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer'
                  : 'bg-surface-variant text-on-surface-variant opacity-40 cursor-not-allowed'
              }`}
            >
              <Upload size={14} />
              <span>{isZh ? '导入并加载' : 'Import & Restore'}</span>
            </button>
          </div>

          <hr className="border-tertiary-fixed" />

          {/* Section 3: Reset App */}
          <div className="space-y-2 bg-error-container/10 border border-error/20 p-4 rounded-sm">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-error">
              {isZh ? '重置规划簿数据' : 'Factory Reset'}
            </h4>
            <p className="text-xs text-on-surface-variant">
              {isZh 
                ? '清除所有的本地修改，将其还原至最初精美的多视图演示初始状态。此操作不可逆。' 
                : 'Clear all custom text modifications and revert to standard beautifully loaded mock-ups.'}
            </p>
            <button
              onClick={() => {
                if (window.confirm(isZh ? '确定要重置所有记录吗？此操作无法撤销。' : 'Are you sure you want to revert all records? This cannot be undone.')) {
                  onReset();
                  onClose();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-error hover:bg-error hover:text-white transition-all text-xs font-medium text-error rounded"
            >
              <RotateCcw size={14} />
              <span>{isZh ? '彻底清除并恢复初始演示数据' : 'Restore Demo Presets'}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-tertiary/80 text-center mt-6">
          Mine Plan Digital Companion • {isZh ? '温润纸感设计' : 'Washi Paper Tone Design'} • May 2026
        </div>
      </div>
    </div>
  );
};
