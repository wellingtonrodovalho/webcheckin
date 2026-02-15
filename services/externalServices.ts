
import { FullFormData } from "../types";

const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxYh_OKaU0zVQU-vhInBJCTuXBJrjmLjzkmY4pfu7kQVqSrQyYEAwBNS2AwTz5vWspK/exec";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return false;

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
    // Usando URLSearchParams para enviar como application/x-www-form-urlencoded
    // Este é o método mais robusto para POST em modo no-cors para Google Scripts
    const params = new URLSearchParams();
    params.append('dadosJSON', JSON.stringify(payload));

    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: params
    });
    
    return true;
  } catch (error) {
    console.error("Erro no envio:", error);
    return false;
  }
};
