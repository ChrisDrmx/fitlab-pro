import test from "node:test";
import assert from "node:assert/strict";
import { clientEffort } from "../api/_lib/llm.ts";
import { consumeAiLimit, resetAiLimitsForTests } from "../api/_lib/rate-limit.ts";

test("n'expose que les niveaux de raisonnement prevus par l'interface", () => {
  assert.equal(clientEffort("low"), "low");
  assert.equal(clientEffort("HIGH"), "high");
  assert.equal(clientEffort("max"), undefined);
  assert.equal(clientEffort("gpt-5.6-sol"), undefined);
});
test("applique un plafond par compte et par endpoint", () => {
  const previous = process.env.AI_RATE_LIMIT_PER_WINDOW;
  process.env.AI_RATE_LIMIT_PER_WINDOW = "2";
  resetAiLimitsForTests();
  assert.equal(consumeAiLimit("user:test", "ocr").allowed, true);
  assert.equal(consumeAiLimit("user:test", "ocr").allowed, true);
  assert.equal(consumeAiLimit("user:test", "ocr").allowed, false);
  assert.equal(consumeAiLimit("user:test", "transcript").allowed, true);
  resetAiLimitsForTests();
  if (previous === undefined) delete process.env.AI_RATE_LIMIT_PER_WINDOW;
  else process.env.AI_RATE_LIMIT_PER_WINDOW = previous;
});
