import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 md:gap-4">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border-[3px] border-neo-ink text-sm font-black",
                done && "bg-neo-lime",
                active && "bg-neo-blue text-white",
                !done && !active && "bg-white"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm font-bold uppercase sm:inline",
                active && "underline decoration-4 underline-offset-4"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 hidden h-[3px] w-6 bg-neo-ink md:inline" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
