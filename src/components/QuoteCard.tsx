import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuoteCardProps {
  binancePrice: number;
  otcPrice: number;
  lastUpdate: Date;
}

const QuoteCard = ({ binancePrice, otcPrice, lastUpdate }: QuoteCardProps) => {
  const spread = ((otcPrice - binancePrice) / binancePrice * 100).toFixed(2);

  return (
    <Card className="shadow-lg border-primary/10">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Cotação USDT/BRL
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                R$ {binancePrice.toFixed(2)}
              </span>
              <Badge variant="secondary" className="text-xs">
                Binance
              </Badge>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Seu preço OTC
            </span>
            <span className="text-xs text-success font-medium">
              +{spread}%
            </span>
          </div>
          <span className="text-2xl font-bold text-primary">
            R$ {otcPrice.toFixed(3)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>Cotação válida</span>
          </div>
          <span>
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;
