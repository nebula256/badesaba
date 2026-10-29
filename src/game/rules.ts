/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_SCORE = 350;
export const GAME_DURATION_SEC = 60;
export const WORLD_LENGTH = 3200;
export const GROUND_Y = 420;
export const GRAVITY = 1550;
export const PLAYER_MOVE_SPEED = 245;
export const PLAYER_JUMP_VELOCITY = -620;

export const SCORE_VALUES = {
  POMEGRANATE: 10,
  WATERMELON: 15,
  LANTERN: 30,
  CHALLENGE: 20,
  FINISH: 30,
} as const;

export const ITEM_COUNTS = {
  POMEGRANATE: 8,
  WATERMELON: 6,
  LANTERN: 3,
  CHALLENGE: 3,
  FINISH: 1,
} as const;

export const REWARD_THRESHOLDS = {
  TIER_1_FREE_CHANCE: 120,
  TIER_2_GOLDEN_KEY: 180,
  TIER_3_INTERNET_BONUS: 300,
} as const;

export const PURCHASE_MIN_TOMAN = {
  TOPUP_EXCLUSIVE_MIN: 100_000, // Strictly > 100,000 Toman
  INTERNET_EXCLUSIVE_MIN: 300_000, // Strictly > 300,000 Toman
} as const;

export const MAX_CAMPAIGN_BONUS_CHANCES = 4;

export type CollectibleType = 'pomegranate' | 'watermelon';
export type ChallengeType = 'gap_jump' | 'high_platform' | 'gate_lever';

export interface CollectibleItem {
  id: string;
  type: CollectibleType;
  x: number;
  y: number;
  points: number;
  collected: boolean;
  zone: 1 | 2 | 3;
}

export interface LanternItem {
  id: string;
  x: number;
  y: number;
  points: number;
  lit: boolean;
  zone: 1 | 2 | 3;
  label: string;
}

export interface ChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  triggerX: number;
  triggerY: number;
  width: number;
  height: number;
  points: number;
  completed: boolean;
  requiresInteraction: boolean;
  zone: 1 | 2 | 3;
}

export interface PlatformRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: 'wood' | 'stone' | 'carpet';
}

export interface ObstacleRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'crate' | 'snowdrift' | 'basket' | 'locked_gate';
  label: string;
}

export interface GapZone {
  id: string;
  startX: number;
  endX: number;
  label: string;
}

export interface TalaseeBooth {
  id: string;
  x: number;
  y: number;
  width: number;
  claimed: boolean;
  discountCode: string;
  discountTitleFa: string;
  discountAmountFa: string;
}

export interface SurmelinaBooth {
  id: string;
  x: number;
  y: number;
  width: number;
  claimed: boolean;
  discountCode: string;
  discountTitleFa: string;
  discountAmountFa: string;
}

export interface HafezBooth {
  id: string;
  x: number;
  outdoorX: number;
  y: number;
  width: number;
  points: number;
  claimed: boolean;
}

export const HAFEZ_FAL_POINTS = 20;

export const TALASEE_DISCOUNT_DEFAULT = {
  code: 'TALASEE-YALDA50',
  titleFa: 'تخفیف ۵۰٬۰۰۰ تومانی خرید طلای آب‌شده در طلاسی',
  amountFa: '۵۰٬۰۰۰ تومان هدیه طلاسی',
} as const;

export const SURMELINA_DISCOUNT_DEFAULT = {
  code: 'SURMELINA-YALDA40',
  titleFa: '۴۰٪ تخفیف ویژه خرید بادی‌کلن و محصولات خوشبوکننده سورملینا',
  amountFa: '۴۰٪ تخفیف سورملینا',
} as const;

export interface RunSessionState {
  attemptId: string;
  campaignId: string;
  collectedIds: Set<string>;
  litLanternIds: Set<string>;
  completedChallengeIds: Set<string>;
  finishReached: boolean;
  score: number;
  elapsedSec: number;
  gateLeverPulled: boolean;
  talaseeDiscountClaimed: boolean;
  talaseeDiscountCode: string | null;
  surmelinaDiscountClaimed: boolean;
  surmelinaDiscountCode: string | null;
  hafezFalClaimed: boolean;
  hafezFortuneId: number | null;
}

export type RewardStatus =
  | 'LOCKED'
  | 'UNLOCKED_READY'
  | 'UNLOCKED_WAITING_PURCHASE'
  | 'CLAIMED';

