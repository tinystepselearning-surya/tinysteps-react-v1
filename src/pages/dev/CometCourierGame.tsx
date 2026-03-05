import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type Mode = 'menu' | 'playing' | 'paused' | 'won' | 'lost';

type Vec = {
  x: number;
  y: number;
};

type Player = {
  pos: Vec;
  vel: Vec;
  radius: number;
  shields: number;
  dashTimer: number;
  dashCooldown: number;
  invulnerable: number;
  collected: number;
  lastMove: Vec;
};

type Shard = {
  id: number;
  pos: Vec;
  radius: number;
  collected: boolean;
};

type Drone = {
  id: number;
  anchor: Vec;
  pos: Vec;
  radius: number;
  orbitX: number;
  orbitY: number;
  speed: number;
  phase: number;
};

type Asteroid = {
  id: number;
  pos: Vec;
  radius: number;
};

type Portal = {
  pos: Vec;
  radius: number;
  unlocked: boolean;
};

type GameState = {
  mode: Mode;
  score: number;
  timeLeft: number;
  frame: number;
  pulse: number;
  collisionFlash: number;
  player: Player;
  shards: Shard[];
  drones: Drone[];
  asteroids: Asteroid[];
  portal: Portal;
  resultText: string;
};

type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  dashQueued: boolean;
};

type UiState = {
  mode: Mode;
  isFullscreen: boolean;
  resultText: string;
};

type SfxName = 'start' | 'dash' | 'collect' | 'hit' | 'win' | 'lose' | 'pause' | 'resume';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void | Promise<void>;
    webkitAudioContext?: typeof AudioContext;
  }
}

const WORLD = {
  width: 960,
  height: 600,
};

const DISPLAY_FONT = '"Fredoka", "Trebuchet MS", "Avenir Next", sans-serif';
const BASE_SPEED = 215;
const DASH_SPEED = 460;
const DASH_DURATION = 0.2;
const DASH_COOLDOWN = 1.3;
const PLAYER_RADIUS = 18;
const TOTAL_TIME = 70;
const HIT_INVULNERABILITY = 1.1;

const STARFIELD = [
  { x: 0.08, y: 0.14, size: 2.4, alpha: 0.8 },
  { x: 0.2, y: 0.32, size: 1.8, alpha: 0.55 },
  { x: 0.34, y: 0.16, size: 2.1, alpha: 0.72 },
  { x: 0.41, y: 0.74, size: 2.7, alpha: 0.78 },
  { x: 0.56, y: 0.27, size: 1.7, alpha: 0.5 },
  { x: 0.67, y: 0.1, size: 2.6, alpha: 0.88 },
  { x: 0.82, y: 0.24, size: 1.9, alpha: 0.64 },
  { x: 0.91, y: 0.62, size: 2.5, alpha: 0.8 },
  { x: 0.74, y: 0.78, size: 1.5, alpha: 0.52 },
  { x: 0.12, y: 0.8, size: 2.2, alpha: 0.7 },
  { x: 0.48, y: 0.49, size: 1.4, alpha: 0.42 },
  { x: 0.88, y: 0.46, size: 2.8, alpha: 0.75 },
];

const ASTEROIDS: Asteroid[] = [
  { id: 1, pos: { x: 272, y: 190 }, radius: 54 },
  { id: 2, pos: { x: 534, y: 354 }, radius: 72 },
  { id: 3, pos: { x: 726, y: 182 }, radius: 62 },
];

const SHARD_LAYOUT: Shard[] = [
  { id: 1, pos: { x: 156, y: 122 }, radius: 14, collected: false },
  { id: 2, pos: { x: 435, y: 510 }, radius: 14, collected: false },
  { id: 3, pos: { x: 674, y: 412 }, radius: 14, collected: false },
  { id: 4, pos: { x: 852, y: 122 }, radius: 14, collected: false },
];

const DRONE_LAYOUT: Drone[] = [
  {
    id: 1,
    anchor: { x: 348, y: 442 },
    pos: { x: 348, y: 442 },
    radius: 18,
    orbitX: 74,
    orbitY: 58,
    speed: 1.4,
    phase: 0.2,
  },
  {
    id: 2,
    anchor: { x: 708, y: 402 },
    pos: { x: 708, y: 402 },
    radius: 20,
    orbitX: 64,
    orbitY: 38,
    speed: 1.05,
    phase: 1.5,
  },
];

const round = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const magnitude = (vector: Vec) => Math.hypot(vector.x, vector.y);
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

const normalize = (vector: Vec): Vec => {
  const length = magnitude(vector);
  if (length < 0.0001) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
};

