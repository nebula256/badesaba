/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserCampaignProfile,
  PurchaseTransactionInput,
  PurchaseEvaluationResult,
  createInitialUserProfile,
  submitRunResultToProfile,
  processEligiblePurchase,
} from '../game/rules';

export type YaldaGA4EventName =
  | 'yalda_game_view'
  | 'yalda_game_start'
  | 'yalda_item_collect'
  | 'yalda_lantern_light'
  | 'yalda_challenge_complete'
  | 'yalda_game_finish'
  | 'yalda_game_timeout'
  | 'yalda_reward_qualified'
  | 'yalda_reward_claimed'
  | 'yalda_golden_key_unlocked'
  | 'yalda_eligible_purchase'
  | 'yalda_bonus_chance_credited'
  | 'yalda_wheel_cta_click'
  | 'yalda_game_replay'
  | 'yalda_bazaar_enter'
  | 'yalda_bazaar_exit'
  | 'yalda_talasee_discount_claim'
  | 'yalda_surmelina_discount_claim';

export interface GA4EventRecord {
  id: string;
  event: YaldaGA4EventName;
  timestamp: string;
  params: Record<string, string | number | boolean>;
}

export const BADESABA_DEEP_LINK_CONFIG = {
  wheelDeepLink: 'badesaba://campaign/yalda-1405/lucky-wheel',
  webFallbackUrl: 'https://badesaba.ir/yalda-wheel-preview',
  topupDeepLink: 'badesaba://payment/topup?source=yalda_game&min_exclusive_toman=100000',
  internetDeepLink: 'badesaba://payment/internet?source=yalda_game&min_exclusive_toman=300000',
  talaseeDeepLink: 'badesaba://partner/talasee?code=TALASEE-YALDA50',
  surmelinaDeepLink: 'badesaba://partner/surmelina?code=SURMELINA-YALDA40',
};

class BadesabaIntegrationService {
  private profile: UserCampaignProfile;
  private eventLog: GA4EventRecord[] = [];
  private emittedDedupeKeys = new Set<string>();
  private simulateOffline = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.profile = createInitialUserProfile('usr_anon_badesaba_7741', 'yalda_1405_badesaba');
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  public isOfflineSimulated(): boolean {
    return this.simulateOffline;
  }

  public setOfflineSimulation(offline: boolean): void {
    this.simulateOffline = offline;
    this.notify();
  }

  public getProfile(): UserCampaignProfile {
    return this.profile;
  }

  public getEventLog(): GA4EventRecord[] {
    return this.eventLog;
  }

  /**
   * Emits a GA4 event with strict PII scrubbing and optional deduplication key.
   */
  public trackEvent(
    event: YaldaGA4EventName,
    params: Record<string, string | number | boolean> = {},
    dedupeKey?: string
  ): void {
    if (dedupeKey && this.emittedDedupeKeys.has(dedupeKey)) {
      return;
    }
    if (dedupeKey) {
      this.emittedDedupeKeys.add(dedupeKey);
    }

    // Ensure no raw phone numbers or sensitive tokens ever enter GA4 payload
    const sanitizedParams: Record<string, string | number | boolean> = {
      anonymous_user_id: this.profile.anonymousUserId,
      campaign_id: this.profile.campaignId,
      best_score: this.profile.bestScore,
      ...params,
    };
    delete sanitizedParams.phone_number;
    delete sanitizedParams.national_id;
    delete sanitizedParams.raw_user_id;

    const record: GA4EventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      event,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      params: sanitizedParams,
    };

    this.eventLog = [record, ...this.eventLog.slice(0, 99)];

