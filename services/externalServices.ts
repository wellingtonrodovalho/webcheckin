
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
  // Formato d.m.aaaa
  return `${parseInt(parts[2])}.${parseInt(parts[1])}.${parts[0]}`;
};

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return false;

  // Payload completo incluindo dados detalhados do proprietário, nacionalidade do titular e arquivos base64
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Imóvel": data.propertyDetails?.name || 'N/A',
    "Proprietário Nome": data.propertyDetails?.ownerName || 'N/A',
    "Proprietário CPF": data.propertyDetails?.ownerCpf || 'N/A',
    "Proprietário Estado Civil": data.propertyDetails?.ownerStatus || 'N/A',
    "Proprietário Profissão": data.propertyDetails?.ownerProfession || 'N/A',
    "Check-in": formatDate(data.reservation.startDate),
    "Check-out": formatDate(data.reservation.endDate),
    "Hóspedes": data.reservation.guestCount,
    "Valor Reserva": formatCurrency(data.reservation.totalValue),
    "Caução Exigido?": data.reservation.hasSecurityDeposit ? 'Sim' : 'Não',
    "Valor Caução": data.reservation.hasSecurityDeposit ? formatCurrency(data.reservation.securityDepositValue) : 'R$ 0,00',
    "Nome Titular": data.mainGuest.fullName,
    "CPF Titular": data.mainGuest.cpf,
    "RG Titular": data.mainGuest.rg,
    "Nacionalidade": data.mainGuest.nationality,
    "E-mail": data.mainGuest.email,
    "Telefone": data.mainGuest.phone,
    "Endereço": data.mainGuest.address,
    "Estado Civil": data.mainGuest.maritalStatus,
    "Profissão": data.mainGuest.profession,
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Detalhes Pet": data.pet.hasPet ? `${data.pet.name} | ${data.pet.breed}` : 'N/A',
    "Acompanhantes": data.companions.map(c => `${c.name} (${c.documentNumber})`).join('; ') || 'Nenhum',
    "Doc: Frente": data.mainGuest.documentFile, // Envia o base64 real
    "Foto: Selfie": data.mainGuest.selfieFile,   // Envia o base64 real
    "Doc: Vacina Pet": data.pet.vaccineFile || 'N/A'
  };

  try {
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    throw error;
  }
};

export const sendToAutentique = async (pdfBase64: string, guestEmail: string, guestName: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "id_simulado";
};
