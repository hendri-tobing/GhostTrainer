/**
 * GhostTrainer Synthetic Biomechanics & Keypoint Generator.
 * Provides realistic MoveNet-compliant 17-keypoint skeletal kinematics
 * for testing and demonstration on Fire TV without a physical USB webcam.
 */

import type { Keypoint, BiomechanicsState } from './poseDetection.ts';
import { analyzeSquatBiomechanics, analyzePushupBiomechanics } from './poseDetection.ts';

export interface SyntheticPoseFrame {
  keypoints: Keypoint[];
  exercise: 'Squat' | 'Push-up';
  repProgress: number; // 0.0 to 1.0
  isFlawInjected: boolean;
  biomechanics: BiomechanicsState | null;
}

/**
 * Generates synthetic MoveNet keypoints for Squats.
 *
 * @param progress Value from 0.0 (standing) -> 0.5 (bottom squat) -> 1.0 (return to standing)
 * @param width Canvas width in pixels (e.g. 1280)
 * @param height Canvas height in pixels (e.g. 720)
 * @param injectChestSag When true, simulates excessive torso forward lean (chest_sag flaw)
 */
export function generateSyntheticSquat(
  progress: number,
  width: number = 1280,
  height: number = 720,
  injectChestSag: boolean = false
): Keypoint[] {
  // Cycle depth factor: 0.0 at standing (0 or 1), 1.0 at bottom (0.5)
  // Using sine wave for natural human acceleration/deceleration
  const cycleFactor = Math.sin(progress * Math.PI);

  const cx = width * 0.5;
  const ankleY = height * 0.84;
  const leftAnkleX = cx - width * 0.06;
  const rightAnkleX = cx + width * 0.07;

  // Knee kinematics: sinks slightly and translates forward during squat
  const standingKneeY = height * 0.65;
  const bottomKneeY = height * 0.68;
  const kneeY = standingKneeY + (bottomKneeY - standingKneeY) * cycleFactor;
  const kneeForwardOffset = width * 0.025 * cycleFactor;

  // Hip kinematics: drops significantly (parallel with or below knees at bottom)
  const standingHipY = height * 0.47;
  const bottomHipY = height * 0.69;
  const hipY = standingHipY + (bottomHipY - standingHipY) * cycleFactor;
  const hipBackOffset = -width * 0.02 * cycleFactor;

  // Shoulder kinematics: follows hips down, torso tilts forward naturally (~25-35 deg)
  const standingShoulderY = height * 0.28;
  const bottomShoulderY = height * 0.49;
  let shoulderY = standingShoulderY + (bottomShoulderY - standingShoulderY) * cycleFactor;
  let shoulderForwardOffset = width * 0.04 * cycleFactor;

  // Injected form flaw: excessive chest forward lean (chest_sag)
  if (injectChestSag && cycleFactor > 0.6) {
    shoulderForwardOffset += width * 0.08 * (cycleFactor - 0.6) * 2.5;
    shoulderY += height * 0.05 * (cycleFactor - 0.6) * 2.5;
  }

  // Head kinematics
  const headY = shoulderY - height * 0.10;
  const headX = cx + shoulderForwardOffset * 0.8;

  // Elbows / Hands held in athletic guard
  const elbowY = shoulderY + height * 0.08;
  const wristY = shoulderY + height * 0.04;

  const conf = 0.95;

  return [
    { name: 'nose', x: headX, y: headY, score: conf },
    { name: 'left_eye', x: headX - 10, y: headY - 8, score: conf },
    { name: 'right_eye', x: headX + 10, y: headY - 8, score: conf },
    { name: 'left_ear', x: headX - 22, y: headY - 4, score: conf },
    { name: 'right_ear', x: headX + 22, y: headY - 4, score: conf },
    { name: 'left_shoulder', x: cx - width * 0.07 + shoulderForwardOffset, y: shoulderY, score: conf },
    { name: 'right_shoulder', x: cx + width * 0.07 + shoulderForwardOffset, y: shoulderY + 4, score: conf },
    { name: 'left_elbow', x: cx - width * 0.10 + shoulderForwardOffset + 15, y: elbowY, score: conf },
    { name: 'right_elbow', x: cx + width * 0.10 + shoulderForwardOffset + 15, y: elbowY + 4, score: conf },
    { name: 'left_wrist', x: cx - width * 0.04 + shoulderForwardOffset + 35, y: wristY, score: conf },
    { name: 'right_wrist', x: cx + width * 0.04 + shoulderForwardOffset + 35, y: wristY + 4, score: conf },
    { name: 'left_hip', x: cx - width * 0.05 + hipBackOffset, y: hipY, score: conf },
    { name: 'right_hip', x: cx + width * 0.05 + hipBackOffset, y: hipY + 4, score: conf },
    { name: 'left_knee', x: leftAnkleX + kneeForwardOffset, y: kneeY, score: conf },
    { name: 'right_knee', x: rightAnkleX + kneeForwardOffset + 10, y: kneeY + 4, score: conf },
    { name: 'left_ankle', x: leftAnkleX, y: ankleY, score: conf },
    { name: 'right_ankle', x: rightAnkleX, y: ankleY, score: conf },
  ];
}

