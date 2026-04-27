import { Settings, UserStats } from '../types';
import { Monitor, Moon, Sun, Type, Code2, Save, Trash2, RefreshCcw, User, LogOut } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  userStats: UserStats;
  onSettingsChange: (newSettings: Settings) => void;
  onUserStatsChange: (newStats: UserStats) => void;
  onClearHistory: () => void;
  onResetStats: () => void;
  onResetAll: () => void;
  onLogout: () => void;
}

export default function SettingsView({
  settings,
  userStats,
  onSettingsChange,
  onUserStatsChange,
  onClearHistory,
  onResetStats,
  onResetAll,
  onLogout,
}: SettingsViewProps) {
  
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateUserName = (name: string) => {
    onUserStatsChange({ ...userStats, name });
  };

  return (
    <div className="max-w-[900px] mx-auto p-6 md:p-8 h-full overflow-y-auto scrollbar-hide pb-20">
      <h1 className="text-3xl font-headline font-bold text-on-surface mb-8">Settings</h1>
      
      <div className="space-y-8">
        
        {/* Profile Section */}
        <section>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
            <User size={20} className="text-secondary" /> Profile
          </h2>
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-medium text-on-surface">User Name</h3>
                <p className="font-body text-sm text-on-surface-variant">This name will be displayed across the application.</p>
              </div>
              <input
                type="text"
                placeholder="Scholar"
                maxLength={20}
                value={userStats.name}
                onChange={(e) => updateUserName(e.target.value)}
                className="bg-surface-container border border-outline-variant/20 text-on-surface font-label text-sm rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors min-w-[200px]"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div>
                <h3 className="font-headline font-medium text-on-surface">Date of Birth</h3>
                <p className="font-body text-sm text-on-surface-variant">Update your date of birth.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 min-w-[240px]">
                <select
                  value={userStats.dateOfBirth?.split('-')[1] || ''}
                  onChange={(e) => {
                    const parts = (userStats.dateOfBirth || '2000-01-01').split('-');
                    const y = parts[0];
                    const d = parts[2];
                    onUserStatsChange({ ...userStats, dateOfBirth: `${y}-${e.target.value}-${d}` });
                  }}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface font-label text-xs rounded-lg px-2 py-2 outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Month</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                    <option key={m} value={m}>{new Date(2000, parseInt(m)-1).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>

                <select
                  value={userStats.dateOfBirth?.split('-')[2] || ''}
                  onChange={(e) => {
                    const parts = (userStats.dateOfBirth || '2000-01-01').split('-');
                    const y = parts[0];
                    const m = parts[1];
                    onUserStatsChange({ ...userStats, dateOfBirth: `${y}-${m}-${e.target.value}` });
                  }}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface font-label text-xs rounded-lg px-2 py-2 outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Day</option>
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={userStats.dateOfBirth?.split('-')[0] || ''}
                  onChange={(e) => {
                    const parts = (userStats.dateOfBirth || '2000-01-01').split('-');
                    const m = parts[1];
                    const d = parts[2];
                    onUserStatsChange({ ...userStats, dateOfBirth: `${e.target.value}-${m}-${d}` });
                  }}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface font-label text-xs rounded-lg px-2 py-2 outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Year</option>
                  {Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Monitor size={20} className="text-secondary" /> Appearance
          </h2>
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 shadow-sm space-y-6">
            
            {/* Theme Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-medium text-on-surface">Theme</h3>
                <p className="font-body text-sm text-on-surface-variant">Select the application theme color.</p>
              </div>
              <div className="flex items-center bg-surface-container rounded-lg p-1 border border-outline-variant/20">
                <button
                  onClick={() => updateSetting('theme', 'light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-label text-sm transition-all ${
                    settings.theme === 'light' 
                    ? 'bg-secondary-container text-secondary-container shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => updateSetting('theme', 'dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-label text-sm transition-all ${
                    settings.theme === 'dark' 
                    ? 'bg-primary-container text-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            </div>

            <div className="h-px bg-outline-variant/10" />

            {/* Font Size Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-medium text-on-surface flex items-center gap-2">
                   Font Size
                </h3>
                <p className="font-body text-sm text-on-surface-variant">Adjust the code editor font size (px).</p>
              </div>
              <div className="flex items-center gap-4 min-w-[200px]">
                <Type size={14} className="text-on-surface-variant" />
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="font-mono text-sm w-6 text-right text-on-surface">{settings.fontSize}</span>
              </div>
            </div>

          </div>
        </section>

        {/* Editor Preferences */}
        <section>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Code2 size={20} className="text-secondary" /> Editor Preferences
          </h2>
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 shadow-sm space-y-6">
            
            {/* Language */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-medium text-on-surface">Default Language</h3>
                <p className="font-body text-sm text-on-surface-variant">The programming language selected by default.</p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value as any)}
                className="bg-surface-container border border-outline-variant/20 text-on-surface font-label text-sm rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors min-w-[150px]"
              >
                <option value="python">Python 3</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div className="h-px bg-outline-variant/10" />

            {/* Autosave */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-medium text-on-surface">Autosave</h3>
                <p className="font-body text-sm text-on-surface-variant">Automatically save workspace progress.</p>
              </div>
              <button
                onClick={() => updateSetting('autosave', !settings.autosave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                   settings.autosave ? 'bg-primary' : 'bg-surface-container-high border border-outline-variant/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autosave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Save size={20} className="text-secondary" /> Data Management
          </h2>
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 shadow-sm space-y-4">
            
            <button
              onClick={onClearHistory}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/20 transition-all text-left group"
            >
              <div>
                <h3 className="font-headline font-medium text-on-surface group-hover:text-error transition-colors">Clear History</h3>
                <p className="font-body text-xs text-on-surface-variant">Remove all completed challenges from device.</p>
              </div>
              <Trash2 size={18} className="text-on-surface-variant group-hover:text-error transition-colors" />
            </button>

            <button
              onClick={onResetStats}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/20 transition-all text-left group"
            >
              <div>
                <h3 className="font-headline font-medium text-on-surface group-hover:text-error transition-colors">Reset Stats</h3>
                <p className="font-body text-xs text-on-surface-variant">Reset completion count and current streak to zero.</p>
              </div>
              <Trash2 size={18} className="text-on-surface-variant group-hover:text-error transition-colors" />
            </button>
            
            <div className="h-px bg-outline-variant/10 my-2" />

            <button
              onClick={onResetAll}
              className="w-full flex items-center justify-center gap-2 p-3 mt-4 rounded-lg bg-error-container/10 border border-error/20 text-error hover:bg-error-container/20 transition-all font-label font-medium"
            >
              <RefreshCcw size={16} /> Reset All Data to Default
            </button>

          </div>
        </section>

        {/* Account Section */}
        <section>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 border-b border-outline-variant/20 pb-4">
            Account
          </h2>
          <div className="flex justify-center pt-2">
            <button
              onClick={onLogout}
              className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 py-3 px-6 bg-error/10 text-error border border-error/20 rounded-xl font-label font-bold hover:bg-error hover:text-on-error hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
