import Link from "next/link";
import { cn } from "@/lib/utils";
import { RezumeLogo } from "@/components/layout/rezume-logo";

type LogoProps = {
  size?: "icon" | "sm" | "md";
  href?: string;
  className?: string;
};

const LOGO_SIZE = {
  icon: 36,
  sm: 32,
  md: 40,
} as const;

export function Logo({ size = "md", href, className }: LogoProps) {
  const dimension = LOGO_SIZE[size];

  const inner = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <RezumeLogo
        className="shrink-0"
        style={{ width: dimension, height: dimension }}
      />
      {size !== "icon" && (
        <span
          className="font-heading font-extrabold tracking-tight text-[var(--foreground)]"
          style={{ fontSize: size === "sm" ? 18 : 22 }}
        >
          Rezume
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
