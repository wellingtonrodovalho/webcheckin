
import { GoogleGenAI } from "@google/genai";
import { FullFormData, PROPERTIES } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  // Inicialização rigorosa conforme diretrizes: usa process.env.API_KEY diretamente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const property = PROPERTIES.find(p => p.id === data.reservation.propertyId) || PROPERTIES[0];
  
  let petClause = "";
  if (property.petAllowed) {
    if (data.pet.hasPet) {
      petClause = `CLÁUSULA PET: Autorizada a permanência do animal doméstico de nome ${data.pet.name || 'informado'}, espécie ${data.pet.species || ''}, raça ${data.pet.breed || ''}. O locatário é integralmente responsável por danos ou ruídos causados pelo animal.`;
    } else {
      petClause = "CLÁUSULA PET: O imóvel permite animais, contudo o locatário declara expressamente que não haverá animais de estimação acompanhando os hóspedes nesta locação.";
    }
  } else {
    petClause = "CLÁUSULA PET: É terminantemente PROIBIDA a entrada de qualquer tipo de animal de estimação no imóvel, sob pena de rescisão contratual imediata e multa.";
  }

  // Prompt estruturado para evitar filtros de segurança e garantir formatação limpa
  const prompt = `
    Aja como um advogado especializado em direito imobiliário brasileiro e redija um CONTRATO DE LOCAÇÃO POR TEMPORADA.
    
    DADOS PARA O CONTRATO:
    - LOCADOR: ${property.ownerName}, CPF: ${property.ownerCpf}, ${property.ownerStatus}, ${property.ownerProfession}.
    - LOCATÁRIO: ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, Residente em: ${data.mainGuest.address}.
    - IMÓVEL: ${property.name} localizado em ${property.address}.
    - PERÍODO: Check-in em ${data.reservation.startDate} e Check-out em ${data.reservation.endDate}.
    - VALOR TOTAL: R$ ${data.reservation.totalValue.toFixed(2)}.
    - HÓSPEDES: Total de ${data.reservation.guestCount} pessoa(s). Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Apenas o titular'}.
    
    ${petClause}
    
    REGRAS OBRIGATÓRIAS DE RESPOSTA:
    1. Retorne APENAS o texto do contrato pronto para leitura.
    2. NÃO utilize símbolos de markdown como asteriscos (*), hashtags (#), sublinhados (_) ou colchetes ([]).
    3. Use numeração simples para as cláusulas (1., 2., 3...).
    4. Mantenha um tom profissional, formal e jurídico.
    5. O contrato deve mencionar o corretor Wellington Rodovalho Fonseca como responsável pela intermediação.
  `;

  try {
    // Usando gemini-3-pro-preview para maior inteligência na elaboração do documento
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("A API retornou uma resposta sem texto.");
    }

    // Limpeza final de caracteres residuais de markdown
    return text.replace(/[*#_\[\]]/g, '').trim();
  } catch (err: any) {
    console.error("Erro crítico na API Gemini:", err);
    throw err; // Repassa para o componente UI tratar
  }
};
