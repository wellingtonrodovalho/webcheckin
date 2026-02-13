
import { FullFormData } from "../types";

/**
 * URL final fornecida pelo usuário terminando em "...UZ/exec"
 */
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwTwrG2ZAMrQZMec4NAkt6ChiUq9L3Oh1c-vSb1SwxKZpQCOZ-aoLfZ0xbdaVJewlUZ/exec";

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  console.log("Iniciando envio para Google Sheets...");

  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.error("Configuração ausente: GOOGLE_SHEETS_WEBAPP_URL");
    return false;
  }

  // Mapeamento linear dos campos para colunas da planilha
  const flattenedData = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Imóvel": data.propertyDetails?.name || 'N/A',
    "Proprietário": data.propertyDetails?.ownerName || 'N/A',
    "Check-in": data.reservation.startDate,
    "Check-out": data.reservation.endDate,
    "Hóspedes": data.reservation.guestCount,
    "Valor Total": data.reservation.totalValue,
    "Motivo": data.reservation.reasonForVisit,
    "Titular: Nome": data.mainGuest.fullName,
    "Titular: CPF": data.mainGuest.cpf,
    "Titular: RG": data.mainGuest.rg,
    "Titular: E-mail": data.mainGuest.email,
    "Titular: WhatsApp": data.mainGuest.phone,
    "Titular: Endereço": data.mainGuest.address,
    "Titular: Est. Civil": data.mainGuest.maritalStatus,
    "Titular: Profissão": data.mainGuest.profession,
    "Pet: Possui?": data.pet.hasPet ? 'Sim' : 'Não',
    "Pet: Detalhes": data.pet.hasPet ? `${data.pet.name} (${data.pet.breed}/${data.pet.size})` : '-',
    "Acompanhantes": data.companions.length > 0 
      ? data.companions.map(c => `${c.name} (${c.documentNumber})`).join('; ')
      : 'Nenhum',
    "Doc. Titular": data.mainGuest.documentFile ? 'SIM' : 'NÃO',
    "Selfie": data.mainGuest.selfieFile ? 'SIM' : 'NÃO'
  };

  try {
    // Usamos mode: 'no-cors' para evitar bloqueios de segurança do navegador ao postar para domínios do Google
    // O Google Apps Script processará o body como um POST simples.
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain', // Essencial para evitar preflight OPTIONS
      },
      body: JSON.stringify(flattenedData),
    });

    console.log("Comando de envio enviado com sucesso.");
    return true;
  } catch (error) {
    console.error("Erro crítico no envio:", error);
    throw error;
  }
};

export const sendToAutentique = async (pdfBase64: string, guestEmail: string, guestName: string): Promise<string> => {
  console.log(`Simulando assinatura Autentique para: ${guestName}`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return "sign_" + Math.random().toString(36).substring(7);
};
