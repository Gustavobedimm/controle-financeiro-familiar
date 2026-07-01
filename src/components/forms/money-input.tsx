import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type MoneyInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "step" | "inputMode" | "value" | "onChange"> & {
  value: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

function formatDisplayValue(value: string | number) {
  return Number(value) ? String(value).replace(".", ",") : "";
}

function normalizeDecimal(value: string) {
  return value.replace(",", ".");
}

export function MoneyInput({ value, onChange, onFocus, onBlur, ...props }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(formatDisplayValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplayValue(formatDisplayValue(value));
  }, [focused, value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value.replace(/[^\d,.]/g, "");
    setDisplayValue(nextValue);
    event.target.value = normalizeDecimal(nextValue);
    onChange?.(event);
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    setFocused(false);
    setDisplayValue(formatDisplayValue(value));
    onBlur?.(event);
  }

  return (
    <Input
      type="text"
      min="0"
      inputMode="decimal"
      placeholder="0,00"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}