const createInitialState = (): GameState => ({
  mode: 'menu',
  score: 0,
  timeLeft: TOTAL_TIME,
  frame: 0,
  pulse: 0,
  collisionFlash: 0,
  player: {
    pos: { x: 76, y: 306 },
    vel: { x: 0, y: 0 },
    radius: PLAYER_RADIUS,
    shields: 3,
    dashTimer: 0,
    dashCooldown: 0,
    invulnerable: 0,
    collected: 0,
    lastMove: { x: 1, y: 0 },
  },
  shards: SHARD_LAYOUT.map((shard) => ({ ...shard, pos: { ...shard.pos } })),
  drones: DRONE_LAYOUT.map((drone) => ({
    ...drone,
    anchor: { ...drone.anchor },
    pos: { ...drone.pos },
  })),
  asteroids: ASTEROIDS.map((asteroid) => ({ ...asteroid, pos: { ...asteroid.pos } })),
  portal: {
    pos: { x: 892, y: 490 },
    radius: 28,
    unlocked: false,
  },
  resultText: 'Tap start to help Nova collect all the stars.',
});

const snapshotUi = (state: GameState, isFullscreen: boolean): UiState => ({
  mode: state.mode,
  isFullscreen,
  resultText: state.resultText,
});

const resolveCircleCollision = (pos: Vec, radius: number, obstacle: Asteroid) => {
  const dx = pos.x - obstacle.pos.x;
  const dy = pos.y - obstacle.pos.y;
  const overlap = radius + obstacle.radius - Math.hypot(dx, dy);

  if (overlap > 0) {
    const direction = normalize({ x: dx || 1, y: dy });
    pos.x += direction.x * overlap;
    pos.y += direction.y * overlap;
  }
};

const drawRoundedPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  radius = 20,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
};

const drawStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  innerRadius: number,
  color: string,
  rotation = 0,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = (Math.PI / 5) * point - Math.PI / 2;
    const nextRadius = point % 2 === 0 ? radius : innerRadius;
    const px = Math.cos(angle) * nextRadius;
    const py = Math.sin(angle) * nextRadius;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

const CometCourierGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<GameState>(createInitialState());
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    dashQueued: false,
  });
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAutomated = useMemo(() => typeof navigator !== 'undefined' && navigator.webdriver, []);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';
  const inKidsHub = location.pathname.startsWith('/kids/games/comet-courier');
  const [uiState, setUiState] = useState<UiState>(() => snapshotUi(gameRef.current, !!document.fullscreenElement));
  const [soundReady, setSoundReady] = useState(false);

  const syncUi = useCallback(() => {
    setUiState(snapshotUi(gameRef.current, !!document.fullscreenElement));
  }, []);

  const armAudio = useCallback(async () => {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setSoundReady(audioContextRef.current.state === 'running');
  }, []);

  const playSfx = useCallback((name: SfxName) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.0001, now);

    const note = (time: number, frequency: number, duration: number, type: OscillatorType, peak = 0.06) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, time);
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peak, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.start(time);
      osc.stop(time + duration + 0.03);
    };

    switch (name) {
      case 'start':
        note(now, 392, 0.12, 'triangle', 0.07);
        note(now + 0.08, 523.25, 0.14, 'triangle', 0.07);
        note(now + 0.16, 659.25, 0.18, 'sine', 0.06);
        break;
      case 'dash':
        note(now, 280, 0.08, 'sawtooth', 0.05);
        note(now + 0.03, 460, 0.08, 'triangle', 0.04);
        break;
      case 'collect':
        note(now, 660, 0.08, 'triangle', 0.05);
        note(now + 0.07, 880, 0.12, 'triangle', 0.06);
        break;
      case 'hit':
        note(now, 170, 0.18, 'sawtooth', 0.06);
        note(now + 0.04, 120, 0.16, 'square', 0.04);
        break;
      case 'win':
        note(now, 523.25, 0.12, 'triangle', 0.05);
        note(now + 0.08, 659.25, 0.14, 'triangle', 0.06);
        note(now + 0.16, 783.99, 0.18, 'triangle', 0.06);
        note(now + 0.26, 1046.5, 0.22, 'sine', 0.06);
        break;
      case 'lose':
        note(now, 220, 0.14, 'square', 0.05);
        note(now + 0.12, 185, 0.18, 'square', 0.04);
        note(now + 0.24, 147, 0.22, 'triangle', 0.04);
        break;
      case 'pause':
        note(now, 330, 0.08, 'triangle', 0.04);
        break;
      case 'resume':
        note(now, 392, 0.08, 'triangle', 0.04);
        note(now + 0.05, 494, 0.1, 'triangle', 0.04);
        break;
      default:
        break;
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = WORLD;
    const state = gameRef.current;
    const shimmer = 0.5 + 0.5 * Math.sin(state.pulse * 2.8);

    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#06111f');
    background.addColorStop(0.36, '#11345b');
    background.addColorStop(0.7, '#0d2340');
    background.addColorStop(1, '#183f52');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const topGlow = ctx.createRadialGradient(190, 105, 30, 190, 105, 250);
    topGlow.addColorStop(0, 'rgba(106, 245, 255, 0.26)');
    topGlow.addColorStop(1, 'rgba(106, 245, 255, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    const lowerGlow = ctx.createRadialGradient(820, 470, 45, 820, 470, 320);
    lowerGlow.addColorStop(0, 'rgba(255, 193, 115, 0.24)');
    lowerGlow.addColorStop(1, 'rgba(255, 193, 115, 0)');
    ctx.fillStyle = lowerGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, width, 34);

    STARFIELD.forEach((star, index) => {
      const twinkle = 0.3 * Math.sin(state.pulse * 2.4 + index);
      ctx.fillStyle = `rgba(255, 255, 255, ${clamp(star.alpha + twinkle, 0.2, 1)})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let x = 28; x <= width - 20; x += 110) {
      ctx.strokeStyle = 'rgba(150, 235, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 26);
      ctx.lineTo(x - 18, height - 34);
      ctx.stroke();
    }

    drawStar(ctx, 132, 90, 14, 7, `rgba(255, 240, 165, ${0.85 + shimmer * 0.1})`, state.pulse * 0.5);
    drawStar(ctx, 830, 96, 16, 8, `rgba(173, 245, 255, ${0.75 + shimmer * 0.12})`, -state.pulse * 0.4);

    state.asteroids.forEach((asteroid, index) => {
      const rock = ctx.createRadialGradient(
        asteroid.pos.x - asteroid.radius * 0.38,
        asteroid.pos.y - asteroid.radius * 0.42,
        asteroid.radius * 0.18,
        asteroid.pos.x,
        asteroid.pos.y,
        asteroid.radius,
      );
      rock.addColorStop(0, index % 2 === 0 ? '#e5ded6' : '#d8cfc8');
      rock.addColorStop(0.45, '#9b8f86');
      rock.addColorStop(1, '#514b48');
      ctx.fillStyle = rock;
      ctx.beginPath();
      ctx.arc(asteroid.pos.x, asteroid.pos.y, asteroid.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(asteroid.pos.x - asteroid.radius * 0.1, asteroid.pos.y - asteroid.radius * 0.06, asteroid.radius * 0.56, 0, Math.PI * 2);
      ctx.stroke();
    });

    state.shards.forEach((shard, index) => {
      if (shard.collected) return;
      const glow = 0.55 + 0.2 * Math.sin(state.pulse * 4 + index);
      ctx.save();
      ctx.translate(shard.pos.x, shard.pos.y);
      ctx.rotate(state.pulse * 0.7 + index);
      ctx.shadowColor = 'rgba(143, 248, 255, 0.82)';
      ctx.shadowBlur = 20;
      drawStar(ctx, 0, 0, 18, 8, `rgba(143, 248, 255, ${glow})`, 0);
      ctx.restore();
    });

    state.portal.unlocked = state.player.collected === state.shards.length;
    const portalPulse = 0.7 + 0.24 * Math.sin(state.pulse * 3.2);
    ctx.save();
    ctx.translate(state.portal.pos.x, state.portal.pos.y);
    ctx.shadowBlur = state.portal.unlocked ? 28 : 0;
    ctx.shadowColor = 'rgba(119, 255, 198, 0.72)';
    ctx.strokeStyle = state.portal.unlocked ? `rgba(119, 255, 198, ${portalPulse})` : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, state.portal.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = state.portal.unlocked ? 'rgba(240, 255, 247, 0.95)' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, state.portal.radius - 10, 0, Math.PI * 2);
    ctx.stroke();
    if (state.portal.unlocked) {
      drawStar(ctx, 0, -46, 9, 4, 'rgba(255, 244, 183, 0.85)', state.pulse);
      drawStar(ctx, -38, 18, 7, 3, 'rgba(175, 255, 220, 0.8)', -state.pulse * 1.4);
    }
    ctx.restore();

    state.drones.forEach((drone, index) => {
      const dronePulse = 0.56 + 0.2 * Math.sin(state.pulse * 5 + index);
      ctx.save();
      ctx.translate(drone.pos.x, drone.pos.y);
      ctx.rotate(state.pulse * 2.3 + index);
      ctx.shadowColor = 'rgba(255, 114, 87, 0.72)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(255, 114, 87, ${dronePulse})`;
      ctx.beginPath();
      ctx.moveTo(0, -drone.radius);
      ctx.lineTo(drone.radius * 0.9, 0);
      ctx.lineTo(0, drone.radius);
      ctx.lineTo(-drone.radius * 0.9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 230, 204, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const trailLength = state.player.dashTimer > 0 ? 5 : 3;
    for (let index = trailLength; index >= 1; index -= 1) {
      const offset = index * 15;
      const alpha = state.player.dashTimer > 0 ? 0.11 + index * 0.05 : 0.06 + index * 0.03;
      const trailX = state.player.pos.x - state.player.lastMove.x * offset;
      const trailY = state.player.pos.y - state.player.lastMove.y * offset;
      ctx.save();
      ctx.fillStyle = `rgba(255, 232, 160, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(trailX, trailY, 18 - index * 2.2, 10 - index, Math.atan2(state.player.lastMove.y, state.player.lastMove.x), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const playerGlow = state.player.invulnerable > 0 ? 0.52 : 0.2;
    ctx.save();
    ctx.translate(state.player.pos.x, state.player.pos.y);
    ctx.rotate(Math.atan2(state.player.lastMove.y, state.player.lastMove.x) + Math.PI / 2);
    ctx.shadowColor = `rgba(255, 232, 160, ${0.6 + playerGlow})`;
    ctx.shadowBlur = 28;
    ctx.fillStyle = state.player.dashTimer > 0 ? '#fff3ab' : '#ffe28e';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(20, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(-20, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff936a';
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(0, 38 + (state.player.dashTimer > 0 ? 10 : 0));
    ctx.lineTo(7, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff8cf';
    ctx.beginPath();
    ctx.arc(0, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (state.collisionFlash > 0) {
      ctx.fillStyle = `rgba(255, 74, 74, ${state.collisionFlash * 0.22})`;
      ctx.fillRect(0, 0, width, height);
    }

    drawRoundedPanel(ctx, 18, 16, 300, 102, 'rgba(4, 10, 22, 0.58)', 'rgba(177, 236, 255, 0.22)', 22);
    ctx.fillStyle = '#f6fbff';
    ctx.font = `600 26px ${DISPLAY_FONT}`;
    ctx.fillText(`Score ${state.score}`, 34, 48);
    ctx.font = `500 18px ${DISPLAY_FONT}`;
    ctx.fillStyle = '#b0efff';
    ctx.fillText(`Stars ${state.player.collected}/${state.shards.length}`, 34, 76);
    ctx.fillText(`Shields ${state.player.shields}   Time ${Math.ceil(state.timeLeft)}`, 34, 102);

    drawRoundedPanel(ctx, 698, 16, 244, 96, 'rgba(6, 12, 24, 0.52)', 'rgba(255, 220, 165, 0.24)', 22);
    ctx.fillStyle = '#ffe8b3';
    ctx.font = `600 18px ${DISPLAY_FONT}`;
    ctx.fillText(state.portal.unlocked ? 'Portal online' : 'Collect all stars', 718, 48);
    ctx.fillStyle = '#ffd59e';
    ctx.font = `500 16px ${DISPLAY_FONT}`;
    ctx.fillText(state.player.dashCooldown <= 0 ? 'Dash ready' : `Dash ${state.player.dashCooldown.toFixed(1)}s`, 718, 76);
    ctx.fillText(soundReady ? 'Sparkle sound on' : 'Tap any button for sound', 718, 98);

    if (state.mode !== 'playing') {
      ctx.fillStyle = 'rgba(3, 8, 16, 0.58)';
      ctx.fillRect(0, 0, width, height);
    }

    if (state.mode === 'menu') {
      drawRoundedPanel(ctx, 146, 112, 668, 372, 'rgba(5, 18, 33, 0.9)', 'rgba(126, 240, 213, 0.45)', 28);
      drawStar(ctx, 224, 184, 22, 10, 'rgba(255, 240, 170, 0.95)', state.pulse * 0.3);
      drawStar(ctx, 738, 176, 18, 8, 'rgba(160, 244, 255, 0.9)', -state.pulse * 0.5);
      ctx.fillStyle = '#f9fdff';
      ctx.font = `700 54px ${DISPLAY_FONT}`;
      ctx.fillText('Comet Courier', 288, 188);
      ctx.fillStyle = '#aef3ff';
      ctx.font = `500 28px ${DISPLAY_FONT}`;
      ctx.fillText('Help Nova scoop up every star before the portal closes.', 206, 236);

      drawRoundedPanel(ctx, 194, 268, 258, 150, 'rgba(11, 33, 48, 0.88)', 'rgba(162, 235, 255, 0.22)', 20);
      drawRoundedPanel(ctx, 506, 268, 258, 150, 'rgba(20, 30, 44, 0.88)', 'rgba(255, 214, 149, 0.22)', 20);
      ctx.fillStyle = '#fff3c0';
      ctx.font = `600 24px ${DISPLAY_FONT}`;
      ctx.fillText('Mission', 232, 304);
      ctx.fillStyle = '#caf8ff';
      ctx.font = `500 20px ${DISPLAY_FONT}`;
      ctx.fillText('Collect 4 stars.', 232, 338);
      ctx.fillText('Avoid red drones.', 232, 368);
      ctx.fillText('Fly into the green portal.', 232, 398);

      ctx.fillStyle = '#ffe2a5';
      ctx.font = `600 24px ${DISPLAY_FONT}`;
      ctx.fillText('Controls', 542, 304);
      ctx.fillStyle = '#fff4d3';
      ctx.font = `500 20px ${DISPLAY_FONT}`;
      ctx.fillText('Arrow keys = steer', 542, 338);
      ctx.fillText('Space = comet dash', 542, 368);
      ctx.fillText('Enter starts a fresh run', 542, 398);

      ctx.fillStyle = '#d1ffe6';
      ctx.font = `600 22px ${DISPLAY_FONT}`;
      ctx.fillText('Use the big Launch Mission button above to begin.', 214, 450);
    }

    if (state.mode === 'paused') {
      drawRoundedPanel(ctx, 280, 200, 400, 180, 'rgba(5, 18, 33, 0.88)', 'rgba(162, 235, 255, 0.35)', 26);
      ctx.fillStyle = '#f5fbff';
      ctx.font = `700 48px ${DISPLAY_FONT}`;
      ctx.fillText('Paused', 404, 266);
      ctx.fillStyle = '#b7efff';
      ctx.font = `500 24px ${DISPLAY_FONT}`;
      ctx.fillText('Catch your breath, then press P or Pause.', 318, 314);
      ctx.fillText('Nova is holding position.', 374, 348);
    }

    if (state.mode === 'won' || state.mode === 'lost') {
      const success = state.mode === 'won';
      drawRoundedPanel(
        ctx,
        238,
        168,
        484,
        232,
        success ? 'rgba(4, 34, 28, 0.9)' : 'rgba(47, 16, 19, 0.9)',
        success ? 'rgba(118, 255, 206, 0.45)' : 'rgba(255, 175, 175, 0.34)',
        28,
      );
      ctx.fillStyle = '#fbfeff';
      ctx.font = `700 56px ${DISPLAY_FONT}`;
      ctx.fillText(success ? 'Mission Complete' : 'Mission Failed', 304, 248);
      ctx.font = `500 26px ${DISPLAY_FONT}`;
      ctx.fillStyle = success ? '#c7ffe8' : '#ffd5c7';
      ctx.fillText(state.resultText, 286, 304);
      ctx.fillText(success ? 'Press Enter or Start to play again.' : 'Press Enter or Restart to try again.', 284, 354);
      if (success) {
        drawStar(ctx, 270, 196, 12, 5, 'rgba(255, 241, 176, 0.92)', state.pulse * 1.4);
        drawStar(ctx, 692, 202, 14, 6, 'rgba(166, 255, 220, 0.88)', -state.pulse * 1.2);
      }
    }
  }, [soundReady]);

  const syncTextState = useCallback(() => {
    window.render_game_to_text = () => {
      const state = gameRef.current;
      return JSON.stringify({
        coordinateSystem: 'origin at top-left; x increases right; y increases down',
        mode: state.mode,
        score: state.score,
        timeLeft: round(state.timeLeft),
        fullscreen: !!document.fullscreenElement,
        soundReady,
        player: {
          x: round(state.player.pos.x),
          y: round(state.player.pos.y),
          vx: round(state.player.vel.x),
          vy: round(state.player.vel.y),
          radius: state.player.radius,
          shields: state.player.shields,
          dashReady: state.player.dashCooldown <= 0,
          dashCooldown: round(state.player.dashCooldown),
          invulnerable: round(state.player.invulnerable),
          collected: state.player.collected,
        },
        portal: {
          x: state.portal.pos.x,
          y: state.portal.pos.y,
          radius: state.portal.radius,
          unlocked: state.portal.unlocked,
        },
        shards: state.shards.filter((shard) => !shard.collected).map((shard) => ({
          id: shard.id,
          x: shard.pos.x,
          y: shard.pos.y,
          radius: shard.radius,
        })),
        drones: state.drones.map((drone) => ({
          id: drone.id,
          x: round(drone.pos.x),
          y: round(drone.pos.y),
          radius: drone.radius,
        })),
        asteroids: state.asteroids.map((asteroid) => ({
          id: asteroid.id,
          x: asteroid.pos.x,
          y: asteroid.pos.y,
          radius: asteroid.radius,
        })),
        objective: state.portal.unlocked ? 'enter portal' : 'collect remaining stars',
        resultText: state.resultText,
      });
    };
  }, [soundReady]);

  const startRun = useCallback(() => {
    const next = createInitialState();
    next.mode = 'playing';
    next.resultText = 'Sweep the star lane, then zoom to the portal.';
    gameRef.current = next;
    lastTickRef.current = 0;
    playSfx('start');
    syncUi();
    render();
  }, [playSfx, render, syncUi]);

  const launchMission = useCallback(async () => {
    await armAudio();
    startRun();
  }, [armAudio, startRun]);

  const restartRun = useCallback(async () => {
    await armAudio();
    startRun();
  }, [armAudio, startRun]);

  const togglePause = useCallback(async () => {
    const state = gameRef.current;
    if (state.mode !== 'playing' && state.mode !== 'paused') return;

    await armAudio();
    if (state.mode === 'playing') {
      state.mode = 'paused';
      state.resultText = 'Paused mid-flight.';
      playSfx('pause');
    } else {
      state.mode = 'playing';
      state.resultText = 'Nova is back on course.';
      lastTickRef.current = 0;
      playSfx('resume');
    }
    syncUi();
    render();
  }, [armAudio, playSfx, render, syncUi]);

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;

    if (!document.fullscreenElement) {
      await shell.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    syncUi();
    render();
  }, [render, syncUi]);

  const stepSimulation = useCallback((dt: number) => {
    const state = gameRef.current;
    state.collisionFlash = Math.max(0, state.collisionFlash - dt * 1.8);
    state.pulse += dt;

    state.drones.forEach((drone) => {
      drone.phase += dt * drone.speed;
      drone.pos.x = drone.anchor.x + Math.cos(drone.phase) * drone.orbitX;
      drone.pos.y = drone.anchor.y + Math.sin(drone.phase * 1.1) * drone.orbitY;
    });

    if (state.mode !== 'playing') {
      return;
    }

    state.frame += 1;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.player.dashTimer = Math.max(0, state.player.dashTimer - dt);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - dt);

    const input = inputRef.current;
    const movement = normalize({
      x: (input.right ? 1 : 0) - (input.left ? 1 : 0),
      y: (input.down ? 1 : 0) - (input.up ? 1 : 0),
    });

    if (movement.x !== 0 || movement.y !== 0) {
      state.player.lastMove = movement;
    }

    if (input.dashQueued && state.player.dashCooldown <= 0) {
      state.player.dashTimer = DASH_DURATION;
      state.player.dashCooldown = DASH_COOLDOWN;
      input.dashQueued = false;
      playSfx('dash');
    }

    const moveDirection = state.player.dashTimer > 0 ? state.player.lastMove : movement;
    const speed = state.player.dashTimer > 0 ? DASH_SPEED : BASE_SPEED;
    state.player.vel = {
      x: moveDirection.x * speed,
      y: moveDirection.y * speed,
    };

    state.player.pos.x += state.player.vel.x * dt;
    state.player.pos.y += state.player.vel.y * dt;

    state.player.pos.x = clamp(state.player.pos.x, state.player.radius, WORLD.width - state.player.radius);
    state.player.pos.y = clamp(state.player.pos.y, state.player.radius, WORLD.height - state.player.radius);

    state.asteroids.forEach((asteroid) => {
      resolveCircleCollision(state.player.pos, state.player.radius, asteroid);
    });

    state.shards.forEach((shard) => {
      if (shard.collected) return;
      if (distance(state.player.pos, shard.pos) <= state.player.radius + shard.radius + 3) {
        shard.collected = true;
        state.player.collected += 1;
        state.score += 150;
        playSfx('collect');
        state.resultText = state.player.collected === state.shards.length
          ? 'Portal online. Dash to the glowing green ring.'
          : `Sparkle secured. ${state.shards.length - state.player.collected} stars left.`;
      }
    });

    state.portal.unlocked = state.player.collected === state.shards.length;

    state.drones.forEach((drone) => {
      if (state.player.invulnerable > 0) return;
      if (distance(state.player.pos, drone.pos) <= state.player.radius + drone.radius) {
        state.player.shields -= 1;
        state.player.invulnerable = HIT_INVULNERABILITY;
        state.collisionFlash = 1;
        playSfx('hit');
        const knockback = normalize({
          x: state.player.pos.x - drone.pos.x,
          y: state.player.pos.y - drone.pos.y,
        });
        state.player.pos.x = clamp(state.player.pos.x + knockback.x * 34, state.player.radius, WORLD.width - state.player.radius);
        state.player.pos.y = clamp(state.player.pos.y + knockback.y * 34, state.player.radius, WORLD.height - state.player.radius);
        state.resultText = state.player.shields > 0 ? 'Ouch. Red drone bump. Keep going.' : 'Nova ran out of shields.';
      }
    });

    if (state.portal.unlocked && distance(state.player.pos, state.portal.pos) <= state.player.radius + state.portal.radius + 2) {
      state.mode = 'won';
      state.score += Math.ceil(state.timeLeft) * 25;
      state.resultText = `All stars delivered with ${Math.ceil(state.timeLeft)}s left.`;
      playSfx('win');
      syncUi();
    }

    if (state.player.shields <= 0 || state.timeLeft <= 0) {
      state.mode = 'lost';
      state.resultText = state.player.shields <= 0 ? 'The red drones drained every shield.' : 'The portal window closed before delivery.';
      playSfx('lose');
      syncUi();
    }
  }, [playSfx, syncUi]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(WORLD.width * dpr);
    canvas.height = Math.floor(WORLD.height * dpr);
    canvas.style.width = `${WORLD.width}px`;
    canvas.style.height = `${WORLD.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }, [render]);

  useEffect(() => {
    syncTextState();
    resizeCanvas();

    const onResize = () => resizeCanvas();
    const onFullscreenChange = () => {
      syncUi();
      resizeCanvas();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup') inputRef.current.up = true;
      if (key === 'arrowdown') inputRef.current.down = true;
      if (key === 'arrowleft') inputRef.current.left = true;
      if (key === 'arrowright') inputRef.current.right = true;

      if (key === ' ' || key === 'spacebar') {
        void armAudio();
        inputRef.current.dashQueued = true;
        event.preventDefault();
      }

      if (key === 'enter') {
        void armAudio();
        const mode = gameRef.current.mode;
        if (mode === 'menu' || mode === 'won' || mode === 'lost') {
          startRun();
          event.preventDefault();
        }
      }

      if (key === 'p' || key === 'a') {
        if (gameRef.current.mode === 'playing' || gameRef.current.mode === 'paused') {
          void togglePause();
          event.preventDefault();
        }
      }

      if (key === 'r') {
        void restartRun();
        event.preventDefault();
      }

      if (key === 'f' || key === 'b') {
        void toggleFullscreen();
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup') inputRef.current.up = false;
      if (key === 'arrowdown') inputRef.current.down = false;
      if (key === 'arrowleft') inputRef.current.left = false;
      if (key === 'arrowright') inputRef.current.right = false;
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let index = 0; index < steps; index += 1) {
        stepSimulation(1 / 60);
      }
      render();
      return Promise.resolve();
    };

    if (!isAutomated) {
      const loop = (time: number) => {
        if (!lastTickRef.current) lastTickRef.current = time;
        const dt = Math.min(0.033, (time - lastTickRef.current) / 1000);
        lastTickRef.current = time;
        stepSimulation(dt);
        render();
        animationRef.current = window.requestAnimationFrame(loop);
      };

      animationRef.current = window.requestAnimationFrame(loop);
    } else {
      render();
    }

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [armAudio, isAutomated, render, resizeCanvas, restartRun, startRun, stepSimulation, syncTextState, syncUi, toggleFullscreen, togglePause]);

  const hudBadgeStyle: React.CSSProperties = {
    border: '1px solid rgba(181, 236, 255, 0.18)',
    background: 'rgba(4, 12, 22, 0.58)',
    color: '#f4fbff',
    padding: '10px 16px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontFamily: DISPLAY_FONT,
  };

  const stageWidth = uiState.isFullscreen ? 'min(100vw - 48px, 1320px)' : 'min(100%, 960px)';
  const routeLabel = inKidsHub ? 'Kids Games Hub' : 'Dev Preview';

  return (
    <div
      ref={shellRef}
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(circle at 18% 18%, #244d7d 0%, #0a1627 45%, #04070d 100%)',
      }}
    >
      <div
        style={{
          width: uiState.isFullscreen ? 'min(100%, 1380px)' : 'min(100%, 1120px)',
          display: 'grid',
          gap: 20,
          justifyItems: 'center',
        }}
      >
        <div
          style={{
            width: 'min(100%, 1080px)',
            display: 'grid',
            gap: 14,
            color: '#effcff',
            fontFamily: DISPLAY_FONT,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={hudBadgeStyle}>{routeLabel}</span>
                <span style={hudBadgeStyle}>{uiState.mode}</span>
                <span style={hudBadgeStyle}>{soundReady ? 'Sound ready' : 'Tap start for sound'}</span>
              </div>
              <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '0.02em' }}>Comet Courier</div>
              <div style={{ color: '#bcefff', fontSize: 18, maxWidth: 760 }}>
                Help Nova zip through the star lanes, gather glowing sparks, and escape through the happy green portal before the red drones catch up.
              </div>
            </div>
            {inKidsHub && (
              <button
                type="button"
                onClick={() => navigate(`/kids/games${kidId ? `?kidId=${encodeURIComponent(kidId)}` : ''}`)}
                style={{
                  ...hudBadgeStyle,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(182,235,255,0.12))',
                }}
              >
                Back To Games Hub
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              'Collect 4 glowing stars',
              'Space dash zooms through open lanes',
              'Red drones steal shields',
              'Green portal opens after the final star',
            ].map((item) => (
              <span
                key={item}
                style={{
                  padding: '12px 16px',
                  borderRadius: 20,
                  border: '1px solid rgba(169, 236, 255, 0.18)',
                  background: 'rgba(9, 21, 39, 0.58)',
                  color: '#d8f8ff',
                  fontSize: 15,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 'min(100%, 1080px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={hudBadgeStyle}>{inKidsHub ? 'Hub mission unlocked' : 'Standalone game route'}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              id="start-btn"
              type="button"
              onClick={() => void launchMission()}
              style={{
                ...hudBadgeStyle,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #87f1c5, #38d5d0)',
                color: '#032320',
                boxShadow: '0 12px 32px rgba(56, 213, 208, 0.28)',
              }}
            >
              {uiState.mode === 'playing' ? 'Restart Run' : 'Launch Mission'}
            </button>
            <button
              id="pause-btn"
              type="button"
              onClick={() => void togglePause()}
              style={{
                ...hudBadgeStyle,
                cursor: 'pointer',
                opacity: uiState.mode === 'menu' || uiState.mode === 'won' || uiState.mode === 'lost' ? 0.65 : 1,
              }}
            >
              {uiState.mode === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              id="restart-btn"
              type="button"
              onClick={() => void restartRun()}
              style={{
                ...hudBadgeStyle,
                cursor: 'pointer',
              }}
            >
              Restart
            </button>
            <button
              id="fullscreen-btn"
              type="button"
              onClick={() => void toggleFullscreen()}
              style={{
                ...hudBadgeStyle,
                cursor: 'pointer',
              }}
            >
              {uiState.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          </div>
        </div>

        <div
          style={{
            width: stageWidth,
            display: 'grid',
            gap: 10,
            justifyItems: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: uiState.isFullscreen ? 1320 : 960,
              aspectRatio: '16 / 10',
              borderRadius: 28,
              border: '2px solid rgba(170, 235, 255, 0.3)',
              boxShadow: '0 32px 72px rgba(0, 0, 0, 0.45)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          />
          <div
            style={{
              color: '#b8dff4',
              fontFamily: DISPLAY_FONT,
              fontSize: 17,
              letterSpacing: '0.03em',
              textAlign: 'center',
            }}
          >
            {uiState.resultText}
          </div>
        </div>

        <div
          style={{
            width: 'min(100%, 1080px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            fontFamily: DISPLAY_FONT,
          }}
        >
          {[
            {
              title: 'Launch Pad',
              body: 'Start in the menu, then guide Nova through the open left lane for the easiest first sparkle.',
              color: 'linear-gradient(135deg, rgba(127, 247, 208, 0.18), rgba(84, 174, 255, 0.12))',
            },
            {
              title: 'Dash Boost',
              body: 'Space gives a short zoom burst. Save it for clean corridors or the final portal run.',
              color: 'linear-gradient(135deg, rgba(255, 226, 139, 0.18), rgba(255, 160, 93, 0.12))',
            },
            {
              title: 'Friendly Audio',
              body: 'Buttons and pickups now sparkle with cheerful synth sounds after your first tap or click.',
              color: 'linear-gradient(135deg, rgba(181, 223, 255, 0.18), rgba(149, 255, 228, 0.12))',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                padding: 18,
                borderRadius: 24,
                border: '1px solid rgba(169, 236, 255, 0.18)',
                background: card.color,
                color: '#f2fbff',
                boxShadow: '0 14px 32px rgba(0, 0, 0, 0.16)',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{card.title}</div>
              <div style={{ color: '#d4f6ff', fontSize: 16, lineHeight: 1.45 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CometCourierGame;