export interface UserCampaignProfile {
  anonymousUserId: string;
  campaignId: string;
  bestScore: number;
  attemptsCount: number;
  // Unlock flags (sticky across attempts)
  tier1Unlocked: boolean; // >= 120
  tier2GoldenKeyUnlocked: boolean; // >= 180
  tier3InternetBonusUnlocked: boolean; // >= 300
  // Claimed flags (each strictly once per campaign)
  tier1FreeChanceClaimed: boolean;
  tier2GoldenKeyUsed: boolean;
  tier3InternetBonusClaimed: boolean;
  // Talasee Booth special discount reward
  talaseeDiscountClaimed: boolean;
  talaseeDiscountCode: string | null;
  // Surmelina Booth special discount reward
  surmelinaDiscountClaimed: boolean;
  surmelinaDiscountCode: string | null;
  // Total bonus chances credited from this Yalda game (max 4)
  bonusChancesCredited: number;
  // Regular wheel chances in Badesaba account
  baseWheelChances: number;
  // Idempotency log of processed request/transaction keys
  processedIdempotencyKeys: string[];
}

export interface PurchaseTransactionInput {
  transactionId: string;
  idempotencyKey: string;
  type: 'topup' | 'internet';
  amount: number;
  currency: 'TOMAN' | 'RIAL';
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  timestampMs: number;
}

export interface PurchaseEvaluationResult {
  eligible: boolean;
  chancesGranted: number;
  amountInToman: number;
  reasonFa: string;
  code:
    | 'CREDITED_GOLDEN_KEY'
    | 'CREDITED_INTERNET_BONUS'
    | 'ALREADY_PROCESSED_IDEMPOTENT'
    | 'TRANSACTION_NOT_SUCCESSFUL'
    | 'REWARD_NOT_UNLOCKED_YET'
    | 'REWARD_ALREADY_CONSUMED'
    | 'AMOUNT_TOO_LOW'
    | 'CAMPAIGN_CAP_REACHED';
  profile: UserCampaignProfile;
}

/**
 * Converts Rial or Toman explicitly to Toman integer.
 */
export function normalizeToToman(amount: number, currency: 'TOMAN' | 'RIAL'): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (currency === 'RIAL') {
    return Math.floor(amount / 10);
  }
  return Math.floor(amount);
}

/**
 * Creates a fresh deterministic level layout with:
 * - 8 Pomegranates (8 * 10 = 80)
 * - 6 Watermelons (6 * 15 = 90)
 * - 3 Unlit Lanterns (3 * 30 = 90)
 * - 3 Environmental Challenges (3 * 20 = 60)
 * - 1 Finish Gate at x=3020 (+30)
 * - 1 Interactive Talasee Booth (غرفه طلاسی) at x=645
 * Total = 350 points.
 */
