import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const fieldBase =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-400";

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(fieldBase, error && "border-red-400 focus:border-red-500 focus:ring-red-500", className)}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(fieldBase, "min-h-[90px] resize-y", error && "border-red-400 focus:border-red-500 focus:ring-red-500", className)}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, required, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(fieldBase, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2364748b%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-[length:18px] bg-[right_0.6rem_center] bg-no-repeat pr-9", error && "border-red-400", className)}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
