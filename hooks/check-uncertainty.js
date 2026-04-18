#!/usr/bin/env node
/**
 * check-uncertainty.js — PostToolUse hook for data-verification skill.
 *
 * Fires after web research tools (WebSearch, WebFetch, Playwright, etc.).
 * Scans the tool output for uncertainty signals. If found, emits additionalContext
 * prompting the agent to consider invoking the data-verification skill.
 *
 * Signal categories (any one is sufficient to emit):
 *   Disambiguation  — multiple matching entities, can't identify the right one
 *   Numerical       — conflicting numbers across sources, paywalled primaries
 *   Factual gap     — critical claim not found, source contradicts itself
 *   Confidence      — agent-typical hedging language
 *
 * Exits 0 always. Never blocks the user's session.
 */

"use strict";

const fs = require("node:fs");

// --- Signal lists ---

// Strong: one hit is enough
const STRONG_SIGNALS = [
  // Disambiguation / identity
  "multiple accounts",
  "multiple profiles",
  "multiple matches",
  "two accounts",
  "two profiles",
  "several accounts",
  "several profiles",
  "unclear which",
  "unclear who",
  "not sure which",
  "cannot determine",
  "can't determine",
  "could not determine",
  "ambiguous",

  // Numerical / source conflict
  "sources disagree",
  "sources conflict",
  "conflicting",
  "cannot confirm",
  "can't confirm",
  "unable to verify",
  "cannot be verified",
  "not directly confirmed",

  // Access blocked
  "paywalled",
  "behind a paywall",
  "login required",
  "sign in to view",
  "sign in to access",
  "access denied",
  "authentication required",
  "subscription required",
  "no primary source",
  "primary source not found",
  "not found in any",

  // Unverifiable sourcing
  "reportedly",
  "allegedly",
  "according to unnamed",
  "unconfirmed",
  "single source",

  // Recency / staleness
  "may have changed",
  "this information may be outdated",
  "as of 2022",
  "as of 2021",
  "as of 2020",
  "last updated in 2022",
  "last updated in 2021",
  "last updated in 2020",

  // Jurisdiction / geography
  "varies by country",
  "varies by jurisdiction",
  "depends on jurisdiction",
  "depends on country",
  "not applicable in",
  "eu regulations",
  "gdpr",
  "differs by region",
  "check local laws",
  "jurisdiction-specific",

  // Unit / metric ambiguity
  "arr vs mrr",
  "mrr vs arr",
  "gross vs net",
  "net vs gross",
  "including vs excluding",
  "adjusted vs unadjusted",
  "it's unclear whether",
  "unclear if this is",
];

// Weak: require two or more hits
const WEAK_SIGNALS = [
  "approximately",
  "roughly",
  "varies",
  "varies by",
  "range from",
  "as low as",
  "as high as",
  "estimates differ",
  "some sources",
  "other sources",
  "could not find",
  "limited data",
  "limited evidence",
  "based on limited",
  "unclear",
  "uncertain",
  "outdated",
  "may be stale",
  "check for updates",
  "not the latest",
  "verify independently",
  // Jurisdiction hints (weaker — only flag if two appear together)
  "local regulations",
  "depends on the market",
  "varies by market",
  "country-specific",
  "regional differences",
  // Unit hints
  "not specified whether",
  "unclear if gross",
  "unclear if net",
  "annualized",
  "run rate",
];

function readStdinSync() {
  if (process.stdin.isTTY) return "";
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function extractText(hookInput) {
  // PostToolUse payload fields vary by Claude Code version — try all known locations
  const candidates = [
    hookInput?.tool_response,
    hookInput?.tool_result,
    hookInput?.output,
    hookInput?.result,
    hookInput?.content,
    // Sometimes nested
    hookInput?.tool_response?.content,
    hookInput?.tool_result?.content,
  ];
  return candidates
    .filter(Boolean)
    .map((c) => (typeof c === "string" ? c : JSON.stringify(c)))
    .join(" ");
}

function detectUncertainty(text) {
  const lower = text.toLowerCase();

  // One strong signal is enough
  const strongHit = STRONG_SIGNALS.find((s) => lower.includes(s));
  if (strongHit) return { detected: true, reason: strongHit };

  // Two or more weak signals
  const weakHits = WEAK_SIGNALS.filter((s) => lower.includes(s));
  if (weakHits.length >= 2) return { detected: true, reason: weakHits.slice(0, 2).join(", ") };

  return { detected: false };
}

function emitNudge() {
  const nudge =
    "[data-verification check] The web research tool returned uncertain, conflicting, or ambiguous results. " +
    "Before finalising your response, ask yourself: " +
    "(1) Are there multiple entities that could match the query with no clear winner? " +
    "(2) Do numeric claims vary across sources or rely on paywalled primaries? " +
    "(3) Is there a factual gap that changes the answer? " +
    "If yes to any of these — AND the answer is load-bearing for the user's task — " +
    "invoke the data-verification skill (tendem-skills:data-verification) to route it to a human expert. " +
    "Do not silently pick one option or present uncertain data as confirmed.";

  const out = {
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: nudge,
    },
  };
  process.stdout.write(JSON.stringify(out));
}

function main() {
  const raw = readStdinSync();
  if (!raw.trim()) return; // no payload, nothing to do

  let hookInput = {};
  try {
    hookInput = JSON.parse(raw);
  } catch {
    return; // malformed payload — stay silent
  }

  const text = extractText(hookInput);
  if (!text) return;

  const { detected } = detectUncertainty(text);
  if (detected) emitNudge();
}

try {
  main();
} catch {
  process.exit(0);
}