export function createLevelEntities(): {
  collectibles: CollectibleItem[];
  lanterns: LanternItem[];
  challenges: ChallengeDefinition[];
  platforms: PlatformRect[];
  obstacles: ObstacleRect[];
  gaps: GapZone[];
  bazaarEntranceX: number;
  bazaarExitX: number;
  talaseeBooth: TalaseeBooth;
  surmelinaBooth: SurmelinaBooth;
  hafezBooth: HafezBooth;
  finishX: number;
} {
  // 8 Pomegranates (80 pts)
  const collectibles: CollectibleItem[] = [
    // Zone 1: Snowy Alley (0 - 1100)
    { id: 'pom_1', type: 'pomegranate', x: 260, y: 375, points: 10, collected: false, zone: 1 },
    { id: 'pom_2', type: 'pomegranate', x: 435, y: 300, points: 10, collected: false, zone: 1 },
    { id: 'pom_3', type: 'pomegranate', x: 495, y: 300, points: 10, collected: false, zone: 1 },
    { id: 'pom_4', type: 'pomegranate', x: 960, y: 295, points: 10, collected: false, zone: 1 },
    // Zone 2: Yalda Bazaar (1100 - 2300)
    { id: 'pom_5', type: 'pomegranate', x: 1290, y: 375, points: 10, collected: false, zone: 2 },
    { id: 'pom_6', type: 'pomegranate', x: 1805, y: 280, points: 10, collected: false, zone: 2 },
    // Zone 3: Festival Path (2300 - 3200)
    { id: 'pom_7', type: 'pomegranate', x: 2430, y: 375, points: 10, collected: false, zone: 3 },
    { id: 'pom_8', type: 'pomegranate', x: 2840, y: 290, points: 10, collected: false, zone: 3 },

    // 6 Watermelons (90 pts)
    { id: 'wat_1', type: 'watermelon', x: 810, y: 270, points: 15, collected: false, zone: 1 },
    { id: 'wat_2', type: 'watermelon', x: 1450, y: 245, points: 15, collected: false, zone: 2 },
    { id: 'wat_3', type: 'watermelon', x: 1805, y: 375, points: 15, collected: false, zone: 2 },
    { id: 'wat_4', type: 'watermelon', x: 1960, y: 205, points: 15, collected: false, zone: 2 },
    { id: 'wat_5', type: 'watermelon', x: 2560, y: 260, points: 15, collected: false, zone: 3 },
    { id: 'wat_6', type: 'watermelon', x: 2920, y: 375, points: 15, collected: false, zone: 3 },
  ];

  // 3 Lanterns (3 * 30 = 90 pts)
  const lanterns: LanternItem[] = [
    { id: 'lan_1', x: 520, y: 345, points: 30, lit: false, zone: 1, label: 'فانوس کوچه برفی' },
    { id: 'lan_2', x: 1340, y: 345, points: 30, lit: false, zone: 2, label: 'فانوس چهارسوق بازار' },
    { id: 'lan_3', x: 2680, y: 345, points: 30, lit: false, zone: 3, label: 'فانوس طاق نصرت یلدا' },
  ];

  // 3 Challenges (3 * 20 = 60 pts)
  const challenges: ChallengeDefinition[] = [
    {
      id: 'chal_gap_1',
      type: 'gap_jump',
      title: 'پرش از جوی برفی',
      description: 'عبور موفق از روی جوی آب یخ‌زده کوچه',
      triggerX: 835,
      triggerY: 240,
      width: 55,
      height: 180,
      points: 20,
      completed: false,
      requiresInteraction: false,
      zone: 1,
    },
    {
      id: 'chal_plat_2',
      type: 'high_platform',
      title: 'سکوی بام بازار یلدا',
      description: 'پرش و رسیدن به سکوی مرتفع غرفه بازار',
      triggerX: 1930,
      triggerY: 185,
      width: 80,
      height: 70,
      points: 20,
      completed: false,
      requiresInteraction: false,
      zone: 2,
    },
    {
      id: 'chal_lever_3',
      type: 'gate_lever',
      title: 'اهرم دروازه جشن',
      description: 'فعال‌کردن اهرم سنتی برای گشودن مسیر دروازه گردونه',
      triggerX: 2330,
      triggerY: 335,
      width: 70,
      height: 85,
      points: 20,
      completed: false,
      requiresInteraction: true,
      zone: 3,
    },
  ];

  const platforms: PlatformRect[] = [
    // Zone 1 platforms
    { id: 'plat_1', x: 400, y: 335, width: 110, height: 18, style: 'wood' },
    { id: 'plat_2', x: 910, y: 330, width: 115, height: 18, style: 'wood' },
    // Zone 2 bazaar platforms
    { id: 'plat_3', x: 1380, y: 325, width: 140, height: 18, style: 'wood' },
    { id: 'plat_4', x: 1740, y: 315, width: 130, height: 18, style: 'carpet' },
    { id: 'plat_5', x: 1900, y: 245, width: 135, height: 18, style: 'carpet' },
    // Zone 3 festival platforms
    { id: 'plat_6', x: 2500, y: 310, width: 130, height: 18, style: 'stone' },
    { id: 'plat_7', x: 2790, y: 325, width: 115, height: 18, style: 'stone' },
  ];

  const obstacles: ObstacleRect[] = [
    { id: 'obs_1', x: 330, y: 382, width: 38, height: 38, kind: 'crate', label: 'جعبه چوبی' },
    { id: 'obs_2', x: 1200, y: 380, width: 44, height: 40, kind: 'basket', label: 'سبد انار' },
    { id: 'obs_3', x: 1860, y: 382, width: 38, height: 38, kind: 'crate', label: 'صندوقچه بازار' },
    { id: 'obs_4', x: 2150, y: 384, width: 48, height: 36, kind: 'snowdrift', label: 'توده برف' },
    { id: 'obs_gate', x: 2390, y: 310, width: 26, height: 110, kind: 'locked_gate', label: 'دروازه چوبی مسیر جشن' },
    { id: 'obs_5', x: 2735, y: 382, width: 38, height: 38, kind: 'basket', label: 'سبد هندوانه' },
  ];

  const gaps: GapZone[] = [
    { id: 'gap_1', startX: 760, endX: 830, label: 'جوی آب کوچه برفی' },
  ];

  // Inside the Bazaar (بازارچه): Booth 1 is Talasee (x=340), Booth 2 is Surmelina (x=650)
  const talaseeBooth: TalaseeBooth = {
    id: 'booth_talasee',
    x: 340,
    y: GROUND_Y,
    width: 150,
    claimed: false,
    discountCode: TALASEE_DISCOUNT_DEFAULT.code,
    discountTitleFa: TALASEE_DISCOUNT_DEFAULT.titleFa,
    discountAmountFa: TALASEE_DISCOUNT_DEFAULT.amountFa,
  };

  const surmelinaBooth: SurmelinaBooth = {
    id: 'booth_surmelina',
    x: 650,
    y: GROUND_Y,
    width: 150,
    claimed: false,
    discountCode: SURMELINA_DISCOUNT_DEFAULT.code,
    discountTitleFa: SURMELINA_DISCOUNT_DEFAULT.titleFa,
    discountAmountFa: SURMELINA_DISCOUNT_DEFAULT.amountFa,
  };

  const hafezBooth: HafezBooth = {
    id: 'booth_hafez',
    x: 950,
    outdoorX: 2080,
    y: GROUND_Y,
    width: 150,
    points: HAFEZ_FAL_POINTS,
    claimed: false,
  };

  return {
    collectibles,
    lanterns,
    challenges,
    platforms,
    obstacles,
    gaps,
    bazaarEntranceX: 1620,
    bazaarExitX: 1200,
    talaseeBooth,
    surmelinaBooth,
    hafezBooth,
    finishX: 3020,
  };
}

