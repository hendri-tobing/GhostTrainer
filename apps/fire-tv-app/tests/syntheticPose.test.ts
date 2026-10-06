import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSyntheticSquat,
  generateSyntheticPushup,
  getSyntheticPoseFrame,
} from '../src/services/syntheticPose.ts';

test('generateSyntheticSquat generates complete 17-keypoint MoveNet skeleton', () => {
  const kps = generateSyntheticSquat(0.0);
  assert.equal(kps.length, 17);
  assert.ok(kps.every((kp) => kp.score !== undefined && kp.score >= 0.9));
  assert.ok(kps.some((kp) => kp.name === 'nose'));
  assert.ok(kps.some((kp) => kp.name === 'left_hip'));
  assert.ok(kps.some((kp) => kp.name === 'right_knee'));
  assert.ok(kps.some((kp) => kp.name === 'left_ankle'));
});

test('generateSyntheticPushup generates complete 17-keypoint MoveNet skeleton', () => {
  const kps = generateSyntheticPushup(0.0);
  assert.equal(kps.length, 17);
  assert.ok(kps.every((kp) => kp.score !== undefined && kp.score >= 0.9));
  assert.ok(kps.some((kp) => kp.name === 'left_shoulder'));
  assert.ok(kps.some((kp) => kp.name === 'left_elbow'));
  assert.ok(kps.some((kp) => kp.name === 'left_wrist'));
});

test('Squat kinematics: standing phase (progress = 0.0)', () => {
  const frame = getSyntheticPoseFrame('Squat', 0.0, 1280, 720, false);
  assert.ok(frame.biomechanics !== null);
  assert.equal(frame.biomechanics.phase, 'STANDING');
  assert.equal(frame.biomechanics.detectedFlaw, null);
  assert.ok(frame.biomechanics.squatDepthPct <= 10);
  assert.ok(frame.biomechanics.kneeAngle >= 155);
});

test('Squat kinematics: bottom phase reaches parallel depth without flaws (progress = 0.5)', () => {
  const frame = getSyntheticPoseFrame('Squat', 0.5, 1280, 720, false);
  assert.ok(frame.biomechanics !== null);
  assert.equal(frame.biomechanics.phase, 'BOTTOM');
  assert.equal(frame.biomechanics.detectedFlaw, null);
  assert.ok(frame.biomechanics.squatDepthPct >= 85, `Expected depth >= 85%, got ${frame.biomechanics.squatDepthPct}`);
  assert.ok(frame.biomechanics.kneeAngle <= 95, `Expected knee angle <= 95 deg, got ${frame.biomechanics.kneeAngle}`);
});

test('Squat kinematics: injected chest_sag flaw is detected at bottom phase', () => {
  const frame = getSyntheticPoseFrame('Squat', 0.5, 1280, 720, true);
  assert.ok(frame.biomechanics !== null);
  assert.equal(frame.biomechanics.phase, 'BOTTOM');
  assert.equal(frame.biomechanics.detectedFlaw, 'chest_sag');
});

test('Push-up kinematics: top plank phase (progress = 0.0)', () => {
  const frame = getSyntheticPoseFrame('Push-up', 0.0, 1280, 720, false);
  assert.ok(frame.biomechanics !== null);
  assert.equal(frame.biomechanics.phase, 'STANDING');
  assert.equal(frame.biomechanics.detectedFlaw, null);
  assert.ok(frame.biomechanics.squatDepthPct <= 10);
});

test('Push-up kinematics: chest-to-deck bottom phase without flaws (progress = 0.5)', () => {
  const frame = getSyntheticPoseFrame('Push-up', 0.5, 1280, 720, false);
  assert.ok(frame.biomechanics !== null);
  assert.equal(frame.biomechanics.phase, 'BOTTOM');
  assert.equal(frame.biomechanics.detectedFlaw, null);
  assert.ok(frame.biomechanics.squatDepthPct >= 80, `Expected depth >= 80%, got ${frame.biomechanics.squatDepthPct}`);
});

test('Push-up kinematics: injected hip_sag flaw is detected at bottom phase', () => {
  const frame = getSyntheticPoseFrame('Push-up', 0.5, 1280, 720, true);
  assert.ok(frame.biomechanics !== null);
  assert.equal(frame.biomechanics.phase, 'BOTTOM');
  assert.equal(frame.biomechanics.detectedFlaw, 'hip_sag');
});
