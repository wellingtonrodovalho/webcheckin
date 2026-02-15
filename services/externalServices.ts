
import { FullFormData } from "../types";

// URL ATUALIZADA DA VERSÃO 11 (Conforme sua foto)
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/library/d/1Wg0NFQZYs0m_mJGqpLNod6ArRHEW6XKZaZCFIlTPXfcvGWW22uqddAw6/12WspK/exec";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.error("URL da Planilha não configurada.");
    return false;
  }

  // Payload simplificado para garantir compatibilidade com o script
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Imóvel": data.propertyDetails?.name || 'N/A',
    "Proprietário": data.propertyDetails?.ownerName || 'N/A',
    "Check-in": data.reservation.startDate,
    "Check-out": data.reservation.endDate,
    "Hóspedes": data.reservation.guestCount,
    "Valor Total": formatCurrency(data.reservation.totalValue),
    "Nome Titular": data.mainGuest.fullName,
    "CPF Titular": data.mainGuest.cpf,
    "RG Titular": data.mainGuest.rg,
    "E-mail": data.mainGuest.email,
    "Telefone": data.mainGuest.phone,
    "Endereço": data.mainGuest.address,
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Doc: Frente": data.mainGuest.documentFile || '',
    "Foto: Selfie": data.mainGuest.selfieFile || '',
    "Doc: Vacina Pet": data.pet.vaccineFile || 'N/A'
  };

  console.log("Tentando enviar para a nova URL (Versão 11)...");

  try {
    // Usamos no-cors para evitar erros de redirecionamento do Google
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Em modo no-cors o fetch não retorna erro se o Google receber, 
    // então retornamos true se chegar aqui.
    return true;
  } catch (error) {
    console.error("Erro ao enviar para Google Sheets:", error);
    return false;
  }
};
