import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function NeoInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("neo-input", className)} {...props} />;
}

export function NeoTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("neo-input min-h-[120px] resize-y", className)}
      {...props}
    />
  );
}

export function NeoLabel({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-bold uppercase tracking-wide", className)}
    >
      {children}
    </label>
  );
}

export function NeoSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("neo-input cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}
