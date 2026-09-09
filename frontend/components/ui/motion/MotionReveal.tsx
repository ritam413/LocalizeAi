"use client";

import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

export interface MotionRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

export function MotionReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
  ...props
}: MotionRevealProps) {
  const shouldReduce = useReducedMotion();

  const getInitialOffset = () => {
    switch (direction) {
      case "up": return { y: 20 };
      case "down": return { y: -20 };
      case "left": return { x: 20 };
      case "right": return { x: -20 };
      case "none": return {};
    }
  };

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, ...getInitialOffset() }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
