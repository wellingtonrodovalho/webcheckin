
import { FullFormData } from "../types";

// URL CORRIGIDA PARA A VERSÃO DE PRODUÇÃO DO USUÁRIO
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxYh_OKaU0zVQU-vhInBJCTuXBJrjmLjzkmY4pfu7kQVqSrQyYEAwBNS2AwTz5vWspK/exec";

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

  // Mapeamento dos dados para o formato esperado pelo Google Script
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

  try {
    // Usamos no-cors pois o Google Apps Script faz redirecionamentos que o navegador bloqueia por segurança
    // O no-cors permite que a requisição chegue ao destino sem erro de pre-flight
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Em modo no-cors, se não houver erro de rede, consideramos sucesso
    return true;
  } catch (error) {
    console.error("Erro crítico ao enviar para Google Sheets:", error);
    return false;
  }
};