export function createInitialRunState(attemptId: string, campaignId = 'yalda_1405_badesaba'): RunSessionState {
  return {
    attemptId,
    campaignId,
    collectedIds: new Set<string>(),
    litLanternIds: new Set<string>(),
    completedChallengeIds: new Set<string>(),
    finishReached: false,
    score: 0,
    elapsedSec: 0,
    gateLeverPulled: false,
    talaseeDiscountClaimed: false,
    talaseeDiscountCode: null,
    surmelinaDiscountClaimed: false,
    surmelinaDiscountCode: null,
    hafezFalClaimed: false,
    hafezFortuneId: null,
  };
}

/**
 * Pure mutator for taking a Hafez Fortune (تفأل به دیوان حافظ) at the Hafez Booth.
 * Awards +20 points on the first fortune taken in a run, clamped to MAX_SCORE (350).
 */
export function claimHafezFalInRun(
  run: RunSessionState,
  booth: HafezBooth,
  fortuneId = 1
): { awarded: number; newScore: number; newlyClaimed: boolean } {
  run.hafezFortuneId = fortuneId;
  if (run.hafezFalClaimed || booth.claimed) {
    return {
      awarded: 0,
      newScore: run.score,
      newlyClaimed: false,
    };
  }
  const allowedAward = Math.min(booth.points, MAX_SCORE - run.score);
  run.hafezFalClaimed = true;
  booth.claimed = true;
  run.score = Math.min(MAX_SCORE, run.score + allowedAward);
  return {
    awarded: allowedAward,
    newScore: run.score,
    newlyClaimed: true,
  };
}

/**
 * Pure mutator for claiming the Talasee Booth discount in a run.
 * Idempotent: claiming multiple times only triggers once per run, and preserves the 350 max score invariant.
 */
export function claimTalaseeDiscountInRun(
  run: RunSessionState,
  booth: TalaseeBooth
): { newlyClaimed: boolean; discountCode: string; discountTitleFa: string } {
  if (run.talaseeDiscountClaimed || booth.claimed) {
    return {
      newlyClaimed: false,
      discountCode: booth.discountCode,
      discountTitleFa: booth.discountTitleFa,
    };
  }
  run.talaseeDiscountClaimed = true;
  run.talaseeDiscountCode = booth.discountCode;
  booth.claimed = true;
  return {
    newlyClaimed: true,
    discountCode: booth.discountCode,
    discountTitleFa: booth.discountTitleFa,
  };
}

