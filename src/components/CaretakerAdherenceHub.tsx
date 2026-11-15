import React, { useState } from 'react';
import {
  Users,
  BellRing,
  CalendarClock,
  PlusCircle,
  CheckCircle2,
  Mail,
  Car,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  MedicationItem,
  FamilyMember,
  ReminderPreference,
  AppointmentItem,
  TimeSlot,
  RoleProfile,
} from '../types/care';
import { calculateAdherenceStats } from '../utils/careLogic';
import { FirestoreUserDataSnapshot } from '../services/firebaseCareSync';

interface CaretakerAdherenceHubProps {
  activeRole: RoleProfile;
  medications: MedicationItem[];
  familyMembers: FamilyMember[];
  reminderPrefs: ReminderPreference[];
  appointments: AppointmentItem[];
  firestoreSnapshot?: FirestoreUserDataSnapshot | null;
  onSyncUserDataNow?: () => Promise<void>;
  onToggleReminderPref: (
    prefId: string,
    channel: 'email' | 'sms' | 'voiceCall' | 'smartSpeakerChime'
  ) => void;
  onToggleFamilyPermission: (
    memberId: string,
    field: 'canEditSchedule' | 'notifyMissedDose' | 'notifyAppointments'
  ) => void;
  onAddMedication: (newMed: {
    brandName: string;
    genericName: string;
    dosage: string;
    whatItIsFor: string;
    timeSlot: TimeSlot;
    scheduledTime: string;
    instructions: string;
  }) => void;
  onAddFamilyMember: (member: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
  }) => void;
  onConfirmAppointmentRide: (appointmentId: string) => void;
}

