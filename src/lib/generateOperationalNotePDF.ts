import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientData {
  full_name: string;
  document_type: string;
  document_number: string;
  email?: string;
}

interface BrazilianBankDetails {
  type: "brazilian";
  bank_name: string;
  agency: string;
  account: string;
  account_type: string;
  holder_name: string;
  holder_document: string;
}

interface InternationalBankDetails {
  type: "international";
  bank_name: string;
  bank_address: string;
  swift_code: string;
  account_number: string;
  routing_number: string;
  beneficiary_name: string;
  beneficiary_address: string;
}

type BankDetails = BrazilianBankDetails | InternationalBankDetails | null;

interface OperationalNoteData {
  note_number: string;
  operation_type: string;
  deposited_amount: number;
  purchased_amount: number;
  currency_deposited: string;
  currency_purchased: string;
  operation_date: string;
  bank_details: BankDetails;
  verification_code: string;
  reviewed_at: string;
  reviewer_name?: string;
}

const OPERATION_LABELS: Record<string, string> = {
  brl_to_usdt: "BRL → USDT",
  usdt_to_brl: "USDT → BRL",
  usdt_to_usd_remessa: "USDT → USD (Remessa Internacional)",
};

const formatCurrency = (value: number, currency: string): string => {
  if (currency === "BRL") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

export function generateOperationalNotePDF(
  clientData: ClientData,
  noteData: OperationalNoteData
): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Colors
  const primaryColor = { r: 0, g: 188, b: 212 }; // TKB Cyan
  const darkGray = { r: 38, g: 50, b: 56 };
  const lightGray = { r: 120, g: 120, b: 120 };
  const goldColor = { r: 212, g: 175, b: 55 };

  // Header background
  doc.setFillColor(darkGray.r, darkGray.g, darkGray.b);
  doc.rect(0, 0, pageWidth, 45, "F");

  // TKB ASSET Logo/Text
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("TKB ASSET", margin, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Mesa OTC", margin, 30);

  // Note number on the right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA OPERACIONAL", pageWidth - margin, 18, { align: "right" });
  doc.setFontSize(14);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(noteData.note_number, pageWidth - margin, 28, { align: "right" });

  y = 60;

  // Decorative line
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Client Section
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, "F");
  
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin + 5, y + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text(`Nome: ${clientData.full_name}`, margin + 5, y + 17);
  doc.text(`${clientData.document_type}: ${clientData.document_number}`, margin + 5, y + 24);
  if (clientData.email) {
    doc.text(`Email: ${clientData.email}`, margin + 5, y + 31);
  }

  y += 45;

  // Operation Details Section
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 55, 3, 3, "F");
  
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DETALHES DA OPERAÇÃO", margin + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  
  const operationLabel = OPERATION_LABELS[noteData.operation_type] || noteData.operation_type;
  doc.text(`Tipo: ${operationLabel}`, margin + 5, y + 18);
  
  const formattedDate = format(new Date(noteData.operation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Data da Operação: ${formattedDate}`, margin + 5, y + 26);

  // Values in boxes
  const boxWidth = (pageWidth - 2 * margin - 20) / 2;
  const boxY = y + 32;
  
  // Deposited box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 5, boxY, boxWidth, 18, 2, 2, "F");
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.setFontSize(8);
  doc.text("DEPOSITOU", margin + 10, boxY + 6);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(noteData.deposited_amount, noteData.currency_deposited), margin + 10, boxY + 13);

  // Purchased box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 15 + boxWidth, boxY, boxWidth, 18, 2, 2, "F");
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ADQUIRIU", margin + 20 + boxWidth, boxY + 6);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(noteData.purchased_amount, noteData.currency_purchased), margin + 20 + boxWidth, boxY + 13);

  y += 65;

  // Bank Details Section (if applicable)
  if (noteData.bank_details) {
    doc.setFillColor(245, 245, 245);
    
    if (noteData.bank_details.type === "brazilian") {
      const details = noteData.bank_details as BrazilianBankDetails;
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 3, 3, "F");
      
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DA CONTA RECEBEDORA", margin + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text(`Banco: ${details.bank_name}`, margin + 5, y + 18);
      doc.text(`Agência: ${details.agency} | Conta: ${details.account} (${details.account_type === "corrente" ? "Corrente" : "Poupança"})`, margin + 5, y + 26);
      doc.text(`Titular: ${details.holder_name} (${details.holder_document})`, margin + 5, y + 34);
      
      y += 50;
    } else if (noteData.bank_details.type === "international") {
      const details = noteData.bank_details as InternationalBankDetails;
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 55, 3, 3, "F");
      
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DA CONTA INTERNACIONAL", margin + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text(`Bank: ${details.bank_name}`, margin + 5, y + 18);
      doc.text(`Address: ${details.bank_address}`, margin + 5, y + 26);
      doc.text(`SWIFT/BIC: ${details.swift_code} | Account: ${details.account_number}`, margin + 5, y + 34);
      doc.text(`Routing: ${details.routing_number}`, margin + 5, y + 42);
      doc.text(`Beneficiary: ${details.beneficiary_name}`, margin + 5, y + 50);
      
      y += 65;
    }
  }

  // Verification Seal
  y += 10;
  const sealWidth = 120;
  const sealHeight = 45;
  const sealX = (pageWidth - sealWidth) / 2;
  
  // Seal border with gold color
  doc.setDrawColor(goldColor.r, goldColor.g, goldColor.b);
  doc.setLineWidth(1.5);
  doc.roundedRect(sealX, y, sealWidth, sealHeight, 4, 4, "S");
  
  // Inner border
  doc.setLineWidth(0.5);
  doc.roundedRect(sealX + 3, y + 3, sealWidth - 6, sealHeight - 6, 3, 3, "S");

  // Checkmark icon (drawn manually)
  const checkX = sealX + 15;
  const checkY = y + sealHeight / 2;
  doc.setFillColor(39, 174, 96); // Green
  doc.circle(checkX, checkY, 8, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  doc.line(checkX - 4, checkY, checkX - 1, checkY + 3);
  doc.line(checkX - 1, checkY + 3, checkX + 4, checkY - 3);

  // Seal text
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OPERAÇÃO VERIFICADA", sealX + sealWidth / 2 + 5, y + 14, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  
  const reviewedAt = format(new Date(noteData.reviewed_at), "dd/MM/yyyy 'às' HH:mm");
  doc.text(`Aprovado por: ${noteData.reviewer_name || "Admin TKB"}`, sealX + sealWidth / 2 + 5, y + 24, { align: "center" });
  doc.text(`Data: ${reviewedAt}`, sealX + sealWidth / 2 + 5, y + 32, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(goldColor.r, goldColor.g, goldColor.b);
  doc.text(`Código: ${noteData.verification_code}`, sealX + sealWidth / 2 + 5, y + 40, { align: "center" });

  // Footer
  const footerY = pageHeight - 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TKB Asset © 2026 | CNPJ: XX.XXX.XXX/0001-XX", margin, footerY);
  
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss");
  doc.text(`Documento gerado em: ${generatedAt}`, pageWidth - margin, footerY, { align: "right" });

  return doc.output("blob");
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "TKB-VRF-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
