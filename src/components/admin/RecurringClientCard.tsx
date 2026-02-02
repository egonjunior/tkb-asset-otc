import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Wallet, FileSpreadsheet, Edit2, Trash2 } from "lucide-react";

interface ClientWallet {
  id?: string;
  wallet_address: string;
  network: string;
  label: string;
}

interface RecurringClient {
  id: string;
  name: string;
  notes: string | null;
  wallets: ClientWallet[];
}

interface RecurringClientCardProps {
  client: RecurringClient;
  onViewReport: (client: RecurringClient) => void;
  onEdit: (client: RecurringClient) => void;
  onDelete: (client: RecurringClient) => void;
}

export const RecurringClientCard = ({
  client,
  onViewReport,
  onEdit,
  onDelete,
}: RecurringClientCardProps) => {
  const walletCount = client.wallets?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate" title={client.name}>
                {client.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Wallet className="h-3.5 w-3.5" />
                <span>
                  {walletCount} {walletCount === 1 ? "carteira" : "carteiras"}
                </span>
              </div>
              
              {/* Network badges */}
              {walletCount > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {client.wallets.map((w, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {w.network}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(client)}
              title="Editar cliente"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(client)}
              title="Excluir cliente"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
            {client.notes}
          </p>
        )}

        {/* View Report Button */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => onViewReport(client)}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Ver Relatório
        </Button>
      </CardContent>
    </Card>
  );
};
