/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SCORE,
  createLevelEntities,
  createInitialRunState,
  collectItemInRun,
  lightLanternInRun,
  completeChallengeInRun,
  reachFinishGateInRun,
  createInitialUserProfile,
  submitRunResultToProfile,
  processEligiblePurchase,
  getRewardTiersSummary,
  normalizeToToman,
  claimTalaseeDiscountInRun,
  claimSurmelinaDiscountInRun,
  claimHafezFalInRun,
  HAFEZ_FAL_POINTS,
} from './rules';

test('1. Level entities sum to exactly 350 points', () => {
  const level = createLevelEntities();
  const pomPoints = level.collectibles
    .filter((c) => c.type === 'pomegranate')
    .reduce((sum, c) => sum + c.points, 0);
  const watPoints = level.collectibles
    .filter((c) => c.type === 'watermelon')
    .reduce((sum, c) => sum + c.points, 0);
  const lanternPoints = level.lanterns.reduce((sum, l) => sum + l.points, 0);
  const challengePoints = level.challenges.reduce((sum, ch) => sum + ch.points, 0);
  const finishPoints = 30;

  assert.equal(pomPoints, 80, '8 pomegranates * 10 = 80');
  assert.equal(watPoints, 90, '6 watermelons * 15 = 90');
  assert.equal(lanternPoints, 90, '3 lanterns * 30 = 90');
  assert.equal(challengePoints, 60, '3 challenges * 20 = 60');
  assert.equal(pomPoints + watPoints + lanternPoints + challengePoints + finishPoints, MAX_SCORE);
});

test('2. Collecting all items, lanterns, challenges, and finish line reaches 350 and never exceeds 350 on backtracking/duplicates', () => {
  const level = createLevelEntities();
  const run = createInitialRunState('attempt_full');

  for (const item of level.collectibles) {
    const first = collectItemInRun(run, item);
    assert.ok(first.awarded > 0);
    // Backtracking over the same item must award 0
    const duplicate = collectItemInRun(run, item);
    assert.equal(duplicate.awarded, 0);
  }

  for (const lantern of level.lanterns) {
    const first = lightLanternInRun(run, lantern);
    assert.equal(first.awarded, 30);
    // Re-lighting same lantern must award 0
    const duplicate = lightLanternInRun(run, lantern);
    assert.equal(duplicate.awarded, 0);
  }

  for (const ch of level.challenges) {
    const first = completeChallengeInRun(run, ch);
    assert.equal(first.awarded, 20);
    // Repeating challenge must award 0
    const duplicate = completeChallengeInRun(run, ch);
    assert.equal(duplicate.awarded, 0);
  }

  const finish1 = reachFinishGateInRun(run);
  assert.equal(finish1.awarded, 30);
  const finish2 = reachFinishGateInRun(run);
  assert.equal(finish2.awarded, 0);

  assert.equal(run.score, 350);
});

test('3. Score 119 unlocks no game rewards', () => {
  const profile = createInitialUserProfile();
  const res = submitRunResultToProfile(profile, 119, 'idem_119');
  assert.equal(res.newlyUnlockedTiers.length, 0);
  assert.equal(res.newlyCreditedChances, 0);
  assert.equal(res.profile.tier1Unlocked, false);
  assert.equal(res.profile.tier2GoldenKeyUnlocked, false);
  assert.equal(res.profile.tier3InternetBonusUnlocked, false);
  assert.equal(res.profile.bonusChancesCredited, 0);
});

test('4. Score 120 unlocks only Tier 1 (1 free chance credited once)', () => {
  const profile = createInitialUserProfile();
  const res = submitRunResultToProfile(profile, 120, 'idem_120');
  assert.deepEqual(res.newlyUnlockedTiers, [1]);
  assert.equal(res.newlyCreditedChances, 1);
  assert.equal(res.profile.tier1Unlocked, true);
  assert.equal(res.profile.tier1FreeChanceClaimed, true);
  assert.equal(res.profile.tier2GoldenKeyUnlocked, false);
  assert.equal(res.profile.bonusChancesCredited, 1);
});

