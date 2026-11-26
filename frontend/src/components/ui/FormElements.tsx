import { forwardRef } from "react";

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
          ${error
            ? "border-red-400 focus:border-red-500 bg-red-50"
            : "border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  required?: boolean;
  options:  { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-gray-50 focus:bg-white
          ${error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-400"}
          ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

export function Button({ variant = "primary", loading, children, className = "", disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:   "bg-gray-900 text-white hover:bg-gray-700",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger:    "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open:     boolean;
  message:  string;
  onConfirm: () => void;
  onCancel:  () => void;
  loading?:  boolean;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Supprimer</Button>
        </div>
      </div>
    </div>
  );
}