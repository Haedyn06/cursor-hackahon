import type { SVGProps } from "react";
import { RezumeLogoMark } from "@/components/layout/rezume-logo-mark";

type RezumeLogoProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

export function RezumeLogo({
  className = "h-10 w-10",
  ...props
}: RezumeLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <RezumeLogoMark />
    </svg>
  );
}
