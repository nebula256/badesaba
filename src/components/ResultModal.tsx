/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  MAX_SCORE,
  TALASEE_DISCOUNT_DEFAULT,
  SURMELINA_DISCOUNT_DEFAULT,
  UserCampaignProfile,
  getRewardTiersSummary,
} from '../game/rules';
import { drawNariCharacter } from '../entities/nariRenderer';
import {
  BADESABA_DEEP_LINK_CONFIG,
  badesabaApi,
} from '../integrations/badesabaApi';
import { yaldaAudio } from '../systems/audio';

interface ResultModalProps {
  open: boolean;
  finalScore: number;
  finishReached: boolean;
  elapsedSec: number;
  profile: UserCampaignProfile;
  serverSyncError: string | null;
  onRetryServerSync: () => void;
  onPlayAgain: () => void;
  onProfileUpdated: (next: UserCampaignProfile) => void;
  onOpenDeliverables: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  open,
  finalScore,
  finishReached,
  elapsedSec,
  profile,
  serverSyncError,
  onRetryServerSync,
  onPlayAgain,
  onProfileUpdated,
  onOpenDeliverables,
}) => {
  const celebrateCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [wheelHandoffOpen, setWheelHandoffOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(() => badesabaApi.isOfflineSimulated());
  const [lastTxId, setLastTxId] = useState<string>('tx_topup_valid_105k');
  const [copiedTalasee, setCopiedTalasee] = useState(false);
  const [copiedSurmelina, setCopiedSurmelina] = useState(false);

  useEffect(() => {
    if (!open) {
      setWheelHandoffOpen(false);
      setPurchaseFeedback(null);
      setCopiedTalasee(false);
      setCopiedSurmelina(false);
      return;
    }

    let animId = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const canvas = celebrateCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const frameIndex = Math.floor(((now - start) / 1000) * 12) % 8;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Warm golden radial backdrop
          const grad = ctx.createRadialGradient(55, 60, 8, 55, 60, 52);
          grad.addColorStop(0, 'rgba(242, 191, 89, 0.38)');
          grad.addColorStop(1, 'rgba(23, 43, 77, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(55, 60, 52, 0, Math.PI * 2);
          ctx.fill();

          drawNariCharacter(ctx, {
            cx: 55,
            bottomY: 102,
            facing: 1,
            anim: 'celebrate',
            frameIndex,
            scaleX: 1.15,
            scaleY: 1.15,
          });
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [open]);

  if (!open) return null;

  const rewardSummary = getRewardTiersSummary(profile);

  const handleSimulatedPurchase = async (
    type: 'topup' | 'internet',
    amount: number,
    currency: 'TOMAN' | 'RIAL',
    customTxId?: string
  ) => {
    const txId = customTxId || `tx_${type}_${amount}_${Date.now()}`;
    setLastTxId(txId);
    const res = await badesabaApi.verifyPurchaseTransactionOnServer({
      transactionId: txId,
      idempotencyKey: `idem_${txId}`,
      type,
      amount,
      currency,
      status: 'SUCCESS',
      timestampMs: Date.now(),
    });
    if (res.eligible) {
      yaldaAudio.playRewardUnlock();
    }
    setPurchaseFeedback({
      ok: res.eligible,
      text: res.reasonFa,
    });
    onProfileUpdated(res.profile);
  };

  const handleToggleOffline = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    badesabaApi.setOfflineSimulation(next);
  };

  const handleWheelCtaClick = () => {
    badesabaApi.trackEvent('yalda_wheel_cta_click', {
      final_score: finalScore,
      best_score: profile.bestScore,
      spinnable_chances: rewardSummary.totalSpinnableChances,
      deep_link: BADESABA_DEEP_LINK_CONFIG.wheelDeepLink,
    });
    setWheelHandoffOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/78 p-3 md:p-5 pointer-events-auto overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="صفحه نتیجه ماجراجویی یلدایی"
    >
      <div className="relative w-full max-w-3xl bg-[#142645] border-2 border-[#F2BF59] rounded-2xl shadow-2xl p-4 md:p-6 text-[#F8E8CE] my-auto space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Top Row: Nari Celebrate + Title + Score Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#172B4D] p-3.5 rounded-xl border border-[#F2BF59]/30">
          <canvas
            ref={celebrateCanvasRef}
            width={110}
            height={112}
            className="shrink-0 rounded-xl bg-[#0F1E38] border border-[#F2BF59]/40"
          />
          <div className="flex-1 text-center sm:text-right space-y-1">
            <h2 className="text-lg md:text-xl font-black text-[#F2BF59]">
              آفرین! ماجراجویی یلدایی تموم شد!
            </h2>
            <p className="text-xs text-[#91C9D8]">
              {finishReached
                ? `در زمان ${Math.round(elapsedSec)} ثانیه با موفقیت به دروازه جشن یلدا رسیدی (+۳۰ امتیاز پایانی).`
                : 'زمان ۶۰ ثانیه‌ای بازی به پایان رسید و امتیاز معتبر کسب‌شده ثبت گردید.'}
            </p>
            {profile.bestScore < 120 && !serverSyncError && (
              <p className="text-xs text-[#F8E8CE] bg-[#A92342]/40 border border-[#D94758]/50 rounded-lg px-3 py-1.5 mt-1">
                تلاش خوبی بود! با کسب حداقل ۱۲۰ امتیاز در تلاش بعدی می‌توانی یک شانس رایگان گردونه بگیری. همین الان هم می‌توانی وارد صفحه گردونه بادصبا شوی.
              </p>
            )}
          </div>

          {/* Numeric Score Tiles */}
          <div className="flex sm:flex-col gap-2 shrink-0 font-num">
            <div className="px-3.5 py-2 rounded-xl bg-[#0F1E38] border border-[#F2BF59]/40 text-center">
              <div className="text-[11px] text-[#91C9D8]">امتیاز این دور</div>
              <div className="text-xl font-black text-[#F2BF59]" data-testid="result-final-score">
                {finalScore} <span className="text-xs font-normal text-[#F8E8CE]/70">/ {MAX_SCORE}</span>
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#0F1E38] border border-white/15 text-center">
              <div className="text-[11px] text-[#91C9D8]">بهترین رکورد (Best)</div>
              <div className="text-lg font-extrabold text-white" data-testid="result-best-score">
                {profile.bestScore} <span className="text-xs font-normal text-[#F8E8CE]/70">/ {MAX_SCORE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Server Sync Error Banner (if offline simulated) */}
        {serverSyncError && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#A92342]/80 border border-[#F2BF59] text-xs">
            <span>{serverSyncError}</span>
            <button
              type="button"
              onClick={onRetryServerSync}
              className="px-3.5 py-1.5 rounded-lg bg-[#F2BF59] text-[#172B4D] font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              تلاش مجدد ثبت در سرور
            </button>
          </div>
        )}

        {/* 3 Cumulative Reward Tiers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#F2BF59]">
              وضعیت پاداش‌های تجمیعی بازی (موجودی شانس قابل چرخش در بادصبا:{' '}
              <strong className="font-num text-white">{rewardSummary.totalSpinnableChances} شانس</strong>
              {' '}— شامل {profile.baseWheelChances} شانس پایه + {profile.bonusChancesCredited} شانس بازی)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Tier 1: 120 pts */}
            <div
              className={`p-3 rounded-xl border ${
                profile.tier1Unlocked
                  ? 'bg-[#1A355B] border-[#4ADE80]/60'
                  : 'bg-[#0F1E38]/80 border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-[#F2BF59]">سطح اول · ۱۲۰ امتیاز</span>
                <span className="text-[11px] font-bold text-[#4ADE80]">بدون نیاز به خرید</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">یک شانس رایگان گردونه</div>
              <div className="text-[11px] text-[#91C9D8]" data-testid="tier1-status">
                وضعیت: <strong className="text-[#F8E8CE]">{rewardSummary.tier1.statusLabelFa}</strong>
              </div>
            </div>

            {/* Tier 2: 180 pts (Golden Key) */}
            <div
              className={`p-3 rounded-xl border ${
                profile.tier2GoldenKeyUnlocked
                  ? 'bg-[#1A355B] border-[#F2BF59]/80'
                  : 'bg-[#0F1E38]/80 border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-[#F2BF59]">سطح دوم · ۱۸۰ امتیاز</span>
                <span className="text-[11px] font-bold text-[#F2BF59]">مشروط به خرید شارژ</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">کلید طلایی یلدا (+۱ شانس)</div>
              <div className="text-[11px] text-[#91C9D8]" data-testid="tier2-status">
                وضعیت: <strong className="text-[#F8E8CE]">{rewardSummary.tier2.statusLabelFa}</strong>
              </div>
              <div className="text-[10px] text-[#F8E8CE]/75 mt-1">
                شرط: خرید موفق شارژ با مبلغ <strong>بیشتر از ۱۰۰٬۰۰۰ تومان</strong> (یک‌بار مصرف)
              </div>
            </div>

            {/* Tier 3: 300 pts (2 Internet Bonus Chances) */}
            <div
              className={`p-3 rounded-xl border ${
                profile.tier3InternetBonusUnlocked
                  ? 'bg-[#1A355B] border-[#F2BF59]/80'
                  : 'bg-[#0F1E38]/80 border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-[#F2BF59]">سطح سوم · ۳۰۰ امتیاز</span>
                <span className="text-[11px] font-bold text-[#F2BF59]">مشروط به بسته اینترنت</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">۲ شانس اضافه بسته اینترنت</div>
              <div className="text-[11px] text-[#91C9D8]" data-testid="tier3-status">
                وضعیت: <strong className="text-[#F8E8CE]">{rewardSummary.tier3.statusLabelFa}</strong>
              </div>
              <div className="text-[10px] text-[#F8E8CE]/75 mt-1">
                شرط: خرید موفق بسته اینترنت <strong>بیشتر از ۳۰۰٬۰۰۰ تومان</strong> (یک‌بار در کمپین)
              </div>
            </div>
          </div>

          {/* Yalda Bazaar Booths: Talasee & Surmelina Discount Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Talasee Gold Booth Discount Card */}
            <div
              className={`flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border ${
                profile.talaseeDiscountClaimed
                  ? 'bg-[#2B2212] border-[#F2BF59]'
                  : 'bg-[#0F1E38]/80 border-white/10'
              }`}
              data-testid="talasee-reward-card"
            >
              <div className="space-y-0.5 text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#F2BF59]">
                    ✨ غرفه اول بازارچه: طلاسی (طلا)
                  </span>
                  <span className="text-[11px] font-bold text-[#4ADE80]">
                    {profile.talaseeDiscountClaimed ? 'دریافت‌شده' : 'قابل دریافت در بازارچه'}
                  </span>
                </div>
                <div className="text-xs text-[#F8E8CE]/90">
                  {profile.talaseeDiscountClaimed
                    ? `${TALASEE_DISCOUNT_DEFAULT.titleFa} فعال شد.`
                    : 'وارد بازارچه یلدا شو و با غرفه‌دار طلاسی صحبت کن (کلید E) تا تخفیف طلا بگیری!'}
                </div>
              </div>

              {profile.talaseeDiscountClaimed && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className="px-3 py-1 rounded-lg bg-[#0F1E38] border border-[#F2BF59]/60 font-mono text-xs font-bold text-[#F2BF59]"
                    dir="ltr"
                    data-testid="talasee-discount-code"
                  >
                    {profile.talaseeDiscountCode || TALASEE_DISCOUNT_DEFAULT.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = profile.talaseeDiscountCode || TALASEE_DISCOUNT_DEFAULT.code;
                      navigator.clipboard?.writeText(code).catch(() => {});
                      setCopiedTalasee(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#F2BF59] hover:bg-[#ffd275] text-[#172B4D] text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedTalasee ? 'کپی شد ✓' : 'کپی کد طلاسی'}
                  </button>
                </div>
              )}
            </div>

            {/* Surmelina Body Cologne Booth Discount Card */}
            <div
              className={`flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border ${
                profile.surmelinaDiscountClaimed
                  ? 'bg-[#2D162B] border-[#F472B6]'
                  : 'bg-[#0F1E38]/80 border-white/10'
              }`}
              data-testid="surmelina-reward-card"
            >
              <div className="space-y-0.5 text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#F472B6]">
                    🌸 غرفه دوم بازارچه: سورملینا (بادی‌کلن)
                  </span>
                  <span className="text-[11px] font-bold text-[#4ADE80]">
                    {profile.surmelinaDiscountClaimed ? 'دریافت‌شده' : 'قابل دریافت در بازارچه'}
                  </span>
                </div>
                <div className="text-xs text-[#F8E8CE]/90">
                  {profile.surmelinaDiscountClaimed
                    ? `${SURMELINA_DISCOUNT_DEFAULT.titleFa} فعال شد.`
                    : 'در بازارچه یلدا کنار غرفه سورملینا دکمه E را بزن تا تخفیف بادی‌کلن بگیری!'}
                </div>
              </div>

              {profile.surmelinaDiscountClaimed && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className="px-3 py-1 rounded-lg bg-[#0F1E38] border border-[#F472B6]/60 font-mono text-xs font-bold text-[#F472B6]"
                    dir="ltr"
                    data-testid="surmelina-discount-code"
                  >
                    {profile.surmelinaDiscountCode || SURMELINA_DISCOUNT_DEFAULT.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = profile.surmelinaDiscountCode || SURMELINA_DISCOUNT_DEFAULT.code;
                      navigator.clipboard?.writeText(code).catch(() => {});
                      setCopiedSurmelina(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#F472B6] hover:bg-[#f98cc3] text-[#172B4D] text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedSurmelina ? 'کپی شد ✓' : 'کپی کد سورملینا'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Badesaba Server & Purchase Verification Sandbox (Clearly labeled Mock API for QA) */}
        <div className="p-3.5 rounded-xl bg-[#0F1E38] border border-white/15 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#91C9D8]">
              پنل تست اعتبارسنجی خرید سمت سرور بادصبا (Mock API — بدون اعطای شانس جعلی پیش از خرید)
            </span>
            <button
              type="button"
              onClick={handleToggleOffline}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                offlineMode
                  ? 'bg-[#D94758] text-white'
                  : 'bg-[#172B4D] text-[#91C9D8] hover:text-white'
              }`}
            >
              {offlineMode ? 'وضعیت شبکه: قطع (Offline)' : 'وضعیت شبکه: متصل به سرور'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSimulatedPurchase('topup', 100_000, 'TOMAN')}
              className="px-2.5 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#223E6B] text-[#F8E8CE] text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              تست خرید شارژ = ۱۰۰٬۰۰۰ تومان (رد)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatedPurchase('topup', 105_000, 'TOMAN')}
              className="px-2.5 py-1.5 rounded-lg bg-[#23745A] hover:bg-[#2C8F6F] text-white text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              تست خرید شارژ ۱۰۵٬۰۰۰ تومان (قبول کلید طلایی)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatedPurchase('internet', 300_000, 'TOMAN')}
              className="px-2.5 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#223E6B] text-[#F8E8CE] text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              تست بسته اینترنت = ۳۰۰٬۰۰۰ تومان (رد)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatedPurchase('internet', 3_100_000, 'RIAL')}
              className="px-2.5 py-1.5 rounded-lg bg-[#23745A] hover:bg-[#2C8F6F] text-white text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              تست بسته اینترنت ۳٬۱۰۰٬۰۰۰ ریال / ۳۱۰هزار تومان (قبول +۲ شانس)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatedPurchase('topup', 105_000, 'TOMAN', lastTxId)}
              className="px-2.5 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#223E6B] text-[#F2BF59] text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              تست ارسال تکراری Callback (Idempotency)
            </button>
          </div>

          {purchaseFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold ${
                purchaseFeedback.ok
                  ? 'bg-[#23745A]/40 border border-[#4ADE80] text-[#F8E8CE]'
                  : 'bg-[#A92342]/40 border border-[#D94758] text-[#F8E8CE]'
              }`}
              data-testid="purchase-feedback"
            >
              {purchaseFeedback.text}
            </div>
          )}
        </div>

        {/* Wheel Handoff Preview Notice (when Primary CTA clicked) */}
        {wheelHandoffOpen && (
          <div
            className="p-4 rounded-xl bg-[#172B4D] border-2 border-[#F2BF59] space-y-2"
            data-testid="wheel-handoff-panel"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#F2BF59]">
                انتقال به گردونه شانس اصلی اپلیکیشن بادصبا (Deep Link Handoff)
              </h3>
              <button
                type="button"
                onClick={() => setWheelHandoffOpen(false)}
                className="text-xs text-[#91C9D8] hover:text-white cursor-pointer"
              >
                بستن
              </button>
            </div>
            <p className="text-xs text-[#F8E8CE]/90">
              طبق معماری کمپین، چرخش واقعی گردونه داخل مینی‌گیم بازسازی نمی‌شود و کاربر با دیپ‌لینک زیر مستقیماً به صفحه گردونه اصلی بادصبا هدایت می‌گردد:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0F1E38] px-3 py-2 rounded-lg font-mono text-xs" dir="ltr">
              <span className="text-[#F2BF59]">{BADESABA_DEEP_LINK_CONFIG.wheelDeepLink}</span>
              <span className="text-[#4ADE80]">
                Verified Spinnable Chances: {rewardSummary.totalSpinnableChances}
              </span>
            </div>
          </div>
        )}

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleWheelCtaClick}
              className="px-5 py-2.5 rounded-xl bg-[#F2BF59] hover:bg-[#f7cb70] text-[#172B4D] text-sm font-black shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              برو گردونه رو بچرخون
            </button>
            <button
              type="button"
              data-start="true"
              onClick={onPlayAgain}
              className="px-4 py-2.5 rounded-xl bg-[#A92342] hover:bg-[#D94758] text-white text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              دوباره بازی کن
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenDeliverables}
            className="px-3.5 py-2 rounded-xl bg-[#172B4D] hover:bg-[#223E6B] border border-white/15 text-[#91C9D8] hover:text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            مشاهده مستندات فنی و Sprite Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
