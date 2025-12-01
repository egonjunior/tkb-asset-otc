import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
  decimals?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, decimals = 2, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Format number to Brazilian format
    const formatToBRL = (num: number): string => {
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    // Parse Brazilian format to number
    const parseBRLToNumber = (str: string): number => {
      if (!str) return 0;
      // Remove all dots (thousands separator) and replace comma with dot
      const cleaned = str.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Initialize / sync display value when value prop changes
    React.useEffect(() => {
      const numValue =
        typeof value === "string" ? parseFloat(value) : (value as number);

      if (!isNaN(numValue) && numValue > 0) {
        setDisplayValue(formatToBRL(numValue));
      } else if (numValue === 0) {
        // Mantém vazio para ficar mais confortável de editar
        setDisplayValue("");
      } else if (value === "" || value === null || value === undefined) {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;

      // Permite apenas números, vírgula e ponto
      input = input.replace(/[^\d.,]/g, "");

      // Permite apenas uma vírgula (separador decimal)
      const commaCount = (input.match(/,/g) || []).length;
      if (commaCount > 1) {
        return;
      }

      // Limita casas decimais
      const parts = input.split(",");
      if (parts[1] && parts[1].length > decimals) {
        return;
      }

      setDisplayValue(input);

      const numericValue = parseBRLToNumber(input);
      onChange(numericValue);
    };

    const handleBlur = () => {
      const numericValue = parseBRLToNumber(displayValue);
      if (!isNaN(numericValue) && numericValue > 0) {
        setDisplayValue(formatToBRL(numericValue));
      } else {
        setDisplayValue("");
      }
    };

    const handleFocus = () => {
      const numericValue = parseBRLToNumber(displayValue);
      if (!isNaN(numericValue) && numericValue > 0) {
        const unformatted = numericValue
          .toFixed(decimals)
          .replace(".", ",");
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
