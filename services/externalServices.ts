
import { FullFormData } from "../types";

/**
 * URL atualizada conforme a nova implantação fornecida pelo usuário.
 */
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwTwrG2ZAMrQZMec4NAkt6ChiUq9L3Oh1c-vSb1SwxKZpQCOZ-aoLfZ0xbdaVJewlUZ/exec";

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  console.log("Preparando dados detalhados para o Google Sheets...");

  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.error("URL do Google Sheets não configurada.");
    return false;
  }

  // Organizamos os dados de forma linear (flat) para que o Apps Script da planilha
  // possa simplesmente iterar sobre as chaves e criar colunas perfeitas.
  const flattenedData = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    
    // DADOS DO IMÓVEL E PROPRIETÁRIO
    "Imóvel: Nome": data.propertyDetails?.name || '',
    "Imóvel: Endereço": data.propertyDetails?.address || '',
    "Proprietário: Nome": data.propertyDetails?.ownerName || '',
    "Proprietário: CPF": data.propertyDetails?.ownerCpf || '',
    "Proprietário: Est. Civil": data.propertyDetails?.ownerStatus || '',
    "Proprietário: Profissão": data.propertyDetails?.ownerProfession || '',
    
    // DADOS DA RESERVA
    "Reserva: Início": data.reservation.startDate,
    "Reserva: Fim": data.reservation.endDate,
    "Reserva: Qtd Hóspedes": data.reservation.guestCount,
    "Reserva: Valor Total": data.reservation.totalValue,
    "Reserva: Motivo": data.reservation.reasonForVisit,
    
    // DADOS DO TITULAR
    "Titular: Nome Completo": data.mainGuest.fullName,
    "Titular: CPF": data.mainGuest.cpf,
    "Titular: RG": data.mainGuest.rg,
    "Titular: E-mail": data.mainGuest.email,
    "Titular: WhatsApp": data.mainGuest.phone,
    "Titular: Endereço Residencial": data.mainGuest.address,
    "Titular: Estado Civil": data.mainGuest.maritalStatus,
    "Titular: Profissão": data.mainGuest.profession,
    
    // DADOS DO PET
    "Tem Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Pet: Detalhes": data.pet.hasPet 
      ? `Nome: ${data.pet.name} | Espécie: ${data.pet.species} | Raça: ${data.pet.breed} | Peso: ${data.pet.weight} | Idade: ${data.pet.age} | Porte: ${data.pet.size}`
      : 'N/A',
    
    // ACOMPANHANTES
    "Acompanhantes": data.companions.length > 0 
      ? data.companions.map((c, i) => `${i+1}. ${c.name} (Doc: ${c.documentNumber})`).join(' || ')
      : 'Apenas o titular',
      
    // STATUS DOS ARQUIVOS (Confirmando que foram coletados)
    "Arquivo: Doc Titular": data.mainGuest.documentFile ? 'COLETADO' : 'PENDENTE',
    "Arquivo: Selfie Titular": data.mainGuest.selfieFile ? 'COLETADO' : 'PENDENTE',
    "Arquivo: Vacina Pet": data.pet.vaccineFile ? 'COLETADO' : 'N/A'
  };

  try {
    // Envio via POST para o Apps Script
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(flattenedData),
    });

    return true;
  } catch (error) {
    console.error("Erro técnico no envio para Google Sheets:", error);
    throw new Error("Erro de conexão ao salvar na planilha.");
  }
};

export const sendToAutentique = async (pdfBase64: string, guestEmail: string, guestName: string): Promise<string> => {
  console.log(`Simulando integração Autentique para: ${guestName}`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return "sign_request_" + Math.random().toString(36).substring(7);
};
