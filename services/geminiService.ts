
import { GoogleGenAI } from "@google/genai";
import { FullFormData, PROPERTIES } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  // Inicialização dentro da função para garantir o carregamento da chave de API
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const property = PROPERTIES.find(p => p.id === data.reservation.propertyId) || PROPERTIES[0];
  
  let petClause = "";
  if (property.petAllowed) {
    if (data.pet.hasPet) {
      petClause = `CLÁUSULA SOBRE ANIMAIS: Fica autorizada a permanência do animal doméstico: Nome: ${data.pet.name}, Espécie: ${data.pet.species}, Raça: ${data.pet.breed}, Porte: ${data.pet.size}, Peso: ${data.pet.weight}, Idade: ${data.pet.age}. O Locatário declara que as vacinas estão em dia e assume total responsabilidade por qualquer dano ou barulho causado pelo animal.`;
    } else {
      petClause = "CLÁUSULA SOBRE ANIMAIS: O Locatário declara que não haverá animais de estimação durante a estada.";
    }
  } else {
    petClause = "CLÁUSULA SOBRE ANIMAIS: É terminantemente PROIBIDA a entrada de animais de estimação no imóvel.";
  }

  const prompt = `
    Aja como um advogado especialista em direito imobiliário e escreva um CONTRATO DE LOCAÇÃO POR TEMPORADA.
    
    REGRAS CRÍTICAS:
    - Retorne APENAS o texto do contrato.
    - NÃO use negrito, asteriscos (*), colchetes ou qualquer formatação Markdown.
    - Use parágrafos claros e numeração simples (1, 2, 3...).

    DADOS DO LOCADOR:
    Nome: ${property.ownerName}, CPF: ${property.ownerCpf}, Estado Civil: ${property.ownerStatus}, Profissão: ${property.ownerProfession}.

    DADOS DO LOCATÁRIO:
    Nome: ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, Residente em: ${data.mainGuest.address}.

    DADOS DO IMÓVEL E LOCAÇÃO:
    Imóvel: ${property.name}.
    Endereço: ${property.address}.
    Período: De ${data.reservation.startDate} a ${data.reservation.endDate}.
    Valor Total: R$ ${data.reservation.totalValue.toFixed(2)}.
    Hóspedes: ${data.reservation.guestCount} (Titular e acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Nenhum'}).

    ${petClause}

    O contrato deve conter: Objeto, Prazo, Preço, Deveres de Conservação e Foro da Comarca do Imóvel.
  `;

  try {
    // Utilizando o modelo gemini-2.0-flash para maior confiabilidade
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text = response.text || "";
    
    // Limpeza profunda de caracteres especiais de markdown que podem quebrar o visual
    text = text.replace(/[*#_\[\]]/g, '').trim();

    if (!text || text.length < 100) {
      throw new Error("Resposta da IA insuficiente.");
    }

    return text;
  } catch (err: any) {
    console.error("Erro detalhado na geração do contrato:", err);
    throw new Error("Erro na API do Gemini. Tente novamente em alguns segundos.");
  }
};
