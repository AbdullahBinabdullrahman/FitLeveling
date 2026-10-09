import { describe, it, expect } from "vitest";
import {
  blendPose,
  dancePose,
  jointWorld,
  jointRotation,
  HERO_JOINTS,
} from "./hero-rig";
describe("Articulated companion rig", () => {
  it("keeps joint pivots stationary while moving attached child joints", () => {
    expect(jointWorld("rightShoulder", { rightShoulder: 90 })).toEqual([
      204, 170,
    ]);
    const child = jointWorld("rightElbow", { rightShoulder: 90 });
    expect(child[0]).toBeCloseTo(169);
    expect(child[1]).toBeCloseTo(194);
  });
  it("propagates torso rotation to limbs and head", () => {
    expect(jointWorld("head", { body: 20 })).not.toEqual(
      jointWorld("head", {}),
    );
    expect(
      jointWorld("rightWrist", { rightShoulder: 30, rightElbow: 20 }),
    ).not.toEqual(jointWorld("rightWrist", { rightShoulder: 30 }));
  });
  it("clamps poses to anatomical control limits", () => {
    expect(blendPose({ head: 999 }, { head: 20 }).head).toBe(40);
    expect(jointRotation("head", { head: 999 })).toBe("rotate(40 160 163)");
  });
  it("gives dances different joint motion and retains idle manual poses", () => {
    expect(dancePose("shuffle", 0.25)).not.toEqual(dancePose("robot", 0.25));
    expect(dancePose("idle", 10)).toEqual({});
    expect(blendPose({ leftElbow: 30 }, {}).leftElbow).toBe(30);
    expect(new Set(HERO_JOINTS.map((j) => j[0])).size).toBe(14);
  });
});
