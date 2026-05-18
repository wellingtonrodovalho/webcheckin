
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

  // 1. Preparar o PDF
  const doc = new jsPDF();
  const title = "Relatório de Check-in - Wellington Rodovalho";
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

  const tableData = [
    ["Campo", "Valor"],
    ["Imóvel", data.propertyDetails?.name || 'N/A'],
    ["Endereço do Imóvel", data.propertyDetails?.address || 'N/A'],
    ["Check-in", data.reservation.startDate],
    ["Check-out", data.reservation.endDate],
    ["Hóspedes", data.reservation.guestCount.toString()],
    ["Valor Total", formatCurrency(data.reservation.totalValue)],
    ["Caução", formatCurrency(data.reservation.securityDepositValue || 0)],
    ["", ""],
    ["TÍTULAR", ""],
    ["Nome", data.mainGuest.fullName],
    ["CPF", data.mainGuest.cpf],
    ["RG", data.mainGuest.rg],
    ["Nacionalidade", data.mainGuest.nationality],
    ["Estado Civil", data.mainGuest.maritalStatus],
    ["Profissão", data.mainGuest.profession],
    ["E-mail", data.mainGuest.email],
    ["Telefone", data.mainGuest.phone],
    ["Endereço", data.mainGuest.address],
    ["", ""],
    ["CONTATO DE EMERGÊNCIA", ""],
    ["Nome", data.mainGuest.emergencyContactName || "-"],
    ["Telefone", data.mainGuest.emergencyContactPhone || "-"],
    ["Parentesco", data.mainGuest.emergencyContactRelationship || "-"],
    ["", ""],
    ["VEÍCULO", ""],
    ["Possui Veículo?", data.reservation.hasVehicle ? "Sim" : "Não"],
    ["Marca", data.reservation.vehicleBrand || "-"],
    ["Modelo", data.reservation.vehicleModel || "-"],
    ["Placa", data.reservation.vehiclePlate || "-"],
    ["", ""],
    ["PET", ""],
    ["Possui Pet?", data.pet.hasPet ? "Sim" : "Não"],
    ["Nome do Pet", data.pet.name || "-"],
    ["Espécie/Raça", `${data.pet.species || "-"} / ${data.pet.breed || "-"}`],
    ["Idade/Peso/Tamanho", `${data.pet.age || "-"} / ${data.pet.weight || "-"} / ${data.pet.size || "-"}`]
  ];

  if (data.companions.length > 0) {
    tableData.push(["", ""]);
    tableData.push(["ACOMPANHANTES", ""]);
    data.companions.forEach((c, i) => {
      tableData.push([`Acompanhante ${i + 1}`, `${c.name} (DOC: ${c.documentNumber})`]);
    });
  }

  autoTable(doc, {
    startY: 35,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 9 }
  });

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
  ? data.companions.map((c, i) => `${i+1}. ${c.name} (Doc: ${c.documentNumber})`).join('\n')
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
    "Emergência: Nome": data.mainGuest.emergencyContactName || 'N/A',
    "Emergência: Telefone": data.mainGuest.emergencyContactPhone || 'N/A',
    "Emergência: Parentesco": data.mainGuest.emergencyContactRelationship || 'N/A',
    // Colunas individuais para acompanhantes
    "Acompanhante 1 Nome": data.companions[0]?.name || '',
    "Acompanhante 1 Documento": data.companions[0]?.documentNumber || '',
    "Acompanhante 2 Nome": data.companions[1]?.name || '',
    "Acompanhante 2 Documento": data.companions[1]?.documentNumber || '',
    "Acompanhante 3 Nome": data.companions[2]?.name || '',
    "Acompanhante 3 Documento": data.companions[2]?.documentNumber || '',
    "Acompanhante 4 Nome": data.companions[3]?.name || '',
    "Acompanhante 4 Documento": data.companions[3]?.documentNumber || '',
    "Acompanhante 5 Nome": data.companions[4]?.name || '',
    "Acompanhante 5 Documento": data.companions[4]?.documentNumber || '',
    "Acompanhante 6 Nome": data.companions[5]?.name || '',
    "Acompanhante 6 Documento": data.companions[5]?.documentNumber || '',
    "Acompanhante 7 Nome": data.companions[6]?.name || '',
    "Acompanhante 7 Documento": data.companions[6]?.documentNumber || '',
    "Acompanhantes_Resumo": data.companions.length > 0 
      ? data.companions.map((c, i) => `${i+1}: ${c.name} (Doc: ${c.documentNumber})`).join(' | ')
      : 'Nenhum',
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
    "Pet: Nome": data.pet.name || 'N/A',
    "Pet: Raça": data.pet.breed || 'N/A',
    "Pet: Espécie": data.pet.species || 'N/A',
    "Pet: Peso": data.pet.weight || 'N/A',
    "Pet: Idade": data.pet.age || 'N/A',
    "Pet: Tamanho": data.pet.size || 'N/A',
    "Relatório_PDF": pdfBase64,
    "Doc: Frente": data.mainGuest.documentFile || '',
    "Foto: Selfie": data.mainGuest.selfieFile || '',
    "Doc: Vacina Pet": data.pet.vaccineFile || 'N/A'
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
