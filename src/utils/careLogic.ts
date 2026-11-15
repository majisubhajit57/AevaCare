import {
  MedicationItem,
  AlternativeMedicine,
  RoleProfile,
  TimeSlot,
  UserRole,
  FamilyMember,
  EmailDispatchLog,
} from '../types/care';

export interface AdherenceStats {
  totalDoses: number;
  takenCount: number;
  dueNowCount: number;
  upcomingCount: number;
  missedCount: number;
  adherencePercentage: number;
  lowOrOutStockCount: number;
  totalMonthlyRetailCost: number;
  totalMonthlyOnlineCost: number;
  totalMonthlySavings: number;
}

export interface PriceComparisonResult {
  retailMonthly: number;
  onlineMonthly: number;
  monthlySavings: number;
  annualSavings: number;
  savingsPercent: number;
}

export interface CompositionComparisonSummary {
  originalBrand: string;
  originalGeneric: string;
  originalPrimaryActive: string;
  OriginalStrengthMg: number;
  alternativeBrand: string;
  alternativeGeneric: string;
  alternativePrimaryActive: string;
  alternativeStrengthMg: number;
  strengthDifferenceMg: number;
  monthlyCostDelta: number;
  isCheaperOnline: boolean;
  goodBenefitsCount: number;
  sideEffectsCount: number;
}

export function verifyRolePasscode(
  selectedRole: UserRole,
  enteredPasscode: string,
  profiles: RoleProfile[]
): { valid: boolean; profile?: RoleProfile; errorMessage?: string } {
  const cleanCode = enteredPasscode.trim();
  if (cleanCode.length !== 4 || !/^\d{4}$/.test(cleanCode)) {
    return {
      valid: false,
      errorMessage: 'Please enter a 4-digit security passcode using the number pad.',
    };
  }

  const targetProfile = profiles.find((p) => p.id === selectedRole);
  if (!targetProfile) {
    return {
      valid: false,
      errorMessage: 'Selected care role was not found.',
    };
  }

  if (targetProfile.passcode === cleanCode) {
    return { valid: true, profile: targetProfile };
  }

  // Also check if they entered another valid role's passcode so we can guide them clearly
  const matchedOther = profiles.find((p) => p.passcode === cleanCode);
  if (matchedOther) {
    return {
      valid: true,
      profile: matchedOther,
    };
  }

  return {
    valid: false,
    errorMessage: `Incorrect passcode for ${targetProfile.name}. Try ${targetProfile.passcode} for instant demo access.`,
  };
}

export function calculatePriceSavings(
  retailPrice: number,
  onlineNonRetailPrice: number
): PriceComparisonResult {
  const retailMonthly = Math.max(0, Number(retailPrice.toFixed(2)));
  const onlineMonthly = Math.max(0, Number(onlineNonRetailPrice.toFixed(2)));
  const monthlySavings = Number(Math.max(0, retailMonthly - onlineMonthly).toFixed(2));
  const annualSavings = Number((monthlySavings * 12).toFixed(2));
  const savingsPercent =
    retailMonthly > 0 ? Math.round((monthlySavings / retailMonthly) * 100) : 0;

  return {
    retailMonthly,
    onlineMonthly,
    monthlySavings,
    annualSavings,
    savingsPercent,
  };
}

export function calculateAdherenceStats(medications: MedicationItem[]): AdherenceStats {
  const totalDoses = medications.length;
  if (totalDoses === 0) {
    return {
      totalDoses: 0,
      takenCount: 0,
      dueNowCount: 0,
      upcomingCount: 0,
      missedCount: 0,
      adherencePercentage: 100,
      lowOrOutStockCount: 0,
      totalMonthlyRetailCost: 0,
      totalMonthlyOnlineCost: 0,
      totalMonthlySavings: 0,
    };
  }

  let takenCount = 0;
  let dueNowCount = 0;
  let upcomingCount = 0;
  let missedCount = 0;
  let lowOrOutStockCount = 0;
  let totalMonthlyRetailCost = 0;
  let totalMonthlyOnlineCost = 0;

  for (const med of medications) {
    if (med.status === 'Taken') takenCount++;
    else if (med.status === 'Due Now') dueNowCount++;
    else if (med.status === 'Upcoming' || med.status === 'Snoozed') upcomingCount++;
    else if (med.status === 'Missed') missedCount++;

    if (
      med.localStockStatus !== 'In Stock' ||
      med.daysRemaining <= 7
    ) {
      lowOrOutStockCount++;
    }

    totalMonthlyRetailCost += med.retailPharmacyPrice;
    totalMonthlyOnlineCost += med.onlineNonRetailPrice;
  }

  // Adherence counts taken + on-track upcoming doses vs total, plus rewards confirming due doses
  const completedOrScheduledScore = takenCount + upcomingCount * 0.85 + dueNowCount * 0.5;
  const adherencePercentage = Math.min(
    100,
    Math.max(0, Math.round((completedOrScheduledScore / totalDoses) * 100))
  );

  return {
    totalDoses,
    takenCount,
    dueNowCount,
    upcomingCount,
    missedCount,
    adherencePercentage,
    lowOrOutStockCount,
    totalMonthlyRetailCost: Number(totalMonthlyRetailCost.toFixed(2)),
    totalMonthlyOnlineCost: Number(totalMonthlyOnlineCost.toFixed(2)),
    totalMonthlySavings: Number((totalMonthlyRetailCost - totalMonthlyOnlineCost).toFixed(2)),
  };
}

