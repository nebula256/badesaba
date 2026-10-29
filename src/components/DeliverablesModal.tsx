/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  NARI_ANIM_SPECS,
  NariAnimState,
  drawNariCharacter,
  renderNariSpriteSheetToCanvas,
} from '../entities/nariRenderer';
import {
  BADESABA_DEEP_LINK_CONFIG,
  GA4EventRecord,
  badesabaApi,
} from '../integrations/badesabaApi';

interface DeliverablesModalProps {
  open: boolean;
  onClose: () => void;
}

type TabKey = 'gdd' | 'visual' | 'manifest' | 'integration' | 'qa';

export const ASSET_MANIFEST_ITEMS = [
  { name: 'nari_spritesheet_all.png', category: 'Character', size: '768×768 (8×8 frames @ 96×96)', format: 'PNG / Canvas Atlas', usage: 'اسپرایت‌شیت کامل ۸ حالت انیمیشن شخصیت ناری' },
  { name: 'nari_idle_6f.png', category: 'Character', size: '576×96 (6 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن ایستادن و نفس‌کشیدن (۶ فریم)' },
  { name: 'nari_run_8f.png', category: 'Character', size: '768×96 (8 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن دویدن با حرکت شال‌گردن اناری (۸ فریم)' },
  { name: 'nari_jump_4f.png', category: 'Character', size: '384×96 (4 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن پرش با Squash & Stretch (۴ فریم)' },
  { name: 'nari_fall_4f.png', category: 'Character', size: '384×96 (4 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن سقوط و فرود نرم (۴ فریم)' },
  { name: 'nari_collect_4f.png', category: 'Character', size: '384×96 (4 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن دریافت انار و هندوانه (۴ فریم)' },
  { name: 'nari_interact_6f.png', category: 'Character', size: '576×96 (6 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن روشن‌کردن فانوس و کشیدن اهرم (۶ فریم)' },
  { name: 'nari_hit_4f.png', category: 'Character', size: '384×96 (4 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن برخورد ملایم با مانع بدون حذف امتیاز (۴ فریم)' },
  { name: 'nari_celebrate_8f.png', category: 'Character', size: '768×96 (8 frames)', format: 'PNG Sprite Strip', usage: 'انیمیشن جشن پیروزی در دروازه گردونه (۸ فریم)' },
  { name: 'env_zone1_snowy_alley.svg', category: 'Environment', size: '1100×500', format: 'Vector / Canvas Layer', usage: 'محیط اول: کوچه برفی ایرانی (۰ تا ۲۰ ثانیه)' },
  { name: 'env_zone2_yalda_bazaar.svg', category: 'Environment', size: '1200×500', format: 'Vector / Canvas Layer', usage: 'محیط دوم: بازار سنتی یلدا و غرفه‌ها (۲۰ تا ۴۰ ثانیه)' },
  { name: 'env_zone3_festival_gate.svg', category: 'Environment', size: '900×500', format: 'Vector / Canvas Layer', usage: 'محیط سوم: مسیر جشن و دروازه گردونه طلایی (۴۰ تا ۶۰ ثانیه)' },
  { name: 'item_pomegranate_64.svg', category: 'Collectible', size: '64×64', format: 'SVG / Canvas', usage: 'انار یاقوتی یلدا (۸ عدد × ۱۰ امتیاز = ۸۰ امتیاز)' },
  { name: 'item_watermelon_64.svg', category: 'Collectible', size: '64×64', format: 'SVG / Canvas', usage: 'قاچ هندوانه یلدا (۶ عدد × ۱۵ امتیاز = ۹۰ امتیاز)' },
  { name: 'prop_lantern_interactive.svg', category: 'Interactive', size: '64×128', format: 'SVG / Canvas', usage: 'فانوس سنتی خاموش/روشن (۳ عدد × ۳۰ امتیاز = ۹۰ امتیاز)' },
  { name: 'audio_yalda_chaharmezrab_loop.wav', category: 'Audio', size: 'Procedural Synth Loop', format: 'Web Audio API', usage: 'موسیقی محیطی شاد ایرانی به همراه ۸ افکت صوتی تعاملی' },
];