/**
 * Generates synthetic MoveNet keypoints for Push-ups.
 *
 * @param progress Value from 0.0 (top plank) -> 0.5 (bottom chest to deck) -> 1.0 (top plank)
 * @param width Canvas width in pixels
 * @param height Canvas height in pixels
 * @param injectHipSag When true, simulates sagging lower back (hip_sag flaw)
 */
export function generateSyntheticPushup(
  progress: number,
  width: number = 1280,
  height: number = 720,
  injectHipSag: boolean = false
): Keypoint[] {
  const cycleFactor = Math.sin(progress * Math.PI);

  const floorY = height * 0.82;
  const ankleX = width * 0.78;
  const ankleY = floorY - height * 0.04;

  const wristX = width * 0.35;
  const wristY = floorY;

  // Shoulders lower from top plank to floor
  const topShoulderY = floorY - height * 0.28;
  const bottomShoulderY = floorY - height * 0.08;
  const shoulderY = topShoulderY + (bottomShoulderY - topShoulderY) * cycleFactor;
  const shoulderX = wristX + width * 0.01 * cycleFactor;

  // Elbows flex out and back
  const topElbowY = floorY - height * 0.14;
  const bottomElbowY = floorY - height * 0.12;
  const elbowY = topElbowY + (bottomElbowY - topElbowY) * cycleFactor;
  const elbowX = wristX - width * 0.05 * cycleFactor;

  // Hips follow a straight line between shoulder and ankle unless sagging
  const normalHipY = shoulderY + (ankleY - shoulderY) * 0.45;
  const hipSagOffset = injectHipSag && cycleFactor > 0.5 ? height * 0.09 * (cycleFactor - 0.5) * 2.0 : 0;
  const hipY = normalHipY + hipSagOffset;
  const hipX = shoulderX + (ankleX - shoulderX) * 0.45;

  const kneeX = hipX + (ankleX - hipX) * 0.5;
  const kneeY = hipY + (ankleY - hipY) * 0.5;

  const headX = shoulderX - width * 0.07;
  const headY = shoulderY - height * 0.03;

  const conf = 0.95;

  return [
    { name: 'nose', x: headX, y: headY, score: conf },
    { name: 'left_eye', x: headX + 4, y: headY - 6, score: conf },
    { name: 'right_eye', x: headX + 8, y: headY - 4, score: conf },
    { name: 'left_ear', x: headX + 16, y: headY - 6, score: conf },
    { name: 'right_ear', x: headX + 20, y: headY - 4, score: conf },
    { name: 'left_shoulder', x: shoulderX, y: shoulderY, score: conf },
    { name: 'right_shoulder', x: shoulderX + 10, y: shoulderY - 8, score: conf },
    { name: 'left_elbow', x: elbowX, y: elbowY, score: conf },
    { name: 'right_elbow', x: elbowX + 10, y: elbowY - 8, score: conf },
    { name: 'left_wrist', x: wristX, y: wristY, score: conf },
    { name: 'right_wrist', x: wristX + 10, y: wristY - 6, score: conf },
    { name: 'left_hip', x: hipX, y: hipY, score: conf },
    { name: 'right_hip', x: hipX + 8, y: hipY - 6, score: conf },
    { name: 'left_knee', x: kneeX, y: kneeY, score: conf },
    { name: 'right_knee', x: kneeX + 8, y: kneeY - 6, score: conf },
    { name: 'left_ankle', x: ankleX, y: ankleY, score: conf },
    { name: 'right_ankle', x: ankleX + 8, y: ankleY - 4, score: conf },
  ];
}

