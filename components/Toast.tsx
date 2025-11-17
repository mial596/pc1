import React from 'react';
import { motion } from 'framer-motion';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <motion.div
      layout
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-white font-bold py-3 px-6 text-base text-center max-w-[90vw] rounded-full shadow-lg border-2 border-white/50"
      style={{ zIndex: 'var(--z-toast)' }}
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {message}
    </motion.div>
  );
};

export default Toast;