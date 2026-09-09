"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface FeatureStaggerGridProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (staggerDelay = 0.08) => ({
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.05,
    },
  }),
};

export const itemRevealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function FeatureStaggerGrid({
  children,
  className = "",
  staggerDelay = 0.08,
}: FeatureStaggerGridProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduce ? undefined : containerVariants}
      custom={staggerDelay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={`grid ${className}`}
    >
      {React.Children.map(children, (child, idx) => (
        <motion.div
          key={idx}
          variants={shouldReduce ? undefined : itemRevealVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
