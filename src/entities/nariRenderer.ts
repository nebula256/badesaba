/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NariAnimState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'collect'
  | 'interact'
  | 'hit'
  | 'celebrate';

export const NARI_ANIM_SPECS: Record<
  NariAnimState,
  { frames: number; fps: number; labelFa: string }
> = {
  idle: { frames: 6, fps: 8, labelFa: 'ایستادن و نفس‌کشیدن (Idle - 6f)' },
  run: { frames: 8, fps: 14, labelFa: 'دویدن (Run - 8f)' },
  jump: { frames: 4, fps: 10, labelFa: 'پرش (Jump - 4f)' },
  fall: { frames: 4, fps: 10, labelFa: 'سقوط و فرود (Fall - 4f)' },
  collect: { frames: 4, fps: 12, labelFa: 'دریافت آیتم (Collect - 4f)' },
  interact: { frames: 6, fps: 12, labelFa: 'روشن‌کردن فانوس (Interact - 6f)' },
  hit: { frames: 4, fps: 10, labelFa: 'برخورد با مانع (Hit - 4f)' },
  celebrate: { frames: 8, fps: 12, labelFa: 'جشن موفقیت (Celebrate - 8f)' },
};

/**
 * Renders "Nari" (ناری) in a rich, hand-painted storybook illustration style at (cx, bottomY).
 * Features:
 * - Soft warm lantern rim-glow & dynamic ground contact shadow
 * - Volumetric ruby-pomegranate winter hat with golden embroidery & jeweled crown
 * - Braided dark hair locks, expressive storybook eyes with dual catchlights, rosy cheeks
 * - Flowing crimson silk scarf with golden Termeh border & tassels
 * - Emerald velvet winter coat with plush cream wool trim & brass buttons
 * - Crafted leather satchel with a glowing mini Yalda lantern charm
 */