export const QA_ACCEPTANCE_SCENARIOS = [
  { id: 1, title: 'کسب ۱۱۹ امتیاز', expected: 'هیچ پاداش بازی آزاد نمی‌شود (ورود به گردونه همچنان مجاز است).', status: 'تأییدشده (Unit + UI)' },
  { id: 2, title: 'کسب ۱۲۰ امتیاز', expected: 'فقط سطح اول (۱ شانس رایگان بدون نیاز به خرید) آزاد و پس از تأیید سرور اعتباردهی می‌شود.', status: 'تأییدشده (Unit + UI)' },
  { id: 3, title: 'کسب ۱۸۰ امتیاز', expected: 'سطح اول + کلید طلایی یلدا فعال می‌شوند (کلید در وضعیت در انتظار خرید شارژ > ۱۰۰٬۰۰۰ تومان).', status: 'تأییدشده (Unit + UI)' },
  { id: 4, title: 'خرید شارژ دقیقاً ۱۰۰٬۰۰۰ تومان', expected: 'کلید طلایی مصرف نمی‌شود و شانس اضافه‌ای صادر نمی‌گردد (شرط اکیداً بیشتر از ۱۰۰٬۰۰۰ تومان).', status: 'تأییدشده (Unit + UI)' },
  { id: 5, title: 'خرید موفق شارژ بیش از ۱۰۰٬۰۰۰ تومان', expected: 'کلید طلایی مصرف شده و ۱ شانس اضافه گردونه صادر می‌شود.', status: 'تأییدشده (Unit + UI)' },
  { id: 6, title: 'کسب ۳۰۰ امتیاز', expected: 'هر سه سطح واجدشرایط می‌شوند (سطح سوم مشروط به خرید بسته اینترنت > ۳۰۰٬۰۰۰ تومان).', status: 'تأییدشده (Unit + UI)' },
  { id: 7, title: 'خرید بسته اینترنت دقیقاً ۳۰۰٬۰۰۰ تومان', expected: 'دو شانس اضافه صادر نمی‌شود (شرط اکیداً بیشتر از ۳۰۰٬۰۰۰ تومان).', status: 'تأییدشده (Unit + UI)' },
  { id: 8, title: 'خرید موفق بسته اینترنت بیش از ۳۰۰٬۰۰۰ تومان', expected: '۲ شانس تشویقی آزاد و به موجودی شانس کاربر اضافه می‌شود.', status: 'تأییدشده (Unit + UI)' },
  { id: 9, title: 'کسب ۳۵۰ امتیاز کامل', expected: 'مجموع امتیاز دقیقاً ۳۵۰ است و هرگز از ۳۵۰ فراتر نمی‌رود.', status: 'تأییدشده (Unit + UI)' },
  { id: 10, title: 'تکرار چندباره بازی (Best Score)', expected: 'امتیاز دورها جمع نمی‌شود؛ فقط بالاترین امتیاز ملاک است و پاداش قبلی دوباره صادر نمی‌شود.', status: 'تأییدشده (Unit + UI)' },
  { id: 11, title: 'بازگشت به چپ در طول مسیر', expected: 'آیتم‌ها، فانوس‌ها و چالش‌های انجام‌شده دوباره امتیاز نمی‌دهند.', status: 'تأییدشده (Unit + UI)' },
  { id: 12, title: 'قطع اینترنت هنگام ثبت نتیجه یا خرید', expected: 'هیچ شانس جعلی نمایش داده نمی‌شود و پیام خطا و تلاش مجدد نمایش می‌یابد.', status: 'تأییدشده (Unit + UI)' },
  { id: 13, title: 'ارسال تکراری درخواست (Idempotency)', expected: 'با کلید یکتای Idempotency، ارسال مجدد درخواست باعث صدور شانس مضاعف نمی‌شود.', status: 'تأییدشده (Unit + UI)' },
  { id: 14, title: 'اتمام زمان ۶۰ ثانیه پیش از دروازه', expected: 'بازی پایان یافته، امتیاز کسب‌شده ثبت و صفحه نتیجه و CTA گردونه نمایش داده می‌شود.', status: 'تأییدشده (Unit + UI)' },
  { id: 15, title: 'رسیدن زودتر به دروازه پایان', expected: '۳۰ امتیاز خط پایان فقط یک‌بار ثبت شده و انیمیشن جشن ناری اجرا می‌شود.', status: 'تأییدشده (Unit + UI)' },
];

