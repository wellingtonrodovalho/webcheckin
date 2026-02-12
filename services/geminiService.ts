
import { GoogleGenAI } from "@google/genai";
import { FullFormData } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Gere um contrato de locação por temporada profissional e juridicamente sólido para um imóvel em Goiânia, GO.
    Use os seguintes dados:
    - Locatário (Titular): ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, Endereço: ${data.mainGuest.address}.
    - Período: De ${data.reservation.startDate} até ${data.reservation.endDate}.
    - Local do Imóvel: ${data.reservation.propertyAddress}.
    - Valor da Diária: R$ ${data.reservation.dailyRate}.
    - Quantidade de Hóspedes: ${data.reservation.guestCount}.
    - Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Nenhum'}.
    - Motivo da Estadia: ${data.reservation.reasonForVisit}.
    - Veículo cadastrado: ${data.reservation.vehicleModel || 'N/A'} - Placa: ${data.reservation.vehiclePlate || 'N/A'}.

    O contrato deve seguir a Lei do Inquilinato (Lei 8.245/91), especificamente a seção de locação para temporada.
    Inclua cláusulas sobre:
    1. Objeto da locação.
    2. Prazo e horários de check-in/check-out.
    3. Valor e forma de pagamento.
    4. Deveres do locatário (conservação, silêncio, normas do condomínio).
    5. Limite de ocupantes.
    6. Foro da comarca de Goiânia.
    
    Retorne apenas o texto formatado em Markdown, pronto para ser transformado em PDF.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text || "Erro ao gerar contrato.";
};
