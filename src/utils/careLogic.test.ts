import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePriceSavings,
  calculateAdherenceStats,
  compareCompositions,
  filterMedicationsBySlot,
  createProactiveEmailEntry,
  filterDiseaseDietProfiles,
} from './careLogic';
import { validateAuthCredentials } from '../services/authStorage';
import {
  INITIAL_MEDICATIONS,
  INITIAL_FAMILY_MEMBERS,
} from '../data/initialCareData';
import { DISEASE_DIET_PROFILES } from '../data/diseaseDietData';

test('validateAuthCredentials validates email/Gmail and password requirements', () => {
  const validLogin = validateAuthCredentials('user@gmail.com', 'secret123', 'signin');
  assert.equal(validLogin.valid, true);

  const invalidEmail = validateAuthCredentials('not-an-email', 'secret123', 'signin');
  assert.equal(invalidEmail.valid, false);

  const shortPassword = validateAuthCredentials('user@gmail.com', '123', 'signup');
  assert.equal(shortPassword.valid, false);

  const mismatchPassword = validateAuthCredentials(
    'user@gmail.com',
    'password123',
    'signup',
    'different123'
  );
  assert.equal(mismatchPassword.valid, false);
});

test('calculatePriceSavings computes monthly, annual, and percentage savings accurately', () => {
  const savings = calculatePriceSavings(48.5, 8.4);
  assert.equal(savings.retailMonthly, 48.5);
  assert.equal(savings.onlineMonthly, 8.4);
  assert.equal(savings.monthlySavings, 40.1);
  assert.equal(savings.annualSavings, 481.2);
  assert.equal(savings.savingsPercent, 83);
});

test('calculateAdherenceStats tracks taken, due, upcoming doses and total savings', () => {
  const stats = calculateAdherenceStats(INITIAL_MEDICATIONS);
  assert.equal(stats.totalDoses, 4);
  assert.equal(stats.takenCount, 1);
  assert.equal(stats.dueNowCount, 2);
  assert.equal(stats.upcomingCount, 1);
  assert.ok(stats.adherencePercentage > 0 && stats.adherencePercentage <= 100);
  assert.ok(stats.totalMonthlySavings > 150);
});

test('compareCompositions compares Lasix (Furosemide 20mg) against Microzide (HCTZ 25mg)', () => {
  const lasix = INITIAL_MEDICATIONS[0];
  const hctz = lasix.alternatives[0];
  const comp = compareCompositions(lasix, hctz);

  assert.equal(comp.originalBrand, 'Lasix');
  assert.equal(comp.alternativeBrand, 'Microzide');
  assert.equal(comp.OriginalStrengthMg, 20);
  assert.equal(comp.alternativeStrengthMg, 25);
  assert.equal(comp.strengthDifferenceMg, 5);
  assert.equal(comp.isCheaperOnline, true);
});

test('filterMedicationsBySlot filters by time slot and search query', () => {
  const morningMeds = filterMedicationsBySlot(INITIAL_MEDICATIONS, 'Morning');
  assert.equal(morningMeds.length, 2);

  const waterPillSearch = filterMedicationsBySlot(INITIAL_MEDICATIONS, 'All', 'furosemide');
  assert.equal(waterPillSearch.length, 1);
  assert.equal(waterPillSearch[0].brandName, 'Lasix');
});

test('createProactiveEmailEntry builds a valid email dispatch log for family members', () => {
  const log = createProactiveEmailEntry(INITIAL_MEDICATIONS, INITIAL_FAMILY_MEMBERS);
  assert.equal(log.status, 'Delivered');
  assert.ok(log.recipientEmail.includes('caretaker@gmail.com'));
  assert.ok(log.subject.includes('Proactive Care Reminder'));
});

test('filterDiseaseDietProfiles returns heart, stomach, and lungs light & liquid diet plans', () => {
  const heartPlan = filterDiseaseDietProfiles(DISEASE_DIET_PROFILES, 'heart');
  assert.equal(heartPlan.length, 1);
  assert.ok(heartPlan[0].liquidAndHydrationFoods.length >= 3);

  const stomachSearch = filterDiseaseDietProfiles(DISEASE_DIET_PROFILES, 'all', 'reflux');
  assert.equal(stomachSearch.length, 1);
  assert.equal(stomachSearch[0].id, 'stomach');
});

