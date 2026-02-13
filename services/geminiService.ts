
import { GoogleGenAI } from "@google/genai";
import { FullFormData, PROPERTIES } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const property = PROPERTIES.find(p => p.id === data.reservation.propertyId) || PROPERTIES[0];
  
  let petClause = "";
  if (property.petAllowed) {
    if (data.pet.hasPet) {
      petClause = `CLÁUSULA PET: É PERMITIDA a permanência do animal doméstico descrito a seguir: Nome: ${data.pet.name}, Espécie: ${data.pet.species}, Raça: ${data.pet.breed}, Porte: ${data.pet.size}, Peso: ${data.pet.weight}, Idade: ${data.pet.age}. O locatário declara possuir o comprovante de vacinação em dia. O animal deve respeitar as normas de higiene e silêncio do condomínio.`;
    } else {
      petClause = "CLÁUSULA PET: É PERMITIDA a permanência de animais domésticos de pequeno porte, desde que previamente informados. Nesta reserva, o locatário informou que NÃO trará animais.";
    }
  } else {
    petClause = "CLÁUSULA PET: É expressamente PROIBIDA a permanência de qualquer tipo de animal doméstico no imóvel, sob pena de rescisão imediata e multa.";
  }

  const prompt = `
    Gere um contrato de locação por temporada profissional e formal.
    REGRAS DE FORMATAÇÃO:
    - NÃO use asteriscos (*) ou símbolos de markdown.
    - NÃO use colchetes [] ou hashtags #.
    - Retorne apenas o texto puro e limpo, pronto para leitura.
    - Use espaçamento adequado entre as cláusulas.

    LOCADOR (PROPRIETÁRIO):
    Nome: ${property.ownerName}, CPF: ${property.ownerCpf}, Estado Civil: ${property.ownerStatus}, Profissão: ${property.ownerProfession}.

    LOCATÁRIO (HÓSPEDE):
    Nome: ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, E-mail: ${data.mainGuest.email}, Telefone: ${data.mainGuest.phone}, Residente em: ${data.mainGuest.address}.

    IMÓVEL:
    Nome: ${property.name}.
    Endereço: ${property.address}.
    Capacidade Total do Imóvel: ${property.capacity} pessoas.

    DETALHES DA LOCAÇÃO:
    Período: ${data.reservation.startDate} até ${data.reservation.endDate}.
    Valor Total da Reserva: R$ ${data.reservation.totalValue.toFixed(2)}.
    Hóspedes: ${data.reservation.guestCount}.
    Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Nenhum'}.

    ${petClause}

    ESTRUTURA OBRIGATÓRIA DO TEXTO:
    1. OBJETO DA LOCAÇÃO: Descrever o imóvel para fins temporários.
    2. PRAZO: Datas de entrada e saída.
    3. VALOR E PAGAMENTO: Citar o valor total de R$ ${data.reservation.totalValue.toFixed(2)}.
    4. OBRIGAÇÕES DO LOCATÁRIO: Conservação, silêncio e normas.
    5. CLÁUSULA PET: Conforme definido acima.
    6. FORO: Comarca de Goiânia-GO ou Caldas Novas conforme o imóvel.

    Escreva o contrato agora.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let text = response.text || "";
    
    // Limpeza rigorosa de símbolos de markdown
    text = text.replace(/[*#_\[\]]/g, '').trim();

    if (!text) {
      throw new Error("A resposta da IA está vazia.");
    }

    return text;
  } catch (err: any) {
    console.error("Erro na geração do contrato via Gemini API:", err);
    throw new Error("Não foi possível gerar o contrato automaticamente.");
  }
};