/**
 * Pure mutator for claiming the Surmelina Booth discount in a run.
 * Idempotent: claiming multiple times only triggers once per run, and preserves the 350 max score invariant.
 */
export function claimSurmelinaDiscountInRun(
  run: RunSessionState,
  booth: SurmelinaBooth
): { newlyClaimed: boolean; discountCode: string; discountTitleFa: string } {
  if (run.surmelinaDiscountClaimed || booth.claimed) {
    return {
      newlyClaimed: false,
      discountCode: booth.discountCode,
      discountTitleFa: booth.discountTitleFa,
    };
  }
  run.surmelinaDiscountClaimed = true;
  run.surmelinaDiscountCode = booth.discountCode;
  booth.claimed = true;
  return {
    newlyClaimed: true,
    discountCode: booth.discountCode,
    discountTitleFa: booth.discountTitleFa,
  };
}

/**
 * Pure scoring mutator for collecting an item.
 * Guarantees each item ID only awards points once per attempt and clamps total score to MAX_SCORE (350).
 */
export function collectItemInRun(
  run: RunSessionState,
  item: CollectibleItem
): { awarded: number; newScore: number } {
  if (run.collectedIds.has(item.id) || item.collected) {
    return { awarded: 0, newScore: run.score };
  }
  const expectedPoints =
    item.type === 'pomegranate' ? SCORE_VALUES.POMEGRANATE : SCORE_VALUES.WATERMELON;
  const allowedAward = Math.min(expectedPoints, MAX_SCORE - run.score);
  run.collectedIds.add(item.id);
  item.collected = true;
  run.score = Math.min(MAX_SCORE, run.score + allowedAward);
  return { awarded: allowedAward, newScore: run.score };
}

/**
 * Pure scoring mutator for lighting an unlit lantern.
 * Guarantees lighting the same lantern twice gives 0 extra points.
 */
export function lightLanternInRun(
  run: RunSessionState,
  lantern: LanternItem
): { awarded: number; newScore: number } {
  if (run.litLanternIds.has(lantern.id) || lantern.lit) {
    return { awarded: 0, newScore: run.score };
  }
  const allowedAward = Math.min(SCORE_VALUES.LANTERN, MAX_SCORE - run.score);
  run.litLanternIds.add(lantern.id);
  lantern.lit = true;
  run.score = Math.min(MAX_SCORE, run.score + allowedAward);
  return { awarded: allowedAward, newScore: run.score };
}

/**
 * Pure scoring mutator for completing an environmental challenge.
 * Guarantees each challenge ID only awards points once per attempt.
 */
export function completeChallengeInRun(
  run: RunSessionState,
  challenge: ChallengeDefinition
): { awarded: number; newScore: number } {
  if (run.completedChallengeIds.has(challenge.id) || challenge.completed) {
    return { awarded: 0, newScore: run.score };
  }
  const allowedAward = Math.min(SCORE_VALUES.CHALLENGE, MAX_SCORE - run.score);
  run.completedChallengeIds.add(challenge.id);
  challenge.completed = true;
  if (challenge.type === 'gate_lever') {
    run.gateLeverPulled = true;
  }
  run.score = Math.min(MAX_SCORE, run.score + allowedAward);
  return { awarded: allowedAward, newScore: run.score };
}

/**
 * Pure scoring mutator for reaching the finish gate before timer expiration.
 * Only awards 30 points once.
 */
export function reachFinishGateInRun(run: RunSessionState): { awarded: number; newScore: number } {
  if (run.finishReached) {
    return { awarded: 0, newScore: run.score };
  }
  const allowedAward = Math.min(SCORE_VALUES.FINISH, MAX_SCORE - run.score);
  run.finishReached = true;
  run.score = Math.min(MAX_SCORE, run.score + allowedAward);
  return { awarded: allowedAward, newScore: run.score };
}

/**
 * Creates a clean user profile for a campaign.
 */
