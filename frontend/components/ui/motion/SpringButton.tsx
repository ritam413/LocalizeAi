"use client";

import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

export interface SpringButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "emerald";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export function SpringButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: SpringButtonProps) {
  const shouldReduce = useReducedMotion();

  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30",
    secondary: "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600",
    ghost: "bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200",
    danger: "bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-400/30",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
  };

  return (
    <motion.button
      whileHover={shouldReduce || disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={shouldReduce || disabled ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
