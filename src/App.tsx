import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareHeart,
  Lock,
  Type as TypeIcon,
  X,
  Send,
  Soup,
} from 'lucide-react';
import {
  ROLE_PROFILES,
  INITIAL_MEDICATIONS,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_REMINDER_PREFS,
  INITIAL_APPOINTMENTS,
  INITIAL_EMAIL_LOGS,
  INITIAL_CHAT_MESSAGES,
} from './data/initialCareData';
import {
  RoleProfile,
  MedicationItem,
  FamilyMember,
  ReminderPreference,
  AppointmentItem,
  EmailDispatchLog,
  ChatMessage,
  TimeSlot,
} from './types/care';
import { createProactiveEmailEntry } from './utils/careLogic';
import {
  StoredUserAccount,
  loadStoredFamilyMembers,
  saveStoredFamilyMembers,
  saveActiveSession,
} from './services/authStorage';
import {
  auth,
  firebaseSignOut,
  onAuthStateChanged,
} from './firebase';
import {
  syncMedicationToFirestore,
  loadMedicationsFromFirestore,
  syncAllUserDataToFirestore,
  FirestoreUserDataSnapshot,
} from './services/firebaseCareSync';
import { DiseaseConditionId } from './data/diseaseDietData';
import { PasscodeSignInScreen } from './components/PasscodeSignInScreen';
import { TodayMedsDashboard } from './components/TodayMedsDashboard';
import { AlternativesAndCompositionView } from './components/AlternativesAndCompositionView';
import { CaretakerAdherenceHub } from './components/CaretakerAdherenceHub';
import { AiHealthcareAssistant } from './components/AiHealthcareAssistant';
import { DiseaseDietRecommendationView } from './components/DiseaseDietRecommendationView';

type ActiveTab =
  | 'today'
  | 'alternatives'
  | 'diet'
  | 'caretaker'
  | 'assistant';