export function createInitialUserProfile(
  anonymousUserId = 'usr_badesaba_98241',
  campaignId = 'yalda_1405_badesaba'
): UserCampaignProfile {
  return {
    anonymousUserId,
    campaignId,
    bestScore: 0,
    attemptsCount: 0,
    tier1Unlocked: false,
    tier2GoldenKeyUnlocked: false,
    tier3InternetBonusUnlocked: false,
    tier1FreeChanceClaimed: false,
    tier2GoldenKeyUsed: false,
    tier3InternetBonusClaimed: false,
    talaseeDiscountClaimed: false,
    talaseeDiscountCode: null,
    surmelinaDiscountClaimed: false,
    surmelinaDiscountCode: null,
    bonusChancesCredited: 0,
    baseWheelChances: 1, // User's existing normal chance on the Badesaba wheel
    processedIdempotencyKeys: [],
  };
}

/**
 * Evaluates a completed or timed-out run against the user's campaign profile.
 * Rules enforced:
 * - Best Score is MAX(previous bestScore, valid runScore), never sum of runs.
 * - Previously unlocked rewards remain unlocked even if a later run has a lower score.
 * - Tier 1 (>= 120): 1 free wheel chance (no purchase required, auto-credited once on server confirmation).
 * - Tier 2 (>= 180): Golden Key unlocked (requires > 100,000 Toman top-up purchase to credit 1 chance).
 * - Tier 3 (>= 300): 2 Bonus Chances unlocked (requires > 300,000 Toman internet package purchase to credit 2 chances).
 */
export function submitRunResultToProfile(
  profile: UserCampaignProfile,
  runScore: number,
  idempotencyKey: string,
  talaseeClaimedInRun = false,
  surmelinaClaimedInRun = false
): {
  profile: UserCampaignProfile;
  newlyUnlockedTiers: (1 | 2 | 3)[];
  newlyCreditedChances: number;
  wasDuplicateRequest: boolean;
} {
  const clampedScore = Math.max(0, Math.min(MAX_SCORE, Math.floor(runScore)));
  const next: UserCampaignProfile = {
    ...profile,
    processedIdempotencyKeys: [...profile.processedIdempotencyKeys],
  };

  if (talaseeClaimedInRun) {
    next.talaseeDiscountClaimed = true;
    next.talaseeDiscountCode = TALASEE_DISCOUNT_DEFAULT.code;
  }

  if (surmelinaClaimedInRun) {
    next.surmelinaDiscountClaimed = true;
    next.surmelinaDiscountCode = SURMELINA_DISCOUNT_DEFAULT.code;
  }

  if (next.processedIdempotencyKeys.includes(idempotencyKey)) {
    return {
      profile: next,
      newlyUnlockedTiers: [],
      newlyCreditedChances: 0,
      wasDuplicateRequest: true,
    };
  }

  next.processedIdempotencyKeys.push(idempotencyKey);
  next.attemptsCount += 1;
  next.bestScore = Math.max(next.bestScore, clampedScore);

  const newlyUnlockedTiers: (1 | 2 | 3)[] = [];
  let newlyCreditedChances = 0;

  // Tier 1: >= 120
  if (next.bestScore >= REWARD_THRESHOLDS.TIER_1_FREE_CHANCE) {
    if (!next.tier1Unlocked) {
      next.tier1Unlocked = true;
      newlyUnlockedTiers.push(1);
    }
    if (!next.tier1FreeChanceClaimed && next.bonusChancesCredited < MAX_CAMPAIGN_BONUS_CHANCES) {
      next.tier1FreeChanceClaimed = true;
      next.bonusChancesCredited += 1;
      newlyCreditedChances += 1;
    }
  }

  // Tier 2: >= 180 (Golden Key - conditional on topup > 100,000 Toman)
  if (next.bestScore >= REWARD_THRESHOLDS.TIER_2_GOLDEN_KEY) {
    if (!next.tier2GoldenKeyUnlocked) {
      next.tier2GoldenKeyUnlocked = true;
      newlyUnlockedTiers.push(2);
    }
  }

  // Tier 3: >= 300 (2 Bonus Chances - conditional on internet package > 300,000 Toman)
  if (next.bestScore >= REWARD_THRESHOLDS.TIER_3_INTERNET_BONUS) {
    if (!next.tier3InternetBonusUnlocked) {
      next.tier3InternetBonusUnlocked = true;
      newlyUnlockedTiers.push(3);
    }
  }

  return {
    profile: next,
    newlyUnlockedTiers,
    newlyCreditedChances,
    wasDuplicateRequest: false,
  };
}

