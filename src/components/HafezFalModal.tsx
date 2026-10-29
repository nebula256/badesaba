/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export interface HafezFortune {
  id: number;
  ghazalNumberFa: string;
  titleFa: string;
  couplets: [string, string][];
  interpretationFa: string;
  yaldaMessageFa: string;
}

export const HAFEZ_FORTUNES: HafezFortune[] = [
  {
    id: 1,
    ghazalNumberFa: 'غزل شماره ۱',
    titleFa: 'نوید گشایش و روشنایی پس از صبر',
    couplets: [
      ['یوسف گمگشته بازآید به کنعان غم مخور', 'کلبه احزان شود روزی گلستان غم مخور'],
      ['ای دل غمدیده حالت به شود دل بد مکن', 'وین سر شوریده بازآید به سامان غم مخور'],
      ['گر بهار عمر باشد باز بر تخت چمن', 'چتر گل در سر کشی ای مرغ خوشخوان غم مخور'],
      ['دور گردون گر دو روزی بر مراد ما نرفت', 'دائماً یکسان نباشد حال دوران غم مخور'],
    ],
    interpretationFa:
      'ای صاحب فال! نیتی که در دل داری با روشنایی و گشایش همراه است. دلتنگی‌ها و موانع اخیر همچون تاریکی طولانی‌ترین شب سال به پایان می‌رسد و طلوعی روشن در کار و زندگی تو آغاز خواهد شد.',
    yaldaMessageFa: 'فال شب یلدای تو مژده شادی، برکت و رسیدن خبر خوش در روزهای پیش روست.',
  },
  {
    id: 2,
    ghazalNumberFa: 'غزل شماره ۲',
    titleFa: 'برآورده شدن آرزوی دیرینه و دوستی پایدار',
    couplets: [
      ['درخت دوستی بنشان که کام دل به بار آرد', 'نهال دشمنی برکن که رنج بی‌شمار آرد'],
      ['چو مهمان خراباتی به عزت باش با رندان', 'که درد سر کشی جانا گرت مستی خمار آرد'],
      ['شب صحبت غنیمت دان که بعد از روزگار ما', 'بسی گردش کند گردون بسی لیل و نهار آرد'],
      ['عماری‌دار لیلی را که مهد ماه در حکم است', 'خدا را در دل اندازش که بر مجنون گذار آرد'],
    ],
    interpretationFa:
      'صاحب این نیت! قدر لحظات شیرین و همدلی عزیزان را بدان. مهر و محبتی که در دل کاشته‌ای به‌زودی به ثمر می‌نشیند و گره کار تو به دست دوستی دلسوز و خوش‌قدم باز می‌شود.',
    yaldaMessageFa: 'شب صحبت یلدا را غنیمت شمار؛ بخت و اقبال با نیت پاک تو یار است.',
  },
  {
    id: 3,
    ghazalNumberFa: 'غزل شماره ۳',
    titleFa: 'موفقیت بزرگ، همت بلند و کامروایی',
    couplets: [
      ['بر سر آنم که گر ز دست برآید', 'دست به کاری زنم که غصه سر آید'],
      ['خلوت دل نیست جای صحبت اضداد', 'دیو چو بیرون رود فرشته درآید'],
      ['صحبت حکام ظلمت شب یلداست', 'نور ز خورشید جوی بو که برآید'],
      ['بلبل عاشق تو عمر خواه که آخر', 'باغ شود سبز و شاخ گل به بر آید'],
    ],
    interpretationFa:
      'تردید و دودلی را از دل بیرون کن که با اراده و همت بلندت، کاری بزرگ و پرثمر به سرانجام خواهی رساند. همان‌گونه که پس از شب یلدا خورشید طلوع می‌کند، آرزوی قلبی تو نیز به بار می‌نشیند.',
    yaldaMessageFa: 'نور امید بر زندگی‌ات می‌تابد و شاخه آرزویت در بهار پیش رو گل خواهد داد.',
  },
  {
    id: 4,
    ghazalNumberFa: 'غزل شماره ۴',
    titleFa: 'نسیم بشارت، رزق حلال و دیدار یار',
    couplets: [
      ['نفس باد صبا مشک‌فشان خواهد شد', 'عالم پیر دگرباره جوان خواهد شد'],
      ['ارغوان جام عقیقی به سمن خواهد داد', 'چشم نرگس به شقایق نگران خواهد شد'],
      ['این تطاول که کشید از غم هجران بلبل', 'تا سراپرده گل نعره‌زنان خواهد شد'],
      ['ای دل ار عشرت امروز به فردا فکنی', 'مایه نقد بقا را که ضمان خواهد شد'],
    ],
    interpretationFa:
      'نسیم خوش باد صبا پیام‌آور تحولی نو و نشاط‌انگیز در زندگی توست. فرصتی طلایی پیش روی تو قرار می‌گیرد؛ امروز را دریاب و با توکل و شادمانی گام در مسیر جدید بگذار.',
    yaldaMessageFa: 'روزگارت نو و پرطراوت می‌شود و شیرینی این شب چله در تمام سالت ماندگار خواهد بود.',
  },
  {
    id: 5,
    ghazalNumberFa: 'غزل شماره ۵',
    titleFa: 'گنج مقصود، سعادت و آرامش خاطر',
    couplets: [
      ['رواق منظر چشم من آشیانه توست', 'کرم نما و فرود آ که خانه خانه توست'],
      ['به لطف خال و خط از عارفان ربودی دل', 'لطیفه‌های عجب زیر دام و دانه توست'],
      ['دلت به وصل گل ای بلبل صبا خوش باد', 'که در چمن همه گلبانگ عاشقانه توست'],
      ['علاج ضعف دل ما به لب حوالت کن', 'که این مفرح یاقوت در خزانه توست'],
    ],
    interpretationFa:
      'دل روشن و نیت خیرخواهانه تو سرچشمه برکت است. آنچه به دنبالش هستی دور از دسترس نیست؛ با آرامش و مهربانی پیش برو که به وصال مقصود و گشایش مالی و معنوی خواهی رسید.',
    yaldaMessageFa: 'یاقوت سرخ شب یلدا کام دلت را شیرین و خانه‌ات را پر از مهر و روشنایی می‌سازد.',
  },
];

