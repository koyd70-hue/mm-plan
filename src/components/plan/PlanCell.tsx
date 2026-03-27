"use client";

import { useState, useRef, useEffect } from "react";

interface PlanCellProps {
  value: number;
  onChange: (value: number) => void;
}

export default function PlanCell({ value, onChange }: PlanCellProps) {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value === 0 ? "" : value.toString());
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);
    const newValue = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    setLocalValue(newValue === 0 ? "" : newValue.toString());
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value === 0) {
      setLocalValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Tab") {
      // Let default tab behavior work
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowUp" ? 0.1 : -0.1;
      const current = parseFloat(localValue) || 0;
      const newVal = Math.max(0, Math.round((current + step) * 100) / 100);
      setLocalValue(newVal.toString());
      onChange(newVal);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className="w-full h-full px-2 py-1 text-right text-sm border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
      placeholder="0"
    />
  );
}