/**
 * Evaluates a purchase transaction (Top-up or Internet Package) against the user's unlocked rewards.
 * Enforces:
 * - Idempotency (same idempotencyKey or transactionId will not double-credit).
 * - Status must be 'SUCCESS'.
 * - Currency normalization (RIAL -> TOMAN).
 * - Strictly greater than threshold (> 100,000 Toman for topup; > 300,000 Toman for internet).
 * - Topup cannot substitute for internet package and vice versa.
 * - Reward must be unlocked first and not already consumed.
 * - Campaign bonus chances cap of 4.
 */
export function processEligiblePurchase(
  profile: UserCampaignProfile,
  tx: PurchaseTransactionInput
): PurchaseEvaluationResult {
  const next: UserCampaignProfile = {
    ...profile,
    processedIdempotencyKeys: [...profile.processedIdempotencyKeys],
  };

  const amountInToman = normalizeToToman(tx.amount, tx.currency);
  const compositeKey = `tx:${tx.transactionId}:${tx.idempotencyKey}`;

  if (
    next.processedIdempotencyKeys.includes(compositeKey) ||
    next.processedIdempotencyKeys.includes(tx.idempotencyKey) ||
    next.processedIdempotencyKeys.includes(tx.transactionId)
  ) {
    return {
      eligible: false,
      chancesGranted: 0,
      amountInToman,
      reasonFa: 'این تراکنش قبلاً بررسی و ثبت شده است (جلوگیری از ثبت تکراری).',
      code: 'ALREADY_PROCESSED_IDEMPOTENT',
      profile: next,
    };
  }

  if (tx.status !== 'SUCCESS') {
    return {
      eligible: false,
      chancesGranted: 0,
      amountInToman,
      reasonFa: 'تراکنش ناموفق، لغوشده یا برگشت‌خورده مشمول دریافت شانس تشویقی نمی‌شود.',
      code: 'TRANSACTION_NOT_SUCCESSFUL',
      profile: next,
    };
  }

  if (tx.type === 'topup') {
    if (!next.tier2GoldenKeyUnlocked) {
      return {
        eligible: false,
        chancesGranted: 0,
        amountInToman,
        reasonFa: 'کلید طلایی یلدا (حداقل ۱۸۰ امتیاز) هنوز در بازی آزاد نشده است.',
        code: 'REWARD_NOT_UNLOCKED_YET',
        profile: next,
      };
    }
    if (next.tier2GoldenKeyUsed) {
      return {
        eligible: false,
        chancesGranted: 0,
        amountInToman,
        reasonFa: 'کلید طلایی یلدا قبلاً استفاده شده و فقط یک‌بار در کمپین معتبر است.',
        code: 'REWARD_ALREADY_CONSUMED',
        profile: next,
      };
    }
    // Strictly greater than 100,000 Toman
    if (amountInToman <= PURCHASE_MIN_TOMAN.TOPUP_EXCLUSIVE_MIN) {
      return {
        eligible: false,
        chancesGranted: 0,
        amountInToman,
        reasonFa: `مبلغ خرید شارژ باید بیشتر از ۱۰۰٬۰۰۰ تومان باشد (مبلغ فعلی: ${amountInToman.toLocaleString('fa-IR')} تومان). خرید دقیقاً ۱۰۰٬۰۰۰ تومان واجدشرایط نیست.`,
        code: 'AMOUNT_TOO_LOW',
        profile: next,
      };
    }
    if (next.bonusChancesCredited + 1 > MAX_CAMPAIGN_BONUS_CHANCES) {
      return {
        eligible: false,
        chancesGranted: 0,
        amountInToman,
        reasonFa: 'سقف ۴ شانس تشویقی بازی در این کمپین تکمیل شده است.',
        code: 'CAMPAIGN_CAP_REACHED',
        profile: next,
      };
    }

    next.processedIdempotencyKeys.push(compositeKey, tx.idempotencyKey, tx.transactionId);
    next.tier2GoldenKeyUsed = true;
    next.bonusChancesCredited += 1;

    return {
      eligible: true,
      chancesGranted: 1,
      amountInToman,
      reasonFa: 'کلید طلایی یلدا با خرید موفق شارژ بالای ۱۰۰٬۰۰۰ تومان فعال شد و ۱ شانس گردونه به حساب شما اضافه گردید!',
      code: 'CREDITED_GOLDEN_KEY',
      profile: next,
    };
  }

  // tx.type === 'internet'
  if (!next.tier3InternetBonusUnlocked) {
    return {
      eligible: false,
      chancesGranted: 0,
      amountInToman,
      reasonFa: 'پاداش سطح سوم (حداقل ۳۰۰ امتیاز) هنوز در بازی آزاد نشده است.',
      code: 'REWARD_NOT_UNLOCKED_YET',
      profile: next,
    };
  }
  if (next.tier3InternetBonusClaimed) {
    return {
      eligible: false,
      chancesGranted: 0,
      amountInToman,
      reasonFa: 'پاداش دو شانس بسته اینترنت قبلاً دریافت شده و فقط یک‌بار در کمپین صادر می‌شود.',
      code: 'REWARD_ALREADY_CONSUMED',
      profile: next,
    };
  }
  // Strictly greater than 300,000 Toman
  if (amountInToman <= PURCHASE_MIN_TOMAN.INTERNET_EXCLUSIVE_MIN) {
    return {
      eligible: false,
      chancesGranted: 0,
      amountInToman,
      reasonFa: `مبلغ خرید بسته اینترنت باید بیشتر از ۳۰۰٬۰۰۰ تومان باشد (مبلغ فعلی: ${amountInToman.toLocaleString('fa-IR')} تومان). خرید دقیقاً ۳۰۰٬۰۰۰ تومان واجدشرایط نیست.`,
      code: 'AMOUNT_TOO_LOW',
      profile: next,
    };
  }

  const grantable = Math.min(2, MAX_CAMPAIGN_BONUS_CHANCES - next.bonusChancesCredited);
  if (grantable <= 0) {
    return {
      eligible: false,
      chancesGranted: 0,
      amountInToman,
      reasonFa: 'سقف ۴ شانس تشویقی بازی در این کمپین تکمیل شده است.',
      code: 'CAMPAIGN_CAP_REACHED',
      profile: next,
    };
  }

  next.processedIdempotencyKeys.push(compositeKey, tx.idempotencyKey, tx.transactionId);
  next.tier3InternetBonusClaimed = true;
  next.bonusChancesCredited += grantable;

  return {
    eligible: true,
    chancesGranted: grantable,
    amountInToman,
    reasonFa: `خرید بسته اینترنت بالای ۳۰۰٬۰۰۰ تومان تأیید شد و ${grantable} شانس تشویقی به حساب شما اضافه گردید!`,
    code: 'CREDITED_INTERNET_BONUS',
    profile: next,
  };
}

