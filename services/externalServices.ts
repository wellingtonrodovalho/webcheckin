
import { FullFormData } from "../types";

// URL atualizada conforme a imagem da implantação do usuário (Versão 8)
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbbyUT0TieJ_zQbOAdpT1kVfYS3arcL6qUs1WADnmF1BKWOiu3KdMn9_x_61cczGkD0O/exec";

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

  // Mapeamento completo incluindo dados do proprietário (para a planilha, não para o formulário)
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Imóvel": data.propertyDetails?.name || 'N/A',
    "Proprietário Imóvel": data.propertyDetails?.ownerName || 'N/A',
    "CPF Proprietário": data.propertyDetails?.ownerCpf || 'N/A',
    "Estado Civil Proprietário": data.propertyDetails?.ownerStatus || 'N/A',
    "Profissão Proprietário": data.propertyDetails?.ownerProfession || 'N/A',
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
    "Estado Civil Titular": data.mainGuest.maritalStatus,
    "Profissão Titular": data.mainGuest.profession,
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
    const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    
    // Como usamos no-cors, o fetch não retorna se deu certo, mas se não jogou erro, assumimos sucesso
    return true;
  } catch (error) {
    console.error("Erro ao enviar para Google Sheets:", error);
    throw error;
  }
};
