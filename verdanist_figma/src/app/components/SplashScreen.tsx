import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoLight from "../../imports/Logo_Light_Tp.png";
import logoDark from "../../imports/Logo_Dark_Tp.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center px-10"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2000);
        }}
      >
        <div className="relative flex items-center justify-center">
          {/* Ambient glow pulse */}
          <motion.div
            className="absolute w-48 h-24 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(21,128,61,0.22) 0%, transparent 70%)" }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.6, 1.6] }}
            transition={{ delay: 0.5, duration: 1.8, times: [0, 0.25, 1] }}
          />
          {/* Light mode logo */}
          <ImageWithFallback
            src={logoLight}
            alt="Verdanist"
            className="block dark:hidden w-56 object-contain relative z-10"
          />
          {/* Dark mode logo */}
          <ImageWithFallback
            src={logoDark}
            alt="Verdanist"
            className="hidden dark:block w-56 object-contain relative z-10"
          />
        </div>
      </motion.div>
      <button
        onClick={onComplete}
        className="absolute bottom-10 text-xs text-muted-foreground/60 hover:text-foreground"
      >
        Lewati
      </button>
    </div>
  );
}
