import { motion } from "framer-motion";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import logoLight from "../../assets/Logo_Light_Sejajar.png";
import logoDark from "../../assets/Logo_Dark_sejajar.png";

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
        <div className="relative flex items-center justify-center">
          {/* Ambient glow pulse behind logo */}
          <motion.div
            className="absolute w-56 h-32 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(21,128,61,0.25) 0%, transparent 70%)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.8, 2.2] }}
            transition={{ delay: 0.4, duration: 2.2, times: [0, 0.4, 1], ease: "easeOut" }}
          />
          
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            {/* Light mode logo */}
            <ImageWithFallback
              src={logoLight}
              alt="Verdanist"
              className="block dark:hidden w-64 object-contain relative z-10 drop-shadow-xl"
            />
            {/* Dark mode logo */}
            <ImageWithFallback
              src={logoDark}
              alt="Verdanist"
              className="hidden dark:block w-64 object-contain relative z-10 drop-shadow-xl"
            />
          </motion.div>
        </div>
        
        {/* Loading text/dots */}
        <motion.div 
          className="mt-8 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