/**
 * Computes a synthetic frame for the active exercise and rep progress.
 */
export function getSyntheticPoseFrame(
  exercise: 'Squat' | 'Push-up',
  repProgress: number,
  width: number,
  height: number,
  injectFlaw: boolean = false
): SyntheticPoseFrame {
  const keypoints =
    exercise === 'Squat'
      ? generateSyntheticSquat(repProgress, width, height, injectFlaw)
      : generateSyntheticPushup(repProgress, width, height, injectFlaw);

  const biomechanics =
    exercise === 'Squat'
      ? analyzeSquatBiomechanics(keypoints)
      : analyzePushupBiomechanics(keypoints);

  return {
    keypoints,
    exercise,
    repProgress,
    isFlawInjected: injectFlaw,
    biomechanics,
  };
}

/**
 * Renders an ambient gym backdrop with an athletic silhouette avatar behind the skeleton.
 */
export function renderSyntheticAvatarBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  keypoints: Keypoint[],
  exercise: 'Squat' | 'Push-up'
) {
  // 1. Dark ambient gym environment
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#060A12');
  bgGrad.addColorStop(0.6, '#0B1324');
  bgGrad.addColorStop(1, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Perspective studio floor grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  const horizonY = height * 0.58;
  const floorY = height * 0.85;

  // Horizon subtle line
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.stroke();

  // Perspective floor diagonals
  for (let x = -width * 0.5; x <= width * 1.5; x += width * 0.12) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(width * 0.5 + (x - width * 0.5) * 0.2, horizonY);
    ctx.stroke();
  }

  // Horizontal floor lines
  for (let y = horizonY + 20; y < height; y += (y - horizonY) * 0.45 + 10) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Ambient studio spotlight glow behind the athlete
  const kpMap = new Map(keypoints.map((k) => [k.name, k]));
  const hip = kpMap.get('left_hip') || kpMap.get('right_hip');
  const glowX = hip ? hip.x : width * 0.5;
  const glowY = hip ? hip.y : height * 0.5;

  const radial = ctx.createRadialGradient(glowX, glowY, 40, glowX, glowY, 320);
  radial.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
  radial.addColorStop(0.5, 'rgba(14, 165, 233, 0.08)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // 4. Stylized athletic avatar silhouette (body mass behind skeleton lines)
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 3;

  const shoulderL = kpMap.get('left_shoulder');
  const shoulderR = kpMap.get('right_shoulder');
  const hipL = kpMap.get('left_hip');
  const hipR = kpMap.get('right_hip');
  const kneeL = kpMap.get('left_knee');
  const ankleL = kpMap.get('left_ankle');
  const head = kpMap.get('nose');

  if (shoulderL && shoulderR && hipL && hipR) {
    // Torso mass polygon
    ctx.beginPath();
    ctx.moveTo(shoulderL.x - 12, shoulderL.y);
    ctx.lineTo(shoulderR.x + 12, shoulderR.y);
    ctx.lineTo(hipR.x + 10, hipR.y + 10);
    ctx.lineTo(hipL.x - 10, hipL.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (head) {
    // Head silhouette
    ctx.beginPath();
    ctx.arc(head.x, head.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Limbs thickness capsules
  const drawCapsule = (p1?: Keypoint, p2?: Keypoint, radius: number = 8) => {
    if (!p1 || !p2) return;
    ctx.save();
    ctx.lineWidth = radius * 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  };

  drawCapsule(shoulderL, kpMap.get('left_elbow'), 10);
  drawCapsule(kpMap.get('left_elbow'), kpMap.get('left_wrist'), 8);
  drawCapsule(hipL, kneeL, 14);
  drawCapsule(kneeL, ankleL, 11);

  ctx.restore();

  // 5. Watermark / Mode badge on canvas
  ctx.save();
  ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('SYNTHETIC VISION DEMO FEED • 30 FPS', 32, 40);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px monospace';
  ctx.fillText(`EXERCISE: ${exercise.toUpperCase()} (KINEMATIC SIMULATION)`, 32, 58);
  ctx.restore();
}
