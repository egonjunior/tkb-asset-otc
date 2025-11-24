import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  icon: string;
  title: string;
  description: string;
  idealFor: string[];
  execution: string;
  advantage: string;
  badge?: string;
}

export const ProductCard = ({
  icon,
  title,
  description,
  idealFor,
  execution,
  advantage,
  badge,
}: ProductCardProps) => {
  return (
    <Card className="relative overflow-hidden bg-white border-border shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-gold/20 text-gold border-gold/30">
            {badge}
          </Badge>
        </div>
      )}
      
      <CardContent className="p-8 space-y-6">
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="text-5xl flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-display text-foreground mb-2">
              {title}
            </h3>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-tkb-cyan rounded-full" />
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Ideal For */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Ideal para:
          </p>
          <ul className="space-y-2">
            {idealFor.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
            ⚡ {execution}
          </Badge>
          <Badge variant="outline" className="bg-success/5 border-success/20 text-success">
            💰 {advantage}
          </Badge>
        </div>
      </CardContent>
      
      {/* Hover effect gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-tkb-cyan/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />
    </Card>
  );
};
