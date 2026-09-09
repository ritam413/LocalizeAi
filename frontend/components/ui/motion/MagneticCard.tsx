"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

export interface MagneticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function MagneticCard({
  children,
  className = "",
  intensity = 7.5,
  ...props
}: MagneticCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={shouldReduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-xl transition-shadow hover:shadow-2xl hover:border-zinc-700/80 ${className}`}
      {...(props as any)}
    >
      <div style={shouldReduce ? undefined : { transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
}
