import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, CheckCircle, Trophy } from "lucide-react";

interface Lead {
  status: string;
}

interface LeadsStatsProps {
  leads: Lead[];
}

export const LeadsStats = ({ leads }: LeadsStatsProps) => {
  const stats = {
    novos: leads.filter(l => l.status === 'novo').length,
    contatados: leads.filter(l => l.status === 'contatado').length,
    qualificados: leads.filter(l => l.status === 'qualificado').length,
    convertidos: leads.filter(l => l.status === 'convertido').length,
  };

  const total = leads.length;
  const taxaConversao = total > 0 ? ((stats.convertidos / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium mb-1">Novos</p>
              <p className="text-3xl font-bold text-yellow-700">{stats.novos}</p>
            </div>
            <Users className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium mb-1">Contatados</p>
              <p className="text-3xl font-bold text-blue-700">{stats.contatados}</p>
            </div>
            <Phone className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">Qualificados</p>
              <p className="text-3xl font-bold text-green-700">{stats.qualificados}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium mb-1">Convertidos</p>
              <p className="text-3xl font-bold text-purple-700">{stats.convertidos}</p>
            </div>
            <Trophy className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium mb-1">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-purple-700">{taxaConversao}%</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
