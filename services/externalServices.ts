
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
    ["Espécie/Raça", `${data.pet.species || "-"} / ${data.pet.breed || "-"}`]
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

  const pdfBase64 = doc.output('datauristring');

  // 2. Preparar Payload para Planilha
  const payload = {
    "Data de Envio": new Date().toLocaleString('pt-BR'),
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
    "E-mail": data.mainGuest.email,
    "Telefone": data.mainGuest.phone,
    "Endereço": data.mainGuest.address,
    "Emergência: Nome": data.mainGuest.emergencyContactName || 'N/A',
    "Emergência: Telefone": data.mainGuest.emergencyContactPhone || 'N/A',
    "Emergência: Parentesco": data.mainGuest.emergencyContactRelationship || 'N/A',
    "Acompanhantes": data.companions.length > 0 
      ? data.companions.map((c, i) => `${i+1}: ${c.name} (Doc: ${c.documentNumber})`).join(' | ')
      : 'Nenhum',
    "Possui Pet?": data.pet.hasPet ? 'Sim' : 'Não',
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