export const CaretakerAdherenceHub: React.FC<CaretakerAdherenceHubProps> = ({
  activeRole,
  medications,
  familyMembers,
  reminderPrefs,
  appointments,
  firestoreSnapshot,
  onSyncUserDataNow,
  onToggleReminderPref,
  onToggleFamilyPermission,
  onAddMedication,
  onAddFamilyMember,
  onConfirmAppointmentRide,
}) => {
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [whatItIsFor, setWhatItIsFor] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('Morning');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [syncingNow, setSyncingNow] = useState<boolean>(false);

  // Add Family Member state
  const [newFamName, setNewFamName] = useState('');
  const [newFamRelationship, setNewFamRelationship] =
    useState('Family Caretaker');
  const [newFamEmail, setNewFamEmail] = useState('');
  const [newFamPhone, setNewFamPhone] = useState('');

  const stats = calculateAdherenceStats(medications);

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !brandName.trim() ||
      !genericName.trim() ||
      !dosage.trim() ||
      !whatItIsFor.trim()
    ) {
      setFormError(
        'Please fill in the medicine name, generic ingredient, dosage, and what it is for.'
      );
      return;
    }

    onAddMedication({
      brandName: brandName.trim(),
      genericName: genericName.trim(),
      dosage: dosage.trim(),
      whatItIsFor: whatItIsFor.trim(),
      timeSlot,
      scheduledTime: scheduledTime.trim() || '10:00 AM',
      instructions:
        instructions.trim() ||
        'Take 1 tablet by mouth with a full glass of water.',
    });

    setBrandName('');
    setGenericName('');
    setDosage('');
    setWhatItIsFor('');
    setInstructions('');
    setFormError(null);
    setShowAddMedForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Adherence Summary */}
      <section
        aria-labelledby="caretaker-hub-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-[#0F2537]/10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0D7A6F] mb-1">
              Shared Family Ecosystem · Adherence, Proactive Alerts &amp; Checkup Rides
            </p>
            <h1
              id="caretaker-hub-heading"
              className="text-3xl lg:text-4xl font-display font-extrabold text-[#0F2537]"
            >
              Caretaker &amp; Family Adherence Hub
            </h1>
            <p className="mt-2 text-lg text-[#0F2537]/80">
              Signed in as{' '}
              <strong className="text-[#0F2537]">{activeRole.name}</strong> (
              {activeRole.relationship}). Track daily pill adherence, see any
              selected alternative medicines, add family members, and coordinate
              checkup rides.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMedForm((prev) => !prev)}
            className="px-5 py-3.5 rounded-xl bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B] font-display font-bold text-base flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>
              {showAddMedForm
                ? 'Close Add Medicine Form'
                : 'Add Medication to Schedule'}
            </span>
          </button>
        </div>

        {/* Add Medication Schedule Form */}
        {showAddMedForm && (
          <form
            onSubmit={handleAddMedSubmit}
            className="mt-6 p-6 rounded-xl bg-[#FAF7F0] border-2 border-[#0F2537] space-y-4"
          >
            <h2 className="text-xl font-display font-bold text-[#0F2537]">
              Add New Medication to Daily Schedule
            </h2>
            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[#F5B73B]/25 border border-[#D99B26] text-[#0F2537] font-semibold text-base"
              >
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="med-brand"
                  className="block text-sm font-bold text-[#0F2537] mb-1"
                >
                  Brand Name *
                </label>
                <input
                  id="med-brand"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Eliquis or CoQ10"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="med-generic"
                  className="block text-sm font-bold text-[#0F2537] mb-1"
                >
                  Active Ingredient (Generic) *
                </label>
                <input
                  id="med-generic"
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Apixaban"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="med-dosage"
                  className="block text-sm font-bold text-[#0F2537] mb-1"
                >
                  Dosage Strength *
                </label>
                <input
                  id="med-dosage"
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 5 mg"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label
                  htmlFor="med-slot"
                  className="block text-sm font-bold text-[#0F2537] mb-1"
                >
                  Time of Day
                </label>
                <select
                  id="med-slot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="med-time"
                  className="block text-sm font-bold text-[#0F2537] mb-1"
                >
                  Scheduled Time
                </label>
                <input
                  id="med-time"
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
                />
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="med-purpose"
                  className="block text-sm font-bold text-[#0F2537] mb-1"
                >
                  What It Is For (Plain English) *
                </label>
                <input
                  id="med-purpose"
                  type="text"
                  value={whatItIsFor}
                  onChange={(e) => setWhatItIsFor(e.target.value)}
                  placeholder="e.g. Heart rhythm & circulation support"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="med-instructions"
                className="block text-sm font-bold text-[#0F2537] mb-1"
              >
                Senior-Friendly Instructions
              </label>
              <input
                id="med-instructions"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Take 1 tablet with water after breakfast."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-base"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-base cursor-pointer"
              >
                Save Medication to Schedule
              </button>
              <button
                type="button"
                onClick={() => setShowAddMedForm(false)}
                className="px-5 py-3 rounded-xl border border-[#0F2537]/25 text-base font-semibold text-[#0F2537] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Adherence & Alternative Medicine Monitoring Table */}
        <div className="mt-6">
          <h2 className="text-xl font-display font-bold text-[#0F2537] mb-3">
            Live Medication &amp; Alternative Medicine Status (
            {stats.adherencePercentage}% Adherence Score)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[#0F2537]/15">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F0] border-b border-[#0F2537]/15 text-sm font-display font-bold text-[#0F2537]">
                  <th className="py-3.5 px-4">Time &amp; Slot</th>
                  <th className="py-3.5 px-4">Prescribed Medicine</th>
                  <th className="py-3.5 px-4">What It Is For</th>
                  <th className="py-3.5 px-4">
                    Active / Available Alternative
                  </th>
                  <th className="py-3.5 px-4 text-right">Today’s Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F2537]/10 text-base">
                {medications.map((med) => {
                  const chosenAlt =
                    med.alternatives.find(
                      (a) => a.id === med.activeAlternativeId
                    ) ?? med.alternatives[0];
                  return (
                    <tr key={med.id} className="hover:bg-[#FAF7F0]/60">
                      <td className="py-3.5 px-4 font-mono font-semibold tabular-nums whitespace-nowrap">
                        {med.timeSlot} · {med.scheduledTime}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-display font-bold text-[#0F2537]">
                          {med.brandName} ({med.genericName} {med.dosage})
                        </div>
                        <div className="text-xs text-[#0F2537]/70">
                          {med.localPharmacyName} · {med.localStockStatus}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-[#0F2537]/90 max-w-xs">
                        {med.whatItIsFor}
                      </td>
                      <td className="py-3.5 px-4 text-sm">
                        {chosenAlt ? (
                          <div>
                            <span className="font-bold text-[#0D7A6F]">
                              {med.activeAlternativeId
                                ? 'Switched to: '
                                : 'Recommended: '}
                              {chosenAlt.brandName} ({chosenAlt.genericName}{' '}
                              {chosenAlt.dosage})
                            </span>
                            <div className="text-xs font-mono text-[#0F2537]/75 tabular-nums">
                              Online: $
                              {chosenAlt.onlineNonRetailPrice.toFixed(2)}/mo ·{' '}
                              {chosenAlt.stockStatus}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#0F2537]/60">
                            Standard Regimen
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            med.status === 'Taken'
                              ? 'text-[#0D7A6F]'
                              : med.status === 'Due Now'
                              ? 'text-[#B45309]'
                              : 'text-[#0F2537]/75'
                          }
                        >
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Firebase Live User Data & Cloud Firestore Record Inspector */}
      {firestoreSnapshot && (
        <section
          aria-labelledby="firebase-user-data-heading"
          className="bg-white rounded-2xl border-2 border-[#0D7A6F] p-6 lg:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#0F2537]/10">
            <div>
              <div className="flex items-center gap-2.5">
                <Database className="w-6 h-6 text-[#0D7A6F]" />
                <h2
                  id="firebase-user-data-heading"
                  className="text-2xl font-display font-bold text-[#0F2537]"
                >
                  Firebase Cloud Firestore · Live User Data Record
                </h2>
              </div>
              <p className="text-base text-[#0F2537]/80 mt-1">
                Displays your signed-in user profile, family circle names, and
                medication schedule synced to your Firebase Firestore database.
              </p>
            </div>

            {onSyncUserDataNow && (
              <button
                type="button"
                disabled={syncingNow}
                onClick={async () => {
                  setSyncingNow(true);
                  try {
                    await onSyncUserDataNow();
                  } finally {
                    setSyncingNow(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncingNow ? 'animate-spin' : ''}`}
                />
                <span>
                  {syncingNow
                    ? 'Syncing to Firestore...'
                    : 'Sync User Data to Firebase Now'}
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/60">
                Signed-In User Email
              </p>
              <p className="text-base font-mono font-bold text-[#0F2537] mt-1 break-all">
                {firestoreSnapshot.email}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/60">
                Access Role &amp; Display Name
              </p>
              <p className="text-base font-display font-bold text-[#0D7A6F] mt-1">
                {firestoreSnapshot.displayName} ({firestoreSnapshot.role})
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/60">
                Family Member Names (familyNamesCsv)
              </p>
              <p className="text-base font-semibold text-[#0F2537] mt-1">
                {firestoreSnapshot.familyNamesCsv || 'None entered yet'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/60">
                Firebase App &amp; Database
              </p>
              <p className="text-xs font-mono font-semibold text-[#0F2537] mt-1 break-all">
                App: AevaCare ({firestoreSnapshot.projectId})
              </p>
              <p className="text-xs font-mono text-[#0F2537]/75 mt-0.5 break-all">
                DB: {firestoreSnapshot.databaseId}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/60">
                Firestore Document Path
              </p>
              <p className="text-xs font-mono font-bold text-[#0D7A6F] mt-1 break-all">
                {firestoreSnapshot.documentPath}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/60">
                Synced Medications Subcollection
              </p>
              <p className="text-base font-mono font-bold text-[#0F2537] mt-1">
                {firestoreSnapshot.syncedMedicationsCount} records · Synced at{' '}
                {firestoreSnapshot.lastSyncedAt}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Two-Column: Family Circle Access & Proactive Reminder Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Authorized Family & Caretaker Circle */}
        <section
          aria-labelledby="family-circle-heading"
          className="lg:col-span-6 bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <Users className="w-6 h-6 text-[#0D7A6F]" />
            <h2
              id="family-circle-heading"
              className="text-2xl font-display font-bold text-[#0F2537]"
            >
              Authorized Family &amp; Caretaker Circle
            </h2>
          </div>
          <p className="text-base text-[#0F2537]/80 mb-5">
            Enter your family member names and emails below to control who
            receives proactive missed-dose alerts and schedule editing rights.
          </p>

          {/* Add Family Member Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFamName.trim()) return;
              onAddFamilyMember({
                name: newFamName.trim(),
                relationship: newFamRelationship.trim() || 'Family Member',
                email:
                  newFamEmail.trim() ||
                  `${newFamName
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '.')}@gmail.com`,
                phone: newFamPhone.trim() || '(555) 019-2834',
              });
              setNewFamName('');
              setNewFamEmail('');
              setNewFamPhone('');
            }}
            className="mb-5 p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/20 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newFamName}
                onChange={(e) => setNewFamName(e.target.value)}
                placeholder="Enter family member name *"
                aria-label="Family member name"
                className="px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-sm text-[#0F2537]"
              />
              <input
                type="text"
                value={newFamRelationship}
                onChange={(e) => setNewFamRelationship(e.target.value)}
                placeholder="Relationship (e.g. Daughter, Son)"
                aria-label="Family relationship"
                className="px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-sm text-[#0F2537]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newFamEmail}
                onChange={(e) => setNewFamEmail(e.target.value)}
                placeholder="Family member Gmail / email"
                aria-label="Family member email"
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-white border border-[#0F2537]/25 text-sm text-[#0F2537]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-sm cursor-pointer whitespace-nowrap"
              >
                + Add Family Name
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0F2537] text-[#F5B73B] font-display font-bold text-base flex items-center justify-center shrink-0">
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-[#0F2537]">
                        {member.name}
                      </h3>
                      <p className="text-sm text-[#0D7A6F] font-semibold">
                        {member.relationship} · {member.role}
                      </p>
                      <p className="text-xs font-mono text-[#0F2537]/75 mt-0.5">
                        {member.email} · {member.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#0F2537]/10">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleFamilyPermission(member.id, 'notifyMissedDose')
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      member.notifyMissedDose
                        ? 'bg-[#0D7A6F] text-white'
                        : 'bg-white border border-[#0F2537]/20 text-[#0F2537]/70'
                    }`}
                  >
                    Missed Dose Email: {member.notifyMissedDose ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleFamilyPermission(member.id, 'notifyAppointments')
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      member.notifyAppointments
                        ? 'bg-[#0D7A6F] text-white'
                        : 'bg-white border border-[#0F2537]/20 text-[#0F2537]/70'
                    }`}
                  >
                    Checkup Ride Alerts:{' '}
                    {member.notifyAppointments ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleFamilyPermission(member.id, 'canEditSchedule')
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      member.canEditSchedule
                        ? 'bg-[#0F2537] text-[#F5B73B]'
                        : 'bg-white border border-[#0F2537]/20 text-[#0F2537]/70'
                    }`}
                  >
                    Can Edit Schedule: {member.canEditSchedule ? 'YES' : 'NO'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Proactive Escalation & Smart Speaker Preferences */}
        <section
          aria-labelledby="reminder-prefs-heading"
          className="lg:col-span-6 bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <BellRing className="w-6 h-6 text-[#D99B26]" />
            <h2
              id="reminder-prefs-heading"
              className="text-2xl font-display font-bold text-[#0F2537]"
            >
              Proactive Reminder &amp; Escalation Rules
            </h2>
          </div>
          <p className="text-base text-[#0F2537]/80 mb-5">
            Configure automatic email reminders, SMS alerts, and kitchen speaker
            chimes so no dose or refill is overlooked.
          </p>

          <div className="space-y-4">
            {reminderPrefs.map((pref) => (
              <div
                key={pref.id}
                className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 space-y-3"
              >
                <div>
                  <h3 className="text-lg font-display font-bold text-[#0F2537]">
                    {pref.title}
                  </h3>
                  <p className="text-sm text-[#0F2537]/80 mt-0.5">
                    {pref.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#0F2537]/10">
                  {(
                    [
                      { key: 'email', label: 'Email Alert' },
                      { key: 'sms', label: 'SMS Text' },
                      {
                        key: 'smartSpeakerChime',
                        label: 'Kitchen Speaker Chime',
                      },
                      { key: 'voiceCall', label: 'Phone Call' },
                    ] as const
                  ).map((chan) => {
                    const enabled = pref[chan.key];
                    return (
                      <button
                        key={chan.key}
                        type="button"
                        onClick={() => onToggleReminderPref(pref.id, chan.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          enabled
                            ? 'bg-[#0F2537] text-[#F5B73B]'
                            : 'bg-white border border-[#0F2537]/20 text-[#0F2537]/70'
                        }`}
                      >
                        {chan.label}: {enabled ? 'ACTIVE' : 'OFF'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Upcoming Checkups & Ride Coordination */}
      <section
        aria-labelledby="appointments-hub-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <CalendarClock className="w-6 h-6 text-[#0D7A6F]" />
          <h2
            id="appointments-hub-heading"
            className="text-2xl font-display font-bold text-[#0F2537]"
          >
            Upcoming Health Checkups &amp; Family Ride Coordination
          </h2>
        </div>
        <p className="text-base text-[#0F2537]/80 mb-6">
          Keeps your family care circle aligned on upcoming checkup dates,
          preparation notes, and confirmed family transportation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {appointments.map((apt) => {
            const rideConfirmed =
              apt.transportStatus !== 'Needs Family Confirmation';
            return (
              <div
                key={apt.id}
                className="rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="font-mono text-sm font-bold text-[#0D7A6F] tabular-nums">
                    {apt.date} · {apt.time}
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#0F2537]">
                    {apt.title}
                  </h3>
                  <p className="text-sm font-semibold text-[#0F2537]/85">
                    What It Is For: {apt.careFocus}
                  </p>
                  <p className="text-sm text-[#0F2537]/75">
                    Location: {apt.location}
                  </p>
                  <p className="text-sm text-[#0F2537]/80 bg-white p-3 rounded-lg border border-[#0F2537]/10">
                    <strong className="font-semibold">Prep Checklist:</strong>{' '}
                    {apt.preparationChecklist}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-[#0F2537]/10">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 text-[#0F2537]">
                      <Car className="w-4 h-4 text-[#0D7A6F]" />
                      <span>{apt.transportStatus}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#0D7A6F]">
                      <Mail className="w-3.5 h-3.5" />
                      <span>
                        {apt.emailReminderSent
                          ? '24h Email Armed'
                          : 'Email Pending'}
                      </span>
                    </span>
                  </div>

                  {!rideConfirmed ? (
                    <button
                      type="button"
                      onClick={() => onConfirmAppointmentRide(apt.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B] font-display font-bold text-sm cursor-pointer"
                    >
                      Confirm Family Ride &amp; Send Email Reminder
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-lg bg-[#0D7A6F]/15 text-[#0D7A6F] font-display font-bold text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ride &amp; Email Reminder Confirmed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
