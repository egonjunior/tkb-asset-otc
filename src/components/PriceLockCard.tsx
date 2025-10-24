import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceLockCardProps {
  currentPrice: number | null;
  tkbPrice: number | null;
  onPriceLocked: (lockedPrice: number) => void;
  onPriceExpired: () => void;
}

const LOCK_DURATION = 120; // 2 minutes in seconds

const PriceLockCard = ({ currentPrice, tkbPrice, onPriceLocked, onPriceExpired }: PriceLockCardProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(LOCK_DURATION);

  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setLockedPrice(null);
          onPriceExpired();
          return LOCK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, onPriceExpired]);

  const handleLockPrice = () => {
    if (tkbPrice) {
      setIsLocked(true);
      setLockedPrice(tkbPrice);
      setTimeRemaining(LOCK_DURATION);
      onPriceLocked(tkbPrice);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setLockedPrice(null);
    setTimeRemaining(LOCK_DURATION);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentPrice || !tkbPrice) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            Aguardando cotação...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isLocked ? "border-primary bg-primary/5" : "bg-card"}>
      <CardContent className="py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <>
                <Lock className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Preço Travado</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Preço Atual</span>
              </>
            )}
          </div>
          {isLocked && (
            <Badge variant="default" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Cotação Base:</p>
            <span className="font-medium">R$ {currentPrice.toFixed(3)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Spread TKB Asset (+1%):</span>
            <span className="font-semibold text-primary text-lg">
              R$ {(isLocked && lockedPrice ? lockedPrice : tkbPrice).toFixed(3)}
            </span>
          </div>
        </div>

        {isLocked ? (
          <div className="space-y-2">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground mb-1">Preço garantido por</p>
              <p className="text-2xl font-bold text-primary">{formatTime(timeRemaining)}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUnlock}
            >
              Cancelar Trava
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={handleLockPrice}
          >
            <Lock className="h-4 w-4 mr-2" />
            Travar Preço
          </Button>
        )}

        {isLocked && (
          <p className="text-xs text-center text-muted-foreground">
            O preço ficará garantido até o tempo expirar ou você confirmar a ordem
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceLockCard;
