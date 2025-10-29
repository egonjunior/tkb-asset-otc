import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showArrow?: boolean;
  variant?: 'premium' | 'gold';
}

export const PremiumButton = ({ 
  children, 
  showArrow = true, 
  variant = 'premium',
  ...props 
}: PremiumButtonProps) => {
  return (
    <Button 
      variant={variant} 
      size="lg" 
      className="group"
      {...props}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
      )}
    </Button>
  );
};
