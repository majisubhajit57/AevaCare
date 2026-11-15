export type UserRole = 'elderly' | 'caretaker' | 'family';

export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening';

export type DoseStatus = 'Taken' | 'Due Now' | 'Upcoming' | 'Snoozed' | 'Missed';

export interface RoleProfile {
  id: UserRole;
  name: string;
  ageOrTitle: string;
  relationship: string;
  passcode: string;
  badgeText: string;
  whatItIsFor: string;
  capabilities: string[];
  email: string;
}

export interface ChemicalComponent {
  compound: string;
  strength: string;
  strengthMg: number;
  category: 'Active Pharmaceutical Ingredient' | 'Electrolyte Stabilizer' | 'Buffer / Binder';
  clinicalRole: string;
}

export interface AlternativeMedicine {
  id: string;
  brandName: string;
  genericName: string;
  dosage: string;
  purposeSummary: string;
  manufacturer: string;
  marketCapBillions: string;
  manufacturerReliabilityNote: string;
  stockStatus: 'In Stock Locally' | 'High Availability Online' | 'Limited Local Stock';
  retailPharmacyPrice: number;
  onlineNonRetailPrice: number;
  onlineOutletName: string;
  drugsComRating: string;
  composition: ChemicalComponent[];
  goodBenefits: string[];
  sideEffectsWatch: string[];
}

export interface MedicationItem {
  id: string;
  brandName: string;
  genericName: string;
  dosage: string;
  whatItIsFor: string;
  timeSlot: TimeSlot;
  scheduledTime: string;
  status: DoseStatus;
  takenAt?: string;
  pillAppearance: string;
  instructions: string;
  localPharmacyName: string;
  localStockStatus: 'In Stock' | 'Low Stock (Under 7 Days)' | 'Out of Stock at Local Pharmacy';
  daysRemaining: number;
  retailPharmacyPrice: number;
  onlineNonRetailPrice: number;
  onlineOutletName: string;
  manufacturer: string;
  marketCapBillions: string;
  manufacturerReliabilityNote: string;
  drugsComRating: string;
  composition: ChemicalComponent[];
  goodBenefits: string[];
  sideEffectsWatch: string[];
  alternatives: AlternativeMedicine[];
  activeAlternativeId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  role: string;
  avatar: string;
  canEditSchedule: boolean;
  notifyMissedDose: boolean;
  notifyAppointments: boolean;
}

export interface ReminderPreference {
  id: string;
  title: string;
  description: string;
  email: boolean;
  sms: boolean;
  voiceCall: boolean;
  smartSpeakerChime: boolean;
}

export interface AppointmentItem {
  id: string;
  title: string;
  careFocus: string;
  location: string;
  date: string;
  time: string;
  transportStatus: 'Ride Confirmed with Family' | 'Accessible Shuttle Booked' | 'Needs Family Confirmation';
  emailReminderSent: boolean;
  preparationChecklist: string;
}

export interface EmailDispatchLog {
  id: string;
  timestamp: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  summary: string;
  category: 'Missed Dose Alert' | 'Upcoming Dose Reminder' | 'Appointment Coordination' | 'Alternative Medicine Notice';
  status: 'Delivered' | 'Queued';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourceCitation?: string;
  highlightedMed?: string;
}
