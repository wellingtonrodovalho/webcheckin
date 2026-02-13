
import { FullFormData } from "../types";

/**
 * URL final fornecida pelo usuário. 
 * IMPORTANTE: Se você gerar uma nova URL no Google, atualize aqui.
 */
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwTwrG2ZAMrQZMec4NAkt6ChiUq9L3Oh1c-vSb1SwxKZpQCOZ-aoLfZ0xbdaVJewlUZ/exec";

// Função utilitária para formatar valores monetários em PT-BR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

// Função utilitária para formatar datas no formato d.m.aaaa solicitado
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[2])}.${parseInt(parts[1])}.${parts[0]}`;
};

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  console.log("Preparando pacote de dados para a planilha...");

  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.error("Erro: URL da planilha não configurada.");
    return false;
  }

  // Objeto flat com nomes de chaves amigáveis
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Imóvel": data.propertyDetails?.name || 'Não informado',
    "Proprietário": data.propertyDetails?.ownerName || 'Não informado',
    "Check-in": formatDate(data.reservation.startDate),
    "Check-out": formatDate(data.reservation.endDate),
    "Hóspedes": data.reservation.guestCount,
    "Valor Reserva": formatCurrency(data.reservation.totalValue),
    "Caução Exigido?": data.reservation.hasSecurityDeposit ? 'Sim' : 'Não',
    "Valor Caução": data.reservation.hasSecurityDeposit ? formatCurrency(data.reservation.securityDepositValue) : 'R$ 0,00',
    "Motivo Viagem": data.reservation.reasonForVisit,
    "Nome Titular": data.mainGuest.fullName,
    "CPF Titular": data.mainGuest.cpf,
    "RG Titular": data.mainGuest.rg,
    "E-mail": data.mainGuest.email,
    "Telefone": data.mainGuest.phone,
    "Endereço": data.mainGuest.address,
    "Estado Civil": data.mainGuest.maritalStatus,
    "Profissão": data.mainGuest.profession,
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Detalhes Pet": data.pet.hasPet ? `${data.pet.name} | ${data.pet.breed} | ${data.pet.size}` : 'N/A',
    "Acompanhantes": data.companions.length > 0 
      ? data.companions.map(c => `${c.name} (${c.documentNumber})`).join('; ')
      : 'Apenas o titular',
    "Log: Doc Enviado": data.mainGuest.documentFile ? 'Sim' : 'Não',
    "Log: Selfie Enviada": data.mainGuest.selfieFile ? 'Sim' : 'Não'
  };

  try {
    console.log("Enviando via fetch (no-cors)...");
    
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    console.log("Dados enviados com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro na comunicação com o Google Sheets:", error);
    throw error;
  }
};

export const sendToAutentique = async (pdfBase64: string, guestEmail: string, guestName: string): Promise<string> => {
  console.log(`Assinatura Autentique simulada para: ${guestName}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "id_assinatura_simulado";
};
