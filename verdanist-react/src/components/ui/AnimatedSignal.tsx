import { motion } from 'framer-motion';

interface AnimatedSignalProps {
  strength: number; // Number of active bars (e.g., 1 to 4)
  maxBars?: number; // Total bars (default 4)
  active?: boolean;
  className?: string;
  barColor?: string;
  inactiveBarColor?: string;
  barWidth?: string;
  gap?: string;
  baseHeight?: number; // Base height multiplier
}

export function AnimatedSignal({
  strength,
  maxBars = 4,
  active = true,
  className = "",
  barColor = "bg-primary",
  inactiveBarColor = "bg-border",
  barWidth = "w-1.5",
  gap = "gap-1",
  baseHeight = 6
}: AnimatedSignalProps) {
  // Generate array of bars based on maxBars
  const bars = Array.from({ length: maxBars }, (_, i) => i + 1);

  return (
    <div className={`flex items-end ${gap} ${className}`}>
      {bars.map((bar) => {
        const isActiveBar = bar <= strength && active;
        // Calculate height for each bar: e.g. bar 1 = 10px, bar 2 = 16px...
        const h = bar * baseHeight + 4;

        return (
          <motion.div
            key={bar}
            className={`${barWidth} rounded-full transition-colors duration-300 ${
              isActiveBar ? barColor : inactiveBarColor
            }`}
            animate={
              isActiveBar
                ? {
                    height: [h * 0.5, h, h * 0.5],
                    opacity: [0.5, 1, 0.5],
                  }
                : {
                    height: h,
                    opacity: 1,
                  }
            }
            transition={
              isActiveBar
                ? {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: bar * 0.2, // Sequential wave animation
                    ease: "easeInOut",
                  }
                : {}
            }
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}
