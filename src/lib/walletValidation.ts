/**
 * Wallet address validation utilities for different blockchain networks
 */

export type NetworkType = "TRC20" | "ERC20" | "BEP20" | "POLYGON";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a TRC20 (Tron) wallet address
 * - Must start with 'T'
 * - Must be exactly 34 characters
 * - Must contain only alphanumeric characters
 */
const validateTRC20 = (address: string): ValidationResult => {
  if (!address.startsWith('T')) {
    return { isValid: false, error: 'Endereço TRC20 deve começar com "T"' };
  }
  
  if (address.length !== 34) {
    return { isValid: false, error: 'Endereço TRC20 deve ter 34 caracteres' };
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(address)) {
    return { isValid: false, error: 'Endereço TRC20 contém caracteres inválidos' };
  }
  
  return { isValid: true };
};

/**
 * Validates EVM-compatible wallet addresses (ERC20, BEP20, Polygon)
 * - Must start with '0x'
 * - Must be exactly 42 characters (40 hex chars + 0x prefix)
 * - Must contain only valid hexadecimal characters
 */
const validateEVMAddress = (address: string, network: string): ValidationResult => {
  if (!address.startsWith('0x')) {
    return { isValid: false, error: `Endereço ${network} deve começar com "0x"` };
  }
  
  if (address.length !== 42) {
    return { isValid: false, error: `Endereço ${network} deve ter 42 caracteres` };
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: `Endereço ${network} contém caracteres inválidos` };
  }
  
  return { isValid: true };
};

/**
 * Main validation function that routes to the appropriate validator
 * based on the network type
 */
export const validateWalletAddress = (
  address: string,
  network: NetworkType
): ValidationResult => {
  // Trim whitespace
  const trimmedAddress = address.trim();
  
  if (!trimmedAddress) {
    return { isValid: false, error: 'Endereço da carteira é obrigatório' };
  }
  
  switch (network) {
    case "TRC20":
      return validateTRC20(trimmedAddress);
    
    case "ERC20":
      return validateEVMAddress(trimmedAddress, "ERC20");
    
    case "BEP20":
      return validateEVMAddress(trimmedAddress, "BEP20");
    
    case "POLYGON":
      return validateEVMAddress(trimmedAddress, "Polygon");
    
    default:
      return { isValid: false, error: 'Rede blockchain não suportada' };
  }
};

/**
 * Formats a wallet address for display (shows first 6 and last 4 chars)
 */
export const formatWalletAddress = (address: string): string => {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