/**
 * Returns the UI status of each of the 3 reward tiers.
 */
export function getRewardTiersSummary(profile: UserCampaignProfile): {
  tier1: { status: RewardStatus; statusLabelFa: string };
  tier2: { status: RewardStatus; statusLabelFa: string };
  tier3: { status: RewardStatus; statusLabelFa: string };
  totalSpinnableChances: number;
} {
  const tier1Status: RewardStatus = !profile.tier1Unlocked
    ? 'LOCKED'
    : profile.tier1FreeChanceClaimed
      ? 'CLAIMED'
      : 'UNLOCKED_READY';

  const tier2Status: RewardStatus = !profile.tier2GoldenKeyUnlocked
    ? 'LOCKED'
    : profile.tier2GoldenKeyUsed
      ? 'CLAIMED'
      : 'UNLOCKED_WAITING_PURCHASE';

  const tier3Status: RewardStatus = !profile.tier3InternetBonusUnlocked
    ? 'LOCKED'
    : profile.tier3InternetBonusClaimed
      ? 'CLAIMED'
      : 'UNLOCKED_WAITING_PURCHASE';

  const labelMap: Record<RewardStatus, string> = {
    LOCKED: 'قفل (نیازمند امتیاز بیشتر)',
    UNLOCKED_READY: 'آزادشده — آماده دریافت',
    UNLOCKED_WAITING_PURCHASE: 'آزادشده، در انتظار خرید واجدشرایط',
    CLAIMED: 'دریافت‌شده در حساب بادصبا',
  };

  return {
    tier1: { status: tier1Status, statusLabelFa: labelMap[tier1Status] },
    tier2: { status: tier2Status, statusLabelFa: labelMap[tier2Status] },
    tier3: { status: tier3Status, statusLabelFa: labelMap[tier3Status] },
    // Notice: Unfulfilled purchase-conditional rewards are NEVER counted as spinnable wheel chances!
    totalSpinnableChances: profile.baseWheelChances + profile.bonusChancesCredited,
  };
}
