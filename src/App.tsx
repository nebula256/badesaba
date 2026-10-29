/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_DURATION_SEC,
  GRAVITY,
  GROUND_Y,
  MAX_SCORE,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MOVE_SPEED,
  REWARD_THRESHOLDS,
  WORLD_LENGTH,
  createInitialRunState,
  createLevelEntities,
  collectItemInRun,
  completeChallengeInRun,
  lightLanternInRun,
  reachFinishGateInRun,
  claimTalaseeDiscountInRun,
  claimSurmelinaDiscountInRun,
  claimHafezFalInRun,
  HAFEZ_FAL_POINTS,
  TALASEE_DISCOUNT_DEFAULT,
  SURMELINA_DISCOUNT_DEFAULT,
  UserCampaignProfile,
} from './game/rules';
import { NARI_ANIM_SPECS, NariAnimState, drawNariCharacter } from './entities/nariRenderer';
import {
  FloatingScorePopup,
  PooledParticle,
  drawWorldScene,
  drawBazaarInteriorScene,
} from './scenes/worldRenderer';
import { badesabaApi } from './integrations/badesabaApi';
import { yaldaAudio } from './systems/audio';
import { DeliverablesModal } from './components/DeliverablesModal';
import { ResultModal } from './components/ResultModal';
import {
  BoothDialogueType,
  HarvestMoonDialogueModal,
} from './components/HarvestMoonDialogueModal';
import { HafezFalModal, HafezFortune } from './components/HafezFalModal';

type GameLifecycleState = 'title' | 'playing' | 'paused' | 'gameover';

interface ThresholdBanner {
  id: number;
  title: string;
  subtitle: string;
}

const PARTICLE_POOL_SIZE = 90;
const POPUP_POOL_SIZE = 16;