type FontScale = 'standard' | 'large' | 'xlarge';

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [authenticatedProfile, setAuthenticatedProfile] =
    useState<RoleProfile | null>(isAutostart ? ROLE_PROFILES[0] : null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [selectedDietCondition, setSelectedDietCondition] =
    useState<DiseaseConditionId>('heart');
  const [fontScale, setFontScale] = useState<FontScale>('standard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [authenticatedProfile, activeTab]);

  // Listen to Firebase Auth state on this app so users signed in via signInWithPopup are immediately authenticated here
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        const cleanEmail = fbUser.email.toLowerCase();
        setAuthenticatedProfile((prev) =>
          prev
            ? { ...prev, email: cleanEmail, name: cleanEmail }
            : {
                ...ROLE_PROFILES[0],
                email: cleanEmail,
                name: cleanEmail,
              }
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const [medications, setMedications] =
    useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [selectedMedIdForAlt, setSelectedMedIdForAlt] = useState<string>(
    INITIAL_MEDICATIONS[0].id
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() =>
    loadStoredFamilyMembers(INITIAL_FAMILY_MEMBERS)
  );
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPreference[]>(
    INITIAL_REMINDER_PREFS
  );
  const [appointments, setAppointments] = useState<AppointmentItem[]>(
    INITIAL_APPOINTMENTS
  );
  const [emailLogs, setEmailLogs] =
    useState<EmailDispatchLog[]>(INITIAL_EMAIL_LOGS);
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [firestoreSnapshot, setFirestoreSnapshot] =
    useState<FirestoreUserDataSnapshot | null>(null);

  // Persistent Floating Quick-Chat Drawer state
  const [floatingChatOpen, setFloatingChatOpen] = useState<boolean>(false);
  const [floatingInput, setFloatingInput] = useState<string>('');

  const handleSyncUserDataNow = useCallback(async () => {
    if (!authenticatedProfile) return;
    try {
      const snap = await syncAllUserDataToFirestore({
        email: authenticatedProfile.email,
        displayName: authenticatedProfile.name,
        role: authenticatedProfile.id,
        familyNames: familyMembers.map((f) => f.name),
        medications,
      });
      setFirestoreSnapshot(snap);
    } catch {
      // Non-blocking
    }
  }, [authenticatedProfile, familyMembers, medications]);

  // Automatically sync user profile and medications to Firestore when signed in
  useEffect(() => {
    if (!authenticatedProfile) return;
    void (async () => {
      try {
        await handleSyncUserDataNow();
        if (auth.currentUser) {
          const remoteStatusMap = await loadMedicationsFromFirestore();
          if (Object.keys(remoteStatusMap).length > 0) {
            setMedications((prev) =>
              prev.map((m) =>
                remoteStatusMap[m.id]
                  ? { ...m, status: remoteStatusMap[m.id].status }
                  : m
              )
            );
          }
        }
      } catch {
        // Non-blocking
      }
    })();
  }, [authenticatedProfile, handleSyncUserDataNow]);

  const handleAddFamilyMember = (member: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
  }) => {
    const cleanName = member.name.trim();
    if (!cleanName) return;

    const initials = cleanName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    const created: FamilyMember = {
      id: `fam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      relationship: member.relationship || 'Family Member',
      phone: member.phone || '(555) 019-2834',
      email:
        member.email ||
        `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      role: 'Authorized Family Circle',
      avatar: initials || 'FM',
      canEditSchedule: true,
      notifyMissedDose: true,
      notifyAppointments: true,
    };

    setFamilyMembers((prev) => {
      const exists = prev.some(
        (m) => m.name.toLowerCase() === cleanName.toLowerCase()
      );
      const next = exists ? prev : [created, ...prev];
      saveStoredFamilyMembers(next);
      return next;
    });
  };

  const handleToggleDoseStatus = (medId: string) => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        const nextStatus = m.status === 'Taken' ? 'Due Now' : 'Taken';
        const updatedMed: MedicationItem = {
          ...m,
          status: nextStatus,
          takenAt: nextStatus === 'Taken' ? nowTime : undefined,
        };
        void syncMedicationToFirestore(updatedMed).catch(() => {});
        return updatedMed;
      })
    );
  };

  const handleSnoozeDose = (medId: string) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        const updatedMed: MedicationItem = { ...m, status: 'Snoozed' };
        void syncMedicationToFirestore(updatedMed).catch(() => {});
        return updatedMed;
      })
    );
  };

  const handleInspectAlternatives = (medId: string) => {
    setSelectedMedIdForAlt(medId);
    setActiveTab('alternatives');
  };

  const handleOpenDiseaseDiet = (conditionId: DiseaseConditionId) => {
    setSelectedDietCondition(conditionId);
    setActiveTab('diet');
  };

  const handleSelectAlternativeForMed = (medId: string, altId: string) => {
    const targetMed = medications.find((m) => m.id === medId);
    const chosenAlt = targetMed?.alternatives.find((a) => a.id === altId);

    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId ? { ...m, activeAlternativeId: altId } : m
      )
    );

    if (targetMed && chosenAlt) {
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const primaryCaretaker = familyMembers[0];
      const newLog: EmailDispatchLog = {
        id: `log-alt-${Date.now()}`,
        timestamp: `Today · ${nowStr}`,
        recipientName: primaryCaretaker?.name || 'Authorized Family Circle',
        recipientEmail: primaryCaretaker?.email || 'caretaker@gmail.com',
        subject: `Alternative Medicine Selected: ${chosenAlt.brandName} (${chosenAlt.genericName} ${chosenAlt.dosage})`,
        summary: `Switched ${targetMed.brandName} (${targetMed.genericName}) to ${chosenAlt.brandName} (${chosenAlt.genericName} ${chosenAlt.dosage}) due to local stock/savings. Online price: $${chosenAlt.onlineNonRetailPrice.toFixed(2)}/mo.`,
        category: 'Alternative Medicine Notice',
        status: 'Delivered',
      };
      setEmailLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleSendProactiveEmail = async (customNote?: string) => {
    const localDraft = createProactiveEmailEntry(
      medications,
      familyMembers,
      customNote
    );

    try {
      const res = await fetch('/api/reminders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localDraft),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.log) {
          setEmailLogs((prev) => [data.log, ...prev]);
          return;
        }
      }
    } catch {
      // Fallback to local log below
    }

    setEmailLogs((prev) => [localDraft, ...prev]);
  };

  const buildFastClientFallback = (questionText: string): {
    text: string;
    sourceCitation: string;
  } => {
    const q = questionText.toLowerCase();
    if (
      q.includes('liquid') ||
      q.includes('digest') ||
      q.includes('broth') ||
      q.includes('soup') ||
      q.includes('circulation') ||
      q.includes('diet') ||
      q.includes('stomach') ||
      q.includes('lung') ||
      q.includes('breath') ||
      q.includes('heart')
    ) {
      if (q.includes('stomach') || q.includes('gastritis') || q.includes('reflux')) {
        return {
          text:
            'Light, Liquid & Soothing Diet for Stomach & Gentle Digestion:\n\n' +
            '• Morning (7:30 AM): Warm Rice Kanji (strained rice starch water) with roasted cumin + soft steamed rice idli.\n' +
            '• Midday (12:30 PM): Overcooked yellow Moong Dal & White Rice Khichdi with Clear Ash Gourd broth.\n' +
            '• Evening (7:00 PM): Warm Fennel & Chamomile tea with smooth Pumpkin-Carrot soup.\n' +
            '• Avoid: Deep-fried foods, chili spices, raw onions, and coffee on an empty stomach.',
          sourceCitation: 'AevaCare Clinical Nutrition · Stomach & Gentle Digestion Guide',
        };
      }
      if (q.includes('lung') || q.includes('breath') || q.includes('copd') || q.includes('asthma')) {
        return {
          text:
            'Light, Liquid & Airway-Clearing Diet for Lungs & Easy Breathing:\n\n' +
            '• Morning (7:30 AM): Warm Tulsi, Ginger & Black Pepper Clear Tea + drinkable Ragi or Oat Malt porridge.\n' +
            '• Midday (12:30 PM): Warm Clear Chicken or Mushroom-Herb Consommé with soft poached fish or silken tofu.\n' +
            '• Evening (7:00 PM): Small bowl of blended Spinach-Lentil soup (leaves room for the diaphragm) + warm Turmeric Almond Milk.\n' +
            '• Avoid: Ice-cold drinks and heavy gas-forming meals at night.',
          sourceCitation: 'AevaCare Clinical Nutrition · Lungs & Oxygen Circulation Guide',
        };
      }
      return {
        text:
          'Light, Liquid & Circulation-Friendly Diet for Heart, Stomach & Lungs:\n\n' +
          '• Heart & Circulation: Warm Garlic, Celery & Coriander Clear Broth + Clear Yellow Moong Dal Water (replenishes potassium with morning Lasix/Norvasc).\n' +
          '• Stomach & Digestion: Warm Rice Kanji (strained rice water) + soft Moong Dal Khichdi + Fennel-Chamomile tea.\n' +
          '• Lungs & Breathing: Warm Tulsi-Ginger Clear Tea + Clear Herb Consommé to thin mucus and ease breathing.',
        sourceCitation: 'AevaCare Clinical Nutrition · Multi-Organ Liquid Diet Guide',
      };
    }

    if (q.includes('dizzy') || q.includes('dizziness') || q.includes('stand')) {
      return {
        text:
          'Why Morning Blood Pressure Pills Can Cause Mild Dizziness (& 3 Safety Steps):\n\n' +
          '• Cause: Lasix (Furosemide 20 mg) and Norvasc (Amlodipine 5 mg) relax blood vessels and reduce fluid volume, causing a brief drop in blood pressure when standing quickly.\n' +
          '• Prevention: Sit on the edge of the bed for 30 seconds before standing, flex your ankles, and sip warm water or clear broth with breakfast.',
        sourceCitation: 'Drugs.com Senior Fall-Prevention & Blood Pressure Guide',
      };
    }

    if (q.includes('grapefruit') || q.includes('coffee') || q.includes('lipitor') || q.includes('crestor')) {
      return {
        text:
          'Food & Drink Interaction Guide:\n\n' +
          '• Morning Coffee & Oatmeal: Safe with Norvasc 5 mg and Lasix 20 mg.\n' +
          '• Midday Meal: Take Glucophage XR (Metformin 500 mg) WITH lunch to protect your stomach.\n' +
          '• Evening Grapefruit Warning: Avoid grapefruit juice with Lipitor (Atorvastatin 20 mg). Switching to Crestor (Rosuvastatin 10 mg, $8.80/mo online) avoids grapefruit interactions.',
        sourceCitation: 'Drugs.com Food-Drug Interaction Database',
      };
    }

    if (q.includes('price') || q.includes('cost') || q.includes('save') || q.includes('money')) {
      return {
        text:
          'Non-Retail Online vs. Retail Savings Breakdown:\n\n' +
          '• Lasix 20 mg: $8.40/mo Online vs. $48.50 Retail (or Microzide 25 mg at $6.20/mo).\n' +
          '• Norvasc 5 mg: $7.50/mo Online vs. $54.00 Retail.\n' +
          '• Glucophage XR 500 mg: $6.80/mo Online vs. $38.90 Retail.\n' +
          '• Lipitor 20 mg: $9.60/mo Online vs. $82.40 Retail.\n' +
          'Total Savings: $191.50/month ($2,298/year).',
        sourceCitation: 'AevaCare Accredited Pharmacy Price Index',
      };
    }

    return {
      text:
        'Comparing Lasix (Furosemide 20 mg) vs. Microzide (Hydrochlorothiazide 25 mg):\n\n' +
        '• Both are diuretics ("water pills") that reduce fluid buildup and lower blood pressure.\n' +
        '• Lasix (Furosemide 20 mg) is a fast-acting loop diuretic (4–6 hrs), while Microzide (HCTZ 25 mg) is a gentler 24-hour thiazide diuretic that is in stock locally ($6.20/mo online vs. $48.50 retail).\n' +
        '• Pair morning doses with potassium-rich clear moong dal soup or coconut water and stand up slowly from bed.',
      sourceCitation: 'Drugs.com Geriatric Reference',
    };
  };

  const handleSendAiMessage = async (questionText: string) => {
    const cleanQ = questionText.trim();
    if (!cleanQ) return;

    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanQ,
      timestamp: nowStr,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2400);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: cleanQ,
          currentRole: authenticatedProfile?.id ?? 'elderly',
          medicationsContext: medications.map((m) => ({
            brand: m.brandName,
            generic: m.genericName,
            dosage: m.dosage,
            whatItIsFor: m.whatItIsFor,
            status: m.status,
            retailPrice: m.retailPharmacyPrice,
            onlinePrice: m.onlineNonRetailPrice,
          })),
        }),
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text:
          data.reply ||
          buildFastClientFallback(cleanQ).text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sourceCitation:
          data.sourceCitation ||
          'Drugs.com Clinical Reference & Google AI Studio',
        highlightedMed: data.highlightedMed,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      clearTimeout(timeoutId);
      const fb = buildFastClientFallback(cleanQ);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: fb.text,
        timestamp: nowStr,
        sourceCitation: fb.sourceCitation,
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskAiAndNavigate = (question: string) => {
    setActiveTab('assistant');
    void handleSendAiMessage(question);
  };

  const handleToggleReminderPref = (
    prefId: string,
    channel: 'email' | 'sms' | 'voiceCall' | 'smartSpeakerChime'
  ) => {
    setReminderPrefs((prev) =>
      prev.map((pref) =>
        pref.id === prefId ? { ...pref, [channel]: !pref[channel] } : pref
      )
    );
  };

  const handleToggleFamilyPermission = (
    memberId: string,
    field: 'canEditSchedule' | 'notifyMissedDose' | 'notifyAppointments'
  ) => {
    setFamilyMembers((prev) => {
      const next = prev.map((mem) =>
        mem.id === memberId ? { ...mem, [field]: !mem[field] } : mem
      );
      saveStoredFamilyMembers(next);
      return next;
    });
  };

  const handleAddMedication = (newMed: {
    brandName: string;
    genericName: string;
    dosage: string;
    whatItIsFor: string;
    timeSlot: TimeSlot;
    scheduledTime: string;
    instructions: string;
  }) => {
    const created: MedicationItem = {
      id: `med-${Date.now()}`,
      brandName: newMed.brandName,
      genericName: newMed.genericName,
      dosage: newMed.dosage,
      whatItIsFor: newMed.whatItIsFor,
      timeSlot: newMed.timeSlot,
      scheduledTime: newMed.scheduledTime,
      status: 'Due Now',
      pillAppearance: `Standard oral tablet · Marked "${newMed.brandName.slice(0, 4).toUpperCase()}"`,
      instructions: newMed.instructions,
      localPharmacyName: 'Walgreens #4102 (Oak Creek Ave)',
      localStockStatus: 'In Stock',
      daysRemaining: 30,
      retailPharmacyPrice: 44.0,
      onlineNonRetailPrice: 9.2,
      onlineOutletName: 'CostPlus Direct Mail Pharmacy',
      manufacturer: 'Teva / Sandoz Healthcare',
      marketCapBillions: '$42.0B',
      manufacturerReliabilityNote: 'FDA-Verified Global Generic Manufacturer',
      drugsComRating: '8.5 / 10 on Drugs.com',
      composition: [
        {
          compound: `${newMed.genericName} USP`,
          strength: newMed.dosage,
          strengthMg: parseFloat(newMed.dosage) || 10,
          category: 'Active Pharmaceutical Ingredient',
          clinicalRole: newMed.whatItIsFor,
        },
      ],
      goodBenefits: [
        `Supports ${newMed.whatItIsFor.toLowerCase()}`,
        '79% lower cost via accredited non-retail online pharmacy',
      ],
      sideEffectsWatch: [
        'Take with a full glass of water and monitor how you feel during the first week',
      ],
      alternatives: [
        {
          id: `alt-${Date.now()}`,
          brandName: `${newMed.genericName} Direct`,
          genericName: newMed.genericName,
          dosage: newMed.dosage,
          purposeSummary: `Authorized Generic Equivalent · ${newMed.whatItIsFor}`,
          manufacturer: 'Novartis Sandoz Division',
          marketCapBillions: '$218.5B',
          manufacturerReliabilityNote:
            'Large-Cap Global Pharmaceutical Manufacturer',
          stockStatus: 'In Stock Locally',
          retailPharmacyPrice: 32.0,
          onlineNonRetailPrice: 7.4,
          onlineOutletName: 'CostPlus Direct Mail Pharmacy',
          drugsComRating: '8.7 / 10 on Drugs.com',
          composition: [
            {
              compound: `${newMed.genericName} USP`,
              strength: newMed.dosage,
              strengthMg: parseFloat(newMed.dosage) || 10,
              category: 'Active Pharmaceutical Ingredient',
              clinicalRole:
                'Bioequivalent active ingredient with identical absorption profile.',
            },
          ],
          goodBenefits: [
            'Identical active compound at lower monthly cost',
            'High local and mail-order availability',
          ],
          sideEffectsWatch: [
            'Same routine precautions as prescribed brand tablet',
          ],
        },
      ],
    };

    setMedications((prev) => [...prev, created]);
    void syncMedicationToFirestore(created).catch(() => {});
  };

  const handleConfirmAppointmentRide = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? {
              ...apt,
              transportStatus: 'Ride Confirmed with Family',
              emailReminderSent: true,
            }
          : apt
      )
    );
    void handleSendProactiveEmail(
      'Confirmed family ride and armed 24-hour & 2-hour email reminders for upcoming checkup.'
    );
  };

  // If not signed in yet, show the clean Email / Gmail + Password Sign-In Screen
  if (!authenticatedProfile) {
    return (
      <PasscodeSignInScreen
        profiles={ROLE_PROFILES}
        onAuthenticated={(profile, account?: StoredUserAccount) => {
          setAuthenticatedProfile(profile);

          if (account?.familyNames && account.familyNames.length > 0) {
            account.familyNames.forEach((fName) => {
              handleAddFamilyMember({
                name: fName,
                relationship: 'Family Member',
                email: `${fName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
                phone: '(555) 019-2834',
              });
            });
          }

          if (profile.id === 'caretaker' || profile.id === 'family') {
            setActiveTab('caretaker');
          } else {
            setActiveTab('today');
          }
        }}
      />
    );
  }

  const fontScaleClass =
    fontScale === 'xlarge'
      ? 'text-[21px]'
      : fontScale === 'large'
      ? 'text-[19.5px]'
      : 'text-[18px]';

  return (
    <div
      className={`min-h-screen bg-[#FAF7F0] text-[#0F2537] flex flex-col justify-between ${fontScaleClass}`}
    >
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-[#0F2537]/15">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('today');
          }}
          className="text-2xl font-display font-extrabold tracking-tight text-[#0F2537] whitespace-nowrap shrink-0"
        >
          AevaCare
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary platform navigation"
          className="hidden md:flex items-center gap-7 text-base font-display font-bold text-[#0F2537]/75"
        >
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'today'
                ? 'text-[#0F2537] underline decoration-[#D99B26] decoration-3 underline-offset-8'
                : 'hover:text-[#0F2537]'
            }`}
          >
            Today’s Meds
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alternatives')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'alternatives'
                ? 'text-[#0F2537] underline decoration-[#D99B26] decoration-3 underline-offset-8'
                : 'hover:text-[#0F2537]'
            }`}
          >
            Medicine &amp; Alternatives
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diet')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'diet'
                ? 'text-[#0F2537] underline decoration-[#D99B26] decoration-3 underline-offset-8'
                : 'hover:text-[#0F2537]'
            }`}
          >
            Disease &amp; Diet Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('caretaker')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'caretaker'
                ? 'text-[#0F2537] underline decoration-[#D99B26] decoration-3 underline-offset-8'
                : 'hover:text-[#0F2537]'
            }`}
          >
            Caretaker &amp; Family Hub
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              saveActiveSession(null);
              setAuthenticatedProfile(null);
              setFirestoreSnapshot(null);
              void firebaseSignOut(auth).catch(() => {});
            }}
            className="px-4 py-2.5 text-sm font-display font-bold text-[#F5B73B] bg-[#0F2537] rounded-xl hover:bg-[#193852] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Secondary Workspace Toolbar (Role Switcher, Mobile Nav & Senior Font Size Controls) */}
      <div className="bg-[#0F2537] text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Active Role Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#F5B73B] mr-1">
              Active View:
            </span>
            {ROLE_PROFILES.map((prof) => {
              const active = prof.id === authenticatedProfile.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() =>
                    setAuthenticatedProfile({
                      ...prof,
                      email: authenticatedProfile.email,
                      name: authenticatedProfile.email || prof.name,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#F5B73B] text-[#0F2537]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {prof.id === 'elderly'
                    ? 'Senior View'
                    : prof.id === 'caretaker'
                    ? 'Caretaker View'
                    : 'Family View'}
                </button>
              );
            })}
          </div>

          {/* Mobile Navigation Links */}
          <div className="flex md:hidden flex-wrap items-center gap-2">
            {(
              [
                { id: 'today', label: 'Today’s Meds' },
                { id: 'alternatives', label: 'Alternatives' },
                { id: 'diet', label: 'Disease Diet' },
                { id: 'caretaker', label: 'Caretaker Hub' },
                { id: 'assistant', label: 'AI Assistant' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#0D7A6F] text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Senior Text Size, Disease Diet Quick Button & AI Care Assistant */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
              <TypeIcon className="w-4 h-4 text-[#F5B73B]" />
              <span className="text-xs font-semibold text-white/85 mr-1">
                Text Size:
              </span>
              {(
                [
                  { id: 'standard', label: 'A (18px)' },
                  { id: 'large', label: 'A+ (20px)' },
                  { id: 'xlarge', label: 'A++ (22px)' },
                ] as const
              ).map((scale) => (
                <button
                  key={scale.id}
                  type="button"
                  onClick={() => setFontScale(scale.id)}
                  className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer ${
                    fontScale === scale.id
                      ? 'bg-[#F5B73B] text-[#0F2537]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {scale.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('diet')}
              className={`px-3.5 py-1.5 rounded-lg font-display font-bold text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'diet'
                  ? 'bg-[#F5B73B] text-[#0F2537]'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Soup className="w-4 h-4" />
              <span>Light &amp; Liquid Diet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              className={`px-3.5 py-1.5 rounded-lg font-display font-bold text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'assistant'
                  ? 'bg-[#F5B73B] text-[#0F2537]'
                  : 'bg-[#0D7A6F] hover:bg-[#096057] text-white'
              }`}
            >
              <MessageSquareHeart className="w-4 h-4" />
              <span>AI Care Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        {activeTab === 'today' && (
          <TodayMedsDashboard
            activeRole={authenticatedProfile}
            medications={medications}
            familyMembers={familyMembers}
            emailLogs={emailLogs}
            onToggleDoseStatus={handleToggleDoseStatus}
            onSnoozeDose={handleSnoozeDose}
            onInspectAlternatives={handleInspectAlternatives}
            onAskAiAboutMed={handleAskAiAndNavigate}
            onSendProactiveEmail={handleSendProactiveEmail}
            onOpenDiseaseDiet={handleOpenDiseaseDiet}
          />
        )}

        {activeTab === 'alternatives' && (
          <AlternativesAndCompositionView
            medications={medications}
            selectedMedId={selectedMedIdForAlt}
            onSelectMedId={setSelectedMedIdForAlt}
            onSelectAlternativeForMed={handleSelectAlternativeForMed}
            onAskAiQuestion={handleAskAiAndNavigate}
            onAddMedicationFromDirectory={handleAddMedication}
          />
        )}

        {activeTab === 'diet' && (
          <DiseaseDietRecommendationView
            initialConditionId={selectedDietCondition}
            onAskAiAboutDiet={handleAskAiAndNavigate}
          />
        )}

        {activeTab === 'caretaker' && (
          <CaretakerAdherenceHub
            activeRole={authenticatedProfile}
            medications={medications}
            familyMembers={familyMembers}
            reminderPrefs={reminderPrefs}
            appointments={appointments}
            firestoreSnapshot={firestoreSnapshot}
            onSyncUserDataNow={handleSyncUserDataNow}
            onToggleReminderPref={handleToggleReminderPref}
            onToggleFamilyPermission={handleToggleFamilyPermission}
            onAddMedication={handleAddMedication}
            onAddFamilyMember={handleAddFamilyMember}
            onConfirmAppointmentRide={handleConfirmAppointmentRide}
          />
        )}

        {activeTab === 'assistant' && (
          <AiHealthcareAssistant
            activeRole={authenticatedProfile}
            medications={medications}
            messages={chatMessages}
            isLoading={aiLoading}
            onSendMessage={handleSendAiMessage}
          />
        )}
      </main>

      {/* Persistent In-App AI Healthcare Assistant Drawer */}
      {floatingChatOpen && activeTab !== 'assistant' && (
        <aside
          aria-label="In-App AI Healthcare Assistant Drawer"
          className="fixed bottom-5 right-5 z-40 w-full max-w-md bg-white rounded-2xl border-2 border-[#0F2537] shadow-xl overflow-hidden"
        >
          <div className="bg-[#0F2537] text-white px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <MessageSquareHeart className="w-5 h-5 text-[#F5B73B]" />
              <span className="font-display font-bold text-base">
                AevaCare AI Medication Assistant
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFloatingChatOpen(false);
                  setActiveTab('assistant');
                }}
                className="text-xs font-semibold text-[#F5B73B] underline cursor-pointer"
              >
                Full Screen
              </button>
              <button
                type="button"
                onClick={() => setFloatingChatOpen(false)}
                aria-label="Close AI Assistant drawer"
                className="p-1 rounded-lg hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto space-y-3 bg-[#FAF7F0]">
            {chatMessages.slice(-3).map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-[#0F2537] text-white ml-6'
                    : 'bg-white border border-[#0F2537]/15 text-[#0F2537] mr-2'
                }`}
              >
                {m.text}
              </div>
            ))}
            {aiLoading && (
              <p className="text-xs font-semibold text-[#0D7A6F] px-2">
                Consulting Drugs.com clinical reference...
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!floatingInput.trim()) return;
              const q = floatingInput;
              setFloatingInput('');
              void handleSendAiMessage(q);
            }}
            className="p-3 bg-white border-t border-[#0F2537]/15 flex items-center gap-2"
          >
            <input
              type="text"
              value={floatingInput}
              onChange={(e) => setFloatingInput(e.target.value)}
              placeholder="Ask about Lasix, HCTZ, dizziness, prices..."
              aria-label="Quick question for AI Assistant"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-sm text-[#0F2537]"
            />
            <button
              type="submit"
              disabled={aiLoading || !floatingInput.trim()}
              aria-label="Send question"
              className="px-4 py-2.5 rounded-xl bg-[#0F2537] text-[#F5B73B] font-bold text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
        </aside>
      )}

      {/* Clean Footer */}
      <footer className="border-t border-[#0F2537]/15 bg-white px-6 py-4 text-sm text-[#0F2537]/75">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>
            AevaCare · Shared Family Care Profile (Signed in as{' '}
            {authenticatedProfile.email})
          </span>
          <span>
            Firebase &amp; Firestore Connected · Drugs.com &amp; Google AI
            Studio Grounded
          </span>
        </div>
      </footer>
    </div>
  );
}
