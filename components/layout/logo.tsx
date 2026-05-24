import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "icon" | "sm" | "md";
  href?: string;
  className?: string;
};

export function Logo({ size = "md", href, className }: LogoProps) {
  const sz = size === "icon" ? 36 : size === "sm" ? 32 : 40;
  const fs = Math.round(sz * 0.52);

  const inner = (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex shrink-0 items-center justify-center rounded-[10px] font-heading font-extrabold text-[var(--foreground)] neo-border select-none"
        style={{
          width: sz,
          height: sz,
          background: "var(--mint)",
          fontSize: fs,
        }}
      >
        R
      </div>
      {size !== "icon" && (
        <span
          className="font-heading font-extrabold tracking-tight text-[var(--foreground)]"
          style={{ fontSize: size === "sm" ? 18 : 22 }}
        >
          ezume
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="cursor-pointer">
        {inner}
      </Link>
    );
  }

  return inner;
}
