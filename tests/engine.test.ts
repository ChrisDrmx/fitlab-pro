import test from "node:test";
import assert from "node:assert/strict";
import {
  computeGapping,
  dynamicLieConsensus,
  num,
  spinLoftCheck,
} from "../client/src/lib/engine.ts";

test("normalise les nombres francophones sans inventer de valeur", () => {
  assert.equal(num("19,5"), 19.5);
  assert.equal(num(""), null);
  assert.equal(num("texte"), null);
});
test("retient une correction de lie moyenne au demi-degre", () => {
  assert.equal(
    dynamicLieConsensus([
      { correction: 1, club: "7i" } as never,
      { correction: 2, club: "8i" } as never,
      { correction: null, club: "9i" } as never,
    ]),
    1.5,
  );
});

test("signale un trou de gapping sans modifier les donnees", () => {
  const rows = [
    { club: "7i", carry: "130" },
    { club: "8i", carry: "115" },
    { club: "9i", carry: "80" },
  ].map((row) => ({
    ...row,
    clubSpeed: "", ballSpeed: "", smash: "", launch: "", spin: "",
    attackAngle: "", dynamicLoft: "", spinLoft: "", faceAngle: "", clubPath: "",
    faceToPath: "", height: "", landingAngle: "", total: "", sideCarry: "",
    impactHoriz: "", impactVert: "",
  })) as never;
  const gaps = computeGapping(rows);
  assert.equal(gaps.length, 2);
  assert.equal(gaps[1]?.verdict, "trou");
  assert.equal(rows[1].carry, "115");
});

test("controle la coherence du spin loft", () => {
  const result = spinLoftCheck({ dynamicLoft: "25", attackAngle: "-5", spinLoft: "30" } as never);
  assert.equal(result.computed, 30);
  assert.equal(result.delta, 0);
});
