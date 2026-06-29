
import { FullFormData } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxYh_OKaU0zVQU-vhInBJCTuXBJrjmLjzkmY4pfu7kQVqSrQyYEAwBNS2AwTz5vWspK/exec";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return false;

  // 1. Preparar o PDF com o template solicitado
  const doc = new jsPDF();
  
  // Cor de fundo do canvas (Bege/Dourado suave do template)
  doc.setFillColor(212, 188, 149); // #D4BC95
  doc.rect(0, 0, 210, 297, 'F');

  // --- 1. CABEÇALHO ---
  // Logo: Aluga Goiás (Árvore estilizada)
  doc.setDrawColor(47, 47, 47);
  doc.setLineWidth(1);
  // Tronco
  doc.line(18, 14, 18, 28);
  // Galhos
  doc.line(18, 22, 13, 18);
  doc.line(18, 20, 23, 16);
  // Folhas (Círculos)
  doc.setFillColor(47, 47, 47);
  doc.ellipse(13, 18, 1, 1, 'F');
  doc.ellipse(23, 16, 1, 1, 'F');
  doc.ellipse(18, 14, 1, 1, 'F');

  // Texto Logo
  doc.setTextColor(47, 47, 47);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Aluga", 27, 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Goiás", 27, 27);

  // Endereço / Contatos do Escritório
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text("Rua T-45, 61, Apartamento 101B, Edifício Studio", 75, 14, { align: "center" });
  doc.text("45, Setor Bueno, Goiânia - GO, CEP 74210-160", 75, 17.5, { align: "center" });
  doc.text("www.alugagoias.com.br", 75, 21, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("WhatsApp: (62) 98555-1980", 75, 25, { align: "center" });

  // Card Topo Direito: Data da Autorização
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(125, 10, 75, 18, 4, 4, 'F');
  
  doc.setTextColor(47, 47, 47);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("DATA DA AUTORIZAÇÃO:", 130, 15);
  
  const dateObj = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = `Goiânia, ${dateObj.toLocaleDateString('pt-BR', options)}.`;
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(formattedDate, 130, 22);

  // --- 2. FILEIRA DE INFORMAÇÕES (PROPRIETÁRIA, CHECK-IN, EMERGÊNCIA) ---
  const cardY = 31;
  const cardH = 20;

  // Card 1: Proprietária
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, cardY, 53, cardH, 4, 4, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("PROPRIETÁRIA", 14, cardY + 5);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(47, 47, 47);
  const ownerName = (data.propertyDetails?.ownerName || "ROSIANI IPOLITA LEÃO").toUpperCase();
  doc.text(ownerName, 14, cardY + 12, { maxWidth: 45 });

  // Card 2: Check-in / Checkout
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(66, cardY, 73, cardH, 4, 4, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("CHECK-IN", 70, cardY + 5);
  doc.text("CHECKOUT", 112, cardY + 5);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(47, 47, 47);
  doc.text(data.reservation.startDate, 70, cardY + 13);
  doc.text("-", 102, cardY + 13);
  doc.text(data.reservation.endDate, 112, cardY + 13);

  // Card 3: Contato de Emergência
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(142, cardY, 58, cardH, 4, 4, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("CONTATO DE EMERGÊNCIA", 146, cardY + 5);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(47, 47, 47);
  const emerName = data.mainGuest.emergencyContactName || "Não Informado";
  const emerPhone = data.mainGuest.emergencyContactPhone || "";
  const emerRel = data.mainGuest.emergencyContactRelationship ? `(${data.mainGuest.emergencyContactRelationship})` : "";
  doc.text(`${emerName}\n${emerPhone} ${emerRel}`, 146, cardY + 11, { maxWidth: 50 });

  // --- 3. TABELA DE HÓSPEDES ---
  const tableY = 54;
  const tableH = 100;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, tableY, 190, tableH, 4, 4, 'F');

  // Título da Tabela
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("HÓSPEDES", 105, tableY + 5, { align: "center" });

  // Linha dourada sob o título
  doc.setDrawColor(194, 159, 104);
  doc.setLineWidth(0.4);
  doc.line(10, tableY + 7, 200, tableY + 7);

  // Cabeçalhos das Colunas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(47, 47, 47);
  doc.text("NOME", 12, tableY + 12);
  doc.text("TELEFONE", 72, tableY + 12);
  doc.text("CPF", 102, tableY + 12);
  doc.text("RG", 132, tableY + 12);
  doc.text("EMAIL", 157, tableY + 12);

  // Linha sob cabeçalhos
  doc.line(10, tableY + 14, 200, tableY + 14);

  // Grid vertical e horizontal
  // Definindo as larguras de colunas: NOME (60), TELEFONE (30), CPF (30), RG (25), EMAIL (45)
  // Total usable width = 190.
  // Desenhar as linhas das colunas verticais
  doc.line(70, tableY + 7, 70, tableY + 97);   // depois de NOME
  doc.line(100, tableY + 7, 100, tableY + 97); // depois de TELEFONE
  doc.line(130, tableY + 7, 130, tableY + 97); // depois de CPF
  doc.line(155, tableY + 7, 155, tableY + 97); // depois de RG

  // Desenhar linhas das linhas horizontais (9 linhas para 8 rows)
  for (let i = 1; i <= 9; i++) {
    const rowLineY = tableY + 14 + (i * 9);
    doc.line(10, rowLineY, 200, rowLineY);
  }

  // Preencher os dados dos hóspedes
  const guestsList = [];
  // Titular
  guestsList.push({
    name: (data.mainGuest.fullName || "").toUpperCase(),
    phone: data.mainGuest.phone || "",
    cpf: data.mainGuest.cpf || "",
    rg: data.mainGuest.rg || "",
    email: data.mainGuest.email || ""
  });
  // Acompanhantes
  data.companions.forEach(c => {
    guestsList.push({
      name: (c.name || "").toUpperCase(),
      phone: c.phone || "",
      cpf: c.cpf || "",
      rg: c.rg || "",
      email: c.email || ""
    });
  });

  // Desenhar textos
  doc.setFontSize(8);
  for (let i = 0; i < 9; i++) {
    const rowY = tableY + 14 + (i * 9);
    const guest = guestsList[i];
    if (guest) {
      doc.setFont("helvetica", "bold");
      doc.text(guest.name, 12, rowY + 5.5, { maxWidth: 56 });
      doc.setFont("helvetica", "normal");
      doc.text(guest.phone, 72, rowY + 5.5, { maxWidth: 26 });
      doc.text(guest.cpf, 102, rowY + 5.5, { maxWidth: 26 });
      doc.text(guest.rg, 132, rowY + 5.5, { maxWidth: 21 });
      doc.text(guest.email, 157, rowY + 5.5, { maxWidth: 41 });
    }
  }

  // --- 4. SEÇÃO INFERIOR: OBSERVAÇÕES & VEÍCULO ---
  const bottomY = 157;
  const bottomH = 45;

  // Box Observações
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, bottomY, 130, bottomH, 4, 4, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(120, 120, 120);
  doc.text("OBSERVAÇÕES", 14, bottomY + 6);
  
  doc.setFontSize(8.5);
  doc.setTextColor(47, 47, 47);
  
  // Detalhes do imóvel
  doc.setFont("helvetica", "bold");
  doc.text("Imóvel: ", 14, bottomY + 13);
  doc.setFont("helvetica", "normal");
  const propertyName = data.propertyDetails?.name || "N/A";
  doc.text(propertyName, 26, bottomY + 13, { maxWidth: 110 });
  
  // Check-in / Checkout times
  doc.setFont("helvetica", "bold");
  doc.text("Horário de check-in: ", 14, bottomY + 20);
  doc.setFont("helvetica", "normal");
  doc.text("Depois das 14 horas", 44, bottomY + 20);
  
  doc.setFont("helvetica", "bold");
  doc.text("Horário de check-out: ", 14, bottomY + 26);
  doc.setFont("helvetica", "normal");
  doc.text("Até as 11 horas", 45, bottomY + 26);
  
  // Notas e Pet se houver
  doc.setFont("helvetica", "bold");
  doc.text("Observações: ", 14, bottomY + 32);
  doc.setFont("helvetica", "normal");
  
  let obsStr = data.reservation.reasonForVisit || "";
  if (data.pet.hasPet) {
    obsStr += ` (Possui Pet: ${data.pet.name || "N/A"} - ${data.pet.breed || "N/A"})`;
  }
  doc.text(obsStr || "Nenhuma observação informada.", 34, bottomY + 32, { maxWidth: 100 });

  // Box Veículo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(143, bottomY, 57, bottomH, 4, 4, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(120, 120, 120);
  doc.text("VEÍCULO", 147, bottomY + 6);
  
  doc.setFontSize(8.5);
  doc.setTextColor(47, 47, 47);
  
  if (data.reservation.hasVehicle) {
    doc.setFont("helvetica", "bold");
    doc.text("Marca: ", 147, bottomY + 13);
    doc.setFont("helvetica", "normal");
    doc.text(data.reservation.vehicleBrand || "N/A", 158, bottomY + 13);
    
    doc.setFont("helvetica", "bold");
    doc.text("Modelo: ", 147, bottomY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(data.reservation.vehicleModel || "N/A", 160, bottomY + 20);

    doc.setFont("helvetica", "bold");
    doc.text("Cor: ", 147, bottomY + 27);
    doc.setFont("helvetica", "normal");
    doc.text(data.reservation.vehicleColor || "N/A", 155, bottomY + 27);
    
    doc.setFont("helvetica", "bold");
    doc.text("Placa: ", 147, bottomY + 34);
    doc.setFont("helvetica", "normal");
    doc.text((data.reservation.vehiclePlate || "N/A").toUpperCase(), 158, bottomY + 34);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("Nenhum veículo registrado para esta estadia.", 147, bottomY + 14, { maxWidth: 49 });
  }

  const pdfOutput = doc.output('datauristring');
  const pdfBase64 = pdfOutput.split(',')[1]; // Strip data:application/pdf;base64,

  // 3. Preparar corpo do email formatado para facilitar o Apps Script
  const emailBody = `
RELATÓRIO DE CHECK-IN - ${data.propertyDetails?.name || 'N/A'}
--------------------------------------------------
DADOS DO IMÓVEL:
- Nome: ${data.propertyDetails?.name || 'N/A'}
- Endereço: ${data.propertyDetails?.address || 'N/A'}

RESERVA:
- Check-in: ${data.reservation.startDate}
- Check-out: ${data.reservation.endDate}
- Hóspedes: ${data.reservation.guestCount}
- Origem da Reserva: ${data.reservation.bookingSource || 'N/A'}
- Motivo: ${data.reservation.reasonForVisit}
- Valor Total: ${formatCurrency(data.reservation.totalValue)}
- Caução: ${formatCurrency(data.reservation.securityDepositValue || 0)}

TITULAR:
- Nome: ${data.mainGuest.fullName}
- CPF: ${data.mainGuest.cpf}
- RG: ${data.mainGuest.rg}
- Nacionalidade: ${data.mainGuest.nationality}
- Estado Civil: ${data.mainGuest.maritalStatus}
- Profissão: ${data.mainGuest.profession}
- Email: ${data.mainGuest.email}
- Telefone: ${data.mainGuest.phone}
- Endereço: ${data.mainGuest.address}

CONTATO DE EMERGÊNCIA:
- Nome: ${data.mainGuest.emergencyContactName || 'N/A'}
- Telefone: ${data.mainGuest.emergencyContactPhone || 'N/A'}
- Parentesco: ${data.mainGuest.emergencyContactRelationship || 'N/A'}

VEÍCULO:
- Possui: ${data.reservation.hasVehicle ? 'Sim' : 'Não'}
- Marca: ${data.reservation.vehicleBrand || 'N/A'}
- Modelo: ${data.reservation.vehicleModel || 'N/A'}
- Placa: ${data.reservation.vehiclePlate || 'N/A'}

PET:
- Possui: ${data.pet.hasPet ? 'Sim' : 'Não'}
- Nome: ${data.pet.name || 'N/A'}
- Espécie/Raça: ${data.pet.species || 'N/A'} / ${data.pet.breed || 'N/A'}
- Idade/Peso/Tamanho: ${data.pet.age || 'N/A'} / ${data.pet.weight || 'N/A'} / ${data.pet.size || 'N/A'}

ACOMPANHANTES:
${data.companions.length > 0 
  ? data.companions.map((c, i) => `${i+1}. ${c.name} (RG: ${c.rg || '-'}, CPF: ${c.cpf || '-'}, Email: ${c.email || '-'}, Tel: ${c.phone || '-'})`).join('\n')
  : 'Nenhum'}
--------------------------------------------------
`.trim();

  // 4. Preparar Payload para Planilha e Email
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
    "Destinatario_Email": "wellington.rodovalho@gmail.com",
    "Assunto_Email": `Novo Check-in: ${data.mainGuest.fullName} - ${data.propertyDetails?.name}`,
    "Corpo_Email": emailBody,
    "PDF_Nome": `Relatorio_${data.mainGuest.fullName.replace(/\s+/g, '_')}.pdf`,
    "Imóvel": data.propertyDetails?.name || 'N/A',
    "Endereço do Imóvel": data.propertyDetails?.address || 'N/A',
    "Proprietário": data.propertyDetails?.ownerName || 'N/A',
    "CPF do Proprietário": data.propertyDetails?.ownerCpf || 'N/A',
    "Check-in": data.reservation.startDate,
    "Check-out": data.reservation.endDate,
    "Motivo da Viagem": data.reservation.reasonForVisit,
    "Hóspedes": data.reservation.guestCount,
    "Origem da Reserva": data.reservation.bookingSource || 'N/A',
    "Veículo Próprio?": data.reservation.hasVehicle ? 'Sim' : 'Não',
    "Marca Veículo": data.reservation.vehicleBrand || 'N/A',
    "Modelo Veículo": data.reservation.vehicleModel || 'N/A',
    "Cor Veículo": data.reservation.vehicleColor || 'N/A',
    "Placa Veículo": data.reservation.vehiclePlate || 'N/A',
    "Valor Total": formatCurrency(data.reservation.totalValue),
    "Caução": formatCurrency(data.reservation.securityDepositValue || 0),
    "Nome Titular": data.mainGuest.fullName,
    "CPF Titular": data.mainGuest.cpf,
    "RG Titular": data.mainGuest.rg,
    "Nacionalidade Titular": data.mainGuest.nationality,
    "Estado Civil Titular": data.mainGuest.maritalStatus,
    "Profissão Titular": data.mainGuest.profession,
    "E-mail": data.mainGuest.email,
    "Telefone": data.mainGuest.phone,
    "Endereço": data.mainGuest.address,
    "Logradouro e Número": data.mainGuest.addressStreet || '',
    "Complemento": data.mainGuest.addressComplement || '',
    "Bairro": data.mainGuest.addressDistrict || '',
    "Cidade e Estado": data.mainGuest.addressCityState || '',
    "CEP": data.mainGuest.addressZipCode || '',
    "Emergência: Nome": data.mainGuest.emergencyContactName || 'N/A',
    "Emergência: Telefone": data.mainGuest.emergencyContactPhone || 'N/A',
    "Emergência: Parentesco": data.mainGuest.emergencyContactRelationship || 'N/A',
    // Colunas individuais para acompanhantes
    "Acompanhante 1 Nome Completo": data.companions[0]?.name || '',
    "Acompanhante 1 RG": data.companions[0]?.rg || '',
    "Acompanhante 1 CPF": data.companions[0]?.cpf || '',
    "Acompanhante 1 Email": data.companions[0]?.email || '',
    "Acompanhante 1 Telefone": data.companions[0]?.phone || '',

    "Acompanhante 2 Nome Completo": data.companions[1]?.name || '',
    "Acompanhante 2 RG": data.companions[1]?.rg || '',
    "Acompanhante 2 CPF": data.companions[1]?.cpf || '',
    "Acompanhante 2 Email": data.companions[1]?.email || '',
    "Acompanhante 2 Telefone": data.companions[1]?.phone || '',

    "Acompanhante 3 Nome Completo": data.companions[2]?.name || '',
    "Acompanhante 3 RG": data.companions[2]?.rg || '',
    "Acompanhante 3 CPF": data.companions[2]?.cpf || '',
    "Acompanhante 3 Email": data.companions[2]?.email || '',
    "Acompanhante 3 Telefone": data.companions[2]?.phone || '',

    "Acompanhante 4 Nome Completo": data.companions[3]?.name || '',
    "Acompanhante 4 RG": data.companions[3]?.rg || '',
    "Acompanhante 4 CPF": data.companions[3]?.cpf || '',
    "Acompanhante 4 Email": data.companions[3]?.email || '',
    "Acompanhante 4 Telefone": data.companions[3]?.phone || '',

    "Acompanhante 5 Nome Completo": data.companions[4]?.name || '',
    "Acompanhante 5 RG": data.companions[4]?.rg || '',
    "Acompanhante 5 CPF": data.companions[4]?.cpf || '',
    "Acompanhante 5 Email": data.companions[4]?.email || '',
    "Acompanhante 5 Telefone": data.companions[4]?.phone || '',

    "Acompanhante 6 Nome Completo": data.companions[5]?.name || '',
    "Acompanhante 6 RG": data.companions[5]?.rg || '',
    "Acompanhante 6 CPF": data.companions[5]?.cpf || '',
    "Acompanhante 6 Email": data.companions[5]?.email || '',
    "Acompanhante 6 Telefone": data.companions[5]?.phone || '',

    "Acompanhante 7 Nome Completo": data.companions[6]?.name || '',
    "Acompanhante 7 RG": data.companions[6]?.rg || '',
    "Acompanhante 7 CPF": data.companions[6]?.cpf || '',
    "Acompanhante 7 Email": data.companions[6]?.email || '',
    "Acompanhante 7 Telefone": data.companions[6]?.phone || '',

    "Acompanhantes_Resumo": data.companions.length > 0 
      ? data.companions.map((c, i) => `${i+1}: ${c.name} (RG: ${c.rg || '-'}, CPF: ${c.cpf || '-'}, Email: ${c.email || '-'}, Tel: ${c.phone || '-'})`).join(' | ')
      : 'Nenhum',
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Pet: Nome": data.pet.name || 'N/A',
    "Pet: Raça": data.pet.breed || 'N/A',
    "Pet: Espécie": data.pet.species || 'N/A',
    "Pet: Peso": data.pet.weight || 'N/A',
    "Pet: Idade": data.pet.age || 'N/A',
    "Pet: Tamanho": data.pet.size || 'N/A',
    "Relatório_PDF": pdfOutput,
    "Doc: Frente": data.mainGuest.documentFile || '',
    "Foto: Selfie": data.mainGuest.selfieFile || '',
    "Doc: Vacina Pet": data.pet.vaccineFile || 'N/A',
    "Link_Boas_Vindas": data.propertyDetails?.welcomeLink || '',
    "Guest_Email": data.mainGuest.email,
    "Guest_Name": data.mainGuest.fullName,
    "Property_Name": data.propertyDetails?.name || 'N/A',
    "Welcome_Link": data.propertyDetails?.welcomeLink || ''
  };

  try {
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      body: JSON.stringify(payload)
    });
    
    return true;
  } catch (error) {
    console.error("Erro de rede no dispositivo móvel:", error);
    return false;
  }
};
