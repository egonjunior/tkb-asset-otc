import { Card, CardContent } from "@/components/ui/card";

interface SectorCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: string;
}

export const SectorCard = ({ icon, title, description, delay = "0ms" }: SectorCardProps) => {
  return (
    <Card 
      className="bg-white border-border shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-6 space-y-3">
        {/* Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <h3 className="text-lg font-display text-foreground">
            {title}
          </h3>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
