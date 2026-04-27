import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: (name: string, dob: string) => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && dob) {
      setStep(2);
    }
  };

  const handleStartChallenge = () => {
    onComplete(name.trim(), dob);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface-container-high/60 via-surface to-surface p-6">
      {step === 1 ? (
        <div className="max-w-md w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl p-8 shadow-2xl animate-[fade-in-up_0.4s_ease-out_forwards]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="text-3xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container font-label mb-2">
              ScholarIDE
            </div>
            <h1 className="text-2xl font-headline font-bold text-on-surface">
              Authentication
            </h1>
            <p className="text-on-surface-variant font-body mt-2">
              Let's personalize your learning experience.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block font-headline font-medium text-on-surface mb-2">
                User Name
              </label>
              <input
                id="name"
                type="text"
                required
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Scholar"
                className="w-full bg-surface-container border border-outline-variant/20 text-on-surface font-label rounded-lg px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block font-headline font-medium text-on-surface mb-2">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  required
                  value={dob.split('-')[1] || ''}
                  onChange={(e) => {
                    const parts = dob.split('-');
                    const y = parts[0] || '2000';
                    const d = parts[2] || '01';
                    setDob(`${y}-${e.target.value}-${d}`);
                  }}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface font-label rounded-lg px-3 py-3 outline-none focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Month</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                    <option key={m} value={m}>{new Date(2000, parseInt(m)-1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>

                <select
                  required
                  value={dob.split('-')[2] || ''}
                  onChange={(e) => {
                    const parts = dob.split('-');
                    const y = parts[0] || '2000';
                    const m = parts[1] || '01';
                    setDob(`${y}-${m}-${e.target.value}`);
                  }}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface font-label rounded-lg px-3 py-3 outline-none focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Day</option>
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  required
                  value={dob.split('-')[0] || ''}
                  onChange={(e) => {
                    const parts = dob.split('-');
                    const m = parts[1] || '01';
                    const d = parts[2] || '01';
                    setDob(`${e.target.value}-${m}-${d}`);
                  }}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface font-label rounded-lg px-3 py-3 outline-none focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Year</option>
                  {Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !dob}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-lg font-label font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-md"
            >
              Continue <ArrowRight size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-xl w-full text-center space-y-6 animate-[fade-in-up_0.4s_ease-out_forwards]">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface">
            Welcome to ScholarIDE
          </h1>

          <h2 className="text-xl md:text-2xl tracking-tight font-semibold text-transparent bg-clip-text bg-gradient-to-br from-primary/80 to-primary-container/80 font-label">
            Hi, {name} 👋
          </h2>

          <div className="pt-8">
            <button
              onClick={handleStartChallenge}
              className="group relative inline-flex items-center gap-3 py-4 px-10 bg-surface-container-high/40 border border-outline-variant/30 rounded-2xl font-label font-bold text-lg tracking-wide hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(55,93,241,0.15)] active:scale-95 transition-all duration-300"
            >
              <span className="text-on-surface-variant group-hover:text-primary transition-colors italic">
                "Ready to test your best?"
              </span>
              <ArrowRight className="w-5 h-5 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              
              {/* Subtle background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <p className="text-xs text-on-surface-variant/60 font-body mt-4 uppercase tracking-[0.2em] font-medium animate-pulse">
              Click to Start
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
