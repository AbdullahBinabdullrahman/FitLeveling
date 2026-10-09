export const HERO_JOINTS = [
  ["body", "Torso", 160, 235, -25, 25],
  ["head", "Head", 160, 163, -40, 40],
  ["leftShoulder", "Left shoulder", 116, 170, -120, 120],
  ["leftElbow", "Left elbow", 92, 205, -100, 100],
  ["leftWrist", "Left wrist", 97, 225, -70, 70],
  ["rightShoulder", "Right shoulder", 204, 170, -120, 120],
  ["rightElbow", "Right elbow", 228, 205, -100, 100],
  ["rightWrist", "Right wrist", 223, 225, -70, 70],
  ["leftHip", "Left hip", 138, 235, -50, 50],
  ["leftKnee", "Left knee", 136, 264, -70, 70],
  ["leftAnkle", "Left ankle", 134, 283, -35, 35],
  ["rightHip", "Right hip", 182, 235, -50, 50],
  ["rightKnee", "Right knee", 184, 264, -70, 70],
  ["rightAnkle", "Right ankle", 186, 283, -35, 35],
] as const;
export type HeroJoint = (typeof HERO_JOINTS)[number][0];
export type HeroPose = Partial<Record<HeroJoint, number>>;
export type HeroEmote = "idle" | "shuffle" | "robot" | "victory";
export function jointRotation(joint: HeroJoint, pose: HeroPose) {
  const info = HERO_JOINTS.find((j) => j[0] === joint)!;
  const angle = Math.min(info[5], Math.max(info[4], pose[joint] ?? 0));
  return `rotate(${angle} ${info[2]} ${info[3]})`;
}
export function dancePose(emote: string, time: number): HeroPose {
  const wave = Math.sin(time * Math.PI * 2),
    step = wave >= 0 ? 1 : -1;
  if (emote === "wave")
    return {
      rightShoulder: -65 + wave * 15,
      rightElbow: 30,
      rightWrist: wave * 15,
    };
  if (emote === "celebrate") return { leftShoulder: 90, rightShoulder: -90 };
  if (emote === "shuffle")
    return {
      body: wave * 6,
      head: -wave * 8,
      leftShoulder: wave * 30,
      rightShoulder: -wave * 30,
      leftElbow: -25,
      rightElbow: 25,
      leftHip: wave * 18,
      rightHip: -wave * 18,
      leftKnee: Math.max(0, wave) * 25,
      rightKnee: Math.max(0, -wave) * 25,
    };
  if (emote === "robot")
    return {
      head: step * 18,
      leftShoulder: step * 35,
      rightShoulder: -step * 35,
      leftElbow: -55,
      rightElbow: 55,
      leftWrist: step * 25,
      rightWrist: -step * 25,
      body: step * 5,
    };
  if (emote === "victory")
    return {
      head: wave * 10,
      leftShoulder: 85 + wave * 15,
      rightShoulder: -85 - wave * 15,
      leftElbow: -20,
      rightElbow: 20,
      leftHip: wave * 10,
      rightHip: -wave * 10,
      leftKnee: Math.abs(wave) * 18,
      rightKnee: Math.abs(wave) * 18,
    };
  return {};
}
export function blendPose(base: HeroPose, movement: HeroPose): HeroPose {
  return Object.fromEntries(
    HERO_JOINTS.map(([id, , , , min, max]) => [
      id,
      Math.max(min, Math.min(max, (base[id] ?? 0) + (movement[id] ?? 0))),
    ]),
  );
}

export const JOINT_PARENTS: Partial<Record<HeroJoint, HeroJoint>> = {
  head: "body",
  leftShoulder: "body",
  rightShoulder: "body",
  leftElbow: "leftShoulder",
  rightElbow: "rightShoulder",
  leftWrist: "leftElbow",
  rightWrist: "rightElbow",
  leftHip: "body",
  rightHip: "body",
  leftKnee: "leftHip",
  rightKnee: "rightHip",
  leftAnkle: "leftKnee",
  rightAnkle: "rightKnee",
};
export function jointWorld(joint: HeroJoint, pose: HeroPose): [number, number] {
  const data = HERO_JOINTS.find((j) => j[0] === joint)!;
  let x: number = data[2],
    y: number = data[3],
    parent = JOINT_PARENTS[joint];
  while (parent) {
    const info = HERO_JOINTS.find((j) => j[0] === parent)!;
    const a = ((pose[parent] ?? 0) * Math.PI) / 180,
      dx = x - info[2],
      dy = y - info[3];
    x = info[2] + dx * Math.cos(a) - dy * Math.sin(a);
    y = info[3] + dx * Math.sin(a) + dy * Math.cos(a);
    parent = JOINT_PARENTS[parent];
  }
  return [x, y];
}
