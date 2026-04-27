import { Terminal, Cpu, Braces, BookOpen, ArrowRight, Zap } from 'lucide-react';

export default function CoursesView() {
  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 w-full max-w-7xl mx-auto flex flex-col gap-8 overflow-y-auto h-full">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">
          Learning Tracks
        </h1>
        <p className="text-on-surface-variant font-body text-base max-w-2xl">
          Master fundamental algorithms, data structures, and advanced system design through our structured curricula.
        </p>
      </header>

      {/* Active Course Hero */}
      <section className="w-full bg-surface-container-low rounded-xl border border-outline-variant/15 p-6 md:p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-700"></div>
        <div className="flex-1 flex flex-col z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 text-xs font-label bg-surface-container-high text-primary rounded-sm border border-outline-variant/20">
              Intermediate
            </span>
            <span className="px-2.5 py-1 text-xs font-label bg-surface-container-high text-secondary rounded-sm border border-outline-variant/20 flex items-center gap-1">
              <Zap size={14} className="fill-secondary" />
              In Progress
            </span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">
            Mastering Algorithms: Graphs & Trees
          </h2>
          <p className="text-on-surface-variant font-body mb-6 max-w-xl">
            Deep dive into complex non-linear data structures. Learn to traverse, manipulate, and optimize graph networks for real-world scenarios.
          </p>

          <div className="mt-auto w-full max-w-md">
            <div className="flex justify-between text-xs font-label text-slate-400 mb-2">
              <span>Progress</span>
              <span>64%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-container w-[64%] rounded-full shadow-[0_0_10px_rgba(55,93,241,0.5)]"></div>
            </div>
          </div>

          <div className="mt-6">
            <button className="px-5 py-2 text-sm font-label rounded-md bg-gradient-to-br from-primary to-primary-container text-on-primary-container hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary-container/20">
              Continue Track
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/3 aspect-video md:aspect-square lg:aspect-video rounded-lg overflow-hidden border border-outline-variant/15 relative z-10 shadow-[0_24px_48px_rgba(6,14,32,0.4)]">
          <img
            alt="Code on screen"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD86B8upoI2MzusqbEwQslA3sx7yi2EGSlREAQ-84MlqDegCxO2j71PP5XIHNKpFjTHvKCjQ1M3qXFfz8Y2acDl8jv9lTznIkv6btCXkeVhc0OdNPRq7yECQGyjZMOjbtGePuEMFS-hggIWYdF1L9xag57PARS4h_I65kofZr_o_m-529hJE-6k5edGX0jB9laxjBMVmNFQJiHafQ0le6yLNuTBQ5NZGuK5FuSppWrtr4Yqa98IRuAqA2SJz8rOgZem6lDzBph0VTY"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
        </div>
      </section>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {/* Card 1 */}
        <a href="#" className="bg-surface border border-outline-variant/15 rounded-lg overflow-hidden hover:bg-surface-container-low hover:border-outline-variant/30 transition-all duration-300 group flex flex-col h-full">
          <div className="h-32 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center">
              <Terminal size={64} className="text-primary" />
            </div>
            <Terminal size={48} className="text-primary opacity-50 z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-3">
              <span className="px-2 py-0.5 text-[10px] font-label bg-surface-container text-on-surface-variant border border-outline-variant/15 rounded-sm">
                Beginner
              </span>
            </div>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
              Python for Data Science
            </h3>
            <p className="text-sm font-body text-on-surface-variant line-clamp-2 mb-4">
              Learn pandas, numpy, and matplotlib. Transform raw data into actionable insights with Python.
            </p>
            <div className="mt-auto flex items-center justify-between text-xs font-label text-slate-500 hover:text-primary transition-colors">
              <span className="flex items-center gap-1">
                <BookOpen size={14} /> 12 Modules
              </span>
              <span className="flex items-center gap-1">
                Start <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </a>

        {/* Card 2 */}
        <a href="#" className="bg-surface border border-outline-variant/15 rounded-lg overflow-hidden hover:bg-surface-container-low hover:border-outline-variant/30 transition-all duration-300 group flex flex-col h-full">
          <div className="h-32 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center">
              <Cpu size={64} className="text-secondary" />
            </div>
            <Cpu size={48} className="text-secondary opacity-50 z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-3">
              <span className="px-2 py-0.5 text-[10px] font-label bg-surface-container text-on-surface-variant border border-outline-variant/15 rounded-sm">
                Advanced
              </span>
              <span className="text-[10px] font-label text-secondary">
                In Progress
              </span>
            </div>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
              System Design Masterclass
            </h3>
            <p className="text-sm font-body text-on-surface-variant line-clamp-2 mb-4">
              Architect scalable, fault-tolerant distributed systems. Ace the grueling tech interviews.
            </p>
            <div className="mt-auto w-full">
              <div className="flex justify-between text-[10px] font-label text-slate-400 mb-1.5">
                <span>Module 3/8</span>
                <span>38%</span>
              </div>
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[38%] rounded-full"></div>
              </div>
            </div>
          </div>
        </a>

        {/* Card 3 */}
        <a href="#" className="bg-surface border border-outline-variant/15 rounded-lg overflow-hidden hover:bg-surface-container-low hover:border-outline-variant/30 transition-all duration-300 group flex flex-col h-full">
          <div className="h-32 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center">
              <Braces size={64} className="text-tertiary" />
            </div>
             <Braces size={48} className="text-tertiary opacity-50 z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-3">
              <span className="px-2 py-0.5 text-[10px] font-label bg-surface-container text-on-surface-variant border border-outline-variant/15 rounded-sm">
                Intermediate
              </span>
            </div>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
              Dynamic Programming
            </h3>
            <p className="text-sm font-body text-on-surface-variant line-clamp-2 mb-4">
              Overcome the fear of DP. Learn pattern recognition and optimization techniques.
            </p>
            <div className="mt-auto flex items-center justify-between text-xs font-label text-slate-500 hover:text-primary transition-colors">
              <span className="flex items-center gap-1">
                <BookOpen size={14} /> 15 Modules
              </span>
              <span className="flex items-center gap-1">
                Start <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