export function compareCompositions(
  med: MedicationItem,
  alt: AlternativeMedicine
): CompositionComparisonSummary {
  const origActive = med.composition[0] ?? {
    compound: med.genericName,
    strengthMg: 0,
  };
  const altActive = alt.composition[0] ?? {
    compound: alt.genericName,
    strengthMg: 0,
  };

  const monthlyCostDelta = Number(
    (alt.onlineNonRetailPrice - med.retailPharmacyPrice).toFixed(2)
  );

  return {
    originalBrand: med.brandName,
    originalGeneric: med.genericName,
    originalPrimaryActive: origActive.compound,
    OriginalStrengthMg: origActive.strengthMg,
    alternativeBrand: alt.brandName,
    alternativeGeneric: alt.genericName,
    alternativePrimaryActive: altActive.compound,
    alternativeStrengthMg: altActive.strengthMg,
    strengthDifferenceMg: Number((altActive.strengthMg - origActive.strengthMg).toFixed(2)),
    monthlyCostDelta,
    isCheaperOnline: alt.onlineNonRetailPrice < med.retailPharmacyPrice,
    goodBenefitsCount: alt.goodBenefits.length,
    sideEffectsCount: alt.sideEffectsWatch.length,
  };
}

export function filterMedicationsBySlot(
  medications: MedicationItem[],
  slot: TimeSlot | 'All',
  searchQuery: string = ''
): MedicationItem[] {
  const q = searchQuery.trim().toLowerCase();
  return medications.filter((med) => {
    const matchesSlot = slot === 'All' || med.timeSlot === slot;
    if (!matchesSlot) return false;
    if (!q) return true;
    return (
      med.brandName.toLowerCase().includes(q) ||
      med.genericName.toLowerCase().includes(q) ||
      med.whatItIsFor.toLowerCase().includes(q) ||
      med.timeSlot.toLowerCase().includes(q)
    );
  });
}

export function createProactiveEmailEntry(
  medications: MedicationItem[],
  familyMembers: FamilyMember[],
  customNote?: string
): EmailDispatchLog {
  const dueMeds = medications.filter((m) => m.status === 'Due Now' || m.status === 'Missed');
  const recipients = familyMembers
    .filter((f) => f.notifyMissedDose || f.notifyAppointments)
    .map((f) => f.email)
    .join(', ');
  const recipientNames = familyMembers
    .filter((f) => f.notifyMissedDose || f.notifyAppointments)
    .map((f) => f.name)
    .join(' & ');

  const medNames =
    dueMeds.length > 0
      ? dueMeds.map((m) => `${m.brandName} (${m.genericName} ${m.dosage})`).join(', ')
      : 'All scheduled doses confirmed on time';

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: `log-${Date.now()}`,
    timestamp: `Today · ${nowStr}`,
    recipientName: recipientNames || 'Authorized Family Circle',
    recipientEmail: recipients || 'caretaker@gmail.com',
    subject:
      dueMeds.length > 0
        ? `Proactive Care Reminder: ${dueMeds.length} Dose(s) Due (${dueMeds[0].brandName})`
        : 'All Daily Doses Completed — Daily Care Summary',
    summary:
      customNote ||
      `Automated AevaCare email sent to authorized family circle. Status: ${medNames}.`,
    category: dueMeds.length > 0 ? 'Missed Dose Alert' : 'Upcoming Dose Reminder',
    status: 'Delivered',
  };
}

export function filterDiseaseDietProfiles<
  T extends {
    id: string;
    organSystemTitle: string;
    diseaseConditions: string;
  },
>(profiles: T[], selectedId: string | 'all', searchQuery: string = ''): T[] {
  const q = searchQuery.trim().toLowerCase();
  return profiles.filter((p) => {
    const matchesId = selectedId === 'all' || p.id === selectedId;
    if (!matchesId) return false;
    if (!q) return true;
    return (
      p.organSystemTitle.toLowerCase().includes(q) ||
      p.diseaseConditions.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });
}

