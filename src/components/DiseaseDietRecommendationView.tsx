import React, { useState } from 'react';
import {
  HeartPulse,
  Soup,
  Droplets,
  Utensils,
  AlertCircle,
  Volume2,
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  DISEASE_DIET_PROFILES,
  DiseaseConditionId,
  DiseaseDietProfile,
} from '../data/diseaseDietData';

interface DiseaseDietRecommendationViewProps {
  initialConditionId?: DiseaseConditionId;
  onAskAiAboutDiet: (question: string) => void;
}

export const DiseaseDietRecommendationView: React.FC<
  DiseaseDietRecommendationViewProps
> = ({ initialConditionId = 'heart', onAskAiAboutDiet }) => {
  const [selectedConditionId, setSelectedConditionId] =
    useState<DiseaseConditionId>(initialConditionId);
  const [customDiseaseInput, setCustomDiseaseInput] = useState<string>('');
  const [savedCustomConditions, setSavedCustomConditions] = useState<string[]>([
    'Heart & Blood Pressure Support',
    'Sensitive Stomach & Easy Digestion',
  ]);
  const [spokenBanner, setSpokenBanner] = useState<string | null>(null);

  const activeProfile: DiseaseDietProfile =
    DISEASE_DIET_PROFILES.find((p) => p.id === selectedConditionId) ??
    DISEASE_DIET_PROFILES[0];

  const handleReadDietAloud = () => {
    const liquidsText = activeProfile.liquidAndHydrationFoods
      .map((l) => `${l.name} at ${l.bestTime}: ${l.circulationAndDigestionBenefit}`)
      .join('. ');
    const mealsText = activeProfile.lightDigestibleMeals
      .map((m) => `${m.timeOfDay}: ${m.dishName}, ${m.whyEasyToDigest}`)
      .join('. ');
    const fullSpeech = `Light and Liquid Diet Plan for ${activeProfile.organSystemTitle}. Condition: ${activeProfile.diseaseConditions}. Goal: ${activeProfile.circulationAndDigestionGoal}. Recommended Liquids: ${liquidsText}. Recommended Soft Meals: ${mealsText}.`;

    setSpokenBanner(
      `Reading aloud: "${activeProfile.organSystemTitle} — Light & Liquid Circulation Diet Plan"`
    );

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fullSpeech);
        utterance.rate = 0.92;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback banner is shown
      }
    }
  };

  const handleAddCustomCondition = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customDiseaseInput.trim();
    if (!clean) return;
    if (!savedCustomConditions.includes(clean)) {
      setSavedCustomConditions((prev) => [...prev, clean]);
    }
    setCustomDiseaseInput('');
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Disease / Organ Selector */}
      <section
        aria-labelledby="disease-diet-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-[#0F2537]/10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0D7A6F] mb-1">
              Disease-Based Nutrition · Easy Digestion &amp; Smooth Blood Circulation
            </p>
            <h1
              id="disease-diet-heading"
              className="text-3xl lg:text-4xl font-display font-extrabold text-[#0F2537]"
            >
              Light, Liquid &amp; Circulation-Friendly Food Guide by Condition
            </h1>
            <p className="mt-2 text-lg text-[#0F2537]/80">
              Select the health condition or organ system below (<strong className="text-[#0F2537]">Heart, Stomach, Lungs, or Blood Sugar &amp; Kidneys</strong>) to see warm liquids, clear broths, and soft foods that digest effortlessly and pass smoothly through circulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReadDietAloud}
              className="px-5 py-3.5 rounded-xl bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B] font-display font-bold text-base flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Volume2 className="w-5 h-5" />
              <span>Read Diet Plan Aloud</span>
            </button>
          </div>
        </div>

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
              Stop Voice Guide
            </button>
          </div>
        )}

        {/* 4 Organ / Disease Selector Cards */}
        <div
          role="tablist"
          aria-label="Choose disease or organ system for food recommendations"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6"
        >
          {DISEASE_DIET_PROFILES.map((profile) => {
            const isSelected = profile.id === activeProfile.id;
            return (
              <button
                key={profile.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => setSelectedConditionId(profile.id)}
                className={`p-5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2537] text-white border-[#0F2537]'
                    : 'bg-[#FAF7F0] text-[#0F2537] border-[#0F2537]/15 hover:border-[#0F2537]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-extrabold text-xl">
                    {profile.shortLabel}
                  </span>
                  <HeartPulse
                    className={`w-5 h-5 shrink-0 ${
                      isSelected ? 'text-[#F5B73B]' : 'text-[#0D7A6F]'
                    }`}
                  />
                </div>
                <p
                  className={`text-sm mt-1.5 leading-snug ${
                    isSelected ? 'text-white/85' : 'text-[#0F2537]/75'
                  }`}
                >
                  {profile.diseaseConditions}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Patient Condition Tag Input & Instant AI Diet Ask */}
        <div className="mt-6 pt-5 border-t border-[#0F2537]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <span className="block text-sm font-bold text-[#0F2537]">
              Recorded Health Conditions for This Care Profile:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {savedCustomConditions.map((cond) => (
                <span
                  key={cond}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF7F0] border border-[#0F2537]/20 text-sm font-semibold text-[#0F2537]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0D7A6F]" />
                  <span>{cond}</span>
                </span>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddCustomCondition}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto"
          >
            <input
              type="text"
              value={customDiseaseInput}
              onChange={(e) => setCustomDiseaseInput(e.target.value)}
              placeholder="Add condition (e.g. Heart, Lungs, Gastritis)..."
              aria-label="Enter specific disease or condition"
              className="flex-1 sm:w-72 px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/25 text-base text-[#0F2537]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#0D7A6F] hover:bg-[#096057] text-white font-display font-bold text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save Condition</span>
            </button>
            {customDiseaseInput.trim() && (
              <button
                type="button"
                onClick={() =>
                  onAskAiAboutDiet(
                    `What easy-to-digest light and liquid foods should a senior eat for ${customDiseaseInput.trim()} so that it passes smoothly through digestion and blood circulation?`
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-[#0F2537] text-[#F5B73B] font-display font-bold text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask AI Diet Plan</span>
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Section 1: Active Disease Overview & Circulation / Medication Synergy */}
      <section
        aria-labelledby="condition-summary-heading"
        className="bg-white rounded-2xl border-2 border-[#0D7A6F] p-6 lg:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D7A6F]">
              Selected Organ &amp; Disease Focus
            </p>
            <h2
              id="condition-summary-heading"
              className="text-2xl lg:text-3xl font-display font-extrabold text-[#0F2537] mt-0.5"
            >
              {activeProfile.organSystemTitle} — {activeProfile.diseaseConditions}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onAskAiAboutDiet(
                `Give me a gentle 1-day liquid and soft food recipe plan for ${activeProfile.organSystemTitle} (${activeProfile.diseaseConditions}) that is easy to digest and supports smooth blood circulation.`
              )
            }
            className="px-4 py-2.5 rounded-xl bg-[#0F2537] hover:bg-[#193852] text-[#F5B73B] font-display font-bold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI Assistant for Custom Recipes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15">
            <h3 className="text-base font-display font-bold text-[#0F2537]">
              How This Diet Helps Circulation &amp; Digestion:
            </h3>
            <p className="text-base text-[#0F2537]/90 mt-1 leading-relaxed">
              {activeProfile.circulationAndDigestionGoal}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#0D7A6F]/30">
            <h3 className="text-base font-display font-bold text-[#0D7A6F]">
              How It Pairs With Scheduled Medications:
            </h3>
            <p className="text-base text-[#0F2537]/90 mt-1 leading-relaxed">
              {activeProfile.linkedMedicationsNote}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Easy-to-Digest Liquids, Clear Soups & Circulation Tonics */}
      <section
        aria-labelledby="liquid-foods-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <Droplets className="w-6 h-6 text-[#0D7A6F]" />
          <h2
            id="liquid-foods-heading"
            className="text-2xl font-display font-bold text-[#0F2537]"
          >
            1. Recommended Light Liquids, Clear Broths &amp; Circulation Drinks
          </h2>
        </div>
        <p className="text-base text-[#0F2537]/80 mb-6">
          Warm, low-viscosity liquids absorb rapidly without taxing the stomach or heart and help nutrients pass smoothly through blood circulation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeProfile.liquidAndHydrationFoods.map((liquid, index) => (
            <div
              key={index}
              className="rounded-xl bg-[#FAF7F0] border border-[#0F2537]/15 p-5 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold text-[#0D7A6F] uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">
                    <Soup className="w-4 h-4" />
                    <span>Liquid / Broth #{index + 1}</span>
                  </span>
                  <span>{liquid.bestTime}</span>
                </div>

                <h3 className="text-xl font-display font-extrabold text-[#0F2537] mt-1.5">
                  {liquid.name}
                </h3>

                <p className="text-base text-[#0F2537]/85 mt-2">
                  <strong className="text-[#0F2537]">How to Prepare:</strong>{' '}
                  {liquid.preparation}
                </p>
              </div>

              <div className="pt-3 border-t border-[#0F2537]/10">
                <p className="text-sm font-semibold text-[#0D7A6F]">
                  Why It Helps Circulation &amp; Digestion:{' '}
                  <span className="font-normal text-[#0F2537]/90">
                    {liquid.circulationAndDigestionBenefit}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Soft, Light & Easily Digestible Daily Meal Schedule */}
      <section
        aria-labelledby="soft-meals-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <Utensils className="w-6 h-6 text-[#D99B26]" />
          <h2
            id="soft-meals-heading"
            className="text-2xl font-display font-bold text-[#0F2537]"
          >
            2. Daily Soft &amp; Easily Digestible Meal Plan (Morning, Afternoon, Evening)
          </h2>
        </div>
        <p className="text-base text-[#0F2537]/80 mb-6">
          Gentle, spoon-soft meals timed with morning, afternoon, and evening medications so pills never irritate an empty stomach.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {activeProfile.lightDigestibleMeals.map((meal, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#FAF7F0] border-2 border-[#0F2537]/15 p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#0F2537] text-[#F5B73B] font-display font-bold text-xs uppercase tracking-wider">
                    {meal.timeOfDay} Light Meal
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0D7A6F]">
                    {meal.textureType}
                  </span>
                </div>

                <h3 className="text-xl font-display font-extrabold text-[#0F2537] pt-1">
                  {meal.dishName}
                </h3>

                <p className="text-base text-[#0F2537]/85">
                  <strong className="font-semibold">What’s In It:</strong>{' '}
                  {meal.ingredientsSummary}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#0F2537]/10 text-sm text-[#0F2537]/90">
                <strong className="text-[#0D7A6F] block mb-0.5">
                  Digestive &amp; Circulation Benefit:
                </strong>
                {meal.whyEasyToDigest}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Foods to Avoid / Limit for This Condition */}
      <section
        aria-labelledby="avoid-foods-heading"
        className="bg-white rounded-2xl border-2 border-[#D99B26]/60 p-6 lg:p-8"
      >
        <div className="flex items-center gap-2.5 text-[#B45309] mb-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <h2
            id="avoid-foods-heading"
            className="text-2xl font-display font-extrabold text-[#0F2537]"
          >
            3. Heavy or Irritating Foods to Avoid for {activeProfile.shortLabel}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeProfile.foodsToAvoid.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D99B26]/50 flex items-start gap-3 text-base text-[#0F2537]"
            >
              <AlertCircle className="w-5 h-5 text-[#D99B26] shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
