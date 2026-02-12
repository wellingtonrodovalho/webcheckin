
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
  propertyAddress: string;
  dailyRate: number;
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
