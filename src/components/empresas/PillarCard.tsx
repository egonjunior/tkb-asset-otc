import { Card, CardContent } from "@/components/ui/card";

interface PillarCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: string;
}

export const PillarCard = ({ icon, title, description, delay = "0ms" }: PillarCardProps) => {
  return (
    <Card 
      className="h-full bg-white border-border shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-8 space-y-4 text-center h-full flex flex-col">
        {/* Icon */}
        <div className="text-6xl mb-2">{icon}</div>
        
        {/* Title */}
        <h3 className="text-2xl font-display text-foreground">
          {title}
        </h3>
        
        {/* Separator */}
        <div className="h-1 w-16 bg-gradient-to-r from-primary to-tkb-cyan rounded-full mx-auto" />
        
        {/* Description */}
        <p className="text-muted-foreground leading-relaxed flex-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
