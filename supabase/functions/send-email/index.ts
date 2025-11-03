import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: string;
  to: string;
  data: Record<string, any>;
  internal?: boolean;
}

const emailTemplates: Record<string, (data: Record<string, any>) => { subject: string; html: string }> = {
  'welcome': (data) => ({
    subject: 'Bem-vindo à TKB Asset! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #000; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #00D4FF; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; color: #000; margin-bottom: 20px; font-weight: bold; }
            .text { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00D4FF, #0096FF); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; font-size: 14px; }
            .divider { height: 1px; background: #eee; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TKB ASSET</div>
            </div>
            <div class="content">
              <div class="title">Olá, ${data.nome_cliente}! 👋</div>
              <p class="text">
                É um prazer tê-lo(a) conosco! Sua conta foi criada com sucesso e você está a poucos passos de começar a operar.
              </p>
              <p class="text">
                <strong>Próximo passo:</strong> Complete seu cadastro enviando os documentos necessários para aprovação da conta.
              </p>
              <a href="${data.link_kyc}" class="button">📄 Enviar Documentos KYC</a>
              <div class="divider"></div>
              <p class="text" style="font-size: 14px; color: #666;">
                <strong>O que você precisa enviar:</strong><br>
                • Documento de identidade (RG ou CNH)<br>
                • Comprovante de residência<br>
                • Dossier KYC preenchido<br>
                • Contrato quadro assinado
              </p>
              <p class="text" style="font-size: 14px; color: #666;">
                Após a análise dos documentos, você receberá um email de confirmação e poderá começar a operar!
              </p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p><strong>TKB Asset</strong> - Sua parceira em trading OTC</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  'documents-received': (data) => ({
    subject: '✅ Documentos Recebidos - Em Análise',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #000; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #00D4FF; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; color: #000; margin-bottom: 20px; font-weight: bold; }
            .text { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
            .success-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00D4FF, #0096FF); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TKB ASSET</div>
            </div>
            <div class="content">
              <div class="title">Documentos Recebidos! ✅</div>
              <p class="text">Olá, ${data.nome_cliente}!</p>
              <div class="success-box">
                <strong>✓ Seus documentos foram recebidos com sucesso!</strong><br>
                Nossa equipe já iniciou a análise.
              </div>
              <p class="text">
                <strong>O que acontece agora:</strong><br>
                • Análise detalhada dos documentos enviados<br>
                • Verificação de conformidade e segurança<br>
                • Aprovação da conta (geralmente em até 24h)
              </p>
              <p class="text">
                Você receberá um email assim que sua conta for aprovada. Em caso de necessidade de ajustes, entraremos em contato.
              </p>
              <a href="${data.link_plataforma}" class="button">🔗 Acessar Plataforma</a>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p><strong>TKB Asset</strong> - Sua parceira em trading OTC</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  'account-approved': (data) => ({
    subject: '🎉 Conta Aprovada - Comece a Operar Agora!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #000; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #00D4FF; }
            .content { padding: 40px 30px; }
            .title { font-size: 28px; color: #000; margin-bottom: 20px; font-weight: bold; text-align: center; }
            .text { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
            .success-banner { background: linear-gradient(135deg, #00D4FF, #0096FF); color: white; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; }
            .success-banner h2 { margin: 0 0 10px 0; font-size: 32px; }
            .button { display: inline-block; background: #000; color: #00D4FF; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TKB ASSET</div>
            </div>
            <div class="content">
              <div class="title">Parabéns, ${data.nome_cliente}! 🎉</div>
              <div class="success-banner">
                <h2>✓ Conta Aprovada!</h2>
                <p style="margin: 0; font-size: 18px;">Você já pode começar a operar</p>
              </div>
              <p class="text">
                Sua documentação foi analisada e aprovada com sucesso! Agora você tem acesso completo à nossa plataforma de trading OTC.
              </p>
              <p class="text">
                <strong>Você já pode:</strong><br>
                • Consultar cotações em tempo real<br>
                • Criar ordens de compra de USDT<br>
                • Realizar operações com preços travados<br>
                • Acompanhar suas transações
              </p>
              <a href="${data.link_plataforma}" class="button">🚀 Começar a Operar</a>
              <p class="text" style="margin-top: 30px; font-size: 14px; color: #666;">
                Qualquer dúvida, nossa equipe está à disposição para ajudar!
              </p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p><strong>TKB Asset</strong> - Sua parceira em trading OTC</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  'order-created': (data) => ({
    subject: `💰 Ordem ${data.ordem_id} Criada - Dados para Pagamento`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #000; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #00D4FF; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; color: #000; margin-bottom: 20px; font-weight: bold; }
            .text { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
            .info-box { background: #f9f9f9; border: 2px solid #00D4FF; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; font-weight: bold; }
            .info-value { color: #000; font-weight: bold; }
            .warning-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00D4FF, #0096FF); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; font-size: 14px; }
            .timer { background: #ff5722; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TKB ASSET</div>
            </div>
            <div class="content">
              <div class="title">Ordem Criada com Sucesso! 💰</div>
              <p class="text">Olá, ${data.nome_cliente}!</p>
              <p class="text">
                Sua ordem foi criada e o preço está travado! Realize o pagamento dentro do prazo para garantir a cotação.
              </p>
              
              <div class="timer">
                ⏰ Preço válido por ${data.tempo_validade} minutos
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #00D4FF;">📋 Detalhes da Ordem</h3>
                <div class="info-row">
                  <span class="info-label">Ordem ID:</span>
                  <span class="info-value">${data.ordem_id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Quantidade USDT:</span>
                  <span class="info-value">${data.quantidade_usdt}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cotação Travada:</span>
                  <span class="info-value">R$ ${data.cotacao}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Valor Total:</span>
                  <span class="info-value" style="color: #00D4FF; font-size: 20px;">R$ ${data.valor_brl}</span>
                </div>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #00D4FF;">🏦 Dados para Pagamento PIX</h3>
                <div class="info-row">
                  <span class="info-label">Banco:</span>
                  <span class="info-value">${data.banco}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Titular:</span>
                  <span class="info-value">${data.titular_conta}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CNPJ:</span>
                  <span class="info-value">${data.cnpj_conta}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Chave PIX (CNPJ):</span>
                  <span class="info-value" style="color: #00D4FF;">${data.pix_cnpj}</span>
                </div>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ IMPORTANTE:</strong><br>
                • O valor deve ser EXATAMENTE R$ ${data.valor_brl}<br>
                • Use seu CPF/CNPJ cadastrado para fazer o PIX<br>
                • Após o pagamento, envie o comprovante imediatamente<br>
                • Se o prazo expirar, você precisará criar uma nova ordem
              </div>
              
              <a href="${data.link_enviar_comprovante}" class="button">📤 Enviar Comprovante</a>
              
              <p class="text" style="font-size: 14px; color: #666; margin-top: 30px;">
                <strong>Rede de Recebimento:</strong> ${data.rede}<br>
                Após a confirmação do pagamento, o USDT será enviado para sua carteira.
              </p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p><strong>TKB Asset</strong> - Sua parceira em trading OTC</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  'payment-confirmed': (data) => ({
    subject: '✅ Pagamento Confirmado - USDT em Processamento',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #000; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #00D4FF; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; color: #000; margin-bottom: 20px; font-weight: bold; }
            .text { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
            .success-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .info-box { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TKB ASSET</div>
            </div>
            <div class="content">
              <div class="title">Pagamento Confirmado! ✅</div>
              <p class="text">Olá, ${data.nome_cliente}!</p>
              <div class="success-box">
                <strong>✓ Seu pagamento de R$ ${data.valor_brl} foi confirmado!</strong><br>
                Já estamos processando o envio do USDT.
              </div>
              <p class="text">
                <strong>Próximos passos:</strong><br>
                • Nossa equipe está preparando a transação<br>
                • O USDT será enviado para sua carteira em breve<br>
                • Você receberá outro email com o hash da transação
              </p>
              <div class="info-box">
                <strong>📦 Detalhes do Envio:</strong><br>
                Quantidade: <strong>${data.quantidade_usdt} USDT</strong><br>
                Carteira Destino: <strong>${data.carteira_destino}</strong>
              </div>
              <p class="text" style="font-size: 14px; color: #666;">
                O tempo de processamento é geralmente de 5 a 15 minutos. Você pode acompanhar o status na plataforma.
              </p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p><strong>TKB Asset</strong> - Sua parceira em trading OTC</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  'usdt-sent': (data) => ({
    subject: '🚀 USDT Enviado - Transação Concluída!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #000; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #00D4FF; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; color: #000; margin-bottom: 20px; font-weight: bold; }
            .text { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
            .success-banner { background: linear-gradient(135deg, #4caf50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; }
            .info-box { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #00D4FF; }
            .hash-box { background: #000; color: #00D4FF; padding: 15px; margin: 20px 0; border-radius: 8px; font-family: monospace; word-break: break-all; font-size: 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00D4FF, #0096FF); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TKB ASSET</div>
            </div>
            <div class="content">
              <div class="success-banner">
                <h2 style="margin: 0 0 10px 0; font-size: 32px;">🎉 Transação Concluída!</h2>
                <p style="margin: 0; font-size: 18px;">Seu USDT foi enviado com sucesso</p>
              </div>
              
              <p class="text">Olá, ${data.nome_cliente}!</p>
              <p class="text">
                Ótimas notícias! Sua transação foi processada e o USDT já está a caminho da sua carteira.
              </p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #00D4FF;">📋 Resumo da Transação</h3>
                <p style="margin: 5px 0;"><strong>Ordem ID:</strong> ${data.ordem_id}</p>
                <p style="margin: 5px 0;"><strong>Quantidade Enviada:</strong> ${data.quantidade_usdt} USDT</p>
                <p style="margin: 5px 0;"><strong>Rede:</strong> ${data.rede}</p>
                <p style="margin: 5px 0;"><strong>Valor Pago:</strong> R$ ${data.valor_brl}</p>
                <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${data.data_hora}</p>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #00D4FF;">🔗 Hash da Transação</h3>
                <p style="margin-bottom: 10px;">Você pode verificar sua transação na blockchain:</p>
                <div class="hash-box">${data.transaction_hash}</div>
                <a href="${data.link_explorer}" class="button" target="_blank">🔍 Ver na Blockchain</a>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #00D4FF;">📱 Carteira Destino</h3>
                <p style="font-family: monospace; word-break: break-all; font-size: 14px; background: #fff; padding: 10px; border-radius: 4px;">
                  ${data.carteira_destino}
                </p>
              </div>
              
              <p class="text">
                <strong>⏱️ Tempo de confirmação:</strong><br>
                • TRC20 (Tron): ~1-3 minutos<br>
                • ERC20 (Ethereum): ~5-15 minutos<br>
                • BEP20 (BSC): ~1-3 minutos
              </p>
              
              <p class="text" style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                💡 <strong>Dica:</strong> Verifique sua carteira em alguns minutos. Se tiver dúvidas, entre em contato conosco via WhatsApp: ${data.whatsapp}
              </p>
              
              <a href="${data.link_plataforma}" class="button">🔄 Realizar Nova Operação</a>
              
              <p class="text" style="text-align: center; font-size: 18px; margin-top: 40px;">
                <strong>Obrigado por confiar na TKB Asset! 🚀</strong>
              </p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p><strong>TKB Asset</strong> - Sua parceira em trading OTC</p>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

const internalNotifications: Record<string, (data: Record<string, any>) => { subject: string; html: string }> = {
  'new-signup': (data) => ({
    subject: '🔔 [TKB] Novo Cadastro + Documentos Enviados',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #00D4FF; }
            .header { background: #000; padding: 20px; text-align: center; color: #00D4FF; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; }
            .info-box { background: #f0f9ff; padding: 20px; margin: 15px 0; border-radius: 8px; border: 2px solid #00D4FF; }
            .button { display: inline-block; background: #00D4FF; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">TKB ASSET - NOVO CADASTRO</div>
            <div class="content">
              <h2 style="color: #00D4FF; margin-top: 0;">📋 Novo Cliente Cadastrado</h2>
              <div class="info-box">
                <p style="margin: 5px 0;"><strong>Nome:</strong> ${data.nome_cliente}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email_cliente}</p>
                <p style="margin: 5px 0;"><strong>Documento:</strong> ${data.documento}</p>
                <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${data.data_hora_cadastro}</p>
              </div>
              <p style="font-size: 16px;">
                <strong>✓ Documentos já foram enviados!</strong><br>
                O cliente completou o cadastro e enviou os documentos para análise.
              </p>
              <a href="${data.link_admin_kyc}" class="button">👉 Analisar Documentos</a>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  'receipt-uploaded': (data) => ({
    subject: '🚨🚨🚨 [TKB] COMPROVANTE ENVIADO - AÇÃO IMEDIATA! 🚨🚨🚨',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #ffebee; }
            .container { max-width: 600px; margin: 20px auto; background: white; border: 4px solid #f44336; box-shadow: 0 0 30px rgba(244, 67, 54, 0.5); }
            .header { background: #f44336; padding: 30px; text-align: center; color: white; animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
            .title { font-size: 32px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 18px; margin: 10px 0 0 0; }
            .content { padding: 30px; }
            .urgent-box { background: #fff3cd; border: 3px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .info-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border: 2px solid #00D4FF; }
            .timer { background: #f44336; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #f44336; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4); }
            .button:hover { background: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">🚨 ALERTA DE COMPROVANTE 🚨</div>
              <div class="subtitle">REQUER AÇÃO IMEDIATA!</div>
            </div>
            <div class="content">
              <div class="timer">
                ⏰ VOCÊ TEM 5 MINUTOS PARA ANALISAR
              </div>
              
              <div class="urgent-box">
                <h2 style="color: #ff9800; margin-top: 0;">⚡ COMPROVANTE DE PAGAMENTO ENVIADO</h2>
                <p style="font-size: 16px; margin: 10px 0;">
                  <strong>${data.nome_cliente}</strong> enviou o comprovante de pagamento às <strong>${data.hora_envio_comprovante}</strong>
                </p>
              </div>
              
              <div class="info-box">
                <h3 style="color: #00D4FF; margin-top: 0;">📋 Detalhes da Ordem</h3>
                <p style="margin: 5px 0;"><strong>Ordem ID:</strong> <span style="color: #f44336; font-size: 18px;">${data.ordem_id}</span></p>
                <p style="margin: 5px 0;"><strong>Cliente:</strong> ${data.nome_cliente}</p>
                <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${data.valor_brl}</p>
                <p style="margin: 5px 0;"><strong>Quantidade:</strong> ${data.quantidade_usdt} USDT</p>
                <p style="margin: 5px 0;"><strong>Rede:</strong> ${data.rede}</p>
              </div>
              
              <div class="info-box">
                <h3 style="color: #00D4FF; margin-top: 0;">📱 Carteira de Destino</h3>
                <p style="font-family: monospace; background: #fff; padding: 10px; border-radius: 4px; word-break: break-all;">
                  ${data.carteira_destino}
                </p>
              </div>
              
              <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
                <h3 style="color: #f44336; margin-top: 0;">🔥 AÇÃO NECESSÁRIA:</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Verificar o comprovante de pagamento</li>
                  <li>Confirmar recebimento no banco</li>
                  <li>Aprovar ou rejeitar o pagamento</li>
                  <li>Enviar USDT se aprovado</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.link_comprovante}" class="button" target="_blank" style="display: inline-block; margin: 10px;">📄 VER COMPROVANTE</a>
                <a href="${data.link_admin_ordem}" class="button" target="_blank" style="display: inline-block; margin: 10px;">⚡ ANALISAR ORDEM</a>
              </div>
              
              <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>💡 Lembre-se:</strong> O cliente está aguardando! Tempo é essencial para manter a confiança e satisfação.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data, internal = false }: EmailRequest = await req.json();
    
    console.log(`[send-email] Processing ${internal ? 'internal' : 'client'} email: ${type} to ${to}`);
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const templateFunction = internal ? internalNotifications[type] : emailTemplates[type];
    
    if (!templateFunction) {
      throw new Error(`Template not found: ${type} (internal: ${internal})`);
    }
    
    const template = templateFunction(data);
    
    const emailPayload = {
      from: internal ? 'TKB Alert <gestao@tkbasset.com>' : 'TKB Asset <gestao@tkbasset.com>',
      to: [to],
      subject: template.subject,
      html: template.html
    };
    
    console.log(`[send-email] Sending email with subject: "${template.subject}"`);
    
    const { data: emailData, error } = await resend.emails.send(emailPayload);
    
    if (error) {
      console.error('[send-email] Resend error:', error);
      throw error;
    }
    
    console.log('[send-email] Email sent successfully:', emailData);
    
    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[send-email] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
