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
  brl_to_usdt: "Conversao de Real (BRL) para Tether (USDT)",
  usdt_to_brl: "Conversao de Tether (USDT) para Real (BRL)",
  usdt_to_usd_remessa: "Conversao de Tether (USDT) para Dolar Americano (USD) - Remessa Internacional",
};

const formatCurrency = (value: number, currency: string): string => {
  if (currency === "BRL") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "USD") {
    return `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

// Helper to draw a section with accent
const drawSection = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  primaryColor: { r: number; g: number; b: number },
  darkGray: { r: number; g: number; b: number }
): number => {
  // Background
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(x, y, width, height, 2, 2, "F");
  
  // Left accent bar
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(x, y, 3, height, "F");
  
  // Title
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title, x + 8, y + 7);
  
  return y + 12;
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
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;
  let y = 0;

  // Colors
  const primaryColor = { r: 0, g: 188, b: 212 }; // TKB Cyan
  const darkGray = { r: 38, g: 50, b: 56 };
  const mediumGray = { r: 100, g: 100, b: 100 };
  const lightGray = { r: 130, g: 130, b: 130 };
  const goldColor = { r: 180, g: 150, b: 50 };

  // ===== HEADER =====
  // Header background
  doc.setFillColor(darkGray.r, darkGray.g, darkGray.b);
  doc.rect(0, 0, pageWidth, 42, "F");
  
  // Primary color accent bar at top
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, pageWidth, 3, "F");

  // TKB ASSET MANAGER
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TKB ASSET MANAGER", margin, 18);

  // Mesa OTC Cambial
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text("Mesa OTC Cambial", margin, 26);

  // Email
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text("gestao@tkbasset.com", margin, 34);

  // Right side - Note info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA OPERACIONAL", pageWidth - margin, 14, { align: "right" });
  
  doc.setFontSize(12);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(noteData.note_number, pageWidth - margin, 23, { align: "right" });

  // Date
  const operationDate = format(new Date(noteData.operation_date), "dd/MM/yyyy", { locale: ptBR });
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${operationDate}`, pageWidth - margin, 32, { align: "right" });

  y = 52;

  // ===== INSTITUTIONAL TEXT =====
  doc.setTextColor(mediumGray.r, mediumGray.g, mediumGray.b);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const institutionalText = "Este documento atesta a operacao de cambio realizada atraves da TKB Asset Manager Cambial Ltda., conforme dados especificados abaixo. A presente nota serve como comprovante para fins de registro.";
  const splitInstitutional = doc.splitTextToSize(institutionalText, contentWidth);
  doc.text(splitInstitutional, margin, y);
  y += splitInstitutional.length * 4.5 + 8;

  // Decorative line
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ===== CLIENT SECTION =====
  const clientSectionHeight = clientData.email ? 28 : 22;
  const clientContentY = drawSection(doc, margin, y, contentWidth, clientSectionHeight, "IDENTIFICACAO DO CLIENTE", primaryColor, darkGray);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("Nome Completo:", margin + 8, clientContentY + 3);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text(clientData.full_name, margin + 38, clientContentY + 3);
  
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text(`Documento (${clientData.document_type}):`, margin + 8, clientContentY + 9);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text(clientData.document_number, margin + 50, clientContentY + 9);

  if (clientData.email) {
    doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
    doc.text("E-mail:", margin + 8, clientContentY + 15);
    doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
    doc.text(clientData.email, margin + 25, clientContentY + 15);
  }

  y += clientSectionHeight + 8;

  // ===== OPERATION SECTION =====
  const operationSectionHeight = 52;
  const operationContentY = drawSection(doc, margin, y, contentWidth, operationSectionHeight, "DETALHES DA OPERACAO", primaryColor, darkGray);

  // Modality
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("Modalidade:", margin + 8, operationContentY + 3);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  const operationLabel = OPERATION_LABELS[noteData.operation_type] || noteData.operation_type;
  const splitModality = doc.splitTextToSize(operationLabel, contentWidth - 40);
  doc.text(splitModality, margin + 32, operationContentY + 3);

  // Execution date
  const formattedDate = format(new Date(noteData.operation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text("Data de Execucao:", margin + 8, operationContentY + 12);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text(formattedDate, margin + 43, operationContentY + 12);

  // Value boxes
  const boxWidth = (contentWidth - 30) / 2;
  const boxY = operationContentY + 18;
  
  // Deposited box (VALOR ENTREGUE)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 8, boxY, boxWidth, 20, 2, 2, "F");
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 8, boxY, boxWidth, 20, 2, 2, "S");
  
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.setFontSize(8);
  doc.text("VALOR ENTREGUE", margin + 12, boxY + 6);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(noteData.deposited_amount, noteData.currency_deposited), margin + 12, boxY + 14);

  // Purchased box (VALOR RECEBIDO)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 18 + boxWidth, boxY, boxWidth, 20, 2, 2, "F");
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 18 + boxWidth, boxY, boxWidth, 20, 2, 2, "S");
  
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR RECEBIDO", margin + 22 + boxWidth, boxY + 6);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(noteData.purchased_amount, noteData.currency_purchased), margin + 22 + boxWidth, boxY + 14);

  y += operationSectionHeight + 8;

  // ===== BANK DETAILS SECTION =====
  if (noteData.bank_details) {
    if (noteData.bank_details.type === "brazilian") {
      const details = noteData.bank_details as BrazilianBankDetails;
      const bankSectionHeight = 34;
      const bankContentY = drawSection(doc, margin, y, contentWidth, bankSectionHeight, "DADOS DA CONTA RECEBEDORA (NACIONAL)", primaryColor, darkGray);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Instituicao Financeira:", margin + 8, bankContentY + 3);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.bank_name, margin + 50, bankContentY + 3);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Agencia:", margin + 8, bankContentY + 9);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.agency, margin + 25, bankContentY + 9);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Conta:", margin + 50, bankContentY + 9);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      const accountType = details.account_type === "corrente" ? "Corrente" : "Poupanca";
      doc.text(`${details.account} (${accountType})`, margin + 63, bankContentY + 9);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Titular:", margin + 8, bankContentY + 15);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(`${details.holder_name} (${details.holder_document})`, margin + 23, bankContentY + 15);
      
      y += bankSectionHeight + 8;
    } else if (noteData.bank_details.type === "international") {
      const details = noteData.bank_details as InternationalBankDetails;
      const bankSectionHeight = 46;
      const bankContentY = drawSection(doc, margin, y, contentWidth, bankSectionHeight, "DADOS DA CONTA BENEFICIARIA (INTERNACIONAL)", primaryColor, darkGray);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Instituicao Financeira:", margin + 8, bankContentY + 3);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.bank_name, margin + 50, bankContentY + 3);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Endereco:", margin + 8, bankContentY + 9);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.bank_address, margin + 28, bankContentY + 9);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("SWIFT/BIC:", margin + 8, bankContentY + 15);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.swift_code, margin + 30, bankContentY + 15);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Numero da Conta:", margin + 65, bankContentY + 15);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.account_number, margin + 100, bankContentY + 15);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Routing/Wire Number:", margin + 8, bankContentY + 21);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.routing_number, margin + 50, bankContentY + 21);
      
      doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      doc.text("Beneficiario:", margin + 8, bankContentY + 27);
      doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      doc.text(details.beneficiary_name, margin + 32, bankContentY + 27);
      
      if (details.beneficiary_address) {
        doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
        doc.text("Endereco Beneficiario:", margin + 8, bankContentY + 33);
        doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        doc.text(details.beneficiary_address, margin + 50, bankContentY + 33);
      }
      
      y += bankSectionHeight + 8;
    }
  }

  // ===== VERIFICATION SEAL =====
  y += 5;
  const sealWidth = 130;
  const sealHeight = 55;
  const sealX = (pageWidth - sealWidth) / 2;
  
  // Outer gold border
  doc.setDrawColor(goldColor.r, goldColor.g, goldColor.b);
  doc.setLineWidth(2);
  doc.roundedRect(sealX, y, sealWidth, sealHeight, 4, 4, "S");
  
  // Inner gold border
  doc.setLineWidth(0.8);
  doc.roundedRect(sealX + 4, y + 4, sealWidth - 8, sealHeight - 8, 3, 3, "S");

  // Green checkmark circle
  const checkX = sealX + 18;
  const checkY = y + 18;
  doc.setFillColor(39, 174, 96);
  doc.circle(checkX, checkY, 9, "F");
  
  // White checkmark
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(checkX - 4, checkY, checkX - 1, checkY + 3);
  doc.line(checkX - 1, checkY + 3, checkX + 5, checkY - 4);

  // Seal title
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OPERACAO VERIFICADA", sealX + sealWidth / 2 + 8, y + 15, { align: "center" });

  // Seal description
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mediumGray.r, mediumGray.g, mediumGray.b);
  doc.text("Verificado e aprovado pela Mesa de Operacoes", sealX + sealWidth / 2, y + 24, { align: "center" });
  doc.text("TKB Asset Manager Cambial", sealX + sealWidth / 2, y + 29, { align: "center" });

  // Reviewer info
  doc.setFontSize(8);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  const reviewedAt = format(new Date(noteData.reviewed_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  doc.text(`Aprovado por: ${noteData.reviewer_name || "Admin TKB"}`, sealX + sealWidth / 2, y + 38, { align: "center" });
  doc.text(`Data: ${reviewedAt}`, sealX + sealWidth / 2, y + 43, { align: "center" });

  // Verification code in gold
  doc.setFontSize(9);
  doc.setTextColor(goldColor.r, goldColor.g, goldColor.b);
  doc.setFont("helvetica", "bold");
  doc.text(`Codigo: ${noteData.verification_code}`, sealX + sealWidth / 2, y + 51, { align: "center" });

  // ===== FOOTER (Fixed at bottom) =====
  const footerY = pageHeight - 18;
  
  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  // Company info
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TKB Asset Manager Cambial Ltda. | CNPJ: 45.933.866/0001-93", pageWidth / 2, footerY - 2, { align: "center" });
  
  // Generated at
  const generatedAt = format(new Date(), "dd/MM/yyyy 'as' HH:mm:ss", { locale: ptBR });
  doc.text(`Documento gerado em: ${generatedAt}`, pageWidth / 2, footerY + 3, { align: "center" });
  
  // Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Este documento serve como comprovante de operacao para fins de registro interno.", pageWidth / 2, footerY + 8, { align: "center" });

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
