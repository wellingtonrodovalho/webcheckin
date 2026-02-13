
import { FullFormData } from "../types";

const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwTwrG2ZAMrQZMec4NAkt6ChiUq9L3Oh1c-vSb1SwxKZpQCOZ-aoLfZ0xbdaVJewlUZ/exec";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[2])}.${parseInt(parts[1])}.${parts[0]}`;
};

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.error("URL da Planilha não configurada.");
    return false;
  }

  // Mapeamento explícito de campos para garantir integridade na planilha
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Imóvel": data.propertyDetails?.name || 'N/A',
    "Check-in": formatDate(data.reservation.startDate),
    "Check-out": formatDate(data.reservation.endDate),
    "Hóspedes": data.reservation.guestCount,
    "Valor Reserva": formatCurrency(data.reservation.totalValue),
    "Caução Exigido?": data.reservation.hasSecurityDeposit ? 'Sim' : 'Não',
    "Valor Caução": data.reservation.hasSecurityDeposit ? formatCurrency(data.reservation.securityDepositValue) : 'R$ 0,00',
    "Nome Titular": data.mainGuest.fullName,
    "CPF Titular": data.mainGuest.cpf,
    "RG Titular": data.mainGuest.rg,
    "Nacionalidade": data.mainGuest.nationality || 'Brasileira',
    "Estado Civil": data.mainGuest.maritalStatus,
    "Profissão": data.mainGuest.profession,
    "E-mail": data.mainGuest.email,
    "Telefone": data.mainGuest.phone,
    "Endereço": data.mainGuest.address,
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Detalhes Pet": data.pet.hasPet ? `${data.pet.name} (${data.pet.breed})` : 'N/A',
    "Acompanhantes": data.companions.length > 0 
      ? data.companions.map(c => `${c.name} (${c.documentNumber})`).join('; ') 
      : 'Individual',
    "Doc: Frente": data.mainGuest.documentFile || '',
    "Foto: Selfie": data.mainGuest.selfieFile || '',
    "Doc: Vacina Pet": data.pet.vaccineFile || 'N/A'
  };

  try {
    // Usando JSON.stringify para garantir que o base64 longo seja enviado corretamente como texto
    const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao enviar para Google Sheets:", error);
    throw error;
  }
};
