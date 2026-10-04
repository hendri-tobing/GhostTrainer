/**
 * GhostTrainer MoveNet Pose Detection & Biomechanical Analyzer for Fire TV.
 * Uses MoveNet Lightning via TensorFlow.js for low-latency 30fps tracking on TV hardware.
 */

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export interface BiomechanicsState {
  kneeAngle: number;
  squatDepthPct: number;
  torsoAngle: number;
  isParallel: boolean;
  detectedFlaw: string | null;
  phase: 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';
}

declare global {
  interface Window {
    poseDetection?: any;
    tf?: any;
  }
}

/**
 * Calculates angle in degrees between three points (A -> B -> C) at vertex B.
 */
export function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * Creates MoveNet pose detector.
 */
export async function createMoveNetDetector(): Promise<any> {
  if (typeof window === 'undefined' || !window.poseDetection) {
    console.warn('poseDetection CDN script not yet loaded, will retry or fallback.');
    return null;
  }

  const model = window.poseDetection.SupportedModels.MoveNet;
  const detectorConfig = {
    modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: true,
  };

  return await window.poseDetection.createDetector(model, detectorConfig);
}

/**
 * Analyzes body keypoints to assess squat biomechanics.
 */
export function analyzeSquatBiomechanics(
  keypoints: Keypoint[],
  minConfidence = 0.35
): BiomechanicsState | null {
  const findPt = (name: string) => keypoints.find((k) => k.name === name);

  const leftHip = findPt('left_hip');
  const leftKnee = findPt('left_knee');
  const leftAnkle = findPt('left_ankle');
  const leftShoulder = findPt('left_shoulder');

  const rightHip = findPt('right_hip');
  const rightKnee = findPt('right_knee');
  const rightAnkle = findPt('right_ankle');
  const rightShoulder = findPt('right_shoulder');

  // Choose side with higher visibility confidence
  const leftConf =
    ((leftHip?.score || 0) + (leftKnee?.score || 0) + (leftAnkle?.score || 0)) / 3;
  const rightConf =
    ((rightHip?.score || 0) + (rightKnee?.score || 0) + (rightAnkle?.score || 0)) / 3;

  const useLeft = leftConf >= rightConf;
  const hip = useLeft ? leftHip : rightHip;
  const knee = useLeft ? leftKnee : rightKnee;
  const ankle = useLeft ? leftAnkle : rightAnkle;
  const shoulder = useLeft ? leftShoulder : rightShoulder;

  if (
    !hip ||
    !knee ||
    !ankle ||
    (hip.score || 0) < minConfidence ||
    (knee.score || 0) < minConfidence ||
    (ankle.score || 0) < minConfidence
  ) {
    return null;
  }

  // Calculate knee flexion angle (180 = straight leg, 90 = parallel)
  const kneeAngle = calculateAngle(hip, knee, ankle);

  // Depth percentage: 170 deg -> 0%, 90 deg -> 100%, 75 deg -> 115%
  const depthPct = Math.max(
    0,
    Math.min(120, Math.round(((170 - kneeAngle) / (170 - 90)) * 100))
  );

  // Torso forward lean angle
  let torsoAngle = 0;
  let detectedFlaw: string | null = null;

  if (shoulder && (shoulder.score || 0) >= minConfidence) {
    // Angle between vertical line through hip and shoulder
    const verticalPoint: Keypoint = { x: hip.x, y: hip.y - 100 };
    torsoAngle = calculateAngle(shoulder, hip, verticalPoint);
    if (torsoAngle > 48 && kneeAngle < 120) {
      detectedFlaw = 'chest_sag';
    }
  }

  let phase: BiomechanicsState['phase'] = 'STANDING';
  if (kneeAngle > 155) {
    phase = 'STANDING';
  } else if (kneeAngle <= 95) {
    phase = 'BOTTOM';
  } else {
    phase = 'DESCENDING';
  }

  return {
    kneeAngle,
    squatDepthPct: depthPct,
    torsoAngle,
    isParallel: kneeAngle <= 95,
    detectedFlaw,
    phase,
  };
}

/**
 * Draws real-time skeleton overlay with glowing joints on canvas.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  flaw: string | null = null
) {
  const connectedPairs = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
  ];

  ctx.lineWidth = 4;
  ctx.strokeStyle = flaw ? '#EF4444' : '#00F0FF';
  ctx.shadowColor = flaw ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 240, 255, 0.8)';
  ctx.shadowBlur = 10;

  const keypointMap = new Map(keypoints.map((kp) => [kp.name, kp]));

  connectedPairs.forEach(([p1Name, p2Name]) => {
    const p1 = keypointMap.get(p1Name);
    const p2 = keypointMap.get(p2Name);

    if (p1 && p2 && (p1.score || 0) > 0.3 && (p2.score || 0) > 0.3) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });

  // Draw joints
  keypoints.forEach((kp) => {
    if ((kp.score || 0) > 0.3) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = flaw ? '#EF4444' : '#00F0FF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Reset shadow
  ctx.shadowBlur = 0;
}
