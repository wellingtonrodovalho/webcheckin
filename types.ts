
export interface Property {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  ownerCpf: string;
  ownerStatus: string;
  ownerProfession: string;
  petAllowed: boolean;
  capacity: number;
}

export const PROPERTIES: Property[] = [
  {
    id: "1",
    name: "Resort do LAGO - Caldas Novas",
    address: "Av. Caminho do Lago, Gleba 10D, Unidade 207 C, Caldas Novas-GO, 75.680-001",
    ownerName: "Rosiani Ipolita Leão",
    ownerCpf: "995.383.856-91",
    ownerStatus: "Solteira",
    ownerProfession: "Pecuarista",
    petAllowed: false,
    capacity: 5
  },
  {
    id: "2",
    name: "Resort do LAGO - Caldas Novas",
    address: "Av. Caminho do Lago, Gleba 10D, Unidade 408 D, Caldas Novas-GO, 75.680-001",
    ownerName: "Rosiani Ipolita Leão",
    ownerCpf: "995.383.856-91",
    ownerStatus: "Solteira",
    ownerProfession: "Pecuarista",
    petAllowed: false,
    capacity: 8
  },
  {
    id: "3",
    name: "Flat no Crystal Place, a 6 min do Flamboyant",
    address: "Avenida Edmundo P. de Abreu, 31, Apartamento 1609, Setor Pedro Ludovico, Goiânia-GO, 74823-030",
    ownerName: "Wellington Rodovalho Fonseca",
    ownerCpf: "269.462.701-34",
    ownerStatus: "Casado",
    ownerProfession: "Corretor de Imóveis",
    petAllowed: true,
    capacity: 4
  },
  {
    id: "4",
    name: "Casa da vovó, 3 quartos, jardim e 2 vagas de garagem",
    address: "Rua Santa Gertrudes, 26, Setor Coimbra, Goiânia-GO, 74535-420",
    ownerName: "Cristiane Argenta Camelo",
    ownerCpf: "592.216.581-04",
    ownerStatus: "União estável",
    ownerProfession: "Administradora",
    petAllowed: true,
    capacity: 6
  },
  {
    id: "5",
    name: "Studio A no Bueno, próximo ao Hospital Neurológico",
    address: "Rua T-45, 61, Ap 101A, Setor Bueno, Goiânia-GO, 74210-160",
    ownerName: "Rosiani Ipolita Leão",
    ownerCpf: "995.383.856-91",
    ownerStatus: "Solteira",
    ownerProfession: "Pecuarista",
    petAllowed: false,
    capacity: 4
  },
  {
    id: "6",
    name: "Studio B no Bueno, próximo ao Hospital Neurológico",
    address: "Rua T-45, 61, Ap 101B, Setor Bueno, Goiânia-GO, 74210-160",
    ownerName: "Rosiani Ipolita Leão",
    ownerCpf: "995.383.856-91",
    ownerStatus: "Solteira",
    ownerProfession: "Pecuarista",
    petAllowed: false,
    capacity: 3
  },
  {
    id: "7",
    name: "Apto 2 suítes no Bueno, perto do Goiânia Shopping",
    address: "Rua T-47, 173, Ap 410, Bloco C, Setor Bueno, Goiânia-GO, 74210-180",
    ownerName: "Wellington Rodovalho Fonseca",
    ownerCpf: "269.462.701-34",
    ownerStatus: "Casado",
    ownerProfession: "Corretor de Imóveis",
    petAllowed: false,
    capacity: 6
  }
];

export interface PetData {
  hasPet: boolean;
  name?: string;
  breed?: string;
  weight?: string;
  age?: string;
  species?: string;
  size?: string;
  vaccineFile?: string; // Base64
}

export interface Companion {
  id: string;
  name: string;
  documentNumber: string;
  documentFile?: string; // Base64
}

export interface ReservationData {
  startDate: string;
  endDate: string;
  guestCount: number;
  reasonForVisit: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  propertyId: string;
  totalValue: number;
}

export interface MainGuest {
  fullName: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string;
  address: string;
  documentFile?: string; // Base64
  selfieFile?: string; // Base64 for LGPD/Identity verification
}

export interface FullFormData {
  reservation: ReservationData;
  pet: PetData;
  mainGuest: MainGuest;
  companions: Companion[];
  contractText?: string;
  lgpdConsent: boolean;
}

export enum FormStep {
  CONSENT = -1,
  RESERVATION = 0,
  MAIN_GUEST = 1,
  COMPANIONS = 2,
  CONTRACT_PREVIEW = 3,
  SUCCESS = 4
}