    if (typeof window !== 'undefined' && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
        event,
        ...sanitizedParams,
      });
    }
    this.notify();
  }

  /**
   * Submits final game score to the Badesaba Backend (Mock Server Adapter with real idempotency & network check).
   * Never credits rewards locally if server confirmation fails!
   */
  public async submitGameScoreOnServer(payload: {
    attemptId: string;
    idempotencyKey: string;
    finalScore: number;
    elapsedSec: number;
    completedFinish: boolean;
    pomegranatesCount: number;
    watermelonsCount: number;
    lanternsCount: number;
    challengesCount: number;
    talaseeClaimed?: boolean;
    surmelinaClaimed?: boolean;
  }): Promise<{
    ok: boolean;
    errorFa?: string;
    profile: UserCampaignProfile;
    newlyUnlockedTiers: (1 | 2 | 3)[];
    newlyCreditedChances: number;
    wasDuplicateRequest: boolean;
  }> {
    await new Promise((r) => setTimeout(r, 120));

    if (this.simulateOffline) {
      return {
        ok: false,
        errorFa:
          'خطا در ارتباط با سرور بادصبا! به دلیل قطع اینترنت، امتیاز و پاداش این دور هنوز در سرور ثبت نشده است. لطفاً اتصال را برقرار کرده و دکمه تلاش مجدد ثبت سرور را بزنید.',
        profile: this.profile,
        newlyUnlockedTiers: [],
        newlyCreditedChances: 0,
        wasDuplicateRequest: false,
      };
    }

    const result = submitRunResultToProfile(
      this.profile,
      payload.finalScore,
      payload.idempotencyKey,
      Boolean(payload.talaseeClaimed),
      Boolean(payload.surmelinaClaimed)
    );
    this.profile = result.profile;

    // Fire server-verified GA4 reward events only after backend confirmation
    for (const tier of result.newlyUnlockedTiers) {
      this.trackEvent(
        'yalda_reward_qualified',
        {
          attempt_id: payload.attemptId,
          final_score: payload.finalScore,
          reward_tier: tier,
          credit_status: tier === 1 ? 'CREDITED' : 'WAITING_ELIGIBLE_PURCHASE',
        },
        `qual_${this.profile.campaignId}_tier_${tier}`
      );

      if (tier === 1) {
        this.trackEvent(
          'yalda_reward_claimed',
          {
            attempt_id: payload.attemptId,
            reward_tier: 1,
            chances_added: 1,
          },
          `claim_${this.profile.campaignId}_tier_1`
        );
        this.trackEvent(
          'yalda_bonus_chance_credited',
          {
            attempt_id: payload.attemptId,
            source: 'tier1_free_game_reward',
            chances_added: 1,
            total_bonus_chances: this.profile.bonusChancesCredited,
          },
          `credit_${this.profile.campaignId}_tier_1`
        );
      }

      if (tier === 2) {
        this.trackEvent(
          'yalda_golden_key_unlocked',
          {
            attempt_id: payload.attemptId,
            final_score: payload.finalScore,
            min_purchase_toman_exclusive: 100000,
          },
          `gkey_${this.profile.campaignId}`
        );
      }
    }

    this.notify();
    return {
      ok: true,
      profile: this.profile,
      newlyUnlockedTiers: result.newlyUnlockedTiers,
      newlyCreditedChances: result.newlyCreditedChances,
      wasDuplicateRequest: result.wasDuplicateRequest,
    };
  }

  /**
   * Verifies a top-up or internet package transaction on the Badesaba Backend.
   */
  public async verifyPurchaseTransactionOnServer(
    tx: PurchaseTransactionInput
  ): Promise<PurchaseEvaluationResult & { networkError?: boolean }> {
    await new Promise((r) => setTimeout(r, 120));

    if (this.simulateOffline) {
      return {
        eligible: false,
        networkError: true,
        chancesGranted: 0,
        amountInToman: tx.currency === 'RIAL' ? Math.floor(tx.amount / 10) : tx.amount,
        reasonFa:
          'ارتباط با سرور تراکنش‌های بادصبا برقرار نشد. تا زمان تأیید سرور، هیچ شانس اضافه‌ای صادر نمی‌شود.',
        code: 'TRANSACTION_NOT_SUCCESSFUL',
        profile: this.profile,
      };
    }

    const res = processEligiblePurchase(this.profile, tx);
    this.profile = res.profile;

    if (res.eligible && res.chancesGranted > 0) {
      this.trackEvent(
        'yalda_eligible_purchase',
        {
          purchase_type: tx.type,
          amount_toman: res.amountInToman,
          transaction_id: tx.transactionId,
          chances_granted: res.chancesGranted,
        },
        `purch_${tx.transactionId}`
      );
      this.trackEvent(
        'yalda_bonus_chance_credited',
        {
          source: tx.type === 'topup' ? 'tier2_golden_key_topup' : 'tier3_internet_package',
          chances_added: res.chancesGranted,
          total_bonus_chances: this.profile.bonusChancesCredited,
        },
        `credit_tx_${tx.transactionId}`
      );
      this.trackEvent(
        'yalda_reward_claimed',
        {
          reward_tier: tx.type === 'topup' ? 2 : 3,
          chances_added: res.chancesGranted,
        },
        `claim_tx_${tx.transactionId}`
      );
    }

    this.notify();
    return res;
  }

  /**
   * Resets campaign profile (for QA testing different score progressions from scratch).
   */
  public resetCampaignProfileForQA(): UserCampaignProfile {
    this.profile = createInitialUserProfile('usr_anon_badesaba_7741', 'yalda_1405_badesaba');
    this.emittedDedupeKeys.clear();
    this.notify();
    return this.profile;
  }
}

export const badesabaApi = new BadesabaIntegrationService();
