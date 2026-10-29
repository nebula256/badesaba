/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GROUND_Y,
  WORLD_LENGTH,
  CollectibleItem,
  LanternItem,
  ChallengeDefinition,
  PlatformRect,
  ObstacleRect,
  GapZone,
  TalaseeBooth,
  SurmelinaBooth,
  HafezBooth,
} from '../game/rules';

export interface FloatingScorePopup {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

/**
 * Helper to draw a 4-point sparkling star flare at (x, y)
 */
function drawSparkleStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color = '#FFFBEB'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.quadraticCurveTo(radius * 0.18, -radius * 0.18, radius, 0);
  ctx.quadraticCurveTo(radius * 0.18, radius * 0.18, 0, radius);
  ctx.quadraticCurveTo(-radius * 0.18, radius * 0.18, -radius, 0);
  ctx.quadraticCurveTo(-radius * 0.18, -radius * 0.18, 0, -radius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Jewel-like Persian Ruby Pomegranate collectible with glowing aura,
 * 3D spherical shading, green leaf, royal crown, and sparkling aril gems.
 */
export function drawPomegranateItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeSec: number,
  scale = 1
): void {
  const floatY = y + Math.sin(timeSec * 3.8 + x * 0.03) * 4.5;
  ctx.save();
  ctx.translate(x, floatY);
  ctx.scale(scale, scale);

  // Outer warm ruby-gold magical aura
  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
  aura.addColorStop(0, 'rgba(244, 63, 94, 0.55)');
  aura.addColorStop(0.55, 'rgba(251, 191, 36, 0.22)');
  aura.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();

  // Subtle rotating golden ring
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 2, 15.5, timeSec * 2, timeSec * 2 + Math.PI * 1.3);
  ctx.stroke();

