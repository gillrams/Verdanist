import { motion } from "framer-motion";

// Bypass TS error for custom web component without global augmentation
const LottiePlayer = 'lottie-player' as any;

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background decorations */}
      <motion.div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-chart-2/10 rounded-full blur-[120px] pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
      />

      <motion.div
        className="flex flex-col items-center px-10 relative z-10"
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.8 
        }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2500); // Wait 2.5s before completing
        }}
      >
        <div className="relative flex flex-col items-center justify-center">
          {/* Ambient glow pulse behind animation */}
          <motion.div
            className="absolute w-56 h-56 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(21,128,61,0.2) 0%, transparent 70%)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative z-10 drop-shadow-xl"
          >
            <LottiePlayer 
              src="/avocado_animation.json"
              background="transparent" 
              speed="1" 
              style={{ width: '224px', height: '224px' }} 
              loop 
              autoplay
            ></LottiePlayer>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
