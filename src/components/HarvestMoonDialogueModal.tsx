/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export type BoothDialogueType = 'talasee' | 'surmelina';

interface DialogueStep {
  speaker: 'nari' | 'talasee_merchant' | 'surmelina_merchant';
  speakerNameFa: string;
  speakerRoleFa: string;
  textFa: string;
  choices?: string[];
  isRewardStep?: boolean;
  rewardCode?: string;
  rewardTitleFa?: string;
  rewardBadgeFa?: string;
}

const DIALOGUE_SCRIPTS: Record<BoothDialogueType, DialogueStep[]> = {
  talasee: [
    {
      speaker: 'nari',
      speakerNameFa: 'ناری',
      speakerRoleFa: 'مسافر شب یلدا',
      textFa:
        '«سلام عمو طلایی! شب یلداتون مبارک! راستش من طلا می‌خوام؛ روی میزتون چقدر شمش و سکه‌های طلا برق می‌زنه! چطور می‌تونم برای شب یلدا طلا بگیرم؟»',
    },
    {
      speaker: 'talasee_merchant',
      speakerNameFa: 'حاج طلایی',
      speakerRoleFa: 'غرفه‌دار طلاسی • بازارچه یلدا',
      textFa:
        '«به به! سلام ناری جان، خوش اومدی به غرفه طلاسی! توی طلاسی با هر مبلغی می‌تونی آنلاین طلای آب‌شده بخری و پس‌انداز کنی. برای امشب کدوم رو می‌خوای؟»',
      choices: [
        '✨ سلام، من طلای آب‌شده با هدیه ویژه شب یلدا می‌خوام!',
        '🪙 می‌خوام پس‌انداز طلایی شب یلدام رو از طلاسی شروع کنم!',
      ],
    },
    {
      speaker: 'talasee_merchant',
      speakerNameFa: 'حاج طلایی',
      speakerRoleFa: 'غرفه‌دار طلاسی • بازارچه یلدا',
      textFa:
        '«ایول به انتخابت! این هم کد تخفیف ویژه یلدایی طلاسی مخصوص تو که توی کیف جوایزت ثبت شد. راستی حتماً به غرفه کناری (سورملینا) هم سر بزن!»',
      isRewardStep: true,
      rewardCode: 'TALASEE-YALDA50',
      rewardTitleFa: '۵۰٬۰۰۰ تومان هدیه خرید طلای آب‌شده در طلاسی',
      rewardBadgeFa: 'هدیه غرفه اول • طلاسی',
    },
  ],
  surmelina: [
    {
      speaker: 'nari',
      speakerNameFa: 'ناری',
      speakerRoleFa: 'مسافر شب یلدا',
      textFa:
        '«سلام! چه بوی فوق‌العاده‌ای توی غرفه‌تون پیچیده! من برای جشن امشب یلدا یه بادی‌کلن خوشبو و موندگار می‌خوام؛ چی برام دارین؟»',
    },
    {
      speaker: 'surmelina_merchant',
      speakerNameFa: 'پریسا',
      speakerRoleFa: 'مشاور عطر و زیبایی • غرفه سورملینا',
      textFa:
        '«سلام ناری عزیز! به غرفه سورملینا خوش اومدی 🌸 بادی‌کلن‌های سورملینا با رایحه‌های دلنشین و ماندگاری بالا، بهترین انتخاب برای شب یلدا هستن. چه رایحه‌ای می‌خوای؟»',
      choices: [
        '🌺 بادی‌کلن رایحه انار یاقوتی و شکوفه برفی می‌خوام!',
        '✨ بادی‌کلن گرم وانیل، یاس و چوب صندل می‌خوام!',
      ],
    },
    {
      speaker: 'surmelina_merchant',
      speakerNameFa: 'پریسا',
      speakerRoleFa: 'مشاور عطر و زیبایی • غرفه سورملینا',
      textFa:
        '«سلیقه‌ت بی‌نظیره! این بادی‌کلن خوشبو به همراه کد تخفیف ویژه سورملینا تقدیم به تو! حالا می‌تونی از دروازه سمت راست بازارچه خارج بشی و ادامه مسیر بازی رو بری.»',
      isRewardStep: true,
      rewardCode: 'SURMELINA-YALDA40',
      rewardTitleFa: '۴۰٪ تخفیف ویژه خرید بادی‌کلن و محصولات سورملینا',
      rewardBadgeFa: 'هدیه غرفه دوم • سورملینا',
    },
  ],
};

