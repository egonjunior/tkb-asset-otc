export interface OfflineClient {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OfflineTransaction {
  id: string;
  client_id: string;
  transaction_date: string;
  usdt_amount: number;
  brl_amount: number;
  usdt_rate: number;
  operation_type: string;
  notes?: string;
  created_at: string;
}

export interface OfflineDocument {
  id: string;
  client_id: string;
  document_name: string;
  file_url: string;
  document_type?: string;
  uploaded_at: string;
}