interface HafezFalModalProps {
  alreadyClaimed: boolean;
  pointsReward: number;
  onTakeFortune: (fortune: HafezFortune) => { awarded: number; newScore: number; newlyClaimed: boolean };
  onClose: () => void;
}

const TOTAL_BOOK_PAGES = 36;

export const HafezFalModal: React.FC<HafezFalModalProps> = ({
  alreadyClaimed,
  pointsReward,
  onTakeFortune,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'book_edge' | 'opening' | 'fortune_result'>('book_edge');
  const [hoveredPage, setHoveredPage] = useState<number>(17);
  const [selectedPage, setSelectedPage] = useState<number>(17);
  const [activeFortune, setActiveFortune] = useState<HafezFortune>(HAFEZ_FORTUNES[0]);
  const [awardedPointsThisOpen, setAwardedPointsThisOpen] = useState<number>(0);

  const handleSelectPage = (pageIdx: number) => {
    if (viewMode !== 'book_edge') return;
    const clampedPage = Math.max(0, Math.min(TOTAL_BOOK_PAGES - 1, pageIdx));
    setSelectedPage(clampedPage);
    setHoveredPage(clampedPage);

    // Deterministically pick a rich Hafez Ghazal based on the chosen page strip
    const fortune = HAFEZ_FORTUNES[clampedPage % HAFEZ_FORTUNES.length];
    setActiveFortune(fortune);
    setViewMode('opening');

    const res = onTakeFortune(fortune);
    if (res.awarded > 0) {
      setAwardedPointsThisOpen(res.awarded);
    }

    window.setTimeout(() => {
      setViewMode('fortune_result');
    }, 280);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (viewMode === 'book_edge') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.key === 'ArrowLeft') {
          e.preventDefault();
          e.stopPropagation();
          setHoveredPage((prev) => (prev > 0 ? prev - 1 : TOTAL_BOOK_PAGES - 1));
          return;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          setHoveredPage((prev) => (prev < TOTAL_BOOK_PAGES - 1 ? prev + 1 : 0));
          return;
        }
        if (
          e.code === 'KeyE' ||
          e.code === 'Enter' ||
          e.code === 'NumpadEnter' ||
          e.code === 'Space' ||
          e.key === 'e' ||
          e.key === 'E' ||
          e.key === 'ث' ||
          e.key === 'Enter' ||
          e.key === ' '
        ) {
          e.preventDefault();
          e.stopPropagation();
          handleSelectPage(hoveredPage);
          return;
        }
      } else if (viewMode === 'fortune_result') {
        if (
          e.code === 'KeyE' ||
          e.code === 'Enter' ||
          e.code === 'NumpadEnter' ||
          e.code === 'Space' ||
          e.key === 'e' ||
          e.key === 'E' ||
          e.key === 'ث' ||
          e.key === 'Enter' ||
          e.key === ' '
        ) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  });

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[#161616] text-white select-none pointer-events-auto overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="غرفه فال حافظ بادصبا"
      data-testid="hafez-fal-modal"
      dir="rtl"
    >
      {/* =====================================================================
          TOP CRIMSON APP BAR (Matches BadeSaba Hafez Fal Reference)
          ===================================================================== */}
      <header className="relative z-20 h-14 sm:h-16 bg-[#801313] border-b border-[#5A0B0D] px-4 sm:px-6 flex items-center justify-between shadow-xl shrink-0">
        {/* Right Action in RTL: Back Arrow Button (→) matching the screenshot */}
        <button
          type="button"
          onClick={onClose}
          data-testid="hafez-back-btn"
          aria-label="بازگشت به مسیر بازی"
          className="w-10 h-10 rounded-full hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
          </svg>
        </button>

        {/* Center Title: فال حافظ */}
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
          فال حافظ
        </h2>

        {/* Left Status Indicator: Points Reward */}
        <div
          className="text-xs sm:text-sm font-bold text-[#F2BF59] font-num"
          data-testid="hafez-reward-status"
        >
          {alreadyClaimed || awardedPointsThisOpen > 0
            ? `✓ +${pointsReward} امتیاز ثبت شد`
            : `پاداش تفأل: +${pointsReward} امتیاز`}
        </div>
      </header>

      {/* =====================================================================
          DARK CALLIGRAPHIC TEXTURED BACKGROUND + MAIN INTERACTIVE AREA
          ===================================================================== */}
      <div className="relative flex-1 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto">
        {/* Diagonal Monochrome Nastaliq Calligraphy & Scanline Texture Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
          <svg
            viewBox="0 0 800 800"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            <defs>
              <pattern
                id="scanlines"
                width="8"
                height="4"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.18" />
              </pattern>
            </defs>
            {/* Sweeping diagonal calligraphic ribbons inspired by traditional Nastaliq background */}
            <g transform="rotate(-24 400 400)" fill="none" stroke="#9CA3AF" strokeLinecap="round">
              <path d="M-200 120 Q 250 40 950 160" strokeWidth="44" strokeOpacity="0.45" />
              <path d="M-200 230 Q 300 130 950 250" strokeWidth="28" strokeOpacity="0.35" />
              <path d="M-200 350 Q 280 260 950 380" strokeWidth="54" strokeOpacity="0.5" />
              <path d="M-200 490 Q 320 390 950 510" strokeWidth="36" strokeOpacity="0.4" />
              <path d="M-200 620 Q 260 520 950 650" strokeWidth="48" strokeOpacity="0.45" />
              <path d="M-200 750 Q 310 660 950 780" strokeWidth="30" strokeOpacity="0.35" />
            </g>
            {/* Large decorative calligraphic poetry strokes */}
            <g
              transform="rotate(-18 400 400)"
              fill="#D1D5DB"
              opacity="0.32"
              fontFamily="Vazirmatn, serif"
              fontWeight="900"
              fontSize="110"
            >
              <text x="-40" y="220">شبی خوش است بدین قصه‌اش دراز کنید</text>
              <text x="-80" y="440">ز کوی یار می‌آید نسیم باد نوروزی</text>
              <text x="-20" y="660">درخت دوستی بنشان که کام دل به بار آرد</text>
            </g>
            <rect width="800" height="800" fill="url(#scanlines)" />
          </svg>
        </div>

        {/* ===================================================================
            VIEW 1: CLOSED VERTICAL BOOK FORE-EDGE (تفأل از بین برگه‌های کتاب)
            =================================================================== */}
        {(viewMode === 'book_edge' || viewMode === 'opening') && (
          <div className="relative z-10 flex flex-col items-center justify-between w-full max-w-lg my-auto space-y-3 sm:space-y-4">
            {/* Instruction Prompt */}
            <div className="text-center space-y-1 bg-black/65 border border-white/15 rounded-xl px-4 py-2.5 backdrop-blur-xs">
              <p className="text-xs sm:text-sm font-extrabold text-[#F8E8CE]">
                نیت کنید و یکی از برگه‌های دیوان حافظ را لمس کنید تا فالتان باز شود
              </p>
              <p className="text-[11px] text-[#F2BF59]">
                برگه انتخابی فعلی: صفحه <span className="font-num font-black">{hoveredPage + 1}</span> از{' '}
                <span className="font-num">{TOTAL_BOOK_PAGES}</span> · (می‌توانید روی برگه‌ها کلیک کنید یا کلید E / Enter را بزنید)
              </p>
            </div>

            {/* THE VERTICAL BOOK FORE-EDGE (Exact match to reference image_93e79474.png) */}
            <div
              className={`relative w-[220px] sm:w-[256px] h-[350px] sm:h-[430px] rounded-[7px] p-[11px] sm:p-[13px] transition-transform duration-300 shadow-[0_24px_60px_rgba(0,0,0,0.9)] ${
                viewMode === 'opening' ? 'scale-105 brightness-110' : 'scale-100'
              }`}
              style={{
                background:
                  'linear-gradient(90deg, #54090B 0%, #861417 12%, #7A1113 88%, #4D080A 100%)',
                boxShadow:
                  '0 22px 55px rgba(0,0,0,0.92), inset 0 0 8px rgba(0,0,0,0.65)',
              }}
              data-testid="hafez-book-edge"
            >
              {/* Inner dark binding groove holding the vertical white paper pages */}
              <div
                className="w-full h-full bg-[#121212] flex flex-row items-stretch justify-between px-[2px] py-[1px] gap-[1.5px] overflow-hidden"
                dir="ltr"
              >
                {Array.from({ length: TOTAL_BOOK_PAGES }).map((_, idx) => {
                  const isHovered = hoveredPage === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`hafez-page-${idx}`}
                      aria-label={`انتخاب برگه شماره ${idx + 1} دیوان حافظ`}
                      onMouseEnter={() => setHoveredPage(idx)}
                      onFocus={() => setHoveredPage(idx)}
                      onClick={() => handleSelectPage(idx)}
                      className={`h-full flex-1 transition-all duration-100 cursor-pointer border-0 p-0 focus:outline-none ${
                        isHovered
                          ? 'bg-[#F2BF59] shadow-[0_0_10px_#F2BF59] scale-y-[0.985]'
                          : 'bg-[#FBFBFB] hover:bg-[#F2BF59]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom Quick Action Button for Keyboard / Touch Convenience */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                data-testid="hafez-open-selected-page-btn"
                onClick={() => handleSelectPage(hoveredPage)}
                className="px-6 py-2.5 rounded-xl bg-[#801313] hover:bg-[#9B181B] border-2 border-[#F2BF59] text-[#F8E8CE] font-black text-xs sm:text-sm shadow-lg cursor-pointer transition-all active:translate-y-0.5"
              >
                نیت کردم · گشودن برگه {hoveredPage + 1} و مشاهده فال (+{pointsReward} امتیاز) 📖
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: OPENED DIVAN-E HAFEZ FORTUNE PAGE & SCORE REWARD
            =================================================================== */}
        {viewMode === 'fortune_result' && (
          <div
            className="relative z-10 w-full max-w-xl my-auto bg-[#FCF5E5] text-[#172B4D] border-4 border-[#801313] rounded-2xl p-5 sm:p-6 shadow-[0_24px_65px_rgba(0,0,0,0.9)] space-y-4"
            data-testid="hafez-fortune-card"
          >
            {/* Top Header of the Opened Book Page */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#801313]/25">
              <div>
                <div className="text-xs font-extrabold text-[#801313]">
                  دیوان لسان‌الغیب حضرت حافظ شیرازی · برگه {selectedPage + 1}
                </div>
                <h3
                  className="text-base sm:text-lg font-black text-[#172B4D] mt-0.5"
                  data-testid="hafez-fortune-title"
                >
                  {activeFortune.ghazalNumberFa} — {activeFortune.titleFa}
                </h3>
              </div>

              <div
                className="text-xs sm:text-sm font-black text-[#23745A] font-num"
                data-testid="hafez-points-earned-badge"
              >
                ✓ +{pointsReward} امتیاز تفأل یلدایی ثبت شد
              </div>
            </div>

            {/* Poetic Couplets (ابیات غزل حافظ) */}
            <div className="bg-[#FFFDF9] border border-[#D4A359]/60 rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-inner">
              {activeFortune.couplets.map(([hemistich1, hemistich2], idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-4 text-center text-xs sm:text-sm font-bold text-[#172B4D] py-1 border-b last:border-b-0 border-[#D4A359]/20"
                >
                  <span>{hemistich1}</span>
                  <span className="text-[#801313] sm:text-[#172B4D]">{hemistich2}</span>
                </div>
              ))}
            </div>

            {/* Fortune Interpretation (تفسیر و شاهد فال شب یلدا) */}
            <div className="bg-[#801313]/8 border border-[#801313]/30 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs font-black text-[#801313]">
                تفسیر فال شب یلدای شما:
              </div>
              <p
                className="text-xs sm:text-[13px] leading-relaxed text-[#172B4D] font-medium"
                data-testid="hafez-fortune-interpretation"
              >
                {activeFortune.interpretationFa}
              </p>
              <p className="text-xs font-extrabold text-[#23745A] pt-1">
                ✨ {activeFortune.yaldaMessageFa}
              </p>
            </div>

            {/* Action Buttons: Continue Game or Take Another Fortune */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                data-testid="hafez-claim-continue-btn"
                onClick={onClose}
                className="flex-1 min-w-[180px] py-3 px-5 rounded-xl bg-[#801313] hover:bg-[#9B181B] text-[#F8E8CE] border-2 border-[#F2BF59] font-black text-xs sm:text-sm shadow-lg cursor-pointer transition-all"
              >
                ثبت امتیاز و ادامه بازی (کلید E / Enter) 🏃
              </button>

              <button
                type="button"
                data-testid="hafez-retake-btn"
                onClick={() => setViewMode('book_edge')}
                className="py-3 px-4 rounded-xl bg-[#172B4D] hover:bg-[#223E6B] text-[#F8E8CE] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                تفأل دوباره به کتاب 📖
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