export function drawNariCharacter(
  ctx: CanvasRenderingContext2D,
  options: {
    cx: number;
    bottomY: number;
    facing: 1 | -1;
    anim: NariAnimState;
    frameIndex: number;
    scaleX?: number;
    scaleY?: number;
    hitFlash?: boolean;
  }
): void {
  const {
    cx,
    bottomY,
    facing,
    anim,
    frameIndex,
    scaleX = 1,
    scaleY = 1,
    hitFlash = false,
  } = options;

  const totalFrames = NARI_ANIM_SPECS[anim].frames;
  const f = frameIndex % totalFrames;
  const phase = (f / totalFrames) * Math.PI * 2;

  ctx.save();
  ctx.translate(cx, bottomY);
  ctx.scale(facing * scaleX, scaleY);

  let bodyBobY = 0;
  let bodyTilt = 0;
  let leftLegAngle = 0;
  let rightLegAngle = 0;
  let armAngle = 0;
  let scarfWave = Math.sin(phase) * 5;
  let eyeHappy = false;
  let eyeBlink = false;
  let eyeSurprised = false;

  switch (anim) {
    case 'idle':
      bodyBobY = Math.sin(phase) * 2.2;
      scarfWave = Math.sin(phase) * 3.2;
      armAngle = Math.sin(phase) * 0.08;
      eyeBlink = f === 4;
      break;
    case 'run':
      bodyBobY = -Math.abs(Math.sin(phase)) * 5.8;
      bodyTilt = 0.14;
      leftLegAngle = Math.sin(phase) * 0.68;
      rightLegAngle = -Math.sin(phase) * 0.68;
      armAngle = -Math.sin(phase) * 0.58;
      scarfWave = -10 + Math.sin(phase * 2) * 6.5;
      break;
    case 'jump':
      bodyBobY = -6;
      bodyTilt = -0.08;
      leftLegAngle = -0.35;
      rightLegAngle = 0.45;
      armAngle = -0.85;
      scarfWave = 8 + f * 2;
      break;
    case 'fall':
      bodyBobY = -2;
      bodyTilt = 0.06;
      leftLegAngle = 0.25;
      rightLegAngle = -0.2;
      armAngle = -0.45;
      scarfWave = -12 - f * 1.5;
      break;
    case 'collect':
      bodyBobY = -Math.sin((f / 4) * Math.PI) * 6;
      armAngle = -0.9;
      eyeHappy = true;
      break;
    case 'interact':
      bodyTilt = 0.1;
      armAngle = -0.75 - Math.sin(phase) * 0.35;
      eyeHappy = true;
      break;
    case 'hit':
      bodyBobY = -3;
      bodyTilt = -0.22;
      leftLegAngle = -0.3;
      rightLegAngle = 0.2;
      armAngle = 0.5;
      eyeSurprised = true;
      break;
    case 'celebrate':
      bodyBobY = -Math.abs(Math.sin(phase * 2)) * 10;
      bodyTilt = Math.sin(phase) * 0.1;
      leftLegAngle = Math.sin(phase) * 0.35;
      rightLegAngle = -Math.sin(phase) * 0.35;
      armAngle = -2.2 + Math.sin(phase * 2) * 0.25;
      eyeHappy = true;
      break;
  }

  // Soft warm character aura so Nari pops against night scenes
  const charAura = ctx.createRadialGradient(0, -32, 4, 0, -32, 38);
  charAura.addColorStop(0, 'rgba(255, 224, 150, 0.22)');
  charAura.addColorStop(0.6, 'rgba(217, 71, 88, 0.08)');
  charAura.addColorStop(1, 'rgba(255, 224, 150, 0)');
  ctx.fillStyle = charAura;
  ctx.beginPath();
  ctx.arc(0, -32, 38, 0, Math.PI * 2);
  ctx.fill();

  // Soft layered ground contact shadow
  const shadowRadius = Math.max(10, 19 - Math.abs(bodyBobY) * 0.45);
  const shadowGrad = ctx.createRadialGradient(0, -1, 2, 0, -1, shadowRadius);
  shadowGrad.addColorStop(0, 'rgba(8, 15, 30, 0.55)');
  shadowGrad.addColorStop(1, 'rgba(8, 15, 30, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(0, -1, shadowRadius, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bodyBobY);
  ctx.rotate(bodyTilt);

  // 1. Flowing Silk Crimson Scarf Tail (behind body) with golden Termeh trim & tassels
  ctx.save();
  ctx.translate(-6, -31);
  const scarfGrad = ctx.createLinearGradient(0, 0, -28, 10 + scarfWave);
  if (hitFlash) {
    scarfGrad.addColorStop(0, '#FFFFFF');
    scarfGrad.addColorStop(1, '#FFFFFF');
  } else {
    scarfGrad.addColorStop(0, '#E11D48');
    scarfGrad.addColorStop(0.6, '#BE123C');
    scarfGrad.addColorStop(1, '#881337');
  }
  ctx.fillStyle = scarfGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-10, -4 + scarfWave * 0.3, -18, 1 + scarfWave * 0.7, -28, 4 + scarfWave);
  ctx.lineTo(-26, 13 + scarfWave);
  ctx.bezierCurveTo(-16, 10 + scarfWave * 0.6, -8, 6 + scarfWave * 0.3, 2, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden Termeh stripe & fringe tassels on scarf end
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.roundRect(-28.5, 4 + scarfWave, 4, 9, 1.5);
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.2;
  for (let t = 0; t < 3; t++) {
    ctx.beginPath();
    ctx.moveTo(-28.5, 5.5 + t * 3 + scarfWave);
    ctx.lineTo(-32.5, 6 + t * 3 + scarfWave * 1.1);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Crafted Leather Satchel Backpack + Mini Glowing Lantern Charm
  ctx.save();
  ctx.translate(-12, -33);
  const bagGrad = ctx.createLinearGradient(-7, 0, 6, 18);
  bagGrad.addColorStop(0, hitFlash ? '#FFFFFF' : '#B45309');
  bagGrad.addColorStop(1, hitFlash ? '#FFFFFF' : '#78350F');
  ctx.fillStyle = bagGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-7.5, 0, 14, 18, 4.5);
  ctx.fill();
  ctx.stroke();

  // Satchel top flap & gold clasp
  ctx.fillStyle = hitFlash ? '#FFFFFF' : '#92400E';
  ctx.beginPath();
  ctx.roundRect(-7.5, 0, 14, 7.5, [4.5, 4.5, 3, 3]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(-1, 7.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Tiny glowing lantern charm hanging off the back of the satchel
  const charmSwing = Math.sin(phase) * 0.18;
  ctx.save();
  ctx.translate(-7, 11);
  ctx.rotate(charmSwing);
  const charmGlow = ctx.createRadialGradient(-2, 4, 1, -2, 4, 9);
  charmGlow.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
  charmGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = charmGlow;
  ctx.beginPath();
  ctx.arc(-2, 4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FDE68A';
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-4.5, 1, 5, 6, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // 3. Legs & Fur-Trimmed Winter Boots
  const drawBoot = (offsetX: number, angle: number, isBack: boolean) => {
    ctx.save();
    ctx.translate(offsetX, -14);
    ctx.rotate(angle);

    // Warm wool leggings
    ctx.fillStyle = isBack ? '#1E293B' : '#334155';
    ctx.fillRect(-3.5, 0, 7, 8);

    // Boot body with ruby-leather gradient
    const bootGrad = ctx.createLinearGradient(-4, 5, 6, 14);
    bootGrad.addColorStop(0, hitFlash ? '#FFFFFF' : isBack ? '#881337' : '#E11D48');
    bootGrad.addColorStop(1, hitFlash ? '#FFFFFF' : isBack ? '#4C0519' : '#9F1239');
    ctx.fillStyle = bootGrad;
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-4.5, 5.5, 11.5, 8.5, [3, 4.5, 2.5, 2.5]);
    ctx.fill();
    ctx.stroke();

    // Cream fur cuff on top of boot
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.roundRect(-5, 4.2, 10, 3, 1.5);
    ctx.fill();

    // Rubber sole & gold buckle
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(1.8, 9.2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawBoot(-4, leftLegAngle, true);
  drawBoot(4, rightLegAngle, false);

  // 4. Emerald Velvet Winter Coat with Termeh Trim & Plush Fur Hem
  ctx.save();
  const coatGrad = ctx.createLinearGradient(-12, -35, 12, -11);
  if (hitFlash) {
    coatGrad.addColorStop(0, '#FFFFFF');
    coatGrad.addColorStop(1, '#FFFFFF');
  } else {
    coatGrad.addColorStop(0, '#10B981');
    coatGrad.addColorStop(0.55, '#047857');
    coatGrad.addColorStop(1, '#064E3B');
  }
  ctx.fillStyle = coatGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, -34);
  ctx.lineTo(11, -34);
  ctx.quadraticCurveTo(15.5, -18, 13.5, -12);
  ctx.lineTo(-13.5, -12);
  ctx.quadraticCurveTo(-15.5, -18, -11, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden Termeh decorative vertical embroidery band
  ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
  ctx.fillRect(0.5, -33, 5, 18);

  // Plush scalloped cream wool fur hem
  ctx.fillStyle = '#FFFBEB';
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-14, -15.5, 28, 5, 2.5);
  ctx.fill();
  ctx.stroke();

  // Gleaming brass coat buttons
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(3, -25.5, 2, 0, Math.PI * 2);
  ctx.arc(3, -19.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Plush Scarf Neck Wrap
  ctx.save();
  const neckGrad = ctx.createLinearGradient(-12, -37, 12, -29);
  neckGrad.addColorStop(0, hitFlash ? '#FFFFFF' : '#FB7185');
  neckGrad.addColorStop(0.5, hitFlash ? '#FFFFFF' : '#E11D48');
  neckGrad.addColorStop(1, hitFlash ? '#FFFFFF' : '#9F1239');
  ctx.fillStyle = neckGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-12.5, -36.5, 25, 7.5, 4);
  ctx.fill();
  ctx.stroke();
  // Subtle gold stitch line on scarf
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-9, -32.8);
  ctx.lineTo(9, -32.8);
  ctx.stroke();
  ctx.restore();

  // 6. Storybook Expressive Head & Face
  ctx.save();
  ctx.translate(0, -50);

  // Soft warm skin gradient
  const skinGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
  skinGrad.addColorStop(0, hitFlash ? '#FFFFFF' : '#FFF1E6');
  skinGrad.addColorStop(0.75, hitFlash ? '#FFFFFF' : '#FFE4C8');
  skinGrad.addColorStop(1, hitFlash ? '#FFFFFF' : '#F5C6A5');
  ctx.fillStyle = skinGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 15.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Soft airbrushed rosy winter cheeks
  const cheekGrad = ctx.createRadialGradient(7.5, 3.8, 0.5, 7.5, 3.8, 4.8);
  cheekGrad.addColorStop(0, 'rgba(244, 63, 94, 0.55)');
  cheekGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = cheekGrad;
  ctx.beginPath();
  ctx.arc(7.5, 3.8, 4.8, 0, Math.PI * 2);
  ctx.fill();

  // Silky dark braided side hair lock with a tiny ruby ribbon
  ctx.fillStyle = '#1E1324';
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.quadraticCurveTo(-15, 3, -10, 9);
  ctx.quadraticCurveTo(-5, 4, -6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(-10.5, 5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Delicate eyebrows
  ctx.strokeStyle = '#3B1D2E';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(4, -3.5, 3.2, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(11.5, -3.5, 2.6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Expressive Storybook Eyes
  if (eyeHappy) {
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(4, -1, 3.2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(11.5, -1, 2.8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else if (eyeBlink) {
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(1.5, -1);
    ctx.lineTo(6.5, -1);
    ctx.moveTo(9.5, -1);
    ctx.lineTo(13.5, -1);
    ctx.stroke();
  } else if (eyeSurprised) {
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(4, -1.5, 3.2, 0, Math.PI * 2);
    ctx.arc(11.5, -1.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Rich iris + pupil + dual starlight catchlights
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.ellipse(4.2, -1.4, 3.0, 3.6, 0, 0, Math.PI * 2);
    ctx.ellipse(11.5, -1.4, 2.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warm amber lower iris glow
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(4.2, -0.3, 1.7, 0, Math.PI);
    ctx.arc(11.5, -0.3, 1.4, 0, Math.PI);
    ctx.fill();

    // Primary & secondary catchlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3.3, -2.7, 1.25, 0, Math.PI * 2);
    ctx.arc(10.7, -2.7, 1.05, 0, Math.PI * 2);
    ctx.arc(5.1, -0.4, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cheerful Smile
  ctx.strokeStyle = '#881337';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (eyeSurprised) {
    ctx.arc(8, 5, 2.2, 0, Math.PI * 2);
  } else if (eyeHappy) {
    ctx.arc(7.5, 3.5, 3.6, 0.1, Math.PI - 0.1);
  } else {
    ctx.arc(7.5, 3.8, 2.7, 0.15, Math.PI * 0.85);
  }
  ctx.stroke();

  // 7. Volumetric Ruby-Pomegranate Winter Hat + Jeweled Crown + Fluffy Wool Brim
  // Royal Pomegranate Crown on top of hat
  const crownGrad = ctx.createLinearGradient(0, -29, 0, -18);
  crownGrad.addColorStop(0, '#FDE047');
  crownGrad.addColorStop(1, '#D97706');
  ctx.fillStyle = hitFlash ? '#FFFFFF' : crownGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-7.5, -18);
  ctx.lineTo(-9.5, -26.5);
  ctx.lineTo(-3.2, -21.5);
  ctx.lineTo(0, -29);
  ctx.lineTo(3.2, -21.5);
  ctx.lineTo(9.5, -26.5);
  ctx.lineTo(7.5, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing ruby gem in the crown center
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.arc(0, -22, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFE4E6';
  ctx.beginPath();
  ctx.arc(-0.6, -22.6, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Pomegranate Hat Dome with 3D spherical shading
  const hatGrad = ctx.createRadialGradient(-4, -14, 2, 0, -8, 18);
  if (hitFlash) {
    hatGrad.addColorStop(0, '#FFFFFF');
    hatGrad.addColorStop(1, '#FFFFFF');
  } else {
    hatGrad.addColorStop(0, '#FB7185');
    hatGrad.addColorStop(0.45, '#E11D48');
    hatGrad.addColorStop(0.85, '#9F1239');
    hatGrad.addColorStop(1, '#4C0519');
  }
  ctx.fillStyle = hatGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -4, 16.2, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle pomegranate rib lines & specular shine on hat dome
  ctx.strokeStyle = 'rgba(255, 228, 230, 0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-3, -10, 8, Math.PI * 1.15, Math.PI * 1.65);
  ctx.stroke();

  // Fluffy Scalloped Sheep-Wool Hat Brim
  const brimGrad = ctx.createLinearGradient(0, -9, 0, -1.5);
  brimGrad.addColorStop(0, '#FFFFFF');
  brimGrad.addColorStop(1, '#F3E8D2');
  ctx.fillStyle = brimGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-17.5, -8.5, 35, 7, 3.5);
  ctx.fill();
  ctx.stroke();

  // Golden embroidery dots along the hat brim
  ctx.fillStyle = '#F59E0B';
  for (let bx = -12; bx <= 12; bx += 6) {
    ctx.beginPath();
    ctx.arc(bx, -5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // End head

  // 8. Front Arm & Pomegranate Mitten
  ctx.save();
  ctx.translate(2, -30);
  ctx.rotate(armAngle);
  ctx.fillStyle = hitFlash ? '#FFFFFF' : '#059669';
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-3.5, 0, 7, 13, 3.5);
  ctx.fill();
  ctx.stroke();

  // Fluffy white wrist cuff
  ctx.fillStyle = '#FFFBEB';
  ctx.fillRect(-4, 10.5, 8, 2.5);

  // Ruby mitten
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.arc(0, 14.5, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Generates an offscreen Sprite Sheet Canvas containing all 8 animations (8 rows x 8 max columns, each frame 96x96).
 */
export function renderNariSpriteSheetToCanvas(canvas: HTMLCanvasElement): void {
  const frameSize = 96;
  const states: NariAnimState[] = [
    'idle',
    'run',
    'jump',
    'fall',
    'collect',
    'interact',
    'hit',
    'celebrate',
  ];
  canvas.width = frameSize * 8;
  canvas.height = frameSize * states.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  states.forEach((state, rowIdx) => {
    const count = NARI_ANIM_SPECS[state].frames;
    for (let f = 0; f < count; f++) {
      const cellX = f * frameSize;
      const cellY = rowIdx * frameSize;

      ctx.strokeStyle = 'rgba(242, 191, 89, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX + 2, cellY + 2, frameSize - 4, frameSize - 4);

      drawNariCharacter(ctx, {
        cx: cellX + frameSize / 2,
        bottomY: cellY + frameSize - 12,
        facing: 1,
        anim: state,
        frameIndex: f,
      });
    }
  });
}