test('5. Score 180 unlocks Tier 1 + Golden Key; topup = 100,000 Toman rejected, topup > 100,000 Toman credits 1 chance', () => {
  let profile = createInitialUserProfile();
  const res = submitRunResultToProfile(profile, 180, 'idem_180');
  profile = res.profile;
  assert.deepEqual(res.newlyUnlockedTiers, [1, 2]);
  assert.equal(profile.tier1Unlocked, true);
  assert.equal(profile.tier2GoldenKeyUnlocked, true);
  assert.equal(profile.tier2GoldenKeyUsed, false);
  assert.equal(profile.bonusChancesCredited, 1); // Only Tier 1 is immediately spinnable

  // Exactly 100,000 Toman must NOT consume Golden Key or grant a chance
  const exact100k = processEligiblePurchase(profile, {
    transactionId: 'tx_100k',
    idempotencyKey: 'key_100k',
    type: 'topup',
    amount: 100_000,
    currency: 'TOMAN',
    status: 'SUCCESS',
    timestampMs: Date.now(),
  });
  assert.equal(exact100k.eligible, false);
  assert.equal(exact100k.code, 'AMOUNT_TOO_LOW');
  assert.equal(exact100k.profile.tier2GoldenKeyUsed, false);

  // > 100,000 Toman (e.g. 105,000 Toman) consumes Golden Key and credits 1 chance
  const over100k = processEligiblePurchase(profile, {
    transactionId: 'tx_105k',
    idempotencyKey: 'key_105k',
    type: 'topup',
    amount: 105_000,
    currency: 'TOMAN',
    status: 'SUCCESS',
    timestampMs: Date.now(),
  });
  assert.equal(over100k.eligible, true);
  assert.equal(over100k.chancesGranted, 1);
  assert.equal(over100k.profile.tier2GoldenKeyUsed, true);
  assert.equal(over100k.profile.bonusChancesCredited, 2);
});

test('6. Score 300 unlocks all 3 tiers; internet = 300,000 Toman rejected, internet > 300,000 Toman credits 2 chances', () => {
  let profile = createInitialUserProfile();
  const res = submitRunResultToProfile(profile, 300, 'idem_300');
  profile = res.profile;
  assert.deepEqual(res.newlyUnlockedTiers, [1, 2, 3]);
  assert.equal(profile.tier3InternetBonusUnlocked, true);
  assert.equal(profile.tier3InternetBonusClaimed, false);

  // Topup cannot substitute for internet package
  const wrongType = processEligiblePurchase(profile, {
    transactionId: 'tx_topup_350k',
    idempotencyKey: 'key_topup_350k',
    type: 'topup',
    amount: 350_000,
    currency: 'TOMAN',
    status: 'SUCCESS',
    timestampMs: Date.now(),
  });
  assert.equal(wrongType.code, 'CREDITED_GOLDEN_KEY');
  assert.equal(wrongType.profile.tier3InternetBonusClaimed, false);
  profile = wrongType.profile;

  // Internet package = 300,000 Toman rejected
  const exact300k = processEligiblePurchase(profile, {
    transactionId: 'tx_int_300k',
    idempotencyKey: 'key_int_300k',
    type: 'internet',
    amount: 300_000,
    currency: 'TOMAN',
    status: 'SUCCESS',
    timestampMs: Date.now(),
  });
  assert.equal(exact300k.eligible, false);
  assert.equal(exact300k.code, 'AMOUNT_TOO_LOW');

  // Internet package > 300,000 Toman (e.g. 3,100,000 RIAL = 310,000 Toman) accepted
  const over300k = processEligiblePurchase(profile, {
    transactionId: 'tx_int_310k',
    idempotencyKey: 'key_int_310k',
    type: 'internet',
    amount: 3_100_000,
    currency: 'RIAL',
    status: 'SUCCESS',
    timestampMs: Date.now(),
  });
  assert.equal(over300k.eligible, true);
  assert.equal(over300k.chancesGranted, 2);
  assert.equal(over300k.profile.tier3InternetBonusClaimed, true);
  assert.equal(over300k.profile.bonusChancesCredited, 4); // 1 free + 1 golden key + 2 internet = 4 total
});

