import React, { useState, useEffect } from 'react';
import {
  Scale,
  Building2,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Truck,
  ArrowLeftRight,
  MessageSquare,
  Check,
  Search,
  BookOpen,
  PlusCircle,
} from 'lucide-react';
import { MedicationItem, TimeSlot } from '../types/care';
import {
  calculatePriceSavings,
  compareCompositions,
} from '../utils/careLogic';
import {
  DRUGS_COM_INFORMATION_TABLE,
  DrugsComTableEntry,
} from '../data/drugsComDirectory';

interface AlternativesAndCompositionViewProps {
  medications: MedicationItem[];
  selectedMedId: string;
  onSelectMedId: (id: string) => void;
  onSelectAlternativeForMed: (medId: string, altId: string) => void;
  onAskAiQuestion: (question: string) => void;
  onAddMedicationFromDirectory?: (med: {
    brandName: string;
    genericName: string;
    dosage: string;
    whatItIsFor: string;
    timeSlot: TimeSlot;
    scheduledTime: string;
    instructions: string;
  }) => void;
}

export const AlternativesAndCompositionView: React.FC<
  AlternativesAndCompositionViewProps
> = ({
  medications,
  selectedMedId,
  onSelectMedId,
  onSelectAlternativeForMed,
  onAskAiQuestion,
  onAddMedicationFromDirectory,
}) => {
  const activeMed =
    medications.find((m) => m.id === selectedMedId) ?? medications[0];

  const [selectedAltId, setSelectedAltId] = useState<string>(
    activeMed.activeAlternativeId ?? activeMed.alternatives[0]?.id ?? ''
  );

  // Drugs.com Drug Information Table state
  const [drugSearchQuery, setDrugSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [addedDrugIds, setAddedDrugIds] = useState<string[]>([]);

  useEffect(() => {
    const nextAlt =
      activeMed.activeAlternativeId ?? activeMed.alternatives[0]?.id ?? '';
    setSelectedAltId(nextAlt);
  }, [activeMed]);

  const activeAlt =
    activeMed.alternatives.find((a) => a.id === selectedAltId) ??
    activeMed.alternatives[0];

  const medSavings = calculatePriceSavings(
    activeMed.retailPharmacyPrice,
    activeMed.onlineNonRetailPrice
  );
  const altSavings = activeAlt
    ? calculatePriceSavings(
        activeAlt.retailPharmacyPrice,
        activeAlt.onlineNonRetailPrice
      )
    : null;
  const compSummary = activeAlt
    ? compareCompositions(activeMed, activeAlt)
    : null;

  const availableLetters = [
    'ALL',
    ...Array.from(
      new Set(DRUGS_COM_INFORMATION_TABLE.map((entry) => entry.letter))
    ).sort(),
  ];

  const filteredDirectory = DRUGS_COM_INFORMATION_TABLE.filter((entry) => {
    const matchesLetter =
      selectedLetter === 'ALL' || entry.letter === selectedLetter;
    const q = drugSearchQuery.trim().toLowerCase();
    if (!q) return matchesLetter;
    return (
      matchesLetter &&
      (entry.drugName.toLowerCase().includes(q) ||
        entry.genericIngredient.toLowerCase().includes(q) ||
        entry.drugClass.toLowerCase().includes(q) ||
        entry.medicalUse.toLowerCase().includes(q) ||
        entry.chemicalCompositionSummary.toLowerCase().includes(q))
    );
  });

  const handleAddDirectoryEntry = (entry: DrugsComTableEntry) => {
    if (!onAddMedicationFromDirectory) return;
    onAddMedicationFromDirectory({
      brandName: entry.drugName.split(' (')[0],
      genericName: entry.genericIngredient,
      dosage: entry.standardDosage,
      whatItIsFor: entry.medicalUse,
      timeSlot: entry.recommendedSlot,
      scheduledTime: entry.scheduledTime,
      instructions: `${entry.keyBenefits}. Watch for: ${entry.commonSideEffects}`,
    });
    setAddedDrugIds((prev) =>
      prev.includes(entry.id) ? prev : [...prev, entry.id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Medication Switcher */}
      <section
        aria-labelledby="alternatives-engine-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-5 lg:p-6"
      >
        <div className="max-w-4xl mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0D7A6F] mb-1">
            Deep Medical Insights · Alternatives, Price Comparison &amp; Chemical Composition
          </p>
          <h1
            id="alternatives-engine-heading"
            className="text-2xl lg:text-3xl font-display font-extrabold text-[#0F2537]"
          >
            Alternative Medicines, Retail vs. Online Prices &amp; Composition Analysis
          </h1>
          <p className="mt-1.5 text-base text-[#0F2537]/80">
            Tap any medication below to compare safe alternatives when local stock runs out, retail vs. online prices, manufacturer market cap reliability, and exact milligram compositions.
          </p>
        </div>

        {/* Medication Selector Buttons */}
        <div
          role="tablist"
          aria-label="Choose prescribed medication to analyze"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {medications.map((med) => {
            const isSelected = med.id === activeMed.id;
            const isOut = med.localStockStatus !== 'In Stock';
            return (
              <button
                key={med.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => onSelectMedId(med.id)}
                className={`p-4 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2537] text-white border-[#0F2537]'
                    : 'bg-[#FAF7F0] text-[#0F2537] border-[#0F2537]/15 hover:border-[#0F2537]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-extrabold text-lg">
                    {med.brandName}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isSelected ? 'text-[#F5B73B]' : 'text-[#0D7A6F]'
                    }`}
                  >
                    {med.dosage}
                  </span>
                </div>
                <p
                  className={`text-sm mt-0.5 font-medium ${
                    isSelected ? 'text-white/85' : 'text-[#0F2537]/75'
                  }`}
                >
                  {med.genericName}
                </p>
                <p
                  className={`text-xs mt-2 font-semibold ${
                    isSelected
                      ? 'text-[#F5B73B]'
                      : isOut
                      ? 'text-[#B45309]'
                      : 'text-[#0D7A6F]'
                  }`}
                >
                  {med.localStockStatus}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Availability & Alternative Medicine Picker */}
      {activeAlt && (
        <section
          aria-labelledby="availability-picker-heading"
          className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
            <div>
              <h2
                id="availability-picker-heading"
                className="text-2xl font-display font-bold text-[#0F2537]"
              >
                1. Local Pharmacy Stock &amp; Safe Alternatives for {activeMed.brandName} ({activeMed.genericName} {activeMed.dosage})
              </h2>
              <p className="text-base text-[#0F2537]/80 mt-1">
                <strong className="text-[#0F2537]">What {activeMed.brandName} Is For:</strong>{' '}
                {activeMed.whatItIsFor} · Current Local Status at {activeMed.localPharmacyName}:{' '}
                <strong className="text-[#B45309]">{activeMed.localStockStatus}</strong>
              </p>
            </div>

            {activeMed.alternatives.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 bg-[#FAF7F0] p-1.5 rounded-xl border border-[#0F2537]/15">
                {activeMed.alternatives.map((alt) => {
                  const chosen = alt.id === activeAlt.id;
                  return (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => setSelectedAltId(alt.id)}
                      className={`px-4 py-2 rounded-lg font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        chosen
                          ? 'bg-[#0F2537] text-[#F5B73B]'
                          : 'text-[#0F2537] hover:bg-white'
                      }`}
                    >
                      Compare with {alt.brandName} ({alt.genericName} {alt.dosage})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side-by-Side Price & Brand Market Cap Cards (A vs B) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card A: Prescribed Medicine Pricing & Manufacturer Market Cap */}
            <div className="rounded-xl bg-[#FAF7F0] border-2 border-[#0F2537]/20 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#0F2537]/75 mb-2">
                  <span>PRESCRIBED MEDICINE (OPTION A)</span>
                  <span className="font-mono text-[#B45309]">
                    {activeMed.localStockStatus}
                  </span>
                </div>
                <h3 className="text-2xl font-display font-extrabold text-[#0F2537]">
                  {activeMed.brandName} ({activeMed.genericName} {activeMed.dosage})
                </h3>
                <p className="text-base text-[#0F2537]/85 mt-1">
                  {activeMed.whatItIsFor}
                </p>

                {/* Retail vs Non-Retail Price Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <div className="bg-white rounded-xl p-4 border border-[#0F2537]/15">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2537]/70">
                      <ShoppingBag className="w-4 h-4 text-[#0F2537]" />
                      <span>Walk-In Retail Pharmacy</span>
                    </div>
                    <p className="mt-1 text-2xl font-mono font-bold tabular-nums text-[#0F2537]">
                      ${activeMed.retailPharmacyPrice.toFixed(2)}{' '}
                      <span className="text-sm font-normal">/ 30 days</span>
                    </p>
                    <p className="text-xs text-[#0F2537]/70 mt-1">
                      {activeMed.localPharmacyName}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-[#0D7A6F]">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0D7A6F]">
                      <Truck className="w-4 h-4" />
                      <span>Non-Retail Online Outlet</span>
                    </div>
                    <p className="mt-1 text-2xl font-mono font-bold tabular-nums text-[#0D7A6F]">
                      ${activeMed.onlineNonRetailPrice.toFixed(2)}{' '}
                      <span className="text-sm font-normal">/ 30 days</span>
                    </p>
                    <p className="text-xs text-[#0F2537]/80 mt-1">
                      {activeMed.onlineOutletName} · Save ${medSavings.monthlySavings.toFixed(2)}/mo ({medSavings.savingsPercent}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Manufacturer Brand & Market Capitalization */}
              <div className="mt-5 pt-4 border-t border-[#0F2537]/15">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F2537]">
                  <Building2 className="w-4 h-4 text-[#0D7A6F]" />
                  <span>Manufacturer: {activeMed.manufacturer}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#0D7A6F] tabular-nums">
                    Market Cap: {activeMed.marketCapBillions}
                  </span>
                </div>
                <p className="text-sm text-[#0F2537]/75 mt-1">
                  {activeMed.manufacturerReliabilityNote} · {activeMed.drugsComRating}
                </p>
              </div>
            </div>

            {/* Card B: Safe Alternative Medicine Pricing & Manufacturer Market Cap */}
            <div className="rounded-xl bg-[#FAF7F0] border-2 border-[#0D7A6F] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-[#0D7A6F] mb-2">
                  <span>SAFE ALTERNATIVE MEDICINE (OPTION B)</span>
                  <span className="font-mono">{activeAlt.stockStatus}</span>
                </div>
                <h3 className="text-2xl font-display font-extrabold text-[#0F2537]">
                  {activeAlt.brandName} ({activeAlt.genericName} {activeAlt.dosage})
                </h3>
                <p className="text-base text-[#0F2537]/85 mt-1">
                  {activeAlt.purposeSummary}
                </p>

                {/* Retail vs Non-Retail Price Comparison Grid */}
                {altSavings && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <div className="bg-white rounded-xl p-4 border border-[#0F2537]/15">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2537]/70">
                        <ShoppingBag className="w-4 h-4 text-[#0F2537]" />
                        <span>Walk-In Retail Pharmacy</span>
                      </div>
                      <p className="mt-1 text-2xl font-mono font-bold tabular-nums text-[#0F2537]">
                        ${activeAlt.retailPharmacyPrice.toFixed(2)}{' '}
                        <span className="text-sm font-normal">/ 30 days</span>
                      </p>
                      <p className="text-xs text-[#0F2537]/70 mt-1">
                        Standard Local Walk-In Retail Price
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border-2 border-[#0D7A6F]">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#0D7A6F]">
                        <Truck className="w-4 h-4" />
                        <span>Non-Retail Online Outlet</span>
                      </div>
                      <p className="mt-1 text-2xl font-mono font-bold tabular-nums text-[#0D7A6F]">
                        ${activeAlt.onlineNonRetailPrice.toFixed(2)}{' '}
                        <span className="text-sm font-normal">/ 30 days</span>
                      </p>
                      <p className="text-xs text-[#0F2537]/80 mt-1">
                        {activeAlt.onlineOutletName} · Save ${altSavings.monthlySavings.toFixed(2)}/mo ({altSavings.savingsPercent}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Manufacturer Brand & Market Capitalization */}
              <div className="mt-5 pt-4 border-t border-[#0F2537]/15">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F2537]">
                  <Building2 className="w-4 h-4 text-[#0D7A6F]" />
                  <span>Manufacturer: {activeAlt.manufacturer}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#0D7A6F] tabular-nums">
                    Market Cap: {activeAlt.marketCapBillions}
                  </span>
                </div>
                <p className="text-sm text-[#0F2537]/75 mt-1">
                  {activeAlt.manufacturerReliabilityNote} · {activeAlt.drugsComRating}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 2: Chemical Composition Breakdown Table (A vs B) */}
      {activeAlt && compSummary && (
        <section
          aria-labelledby="composition-breakdown-heading"
          className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-6 h-6 text-[#0D7A6F]" />
                <h2
                  id="composition-breakdown-heading"
                  className="text-2xl font-display font-bold text-[#0F2537]"
                >
                  2. Exact Chemical Composition Breakdown ({activeMed.genericName} vs. {activeAlt.genericName})
                </h2>
              </div>
              <p className="text-base text-[#0F2537]/80 mt-1">
                See exactly what active pharmaceutical compounds and stabilizers are inside each tablet before switching.
              </p>
            </div>

            <div className="font-mono text-sm font-bold text-[#0F2537] bg-[#FAF7F0] px-4 py-2.5 rounded-xl border border-[#0F2537]/15 tabular-nums">
              Active Ingredient Shift: {compSummary.OriginalStrengthMg} mg →{' '}
              {compSummary.alternativeStrengthMg} mg (
              {compSummary.strengthDifferenceMg >= 0
                ? `+${compSummary.strengthDifferenceMg}`
                : compSummary.strengthDifferenceMg}{' '}
              mg)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prescribed Composition Table */}
            <div className="rounded-xl border border-[#0F2537]/20 overflow-hidden">
              <div className="bg-[#0F2537] text-white px-5 py-3.5 flex items-center justify-between">
                <span className="font-display font-bold text-lg">
                  {activeMed.brandName} ({activeMed.genericName}) Composition
                </span>
                <span className="font-mono text-sm text-[#F5B73B] tabular-nums">
                  {activeMed.dosage}
                </span>
              </div>
              <div className="divide-y divide-[#0F2537]/10 bg-white">
                {activeMed.composition.map((comp, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-lg text-[#0F2537]">
                        {comp.compound}
                      </span>
                      <span className="font-mono font-bold text-base text-[#0D7A6F] tabular-nums">
                        {comp.strength}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0F2537]/60 mt-0.5">
                      {comp.category}
                    </p>
                    <p className="text-base text-[#0F2537]/85 mt-1">
                      {comp.clinicalRole}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternative Composition Table */}
            <div className="rounded-xl border-2 border-[#0D7A6F] overflow-hidden">
              <div className="bg-[#0D7A6F] text-white px-5 py-3.5 flex items-center justify-between">
                <span className="font-display font-bold text-lg">
                  {activeAlt.brandName} ({activeAlt.genericName}) Composition
                </span>
                <span className="font-mono text-sm text-white font-bold tabular-nums">
                  {activeAlt.dosage}
                </span>
              </div>
              <div className="divide-y divide-[#0F2537]/10 bg-white">
                {activeAlt.composition.map((comp, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-lg text-[#0F2537]">
                        {comp.compound}
                      </span>
                      <span className="font-mono font-bold text-base text-[#0D7A6F] tabular-nums">
                        {comp.strength}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0F2537]/60 mt-0.5">
                      {comp.category}
                    </p>
                    <p className="text-base text-[#0F2537]/85 mt-1">
                      {comp.clinicalRole}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Pros & Cons (Good Benefits vs. Side Effects to Watch) when Switching */}
      {activeAlt && (
        <section
          aria-labelledby="pros-cons-heading"
          className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-[#0D7A6F]" />
                <h2
                  id="pros-cons-heading"
                  className="text-2xl font-display font-bold text-[#0F2537]"
                >
                  3. What Changes If You Switch to {activeAlt.brandName} ({activeAlt.genericName})?
                </h2>
              </div>
              <p className="text-base text-[#0F2537]/80 mt-1">
                Clear comparison of the <strong className="text-[#0D7A6F]">Good Benefits</strong> against the <strong className="text-[#B45309]">Side Effects &amp; Watch-Outs</strong> when switching from {activeMed.brandName}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onSelectAlternativeForMed(activeMed.id, activeAlt.id)
                }
                className={`px-5 py-3 rounded-xl font-display font-bold text-base flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeMed.activeAlternativeId === activeAlt.id
                    ? 'bg-[#0D7A6F] text-white'
                    : 'bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B]'
                }`}
              >
                {activeMed.activeAlternativeId === activeAlt.id ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Selected as Active Alternative (Caretaker Notified)</span>
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-5 h-5" />
                    <span>Select {activeAlt.brandName} as Preferred Alternative</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  onAskAiQuestion(
                    `Compare ${activeMed.brandName} (${activeMed.genericName} ${activeMed.dosage}) vs. ${activeAlt.brandName} (${activeAlt.genericName} ${activeAlt.dosage}): what are the composition differences, benefits, and side effects?`
                  )
                }
                className="px-4 py-3 rounded-xl border border-[#0F2537]/25 hover:bg-[#FAF7F0] font-display font-bold text-base text-[#0F2537] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <MessageSquare className="w-5 h-5 text-[#0D7A6F]" />
                <span>Ask AI Assistant About This Switch</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Good Benefits (Pros) */}
            <div className="rounded-xl bg-[#FAF7F0] border-2 border-[#0D7A6F]/40 p-6">
              <div className="flex items-center gap-2.5 text-[#0D7A6F] font-display font-extrabold text-xl mb-4">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>Good Medical &amp; Cost Benefits (Pros)</span>
              </div>
              <ul className="space-y-3.5">
                {activeAlt.goodBenefits.map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-lg text-[#0F2537] leading-snug"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#0D7A6F] shrink-0 mt-1" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side Effects & Precautions (Cons - Warm Mustard Amber, No Harsh Red) */}
            <div className="rounded-xl bg-[#FAF7F0] border-2 border-[#D99B26]/60 p-6">
              <div className="flex items-center gap-2.5 text-[#B45309] font-display font-extrabold text-xl mb-4">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <span>Side Effects &amp; Things to Watch For (Cons)</span>
              </div>
              <ul className="space-y-3.5">
                {activeAlt.sideEffectsWatch.map((effect, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-lg text-[#0F2537] leading-snug"
                  >
                    <AlertCircle className="w-5 h-5 text-[#D99B26] shrink-0 mt-1" />
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Drugs.com A–Z Drug Information Table (https://www.drugs.com/drug_information.html) */}
      <section
        aria-labelledby="drugs-com-table-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-[#0D7A6F]" />
              <h2
                id="drugs-com-table-heading"
                className="text-2xl font-display font-bold text-[#0F2537]"
              >
                4. Drugs.com A–Z Drug Information Table &amp; Reference Directory
              </h2>
            </div>
            <p className="text-base text-[#0F2537]/80 mt-1">
              Search and filter verified medication monographs from{' '}
              <span className="font-mono text-sm font-semibold text-[#0D7A6F]">
                drugs.com/drug_information.html
              </span>{' '}
              including active ingredients, chemical compositions, side effects, retail vs. online prices, and add directly to your schedule.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 text-[#0F2537]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={drugSearchQuery}
              onChange={(e) => setDrugSearchQuery(e.target.value)}
              placeholder="Search drug, ingredient, or use..."
              aria-label="Search Drugs.com Drug Information Table"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base text-[#0F2537] placeholder:text-[#0F2537]/45"
            />
          </div>
        </div>

        {/* A–Z Letter Filter Bar */}
        <div
          role="group"
          aria-label="Filter Drugs.com directory by first letter"
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          {availableLetters.map((letter) => {
            const active = selectedLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F2537] text-[#F5B73B]'
                    : 'bg-[#FAF7F0] text-[#0F2537] border border-[#0F2537]/15 hover:bg-[#0F2537]/10'
                }`}
              >
                {letter === 'ALL' ? 'All A–Z' : letter}
              </button>
            );
          })}
        </div>

        {/* Structured Drugs.com Information Table */}
        <div className="overflow-x-auto rounded-xl border border-[#0F2537]/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F2537] text-white text-sm font-display font-bold">
                <th className="py-3.5 px-4">Drug &amp; Generic Ingredient</th>
                <th className="py-3.5 px-4">Clinical Purpose &amp; Drug Class</th>
                <th className="py-3.5 px-4">Chemical Composition &amp; Dosage</th>
                <th className="py-3.5 px-4">Benefits &amp; Side Effects</th>
                <th className="py-3.5 px-4">Retail vs. Online Price</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F2537]/15 bg-white text-base">
              {filteredDirectory.map((entry) => {
                const isAdded = addedDrugIds.includes(entry.id);
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#FAF7F0]/70 transition-colors align-top"
                  >
                    <td className="py-4 px-4">
                      <div className="font-display font-extrabold text-lg text-[#0F2537]">
                        {entry.drugName}
                      </div>
                      <div className="text-sm font-semibold text-[#0D7A6F]">
                        {entry.genericIngredient}
                      </div>
                      <div className="text-xs text-[#0F2537]/70 mt-1 font-mono">
                        {entry.manufacturer} · Cap: {entry.marketCap} · Rating: {entry.drugsComRating}
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#0F2537]/65 mb-1">
                        {entry.drugClass}
                      </div>
                      <p className="text-sm text-[#0F2537]/90 leading-snug">
                        {entry.medicalUse}
                      </p>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <span className="inline-block font-mono text-sm font-bold text-[#0F2537] bg-[#FAF7F0] px-2.5 py-0.5 rounded border border-[#0F2537]/15 mb-1">
                        {entry.standardDosage} ({entry.recommendedSlot})
                      </span>
                      <p className="text-xs text-[#0F2537]/80 leading-snug">
                        {entry.chemicalCompositionSummary}
                      </p>
                    </td>

                    <td className="py-4 px-4 max-w-xs text-xs space-y-1.5">
                      <p className="text-[#0D7A6F] font-semibold">
                        Pro: {entry.keyBenefits}
                      </p>
                      <p className="text-[#B45309] font-medium">
                        Watch: {entry.commonSideEffects}
                      </p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap font-mono">
                      <div className="text-xs text-[#0F2537]/70">
                        Retail: ${entry.retailPrice.toFixed(2)}/mo
                      </div>
                      <div className="text-base font-bold text-[#0D7A6F]">
                        Online: ${entry.onlinePrice.toFixed(2)}/mo
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2">
                        {onAddMedicationFromDirectory && (
                          <button
                            type="button"
                            onClick={() => handleAddDirectoryEntry(entry)}
                            className={`px-3 py-2 rounded-lg font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                              isAdded
                                ? 'bg-[#0D7A6F] text-white'
                                : 'bg-[#0F2537] text-[#F5B73B] hover:bg-[#193852]'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added to Schedule</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add to Schedule</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onAskAiQuestion(
                              `From the Drugs.com Drug Information table, tell me about ${entry.drugName} (${entry.genericIngredient} ${entry.standardDosage}): what is its chemical composition, benefits, and side effects for seniors?`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#0F2537]/25 hover:bg-[#FAF7F0] font-display font-bold text-xs text-[#0F2537] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#0D7A6F]" />
                          <span>Ask AI</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
