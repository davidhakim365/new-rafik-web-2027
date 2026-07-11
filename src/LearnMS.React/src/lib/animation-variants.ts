import { Variants } from "framer-motion";

export const staggeredChildSlideUpVariants = (
  isRTL: boolean,
  delay: number = 0,
  duration: number = 0.8
): Variants => ({
  initial: {
    opacity: 0,
    x: isRTL ? -200 : 200,
    filter: "blur(15px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: duration,
      delay: delay,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: isRTL ? 200 : -200,
    filter: "blur(15px)",
    transition: {
      duration: duration * 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const formContainerVariants = (): Variants => ({
  initial: {
    opacity: 1,
  },
  animate: {
    opacity: 1,
    transition: {
      delay: 1.5,
      staggerChildren: 0.2,
      when: "beforeChildren",
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      when: "afterChildren",
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const authPageContentVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
    filter: "blur(6px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    filter: "blur(6px)",
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const authPageContentContainerVariants = (
  delayChildren: number = 1.2
): Variants => ({
  initial: {
    opacity: 1,
  },
  animate: {
    opacity: 1,
    transition: {
      delayChildren: delayChildren,
      staggerChildren: 0.4,
      when: "beforeChildren",
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.08,
      staggerDirection: -1,
      when: "afterChildren",
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const gridContainerWithEntryAndStaggerVariants = (
  isRTL: boolean,
  delay: number = 0.1,
  staggerDelay: number = 0.15
): Variants => ({
  initial: {
    opacity: 0,
    x: isRTL ? -150 : 150,
    filter: "blur(12px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      delay: delay,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: staggerDelay,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    x: isRTL ? 150 : -150,
    filter: "blur(12px)",
    transition: {
      duration: 0.3,
      staggerChildren: 0.04,
      staggerDirection: -1,
      when: "afterChildren",
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const pageTransitionVariants = (isRTL: boolean): Variants => ({
  initial: {
    opacity: 0,
    x: isRTL ? -100 : 100,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    x: isRTL ? 100 : -100,
    filter: "blur(10px)",
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
});

export const sidePanelVariants = (
  isRTL: boolean,
  isLeft: boolean
): Variants => ({
  initial: {
    x: isLeft ? (isRTL ? "100%" : "-100%") : isRTL ? "-100%" : "100%",
    opacity: 0,
    filter: "blur(8px)",
  },
  animate: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      delayChildren: 0.3,
      staggerChildren: 0.1,
    },
  },
  exit: {
    x: isLeft ? (isRTL ? "-100%" : "100%") : isRTL ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(8px)",
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
});

export const sectionAppearVariants = (
  isRTL: boolean,
  isLeftSection: boolean = true
): Variants => ({
  initial: {
    opacity: 0,
    scale: 0.95,
    x: isLeftSection ? (isRTL ? "100%" : "-100%") : isRTL ? "-100%" : "100%",
    filter: "blur(20px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      delayChildren: 0.6,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: isLeftSection ? (isRTL ? "-100%" : "100%") : isRTL ? "100%" : "-100%",
    filter: "blur(20px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const enhancedPageTransition = (): Variants => ({
  initial: {
    opacity: 0,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delayChildren: 0.1,
      staggerChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(10px)",
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});
