/**
 * Funções de formatação para padrão brasileiro
 */

// Formatar número brasileiro: 1.214.999,91
export const formatBRL = (value: number): string => 
  value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

// Formatar com símbolo: R$ 1.214.999,91
export const formatCurrency = (value: number): string => 
  `R$ ${formatBRL(value)}`;

// Formatar USDT: 1.214.999,91
export const formatUSDT = (value: number): string => 
  formatBRL(value);

// Formatar cotação: 5,4195
export const formatRate = (value: number): string => 
  value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 4, 
    maximumFractionDigits: 4 
  });

// Formatar data brasileira
export const formatDate = (date: string | Date): string => 
  new Date(date).toLocaleDateString('pt-BR');

// Formatar data e hora brasileira
export const formatDateTime = (date: string | Date): string => 
  new Date(date).toLocaleString('pt-BR');
