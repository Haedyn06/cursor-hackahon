import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode, CSSProperties } from "react";

type NeoButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "mint" | "peach" | "secondary" | "yellow" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

const fills: Record<string, string> = {
  primary: "var(--lav)",
  mint: "var(--mint)",
  peach: "var(--peach)",
  secondary: "#ffffff",
  yellow: "var(--yellow)",
  danger: "var(--red)",
};

export function NeoButton({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  disabled,
  type = "button",
  onClick,
}: NeoButtonProps) {
  const pad =
    size === "sm" ? "7px 16px" : size === "lg" ? "13px 28px" : "10px 22px";
  const fs = size === "sm" ? 13 : size === "lg" ? 15 : 14;

  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-full font-sans font-bold text-[var(--foreground)] neo-border transition-transform outline-none hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
  const style = {
    background: fills[variant] ?? fills.primary,
    padding: pad,
    fontSize: fs,
  } as CSSProperties;

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} className={classes} style={style}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={style}
    >
      {children}
    </button>
  );
}