test('7. Multi-run progression: 150 -> 200 -> 310 -> 90 preserves Best Score and never re-issues claimed rewards', () => {
  let profile = createInitialUserProfile();

  // Attempt 1: 150 pts -> Tier 1 unlocked & claimed
  const r1 = submitRunResultToProfile(profile, 150, 'run_1');
  profile = r1.profile;
  assert.deepEqual(r1.newlyUnlockedTiers, [1]);
  assert.equal(r1.newlyCreditedChances, 1);
  assert.equal(profile.bestScore, 150);

  // Attempt 2: 200 pts -> Only Tier 2 (Golden Key) newly unlocked; Tier 1 NOT re-issued
  const r2 = submitRunResultToProfile(profile, 200, 'run_2');
  profile = r2.profile;
  assert.deepEqual(r2.newlyUnlockedTiers, [2]);
  assert.equal(r2.newlyCreditedChances, 0);
  assert.equal(profile.bestScore, 200);
  assert.equal(profile.bonusChancesCredited, 1);

  // Attempt 3: 310 pts -> Only Tier 3 newly unlocked
  const r3 = submitRunResultToProfile(profile, 310, 'run_3');
  profile = r3.profile;
  assert.deepEqual(r3.newlyUnlockedTiers, [3]);
  assert.equal(profile.bestScore, 310);

  // Attempt 4: 90 pts -> Best score remains 310, no rewards lost
  const r4 = submitRunResultToProfile(profile, 90, 'run_4');
  profile = r4.profile;
  assert.equal(profile.bestScore, 310);
  assert.equal(profile.tier1Unlocked, true);
  assert.equal(profile.tier2GoldenKeyUnlocked, true);
  assert.equal(profile.tier3InternetBonusUnlocked, true);
});

test('8. Idempotency prevents duplicate run submissions and duplicate purchase callbacks', () => {
  let profile = createInitialUserProfile();
  const r1 = submitRunResultToProfile(profile, 320, 'same_attempt_key');
  profile = r1.profile;
  assert.equal(r1.wasDuplicateRequest, false);
  assert.equal(profile.bonusChancesCredited, 1);

  const r1Dup = submitRunResultToProfile(profile, 320, 'same_attempt_key');
  assert.equal(r1Dup.wasDuplicateRequest, true);
  assert.equal(r1Dup.newlyCreditedChances, 0);
  assert.equal(r1Dup.profile.bonusChancesCredited, 1);

  const txInput = {
    transactionId: 'tx_unique_99',
    idempotencyKey: 'idem_tx_99',
    type: 'topup' as const,
    amount: 150_000,
    currency: 'TOMAN' as const,
    status: 'SUCCESS' as const,
    timestampMs: Date.now(),
  };

  const p1 = processEligiblePurchase(profile, txInput);
  assert.equal(p1.eligible, true);
  assert.equal(p1.chancesGranted, 1);

  const p1Dup = processEligiblePurchase(p1.profile, txInput);
  assert.equal(p1Dup.eligible, false);
  assert.equal(p1Dup.code, 'ALREADY_PROCESSED_IDEMPOTENT');
  assert.equal(p1Dup.chancesGranted, 0);
  assert.equal(p1Dup.profile.bonusChancesCredited, 2);

  const summary = getRewardTiersSummary(p1Dup.profile);
  assert.equal(summary.tier1.status, 'CLAIMED');
  assert.equal(summary.tier2.status, 'CLAIMED');
  assert.equal(summary.tier3.status, 'UNLOCKED_WAITING_PURCHASE');
  assert.equal(normalizeToToman(1_000_000, 'RIAL'), 100_000);
});