export const DeliverablesModal: React.FC<DeliverablesModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('gdd');
  const [selectedAnim, setSelectedAnim] = useState<NariAnimState>('run');
  const [events, setEvents] = useState<GA4EventRecord[]>(() => badesabaApi.getEventLog());
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return badesabaApi.subscribe(() => {
      setEvents([...badesabaApi.getEventLog()]);
    });
  }, []);

  useEffect(() => {
    if (!open || activeTab !== 'visual') return;
    if (sheetCanvasRef.current) {
      renderNariSpriteSheetToCanvas(sheetCanvasRef.current);
    }

    let animId = 0;
    let start = performance.now();
    const renderLoop = (now: number) => {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const spec = NARI_ANIM_SPECS[selectedAnim];
          const elapsed = (now - start) / 1000;
          const frameIndex = Math.floor(elapsed * spec.fps) % spec.frames;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Stage circle
          ctx.fillStyle = '#172B4D';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = 'rgba(242, 191, 89, 0.35)';
          ctx.beginPath();
          ctx.moveTo(20, 145);
          ctx.lineTo(180, 145);
          ctx.stroke();

          drawNariCharacter(ctx, {
            cx: 100,
            bottomY: 145,
            facing: 1,
            anim: selectedAnim,
            frameIndex,
            scaleX: 1.35,
            scaleY: 1.35,
          });
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [open, activeTab, selectedAnim]);

  if (!open) return null;

  const handleDownloadSpriteSheet = () => {
    const offscreen = document.createElement('canvas');
    renderNariSpriteSheetToCanvas(offscreen);
    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'nari_yalda_spritesheet_768x768.png';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 md:p-6 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="مستندات جامع طراحی، اسپرایت‌شیت و گزارش فنی بازی یلدا"
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-[#132340] border-2 border-[#F2BF59]/60 rounded-2xl shadow-2xl overflow-hidden text-[#F8E8CE]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#172B4D] border-b border-[#F2BF59]/30">
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-[#F2BF59]">
              بسته تحویلی کامل پروژه: ماجراجویی یلدایی بادصبا
            </h2>
            <p className="text-xs text-[#91C9D8]">
              GDD · Character Sheet & Sprite Atlas · Asset Manifest · API & GA4 Integration · QA Report
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#A92342] hover:bg-[#D94758] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0F1D35] border-b border-white/10 overflow-x-auto">
          {[
            { id: 'gdd', label: '۱. سند طراحی بازی (GDD)' },
            { id: 'visual', label: '۲. کاراکتر «ناری» و Sprite Sheet' },
            { id: 'manifest', label: '۳. فهرست Assetها (Manifest)' },
            { id: 'integration', label: '۴. قرارداد API بادصبا و GA4' },
            { id: 'qa', label: '۵. گزارش QA و ۱۵ سناریوی تست' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as TabKey)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#F2BF59] text-[#172B4D]'
                  : 'bg-[#172B4D] text-[#F8E8CE] hover:bg-[#213B66]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm leading-relaxed">
          {activeTab === 'gdd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
                  <h3 className="font-bold text-[#F2BF59] mb-1">داستان و مفهوم بازی</h3>
                  <p className="text-xs text-[#F8E8CE]/90">
                    در بلندترین شب سال، «ناری» با کلاه تاج‌اناری و شال‌گردن سرخ باید از کوچه برفی و بازار سنتی عبور کند، فانوس‌های شب چله را روشن نماید و در کمتر از ۶۰ ثانیه به دروازه گردونه شانس بادصبا برسد.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
                  <h3 className="font-bold text-[#F2BF59] mb-1">مکانیک و کنترل (Non-Auto-Runner)</h3>
                  <p className="text-xs text-[#F8E8CE]/90">
                    حرکت کاملاً در اختیار کاربر است (چپ، راست، پرش با فیزیک طبیعی و Coyote Time، و دکمه تعامل زمینه-آگاه برای فانوس‌ها و اهرم دروازه). برخورد با موانع باعث Game Over یا حذف امتیاز نمی‌شود.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
                  <h3 className="font-bold text-[#F2BF59] mb-1">ساختار ۳ ناحیه پیوسته</h3>
                  <p className="text-xs text-[#F8E8CE]/90">
                    ۱. کوچه برفی (۰ تا ۱۱۰۰px — آموزشی) · ۲. بازار یلدا (۱۱۰۰ تا ۲۳۰۰px — سکوها و غرفه‌ها) · ۳. مسیر جشن و دروازه گردونه (۲۳۰۰ تا ۳۲۰۰px) بدون هیچ صفحه لودینگ میانی.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
                <h3 className="font-bold text-[#F2BF59] mb-2">جدول دقیق امتیازدهی (سقف قطعی ۳۵۰ امتیاز)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse font-num">
                    <thead>
                      <tr className="border-b border-white/15 text-[#91C9D8]">
                        <th className="py-2 px-3">فعالیت</th>
                        <th className="py-2 px-3">تعداد در مسیر</th>
                        <th className="py-2 px-3">امتیاز واحد</th>
                        <th className="py-2 px-3">مجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr>
                        <td className="py-2 px-3">جمع‌آوری انار یلدایی</td>
                        <td className="py-2 px-3">۸ عدد</td>
                        <td className="py-2 px-3">۱۰ امتیاز</td>
                        <td className="py-2 px-3 font-bold text-[#F2BF59]">۸۰ امتیاز</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">جمع‌آوری قاچ هندوانه</td>
                        <td className="py-2 px-3">۶ عدد</td>
                        <td className="py-2 px-3">۱۵ امتیاز</td>
                        <td className="py-2 px-3 font-bold text-[#F2BF59]">۹۰ امتیاز</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">روشن‌کردن فانوس‌های خاموش</td>
                        <td className="py-2 px-3">۳ عدد</td>
                        <td className="py-2 px-3">۳۰ امتیاز</td>
                        <td className="py-2 px-3 font-bold text-[#F2BF59]">۹۰ امتیاز</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">چالش‌های محیطی (پرش جوی، سکوی بام، اهرم دروازه)</td>
                        <td className="py-2 px-3">۳ چالش</td>
                        <td className="py-2 px-3">۲۰ امتیاز</td>
                        <td className="py-2 px-3 font-bold text-[#F2BF59]">۶۰ امتیاز</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">رسیدن به دروازه پایان پیش از اتمام ۶۰ ثانیه</td>
                        <td className="py-2 px-3">۱ بار</td>
                        <td className="py-2 px-3">۳۰ امتیاز</td>
                        <td className="py-2 px-3 font-bold text-[#F2BF59]">۳۰ امتیاز</td>
                      </tr>
                      <tr className="bg-white/5 font-extrabold">
                        <td className="py-2 px-3">مجموع کل</td>
                        <td className="py-2 px-3">۲۱ رویداد یکتا</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3 text-[#F2BF59]">۳۵۰ امتیاز</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#172B4D] p-4 rounded-xl border border-white/10">
                <div className="flex flex-col items-center">
                  <canvas
                    ref={previewCanvasRef}
                    width={200}
                    height={165}
                    className="rounded-xl border border-[#F2BF59]/40 bg-[#0F1E38]"
                  />
                  <span className="mt-2 text-xs text-[#91C9D8]">
                    پیش‌نمایش زنده: {NARI_ANIM_SPECS[selectedAnim].labelFa}
                  </span>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#F2BF59]">۸ انیمیشن استاندارد شخصیت «ناری»</h3>
                    <button
                      type="button"
                      onClick={handleDownloadSpriteSheet}
                      className="px-3 py-1.5 rounded-lg bg-[#23745A] hover:bg-[#2c8f6f] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      دانلود PNG اسپرایت‌شیت کامل (768×768)
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(NARI_ANIM_SPECS) as NariAnimState[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedAnim(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedAnim === st
                            ? 'bg-[#D94758] text-white'
                            : 'bg-[#0F1D35] text-[#F8E8CE] hover:bg-white/10'
                        }`}
                      >
                        {NARI_ANIM_SPECS[st].labelFa}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#F8E8CE]/85">
                    طراحی اختصاصی با کلاه زمستانی تاج‌اناری (`#A92342`)، شال‌گردن مواج (`#D94758`)، پالتوی سبز یلدایی (`#23745A`) با حاشیه کرم گرم (`#F8E8CE`) و کوله‌پشتی جشن.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
                <h4 className="text-xs font-bold text-[#F2BF59] mb-2">
                  اطلس کامل Sprite Sheet (۸ ردیف انیمیشن × ابعاد ثابت هر فریم ۹۶×۹۶ پیکسل):
                </h4>
                <div className="overflow-x-auto bg-[#0F1E38] p-3 rounded-lg border border-white/10">
                  <canvas
                    ref={sheetCanvasRef}
                    className="max-w-full h-auto mx-auto"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
              <h3 className="font-bold text-[#F2BF59] mb-3">Asset Manifest (نام، دسته‌بندی، ابعاد و کاربرد)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse font-num">
                  <thead>
                    <tr className="border-b border-white/15 text-[#91C9D8]">
                      <th className="py-2 px-3">نام فایل Asset</th>
                      <th className="py-2 px-3">دسته</th>
                      <th className="py-2 px-3">ابعاد</th>
                      <th className="py-2 px-3">فرمت</th>
                      <th className="py-2 px-3">کاربرد در بازی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {ASSET_MANIFEST_ITEMS.map((item) => (
                      <tr key={item.name}>
                        <td className="py-2 px-3 font-mono text-[#F2BF59]" dir="ltr">{item.name}</td>
                        <td className="py-2 px-3">{item.category}</td>
                        <td className="py-2 px-3" dir="ltr">{item.size}</td>
                        <td className="py-2 px-3">{item.format}</td>
                        <td className="py-2 px-3">{item.usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10 space-y-2">
                  <h3 className="font-bold text-[#F2BF59]">قرارداد API سرور بادصبا و Deep Linkها</h3>
                  <p className="text-xs text-[#F8E8CE]/90">
                    اعتباردهی شانس صرفاً در سمت سرور و با کلید یکتای <code className="text-[#F2BF59]">idempotencyKey</code> انجام می‌شود. مبالغ ریالی در سرویس پرداخت به‌صورت صریح تقسیم بر ۱۰ و به تومان تبدیل می‌گردند.
                  </p>
                  <div className="text-xs font-mono bg-[#0F1D35] p-3 rounded-lg space-y-1 text-left" dir="ltr">
                    <div>POST /api/v1/yalda/attempts/finish</div>
                    <div>POST /api/v1/yalda/purchases/verify-eligibility</div>
                    <div>GET  /api/v1/yalda/campaign-status</div>
                    <div className="text-[#F2BF59] pt-1">Deep Link: {BADESABA_DEEP_LINK_CONFIG.wheelDeepLink}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10 space-y-2">
                  <h3 className="font-bold text-[#F2BF59]">رویدادهای ثبت‌شده GA4 در این نشست ({events.length})</h3>
                  <div className="max-h-48 overflow-y-auto bg-[#0F1D35] p-2.5 rounded-lg space-y-1.5 font-mono text-[11px]" dir="ltr">
                    {events.length === 0 ? (
                      <div className="text-[#91C9D8]">No events emitted yet.</div>
                    ) : (
                      events.map((ev) => (
                        <div key={ev.id} className="border-b border-white/10 pb-1">
                          <span className="text-[#F2BF59] font-bold">{ev.event}</span>{' '}
                          <span className="text-[#91C9D8]">({ev.timestamp})</span>
                          <div className="text-[#F8E8CE]/80 truncate">
                            {JSON.stringify(ev.params)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#172B4D] border border-white/10">
                <h3 className="font-bold text-[#F2BF59] mb-2">
                  گزارش مهندسی QA و ماتریس ۱۵ سناریوی پذیرش
                </h3>
                <p className="text-xs text-[#91C9D8] mb-3">
                  شفافیت پیاده‌سازی: موتور بازی، فیزیک، انیمیشن‌ها، امتیازدهی ۳۵۰تایی و قوانین پاداش ۱۰۰٪ واقعی و اجرایی هستند. اتصال به هسته پرداخت و گردونه اصلی بادصبا از طریق سرویس شبیه‌ساز سرور (`badesabaApi`) با پشتیبانی کامل از Idempotency و تست قطع شبکه پیاده‌سازی شده است.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse font-num">
                    <thead>
                      <tr className="border-b border-white/15 text-[#91C9D8]">
                        <th className="py-2 px-2.5">#</th>
                        <th className="py-2 px-2.5">سناریوی تست</th>
                        <th className="py-2 px-2.5">رفتار مورد انتظار طبق سند</th>
                        <th className="py-2 px-2.5">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {QA_ACCEPTANCE_SCENARIOS.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 px-2.5 font-bold text-[#F2BF59]">{s.id}</td>
                          <td className="py-2 px-2.5 font-semibold">{s.title}</td>
                          <td className="py-2 px-2.5 text-[#F8E8CE]/85">{s.expected}</td>
                          <td className="py-2 px-2.5 text-[#4ADE80] font-bold whitespace-nowrap">{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