  // Small emerald leaf on the side of the crown
  ctx.save();
  ctx.translate(5, -9);
  ctx.rotate(0.45);
  const leafGrad = ctx.createLinearGradient(0, 0, 8, 0);
  leafGrad.addColorStop(0, '#34D399');
  leafGrad.addColorStop(1, '#059669');
  ctx.fillStyle = leafGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(5, -4, 9, 0);
  ctx.quadraticCurveTo(5, 4, 0, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Pomegranate Crown (Calyx) with golden-crimson gradient
  const crownGrad = ctx.createLinearGradient(0, -16, 0, -7);
  crownGrad.addColorStop(0, '#FBBF24');
  crownGrad.addColorStop(0.5, '#E11D48');
  crownGrad.addColorStop(1, '#881337');
  ctx.fillStyle = crownGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-5.5, -7.5);
  ctx.lineTo(-7, -14.5);
  ctx.lineTo(-2.2, -10.5);
  ctx.lineTo(0, -16);
  ctx.lineTo(2.2, -10.5);
  ctx.lineTo(7, -14.5);
  ctx.lineTo(5.5, -7.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Volumetric 3D Pomegranate Body
  const bodyGrad = ctx.createRadialGradient(-4, -2, 1.5, 0, 2, 13);
  bodyGrad.addColorStop(0, '#FDA4AF');
  bodyGrad.addColorStop(0.28, '#F43F5E');
  bodyGrad.addColorStop(0.68, '#BE123C');
  bodyGrad.addColorStop(1, '#4C0519');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 2.5, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cutaway ruby aril gem cluster (دانه‌های یاقوتی درخشان) on lower-right
  ctx.fillStyle = '#FFF1F2';
  ctx.beginPath();
  ctx.arc(3.5, 4.5, 4.8, 0, Math.PI * 2);
  ctx.fill();

  const arils = [
    [2.2, 3.2],
    [5.0, 3.5],
    [3.2, 6.0],
    [5.4, 5.8],
  ];
  for (const [ax, ay] of arils) {
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(ax, ay, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ax - 0.4, ay - 0.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glossy top-left specular shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(-4.5, -2, 2.8, 1.5, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Twinkling sparkle
  const sp = 2.5 + Math.sin(timeSec * 6 + x) * 1.5;
  drawSparkleStar(ctx, -8, -8, sp, '#FEF08A');

  ctx.restore();
}

/**
 * Lush Yalda Watermelon Slice with striped emerald rind, cream pith,
 * juicy crimson gradient flesh, and glossy seeds.
 */
export function drawWatermelonItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeSec: number,
  scale = 1
): void {
  const floatY = y + Math.cos(timeSec * 3.4 + x * 0.025) * 4.5;
  ctx.save();
  ctx.translate(x, floatY);
  ctx.scale(scale, scale);
  ctx.rotate(Math.sin(timeSec * 2.2 + x) * 0.09);

  // Soft emerald-crimson aura
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0.48)');
  grad.addColorStop(0.6, 'rgba(244, 63, 94, 0.2)');
  grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();

  // Outer dark-emerald rind semi-circle
  const rindGrad = ctx.createLinearGradient(-15, -3, 15, 12);
  rindGrad.addColorStop(0, '#10B981');
  rindGrad.addColorStop(0.5, '#047857');
  rindGrad.addColorStop(1, '#064E3B');
  ctx.fillStyle = rindGrad;
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -3, 14.5, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cream inner pith layer
  ctx.fillStyle = '#FEFCE8';
  ctx.beginPath();
  ctx.arc(0, -3, 11.8, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  // Juicy crimson flesh gradient
  const fleshGrad = ctx.createRadialGradient(0, -3, 1, 0, 2, 12);
  fleshGrad.addColorStop(0, '#FB7185');
  fleshGrad.addColorStop(0.55, '#E11D48');
  fleshGrad.addColorStop(1, '#9F1239');
  ctx.fillStyle = fleshGrad;
  ctx.beginPath();
  ctx.arc(0, -3, 10.2, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  // Glossy top edge highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(-9, -2.5, 18, 1.6);

  // Teardrop seeds with tiny white shines
  const seeds = [
    [-4.8, 1.5],
    [0, 3.8],
    [4.8, 1.5],
    [-2.2, 2.8],
    [2.2, 2.8],
  ];
  for (const [sx, sy] of seeds) {
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(sx, sy, 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sx - 0.3, sy - 0.3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const sp = 2.4 + Math.cos(timeSec * 5 + x) * 1.2;
  drawSparkleStar(ctx, 10, -7, sp, '#A7F3D0');

  ctx.restore();
}

/**
 * Ornate Persian Street Lantern (فانوس شاه‌عباسی) with wrought-iron scroll bracket,
 * snow cap, hexagonal stained glass, volumetric ground light cone, and dancing flame.
 */
export function drawLanternProp(
  ctx: CanvasRenderingContext2D,
  lantern: LanternItem,
  timeSec: number,
  isPlayerNear: boolean
): void {
  ctx.save();
  ctx.translate(lantern.x, lantern.y);

  // Volumetric light cone cast down onto the snow when lit
  if (lantern.lit) {
    ctx.save();
    const coneGrad = ctx.createLinearGradient(16, 10, 16, 75);
    coneGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    coneGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(22, 8);
    ctx.lineTo(54, 75);
    ctx.lineTo(-22, 75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Carved walnut & wrought-iron post with 3D cylindrical shading
  const postGrad = ctx.createLinearGradient(-5, 0, 5, 0);
  postGrad.addColorStop(0, '#27171A');
  postGrad.addColorStop(0.4, '#5C3828');
  postGrad.addColorStop(1, '#1F1216');
  ctx.fillStyle = postGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-4.5, -26, 9, 101, 2);
  ctx.fill();
  ctx.stroke();

  // Ornate stepped base pedestal on ground
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(-9, 64, 18, 11, [3, 3, 1, 1]);
  ctx.fill();
  ctx.stroke();

  // Top finial & cross-arm with snow cap
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.arc(0, -29, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = postGrad;
  ctx.beginPath();
  ctx.roundRect(-6, -24, 29, 6, 3);
  ctx.fill();
  ctx.stroke();

  // Fluffy snow resting on top of the cross-arm
  ctx.fillStyle = '#E0F2FE';
  ctx.beginPath();
  ctx.roundRect(-4, -26.5, 25, 3.2, 2);
  ctx.fill();

  // Wrought-iron decorative scroll spiral under the cross-arm
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4.5, -18);
  ctx.quadraticCurveTo(12, -18, 15, -24);
  ctx.stroke();

  // Hanging Shah-Abbasi Hexagonal Brass Lantern at (17, -6)
  ctx.save();
  ctx.translate(17, -6);
  ctx.rotate(Math.sin(timeSec * 2.2 + lantern.x) * 0.055);

  if (lantern.lit) {
    const glow = ctx.createRadialGradient(0, 10, 2, 0, 10, 62);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
    glow.addColorStop(0.4, 'rgba(245, 158, 11, 0.38)');
    glow.addColorStop(0.75, 'rgba(225, 29, 72, 0.14)');
    glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 10, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hanging chain
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -5);
  ctx.stroke();

  // Domed brass lantern crown
  ctx.fillStyle = lantern.lit ? '#FBBF24' : '#64748B';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(10, 0);
  ctx.lineTo(6, -6);
  ctx.lineTo(-6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tapered hexagonal glass chamber
  const glassGrad = ctx.createLinearGradient(0, 0, 0, 22);
  if (lantern.lit) {
    glassGrad.addColorStop(0, '#FEF08A');
    glassGrad.addColorStop(0.6, '#F59E0B');
    glassGrad.addColorStop(1, '#EA580C');
  } else {
    glassGrad.addColorStop(0, '#334155');
    glassGrad.addColorStop(1, '#1E293B');
  }
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(9, 0);
  ctx.lineTo(6.5, 21);
  ctx.lineTo(-6.5, 21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Brass lattice mullions across glass
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.lineTo(-2.5, 21);
  ctx.moveTo(3.5, 0);
  ctx.lineTo(2.5, 21);
  ctx.stroke();

  // Bottom brass finial drop
  ctx.fillStyle = lantern.lit ? '#FBBF24' : '#64748B';
  ctx.beginPath();
  ctx.moveTo(-5, 21);
  ctx.lineTo(5, 21);
  ctx.lineTo(0, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (lantern.lit) {
    // Dancing inner flame core
    const flicker = Math.sin(timeSec * 14 + lantern.x) * 1.2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 12, 2.5, 4.5 + flicker * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating firefly embers around lit lantern
    for (let e = 0; e < 3; e++) {
      const ex = Math.sin(timeSec * 2.5 + e * 2.1) * 16;
      const ey = 6 - ((timeSec * 18 + e * 9) % 24);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Minimal floating interaction pill when player is nearby
  if (isPlayerNear && !lantern.lit) {
    const pulse = Math.sin(timeSec * 6) * 2;
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-48, -58 + pulse, 110, 24, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('کلید E: روشن‌کردن (+۳۰)', 7, -42 + pulse);
  }

  ctx.restore();
}

/**
 * Renders Booth 1: "غرفه طلاسی" (Talasee Luxury Gold Pavilion)
 * Features backlit Persian Girih lattice, scalloped crimson/gold velvet awning,
 * jovial goldsmith character, 3D-faceted gold bullion bars, coin treasure tray, and brass scale.
 */
export function drawTalaseeBooth(
  ctx: CanvasRenderingContext2D,
  booth: TalaseeBooth,
  timeSec: number,
  isPlayerNear: boolean
): void {
  ctx.save();
  ctx.translate(booth.x, booth.y);

  // Radiant golden ambient halo behind booth
  const auraR = isPlayerNear ? 132 : 105;
  const aura = ctx.createRadialGradient(0, -70, 10, 0, -70, auraR);
  aura.addColorStop(0, isPlayerNear ? 'rgba(251, 191, 36, 0.52)' : 'rgba(251, 191, 36, 0.32)');
  aura.addColorStop(0.6, 'rgba(217, 119, 6, 0.12)');
  aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -70, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Back pavilion arch wall with royal navy & gold gradient
  const wallGrad = ctx.createLinearGradient(0, -132, 0, 0);
  wallGrad.addColorStop(0, '#0F172A');
  wallGrad.addColorStop(0.5, '#1E293B');
  wallGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = wallGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(-72, -130, 144, 130, [12, 12, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Warm backlit golden arch niche behind merchant
  const nicheGrad = ctx.createRadialGradient(0, -82, 6, 0, -82, 54);
  nicheGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
  nicheGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
  ctx.fillStyle = nicheGrad;
  ctx.beginPath();
  ctx.arc(0, -82, 52, Math.PI, 0);
  ctx.lineTo(52, -50);
  ctx.lineTo(-52, -50);
  ctx.closePath();
  ctx.fill();

  // Subtle geometric golden lattice lines in background
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
  ctx.lineWidth = 1;
  for (let gx = -56; gx <= 56; gx += 28) {
    ctx.beginPath();
    ctx.moveTo(gx, -124);
    ctx.lineTo(gx, -52);
    ctx.stroke();
  }

  // Left & Right carved golden columns with capitals
  const colGradL = ctx.createLinearGradient(-74, 0, -62, 0);
  colGradL.addColorStop(0, '#92400E');
  colGradL.addColorStop(0.5, '#FDE047');
  colGradL.addColorStop(1, '#B45309');
  ctx.fillStyle = colGradL;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.fillRect(-74, -128, 12, 128);
  ctx.strokeRect(-74, -128, 12, 128);

  const colGradR = ctx.createLinearGradient(62, 0, 74, 0);
  colGradR.addColorStop(0, '#92400E');
  colGradR.addColorStop(0.5, '#FDE047');
  colGradR.addColorStop(1, '#B45309');
  ctx.fillStyle = colGradR;
  ctx.fillRect(62, -128, 12, 128);
  ctx.strokeRect(62, -128, 12, 128);

  // --- GOLDSMITH MERCHANT CHARACTER (حاج طلایی) ---
  ctx.save();
  const bob = Math.sin(timeSec * 2.6) * 1.8;
  ctx.translate(-6, -56 + bob);

  // Royal crimson & gold brocade vest
  const vestGrad = ctx.createLinearGradient(-16, -24, 16, 6);
  vestGrad.addColorStop(0, '#E11D48');
  vestGrad.addColorStop(1, '#881337');
  ctx.fillStyle = vestGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-16, -24, 32, 30, 8);
  ctx.fill();
  ctx.stroke();

  // White silk shirt collar & gold buttons
  ctx.fillStyle = '#FFFBEB';
  ctx.beginPath();
  ctx.moveTo(-5, -24);
  ctx.lineTo(5, -24);
  ctx.lineTo(0, -14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -23);
  ctx.lineTo(-7, 4);
  ctx.moveTo(7, -23);
  ctx.lineTo(7, 4);
  ctx.stroke();

  // Waving hand holding a gleaming gold coin
  ctx.save();
  ctx.translate(-16, -16);
  ctx.rotate(-0.45 + Math.sin(timeSec * 5) * 0.22);
  ctx.fillStyle = '#BE123C';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-14, -4, 14, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFE4C8';
  ctx.beginPath();
  ctx.arc(-15, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(-18, -4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Head with warm skin shading
  ctx.fillStyle = '#FFE4C8';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -37, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes & joyful eyebrows
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-4.5, -38.5, 2, 0, Math.PI * 2);
  ctx.arc(4.0, -38.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-5, -39.2, 0.7, 0, Math.PI * 2);
  ctx.arc(3.5, -39.2, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Classic handlebar moustache
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-7, -33);
  ctx.quadraticCurveTo(-3.5, -35.5, 0, -33);
  ctx.quadraticCurveTo(3.5, -35.5, 7, -33);
  ctx.stroke();

  // Emerald & gold-trimmed Qajar hat
  ctx.fillStyle = '#047857';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-13, -53, 26, 11, [6, 6, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(-13, -45.5, 26, 3.5);
  ctx.restore();

  // --- LUXURY COUNTER & VELVET TABLECLOTH ---
  const woodGrad = ctx.createLinearGradient(0, -52, 0, 0);
  woodGrad.addColorStop(0, '#78350F');
  woodGrad.addColorStop(1, '#451A03');
  ctx.fillStyle = woodGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-68, -52, 136, 52, 4);
  ctx.fill();
  ctx.stroke();

  // Royal crimson velvet front drape with golden border & corner tassels
  const drapeGrad = ctx.createLinearGradient(0, -46, 0, -12);
  drapeGrad.addColorStop(0, '#BE123C');
  drapeGrad.addColorStop(1, '#881337');
  ctx.fillStyle = drapeGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-56, -45, 112, 32, [4, 4, 10, 10]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = '800 11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('شمش و طلای آب‌شده', 0, -25);

  // Polished golden marble tabletop
  const topGrad = ctx.createLinearGradient(-72, -57, 72, -49);
  topGrad.addColorStop(0, '#D97706');
  topGrad.addColorStop(0.5, '#FDE047');
  topGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = topGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-72, -57, 144, 8, 3);
  ctx.fill();
  ctx.stroke();

  // --- 3D-FACETED GOLD BULLION BARS & COINS ON COUNTER ---
  const drawGoldIngot = (gx: number, gy: number, w = 18, h = 7.5) => {
    const ingotGrad = ctx.createLinearGradient(gx, gy - h, gx + w, gy);
    ingotGrad.addColorStop(0, '#FEF08A');
    ingotGrad.addColorStop(0.5, '#FBBF24');
    ingotGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = ingotGrad;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 3, gy - h);
    ctx.lineTo(gx + w - 3, gy - h);
    ctx.lineTo(gx + w, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(gx + 4, gy - h + 1.5, w - 8, 1.8);
  };

  // Left pyramid of gold bars
  drawGoldIngot(-61, -57);
  drawGoldIngot(-42, -57);
  drawGoldIngot(-23, -57);
  drawGoldIngot(-51, -64.5);
  drawGoldIngot(-32, -64.5);
  drawGoldIngot(-41.5, -72);

  // Right pyramid of gold bars
  drawGoldIngot(17, -57);
  drawGoldIngot(36, -57);
  drawGoldIngot(55, -57);
  drawGoldIngot(26.5, -64.5);
  drawGoldIngot(45.5, -64.5);
  drawGoldIngot(36, -72);

  // Center stacks of gleaming gold coins
  const coinStacks = [
    { x: -6, count: 5 },
    { x: 4, count: 7 },
    { x: 13, count: 4 },
  ];
  for (const st of coinStacks) {
    for (let c = 0; c < st.count; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#FDE047' : '#F59E0B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(st.x, -59 - c * 3.1, 5.5, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Animated 4-point sparkles over the gold piles
  drawSparkleStar(ctx, -42, -79, 4 + Math.sin(timeSec * 5) * 1.8, '#FFFBEB');
  drawSparkleStar(ctx, 4, -85, 4.5 + Math.cos(timeSec * 4.5) * 1.8, '#FEF08A');
  drawSparkleStar(ctx, 41, -78, 3.8 + Math.sin(timeSec * 5.5 + 1) * 1.5, '#FFFBEB');

  // --- SCALLOPED AWNING & TOP CANOPY SIGNBOARD ("غرفه طلاسی") ---
  // Scalloped crimson & gold valance under signboard
  for (let sx = -66; sx <= 54; sx += 20) {
    ctx.fillStyle = (sx / 20) % 2 === 0 ? '#E11D48' : '#FBBF24';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx + 10, -124, 10, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  const signGrad = ctx.createLinearGradient(-70, -154, 70, -124);
  signGrad.addColorStop(0, '#FDE047');
  signGrad.addColorStop(0.5, '#F59E0B');
  signGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = signGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-70, -152, 140, 29, 9);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(-64, -147.5, 128, 20, 6);
  ctx.fill();

  ctx.fillStyle = '#FDE047';
  ctx.font = '900 12.5px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('غرفه طلاسی', 0, -133);

  // Minimal Floating Action / Status Badge above Canopy
  if (isPlayerNear && !booth.claimed) {
    const pulse = Math.sin(timeSec * 6) * 2;
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-66, -184 + pulse, 132, 24, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('کلید E: گفت‌وگو', 0, -168 + pulse);
  } else if (booth.claimed) {
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-48, -182, 96, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.font = '800 10.5px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('دریافت شد', 0, -167);
  }

  ctx.restore();
}

/**
 * Renders Booth 2: "غرفه سورملینا" (Surmelina Luxury Perfumery & Body Cologne Pavilion)
 * Features rose-velvet drapes, illuminated perfumery shelves, crystal flacons, and fragrance mist.
 */
function drawSurmelinaBooth(
  ctx: CanvasRenderingContext2D,
  booth: SurmelinaBooth,
  timeSec: number,
  isPlayerNear: boolean
): void {
  ctx.save();
  ctx.translate(booth.x, booth.y);

  // Soft rose-gold & magenta ambient fragrance aura
  const glowR = isPlayerNear ? 128 : 96;
  const boothGlow = ctx.createRadialGradient(0, -70, 12, 0, -70, glowR);
  boothGlow.addColorStop(0, isPlayerNear ? 'rgba(244, 114, 182, 0.5)' : 'rgba(244, 114, 182, 0.25)');
  boothGlow.addColorStop(0.6, 'rgba(192, 132, 252, 0.12)');
  boothGlow.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.fillStyle = boothGlow;
  ctx.beginPath();
  ctx.arc(0, -70, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Back perfumery wall with rich plum-rose gradient
  const wallGrad = ctx.createLinearGradient(0, -135, 0, 0);
  wallGrad.addColorStop(0, '#2E102F');
  wallGrad.addColorStop(0.5, '#4A154B');
  wallGrad.addColorStop(1, '#240B26');
  ctx.fillStyle = wallGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-70, -132, 140, 132, [12, 12, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Illuminated arched perfumery alcove behind advisor
  const alcoveGrad = ctx.createRadialGradient(0, -85, 6, 0, -85, 50);
  alcoveGrad.addColorStop(0, 'rgba(251, 207, 232, 0.32)');
  alcoveGrad.addColorStop(1, 'rgba(74, 21, 75, 0)');
  ctx.fillStyle = alcoveGrad;
  ctx.beginPath();
  ctx.arc(0, -85, 48, Math.PI, 0);
  ctx.lineTo(48, -54);
  ctx.lineTo(-48, -54);
  ctx.closePath();
  ctx.fill();

  // Left & Right pearl-pink & gold columns
  const colGradL = ctx.createLinearGradient(-72, 0, -61, 0);
  colGradL.addColorStop(0, '#BE185D');
  colGradL.addColorStop(0.5, '#F9A8D4');
  colGradL.addColorStop(1, '#9D174D');
  ctx.fillStyle = colGradL;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.fillRect(-72, -128, 11, 128);
  ctx.strokeRect(-72, -128, 11, 128);

  const colGradR = ctx.createLinearGradient(61, 0, 72, 0);
  colGradR.addColorStop(0, '#BE185D');
  colGradR.addColorStop(0.5, '#F9A8D4');
  colGradR.addColorStop(1, '#9D174D');
  ctx.fillStyle = colGradR;
  ctx.fillRect(61, -128, 11, 128);
  ctx.strokeRect(61, -128, 11, 128);

  // --- FRAGRANCE ADVISOR CHARACTER (پریسا) ---
  const bobY = Math.sin(timeSec * 3.2 + 1) * 1.8;
  ctx.save();
  ctx.translate(0, -56 + bobY);

  // Silk headscarf
  const scarfGrad = ctx.createLinearGradient(0, -52, 0, -4);
  scarfGrad.addColorStop(0, '#9D174D');
  scarfGrad.addColorStop(1, '#500724');
  ctx.fillStyle = scarfGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -34, 16, Math.PI, 0);
  ctx.lineTo(18, -4);
  ctx.lineTo(-18, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rose velvet attire
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.roundRect(-16, -24, 32, 26, 7);
  ctx.fill();
  ctx.stroke();

  // Waving hand
  ctx.save();
  ctx.translate(15, -15);
  ctx.rotate(0.4 + Math.sin(timeSec * 5.2) * 0.22);
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.roundRect(0, -4, 13, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFE4C8';
  ctx.beginPath();
  ctx.arc(14, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Head
  ctx.fillStyle = '#FFE4C8';
  ctx.beginPath();
  ctx.arc(0, -37, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Golden headband trim
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -38, 12.5, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();

  // Sparkling eyes & warm smile
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-4.2, -38, 1.8, 0, Math.PI * 2);
  ctx.arc(4.2, -38, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-4.7, -38.6, 0.65, 0, Math.PI * 2);
  ctx.arc(3.7, -38.6, 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9F1239';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -34, 4, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();

  // --- VANITY COUNTER & ROSE-GOLD BANNER ---
  const counterGrad = ctx.createLinearGradient(0, -56, 0, 0);
  counterGrad.addColorStop(0, '#500724');
  counterGrad.addColorStop(1, '#2E102F');
  ctx.fillStyle = counterGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-66, -54, 132, 54, 4);
  ctx.fill();
  ctx.stroke();

  const bannerGrad = ctx.createLinearGradient(0, -46, 0, -14);
  bannerGrad.addColorStop(0, '#9D174D');
  bannerGrad.addColorStop(1, '#701A75');
  ctx.fillStyle = bannerGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-55, -45, 110, 32, [4, 4, 10, 10]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FCE7F3';
  ctx.font = '800 10.5px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('بادی‌کلن و عطر', 0, -25);

  // Pearl-pink tabletop surface
  const topGrad = ctx.createLinearGradient(-70, -60, 70, -52);
  topGrad.addColorStop(0, '#F472B6');
  topGrad.addColorStop(0.5, '#FBCFE8');
  topGrad.addColorStop(1, '#EC4899');
  ctx.fillStyle = topGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-70, -60, 140, 8, 3);
  ctx.fill();
  ctx.stroke();

  // --- FACETED CRYSTAL BODY COLOGNE FLACONS ---
  const drawBodyCologneBottle = (bx: number, by: number, c1: string, c2: string, height = 22) => {
    const flaconGrad = ctx.createLinearGradient(bx - 7, by - height, bx + 7, by);
    flaconGrad.addColorStop(0, c1);
    flaconGrad.addColorStop(1, c2);
    ctx.fillStyle = flaconGrad;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx - 7, by - height, 14, height, [5, 5, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Specular glass reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(bx - 4.5, by - height + 3, 2.2, height - 6);

    // Golden emblem label
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(bx - 4.5, by - height * 0.58, 9, 4.5);

    // Golden atomizer neck & crystal cap
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.2;
    ctx.fillRect(bx - 3, by - height - 5, 6, 5);
    ctx.strokeRect(bx - 3, by - height - 5, 6, 5);
  };

  drawBodyCologneBottle(-48, -60, '#F472B6', '#BE185D', 22);
  drawBodyCologneBottle(-31, -60, '#C084FC', '#7E22CE', 26);
  drawBodyCologneBottle(-14, -60, '#FB7185', '#BE123C', 20);

  // Center luxury gift box & signature bottle
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-2, -76, 18, 16, 3);
  ctx.fill();
  ctx.stroke();
  drawBodyCologneBottle(7, -76, '#F43F5E', '#881337', 18);

  drawBodyCologneBottle(25, -60, '#38BDF8', '#0369A1', 24);
  drawBodyCologneBottle(42, -60, '#F9A8D4', '#DB2777', 21);
  drawBodyCologneBottle(56, -60, '#FDE047', '#D97706', 18);

  // Shimmering fragrance sparkles
  drawSparkleStar(ctx, -32, -94, 3.8 + Math.sin(timeSec * 4.5) * 1.5, '#FCE7F3');
  drawSparkleStar(ctx, 8, -100, 4.2 + Math.cos(timeSec * 5) * 1.5, '#FDE047');
  drawSparkleStar(ctx, 40, -92, 3.5 + Math.sin(timeSec * 4 + 2) * 1.4, '#FCE7F3');

  // --- SCALLOPED ROSE-GOLD AWNING & SIGNBOARD ("غرفه سورملینا") ---
  for (let sx = -66; sx <= 54; sx += 20) {
    ctx.fillStyle = (sx / 20) % 2 === 0 ? '#DB2777' : '#F9A8D4';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx + 10, -124, 10, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  const signGrad = ctx.createLinearGradient(-70, -152, 70, -124);
  signGrad.addColorStop(0, '#9D174D');
  signGrad.addColorStop(0.5, '#BE185D');
  signGrad.addColorStop(1, '#831843');
  ctx.fillStyle = signGrad;
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-70, -152, 140, 29, 9);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFBEB';
  ctx.font = '900 12.5px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('غرفه سورملینا', 0, -133);

  // Minimal Floating Action / Status Badge above Canopy
  if (isPlayerNear && !booth.claimed) {
    const pulse = Math.sin(timeSec * 6) * 2;
    ctx.fillStyle = '#F472B6';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-66, -184 + pulse, 132, 24, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('کلید E: گفت‌وگو', 0, -168 + pulse);
  } else if (booth.claimed) {
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-48, -182, 96, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.font = '800 10.5px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('دریافت شد', 0, -167);
  }

  ctx.restore();
}

/**
 * Renders Booth 3: "غرفه فال حافظ" (Hafez Fortune-Telling Pavilion)
 * Features Shiraz turquoise mosaic columns, Yazdi Termeh tablecloth, flickering brass candlestick,
 * wise Hafez reciter, and the upright leather-bound Divan-e Hafez showing its vertical page strips.
 */
export function drawHafezBooth(
  ctx: CanvasRenderingContext2D,
  boothX: number,
  boothY: number,
  claimed: boolean,
  points: number,
  timeSec: number,
  isPlayerNear: boolean
): void {
  ctx.save();
  ctx.translate(boothX, boothY);

  // Poetic crimson-gold & turquoise ambient halo
  const glowR = isPlayerNear ? 130 : 96;
  const boothGlow = ctx.createRadialGradient(0, -70, 12, 0, -70, glowR);
  boothGlow.addColorStop(
    0,
    isPlayerNear ? 'rgba(225, 29, 72, 0.48)' : 'rgba(159, 18, 57, 0.25)'
  );
  boothGlow.addColorStop(0.6, 'rgba(16, 185, 129, 0.12)');
  boothGlow.addColorStop(1, 'rgba(159, 18, 57, 0)');
  ctx.fillStyle = boothGlow;
  ctx.beginPath();
  ctx.arc(0, -70, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Back booth wall with deep walnut-crimson gradient
  const wallGrad = ctx.createLinearGradient(0, -135, 0, 0);
  wallGrad.addColorStop(0, '#1F0910');
  wallGrad.addColorStop(0.5, '#3B0D1E');
  wallGrad.addColorStop(1, '#1A070D');
  ctx.fillStyle = wallGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-70, -132, 140, 132, [12, 12, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Illuminated turquoise Persian arch niche behind the reciter
  const archGrad = ctx.createRadialGradient(0, -84, 5, 0, -84, 50);
  archGrad.addColorStop(0, 'rgba(45, 212, 191, 0.25)');
  archGrad.addColorStop(1, 'rgba(59, 13, 30, 0)');
  ctx.fillStyle = archGrad;
  ctx.beginPath();
  ctx.arc(0, -84, 48, Math.PI, 0);
  ctx.lineTo(48, -52);
  ctx.lineTo(-48, -52);
  ctx.closePath();
  ctx.fill();

  // Left & Right Shiraz turquoise tile columns
  const colGradL = ctx.createLinearGradient(-72, 0, -61, 0);
  colGradL.addColorStop(0, '#047857');
  colGradL.addColorStop(0.5, '#34D399');
  colGradL.addColorStop(1, '#065F46');
  ctx.fillStyle = colGradL;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.fillRect(-72, -128, 11, 128);
  ctx.strokeRect(-72, -128, 11, 128);

  const colGradR = ctx.createLinearGradient(61, 0, 72, 0);
  colGradR.addColorStop(0, '#047857');
  colGradR.addColorStop(0.5, '#34D399');
  colGradR.addColorStop(1, '#065F46');
  ctx.fillStyle = colGradR;
  ctx.fillRect(61, -128, 11, 128);
  ctx.strokeRect(61, -128, 11, 128);

  // --- SEATED HAFEZ RECITER (مرشد فال حافظ) ---
  const bobY = Math.sin(timeSec * 2.8 + 2) * 1.6;
  ctx.save();
  ctx.translate(-14, -56 + bobY);

  // Turquoise robe with gold shawl collar
  const robeGrad = ctx.createLinearGradient(-16, -24, 16, 4);
  robeGrad.addColorStop(0, '#0D9488');
  robeGrad.addColorStop(1, '#065F46');
  ctx.fillStyle = robeGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-16, -24, 32, 26, 7);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#FFE4C8';
  ctx.beginPath();
  ctx.arc(0, -37, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wise silver-cream beard
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(0, -33, 9.5, 0.08, Math.PI - 0.08);
  ctx.fill();

  // Kind eyes
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-4, -38.5, 1.7, 0, Math.PI * 2);
  ctx.arc(4, -38.5, 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Traditional crimson & gold turban
  const turbanGrad = ctx.createLinearGradient(-14, -52, 14, -40);
  turbanGrad.addColorStop(0, '#9F1239');
  turbanGrad.addColorStop(1, '#4C0519');
  ctx.fillStyle = turbanGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-14, -52, 28, 12, [8, 8, 3, 3]);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- CARVED WALNUT COUNTER WITH YAZDI TERMEH CLOTH ---
  const woodGrad = ctx.createLinearGradient(0, -54, 0, 0);
  woodGrad.addColorStop(0, '#5C2D16');
  woodGrad.addColorStop(1, '#36180B');
  ctx.fillStyle = woodGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-66, -54, 132, 54, 4);
  ctx.fill();
  ctx.stroke();

  // Crimson & Turquoise Yazdi Termeh front cloth
  const termehGrad = ctx.createLinearGradient(-56, -45, 56, -13);
  termehGrad.addColorStop(0, '#881337');
  termehGrad.addColorStop(0.5, '#9F1239');
  termehGrad.addColorStop(1, '#4C0519');
  ctx.fillStyle = termehGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-55, -45, 110, 32, [4, 4, 10, 10]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 10.5px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('دیوان حافظ (+۲۰)', 0, -25);

  // Golden tabletop
  ctx.fillStyle = '#D97706';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-70, -60, 140, 8, 3);
  ctx.fill();
  ctx.stroke();

  // --- UPRIGHT DIVAN-E HAFEZ BOOK FORE-EDGE ON THE TABLE ---
  ctx.save();
  ctx.translate(18, -60);

  // Magical golden glow behind the Divan-e Hafez book
  const bookGlow = ctx.createRadialGradient(0, -20, 2, 0, -20, 28);
  bookGlow.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
  bookGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = bookGlow;
  ctx.beginPath();
  ctx.arc(0, -20, 28, 0, Math.PI * 2);
  ctx.fill();

  // Crimson leather cover border
  ctx.fillStyle = '#7F1D1D';
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-16, -39, 32, 39, 3.5);
  ctx.fill();
  ctx.stroke();

  // Vertical paper page strips inside the crimson cover
  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(-12, -35, 24, 31);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.9;
  for (let px = -9; px <= 9; px += 3) {
    ctx.beginPath();
    ctx.moveTo(px, -35);
    ctx.lineTo(px, -4);
    ctx.stroke();
  }
  ctx.restore();

  // Flickering brass candlestick & pomegranates on left side of table
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.3;
  ctx.fillRect(-46, -74, 4, 14);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-44, -77, 2, 3.5 + Math.sin(timeSec * 12) * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.arc(-32, -65, 6.5, 0, Math.PI * 2);
  ctx.arc(-21, -64.5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- SCALLOPED CANOPY & SIGNBOARD ("غرفه فال حافظ") ---
  for (let sx = -66; sx <= 54; sx += 20) {
    ctx.fillStyle = (sx / 20) % 2 === 0 ? '#0D9488' : '#9F1239';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sx + 10, -124, 10, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  const signGrad = ctx.createLinearGradient(-70, -152, 70, -124);
  signGrad.addColorStop(0, '#7F1D1D');
  signGrad.addColorStop(0.5, '#991B1B');
  signGrad.addColorStop(1, '#450A0A');
  ctx.fillStyle = signGrad;
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-70, -152, 140, 29, 9);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.font = '900 12.5px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('غرفه فال حافظ', 0, -133);

  // Minimal Floating Action / Status Badge above Canopy
  if (isPlayerNear) {
    const pulse = Math.sin(timeSec * 6) * 2;
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-78, -184 + pulse, 156, 24, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      claimed ? 'کلید E: تفأل دوباره' : 'کلید E: تفأل (+۲۰)',
      0,
      -168 + pulse
    );
  } else if (claimed) {
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-52, -182, 104, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.font = '800 10.5px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`فال (+${points})`, 0, -167);
  }

  ctx.restore();
}

/**
 * Grand Persian Caravanserai Iwan Portal ("بازارچه") on the main path at x=1620.
 * Features fluted turquoise dome with golden finial, mosaic tile spandrels,
 * warm glowing archway, hanging brass lamp, and twin flaming braziers.
 */
function drawBazaarEntranceGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeSec: number,
  isPlayerNear: boolean
): void {
  ctx.save();
  ctx.translate(x, y);

  // Warm welcoming golden interior glow
  const glowR = isPlayerNear ? 148 : 112;
  const gateGlow = ctx.createRadialGradient(0, -78, 12, 0, -78, glowR);
  gateGlow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
  gateGlow.addColorStop(0.55, 'rgba(225, 29, 72, 0.22)');
  gateGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = gateGlow;
  ctx.beginPath();
  ctx.arc(0, -78, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Fluted Turquoise Persian Dome on top with golden finial
  const domeGrad = ctx.createRadialGradient(-12, -168, 6, 0, -152, 54);
  domeGrad.addColorStop(0, '#5EEAD4');
  domeGrad.addColorStop(0.5, '#0D9488');
  domeGrad.addColorStop(1, '#115E59');
  ctx.fillStyle = domeGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, -148, 50, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dome ribs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.2;
  for (let dr = -30; dr <= 30; dr += 15) {
    ctx.beginPath();
    ctx.moveTo(0, -198);
    ctx.quadraticCurveTo(dr, -172, dr * 1.3, -148);
    ctx.stroke();
  }

  // Golden Finial (الم طلایی) on top of dome
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(0, -203, 3.5, 0, Math.PI * 2);
  ctx.arc(0, -210, 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer Lapis-Lazuli & Turquoise Mosaic Iwan Frame
  const frameGrad = ctx.createLinearGradient(-74, -150, 74, 0);
  frameGrad.addColorStop(0, '#1E3A8A');
  frameGrad.addColorStop(0.5, '#172554');
  frameGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = frameGrad;
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.roundRect(-72, -150, 144, 150, [10, 10, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Decorative turquoise tile border inlay
  ctx.strokeStyle = '#2DD4BF';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-65, -142, 130, 136);

  // Warm illuminated arched doorway inside
  const innerGrad = ctx.createLinearGradient(0, -118, 0, 0);
  innerGrad.addColorStop(0, '#FEF08A');
  innerGrad.addColorStop(0.35, '#F59E0B');
  innerGrad.addColorStop(0.75, '#B45309');
  innerGrad.addColorStop(1, '#451A03');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.lineTo(-44, -76);
  ctx.quadraticCurveTo(-44, -116, 0, -120);
  ctx.quadraticCurveTo(44, -116, 44, -76);
  ctx.lineTo(44, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Hanging brass mosque lamp inside the archway
  const swing = Math.sin(timeSec * 3) * 2.5;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -118);
  ctx.lineTo(swing, -90);
  ctx.stroke();
  ctx.fillStyle = '#FFFBEB';
  ctx.beginPath();
  ctx.arc(swing, -86, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin welcoming brass braziers flanking the portal base
  for (const bx of [-58, 58]) {
    ctx.fillStyle = '#B45309';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.4;
    ctx.fillRect(bx - 4, -22, 8, 22);
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(bx, -25, 4.5 + Math.sin(timeSec * 10 + bx) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Header Calligraphy Plaque ("بازارچه" only)
  const signGrad = ctx.createLinearGradient(-58, -154, 58, -124);
  signGrad.addColorStop(0, '#BE123C');
  signGrad.addColorStop(0.5, '#9F1239');
  signGrad.addColorStop(1, '#881337');
  ctx.fillStyle = signGrad;
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-58, -154, 116, 29, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFBEB';
  ctx.font = '900 14px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('بازارچه', 0, -134);

  // Floating Action Prompt above Dome ONLY when player is near
  if (isPlayerNear) {
    const pulse = Math.sin(timeSec * 6) * 2;
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-72, -218 + pulse, 144, 25, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11.5px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('کلید E: ورود به بازارچه', 0, -201 + pulse);
  }

  ctx.restore();
}

/**
 * Renders the cozy, atmospheric indoor Persian Caravanserai Bazaar scene
 * with brick rib-vault arches, chandeliers, woven Persian runner carpets, and the 3 booths.
 */
export function drawBazaarInteriorScene(
  ctx: CanvasRenderingContext2D,
  options: {
    viewWidth: number;
    viewHeight: number;
    worldOffsetY?: number;
    cameraX: number;
    timeSec: number;
    talaseeBooth: TalaseeBooth;
    surmelinaBooth: SurmelinaBooth;
    hafezBooth: HafezBooth;
    bazaarExitX: number;
    playerX: number;
    playerY: number;
  }
): void {
  const {
    viewWidth,
    viewHeight,
    worldOffsetY = 0,
    cameraX,
    timeSec,
    talaseeBooth,
    surmelinaBooth,
    hafezBooth,
    bazaarExitX,
    playerX,
  } = options;

  // Rich warm caravanserai interior backdrop gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
  bgGrad.addColorStop(0, '#12091A');
  bgGrad.addColorStop(0.5, '#231123');
  bgGrad.addColorStop(1, '#381B2C');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  ctx.save();
  ctx.translate(-cameraX, worldOffsetY);

  const visLeft = cameraX - 180;
  const visRight = cameraX + viewWidth + 180;

  // Vaulted Caravanserai Brick Arches & Chandeliers across the Bazaar (0 .. 1450)
  for (let ax = 40; ax <= 1360; ax += 260) {
    if (ax + 200 < visLeft || ax > visRight) continue;
    const archGrad = ctx.createLinearGradient(ax, 55, ax, GROUND_Y);
    archGrad.addColorStop(0, 'rgba(49, 23, 47, 0.85)');
    archGrad.addColorStop(1, 'rgba(30, 14, 32, 0.85)');
    ctx.fillStyle = archGrad;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(ax, GROUND_Y);
    ctx.lineTo(ax, 125);
    ctx.quadraticCurveTo(ax + 100, 48, ax + 200, 125);
    ctx.lineTo(ax + 200, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hanging brass chandelier with warm volumetric light cone
    const lSwing = Math.sin(timeSec * 2.2 + ax * 0.01) * 2.5;
    const lx = ax + 100 + lSwing;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ax + 100, 72);
    ctx.lineTo(lx, 118);
    ctx.stroke();

    const lampGlow = ctx.createRadialGradient(lx, 124, 3, lx, 124, 52);
    lampGlow.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
    lampGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
    lampGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(lx, 124, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(lx, 124, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Polished stone bazaar floor with woven Persian runner carpet
  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 220);
  floorGrad.addColorStop(0, '#3D1A2A');
  floorGrad.addColorStop(0.3, '#2A101D');
  floorGrad.addColorStop(1, '#160810');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(cameraX - 40, GROUND_Y, viewWidth + 80, 260);

  // Golden border strip along the floor edge
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(cameraX - 40, GROUND_Y, viewWidth + 80, 5);

  // Woven crimson & turquoise Persian carpet tiles along the walkway
  for (let tx = -40; tx < 1480; tx += 64) {
    if (tx + 50 < visLeft || tx > visRight) continue;
    ctx.fillStyle = (tx / 64) % 2 === 0 ? 'rgba(13, 148, 136, 0.45)' : 'rgba(190, 18, 60, 0.45)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, GROUND_Y + 12, 46, 12, 3);
    ctx.fill();
    ctx.stroke();
  }

  // --- BOOTH 1: TALASEE GOLD BOOTH (x=340) ---
  if (talaseeBooth.x >= visLeft && talaseeBooth.x <= visRight) {
    const nearTalasee = Math.abs(playerX - talaseeBooth.x) < 125;
    drawTalaseeBooth(ctx, talaseeBooth, timeSec, nearTalasee);
  }

  // --- BOOTH 2: SURMELINA BODY COLOGNE BOOTH (x=650) ---
  if (surmelinaBooth.x >= visLeft && surmelinaBooth.x <= visRight) {
    const nearSurmelina = Math.abs(playerX - surmelinaBooth.x) < 125;
    drawSurmelinaBooth(ctx, surmelinaBooth, timeSec, nearSurmelina);
  }

  // --- BOOTH 3: HAFEZ FAL BOOTH (x=950) ---
  if (hafezBooth.x >= visLeft && hafezBooth.x <= visRight) {
    const nearHafez = Math.abs(playerX - hafezBooth.x) < 125;
    drawHafezBooth(
      ctx,
      hafezBooth.x,
      hafezBooth.y,
      hafezBooth.claimed,
      hafezBooth.points,
      timeSec,
      nearHafez
    );
  }

  // --- RIGHT EXIT PORTAL TO CONTINUE MAIN GAME (x=1200) ---
  if (bazaarExitX >= visLeft && bazaarExitX <= visRight) {
    const nearExit = Math.abs(playerX - bazaarExitX) < 110;
    ctx.save();
    ctx.translate(bazaarExitX, GROUND_Y);

    const exitGlow = ctx.createRadialGradient(0, -70, 10, 0, -70, 96);
    exitGlow.addColorStop(0, nearExit ? 'rgba(52, 211, 153, 0.55)' : 'rgba(56, 189, 248, 0.3)');
    exitGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = exitGlow;
    ctx.beginPath();
    ctx.arc(0, -70, 96, 0, Math.PI * 2);
    ctx.fill();

    const exitFrameGrad = ctx.createLinearGradient(-52, -138, 52, 0);
    exitFrameGrad.addColorStop(0, '#0D9488');
    exitFrameGrad.addColorStop(1, '#065F46');
    ctx.fillStyle = exitFrameGrad;
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-52, -138, 104, 138, [12, 12, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Starry night sky glimpse inside exit doorway
    const doorSky = ctx.createLinearGradient(0, -112, 0, 0);
    doorSky.addColorStop(0, '#091326');
    doorSky.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = doorSky;
    ctx.beginPath();
    ctx.roundRect(-38, -112, 76, 112, [8, 8, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#FFFBEB';
    ctx.font = '800 11.5px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('خروج از بازارچه', 0, -64);
    ctx.fillStyle = '#FDE047';
    ctx.font = '900 10.5px Vazirmatn, sans-serif';
    ctx.fillText('ادامه مسیر', 0, -44);

    if (nearExit) {
      const pulse = Math.sin(timeSec * 6) * 2;
      ctx.fillStyle = '#34D399';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-68, -172 + pulse, 136, 24, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 11px Vazirmatn, sans-serif';
      ctx.fillText('کلید E: خروج', 0, -156 + pulse);
    }

    ctx.restore();
  }
  ctx.restore();
}

export function drawWorldScene(
  ctx: CanvasRenderingContext2D,
  options: {
    viewWidth: number;
    viewHeight: number;
    worldOffsetY?: number;
    cameraX: number;
    timeSec: number;
    collectibles: CollectibleItem[];
    lanterns: LanternItem[];
    challenges: ChallengeDefinition[];
    platforms: PlatformRect[];
    obstacles: ObstacleRect[];
    gaps: GapZone[];
    bazaarEntranceX: number;
    talaseeBooth: TalaseeBooth;
    surmelinaBooth: SurmelinaBooth;
    hafezBooth: HafezBooth;
    finishX: number;
    gateLeverPulled: boolean;
    playerX: number;
    playerY: number;
  }
): void {
  const {
    viewWidth,
    viewHeight,
    worldOffsetY = 0,
    cameraX,
    timeSec,
    collectibles,
    lanterns,
    challenges,
    platforms,
    obstacles,
    gaps,
    bazaarEntranceX,
    hafezBooth,
    finishX,
    gateLeverPulled,
    playerX,
    playerY,
  } = options;

  const visLeft = cameraX - 180;
  const visRight = cameraX + viewWidth + 180;

  // Rich multi-stop Yalda Night Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
  const festivalBlend = Math.max(0, Math.min(1, (cameraX - 1800) / 1000));
  skyGrad.addColorStop(0, '#070E1E');
  skyGrad.addColorStop(0.45, festivalBlend > 0.3 ? '#1A1B3A' : '#0F1E3A');
  skyGrad.addColorStop(0.8, festivalBlend > 0.3 ? '#2B1F42' : '#172E54');
  skyGrad.addColorStop(1, festivalBlend > 0.3 ? '#3B2247' : '#1E3A68');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  // --- PARALLAX LAYER 0: Luminous Full Moon & Sparkling Starlight ---
  ctx.save();
  const moonX = viewWidth * 0.78 - cameraX * 0.03;
  const moonY = Math.min(118, 78 + worldOffsetY * 0.18);

  // Outer atmospheric halo
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 14, moonX, moonY, 84);
  moonGlow.addColorStop(0, 'rgba(254, 243, 199, 0.5)');
  moonGlow.addColorStop(0.45, 'rgba(186, 230, 253, 0.16)');
  moonGlow.addColorStop(1, 'rgba(254, 243, 199, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 84, 0, Math.PI * 2);
  ctx.fill();

  // Moon disc with warm ivory gradient
  const moonDisc = ctx.createRadialGradient(moonX - 6, moonY - 6, 4, moonX, moonY, 24);
  moonDisc.addColorStop(0, '#FFFFFF');
  moonDisc.addColorStop(0.7, '#FEF3C7');
  moonDisc.addColorStop(1, '#FDE68A');
  ctx.fillStyle = moonDisc;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
  ctx.fill();

  // Subtle moon craters
  ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
  ctx.beginPath();
  ctx.arc(moonX + 6, moonY - 5, 4.5, 0, Math.PI * 2);
  ctx.arc(moonX - 5, moonY + 7, 3.2, 0, Math.PI * 2);
  ctx.arc(moonX + 8, moonY + 6, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Twinkling stars & 4-point star flares
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 137) % (viewWidth + 160)) - ((cameraX * 0.04) % 160);
    const sy = 28 + ((i * 61) % Math.max(140, Math.round(160 + worldOffsetY * 0.45)));
    const twinkle = 0.35 + 0.6 * Math.abs(Math.sin(timeSec * 1.8 + i));
    if (i % 5 === 0) {
      drawSparkleStar(ctx, sx, sy, 3.2 * twinkle + 1, `rgba(254, 249, 195, ${twinkle.toFixed(2)})`);
    } else {
      ctx.fillStyle = `rgba(248, 250, 252, ${twinkle.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 === 0 ? 1.7 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Apply vertical world offset so GROUND_Y sits comfortably above bottom mobile controls
  ctx.save();
  ctx.translate(0, worldOffsetY);

  // --- PARALLAX LAYER 1: Moonlit Snow-Capped Alborz Mountains (0.2x scroll) ---
  ctx.save();
  const mtnGrad = ctx.createLinearGradient(0, GROUND_Y - 175, 0, GROUND_Y);
  mtnGrad.addColorStop(0, '#25426E');
  mtnGrad.addColorStop(0.35, '#193154');
  mtnGrad.addColorStop(1, '#10203B');
  ctx.fillStyle = mtnGrad;
  ctx.beginPath();
  ctx.moveTo(-100, GROUND_Y);
  for (let x = -100; x <= viewWidth + 200; x += 140) {
    const worldSample = x + cameraX * 0.2;
    const peakH = 122 + Math.sin(worldSample * 0.006) * 38 + Math.cos(worldSample * 0.012) * 22;
    ctx.lineTo(x, GROUND_Y - peakH);
  }
  ctx.lineTo(viewWidth + 200, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Moonlit ridge rim-highlight along mountain peaks
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -100; x <= viewWidth + 200; x += 140) {
    const worldSample = x + cameraX * 0.2;
    const peakH = 122 + Math.sin(worldSample * 0.006) * 38 + Math.cos(worldSample * 0.012) * 22;
    if (x === -100) ctx.moveTo(x, GROUND_Y - peakH);
    else ctx.lineTo(x, GROUND_Y - peakH);
  }
  ctx.stroke();
  ctx.restore();

  // --- PARALLAX LAYER 2: Historic Iranian Village Silhouettes with Domes & Glowing Orosi Windows (0.42x scroll) ---
  ctx.save();
  const houseSpan = 220;
  const startHouseIdx = Math.floor((cameraX * 0.42) / houseSpan) - 1;
  const endHouseIdx = startHouseIdx + Math.ceil(viewWidth / houseSpan) + 3;
  for (let idx = startHouseIdx; idx <= endHouseIdx; idx++) {
    const hx = idx * houseSpan - cameraX * 0.42;
    const hHeight = 84 + ((Math.abs(idx) * 23) % 38);
    const hy = GROUND_Y - hHeight;

    const hGrad = ctx.createLinearGradient(hx, hy, hx, GROUND_Y);
    hGrad.addColorStop(0, idx % 2 === 0 ? 'rgba(28, 52, 88, 0.82)' : 'rgba(22, 42, 74, 0.82)');
    hGrad.addColorStop(1, 'rgba(14, 27, 50, 0.9)');
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.roundRect(hx + 12, hy, houseSpan - 24, hHeight, [4, 4, 0, 0]);
    ctx.fill();

    // Traditional curved dome on every 3rd building
    if (Math.abs(idx) % 3 === 1) {
      ctx.beginPath();
      ctx.arc(hx + houseSpan * 0.5, hy, 30, Math.PI, 0);
      ctx.fill();
    }

    // Soft snow pillow on roof edge
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.beginPath();
    ctx.roundRect(hx + 10, hy - 2.5, houseSpan - 20, 4.5, 2);
    ctx.fill();

    // Warm arched Orosi window glow
    const winX = hx + houseSpan * 0.5 - 9;
    const winY = hy + 24;
    const winGlow = ctx.createRadialGradient(winX + 9, winY + 12, 2, winX + 9, winY + 12, 22);
    winGlow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    winGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = winGlow;
    ctx.beginPath();
    ctx.arc(winX + 9, winY + 12, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
    ctx.beginPath();
    ctx.roundRect(winX, winY, 18, 24, [9, 9, 2, 2]);
    ctx.fill();
  }
  ctx.restore();

  // --- WORLD SPACE FOREGROUND LAYER (1.0x scroll) ---
  ctx.save();
  ctx.translate(-cameraX, 0);

  // Layered Snowy Cypress Trees (سروهای برفی ایرانی)
  const treePositions = [150, 520, 1020, 1340, 2320, 2680];
  for (const tx of treePositions) {
    if (tx < visLeft || tx > visRight) continue;
    // Trunk
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(tx - 3.5, GROUND_Y - 18, 7, 18);

    // 3 tiered foliage cones with emerald-pine gradient
    const treeGrad = ctx.createLinearGradient(tx - 24, GROUND_Y - 118, tx + 24, GROUND_Y - 12);
    treeGrad.addColorStop(0, '#10B981');
    treeGrad.addColorStop(0.5, '#047857');
    treeGrad.addColorStop(1, '#064E3B');
    ctx.fillStyle = treeGrad;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y - 118);
    ctx.quadraticCurveTo(tx + 28, GROUND_Y - 56, tx + 20, GROUND_Y - 12);
    ctx.lineTo(tx - 20, GROUND_Y - 12);
    ctx.quadraticCurveTo(tx - 28, GROUND_Y - 56, tx, GROUND_Y - 118);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Soft snow puffs resting on cypress branches
    ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
    ctx.beginPath();
    ctx.ellipse(tx - 6, GROUND_Y - 82, 10, 3.8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(tx + 7, GROUND_Y - 52, 12, 4.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delicate warm festival fairy lights near the final celebration zone (2360 -> 2980)
  for (let bx = 2360; bx < 2980; bx += 200) {
    if (bx + 200 < visLeft || bx > visRight) continue;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, 185);
    ctx.quadraticCurveTo(bx + 100, 210, bx + 200, 185);
    ctx.stroke();

    for (let f = 1; f <= 3; f++) {
      const fx = bx + f * 50;
      const fy = 185 + Math.sin((f / 4) * Math.PI) * 14;
      const bGlow = ctx.createRadialGradient(fx, fy, 1, fx, fy, 10);
      bGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      bGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = bGlow;
      ctx.beginPath();
      ctx.arc(fx, fy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(fx, fy, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- GROUND COBBLESTONE & FLUFFY SNOW LAYER (with Icy Stream Cutout) ---
  const drawGroundSegment = (startX: number, endX: number) => {
    const clampedStart = Math.max(startX, visLeft);
    const clampedEnd = Math.min(endX, visRight);
    const segW = clampedEnd - clampedStart;
    if (segW <= 0) return;

    // Deep earth & stone foundation gradient
    const earthGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 180);
    earthGrad.addColorStop(0, '#1E293B');
    earthGrad.addColorStop(0.35, '#0F172A');
    earthGrad.addColorStop(1, '#090D16');
    ctx.fillStyle = earthGrad;
    ctx.fillRect(clampedStart, GROUND_Y, segW, viewHeight);

    // Fluffy snow blanket on top of ground
    const snowGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 12);
    snowGrad.addColorStop(0, '#F0F9FF');
    snowGrad.addColorStop(0.6, '#BAE6FD');
    snowGrad.addColorStop(1, '#7DD3FC');
    ctx.fillStyle = snowGrad;
    ctx.fillRect(clampedStart, GROUND_Y, segW, 10);

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(clampedStart, GROUND_Y);
    ctx.lineTo(clampedEnd, GROUND_Y);
    ctx.stroke();

    // Shaded cobblestone bricks
    const firstCobble = startX + 14 + Math.max(0, Math.floor((clampedStart - startX) / 52) * 52);
    for (let cx = firstCobble; cx < clampedEnd && cx < endX - 28; cx += 52) {
      const stoneGrad = ctx.createLinearGradient(cx, GROUND_Y + 15, cx, GROUND_Y + 28);
      stoneGrad.addColorStop(0, '#334155');
      stoneGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = stoneGrad;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(cx, GROUND_Y + 15, 36, 12, 4);
      ctx.fill();
      ctx.stroke();
    }
  };

  let cursorX = -200;
  for (const gap of gaps) {
    drawGroundSegment(cursorX, gap.startX);
    if (gap.endX >= visLeft && gap.startX <= visRight) {
      // Shimmering frozen water stream inside the gap
      ctx.fillStyle = '#091326';
      ctx.fillRect(gap.startX, GROUND_Y + 6, gap.endX - gap.startX, 220);
      const waterGrad = ctx.createLinearGradient(0, GROUND_Y + 22, 0, GROUND_Y + 120);
      waterGrad.addColorStop(0, '#38BDF8');
      waterGrad.addColorStop(0.3, '#0284C7');
      waterGrad.addColorStop(1, '#0C4A6E');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(gap.startX, GROUND_Y + 22, gap.endX - gap.startX, 190);

      // Animated ice shimmer lines on water surface
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.lineWidth = 2;
      const waveOffset = Math.sin(timeSec * 3) * 6;
      ctx.beginPath();
      ctx.moveTo(gap.startX + 12 + waveOffset, GROUND_Y + 25);
      ctx.lineTo(gap.endX - 18 + waveOffset, GROUND_Y + 25);
      ctx.stroke();
    }
    cursorX = gap.endX;
  }
  drawGroundSegment(cursorX, WORLD_LENGTH + 400);

  // --- PLATFORMS (Persian Carpet, Carved Wood & Stone) ---
  for (const plat of platforms) {
    if (plat.x + plat.width < visLeft || plat.x > visRight) continue;
    ctx.save();
    const platGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
    if (plat.style === 'carpet') {
      platGrad.addColorStop(0, '#E11D48');
      platGrad.addColorStop(1, '#881337');
    } else if (plat.style === 'stone') {
      platGrad.addColorStop(0, '#475569');
      platGrad.addColorStop(1, '#1E293B');
    } else {
      platGrad.addColorStop(0, '#92400E');
      platGrad.addColorStop(1, '#451A03');
    }

    ctx.fillStyle = platGrad;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 6);
    ctx.fill();
    ctx.stroke();

    if (plat.style === 'carpet') {
      // Golden woven medallion trim & side fringes
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(plat.x + 5, plat.y + 3, plat.width - 10, 3.5);
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.4;
      for (let fy = plat.y + 3; fy < plat.y + plat.height - 2; fy += 4) {
        ctx.beginPath();
        ctx.moveTo(plat.x - 4, fy);
        ctx.lineTo(plat.x, fy);
        ctx.moveTo(plat.x + plat.width, fy);
        ctx.lineTo(plat.x + plat.width + 4, fy);
        ctx.stroke();
      }
    } else {
      // Fluffy snow cap on top of wood/stone platform
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.roundRect(plat.x + 3, plat.y + 1.5, plat.width - 6, 4.5, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- ENVIRONMENTAL CHALLENGE PROPS (Gate Lever) ---
  for (const ch of challenges) {
    if (ch.type === 'gate_lever') {
      const lx = ch.triggerX + 25;
      if (lx < visLeft || lx > visRight) continue;
      const ly = GROUND_Y;
      ctx.save();
      ctx.translate(lx, ly);

      // Ornate stone & brass pedestal
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-18, -15, 36, 15, [6, 6, 2, 2]);
      ctx.fill();
      ctx.stroke();

      // Lever arm & glowing crystal orb handle
      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(gateLeverPulled ? 0.55 : -0.55);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -34);
      ctx.stroke();

      ctx.fillStyle = gateLeverPulled ? '#10B981' : '#F43F5E';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -36, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const nearLever = Math.abs(playerX - lx) < 68 && Math.abs(playerY - GROUND_Y) < 60;
      if (nearLever && !gateLeverPulled) {
        const pulse = Math.sin(timeSec * 6) * 2;
        ctx.fillStyle = '#FDE047';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-58, -76 + pulse, 116, 24, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 11px Vazirmatn, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('کلید E: باز کردن (+۲۰)', 0, -60 + pulse);
      }
      ctx.restore();
    }
  }

  // --- OBSTACLES (Crates, Wicker Pomegranate Baskets, Snowdrifts, Locked Gate) ---
  for (const obs of obstacles) {
    if (obs.x + obs.width < visLeft || obs.x > visRight) continue;
    if (obs.kind === 'locked_gate' && gateLeverPulled) {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y - 55, obs.width, 28, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    ctx.save();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    if (obs.kind === 'crate') {
      const crateGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y + obs.height);
      crateGrad.addColorStop(0, '#B45309');
      crateGrad.addColorStop(1, '#78350F');
      ctx.fillStyle = crateGrad;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 5);
      ctx.fill();
      ctx.stroke();

      // Inner wood frame & diagonal cross-brace
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);
      ctx.beginPath();
      ctx.moveTo(obs.x + 5, obs.y + 5);
      ctx.lineTo(obs.x + obs.width - 5, obs.y + obs.height - 5);
      ctx.stroke();
    } else if (obs.kind === 'basket') {
      // Glossy ruby pomegranates overflowing top of basket
      const poms = [obs.x + 11, obs.x + 23, obs.x + 35];
      for (const px of poms) {
        ctx.fillStyle = '#E11D48';
        ctx.beginPath();
        ctx.arc(px, obs.y + 7, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FDA4AF';
        ctx.beginPath();
        ctx.arc(px - 2, obs.y + 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Woven wicker basket body
      const basketGrad = ctx.createLinearGradient(obs.x, obs.y + 8, obs.x, obs.y + obs.height);
      basketGrad.addColorStop(0, '#D97706');
      basketGrad.addColorStop(1, '#78350F');
      ctx.fillStyle = basketGrad;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y + 9, obs.width, obs.height - 9, [4, 4, 8, 8]);
      ctx.fill();
      ctx.stroke();
    } else if (obs.kind === 'snowdrift') {
      const snowDriftGrad = ctx.createRadialGradient(
        obs.x + obs.width * 0.45,
        obs.y + 6,
        2,
        obs.x + obs.width * 0.5,
        obs.y + obs.height,
        obs.width * 0.55
      );
      snowDriftGrad.addColorStop(0, '#FFFFFF');
      snowDriftGrad.addColorStop(0.6, '#E0F2FE');
      snowDriftGrad.addColorStop(1, '#7DD3FC');
      ctx.fillStyle = snowDriftGrad;
      ctx.beginPath();
      ctx.arc(obs.x + obs.width * 0.5, obs.y + obs.height, obs.width * 0.52, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (obs.kind === 'locked_gate') {
      const gateGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y);
      gateGrad.addColorStop(0, '#7F1D1D');
      gateGrad.addColorStop(0.5, '#991B1B');
      gateGrad.addColorStop(1, '#450A0A');
      ctx.fillStyle = gateGrad;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = '#FDE047';
      for (const sy of [25, 55, 85]) {
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // --- YALDA BAZAAR ENTRANCE GATE ON MAIN PATH (x=1620) ---
  if (bazaarEntranceX >= visLeft && bazaarEntranceX <= visRight) {
    const isNearBazaarGate =
      Math.abs(playerX - bazaarEntranceX) < 150 && Math.abs(playerY - GROUND_Y) < 140;
    drawBazaarEntranceGate(
      ctx,
      bazaarEntranceX,
      GROUND_Y,
      timeSec,
      isNearBazaarGate
    );
  }

  // --- HAFEZ FAL BOOTH ON MAIN PATH (x=2080) ---
  if (hafezBooth.outdoorX >= visLeft && hafezBooth.outdoorX <= visRight) {
    const isNearOutdoorHafez =
      Math.abs(playerX - hafezBooth.outdoorX) < 135 && Math.abs(playerY - GROUND_Y) < 135;
    drawHafezBooth(
      ctx,
      hafezBooth.outdoorX,
      GROUND_Y,
      hafezBooth.claimed,
      hafezBooth.points,
      timeSec,
      isNearOutdoorHafez
    );
  }

  // --- LANTERNS ---
  for (const lantern of lanterns) {
    if (lantern.x < visLeft || lantern.x > visRight) continue;
    const isNear =
      Math.abs(playerX - lantern.x) < 95 && Math.abs(playerY - lantern.y) < 105;
    drawLanternProp(ctx, lantern, timeSec, isNear);
  }

  // --- COLLECTIBLES ---
  for (const item of collectibles) {
    if (item.collected) continue;
    if (item.x < visLeft || item.x > visRight) continue;
    if (item.type === 'pomegranate') {
      drawPomegranateItem(ctx, item.x, item.y, timeSec);
    } else {
      drawWatermelonItem(ctx, item.x, item.y, timeSec);
    }
  }

  // --- FINAL DESTINATION: GOLDEN YALDA WHEEL PORTAL AT finishX (3020) ---
  if (finishX >= visLeft && finishX <= visRight) {
    ctx.save();
    ctx.translate(finishX, GROUND_Y);

    // Outer radiant festival glow
    const portalGlow = ctx.createRadialGradient(0, -92, 12, 0, -92, 148);
    portalGlow.addColorStop(0, 'rgba(253, 224, 71, 0.72)');
    portalGlow.addColorStop(0.5, 'rgba(244, 63, 94, 0.28)');
    portalGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = portalGlow;
    ctx.beginPath();
    ctx.arc(0, -92, 148, 0, Math.PI * 2);
    ctx.fill();

    // Shimmering golden light curtain inside the archway
    const curtainGrad = ctx.createLinearGradient(0, -155, 0, 0);
    curtainGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    curtainGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
    curtainGrad.addColorStop(1, 'rgba(251, 191, 36, 0.1)');
    ctx.fillStyle = curtainGrad;
    ctx.fillRect(-36, -156, 72, 156);

    // Left & Right Persian Turquoise/Gold Columns
    const colGradL = ctx.createLinearGradient(-56, 0, -36, 0);
    colGradL.addColorStop(0, '#047857');
    colGradL.addColorStop(0.5, '#34D399');
    colGradL.addColorStop(1, '#065F46');
    ctx.fillStyle = colGradL;
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-56, -158, 20, 158);
    ctx.strokeRect(-56, -158, 20, 158);

    const colGradR = ctx.createLinearGradient(36, 0, 56, 0);
    colGradR.addColorStop(0, '#047857');
    colGradR.addColorStop(0.5, '#34D399');
    colGradR.addColorStop(1, '#065F46');
    ctx.fillStyle = colGradR;
    ctx.fillRect(36, -158, 20, 158);
    ctx.strokeRect(36, -158, 20, 158);

    // Archway header plaque
    const headerGrad = ctx.createLinearGradient(-64, -186, 64, -154);
    headerGrad.addColorStop(0, '#BE123C');
    headerGrad.addColorStop(0.5, '#E11D48');
    headerGrad.addColorStop(1, '#881337');
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    ctx.roundRect(-64, -186, 128, 32, 9);
    ctx.fill();
    ctx.stroke();

    // Jeweled Golden Lucky Wheel Crest on top of the gate
    ctx.save();
    ctx.translate(0, -214);
    ctx.rotate(timeSec * 0.5);

    for (let s = 0; s < 8; s++) {
      const a1 = (s * Math.PI) / 4;
      const a2 = ((s + 1) * Math.PI) / 4;
      ctx.fillStyle = s % 2 === 0 ? '#E11D48' : '#0D9488';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 27, a1, a2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Gate banner text
    ctx.fillStyle = '#FFFBEB';
    ctx.font = '900 12px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('دروازه گردونه یلدا', 0, -165);

    ctx.restore();
  }

  ctx.restore(); // End world-space cameraX transform
  ctx.restore(); // End worldOffsetY transform
}