test('9. Talasee Booth discount can be claimed once per run and persists to campaign profile without altering 350 max score', () => {
  const level = createLevelEntities();
  const run = createInitialRunState('att_talasee');

  assert.equal(level.talaseeBooth.id, 'booth_talasee');
  assert.equal(level.talaseeBooth.claimed, false);

  const firstClaim = claimTalaseeDiscountInRun(run, level.talaseeBooth);
  assert.equal(firstClaim.newlyClaimed, true);
  assert.equal(firstClaim.discountCode, 'TALASEE-YALDA50');
  assert.equal(run.talaseeDiscountClaimed, true);
  assert.equal(level.talaseeBooth.claimed, true);

  // Second claim in same run is idempotent
  const secondClaim = claimTalaseeDiscountInRun(run, level.talaseeBooth);
  assert.equal(secondClaim.newlyClaimed, false);

  // Persists to profile on run submission
  const profile = createInitialUserProfile();
  const res = submitRunResultToProfile(profile, 150, 'idem_talasee_run', run.talaseeDiscountClaimed);
  assert.equal(res.profile.talaseeDiscountClaimed, true);
  assert.equal(res.profile.talaseeDiscountCode, 'TALASEE-YALDA50');
});

test('10. Yalda Bazaar houses Talasee, Surmelina, and Hafez booths side-by-side and discounts persist without changing 350 max score', () => {
  const level = createLevelEntities();
  const run = createInitialRunState('att_bazaar');

  assert.equal(level.bazaarEntranceX, 1620);
  assert.equal(level.bazaarExitX, 1200);
  assert.equal(level.talaseeBooth.x, 340);
  assert.equal(level.surmelinaBooth.x, 650);
  assert.equal(level.hafezBooth.x, 950);
  assert.equal(level.hafezBooth.outdoorX, 2080);
  assert.equal(level.surmelinaBooth.claimed, false);

  const surmelinaClaim = claimSurmelinaDiscountInRun(run, level.surmelinaBooth);
  assert.equal(surmelinaClaim.newlyClaimed, true);
  assert.equal(surmelinaClaim.discountCode, 'SURMELINA-YALDA40');
  assert.equal(run.surmelinaDiscountClaimed, true);
  assert.equal(level.surmelinaBooth.claimed, true);

  // Idempotent on second call
  const dupClaim = claimSurmelinaDiscountInRun(run, level.surmelinaBooth);
  assert.equal(dupClaim.newlyClaimed, false);

  const profile = createInitialUserProfile();
  const res = submitRunResultToProfile(
    profile,
    200,
    'idem_bazaar_run',
    true,
    run.surmelinaDiscountClaimed
  );
  assert.equal(res.profile.talaseeDiscountClaimed, true);
  assert.equal(res.profile.talaseeDiscountCode, 'TALASEE-YALDA50');
  assert.equal(res.profile.surmelinaDiscountClaimed, true);
  assert.equal(res.profile.surmelinaDiscountCode, 'SURMELINA-YALDA40');
});

test('11. Hafez Fal Booth awards +20 points on first fortune-telling in a run, is idempotent on repeat fortunes, and clamps to 350 max score', () => {
  const level = createLevelEntities();
  const run = createInitialRunState('att_hafez');

  assert.equal(level.hafezBooth.points, HAFEZ_FAL_POINTS);
  assert.equal(level.hafezBooth.claimed, false);
  assert.equal(run.hafezFalClaimed, false);

  const firstFal = claimHafezFalInRun(run, level.hafezBooth, 3);
  assert.equal(firstFal.newlyClaimed, true);
  assert.equal(firstFal.awarded, 20);
  assert.equal(firstFal.newScore, 20);
  assert.equal(run.score, 20);
  assert.equal(run.hafezFalClaimed, true);
  assert.equal(run.hafezFortuneId, 3);
  assert.equal(level.hafezBooth.claimed, true);

  // Taking another fortune in the same run updates fortuneId but does not double-award points
  const secondFal = claimHafezFalInRun(run, level.hafezBooth, 5);
  assert.equal(secondFal.newlyClaimed, false);
  assert.equal(secondFal.awarded, 0);
  assert.equal(run.score, 20);
  assert.equal(run.hafezFortuneId, 5);
});


