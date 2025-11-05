import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface LeadStatusBadgeProps {
  status: string;
  leadId: string;
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  isAdmin?: boolean;
}

export const LeadStatusBadge = ({ status, leadId, onStatusChange, isAdmin = true }: LeadStatusBadgeProps) => {
  const [isChanging, setIsChanging] = useState(false);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'novo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'contatado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'qualificado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'convertido':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo':
        return '🆕 Novo';
      case 'contatado':
        return '📞 Contatado';
      case 'qualificado':
        return '✅ Qualificado';
      case 'convertido':
        return '🏆 Convertido';
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsChanging(true);
    try {
      await onStatusChange(leadId, newStatus);
    } finally {
      setIsChanging(false);
    }
  };

  if (!isAdmin) {
    return (
      <Badge className={`${getStatusStyles(status)} border`}>
        {getStatusLabel(status)}
      </Badge>
    );
  }

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={isChanging}>
      <SelectTrigger className={`w-[160px] h-8 ${getStatusStyles(status)} border`}>
        <SelectValue>{getStatusLabel(status)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="novo">🆕 Novo</SelectItem>
        <SelectItem value="contatado">📞 Contatado</SelectItem>
        <SelectItem value="qualificado">✅ Qualificado</SelectItem>
        <SelectItem value="convertido">🏆 Convertido</SelectItem>
      </SelectContent>
    </Select>
  );
};