export default function App() {
  const [gameState, setGameState] = useState<GameLifecycleState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [hudScore, setHudScore] = useState(0);
  const [hudTimeRemaining, setHudTimeRemaining] = useState(GAME_DURATION_SEC);
  const [hudProgressPct, setHudProgressPct] = useState(0);
  const [hudZone, setHudZone] = useState<1 | 2 | 3>(1);
  const [canInteractPrompt, setCanInteractPrompt] = useState<string | null>(null);
  const [thresholdBanner, setThresholdBanner] = useState<ThresholdBanner | null>(null);
  const [hudTalaseeCode, setHudTalaseeCode] = useState<string | null>(null);
  const [hudSurmelinaCode, setHudSurmelinaCode] = useState<string | null>(null);
  const [hudHafezClaimed, setHudHafezClaimed] = useState(false);
  const [inBazaar, setInBazaar] = useState(false);
  const [activeDialogueBooth, setActiveDialogueBooth] = useState<BoothDialogueType | null>(null);
  const [hafezModalOpen, setHafezModalOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deliverablesOpen, setDeliverablesOpen] = useState(false);

  // End-of-run frozen snapshot & server profile
  const [profile, setProfile] = useState<UserCampaignProfile>(() => badesabaApi.getProfile());
  const [finalRunSnapshot, setFinalRunSnapshot] = useState<{
    attemptId: string;
    idempotencyKey: string;
    score: number;
    finishReached: boolean;
    elapsedSec: number;
    pomegranatesCount: number;
    watermelonsCount: number;
    lanternsCount: number;
    challengesCount: number;
    talaseeClaimed: boolean;
    surmelinaClaimed: boolean;
  }>({
    attemptId: 'att_init',
    idempotencyKey: 'idem_init',
    score: 0,
    finishReached: false,
    elapsedSec: 0,
    pomegranatesCount: 0,
    watermelonsCount: 0,
    lanternsCount: 0,
    challengesCount: 0,
    talaseeClaimed: false,
    surmelinaClaimed: false,
  });
  const [serverSyncError, setServerSyncError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameLifecycleState>(gameState);
  const deliverablesOpenRef = useRef(deliverablesOpen);
  deliverablesOpenRef.current = deliverablesOpen;
  const activeDialogueRef = useRef<BoothDialogueType | null>(activeDialogueBooth);
  activeDialogueRef.current = activeDialogueBooth;
  const hafezModalOpenRef = useRef(hafezModalOpen);
  hafezModalOpenRef.current = hafezModalOpen;

  // Mutable simulation state inside ref to decouple 60Hz loop from React re-renders
  const simRef = useRef({
    level: createLevelEntities(),
    run: createInitialRunState('att_1'),
    inBazaar: false,
    savedOutdoorX: 1620,
    player: {
      x: 110,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      onGround: true,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      anim: 'idle' as NariAnimState,
      animTime: 0,
      specialAnimTimer: 0,
      specialAnimType: 'collect' as NariAnimState,
      hitFlashTimer: 0,
      scaleX: 1,
      scaleY: 1,
    },
    cameraX: 0,
    timeSec: 0,
    remainingSec: GAME_DURATION_SEC,
    notified120: false,
    notified180: false,
    notified300: false,
    finishCelebrationTimer: 0,
    input: {
      leftHeld: false,
      rightHeld: false,
      jumpJustPressed: false,
      jumpReleased: false,
      interactJustPressed: false,
    },
    particles: Array.from({ length: PARTICLE_POOL_SIZE }, (): PooledParticle => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      color: '#F8E8CE',
      alpha: 1,
      life: 0,
      maxLife: 1,
    })),
    popups: Array.from({ length: POPUP_POOL_SIZE }, (): FloatingScorePopup => ({
      active: false,
      x: 0,
      y: 0,
      vy: -40,
      text: '+10',
      color: '#F2BF59',
      alpha: 1,
      life: 0,
      maxLife: 0.9,
    })),
  });

  // Sync body dataset.state for accessibility and automated testing
  useEffect(() => {
    gameStateRef.current = gameState;
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    document.body.dataset.score = String(hudScore);
    document.body.dataset.zone = String(hudZone);
  }, [hudScore, hudZone]);

  // Emit initial game view event & attach deterministic test hooks
  useEffect(() => {
    badesabaApi.trackEvent('yalda_game_view', {
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
    }, 'view_init');

    const w = window as unknown as Record<string, unknown>;
    w.render_game_to_text = () => {
      const s = simRef.current;
      return JSON.stringify({
        state: gameStateRef.current,
        inBazaar: s.inBazaar,
        playerX: Math.round(s.player.x),
        playerY: Math.round(s.player.y),
        bazaarEntranceX: s.level.bazaarEntranceX,
        hafezBazaarX: s.level.hafezBooth.x,
        hafezOutdoorX: s.level.hafezBooth.outdoorX,
        score: s.run.score,
        talaseeClaimed: s.run.talaseeDiscountClaimed,
        surmelinaClaimed: s.run.surmelinaDiscountClaimed,
        hafezClaimed: s.run.hafezFalClaimed,
        hafezModalOpen: hafezModalOpenRef.current,
      });
    };
    w.__teleportPlayerX = (targetX: number) => {
      const s = simRef.current;
      s.player.x = targetX;
      s.player.y = GROUND_Y;
      s.player.vx = 0;
      s.player.vy = 0;
      s.cameraX = Math.max(0, targetX - 300);
    };
  }, []);

  const spawnBurstParticles = useCallback(
    (worldX: number, worldY: number, color: string, count = 12) => {
      const pool = simRef.current.particles;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < count; i++) {
        if (!pool[i].active) {
          const angle = (Math.PI * 2 * spawned) / count + Math.random() * 0.3;
          const speed = 45 + Math.random() * 95;
          pool[i].active = true;
          pool[i].x = worldX;
          pool[i].y = worldY;
          pool[i].vx = Math.cos(angle) * speed;
          pool[i].vy = Math.sin(angle) * speed - 35;
          pool[i].size = 2.5 + Math.random() * 3;
          pool[i].color = color;
          pool[i].alpha = 1;
          pool[i].life = 0;
          pool[i].maxLife = 0.45 + Math.random() * 0.35;
          spawned++;
        }
      }
    },
    []
  );

  const spawnFloatingPopup = useCallback(
    (worldX: number, worldY: number, text: string, color = '#F2BF59') => {
      const popups = simRef.current.popups;
      for (let i = 0; i < popups.length; i++) {
        if (!popups[i].active) {
          popups[i].active = true;
          popups[i].x = worldX;
          popups[i].y = worldY;
          popups[i].vy = -52;
          popups[i].text = text;
          popups[i].color = color;
          popups[i].alpha = 1;
          popups[i].life = 0;
          popups[i].maxLife = 0.95;
          break;
        }
      }
    },
    []
  );

  const checkThresholdNotifications = useCallback((newScore: number) => {
    const s = simRef.current;
    if (newScore >= REWARD_THRESHOLDS.TIER_3_INTERNET_BONUS && !s.notified300) {
      s.notified300 = true;
      s.notified180 = true;
      s.notified120 = true;
      yaldaAudio.playRewardUnlock();
      setThresholdBanner({
        id: Date.now(),
        title: 'دو شانس اضافه در انتظارت هست!',
        subtitle: 'آستانه ۳۰۰ امتیاز آزاد شد (مشروط به خرید بسته اینترنت بالای ۳۰۰٬۰۰۰ تومان)',
      });
    } else if (newScore >= REWARD_THRESHOLDS.TIER_2_GOLDEN_KEY && !s.notified180) {
      s.notified180 = true;
      s.notified120 = true;
      yaldaAudio.playRewardUnlock();
      setThresholdBanner({
        id: Date.now(),
        title: 'کلید طلایی یلدا رو گرفتی!',
        subtitle: 'آستانه ۱۸۰ امتیاز آزاد شد (مشروط به خرید شارژ بالای ۱۰۰٬۰۰۰ تومان)',
      });
    } else if (newScore >= REWARD_THRESHOLDS.TIER_1_FREE_CHANCE && !s.notified120) {
      s.notified120 = true;
      yaldaAudio.playRewardUnlock();
      setThresholdBanner({
        id: Date.now(),
        title: 'یک شانس رایگان آزاد شد!',
        subtitle: 'آستانه ۱۲۰ امتیاز بدون نیاز به خرید فعال شد!',
      });
    }
  }, []);

  const syncScoreWithServer = useCallback(
    async (snapshot: typeof finalRunSnapshot) => {
      setServerSyncError(null);
      const res = await badesabaApi.submitGameScoreOnServer({
        attemptId: snapshot.attemptId,
        idempotencyKey: snapshot.idempotencyKey,
        finalScore: snapshot.score,
        elapsedSec: snapshot.elapsedSec,
        completedFinish: snapshot.finishReached,
        pomegranatesCount: snapshot.pomegranatesCount,
        watermelonsCount: snapshot.watermelonsCount,
        lanternsCount: snapshot.lanternsCount,
        challengesCount: snapshot.challengesCount,
        talaseeClaimed: snapshot.talaseeClaimed,
        surmelinaClaimed: snapshot.surmelinaClaimed,
      });

      if (!res.ok) {
        setServerSyncError(res.errorFa || 'خطا در ارتباط با سرور بادصبا');
      } else {
        setProfile({ ...res.profile });
      }
    },
    []
  );

  const enterBazaar = useCallback(() => {
    const s = simRef.current;
    if (s.inBazaar) return;
    s.savedOutdoorX = s.level.bazaarEntranceX + 25;
    s.inBazaar = true;
    s.player.x = 265;
    s.player.y = GROUND_Y;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.facing = 1;
    s.player.onGround = true;
    s.cameraX = 0;
    s.input.leftHeld = false;
    s.input.rightHeld = false;
    s.input.interactJustPressed = false;
    setInBazaar(true);
    activeDialogueRef.current = null;
    setActiveDialogueBooth(null);
    yaldaAudio.playLanternLight();
    badesabaApi.trackEvent('yalda_bazaar_enter', {
      attempt_id: s.run.attemptId,
    });
  }, []);

  const exitBazaar = useCallback(() => {
    const s = simRef.current;
    if (!s.inBazaar) return;
    s.inBazaar = false;
    s.player.x = s.savedOutdoorX || s.level.bazaarEntranceX + 30;
    s.player.y = GROUND_Y;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.facing = 1;
    s.player.onGround = true;
    s.input.leftHeld = false;
    s.input.rightHeld = false;
    s.input.interactJustPressed = false;
    setInBazaar(false);
    setActiveDialogueBooth(null);
    yaldaAudio.playChallengeComplete();
    setThresholdBanner({
      id: Date.now(),
      title: 'خروج از بازارچه یلدا 🏃',
      subtitle: 'به مسیر برفی بازگشتی؛ به سمت دروازه گردونه شانس ادامه بده!',
    });
    badesabaApi.trackEvent('yalda_bazaar_exit', {
      attempt_id: s.run.attemptId,
      talasee_claimed: s.run.talaseeDiscountClaimed,
      surmelina_claimed: s.run.surmelinaDiscountClaimed,
    });
    canvasRef.current?.focus();
  }, []);

  const handleBoothDialogueComplete = useCallback(
    (boothType: BoothDialogueType) => {
      const sim = simRef.current;
      const p = sim.player;
      if (boothType === 'talasee') {
        const res = claimTalaseeDiscountInRun(sim.run, sim.level.talaseeBooth);
        if (res.newlyClaimed) {
          p.specialAnimTimer = 0.55;
          p.specialAnimType = 'celebrate';
          yaldaAudio.playRewardUnlock();
          spawnBurstParticles(
            sim.level.talaseeBooth.x,
            sim.level.talaseeBooth.y - 75,
            '#F2BF59',
            26
          );
          spawnFloatingPopup(
            sim.level.talaseeBooth.x,
            sim.level.talaseeBooth.y - 115,
            'کد تخفیف طلاسی!',
            '#F2BF59'
          );
          setHudTalaseeCode(res.discountCode);
          setThresholdBanner({
            id: Date.now(),
            title: `کد تخفیف طلاسی دریافت شد: ${res.discountCode}`,
            subtitle: res.discountTitleFa,
          });
          badesabaApi.trackEvent(
            'yalda_talasee_discount_claim',
            {
              attempt_id: sim.run.attemptId,
              discount_code: res.discountCode,
            },
            `talasee_${sim.run.attemptId}`
          );
        }
      } else {
        const res = claimSurmelinaDiscountInRun(sim.run, sim.level.surmelinaBooth);
        if (res.newlyClaimed) {
          p.specialAnimTimer = 0.55;
          p.specialAnimType = 'celebrate';
          yaldaAudio.playRewardUnlock();
          spawnBurstParticles(
            sim.level.surmelinaBooth.x,
            sim.level.surmelinaBooth.y - 75,
            '#F472B6',
            26
          );
          spawnFloatingPopup(
            sim.level.surmelinaBooth.x,
            sim.level.surmelinaBooth.y - 115,
            'کد تخفیف سورملینا!',
            '#F472B6'
          );
          setHudSurmelinaCode(res.discountCode);
          setThresholdBanner({
            id: Date.now(),
            title: `کد تخفیف سورملینا دریافت شد: ${res.discountCode}`,
            subtitle: res.discountTitleFa,
          });
          badesabaApi.trackEvent(
            'yalda_surmelina_discount_claim',
            {
              attempt_id: sim.run.attemptId,
              discount_code: res.discountCode,
            },
            `surmelina_${sim.run.attemptId}`
          );
        }
      }
    },
    [spawnBurstParticles, spawnFloatingPopup]
  );

  const handleTakeHafezFortune = useCallback(
    (fortune: HafezFortune) => {
      const sim = simRef.current;
      const p = sim.player;
      const res = claimHafezFalInRun(sim.run, sim.level.hafezBooth, fortune.id);
      const effectX = sim.inBazaar ? sim.level.hafezBooth.x : sim.level.hafezBooth.outdoorX;
      if (res.newlyClaimed && res.awarded > 0) {
        p.specialAnimTimer = 0.55;
        p.specialAnimType = 'celebrate';
        yaldaAudio.playRewardUnlock();
        spawnBurstParticles(effectX, GROUND_Y - 75, '#F2BF59', 26);
        spawnFloatingPopup(effectX, GROUND_Y - 115, `+${res.awarded} فال حافظ!`, '#F2BF59');
        setHudScore(res.newScore);
        setHudHafezClaimed(true);
        checkThresholdNotifications(res.newScore);
        setThresholdBanner({
          id: Date.now(),
          title: `تفأل به حافظ انجام شد (+${res.awarded} امتیاز) 📖`,
          subtitle: `${fortune.ghazalNumberFa}: ${fortune.titleFa}`,
        });
        badesabaApi.trackEvent(
          'yalda_hafez_fal_claim',
          {
            attempt_id: sim.run.attemptId,
            fortune_id: fortune.id,
            points: res.awarded,
            current_score: res.newScore,
          },
          `hafez_${sim.run.attemptId}`
        );
      } else {
        yaldaAudio.playLanternLight();
      }
      return res;
    },
    [checkThresholdNotifications, spawnBurstParticles, spawnFloatingPopup]
  );

  const finishGameSession = useCallback(
    (reason: 'finish_gate' | 'timeout') => {
      const s = simRef.current;
      yaldaAudio.stopMusic();
      yaldaAudio.playGameFinish();

      // Clear held inputs
      s.input.leftHeld = false;
      s.input.rightHeld = false;
      s.input.jumpJustPressed = false;
      s.input.interactJustPressed = false;
      s.inBazaar = false;
      setInBazaar(false);
      setActiveDialogueBooth(null);
      hafezModalOpenRef.current = false;
      setHafezModalOpen(false);

      const pomegranatesCount = s.level.collectibles.filter(
        (c) => c.type === 'pomegranate' && c.collected
      ).length;
      const watermelonsCount = s.level.collectibles.filter(
        (c) => c.type === 'watermelon' && c.collected
      ).length;
      const lanternsCount = s.level.lanterns.filter((l) => l.lit).length;
      const challengesCount = s.level.challenges.filter((ch) => ch.completed).length;

      const snapshot = {
        attemptId: s.run.attemptId,
        idempotencyKey: `idem_finish_${s.run.attemptId}`,
        score: s.run.score,
        finishReached: s.run.finishReached,
        elapsedSec: Number((GAME_DURATION_SEC - s.remainingSec).toFixed(1)),
        pomegranatesCount,
        watermelonsCount,
        lanternsCount,
        challengesCount,
        talaseeClaimed: s.run.talaseeDiscountClaimed,
        surmelinaClaimed: s.run.surmelinaDiscountClaimed,
      };

      setFinalRunSnapshot(snapshot);
      setGameState('gameover');

      if (reason === 'finish_gate') {
        badesabaApi.trackEvent('yalda_game_finish', {
          attempt_id: snapshot.attemptId,
          final_score: snapshot.score,
          elapsed_sec: snapshot.elapsedSec,
          completed_path: true,
          items_collected: pomegranatesCount + watermelonsCount,
        });
      } else {
        badesabaApi.trackEvent('yalda_game_timeout', {
          attempt_id: snapshot.attemptId,
          final_score: snapshot.score,
          elapsed_sec: GAME_DURATION_SEC,
          completed_path: false,
          items_collected: pomegranatesCount + watermelonsCount,
        });
      }

      syncScoreWithServer(snapshot);
    },
    [syncScoreWithServer]
  );

  const startNewRun = useCallback((isReplay = false) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const s = simRef.current;
    s.level = createLevelEntities();
    s.run = createInitialRunState(attemptId);
    s.inBazaar = false;
    s.savedOutdoorX = 1620;
    s.player = {
      x: 110,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      anim: 'idle',
      animTime: 0,
      specialAnimTimer: 0,
      specialAnimType: 'collect',
      hitFlashTimer: 0,
      scaleX: 1,
      scaleY: 1,
    };
    s.cameraX = 0;
    s.remainingSec = GAME_DURATION_SEC;
    s.notified120 = false;
    s.notified180 = false;
    s.notified300 = false;
    s.finishCelebrationTimer = 0;
    s.input.leftHeld = false;
    s.input.rightHeld = false;
    s.input.jumpJustPressed = false;
    s.input.jumpReleased = false;
    s.input.interactJustPressed = false;

    setHudScore(0);
    setHudTimeRemaining(GAME_DURATION_SEC);
    setHudProgressPct(0);
    setHudZone(1);
    setCanInteractPrompt(null);
    setThresholdBanner(null);
    setHudTalaseeCode(null);
    setHudSurmelinaCode(null);
    setHudHafezClaimed(false);
    setInBazaar(false);
    setActiveDialogueBooth(null);
    hafezModalOpenRef.current = false;
    setHafezModalOpen(false);
    setServerSyncError(null);

    document.body.dataset.state = 'playing';
    setGameState('playing');
    yaldaAudio.startMusic();

    if (isReplay) {
      badesabaApi.trackEvent('yalda_game_replay', {
        attempt_id: attemptId,
        best_score: badesabaApi.getProfile().bestScore,
      });
    } else {
      badesabaApi.trackEvent('yalda_game_start', {
        attempt_id: attemptId,
      });
    }

    canvasRef.current?.focus();
  }, []);

  // Auto-hide threshold banner after 3.2 seconds
  useEffect(() => {
    if (!thresholdBanner) return;
    const t = window.setTimeout(() => {
      setThresholdBanner(null);
    }, 3200);
    return () => window.clearTimeout(t);
  }, [thresholdBanner]);

  // Keyboard & Focus-loss listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (deliverablesOpenRef.current) {
        if (e.key === 'Escape') setDeliverablesOpen(false);
        return;
      }

      // When Harvest Moon dialogue modal or Hafez Fal modal is open, let its own capture listener handle E/Enter/Space/Esc
      if (activeDialogueRef.current || hafezModalOpenRef.current) {
        return;
      }

      const st = gameStateRef.current;
      if (st === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewRun(false);
        }
        return;
      }

      if (st === 'gameover') {
        return;
      }

      if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q' || e.key === 'ض') {
        if (simRef.current.inBazaar) {
          e.preventDefault();
          exitBazaar();
          return;
        }
      }

      if (e.code === 'Escape' || e.code === 'KeyP' || e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'ح') {
        e.preventDefault();
        setGameState((prev) => {
          const next = prev === 'playing' ? 'paused' : 'playing';
          if (next === 'paused') {
            yaldaAudio.stopMusic();
            simRef.current.input.leftHeld = false;
            simRef.current.input.rightHeld = false;
          } else {
            yaldaAudio.startMusic();
          }
          return next;
        });
        return;
      }

      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M' || e.key === 'پ' || e.key === 'ئ') {
        const nextMuted = yaldaAudio.toggleMute();
        setMuted(nextMuted);
        return;
      }

      if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R' || e.key === 'ق') {
        startNewRun(true);
        return;
      }

      if (st !== 'playing') return;

      const inp = simRef.current.input;
      if (
        e.code === 'ArrowRight' ||
        e.code === 'KeyD' ||
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D' ||
        e.key === 'ی'
      ) {
        inp.rightHeld = true;
      } else if (
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA' ||
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.key === 'ش'
      ) {
        inp.leftHeld = true;
      } else if (
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.code === 'Space' ||
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'W' ||
        e.key === 'ص' ||
        e.key === ' '
      ) {
        e.preventDefault();
        if (!e.repeat) {
          inp.jumpJustPressed = true;
        }
      } else if (
        e.code === 'KeyE' ||
        e.code === 'KeyF' ||
        e.code === 'KeyS' ||
        e.code === 'ArrowDown' ||
        e.code === 'Enter' ||
        e.code === 'NumpadEnter' ||
        e.key === 'e' ||
        e.key === 'E' ||
        e.key === 'ث' ||
        e.key === 'f' ||
        e.key === 'F' ||
        e.key === 'ب' ||
        e.key === 's' ||
        e.key === 'S' ||
        e.key === 'س' ||
        e.key === 'ArrowDown' ||
        e.key === 'Enter'
      ) {
        e.preventDefault();
        if (!e.repeat) {
          inp.interactJustPressed = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const inp = simRef.current.input;
      if (
        e.code === 'ArrowRight' ||
        e.code === 'KeyD' ||
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D' ||
        e.key === 'ی'
      ) {
        inp.rightHeld = false;
      } else if (
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA' ||
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.key === 'ش'
      ) {
        inp.leftHeld = false;
      } else if (
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.code === 'Space' ||
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'W' ||
        e.key === 'ص' ||
        e.key === ' '
      ) {
        inp.jumpReleased = true;
      }
    };

    const clearHeldInputs = () => {
      const inp = simRef.current.input;
      inp.leftHeld = false;
      inp.rightHeld = false;
      inp.jumpJustPressed = false;
      inp.interactJustPressed = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearHeldInputs);
    document.addEventListener('visibilitychange', clearHeldInputs);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearHeldInputs);
      document.removeEventListener('visibilitychange', clearHeldInputs);
    };
  }, [exitBazaar, startNewRun]);

  // Main 60 FPS Canvas Simulation & Render Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    // Initialize subtle, minimal ambient snow particles
    const s = simRef.current;
    for (let i = 0; i < s.particles.length; i++) {
      s.particles[i].active = i < 18;
      if (i < 18) {
        s.particles[i].x = Math.random() * 900;
        s.particles[i].y = Math.random() * 800;
        s.particles[i].vx = -8 - Math.random() * 10;
        s.particles[i].vy = 18 + Math.random() * 18;
        s.particles[i].size = 1.4 + Math.random() * 1.6;
        s.particles[i].color = '#F8E8CE';
        s.particles[i].alpha = 0.32 + Math.random() * 0.3;
        s.particles[i].life = 0;
        s.particles[i].maxLife = 999999; // Persistent snow
      }
    }

    const stepSimulation = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      const state = gameStateRef.current;
      const sim = simRef.current;
      sim.timeSec += dt;

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const maxDpr = rect.width * rect.height > 550000 ? 1.25 : 2;
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        const aspect = rect.width / Math.max(1, rect.height);
        // Mobile-First WebView framing: keep at least 420px horizontal world field-of-view
        // with uniform X/Y scaling and anchor GROUND_Y (420) cleanly above bottom touch controls
        const logicalW = aspect < 1 ? 420 : Math.max(420, Math.round(500 * aspect));
        const logicalH = aspect < 1 ? Math.round(logicalW / Math.max(0.25, aspect)) : 500;
        const worldOffsetY = Math.max(0, logicalH - 535);

        const targetPixelW = Math.max(1, Math.round(rect.width * dpr));
        const targetPixelH = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== targetPixelW || canvas.height !== targetPixelH) {
          canvas.width = targetPixelW;
          canvas.height = targetPixelH;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(canvas.width / logicalW, canvas.height / logicalH);

          // --- UPDATE GAMEPLAY WHEN IN 'playing' STATE ---
          if (state === 'playing') {
            const p = sim.player;
            const inp = sim.input;

            // If finish celebration is active, count down 0.65s then open Result Modal
            if (sim.finishCelebrationTimer > 0) {
              sim.finishCelebrationTimer -= dt;
              p.anim = 'celebrate';
              p.animTime += dt;
              if (sim.finishCelebrationTimer <= 0) {
                finishGameSession('finish_gate');
              }
            } else if (sim.inBazaar) {
              // ===============================================================
              // INDOOR YALDA BAZAAR SUB-SCENE (Timer is paused while shopping!)
              // ===============================================================
              if (activeDialogueRef.current || hafezModalOpenRef.current) {
                p.vx = 0;
                inp.interactJustPressed = false;
                p.anim = p.specialAnimTimer > 0 ? p.specialAnimType : 'idle';
                p.animTime += dt;
              } else {
                let moveDir = 0;
                if (inp.rightHeld) moveDir += 1;
                if (inp.leftHeld) moveDir -= 1;

                if (moveDir !== 0) {
                  p.vx = moveDir * PLAYER_MOVE_SPEED;
                  p.facing = moveDir > 0 ? 1 : -1;
                } else {
                  p.vx = 0;
                }

                if (p.onGround) {
                  p.coyoteTimer = 0.1;
                } else {
                  p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
                }

                if (inp.jumpJustPressed) {
                  p.jumpBufferTimer = 0.12;
                  inp.jumpJustPressed = false;
                } else {
                  p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
                }

                if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
                  p.vy = PLAYER_JUMP_VELOCITY;
                  p.onGround = false;
                  p.coyoteTimer = 0;
                  p.jumpBufferTimer = 0;
                  p.scaleX = 0.85;
                  p.scaleY = 1.18;
                  yaldaAudio.playJump();
                }

                if (inp.jumpReleased) {
                  if (p.vy < -365) {
                    p.vy = -365;
                  }
                  inp.jumpReleased = false;
                }

                p.vy += GRAVITY * dt;
                let nextX = Math.max(85, Math.min(1245, p.x + p.vx * dt));
                let nextY = p.y + p.vy * dt;

                if (nextY >= GROUND_Y) {
                  nextY = GROUND_Y;
                  p.vy = 0;
                  if (!p.onGround) {
                    p.onGround = true;
                    p.scaleX = 1.22;
                    p.scaleY = 0.78;
                    yaldaAudio.playLand();
                  }
                }

                p.x = nextX;
                p.y = nextY;
                p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
                p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

                // Check proximity to Booth 1 (Talasee at x=340), Booth 2 (Surmelina at x=650), Booth 3 (Hafez at x=950), or Exit Door (x=1200)
                const distTalasee = Math.abs(p.x - sim.level.talaseeBooth.x);
                const distSurmelina = Math.abs(p.x - sim.level.surmelinaBooth.x);
                const distHafez = Math.abs(p.x - sim.level.hafezBooth.x);
                const distExit = Math.abs(p.x - sim.level.bazaarExitX);

                const nearTalasee = distTalasee < 130;
                const nearSurmelina = distSurmelina < 130;
                const nearHafez = distHafez < 130;
                const nearExit = distExit < 115;

                if (nearTalasee && (!nearSurmelina || distTalasee <= distSurmelina)) {
                  setCanInteractPrompt('گفت‌وگو با طلاسی 💬');
                } else if (nearSurmelina && (!nearHafez || distSurmelina <= distHafez)) {
                  setCanInteractPrompt('گفت‌وگو با سورملینا 💬');
                } else if (nearHafez) {
                  setCanInteractPrompt('تفأل به حافظ 📖 (+۲۰)');
                } else if (nearExit) {
                  setCanInteractPrompt('خروج از بازارچه 🏃');
                } else {
                  setCanInteractPrompt((prev) => (prev !== null ? null : prev));
                }

                if (inp.interactJustPressed) {
                  inp.interactJustPressed = false;
                  if (nearTalasee && (!nearSurmelina || distTalasee <= distSurmelina)) {
                    inp.leftHeld = false;
                    inp.rightHeld = false;
                    yaldaAudio.playLanternLight();
                    activeDialogueRef.current = 'talasee';
                    setActiveDialogueBooth('talasee');
                  } else if (nearSurmelina && (!nearHafez || distSurmelina <= distHafez)) {
                    inp.leftHeld = false;
                    inp.rightHeld = false;
                    yaldaAudio.playLanternLight();
                    activeDialogueRef.current = 'surmelina';
                    setActiveDialogueBooth('surmelina');
                  } else if (nearHafez) {
                    inp.leftHeld = false;
                    inp.rightHeld = false;
                    yaldaAudio.playLanternLight();
                    hafezModalOpenRef.current = true;
                    setHafezModalOpen(true);
                  } else if (nearExit) {
                    exitBazaar();
                  }
                }

                if (p.specialAnimTimer > 0) {
                  p.specialAnimTimer = Math.max(0, p.specialAnimTimer - dt);
                  p.anim = p.specialAnimType;
                  p.animTime += dt;
                } else if (!p.onGround) {
                  p.anim = p.vy < 0 ? 'jump' : 'fall';
                  p.animTime += dt;
                } else if (Math.abs(p.vx) > 5) {
                  p.anim = 'run';
                  p.animTime += (Math.abs(p.vx) * dt) / 180;
                } else {
                  p.anim = 'idle';
                  p.animTime += dt;
                }

                const bazaarWorldW = 1360;
                const targetCamX = Math.max(
                  0,
                  Math.min(Math.max(0, bazaarWorldW - logicalW), p.x - logicalW * 0.4)
                );
                sim.cameraX += (targetCamX - sim.cameraX) * Math.min(1, dt * 10);
              }
            } else if (hafezModalOpenRef.current) {
              // Pause outdoor countdown & player motion while reading Hafez fortune
              p.vx = 0;
              inp.interactJustPressed = false;
              p.anim = p.specialAnimTimer > 0 ? p.specialAnimType : 'idle';
              p.animTime += dt;
            } else {
              // 1. Countdown 60s active timer
              sim.remainingSec = Math.max(0, sim.remainingSec - dt);
              const roundedSec = Math.ceil(sim.remainingSec);
              setHudTimeRemaining((prev) => (prev !== roundedSec ? roundedSec : prev));

              if (sim.remainingSec <= 0) {
                finishGameSession('timeout');
              } else {
                // 2. Horizontal movement (strictly user-controlled, NOT auto-runner)
                let moveDir = 0;
                if (inp.rightHeld) moveDir += 1;
                if (inp.leftHeld) moveDir -= 1;

                if (moveDir !== 0) {
                  p.vx = moveDir * PLAYER_MOVE_SPEED;
                  p.facing = moveDir > 0 ? 1 : -1;
                } else {
                  p.vx = 0;
                }

                // 3. Jump buffering & Coyote time
                if (p.onGround) {
                  p.coyoteTimer = 0.1;
                } else {
                  p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
                }

                if (inp.jumpJustPressed) {
                  p.jumpBufferTimer = 0.12;
                  inp.jumpJustPressed = false;
                } else {
                  p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
                }

                if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
                  p.vy = PLAYER_JUMP_VELOCITY;
                  p.onGround = false;
                  p.coyoteTimer = 0;
                  p.jumpBufferTimer = 0;
                  p.scaleX = 0.85;
                  p.scaleY = 1.18;
                  yaldaAudio.playJump();
                }

                if (inp.jumpReleased) {
                  if (p.vy < -365) {
                    p.vy = -365;
                  }
                  inp.jumpReleased = false;
                }

                // 4. Apply Gravity & Integrate X/Y
                const prevY = p.y;
                p.vy += GRAVITY * dt;
                let nextX = p.x + p.vx * dt;
                let nextY = p.y + p.vy * dt;

                // World bounds clamp
                nextX = Math.max(40, Math.min(WORLD_LENGTH - 60, nextX));

                // 5. Obstacle horizontal collision check
                for (const obs of sim.level.obstacles) {
                  if (obs.kind === 'locked_gate' && sim.run.gateLeverPulled) {
                    continue;
                  }
                  // Player bounding box: [nextX - 14, nextX + 14] x [nextY - 56, nextY]
                  const overlapX = nextX + 14 > obs.x && nextX - 14 < obs.x + obs.width;
                  const overlapY = nextY > obs.y + 4 && nextY - 52 < obs.y + obs.height;

                  if (overlapX && overlapY) {
                    // Check if landing on top of crate/basket/snowdrift
                    if (prevY <= obs.y + 8 && p.vy >= 0 && obs.kind !== 'locked_gate') {
                      nextY = obs.y;
                      p.vy = 0;
                      if (!p.onGround) {
                        p.onGround = true;
                        p.scaleX = 1.22;
                        p.scaleY = 0.78;
                        yaldaAudio.playLand();
                      }
                    } else {
                      // Horizontal bump against obstacle side
                      if (p.vx > 0) {
                        nextX = obs.x - 14.5;
                      } else if (p.vx < 0) {
                        nextX = obs.x + obs.width + 14.5;
                      }
                      if (p.hitFlashTimer <= 0 && obs.kind !== 'locked_gate') {
                        p.hitFlashTimer = 0.32;
                        p.specialAnimTimer = 0.28;
                        p.specialAnimType = 'hit';
                        yaldaAudio.playObstacleBump();
                      }
                    }
                  }
                }

                // 6. One-way Platform landing check
                let landedOnSurface = false;
                for (const plat of sim.level.platforms) {
                  const withinX = nextX + 12 > plat.x && nextX - 12 < plat.x + plat.width;
                  if (withinX && prevY <= plat.y + 8 && nextY >= plat.y && p.vy >= 0) {
                    nextY = plat.y;
                    p.vy = 0;
                    landedOnSurface = true;
                    if (!p.onGround) {
                      p.onGround = true;
                      p.scaleX = 1.22;
                      p.scaleY = 0.78;
                      yaldaAudio.playLand();
                    }
                    break;
                  }
                }

                // 7. Ground & Gap check
                if (!landedOnSurface) {
                  const overGap = sim.level.gaps.find(
                    (g) => nextX > g.startX + 8 && nextX < g.endX - 8
                  );
                  if (!overGap && nextY >= GROUND_Y) {
                    nextY = GROUND_Y;
                    p.vy = 0;
                    if (!p.onGround) {
                      p.onGround = true;
                      p.scaleX = 1.22;
                      p.scaleY = 0.78;
                      yaldaAudio.playLand();
                    }
                    landedOnSurface = true;
                  } else if (overGap && nextY >= GROUND_Y + 34) {
                    // Gently step Nari back onto the left bank of the stream without losing points or Game Over!
                    nextX = overGap.startX - 18;
                    nextY = GROUND_Y;
                    p.vy = 0;
                    p.onGround = true;
                    p.hitFlashTimer = 0.4;
                    p.specialAnimTimer = 0.35;
                    p.specialAnimType = 'hit';
                    yaldaAudio.playObstacleBump();
                  } else if (nextY < GROUND_Y) {
                    // Check if still standing on crate top
                    const standingOnCrate = sim.level.obstacles.some(
                      (obs) =>
                        obs.kind !== 'locked_gate' &&
                        nextX + 14 > obs.x &&
                        nextX - 14 < obs.x + obs.width &&
                        Math.abs(nextY - obs.y) < 3
                    );
                    if (!standingOnCrate) {
                      p.onGround = false;
                    }
                  }
                }

                p.x = nextX;
                p.y = nextY;

                // Damped Squash & Stretch recovery
                p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
                p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);
                if (p.hitFlashTimer > 0) p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);

                // 8. Collectibles check (Auto-collect on touch)
                for (const item of sim.level.collectibles) {
                  if (item.collected) continue;
                  const dx = p.x - item.x;
                  const dy = p.y - 28 - item.y;
                  if (dx * dx + dy * dy <= 34 * 34) {
                    const res = collectItemInRun(sim.run, item);
                    if (res.awarded > 0) {
                      p.specialAnimTimer = 0.28;
                      p.specialAnimType = 'collect';
                      if (item.type === 'pomegranate') {
                        yaldaAudio.playCollectPomegranate();
                        spawnBurstParticles(item.x, item.y, '#D94758', 12);
                      } else {
                        yaldaAudio.playCollectWatermelon();
                        spawnBurstParticles(item.x, item.y, '#23745A', 14);
                      }
                      spawnFloatingPopup(item.x, item.y - 14, `+${res.awarded}`, '#F2BF59');
                      setHudScore(res.newScore);
                      checkThresholdNotifications(res.newScore);
                      badesabaApi.trackEvent(
                        'yalda_item_collect',
                        {
                          attempt_id: sim.run.attemptId,
                          item_id: item.id,
                          item_type: item.type,
                          points: res.awarded,
                          current_score: res.newScore,
                        },
                        `col_${sim.run.attemptId}_${item.id}`
                      );
                    }
                  }
                }

                // 9. Context-sensitive Interaction check (Bazaar Entrance Gate, Hafez Booth, Lanterns & Gate Lever)
                const nearbyBazaarEntrance =
                  Math.abs(p.x - sim.level.bazaarEntranceX) < 155 &&
                  Math.abs(p.y - GROUND_Y) < 140;

                const nearbyOutdoorHafez =
                  Math.abs(p.x - sim.level.hafezBooth.outdoorX) < 140 &&
                  Math.abs(p.y - GROUND_Y) < 135;

                const nearbyLantern = sim.level.lanterns.find(
                  (l) => !l.lit && Math.abs(p.x - l.x) < 105 && Math.abs(p.y - l.y) < 115
                );
                const leverChallenge = sim.level.challenges.find(
                  (ch) =>
                    ch.type === 'gate_lever' &&
                    !ch.completed &&
                    Math.abs(p.x - (ch.triggerX + 25)) < 105 &&
                    Math.abs(p.y - GROUND_Y) < 95
                );

                if (nearbyBazaarEntrance) {
                  setCanInteractPrompt('ورود به بازارچه 🏛️');
                } else if (nearbyOutdoorHafez) {
                  setCanInteractPrompt('تفأل به حافظ 📖 (+۲۰)');
                } else if (nearbyLantern) {
                  setCanInteractPrompt('روشن‌کردن فانوس (+۳۰)');
                } else if (leverChallenge) {
                  setCanInteractPrompt('کشیدن اهرم (+۲۰)');
                } else {
                  setCanInteractPrompt((prev) => (prev !== null ? null : prev));
                }

                if (inp.interactJustPressed) {
                  inp.interactJustPressed = false;
                  if (nearbyLantern) {
                    const res = lightLanternInRun(sim.run, nearbyLantern);
                    if (res.awarded > 0) {
                      p.specialAnimTimer = 0.42;
                      p.specialAnimType = 'interact';
                      yaldaAudio.playLanternLight();
                      spawnBurstParticles(nearbyLantern.x + 16, nearbyLantern.y - 6, '#F2BF59', 18);
                      spawnFloatingPopup(nearbyLantern.x, nearbyLantern.y - 36, `+${res.awarded}`, '#F2BF59');
                      setHudScore(res.newScore);
                      checkThresholdNotifications(res.newScore);
                      badesabaApi.trackEvent(
                        'yalda_lantern_light',
                        {
                          attempt_id: sim.run.attemptId,
                          lantern_id: nearbyLantern.id,
                          points: res.awarded,
                          current_score: res.newScore,
                        },
                        `lan_${sim.run.attemptId}_${nearbyLantern.id}`
                      );
                    }
                  }
                  if (nearbyBazaarEntrance) {
                    enterBazaar();
                  } else if (nearbyOutdoorHafez) {
                    inp.leftHeld = false;
                    inp.rightHeld = false;
                    yaldaAudio.playLanternLight();
                    hafezModalOpenRef.current = true;
                    setHafezModalOpen(true);
                  } else if (leverChallenge) {
                    const res = completeChallengeInRun(sim.run, leverChallenge);
                    if (res.awarded > 0) {
                      p.specialAnimTimer = 0.42;
                      p.specialAnimType = 'interact';
                      yaldaAudio.playChallengeComplete();
                      spawnBurstParticles(leverChallenge.triggerX + 25, GROUND_Y - 25, '#4ADE80', 16);
                      spawnFloatingPopup(
                        leverChallenge.triggerX + 25,
                        GROUND_Y - 48,
                        `+${res.awarded} چالش!`,
                        '#4ADE80'
                      );
                      setHudScore(res.newScore);
                      checkThresholdNotifications(res.newScore);
                      badesabaApi.trackEvent(
                        'yalda_challenge_complete',
                        {
                          attempt_id: sim.run.attemptId,
                          challenge_id: leverChallenge.id,
                          points: res.awarded,
                          current_score: res.newScore,
                        },
                        `chal_${sim.run.attemptId}_${leverChallenge.id}`
                      );
                    }
                  }
                }

                // 10. Non-interactive movement challenges (Gap Jump & High Platform)
                for (const ch of sim.level.challenges) {
                  if (ch.completed || ch.requiresInteraction) continue;
                  const insideX = p.x >= ch.triggerX && p.x <= ch.triggerX + ch.width;
                  const insideY = p.y >= ch.triggerY && p.y <= ch.triggerY + ch.height;
                  if (insideX && insideY) {
                    const res = completeChallengeInRun(sim.run, ch);
                    if (res.awarded > 0) {
                      yaldaAudio.playChallengeComplete();
                      spawnBurstParticles(p.x, p.y - 25, '#4ADE80', 14);
                      spawnFloatingPopup(p.x, p.y - 54, `+${res.awarded} ${ch.title}`, '#4ADE80');
                      setHudScore(res.newScore);
                      checkThresholdNotifications(res.newScore);
                      badesabaApi.trackEvent(
                        'yalda_challenge_complete',
                        {
                          attempt_id: sim.run.attemptId,
                          challenge_id: ch.id,
                          points: res.awarded,
                          current_score: res.newScore,
                        },
                        `chal_${sim.run.attemptId}_${ch.id}`
                      );
                    }
                  }
                }

                // 11. Reach Finish Gate check (+30 points once)
                if (p.x >= sim.level.finishX - 18 && !sim.run.finishReached) {
                  const res = reachFinishGateInRun(sim.run);
                  if (res.awarded > 0) {
                    spawnBurstParticles(sim.level.finishX, GROUND_Y - 70, '#F2BF59', 24);
                    spawnFloatingPopup(sim.level.finishX, GROUND_Y - 110, `+${res.awarded} خط پایان!`, '#F2BF59');
                    setHudScore(res.newScore);
                    checkThresholdNotifications(res.newScore);
                  }
                  sim.finishCelebrationTimer = 0.65;
                }

                // 12. Determine Nari's active animation state
                if (p.specialAnimTimer > 0) {
                  p.specialAnimTimer = Math.max(0, p.specialAnimTimer - dt);
                  p.anim = p.specialAnimType;
                  p.animTime += dt;
                } else if (!p.onGround) {
                  p.anim = p.vy < 0 ? 'jump' : 'fall';
                  p.animTime += dt;
                } else if (Math.abs(p.vx) > 5) {
                  p.anim = 'run';
                  // Gait sync with distance traveled
                  p.animTime += (Math.abs(p.vx) * dt) / 180;
                } else {
                  p.anim = 'idle';
                  p.animTime += dt;
                }

                // 13. Smooth Camera Follow & Progress Bar Update
                const targetCamX = Math.max(
                  0,
                  Math.min(WORLD_LENGTH - logicalW, p.x - logicalW * 0.32)
                );
                sim.cameraX += (targetCamX - sim.cameraX) * Math.min(1, dt * 10);

                const pct = Math.min(
                  100,
                  Math.max(0, Math.round((p.x / sim.level.finishX) * 100))
                );
                setHudProgressPct((prev) => (prev !== pct ? pct : prev));

                const currentZone: 1 | 2 | 3 = p.x < 1100 ? 1 : p.x < 2300 ? 2 : 3;
                setHudZone((prev) => (prev !== currentZone ? currentZone : prev));
              }
            }
          } else if (state === 'title') {
            // Subtle camera breathing pan on Title Screen while Nari idles beside the snowy alley
            sim.cameraX = Math.sin(sim.timeSec * 0.4) * 18 + 18;
            sim.player.anim = 'idle';
            sim.player.animTime += dt;
          }

          // --- RENDER WORLD (OR INDOOR BAZAAR), NARI, PARTICLES & POPUPS ---
          if (sim.inBazaar && state !== 'title') {
            drawBazaarInteriorScene(ctx, {
              viewWidth: logicalW,
              viewHeight: logicalH,
              worldOffsetY,
              cameraX: sim.cameraX,
              timeSec: sim.timeSec,
              talaseeBooth: sim.level.talaseeBooth,
              surmelinaBooth: sim.level.surmelinaBooth,
              hafezBooth: sim.level.hafezBooth,
              bazaarExitX: sim.level.bazaarExitX,
              playerX: sim.player.x,
              playerY: sim.player.y,
            });
          } else {
            drawWorldScene(ctx, {
              viewWidth: logicalW,
              viewHeight: logicalH,
              worldOffsetY,
              cameraX: sim.cameraX,
              timeSec: sim.timeSec,
              collectibles: sim.level.collectibles,
              lanterns: sim.level.lanterns,
              challenges: sim.level.challenges,
              platforms: sim.level.platforms,
              obstacles: sim.level.obstacles,
              gaps: sim.level.gaps,
              bazaarEntranceX: sim.level.bazaarEntranceX,
              talaseeBooth: sim.level.talaseeBooth,
              surmelinaBooth: sim.level.surmelinaBooth,
              hafezBooth: sim.level.hafezBooth,
              finishX: sim.level.finishX,
              gateLeverPulled: sim.run.gateLeverPulled,
              playerX: sim.player.x,
              playerY: sim.player.y,
            });
          }

          // Draw Nari
          const spec = NARI_ANIM_SPECS[sim.player.anim];
          const frameIdx = Math.floor(sim.player.animTime * spec.fps) % spec.frames;
          drawNariCharacter(ctx, {
            cx: sim.player.x - sim.cameraX,
            bottomY: sim.player.y + worldOffsetY,
            facing: sim.player.facing,
            anim: sim.player.anim,
            frameIndex: frameIdx,
            scaleX: sim.player.scaleX,
            scaleY: sim.player.scaleY,
            hitFlash: sim.player.hitFlashTimer > 0 && Math.floor(sim.timeSec * 25) % 2 === 0,
          });

          // Update & Draw Pooled Snow + Burst Particles
          for (let i = 0; i < sim.particles.length; i++) {
            const pt = sim.particles[i];
            if (!pt.active) continue;

            if (pt.maxLife > 1000) {
              if (sim.inBazaar) continue;
              // Persistent screen-space snow (outdoor only)
              pt.x += pt.vx * dt;
              pt.y += pt.vy * dt;
              if (pt.y > logicalH) {
                pt.y = -5;
                pt.x = Math.random() * logicalW;
              }
              if (pt.x < 0) pt.x = logicalW;

              ctx.fillStyle = `rgba(248, 232, 206, ${pt.alpha.toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // World-space burst particle
              pt.life += dt;
              if (pt.life >= pt.maxLife) {
                pt.active = false;
                continue;
              }
              pt.x += pt.vx * dt;
              pt.y += pt.vy * dt;
              pt.vy += 180 * dt;
              const alpha = 1 - pt.life / pt.maxLife;
              ctx.fillStyle = pt.color;
              ctx.globalAlpha = Math.max(0, alpha);
              ctx.beginPath();
              ctx.arc(pt.x - sim.cameraX, pt.y + worldOffsetY, pt.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }

          // Update & Draw Floating Score Popups (+10, +15, +20, +30)
          for (let i = 0; i < sim.popups.length; i++) {
            const pop = sim.popups[i];
            if (!pop.active) continue;
            pop.life += dt;
            if (pop.life >= pop.maxLife) {
              pop.active = false;
              continue;
            }
            pop.y += pop.vy * dt;
            const alpha = 1 - pop.life / pop.maxLife;
            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.font = '900 14px Vazirmatn, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#0F1E38';
            ctx.lineWidth = 3;
            ctx.strokeText(pop.text, pop.x - sim.cameraX, pop.y + worldOffsetY);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, pop.x - sim.cameraX, pop.y + worldOffsetY);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(stepSimulation);
    };

    rafId = requestAnimationFrame(stepSimulation);
    return () => cancelAnimationFrame(rafId);
  }, [
    checkThresholdNotifications,
    enterBazaar,
    exitBazaar,
    finishGameSession,
    spawnBurstParticles,
    spawnFloatingPopup,
  ]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-[#0B162B] select-none">
      {/* Full-Viewport Mobile-First 2D Game Canvas */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        data-testid="yalda-game-canvas"
        aria-label="صفحه بازی ماجراجویی یلدایی بادصبا"
        className="block w-full h-full outline-none cursor-pointer"
        onPointerDown={(e) => {
          canvasRef.current?.focus();
          if (
            gameStateRef.current !== 'playing' ||
            activeDialogueRef.current ||
            hafezModalOpenRef.current
          ) {
            return;
          }
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const aspect = rect.width / Math.max(1, rect.height);
          const logicalW = aspect < 1 ? 420 : Math.max(420, Math.round(500 * aspect));
          const logicalH = aspect < 1 ? Math.round(logicalW / Math.max(0.25, aspect)) : 500;
          const worldOffsetY = Math.max(0, logicalH - 535);
          const clickLogicalX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * logicalW;
          const clickLogicalY =
            ((e.clientY - rect.top) / Math.max(1, rect.height)) * logicalH - worldOffsetY;
          const sim = simRef.current;
          const worldX = clickLogicalX + sim.cameraX;

          if (sim.inBazaar) {
            if (
              Math.abs(worldX - sim.level.talaseeBooth.x) < 105 &&
              clickLogicalY > sim.level.talaseeBooth.y - 200
            ) {
              yaldaAudio.playLanternLight();
              activeDialogueRef.current = 'talasee';
              setActiveDialogueBooth('talasee');
              return;
            }
            if (
              Math.abs(worldX - sim.level.surmelinaBooth.x) < 105 &&
              clickLogicalY > sim.level.surmelinaBooth.y - 200
            ) {
              yaldaAudio.playLanternLight();
              activeDialogueRef.current = 'surmelina';
              setActiveDialogueBooth('surmelina');
              return;
            }
            if (
              Math.abs(worldX - sim.level.hafezBooth.x) < 105 &&
              clickLogicalY > sim.level.hafezBooth.y - 200
            ) {
              yaldaAudio.playLanternLight();
              hafezModalOpenRef.current = true;
              setHafezModalOpen(true);
              return;
            }
            if (
              Math.abs(worldX - sim.level.bazaarExitX) < 95 &&
              clickLogicalY > GROUND_Y - 190
            ) {
              exitBazaar();
              return;
            }
          } else {
            if (
              Math.abs(worldX - sim.level.bazaarEntranceX) < 115 &&
              clickLogicalY > GROUND_Y - 210 &&
              clickLogicalY <= GROUND_Y + 20
            ) {
              enterBazaar();
              return;
            }
            if (
              Math.abs(worldX - sim.level.hafezBooth.outdoorX) < 115 &&
              clickLogicalY > GROUND_Y - 200 &&
              clickLogicalY <= GROUND_Y + 20
            ) {
              yaldaAudio.playLanternLight();
              hafezModalOpenRef.current = true;
              setHafezModalOpen(true);
              return;
            }
          }

          sim.input.interactJustPressed = true;
        }}
      />

      {/* =====================================================================
          STATE 1: MINIMALIST MOBILE-FIRST TITLE SCREEN OVERLAY
          ===================================================================== */}
      {gameState === 'title' && (
        <div className="fixed inset-0 z-20 flex flex-col justify-between p-5 pointer-events-none">
          {/* Upper/Center Negative-Space Composition */}
          <div className="flex flex-col items-center text-center max-w-sm mx-auto mt-6 sm:mt-8 space-y-3.5 pointer-events-auto">
            {/* Custom Inline SVG Persian Yalda Crest Emblem */}
            <svg
              viewBox="0 0 380 104"
              className="w-64 sm:w-80 h-auto drop-shadow-[0_6px_16px_rgba(0,0,0,0.75)]"
              role="img"
              aria-label="نشان ماجراجویی یلدایی بادصبا"
            >
              <path
                d="M22 22 Q190 4 358 22 L364 82 Q190 98 16 82 Z"
                fill="#11203A"
                stroke="#F2BF59"
                strokeWidth="3"
              />
              <path
                d="M30 28 Q190 12 350 28 L355 76 Q190 90 25 76 Z"
                fill="#A92342"
                stroke="#F8E8CE"
                strokeWidth="1.2"
                strokeOpacity="0.4"
              />
              <circle cx="190" cy="15" r="10" fill="#D94758" stroke="#F2BF59" strokeWidth="2" />
              <circle cx="190" cy="15" r="3.5" fill="#F2BF59" />
              <text
                x="190"
                y="54"
                textAnchor="middle"
                fill="#F8E8CE"
                fontFamily="Vazirmatn, sans-serif"
                fontWeight="900"
                fontSize="22"
              >
                ماجراجویی یلدایی بادصبا
              </text>
              <text
                x="190"
                y="74"
                textAnchor="middle"
                fill="#F2BF59"
                fontFamily="Vazirmatn, sans-serif"
                fontWeight="700"
                fontSize="12"
              >
                همراه با «ناری» · راهی به گردونه شانس
              </text>
            </svg>

            <p className="text-xs text-[#F8E8CE]/90 bg-[#0F1E38]/90 border border-[#F2BF59]/30 rounded-xl px-3.5 py-2 shadow-md">
              در ۶۰ ثانیه از کوچه برفی و بازارچه عبور کن و تا ۴ شانس گردونه بگیر!
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex items-center justify-center gap-2.5 pt-1 w-full">
              <button
                type="button"
                data-start="true"
                onClick={() => startNewRun(false)}
                className="flex-1 max-w-[180px] py-3 rounded-xl bg-[#F2BF59] hover:bg-[#ffd073] text-[#172B4D] text-sm sm:text-base font-black shadow-[0_4px_0_#b58322] active:translate-y-0.5 transition-all whitespace-nowrap cursor-pointer"
              >
                شروع ماجراجویی
              </button>

              <button
                type="button"
                onClick={() => setDeliverablesOpen(true)}
                className="px-3.5 py-3 rounded-xl bg-[#11203A]/95 hover:bg-[#1E365E] border border-[#F2BF59]/45 text-[#91C9D8] hover:text-[#F8E8CE] text-xs font-bold shadow-md transition-colors whitespace-nowrap cursor-pointer"
              >
                مستندات فنی
              </button>
            </div>
          </div>

          {/* Flat, borderless inline control hint in bottom safe margin */}
          <div className="text-center text-[11px] text-[#91C9D8]/85 hud-stroke pb-1">
            لمس دکمه‌ها یا کلیدهای جهت‌نما: حرکت · پرش · E: تعامل با بازارچه و فانوس
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 2: MINIMALIST MOBILE-FIRST PLAYING HUD OVERLAY
          ===================================================================== */}
      {gameState === 'playing' && (
        <div className="fixed inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-3.5 pointer-events-none">
          {/* Sleek Single-Row Mobile WebView Top Bar */}
          <div className="w-full max-w-lg mx-auto h-12 px-3 rounded-2xl bg-[#0F1E38]/92 border border-[#F2BF59]/35 shadow-lg flex items-center justify-between gap-2 pointer-events-auto">
            {/* Right: Score + Minimal Claimed Chips */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="flex items-baseline gap-1 font-num"
                data-testid="hud-score"
              >
                <span className="text-xs text-[#F2BF59]">⭐</span>
                <span className="text-base sm:text-lg font-black text-[#F2BF59] leading-none">
                  {hudScore}
                </span>
                <span className="text-[10px] font-bold text-[#91C9D8]/80">
                  / {MAX_SCORE}
                </span>
              </div>

              {(hudTalaseeCode || profile.talaseeDiscountClaimed) && (
                <span
                  data-testid="hud-talasee-badge"
                  title={
                    hudTalaseeCode ||
                    profile.talaseeDiscountCode ||
                    TALASEE_DISCOUNT_DEFAULT.code
                  }
                  className="px-1.5 py-0.5 rounded-md bg-[#4ADE80]/15 border border-[#4ADE80]/40 text-[#4ADE80] text-[9px] font-bold font-num leading-none"
                >
                  🪙 طلاسی
                  <span className="sr-only">
                    {' '}
                    {hudTalaseeCode ||
                      profile.talaseeDiscountCode ||
                      TALASEE_DISCOUNT_DEFAULT.code}
                  </span>
                </span>
              )}

              {(hudSurmelinaCode || profile.surmelinaDiscountClaimed) && (
                <span
                  data-testid="hud-surmelina-badge"
                  title={
                    hudSurmelinaCode ||
                    profile.surmelinaDiscountCode ||
                    SURMELINA_DISCOUNT_DEFAULT.code
                  }
                  className="px-1.5 py-0.5 rounded-md bg-[#F472B6]/15 border border-[#F472B6]/40 text-[#F472B6] text-[9px] font-bold font-num leading-none"
                >
                  🌸 سورملینا
                  <span className="sr-only">
                    {' '}
                    {hudSurmelinaCode ||
                      profile.surmelinaDiscountCode ||
                      SURMELINA_DISCOUNT_DEFAULT.code}
                  </span>
                </span>
              )}

              {hudHafezClaimed && (
                <span
                  data-testid="hud-hafez-badge"
                  className="px-1.5 py-0.5 rounded-md bg-[#F2BF59]/15 border border-[#F2BF59]/40 text-[#F2BF59] text-[9px] font-bold font-num leading-none"
                >
                  📖 +{HAFEZ_FAL_POINTS}
                </span>
              )}
            </div>

            {/* Center: Minimalist Progress Bar with 3 Milestone Dots OR Quick Bazaar Exit */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-1">
              {inBazaar ? (
                <button
                  type="button"
                  data-testid="bazaar-quick-exit-btn"
                  onClick={exitBazaar}
                  className="px-2.5 py-1 rounded-lg bg-[#4ADE80] text-[#0F1E38] font-black text-[10px] cursor-pointer hover:bg-[#86efac] whitespace-nowrap transition-colors"
                >
                  خروج از بازارچه ◀
                </button>
              ) : (
                <div className="w-full max-w-[135px] sm:max-w-[180px] flex flex-col gap-1">
                  <div className="relative w-full h-1.5 bg-[#081020] rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-[#D94758] transition-all duration-150 rounded-full"
                      style={{ width: `${hudProgressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[8.5px] font-num leading-none px-0.5">
                    <span
                      className={
                        hudScore >= 120
                          ? 'text-[#4ADE80] font-black'
                          : 'text-[#91C9D8]/60'
                      }
                    >
                      {hudScore >= 120 ? '●' : '○'} ۱۲۰
                    </span>
                    <span
                      className={
                        hudScore >= 180
                          ? 'text-[#F2BF59] font-black'
                          : 'text-[#91C9D8]/60'
                      }
                    >
                      {hudScore >= 180 ? '●' : '○'} ۱۸۰
                    </span>
                    <span
                      className={
                        hudScore >= 300
                          ? 'text-[#F2BF59] font-black'
                          : 'text-[#91C9D8]/60'
                      }
                    >
                      {hudScore >= 300 ? '●' : '○'} ۳۰۰
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Left: Compact Timer + Utility Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                data-testid="hud-timer"
                className={`px-2 py-1 rounded-lg font-num text-xs sm:text-sm font-black leading-none ${
                  hudTimeRemaining <= 10
                    ? 'bg-[#D94758]/20 border border-[#D94758] text-[#D94758]'
                    : 'bg-white/5 text-[#F8E8CE]'
                }`}
              >
                {hudTimeRemaining}s
              </div>

              {/* Mute Button [M] */}
              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'وصل صدا' : 'قطع صدا'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  const next = yaldaAudio.toggleMute();
                  setMuted(next);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[#F8E8CE] cursor-pointer"
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>

              {/* Pause Button [P] */}
              <button
                type="button"
                tabIndex={-1}
                aria-label="توقف موقت بازی"
                onClick={(e) => {
                  e.currentTarget.blur();
                  yaldaAudio.stopMusic();
                  simRef.current.input.leftHeld = false;
                  simRef.current.input.rightHeld = false;
                  setGameState('paused');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[#F8E8CE] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Compact Non-blocking Threshold Unlock Toast */}
          {thresholdBanner && (
            <div
              className="mx-auto bg-[#23745A] border border-[#F2BF59] text-white px-3.5 py-1.5 rounded-xl shadow-lg text-center max-w-xs"
              role="status"
            >
              <div className="text-xs font-black text-[#F2BF59]">{thresholdBanner.title}</div>
              <div className="text-[10px] text-[#F8E8CE]">{thresholdBanner.subtitle}</div>
            </div>
          )}

          {/* Minimalist Mobile-First Bottom Touch Controls */}
          <div className="w-full max-w-lg mx-auto flex items-end justify-between gap-2 pb-1 pointer-events-auto">
            {/* Directional Movement Thumb Buttons (Left & Right) */}
            <div className="flex items-center gap-2" dir="ltr">
              <button
                type="button"
                aria-label="حرکت به چپ"
                onPointerDown={(e) => {
                  e.preventDefault();
                  simRef.current.input.leftHeld = true;
                }}
                onPointerUp={() => {
                  simRef.current.input.leftHeld = false;
                }}
                onPointerLeave={() => {
                  simRef.current.input.leftHeld = false;
                }}
                onPointerCancel={() => {
                  simRef.current.input.leftHeld = false;
                }}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0F1E38]/85 active:bg-[#D94758] border border-[#F2BF59]/50 text-[#F8E8CE] flex items-center justify-center shadow-lg cursor-pointer"
              >
                <span className="text-lg font-black leading-none">←</span>
              </button>

              <button
                type="button"
                aria-label="حرکت به راست"
                onPointerDown={(e) => {
                  e.preventDefault();
                  simRef.current.input.rightHeld = true;
                }}
                onPointerUp={() => {
                  simRef.current.input.rightHeld = false;
                }}
                onPointerLeave={() => {
                  simRef.current.input.rightHeld = false;
                }}
                onPointerCancel={() => {
                  simRef.current.input.rightHeld = false;
                }}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0F1E38]/85 active:bg-[#D94758] border border-[#F2BF59]/50 text-[#F8E8CE] flex items-center justify-center shadow-lg cursor-pointer"
              >
                <span className="text-lg font-black leading-none">→</span>
              </button>
            </div>

            {/* Action Thumb Buttons: Context-Sensitive Interact + Jump */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="تعامل با فانوس یا اهرم"
                disabled={!canInteractPrompt}
                onPointerDown={(e) => {
                  e.preventDefault();
                  simRef.current.input.interactJustPressed = true;
                }}
                className={`h-13 sm:h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-all whitespace-nowrap shrink-0 ${
                  canInteractPrompt
                    ? 'px-3.5 bg-[#F2BF59] border-white text-[#172B4D] font-black cursor-pointer'
                    : 'w-12 bg-[#0F1E38]/45 border-white/10 text-[#91C9D8]/35 cursor-not-allowed'
                }`}
              >
                {canInteractPrompt ? (
                  <span className="text-xs font-black">🔥 {canInteractPrompt}</span>
                ) : (
                  <span className="text-xs font-bold font-num">E</span>
                )}
              </button>

              {/* Jump Button */}
              <button
                type="button"
                aria-label="پرش"
                onPointerDown={(e) => {
                  e.preventDefault();
                  simRef.current.input.jumpJustPressed = true;
                }}
                onPointerUp={() => {
                  simRef.current.input.jumpReleased = true;
                }}
                className="w-16 h-13 sm:w-18 sm:h-14 rounded-2xl bg-[#A92342] active:bg-[#D94758] border border-[#F2BF59]/80 text-white flex items-center justify-center shadow-lg cursor-pointer"
              >
                <span className="text-sm font-black leading-none">پرش ↑</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 3: PAUSE MODAL
          ===================================================================== */}
      {gameState === 'paused' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="توقف موقت بازی"
        >
          <div className="w-full max-w-md bg-[#142645] border-2 border-[#F2BF59] rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-xl font-black text-[#F2BF59]">توقف موقت ماجراجویی</h2>
            <div className="grid grid-cols-2 gap-3 bg-[#0F1E38] p-3.5 rounded-xl font-num">
              <div>
                <div className="text-xs text-[#91C9D8]">امتیاز فعلی</div>
                <div className="text-lg font-extrabold text-[#F2BF59]">{hudScore} / 350</div>
              </div>
              <div>
                <div className="text-xs text-[#91C9D8]">زمان باقی‌مانده</div>
                <div className="text-lg font-extrabold text-white">{hudTimeRemaining} ثانیه</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setGameState('playing');
                  yaldaAudio.startMusic();
                }}
                className="w-full py-2.5 rounded-xl bg-[#F2BF59] hover:bg-[#ffd073] text-[#172B4D] font-black text-sm cursor-pointer"
              >
                ادامه بازی (Resume)
              </button>
              <button
                type="button"
                onClick={() => startNewRun(true)}
                className="w-full py-2.5 rounded-xl bg-[#A92342] hover:bg-[#D94758] text-white font-bold text-sm cursor-pointer"
              >
                شروع مجدد از ابتدا (Restart)
              </button>
              <button
                type="button"
                onClick={() => {
                  yaldaAudio.stopMusic();
                  setGameState('title');
                }}
                className="w-full py-2.5 rounded-xl bg-[#172B4D] hover:bg-[#223E6B] border border-white/15 text-[#91C9D8] hover:text-white font-bold text-sm cursor-pointer"
              >
                بازگشت به صفحه عنوان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 4: RESULT MODAL ('gameover')
          ===================================================================== */}
      <ResultModal
        open={gameState === 'gameover'}
        finalScore={finalRunSnapshot.score}
        finishReached={finalRunSnapshot.finishReached}
        elapsedSec={finalRunSnapshot.elapsedSec}
        profile={profile}
        serverSyncError={serverSyncError}
        onRetryServerSync={() => syncScoreWithServer(finalRunSnapshot)}
        onPlayAgain={() => startNewRun(true)}
        onProfileUpdated={(next) => setProfile({ ...next })}
        onOpenDeliverables={() => setDeliverablesOpen(true)}
      />

      {/* =====================================================================
          HARVEST MOON-STYLE BOOTH DIALOGUE MODAL (Inside Yalda Bazaar)
          ===================================================================== */}
      {activeDialogueBooth && (
        <HarvestMoonDialogueModal
          boothType={activeDialogueBooth}
          onCompleteClaim={handleBoothDialogueComplete}
          onClose={() => {
            activeDialogueRef.current = null;
            simRef.current.input.interactJustPressed = false;
            setActiveDialogueBooth(null);
            canvasRef.current?.focus();
          }}
        />
      )}

      {/* =====================================================================
          HAFEZ FAL VERTICAL BOOK-EDGE FORTUNE MODAL (غرفه فال حافظ)
          ===================================================================== */}
      {hafezModalOpen && (
        <HafezFalModal
          alreadyClaimed={hudHafezClaimed || simRef.current.run.hafezFalClaimed}
          pointsReward={HAFEZ_FAL_POINTS}
          onTakeFortune={handleTakeHafezFortune}
          onClose={() => {
            hafezModalOpenRef.current = false;
            simRef.current.input.interactJustPressed = false;
            setHafezModalOpen(false);
            canvasRef.current?.focus();
          }}
        />
      )}

      {/* =====================================================================
          DELIVERABLES & SPRITE SHEET MODAL (GDD / Visual / Manifest / API / QA)
          ===================================================================== */}
      <DeliverablesModal
        open={deliverablesOpen}
        onClose={() => setDeliverablesOpen(false)}
      />
    </main>
  );
}
