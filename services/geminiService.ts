
import { GoogleGenAI } from "@google/genai";
import { FullFormData, PROPERTIES } from "../types";

export const generateContract = async (data: FullFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const property = PROPERTIES.find(p => p.id === data.reservation.propertyId) || PROPERTIES[0];
  
  let petClause = "";
  if (property.petAllowed) {
    if (data.pet.hasPet) {
      petClause = `É PERMITIDA a permanência do animal doméstico descrito a seguir: Nome: ${data.pet.name}, Espécie: ${data.pet.species}, Raça: ${data.pet.breed}, Porte: ${data.pet.size}, Peso: ${data.pet.weight}, Idade: ${data.pet.age}. O locatário declara possuir o comprovante de vacinação em dia. O animal deve respeitar as normas de higiene e silêncio do condomínio.`;
    } else {
      petClause = "É PERMITIDA a permanência de animais domésticos de pequeno porte, desde que previamente informados. Nesta reserva, o locatário informou que NÃO trará animais.";
    }
  } else {
    petClause = "É expressamente PROIBIDA a permanência de qualquer tipo de animal doméstico no imóvel, sob pena de rescisão imediata e multa.";
  }

  const prompt = `
    Gere um contrato de locação por temporada profissional.
    IMPORTANTE: NÃO USE asteriscos (*), NÃO USE colchetes ou quadrados ([]), NÃO USE negrito em markdown. 
    Retorne apenas TEXTO PURO limpo e formatado como um documento oficial.

    DADOS DO LOCADOR (PROPRIETÁRIO):
    Nome: ${property.ownerName}, CPF: ${property.ownerCpf}, Estado Civil: ${property.ownerStatus}, Profissão: ${property.ownerProfession}.

    DADOS DO LOCATÁRIO (HÓSPEDE):
    Nome: ${data.mainGuest.fullName}, CPF: ${data.mainGuest.cpf}, RG: ${data.mainGuest.rg}, Residente em: ${data.mainGuest.address}.

    DADOS DA LOCAÇÃO:
    Imóvel: ${property.name}.
    Endereço do Imóvel: ${property.address}.
    Período: Início em ${data.reservation.startDate} e término em ${data.reservation.endDate}.
    Valor Total da Reserva: R$ ${data.reservation.totalValue.toFixed(2)}.
    Quantidade de Hóspedes: ${data.reservation.guestCount}.
    Acompanhantes: ${data.companions.map(c => c.name).join(', ') || 'Apenas o titular'}.
    Veículo: ${data.reservation.vehicleModel || 'Não informado'} - Placa: ${data.reservation.vehiclePlate || 'N/A'}.

    CLÁUSULA SOBRE PETS:
    ${petClause}

    ESTRUTURA DO CONTRATO:
    1. OBJETO DA LOCAÇÃO (Descrever o imóvel e finalidade exclusivamente residencial temporária).
    2. PRAZO E HORÁRIOS (Datas de check-in e check-out).
    3. PREÇO E FORMA DE PAGAMENTO (Citar o valor total R$ ${data.reservation.totalValue.toFixed(2)}).
    4. DEVERES E PROIBIÇÕES (Silêncio, conservação, proibição de sublocar).
    5. CLÁUSULA PET (Conforme instruído acima).
    6. FORO (Eleito o foro da Comarca de Goiânia-GO ou Caldas Novas conforme o imóvel).

    RETORNE O TEXTO COMPLETO DO CONTRATO SEM SÍMBOLOS DE MARKDOWN.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let text = response.text || "";
    // Limpeza extra caso a IA insista em markdown
    text = text.replace(/\*/g, '').replace(/#/g, '').replace(/\[\]/g, '').trim();

    if (!text) {
      throw new Error("A resposta da IA está vazia.");
    }

    return text;
  } catch (err: any) {
    console.error("Erro na geração do contrato via Gemini API:", err);
    throw new Error("Não foi possível gerar o contrato automaticamente.");
  }
};
