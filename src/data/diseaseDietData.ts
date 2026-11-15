export type DiseaseConditionId = 'heart' | 'stomach' | 'lungs' | 'diabetes';

export interface LiquidFoodRecommendation {
  name: string;
  bestTime: string;
  preparation: string;
  circulationAndDigestionBenefit: string;
}

export interface SoftMealSuggestion {
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  dishName: string;
  textureType: string;
  ingredientsSummary: string;
  whyEasyToDigest: string;
}

export interface DiseaseDietProfile {
  id: DiseaseConditionId;
  organSystemTitle: string;
  shortLabel: string;
  diseaseConditions: string;
  circulationAndDigestionGoal: string;
  linkedMedicationsNote: string;
  liquidAndHydrationFoods: LiquidFoodRecommendation[];
  lightDigestibleMeals: SoftMealSuggestion[];
  foodsToAvoid: string[];
}

export const DISEASE_DIET_PROFILES: DiseaseDietProfile[] = [
  {
    id: 'heart',
    organSystemTitle: 'Heart & Blood Vessel Circulation',
    shortLabel: 'Heart & Circulation',
    diseaseConditions:
      'High Blood Pressure (Hypertension), Fluid Retention (Edema), & Coronary Artery Support',
    circulationAndDigestionGoal:
      'Keep blood flowing smoothly through arteries without heavy digestive strain or excess sodium that traps water around the ankles and heart.',
    linkedMedicationsNote:
      'Pairs with Lasix (Furosemide 20mg), Norvasc (Amlodipine 5mg), and Lipitor (Atorvastatin 20mg). Replaces gentle potassium lost from morning water pills and avoids grapefruit juice.',
    liquidAndHydrationFoods: [
      {
        name: 'Warm Clear Yellow Moong Dal & Garlic Soup',
        bestTime: 'Mid-Morning (10:30 AM) or Early Evening',
        preparation:
          'Thin, strained yellow split lentil water simmered with 1 crushed garlic clove, a pinch of turmeric, and zero added table salt.',
        circulationAndDigestionBenefit:
          'Garlic compounds naturally relax blood vessel walls for smoother circulation while clear lentil broth absorbs in 20 minutes without bloating.',
      },
      {
        name: 'Diluted Pomegranate & Beetroot Circulation Water',
        bestTime: 'Late Morning (11:00 AM)',
        preparation:
          'Half cup fresh pomegranate-beet juice mixed with half cup warm filtered water (room temperature or slightly warm).',
        circulationAndDigestionBenefit:
          'Rich in natural dietary nitrates that boost nitric oxide in blood vessels, helping blood pass easily through narrow capillaries.',
      },
      {
        name: 'Tender Coconut Water or Potassium-Rich Vegetable Broth',
        bestTime: '2 Hours After Morning Lasix Pill',
        preparation:
          '1 small glass (150 ml) fresh tender coconut water or strained spinach-carrot clear broth.',
        circulationAndDigestionBenefit:
          'Gently replenishes natural potassium and magnesium after morning diuretic pills to prevent leg cramps and dizziness.',
      },
      {
        name: 'Warm Cinnamon & Arjuna / Hibiscus Herbal Infusion',
        bestTime: 'Afternoon (4:00 PM)',
        preparation:
          'Steep a small piece of Ceylon cinnamon in warm water for 5 minutes; strain and sip slowly.',
        circulationAndDigestionBenefit:
          'Warm temperature keeps peripheral blood vessels relaxed and supports steady afternoon circulation.',
      },
    ],
    lightDigestibleMeals: [
      {
        timeOfDay: 'Morning',
        dishName: 'Warm Thin Oats Porridge with Stewed Apple',
        textureType: 'Smooth Semi-Liquid Porridge',
        ingredientsSummary:
          'Rolled oats cooked extra-soft in water or skim almond milk, topped with warm peeled stewed apple and a pinch of cinnamon.',
        whyEasyToDigest:
          'Soluble beta-glucan fiber binds excess cholesterol in the gut and digests smoothly alongside morning blood pressure tablets.',
      },
      {
        timeOfDay: 'Afternoon',
        dishName: 'Soft Moong Dal Khichdi with Bottle Gourd (Lauki)',
        textureType: 'Soft Mash / Spoonable Gruel',
        ingredientsSummary:
          'Equal parts white rice and split yellow moong dal pressure-cooked until porridge-soft with peeled bottle gourd and cumin.',
        whyEasyToDigest:
          'Requires almost zero stomach acid or heavy churning, preventing post-meal blood pressure drops (postprandial hypotension).',
      },
      {
        timeOfDay: 'Evening',
        dishName: 'Pureed Pumpkin, Carrot & Ginger Clear Soup',
        textureType: 'Silky Liquid Soup',
        ingredientsSummary:
          'Steamed pumpkin and carrot blended smooth with warm vegetable stock and a drop of olive oil.',
        whyEasyToDigest:
          'Empties from the stomach before bedtime so the heart does not have to work hard digesting heavy food overnight.',
      },
    ],
    foodsToAvoid: [
      'Pickles, canned soups, salted crackers, and papad (high sodium causes fluid retention and raises blood pressure)',
      'Deep-fried snacks or heavy red meat that thicken blood lipids and slow digestion',
      'Grapefruit juice (interferes with Lipitor and Norvasc metabolism in the liver)',
    ],
  },
  {
    id: 'stomach',
    organSystemTitle: 'Stomach & Gentle Digestive Tract',
    shortLabel: 'Stomach & Digestion',
    diseaseConditions:
      'Acid Reflux (GERD), Gastritis, Sensitive Stomach Lining, Bloating & Slow Digestion',
    circulationAndDigestionGoal:
      'Soothe the stomach lining with alkaline, low-fiber, warm semi-liquids that pass effortlessly from the stomach into the small intestine without acid splashback.',
    linkedMedicationsNote:
      'Pairs with Prilosec (Omeprazole 20mg) and Glucophage XR (Metformin 500mg). Protects the stomach mucosa and prevents medicine-induced nausea.',
    liquidAndHydrationFoods: [
      {
        name: 'Warm Rice Kanji (Strained Rice Starch Water) with Cumin',
        bestTime: 'Morning (8:30 AM) or Midday',
        preparation:
          'Warm liquid drained from boiling soft white rice, seasoned with a pinch of roasted cumin powder.',
        circulationAndDigestionBenefit:
          'Coats and calms irritated stomach walls while providing instant hydration and gentle glucose to the bloodstream.',
      },
      {
        name: 'Fennel (Saunf) & Chamomile Soothing Digestive Water',
        bestTime: '30 Minutes After Lunch or Dinner',
        preparation:
          '1 teaspoon fennel seeds steeped in warm water for 7 minutes and strained.',
        circulationAndDigestionBenefit:
          'Relaxes stomach spasms, releases trapped gas, and helps liquids pass smoothly through the digestive tract.',
      },
      {
        name: 'Diluted Buttermilk (Chaas) with Ginger & Mint',
        bestTime: 'Afternoon (1:30 PM with Lunch)',
        preparation:
          '1 part fresh sweet curd whisked with 3 parts room-temperature water and a pinch of roasted jeera.',
        circulationAndDigestionBenefit:
          'Natural probiotics restore healthy gut flora without the heaviness of whole milk or cheese.',
      },
      {
        name: 'Clear Steamed Ash Gourd or Zucchini Broth',
        bestTime: 'Evening (6:30 PM)',
        preparation:
          'Peeled ash gourd or zucchini simmered in water until translucent, blended and strained into a light sip.',
        circulationAndDigestionBenefit:
          'Naturally alkaline liquid that neutralizes evening stomach acid and keeps circulation hydrated.',
      },
    ],
    lightDigestibleMeals: [
      {
        timeOfDay: 'Morning',
        dishName: 'Soft Steamed Idli or Rice Flake Poha in Warm Broth',
        textureType: 'Fluffy / Pre-Fermented Soft Bite',
        ingredientsSummary:
          '2 soft steamed rice-lentil idlis soaked in warm mild vegetable broth (no chili or tamarind).',
        whyEasyToDigest:
          'Fermentation pre-breaks down starches and proteins so the stomach digests them in under 45 minutes.',
      },
      {
        timeOfDay: 'Afternoon',
        dishName: 'Mashed Curd Rice with Steamed Carrot & Pomegranate',
        textureType: 'Creamy Soft Mash',
        ingredientsSummary:
          'Overcooked soft rice mashed with fresh low-fat yogurt and tempered with a tiny pinch of asafoetida (hing).',
        whyEasyToDigest:
          'Cools stomach inflammation and pairs gently with afternoon tablets like Metformin.',
      },
      {
        timeOfDay: 'Evening',
        dishName: 'Ripe Papaya & Stewed Pear Puree with Thin Arrowroot Gruel',
        textureType: 'Smooth Puree',
        ingredientsSummary:
          '1 bowl of ripe mashed papaya alongside warm arrowroot or sago (sabudana) liquid gruel.',
        whyEasyToDigest:
          'Papaya contains natural papain enzymes that dissolve proteins gently and prevent nighttime reflux.',
      },
    ],
    foodsToAvoid: [
      'Raw onions, garlic chili sauces, citrus juices, and tomato gravies (trigger acid reflux)',
      'Coffee or strong black tea on an empty stomach',
      'Carbonated sodas and ice-cold water during meals (slows digestive enzyme activity)',
    ],
  },
  {
    id: 'lungs',
    organSystemTitle: 'Lungs, Airways & Oxygen Circulation',
    shortLabel: 'Lungs & Breathing',
    diseaseConditions:
      'COPD, Asthma, Chronic Bronchitis, Mucus Congestion & Shortness of Breath',
    circulationAndDigestionGoal:
      'Prevent a bloated stomach from pressing up against the diaphragm, while using warm anti-inflammatory liquids to thin airway mucus and improve oxygen circulation.',
    linkedMedicationsNote:
      'Supports seniors using inhalers, nebulizers, or blood pressure medications by keeping airways moist and preventing diaphragm crowding.',
    liquidAndHydrationFoods: [
      {
        name: 'Warm Tulsi (Holy Basil), Ginger & Black Pepper Clear Tea',
        bestTime: 'Morning (7:30 AM) & Late Afternoon (4:30 PM)',
        preparation:
          'Simmer 4 tulsi leaves and 2 thin slices of fresh ginger in water for 5 minutes; strain and sip warm.',
        circulationAndDigestionBenefit:
          'Naturally warms the bronchial passages, thins sticky phlegm, and opens airway micro-circulation.',
      },
      {
        name: 'Warm Clear Chicken or Mushroom-Herb Consommé',
        bestTime: 'Midday (12:30 PM) or Evening (6:30 PM)',
        preparation:
          'Skimmed, fat-free clear broth simmered with thyme, celery, ginger, and turmeric.',
        circulationAndDigestionBenefit:
          'Warm steam and natural amino acids (cysteine) loosen chest congestion and hydrate the lungs without filling up the stomach.',
      },
      {
        name: 'Warm Golden Almond Milk (Dairy-Free Turmeric Sip)',
        bestTime: '1 Hour Before Bedtime (8:30 PM)',
        preparation:
          'Warm unsweetened almond or oat milk stirred with a quarter teaspoon of turmeric and a pinch of nutmeg.',
        circulationAndDigestionBenefit:
          'Unlike heavy cow milk that can thicken throat mucus in some seniors, warm plant milk calms nighttime coughs.',
      },
      {
        name: 'Warm Apple-Pear Peel & Cinnamon Hydration Water',
        bestTime: 'Sip Throughout the Day',
        preparation:
          'Apple and pear slices simmered in water with a cinnamon stick until fragrant; strain and keep in a thermos.',
        circulationAndDigestionBenefit:
          'Provides quercetin flavonoids that protect lung tissue and keep blood viscosity thin for easy oxygen transport.',
      },
    ],
    lightDigestibleMeals: [
      {
        timeOfDay: 'Morning',
        dishName: 'Warm Ragi (Finger Millet) or Oats Malt Liquid Porridge',
        textureType: 'Drinkable Warm Malt',
        ingredientsSummary:
          '2 tablespoons sprouted ragi or oat flour cooked into a thin, smooth drinkable porridge.',
        whyEasyToDigest:
          'Gives high iron and calcium for oxygen transport without requiring heavy chewing when short of breath.',
      },
      {
        timeOfDay: 'Afternoon',
        dishName: 'Soft Steamed Fish or Tofu in Warm Ginger-Lemon Broth',
        textureType: 'Flaky Soft Protein in Clear Broth',
        ingredientsSummary:
          'Poached white fish or silken tofu served in a warm, light ginger-coriander clear soup with soft rice.',
        whyEasyToDigest:
          'High-quality protein maintains breathing muscle strength while low carbohydrate volume prevents excess CO2 production.',
      },
      {
        timeOfDay: 'Evening',
        dishName: 'Small Bowl of Warm Spinach, Lentil & Garlic Puree Soup',
        textureType: 'Smooth Velvety Soup',
        ingredientsSummary:
          'Blended spinach and yellow lentil soup eaten early in the evening.',
        whyEasyToDigest:
          'Small, nutrient-dense liquid volume leaves plenty of room for the diaphragm to expand during sleep.',
      },
    ],
    foodsToAvoid: [
      'Large, heavy dinners or gas-forming beans/cabbage (bloating pushes against the diaphragm and makes breathing harder)',
      'Ice-cold drinks, ice cream, or chilled juices (can trigger bronchial constriction and coughing)',
      'Sulfite-preserved dried fruits or processed Deli meats',
    ],
  },
  {
    id: 'diabetes',
    organSystemTitle: 'Blood Sugar & Micro-Vessel Circulation',
    shortLabel: 'Sugar & Kidney Flow',
    diseaseConditions:
      'Type 2 Diabetes, Pre-Diabetes, Peripheral Neuropathy & Gentle Kidney Filtration',
    circulationAndDigestionGoal:
      'Deliver steady, slow-release nourishment in light liquid and soft forms that prevent blood sugar spikes and keep tiny blood vessels in the eyes, feet, and kidneys flowing freely.',
    linkedMedicationsNote:
      'Pairs with Glucophage XR (Metformin 500mg). Taking Metformin alongside soft fiber-rich midday meals prevents stomach upset and afternoon fatigue.',
    liquidAndHydrationFoods: [
      {
        name: 'Warm Fenugreek (Methi) & Cinnamon Infused Morning Water',
        bestTime: 'Early Morning (7:00 AM)',
        preparation:
          'Soak 1/2 teaspoon fenugreek seeds overnight in water; warm slightly in the morning, strain, and sip.',
        circulationAndDigestionBenefit:
          'Slows sugar absorption in the gut and improves insulin sensitivity and capillary blood flow.',
      },
      {
        name: 'Clear Barley Water (Jau Ka Pani) with Lemon',
        bestTime: 'Mid-Morning (11:00 AM)',
        preparation:
          '1 tablespoon pearl barley boiled in 3 cups water until translucent; strain the light liquid and add a squeeze of lemon.',
        circulationAndDigestionBenefit:
          'Flushes the kidneys gently, supports urinary tract health, and keeps blood sugar completely stable.',
      },
      {
        name: 'Warm Tomato, Spinach & Moong Sprout Clear Soup',
        bestTime: 'Evening Starter (6:30 PM)',
        preparation:
          'Steamed spinach, tomato, and sprouted moong simmered and blended into a thin, low-salt soup.',
        circulationAndDigestionBenefit:
          'Provides alpha-lipoic acid and antioxidants that protect nerve endings and foot circulation.',
      },
      {
        name: 'Spiced Chia & Cucumber Hydration Water (Room Temp)',
        bestTime: 'Afternoon (3:30 PM)',
        preparation:
          '1/2 teaspoon soaked chia seeds in room-temperature water with cucumber slices and mint.',
        circulationAndDigestionBenefit:
          'Soluble gel slows glucose entry into the bloodstream and prevents afternoon dehydration.',
      },
    ],
    lightDigestibleMeals: [
      {
        timeOfDay: 'Morning',
        dishName: 'Savory Vegetable & Broken Wheat (Dalia) Liquid Porridge',
        textureType: 'Soft Savory Porridge',
        ingredientsSummary:
          'Fine broken wheat or steel-cut oats cooked very soft in 4 parts water with grated bottle gourd and spinach.',
        whyEasyToDigest:
          'Low glycemic index keeps morning blood sugar flat while warm broth texture is gentle on senior teeth and stomach.',
      },
      {
        timeOfDay: 'Afternoon',
        dishName: 'Soft Green Moong Dal Soup with 1 Soft Phulka (Soaked) or Brown Rice Mash',
        textureType: 'Brothy Soft Meal (Take with Metformin 500mg)',
        ingredientsSummary:
          'Generous bowl of thin moong dal soup with steamed french beans and soft mashed grain.',
        whyEasyToDigest:
          'Buffers Metformin in the stomach to prevent nausea while providing steady afternoon energy.',
      },
      {
        timeOfDay: 'Evening',
        dishName: 'Steamed Tofu & Broccoli-Zucchini Veloute Soup',
        textureType: 'Smooth Blended Soup',
        ingredientsSummary:
          'Steamed zucchini, broccoli florets, and soft tofu blended with warm cumin-coriander broth.',
        whyEasyToDigest:
          'Zero simple sugars and ultra-light texture prevents overnight blood sugar rises.',
      },
    ],
    foodsToAvoid: [
      'Sweetened fruit juices, honey syrups, white bread, and sugary biscuits (cause rapid blood sugar spikes and thicken blood)',
      'Skipping meals when taking blood sugar medications',
      'Excessive salty snacks that strain kidney micro-vessels',
    ],
  },
];
