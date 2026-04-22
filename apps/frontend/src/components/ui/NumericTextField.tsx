import { useEffect, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";

const DECIMAL_RE = /^-?\d*\.?\d*$/;
const INT_RE = /^-?\d*$/;

function clamp(n: number, min?: number, max?: number): number {
  let x = n;
  if (min !== undefined) x = Math.max(min, x);
  if (max !== undefined) x = Math.min(max, x);
  return x;
}

function commitValue(
  raw: string,
  integer: boolean,
  min?: number,
  max?: number,
): number {
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
    const fb = min !== undefined ? min : 0;
    return clamp(fb, min, max);
  }
  const n = integer ? parseInt(raw, 10) : parseFloat(raw);
  if (!Number.isFinite(n)) {
    const fb = min !== undefined ? min : 0;
    return clamp(fb, min, max);
  }
  return clamp(integer ? Math.round(n) : n, min, max);
}

export type NumericTextFieldProps = Omit<
  TextFieldProps,
  "type" | "value" | "onChange" | "defaultValue"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** When true, only whole numbers (default: false). */
  integer?: boolean;
};

/**
 * MUI TextField for numeric values that allows clearing the field and editing
 * without forcing `0` on every keystroke (unlike `type="number"` + `Number(e.target.value)`).
 */
export default function NumericTextField({
  value,
  onValueChange,
  min,
  max,
  integer = false,
  onFocus,
  onBlur,
  inputProps,
  ...rest
}: NumericTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() =>
    Number.isFinite(value) ? String(value) : "",
  );

  useEffect(() => {
    if (!focused) {
      setDraft(Number.isFinite(value) ? String(value) : "");
    }
  }, [value, focused]);

  const re = integer ? INT_RE : DECIMAL_RE;

  return (
    <TextField
      {...rest}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      value={focused ? draft : Number.isFinite(value) ? String(value) : ""}
      onFocus={(e) => {
        setFocused(true);
        setDraft(Number.isFinite(value) ? String(value) : "");
        onFocus?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (next !== "" && !re.test(next)) return;
        setDraft(next);
        if (next === "" || next === "-" || next === "." || next === "-.") {
          return;
        }
        const n = integer ? parseInt(next, 10) : parseFloat(next);
        if (!Number.isFinite(n)) return;
        onValueChange(clamp(integer ? Math.round(n) : n, min, max));
      }}
      onBlur={(e) => {
        setFocused(false);
        const n = commitValue(draft, integer, min, max);
        setDraft(String(n));
        onValueChange(n);
        onBlur?.(e);
      }}
      inputProps={inputProps}
    />
  );
}
