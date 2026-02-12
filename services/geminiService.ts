
import { GoogleGenAI } from "@google/genai";
import { FullFormData } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  // Inicializa o cliente com a chave de API do ambiente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Gere um contrato de locação por temporada profissional e juridicamente sólido para um imóvel em Goiânia, GO.
    Use estritamente os seguintes dados:
    - Locatário (Titular): ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, Endereço: ${data.mainGuest.address}.
    - Período: De ${data.reservation.startDate} até ${data.reservation.endDate}.
    - Local do Imóvel: ${data.reservation.propertyAddress}.
    - Valor da Diária: R$ ${data.reservation.dailyRate}.
    - Quantidade de Hóspedes: ${data.reservation.guestCount}.
    - Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Nenhum'}.
    - Motivo da Estadia: ${data.reservation.reasonForVisit}.
    - Veículo: ${data.reservation.vehicleModel || 'Não informado'} - Placa: ${data.reservation.vehiclePlate || 'N/A'}.

    O contrato deve seguir a Lei do Inquilinato (Lei 8.245/91).
    Inclua cláusulas sobre:
    1. Objeto da locação.
    2. Prazo e horários.
    3. Valor e pagamento.
    4. Deveres do locatário.
    5. Limite de ocupantes.
    6. Foro de Goiânia-GO.
    
    Retorne apenas o texto formatado em Markdown, sem comentários adicionais.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    if (!response.text) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    return response.text;
  } catch (err: any) {
    console.error("Erro detalhado na geração do contrato via Gemini:", err);
    throw err;
  }
};