interface HarvestMoonDialogueModalProps {
  boothType: BoothDialogueType;
  onCompleteClaim: (boothType: BoothDialogueType) => void;
  onClose: () => void;
}

export const HarvestMoonDialogueModal: React.FC<HarvestMoonDialogueModalProps> = ({
  boothType,
  onCompleteClaim,
  onClose,
}) => {
  const steps = DIALOGUE_SCRIPTS[boothType];
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(0);
  const [chosenText, setChosenText] = useState<string | null>(null);

  const currentStep = steps[stepIndex];

  const handleAdvance = (choiceIdx?: number) => {
    if (currentStep.choices && currentStep.choices.length > 0) {
      const idx = choiceIdx !== undefined ? choiceIdx : selectedChoice;
      setChosenText(currentStep.choices[idx]);
    }

    if (stepIndex < steps.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      // When reaching the final reward step, immediately trigger the claim so it's saved even if closed
      if (steps[nextIndex].isRewardStep) {
        onCompleteClaim(boothType);
      }
    } else {
      onCompleteClaim(boothType);
      onClose();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (currentStep.choices && currentStep.choices.length > 0) {
        if (
          e.code === 'ArrowUp' ||
          e.code === 'KeyW' ||
          e.key === 'ArrowUp' ||
          e.key === '1' ||
          e.key === '۱'
        ) {
          e.preventDefault();
          e.stopPropagation();
          setSelectedChoice(0);
          return;
        }
        if (
          e.code === 'ArrowDown' ||
          e.code === 'KeyS' ||
          e.key === 'ArrowDown' ||
          e.key === '2' ||
          e.key === '۲'
        ) {
          e.preventDefault();
          e.stopPropagation();
          setSelectedChoice(1);
          return;
        }
      }

      if (
        e.code === 'KeyE' ||
        e.code === 'KeyF' ||
        e.code === 'Space' ||
        e.code === 'Enter' ||
        e.code === 'NumpadEnter' ||
        e.key === 'e' ||
        e.key === 'E' ||
        e.key === 'ث' ||
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  });

  return (
    <div
      dir="rtl"
      data-testid={`harvest-dialogue-${boothType}`}
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-5 flex justify-center items-end bg-gradient-to-t from-[#081226]/90 via-[#081226]/40 to-transparent pointer-events-auto"
    >
      {/* Harvest Moon Classic RPG Wood & Gold Framed Dialogue Box */}
      <div className="w-full max-w-3xl rounded-2xl bg-[#1A2D4D] border-4 border-[#F2BF59] shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-4 sm:p-5 relative overflow-hidden">
        {/* Inner decorative Harvest Moon corner trim */}
        <div className="absolute inset-1.5 rounded-xl border border-[#F2BF59]/30 pointer-events-none" />

        {/* Top Header Bar: Conversation Progress & Close */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#F2BF59] text-[#172B4D] text-xs font-black">
              {boothType === 'talasee' ? 'غرفه اول: طلاسی (طلا)' : 'غرفه دوم: سورملینا (بادی‌کلن)'}
            </span>
            <span className="text-xs text-[#F8E8CE]/75 font-bold">
              گفت‌وگوی بازارچه یلدا ({stepIndex + 1} از {steps.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#F8E8CE]/70 hover:text-[#F8E8CE] px-2 py-1 rounded border border-[#F8E8CE]/20 cursor-pointer"
          >
            بستن (Esc)
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 relative z-10">
          {/* Expressive Character Portrait Box (Harvest Moon style) */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-gradient-to-b from-[#2A477A] via-[#1B3159] to-[#0E1A33] border-2 border-[#F2BF59] flex flex-col items-center justify-center relative shadow-[inset_0_2px_12px_rgba(255,209,102,0.25)] overflow-hidden">
            {currentStep.speaker === 'nari' && (
              <svg viewBox="0 0 100 100" className="w-24 h-24">
                <defs>
                  <radialGradient id="nariGlow" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#FFD166" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#13223D" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="nariHat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5C77" />
                    <stop offset="55%" stopColor="#C81D3E" />
                    <stop offset="100%" stopColor="#7A0E24" />
                  </linearGradient>
                  <linearGradient id="nariCoat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34A87E" />
                    <stop offset="100%" stopColor="#124837" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" fill="url(#nariGlow)" />
                {/* Dark Braided Hair Back */}
                <path d="M24 50 Q20 72 28 86 L72 86 Q80 72 76 50 Z" fill="#231429" />
                {/* Emerald Winter Coat & Gold Termeh Trim */}
                <path d="M26 75 Q50 84 74 75 L82 98 L18 98 Z" fill="url(#nariCoat)" stroke="#172B4D" strokeWidth="2.5" />
                <rect x="46" y="77" width="8" height="21" fill="#F2BF59" opacity="0.85" />
                {/* Warm Face */}
                <circle cx="50" cy="55" r="23" fill="#FFE5CD" stroke="#172B4D" strokeWidth="2.8" />
                {/* Ruby Pomegranate Dome Hat */}
                <path d="M24 47 Q50 15 76 47 Z" fill="url(#nariHat)" stroke="#172B4D" strokeWidth="2.8" />
                <ellipse cx="42" cy="33" rx="10" ry="4" transform="rotate(-18 42 33)" fill="#FFF" opacity="0.28" />
                {/* Jeweled Pomegranate Crown */}
                <path d="M41 24 L45 14 L50 21 L55 14 L59 24 Z" fill="#FFD166" stroke="#172B4D" strokeWidth="2" />
                <circle cx="50" cy="21" r="2" fill="#E63956" />
                {/* Fluffy Wool Brim */}
                <rect x="21" y="42" width="58" height="8.5" rx="4.2" fill="#FFF8EB" stroke="#172B4D" strokeWidth="2.4" />
                {/* Expressive Eyes with Dual Catchlights */}
                <ellipse cx="41" cy="55" rx="3.4" ry="3.8" fill="#172B4D" />
                <ellipse cx="59" cy="55" rx="3.4" ry="3.8" fill="#172B4D" />
                <circle cx="42" cy="53.8" r="1.3" fill="#FFF" />
                <circle cx="60" cy="53.8" r="1.3" fill="#FFF" />
                {/* Rosy Winter Cheeks & Happy Smile */}
                <ellipse cx="34" cy="61" rx="4.5" ry="2.8" fill="#E63956" opacity="0.45" />
                <ellipse cx="66" cy="61" rx="4.5" ry="2.8" fill="#E63956" opacity="0.45" />
                <path d="M44 63 Q50 69 56 63" fill="none" stroke="#8C1D35" strokeWidth="2.6" strokeLinecap="round" />
                {/* Crimson Silk Scarf */}
                <rect x="33" y="73" width="34" height="9" rx="4.5" fill="#D92B4B" stroke="#172B4D" strokeWidth="2.3" />
                <path d="M35 77.5 L65 77.5" stroke="#FFD166" strokeWidth="1.2" strokeDasharray="3 2" />
              </svg>
            )}

            {currentStep.speaker === 'talasee_merchant' && (
              <svg viewBox="0 0 100 100" className="w-24 h-24">
                <defs>
                  <radialGradient id="goldGlow" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#FFE885" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#13223D" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="bullionGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFF7C2" />
                    <stop offset="50%" stopColor="#FFD166" />
                    <stop offset="100%" stopColor="#C88A14" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" fill="url(#goldGlow)" />
                {/* Crimson & Gold Brocade Merchant Robe */}
                <path d="M22 75 L78 75 L84 98 L16 98 Z" fill="#9E1B34" stroke="#172B4D" strokeWidth="2.6" />
                <path d="M36 75 L50 95 L64 75" fill="none" stroke="#FFD166" strokeWidth="2.5" />
                {/* Warm Face */}
                <circle cx="50" cy="54" r="22.5" fill="#FFE2C6" stroke="#172B4D" strokeWidth="2.8" />
                {/* Traditional Emerald & Gold Termeh Cap */}
                <path d="M26 44 Q50 17 74 44 Z" fill="#1F7A58" stroke="#172B4D" strokeWidth="2.8" />
                <rect x="25" y="39.5" width="50" height="7.5" rx="3.5" fill="url(#bullionGrad)" stroke="#172B4D" strokeWidth="2.2" />
                <circle cx="50" cy="31" r="3.5" fill="#FFD166" stroke="#172B4D" strokeWidth="1.5" />
                {/* Friendly Eyes, Eyebrows & Master Goldsmith Mustache */}
                <path d="M36 47 Q41 44 46 47" fill="none" stroke="#4A2C18" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M54 47 Q59 44 64 47" fill="none" stroke="#4A2C18" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="41" cy="52" r="3" fill="#172B4D" />
                <circle cx="59" cy="52" r="3" fill="#172B4D" />
                <circle cx="42" cy="51" r="1" fill="#FFF" />
                <circle cx="60" cy="51" r="1" fill="#FFF" />
                <path d="M35 61 Q50 55 65 61 Q57 66 50 62.5 Q43 66 35 61 Z" fill="#4A2C18" />
                {/* Shiny 24K Gold Bullion Bar in Hand */}
                <rect x="34" y="79" width="32" height="13" rx="3.5" fill="url(#bullionGrad)" stroke="#172B4D" strokeWidth="2.2" />
                <text x="50" y="88" textAnchor="middle" fontSize="7" fontWeight="900" fill="#7A4F08">999.9</text>
              </svg>
            )}

            {currentStep.speaker === 'surmelina_merchant' && (
              <svg viewBox="0 0 100 100" className="w-24 h-24">
                <defs>
                  <radialGradient id="roseGlow" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#F472B6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#13223D" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="shawlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C83E7B" />
                    <stop offset="100%" stopColor="#6D1842" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" fill="url(#roseGlow)" />
                {/* Flowing Silk Shawl */}
                <path d="M20 50 Q50 14 80 50 L84 96 L16 96 Z" fill="url(#shawlGrad)" stroke="#172B4D" strokeWidth="2.6" />
                {/* Face */}
                <circle cx="50" cy="54" r="21.5" fill="#FFE7D3" stroke="#172B4D" strokeWidth="2.6" />
                {/* Dark Wavy Hair & Golden Tiara Trim */}
                <path d="M29 48 Q40 34 50 42 Q60 34 71 48" fill="none" stroke="#2D152B" strokeWidth="5" strokeLinecap="round" />
                <path d="M28 42 Q50 26 72 42" fill="none" stroke="#FFD166" strokeWidth="3" />
                <circle cx="50" cy="34" r="3" fill="#FF85B3" stroke="#FFD166" strokeWidth="1.5" />
                {/* Sparkling Eyes & Warm Smile */}
                <ellipse cx="41" cy="53" rx="3.2" ry="3.5" fill="#172B4D" />
                <ellipse cx="59" cy="53" rx="3.2" ry="3.5" fill="#172B4D" />
                <circle cx="42" cy="51.8" r="1.2" fill="#FFF" />
                <circle cx="60" cy="51.8" r="1.2" fill="#FFF" />
                <ellipse cx="34" cy="59" rx="4" ry="2.5" fill="#F472B6" opacity="0.55" />
                <ellipse cx="66" cy="59" rx="4" ry="2.5" fill="#F472B6" opacity="0.55" />
                <path d="M44 62 Q50 67.5 56 62" fill="none" stroke="#A92342" strokeWidth="2.5" strokeLinecap="round" />
                {/* Luxury Faceted Crystal Cologne Bottle with Atomizer */}
                <rect x="40" y="76" width="20" height="17" rx="4.5" fill="#FF75B5" stroke="#FFD166" strokeWidth="2.2" />
                <rect x="44" y="79" width="5" height="11" rx="2" fill="#FFF" opacity="0.45" />
                <rect x="46" y="70.5" width="8" height="5.5" rx="1.5" fill="#FFD166" stroke="#172B4D" strokeWidth="1.5" />
                <circle cx="57" cy="73" r="2.2" fill="#FFD166" />
              </svg>
            )}
          </div>

          {/* Dialogue Content Column */}
          <div className="flex-1 flex flex-col justify-between text-right">
            <div>
              {/* Speaker Name Tag */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base sm:text-lg font-black text-[#F2BF59]">
                  {currentStep.speakerNameFa}
                </span>
                <span className="text-xs text-[#91C9D8] font-semibold">
                  ({currentStep.speakerRoleFa})
                </span>
              </div>

              {/* Echo user's chosen request if on step 2 */}
              {chosenText && currentStep.isRewardStep && (
                <div className="mb-2 px-3 py-1 rounded-lg bg-[#0F1E38]/70 border border-[#F2BF59]/30 text-xs text-[#F2BF59]">
                  انتخاب ناری: {chosenText}
                </div>
              )}

              {/* Main Dialogue Text */}
              <p
                data-testid="dialogue-text"
                className="text-sm sm:text-base text-[#F8E8CE] font-bold leading-relaxed"
              >
                {currentStep.textFa}
              </p>
            </div>

            {/* Interactive Choices (Step 1) */}
            {currentStep.choices && currentStep.choices.length > 0 && (
              <div className="mt-3 space-y-2">
                {currentStep.choices.map((choice, idx) => {
                  const active = selectedChoice === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`dialogue-choice-${idx}`}
                      onMouseEnter={() => setSelectedChoice(idx)}
                      onClick={() => handleAdvance(idx)}
                      className={`w-full text-right px-3.5 py-2 rounded-xl border-2 text-xs sm:text-sm font-extrabold transition flex items-center justify-between cursor-pointer ${
                        active
                          ? 'bg-[#F2BF59] text-[#172B4D] border-[#FFF3D1] shadow-md'
                          : 'bg-[#11223E] text-[#F8E8CE] border-[#F2BF59]/40 hover:border-[#F2BF59]'
                      }`}
                    >
                      <span>
                        {active ? '◀ ' : ''}
                        {choice}
                      </span>
                      <span className="text-[11px] opacity-80 font-black">
                        {active ? 'فشردن E یا کلیک' : `گزینه ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reward Grant Card (Step 2) */}
            {currentStep.isRewardStep && currentStep.rewardCode && (
              <div
                data-testid={`dialogue-reward-${boothType}`}
                className="mt-3 p-3 rounded-xl bg-gradient-to-l from-[#23745A]/45 to-[#11223E] border-2 border-[#F2BF59] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-extrabold text-[#F2BF59]">
                    🎁 {currentStep.rewardBadgeFa}
                  </div>
                  <div className="text-xs text-[#F8E8CE]/90 mt-0.5">
                    {currentStep.rewardTitleFa}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#0F1E38] border border-[#F2BF59] text-[#F2BF59] font-mono font-black text-sm tracking-wider text-center">
                  {currentStep.rewardCode}
                </div>
              </div>
            )}

            {/* Bottom Action Button when not showing choice buttons */}
            {(!currentStep.choices || currentStep.choices.length === 0) && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  data-testid="dialogue-next-btn"
                  onClick={() => handleAdvance()}
                  className="px-5 py-2 rounded-xl bg-[#F2BF59] hover:bg-[#f7cb70] text-[#172B4D] font-black text-xs sm:text-sm border-2 border-[#172B4D] shadow-md cursor-pointer transition active:scale-95"
                >
                  {stepIndex < steps.length - 1
                    ? 'ادامه گفت‌وگو ◀ (کلید E یا Enter)'
                    : 'دریافت کد تخفیف و بازگشت به بازارچه 🎁 (کلید E)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
