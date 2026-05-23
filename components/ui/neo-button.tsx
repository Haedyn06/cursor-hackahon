"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  default: "bg-white hover:bg-neo-lime",
  primary: "bg-neo-blue text-white hover:bg-neo-purple hover:text-white",
  lime: "bg-neo-lime hover:bg-neo-orange",
  danger: "bg-neo-pink text-white hover:bg-red-600",
  ghost: "bg-transparent shadow-none border-transparent hover:border-neo-ink hover:shadow-[3px_3px_0_0_#0a0a0a]",
  outline: "bg-white",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

export function NeoButton({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
}) {
  return (
    <button
      className={cn("neo-btn", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
