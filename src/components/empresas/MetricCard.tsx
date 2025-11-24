import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  number: string;
  label: string;
  delay?: string;
  countUp?: boolean;
}

export const MetricCard = ({ number, label, delay = "0ms", countUp = false }: MetricCardProps) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!countUp) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hasAnimated, countUp]);

  return (
    <Card 
      ref={cardRef}
      className="bg-gradient-to-br from-neutral-50 to-white border-border shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-8 text-center space-y-3">
        <div className={`text-5xl md:text-6xl font-display font-bold text-primary ${hasAnimated ? 'animate-count-up' : ''}`}>
          {number}
        </div>
        <div className="h-1 w-12 bg-gradient-to-r from-primary to-tkb-cyan rounded-full mx-auto" />
        <p className="text-muted-foreground font-medium leading-relaxed">
          {label}
        </p>
      </CardContent>
    </Card>
  );
};
