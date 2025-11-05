import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Clock, TrendingUp, DollarSign } from "lucide-react";

interface PartnerB2BStatsProps {
  partners: any[];
}

export const PartnerB2BStats = ({ partners }: PartnerB2BStatsProps) => {
  const pendingCount = partners.filter(p => p.status === 'pending').length;
  const activeCount = partners.filter(p => p.partner_b2b_config?.is_active).length;
  const totalVolume = partners.reduce((sum, p) => 
    sum + (parseFloat(p.trading_volume_monthly || 0)), 0
  );
  const avgMarkup = partners
    .filter(p => p.partner_b2b_config?.markup_percent)
    .reduce((sum, p, _, arr) => 
      sum + parseFloat(p.partner_b2b_config.markup_percent) / arr.length, 0
    ) || 0;

  const stats = [
    {
      label: "Pendentes",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Ativos",
      value: activeCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Total Parceiros",
      value: partners.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Volume Mensal",
      value: `R$ ${(totalVolume / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Markup Médio",
      value: `${avgMarkup.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
