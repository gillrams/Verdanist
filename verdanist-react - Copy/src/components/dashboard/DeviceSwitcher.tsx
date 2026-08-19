interface DeviceSwitcherProps {
  device: 'indoor' | 'outdoor';
  onChange: (device: 'indoor' | 'outdoor') => void;
}

export default function DeviceSwitcher({ device, onChange }: DeviceSwitcherProps) {
  return (
    <section className="flex justify-center w-full sm:w-auto">
      <div className="inline-flex items-center p-0.5 bg-white/70 dark:bg-[#0A2F1F]/40 backdrop-blur-xl rounded-full shadow-lg shadow-green-900/5 border border-white/50 dark:border-white/10 w-full sm:w-auto">
        <button 
          onClick={() => {
            console.log('Attempting to set to indoor');
            if (typeof onChange === 'function') {
              onChange('indoor');
            }
          }}
          className={`flex-1 sm:flex-none px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${device === 'indoor' ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'text-gray-500 dark:text-white/50 hover:text-green-600 dark:hover:text-white'}`}
        >
          <span className="material-symbols-rounded text-[12px]">home</span>
          Indoor
        </button>
        <button 
          onClick={() => {
            console.log('Attempting to set to outdoor');
            if (typeof onChange === 'function') {
              onChange('outdoor');
            }
          }}
          className={`flex-1 sm:flex-none px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${device === 'outdoor' ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'text-gray-500 dark:text-white/50 hover:text-green-600 dark:hover:text-white'}`}
        >
          <span className="material-symbols-rounded text-[12px]">park</span>
          Outdoor
        </button>
      </div>
    </section>
  );
}
