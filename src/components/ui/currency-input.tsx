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
    const [isFocused, setIsFocused] = React.useState(false);

    // Parse brasileiro: "1.214.999,91" → 1214999.91
    const parseBRL = (str: string): number => {
      if (!str) return 0;
      // Remove todos os pontos (separador de milhar) e substitui vírgula por ponto
      const cleaned = str.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Formatar: 1214999.91 → "1.214.999,91"
    const formatBRL = (num: number): string => {
      if (num === 0) return "";
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    // SÓ sincroniza quando NÃO está focado (não interfere na digitação)
    React.useEffect(() => {
      if (!isFocused) {
        const numValue =
          typeof value === "number" ? value : parseFloat(value as string) || 0;
        setDisplayValue(numValue > 0 ? formatBRL(numValue) : "");
      }
    }, [value, isFocused, decimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Permite números, pontos e vírgula durante a digitação
      const cleaned = input.replace(/[^\d.,]/g, "");
      
      // Limita a apenas uma vírgula
      const commaCount = (cleaned.match(/,/g) || []).length;
      if (commaCount > 1) {
        return;
      }

      // Limita casas decimais
      const parts = cleaned.split(",");
      if (parts[1] && parts[1].length > decimals) {
        return;
      }

      setDisplayValue(cleaned);
      
      // Envia o valor parseado para o parent
      const numericValue = parseBRL(cleaned);
      onChange(numericValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      
      // Formata e atualiza quando sai do campo
      const numericValue = parseBRL(displayValue);
      const formatted = numericValue > 0 ? formatBRL(numericValue) : "";
      setDisplayValue(formatted);
      onChange(numericValue);
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
