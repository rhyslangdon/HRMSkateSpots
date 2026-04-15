'use client';

import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { PropsWithChildren } from 'react';

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.99,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
    },
  },
};

const formVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: 0.14,
      ease: 'easeIn',
    },
  },
};

const formItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: 'easeOut',
    },
  },
};

type MotionBlockProps = PropsWithChildren<HTMLMotionProps<'div'>>;

export function MotionPresence({ children }: PropsWithChildren) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}

export function MotionFade({ children, ...props }: MotionBlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.18, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionMapPanel({ children, ...props }: MotionBlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={reduceMotion ? fadeVariants : slideUpVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionDropdown({ children, ...props }: MotionBlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      animate={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              height: 'auto',
              transition: {
                height: { duration: 0.26, ease: 'easeOut' },
                opacity: { duration: 0.18, ease: 'easeOut' },
              },
            }
      }
      exit={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              height: 0,
              transition: {
                height: { duration: 0.22, ease: 'easeInOut' },
                opacity: { duration: 0.14, ease: 'easeIn' },
              },
            }
      }
      style={{ overflow: 'hidden' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionForm({ children, ...props }: MotionBlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={reduceMotion ? fadeVariants : formVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionFormItem({ children, ...props }: MotionBlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div variants={reduceMotion ? fadeVariants : formItemVariants} {...props}>
      {children}
    </motion.div>
  );
}

export const motionPresets = {
  fade: fadeVariants,
  mapPanel: slideUpVariants,
  form: formVariants,
  formItem: formItemVariants,
};
