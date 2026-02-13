
import { GoogleGenAI } from "@google/genai";
import { FullFormData, PROPERTIES } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  // Inicialização direta conforme as diretrizes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const property = PROPERTIES.find(p => p.id === data.reservation.propertyId) || PROPERTIES[0];
  
  const petClause = property.petAllowed 
    ? (data.pet.hasPet 
        ? `CLÁUSULA SOBRE ANIMAIS: Autorizada a permanência do animal doméstico: ${data.pet.name}, ${data.pet.species}, ${data.pet.breed}. O locatário assume total responsabilidade por danos.` 
        : "CLÁUSULA SOBRE ANIMAIS: O imóvel permite pets, mas o locatário informou que não trará nenhum.")
    : "CLÁUSULA SOBRE ANIMAIS: É proibida a permanência de animais no imóvel.";

  const prompt = `
    Escreva um CONTRATO DE LOCAÇÃO POR TEMPORADA formal.
    LOCADOR: ${property.ownerName}, CPF: ${property.ownerCpf}, ${property.ownerStatus}, ${property.ownerProfession}.
    LOCATÁRIO: ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, Residente em: ${data.mainGuest.address}.
    IMÓVEL: ${property.name} em ${property.address}.
    PERÍODO: De ${data.reservation.startDate} a ${data.reservation.endDate}.
    VALOR: R$ ${data.reservation.totalValue.toFixed(2)}.
    HÓSPEDES: ${data.reservation.guestCount} pessoa(s). Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Nenhum'}.
    
    ${petClause}
    
    REGRAS:
    - Retorne APENAS o texto do contrato.
    - NÃO use markdown (asteriscos, hashtags, negrito).
    - Use numeração simples para cláusulas.
    - Mencione Wellington Rodovalho Fonseca como corretor intermediário.
  `;

  try {
    // Correção Crítica: Usando a estrutura simplificada de string para o prompt
    // e o modelo flash-preview para evitar timeouts
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta da API vazia");
    }

    // Limpeza de segurança para garantir texto puro
    return text.replace(/[*#_\[\]]/g, '').trim();
  } catch (err: any) {
    console.error("Falha na chamada Gemini:", err);
    throw new Error("Erro na comunicação com a IA");
  }
};
