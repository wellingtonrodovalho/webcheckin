
import { GoogleGenAI } from "@google/genai";
import { FullFormData } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  // Inicializa o cliente com a chave de API do ambiente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Gere um contrato de locação por temporada profissional para um imóvel em Goiânia, GO.
    Dados principais:
    - Locatário: ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}.
    - Período: ${data.reservation.startDate} a ${data.reservation.endDate}.
    - Imóvel: ${data.reservation.propertyAddress}.
    - Diária: R$ ${data.reservation.dailyRate}.
    - Hóspedes: ${data.reservation.guestCount}.
    - Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Apenas o titular'}.
    - Veículo: ${data.reservation.vehicleModel || 'Nenhum'} (Placa: ${data.reservation.vehiclePlate || 'N/A'}).

    Regras: Use a Lei 8.245/91. Inclua cláusulas de silêncio, conservação e foro de Goiânia.
    Retorne o texto formatado em Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta da IA veio vazia.");
    }

    return text;
  } catch (err: any) {
    console.error("Erro na API Gemini:", err);
    throw new Error("Falha na comunicação com o servidor de contratos.");
  }
};
