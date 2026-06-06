export default function HeroTemperature() {
  return (
    <section className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 bg-white/80 dark:bg-[#0A2F1F]/60 backdrop-blur-xl rounded-[2rem] p-5 lg:p-6 relative overflow-hidden shadow-xl border border-white/40 dark:border-white/10 group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-[30px] group-hover:bg-green-500/20 transition-colors duration-700"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-white/60">
            <span className="material-symbols-rounded text-green-500 text-[18px]">thermostat</span>
            <h2 className="font-extrabold text-[11px] lg:text-xs tracking-widest uppercase">Avg Temperature</h2>
          </div>
          <span className="text-[9px] lg:text-[10px] uppercase tracking-widest text-gray-500 dark:text-white/60 bg-white/50 dark:bg-white/5 px-2.5 py-1 rounded-full font-bold border border-white/40">Just now</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none">28</span>
          <span className="text-lg lg:text-xl font-bold text-green-500">°C</span>
        </div>
      </div>
    </section>
  );
}
