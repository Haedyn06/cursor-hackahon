import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type NeoInputProps = {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  icon?: ReactNode;
  className?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  label?: string;
  name?: string;
};

export function NeoInput({
  placeholder,
  value,
  defaultValue,
  onChange,
  icon,
  className,
  type = "text",
  multiline,
  rows = 4,
  label,
  name,
}: NeoInputProps) {
  const baseClass = cn(
    "w-full bg-white font-sans text-sm text-[var(--foreground)] outline-none neo-border",
    multiline ? "rounded-xl" : "rounded-full",
    icon ? "pl-10 pr-4" : "px-4",
    "py-2.5",
    className,
  );

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-[var(--foreground)]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-[var(--muted)]">
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            rows={rows}
            className={cn(baseClass, "resize-y")}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            className={baseClass}
          />
        )}
      </div>
    </div>
  );
}
