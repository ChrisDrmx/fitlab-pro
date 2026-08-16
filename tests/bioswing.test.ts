import test from "node:test";
import assert from "node:assert/strict";
import { computeBioSwing, planeFromDifference } from "../client/src/lib/bioswing.ts";

const base = {
  measures: { heightCm: "180", armSpanCm: "191", forearmLengthCm: "30", humerusLengthCm: "30" },
  bioSwing: {
    rightArmType: "OnTop" as const, rightArmObservation: "", groundForceType: "",
    manualBackswingPlane: "" as const, manualDownswingPlane: "" as const,
    manualHinge: "", manualClubPosition: "", manualRelease: "", notes: "", checklist: {},
  },
};

test("applique le seuil BioSwing de quatre pouces", () => {
  assert.equal(planeFromDifference(4.1), "Shoulder");
  assert.equal(planeFromDifference(0), "Torso");
  assert.equal(planeFromDifference(-4.1), "Hip");
});

test("calcule les plans et le matchup depuis les mesures", () => {
  const result = computeBioSwing(base as never);
  assert.equal(result.backswingPlane, "Shoulder");
  assert.equal(result.downswingPlane, "Torso");
  assert.equal(result.matchup?.hinge, "Diagonal Hinge");
});

test("conserve les overrides du moniteur", () => {
  const result = computeBioSwing({
    ...base,
    bioSwing: { ...base.bioSwing, manualBackswingPlane: "Hip", manualHinge: "Vertical Hinge" },
  } as never);
  assert.equal(result.backswingPlane, "Hip");
  assert.match(result.warning, /diffère/);
});
