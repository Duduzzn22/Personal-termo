import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-start gap-3 select-none"
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 focus:ring-offset-0",
            className
          )}
          {...props}
        />
        <span className="text-sm leading-relaxed text-slate-700">{label}</span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
