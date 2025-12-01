import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
  decimals?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, decimals = 2, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Format number to Brazilian format
    const formatToBRL = (num: number): string => {
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    // Parse Brazilian format to number
    const parseBRLToNumber = (str: string): number => {
      // Remove all dots (thousands separator) and replace comma with dot
      const cleaned = str.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    // Initialize display value when value prop changes
    React.useEffect(() => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue) && numValue > 0) {
        setDisplayValue(formatToBRL(numValue));
      } else if (numValue === 0 || isNaN(numValue)) {
        // Clear display when value is 0 or invalid
        setDisplayValue("");
      }
    }, [value, formatToBRL]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;
      
      // Allow only numbers, comma and dot
      input = input.replace(/[^\\d,]/g, '');
      
      // Allow only one comma
      const commaCount = (input.match(/,/g) || []).length;
      if (commaCount > 1) {
        return;
      }

      // Limit decimal places
      const parts = input.split(',');
      if (parts[1] && parts[1].length > decimals) {
        return;
      }

      setDisplayValue(input);

      // Parse and send numeric value
      const numericValue = parseBRLToNumber(input);
      onChange(numericValue);
    };

    const handleBlur = () => {
      // Format on blur if there's a valid number
      const numericValue = parseBRLToNumber(displayValue);
      if (!isNaN(numericValue) && numericValue !== 0) {
        setDisplayValue(formatToBRL(numericValue));
      } else if (displayValue === "" || numericValue === 0) {
        setDisplayValue("");
      }
    };

    const handleFocus = () => {
      // Remove formatting on focus for easier editing
      const numericValue = parseBRLToNumber(displayValue);
      if (!isNaN(numericValue) && numericValue !== 0) {
        // Show unformatted but keep comma for decimals
        const unformatted = numericValue.toFixed(decimals).replace('.', ',');
        setDisplayValue(unformatted);
      }
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };

