import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Volume2,
  ArrowUpRight,
  Mail,
  Bell,
  Search,
  AlertTriangle,
  Sun,
  Sunset,
  Moon,
  Send,
  RotateCcw,
} from 'lucide-react';
import {
  MedicationItem,
  TimeSlot,
  EmailDispatchLog,
  FamilyMember,
  RoleProfile,
} from '../types/care';
import {
  calculateAdherenceStats,
  filterMedicationsBySlot,
  calculatePriceSavings,
} from '../utils/careLogic';
import {
  DISEASE_DIET_PROFILES,
  DiseaseConditionId,
} from '../data/diseaseDietData';

interface TodayMedsDashboardProps {
  activeRole: RoleProfile;
  medications: MedicationItem[];
  familyMembers: FamilyMember[];
  emailLogs: EmailDispatchLog[];
  onToggleDoseStatus: (medId: string) => void;
  onSnoozeDose: (medId: string) => void;
  onInspectAlternatives: (medId: string) => void;
  onAskAiAboutMed: (question: string) => void;
  onSendProactiveEmail: (customNote?: string) => Promise<void>;
  onOpenDiseaseDiet?: (conditionId: DiseaseConditionId) => void;
}

export const TodayMedsDashboard: React.FC<TodayMedsDashboardProps> = ({
  activeRole,
  medications,
  familyMembers,
  emailLogs,
  onToggleDoseStatus,
  onSnoozeDose,
  onInspectAlternatives,
  onAskAiAboutMed,
  onSendProactiveEmail,
  onOpenDiseaseDiet,
}) => {
  const [slotFilter, setSlotFilter] = useState<TimeSlot | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [spokenBanner, setSpokenBanner] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const stats = calculateAdherenceStats(medications);
  const filteredMeds = filterMedicationsBySlot(medications, slotFilter, searchQuery);

  const handleReadAloud = (med: MedicationItem) => {
    const speechText = `${med.brandName}, ${med.genericName} ${med.dosage}. Scheduled for ${med.timeSlot} at ${med.scheduledTime}. What it is for: ${med.whatItIsFor}. Appearance: ${med.pillAppearance}. Instructions: ${med.instructions}`;
    setSpokenBanner(`Reading aloud: "${med.brandName} (${med.genericName} ${med.dosage}) — ${med.instructions}"`);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.92;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback banner is already displayed
      }
    }
  };

  const handleDispatchEmailClick = async () => {
    setSendingEmail(true);
    try {
      await onSendProactiveEmail();
    } finally {
      setSendingEmail(false);
    }
  };

  const getSlotIcon = (slot: TimeSlot) => {
    if (slot === 'Morning') return <Sun className="w-5 h-5 text-[#D99B26]" />;
    if (slot === 'Afternoon') return <Sunset className="w-5 h-5 text-[#0D7A6F]" />;
    return <Moon className="w-5 h-5 text-[#0F2537]" />;
  };

  return (
    <div className="space-y-8">
      {/* Top Summary Banner & Quick Stats */}
      <section
        aria-labelledby="daily-overview-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-[#0F2537]/10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0D7A6F] mb-1">
              AevaCare · Daily Medication Schedule &amp; Proactive Reminders
            </p>
            <h1
              id="daily-overview-heading"
              className="text-3xl lg:text-4xl font-display font-extrabold text-[#0F2537]"
            >
              Today’s Medications &amp; What Each Pill Is For
            </h1>
            <p className="mt-2 text-lg text-[#0F2537]/80">
              Viewing as <strong className="text-[#0F2537]">{activeRole.name}</strong> ({activeRole.relationship}). Confirm doses with one large tap, listen to spoken instructions, or inspect safe alternatives when local stock runs low.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDispatchEmailClick}
              disabled={sendingEmail}
              className="px-5 py-3.5 rounded-xl bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B] font-display font-bold text-base flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-5 h-5" />
              <span>
                {sendingEmail
                  ? 'Sending Family Email...'
                  : 'Send Proactive Email Reminder Now'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 High-Contrast Stat Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 p-4">
            <span className="text-sm font-semibold text-[#0F2537]/75">
              Today’s Dose Completion
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-[#0F2537] whitespace-nowrap shrink-0">
                {stats.takenCount} / {stats.totalDoses}
              </span>
              <span className="text-sm font-semibold text-[#0D7A6F] whitespace-nowrap">
                Confirmed ({stats.adherencePercentage}%)
              </span>
            </div>
            <p className="mt-1 text-sm text-[#0F2537]/75">
              {stats.dueNowCount} due now · {stats.upcomingCount} evening dose upcoming
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 p-4">
            <span className="text-sm font-semibold text-[#0F2537]/75">
              Pharmacy Stock &amp; Refill Alert
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-[#D99B26] whitespace-nowrap shrink-0">
                {stats.lowOrOutStockCount} Meds
              </span>
              <span className="text-sm font-semibold text-[#0F2537] whitespace-nowrap">
                Need Refill / Alt
              </span>
            </div>
            <p className="mt-1 text-sm text-[#0F2537]/75">
              Lasix 20mg out of stock locally · Safe alternatives ready
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 p-4">
            <span className="text-sm font-semibold text-[#0F2537]/75">
              Non-Retail Online Savings
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-[#0D7A6F] whitespace-nowrap shrink-0">
                ${stats.totalMonthlySavings.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-[#0F2537] whitespace-nowrap">
                Saved / Month
              </span>
            </div>
            <p className="mt-1 text-sm text-[#0F2537]/75 font-mono tabular-nums">
              Online ${stats.totalMonthlyOnlineCost.toFixed(2)} vs. Retail ${stats.totalMonthlyRetailCost.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 p-4">
            <span className="text-sm font-semibold text-[#0F2537]/75">
              Proactive Family Circle Emails
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-mono font-bold tabular-nums text-[#0F2537] whitespace-nowrap shrink-0">
                {emailLogs.length} Sent
              </span>
              <span className="text-sm font-semibold text-[#0D7A6F] whitespace-nowrap">
                Active Monitoring
              </span>
            </div>
            <p className="mt-1 text-sm text-[#0F2537]/75">
              Notifying {familyMembers.filter((f) => f.notifyMissedDose).map((f) => f.name.split(' ')[0]).join(' & ')}
            </p>
          </div>
        </div>

        {/* Read-Aloud Visual Feedback Banner */}
        {spokenBanner && (
          <div
            role="status"
            className="mt-5 p-4 rounded-xl bg-[#0F2537] text-[#FAF7F0] flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-[#F5B73B] shrink-0" />
              <span className="text-base font-medium">{spokenBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setSpokenBanner(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/15 text-sm font-semibold text-white hover:bg-white/25 cursor-pointer"
            >
              Dismiss Voice Guide
            </button>
          </div>
        )}
      </section>

      {/* Disease-Based Light, Liquid & Circulation Diet Quick-Launch Card */}
      {onOpenDiseaseDiet && (
        <section
          aria-labelledby="disease-diet-quick-heading"
          className="bg-white rounded-2xl border-2 border-[#0D7A6F] p-6 lg:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D7A6F]">
                Disease-Specific Nutrition · Easy Digestion &amp; Blood Circulation
              </p>
              <h2
                id="disease-diet-quick-heading"
                className="text-2xl font-display font-extrabold text-[#0F2537] mt-0.5"
              >
                What Light &amp; Liquid Foods Can They Eat Today? (By Disease)
              </h2>
              <p className="text-base text-[#0F2537]/80 mt-1">
                Tap a condition below (<strong className="text-[#0F2537]">Heart, Stomach, Lungs, or Blood Sugar</strong>) to view warm clear broths, soothing liquids, and soft meals that digest easily and pass smoothly through blood circulation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenDiseaseDiet('heart')}
              className="px-5 py-3 rounded-xl bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-base flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Open Full Disease &amp; Liquid Diet Guide</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {DISEASE_DIET_PROFILES.map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => onOpenDiseaseDiet(prof.id)}
                className="p-4 rounded-xl bg-[#FAF7F0] hover:bg-[#0F2537] hover:text-white border border-[#0F2537]/15 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-lg text-[#0F2537] group-hover:text-[#F5B73B]">
                    {prof.shortLabel}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#0D7A6F] group-hover:text-[#F5B73B] shrink-0" />
                </div>
                <p className="text-xs font-semibold text-[#0D7A6F] group-hover:text-white/90 mt-1">
                  {prof.diseaseConditions}
                </p>
                <p className="text-xs text-[#0F2537]/75 group-hover:text-white/80 mt-1.5">
                  Top Liquid: {prof.liquidAndHydrationFoods[0]?.name}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Time-of-Day Filter Tabs & Search Bar */}
      <section aria-label="Filter medications by time of day" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-[#0F2537]/15">
          {(['All', 'Morning', 'Afternoon', 'Evening'] as const).map((slot) => {
            const active = slotFilter === slot;
            const count =
              slot === 'All'
                ? medications.length
                : medications.filter((m) => m.timeSlot === slot).length;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSlotFilter(slot)}
                className={`px-5 py-2.5 rounded-lg font-display font-bold text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0F2537] text-[#F5B73B]'
                    : 'text-[#0F2537] hover:bg-[#FAF7F0]'
                }`}
              >
                {slot === 'All' ? `All Times (${count})` : `${slot} (${count})`}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="w-5 h-5 text-[#0F2537]/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pill name or what it is for..."
            aria-label="Search medications"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#0F2537]/20 text-base text-[#0F2537] placeholder:text-[#0F2537]/50"
          />
        </div>
      </section>

      {/* Medication Cards List */}
      <section aria-label="Scheduled Daily Medications" className="space-y-5">
        {filteredMeds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#0F2537]/15 p-8 text-center">
            <p className="text-xl font-display font-bold text-[#0F2537]">
              No medications match your filter "{searchQuery || slotFilter}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSlotFilter('All');
                setSearchQuery('');
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#0F2537] text-[#F5B73B] font-bold text-base cursor-pointer"
            >
              Show All Daily Medications
            </button>
          </div>
        ) : (
          filteredMeds.map((med) => {
            const isTaken = med.status === 'Taken';
            const isDue = med.status === 'Due Now';
            const isOutOrLowStock = med.localStockStatus !== 'In Stock';
            const savings = calculatePriceSavings(
              med.retailPharmacyPrice,
              med.onlineNonRetailPrice
            );
            const activeAlt = med.alternatives.find(
              (a) => a.id === med.activeAlternativeId
            );

            return (
              <article
                key={med.id}
                className={`rounded-2xl border-2 p-6 lg:p-7 transition-colors bg-white ${
                  isDue
                    ? 'border-[#D99B26]'
                    : isTaken
                    ? 'border-[#0D7A6F]/50'
                    : 'border-[#0F2537]/15'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Medicine Identity, Purpose & Instructions */}
                  <div className="space-y-3 flex-1">
                    {/* Time & Status Line (Unboxed clean metadata with separators) */}
                    <div className="flex flex-wrap items-center gap-2.5 text-base font-semibold">
                      <span className="inline-flex items-center gap-1.5 text-[#0F2537]">
                        {getSlotIcon(med.timeSlot)}
                        <span>{med.timeSlot} Dose</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-bold text-[#0F2537] tabular-nums">
                        {med.scheduledTime}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-bold ${
                          isTaken
                            ? 'text-[#0D7A6F]'
                            : isDue
                            ? 'text-[#B45309]'
                            : 'text-[#0F2537]/75'
                        }`}
                      >
                        Status: {med.status}
                        {isTaken && med.takenAt ? ` at ${med.takenAt}` : ''}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#0F2537]/75 font-mono tabular-nums">
                        {med.daysRemaining} days left in bottle
                      </span>
                    </div>

                    {/* Medicine Name & Dosage */}
                    <div>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h2 className="text-2xl lg:text-3xl font-display font-extrabold text-[#0F2537]">
                          {med.brandName} ({med.genericName})
                        </h2>
                        <span className="text-xl font-mono font-bold text-[#0D7A6F] tabular-nums">
                          {med.dosage}
                        </span>
                      </div>

                      {activeAlt && (
                        <p className="mt-1 text-base font-bold text-[#0D7A6F]">
                          Active Chosen Alternative: {activeAlt.brandName} ({activeAlt.genericName} {activeAlt.dosage})
                        </p>
                      )}
                    </div>

                    {/* Clear "What It Is For" Callout */}
                    <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
                      <p className="text-lg font-bold text-[#0F2537]">
                        What This Pill Is For: <span className="font-semibold text-[#0D7A6F]">{med.whatItIsFor}</span>
                      </p>
                      <p className="mt-1.5 text-base text-[#0F2537]/90">
                        <strong className="font-semibold">How to Take It:</strong> {med.instructions}
                      </p>
                      <p className="mt-1 text-sm text-[#0F2537]/75">
                        <strong className="font-semibold">What It Looks Like:</strong> {med.pillAppearance}
                      </p>
                    </div>

                    {/* Stock Availability & Price Summary Line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#0F2537]/80 pt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          isOutOrLowStock ? 'text-[#B45309]' : 'text-[#0D7A6F]'
                        }`}
                      >
                        {isOutOrLowStock && <AlertTriangle className="w-4 h-4 shrink-0" />}
                        <span>
                          {med.localPharmacyName}: {med.localStockStatus}
                        </span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Retail: ${med.retailPharmacyPrice.toFixed(2)}/mo vs. Online: ${med.onlineNonRetailPrice.toFixed(2)}/mo (Save {savings.savingsPercent}%)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Maker: {med.manufacturer} ({med.marketCapBillions} Market Cap)
                      </span>
                    </div>
                  </div>

                  {/* Right: Large Tactile Senior Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
                    <button
                      type="button"
                      onClick={() => onToggleDoseStatus(med.id)}
                      className={`w-full py-4 px-5 rounded-xl font-display font-extrabold text-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
                        isTaken
                          ? 'bg-[#FAF7F0] hover:bg-[#0F2537]/10 text-[#0F2537] border-2 border-[#0F2537]/25'
                          : 'bg-[#0D7A6F] hover:bg-[#096057] text-white'
                      }`}
                    >
                      {isTaken ? (
                        <>
                          <RotateCcw className="w-5 h-5" />
                          <span>Undo Taken Status</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          <span>Confirm Dose Taken</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleReadAloud(med)}
                        className="py-3 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#F5B73B]/25 border border-[#0F2537]/20 font-display font-bold text-sm text-[#0F2537] flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Volume2 className="w-4 h-4 text-[#0D7A6F] shrink-0" />
                        <span>Read Aloud</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSnoozeDose(med.id)}
                        className="py-3 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#F5B73B]/25 border border-[#0F2537]/20 font-display font-bold text-sm text-[#0F2537] flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Clock className="w-4 h-4 text-[#D99B26] shrink-0" />
                        <span>Snooze 15m</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onInspectAlternatives(med.id)}
                      className="w-full py-3 px-4 rounded-xl bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B] font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>
                        {isOutOrLowStock
                          ? 'Out of Stock? View Safe Alternatives'
                          : 'Compare Alternatives & Composition'}
                      </span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAskAiAboutMed(
                          `What should I know about taking ${med.brandName} (${med.genericName} ${med.dosage}), its composition, and its alternatives?`
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-xl border border-[#0F2537]/20 hover:bg-[#FAF7F0] text-sm font-semibold text-[#0F2537] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Ask AI Assistant About {med.brandName}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Proactive Email Reminders & Escalation Feed */}
      <section
        aria-labelledby="proactive-email-feed-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-[#0D7A6F]" />
              <h2
                id="proactive-email-feed-heading"
                className="text-2xl font-display font-bold text-[#0F2537]"
              >
                Proactive Email Reminders &amp; Family Notification Log
              </h2>
            </div>
            <p className="text-base text-[#0F2537]/75 mt-1">
              Automatic email alerts are sent to your authorized family circle for missed doses, upcoming doses, and checkup rides.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDispatchEmailClick}
            className="px-4 py-2.5 rounded-xl bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span>Trigger Test Email Escalation</span>
          </button>
        </div>

        <div className="divide-y divide-[#0F2537]/10 border-t border-[#0F2537]/10">
          {emailLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#0F2537]/75">
                  <span className="font-mono font-bold text-[#0F2537] tabular-nums">
                    {log.timestamp}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#0D7A6F]">{log.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>To: {log.recipientName} ({log.recipientEmail})</span>
                </div>
                <h3 className="text-lg font-display font-bold text-[#0F2537]">
                  {log.subject}
                </h3>
                <p className="text-base text-[#0F2537]/85">{log.summary}</p>
              </div>
              <div className="shrink-0 font-mono text-sm font-bold text-[#0D7A6F]">
                Status: {log.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
