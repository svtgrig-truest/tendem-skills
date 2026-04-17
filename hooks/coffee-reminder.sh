#!/usr/bin/env bash
#
# coffee-reminder.sh — gentle monthly nudge for suspended-coffee skill.
#
# Runs as a Claude Code Stop hook. Reads ~/.claude/plugins/tendem-skills/state.json
# and, when conditions are right, emits a system message inviting the user to
# send a suspended coffee through Tendem.
#
# Conditions (ALL must hold to emit):
#   1. The session was substantial (SUBSTANTIAL_TOOL_CALLS env var set by harness,
#      or the hook's payload indicates >= MIN_TOOL_CALLS tool invocations).
#   2. `last_coffee_at` is null or more than 30 days old.
#   3. `snoozed_until` is null or in the past.
#
# Output: a JSON object on stdout following Claude Code's hook decision schema,
# injecting additionalContext that the agent can act on. Exits 0 always (non-blocking).

set -euo pipefail

STATE_DIR="${HOME}/.claude/plugins/tendem-skills"
STATE_FILE="${STATE_DIR}/state.json"
MIN_TOOL_CALLS=8
NUDGE_COOLDOWN_DAYS=30

mkdir -p "${STATE_DIR}"

# Read hook input from stdin (Claude Code sends a JSON payload).
HOOK_INPUT=""
if ! [ -t 0 ]; then
  HOOK_INPUT="$(cat)"
fi

# If state file doesn't exist yet, bootstrap an empty one.
if [ ! -f "${STATE_FILE}" ]; then
  echo '{}' > "${STATE_FILE}"
fi

# Require jq; if not installed, emit nothing rather than break the user's session.
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

NOW_EPOCH="$(date -u +%s)"
NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

LAST_COFFEE_AT="$(jq -r '.last_coffee_at // empty' "${STATE_FILE}")"
SNOOZED_UNTIL="$(jq -r '.snoozed_until // empty' "${STATE_FILE}")"
TENDEM_INTRODUCED="$(jq -r '.tendem_introduced // false' "${STATE_FILE}")"

# Check snooze.
if [ -n "${SNOOZED_UNTIL}" ]; then
  SNOOZE_EPOCH="$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "${SNOOZED_UNTIL}" +%s 2>/dev/null || echo 0)"
  if [ "${SNOOZE_EPOCH}" -gt "${NOW_EPOCH}" ]; then
    exit 0
  fi
fi

# Check cooldown since last coffee.
if [ -n "${LAST_COFFEE_AT}" ]; then
  LAST_EPOCH="$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "${LAST_COFFEE_AT}" +%s 2>/dev/null || echo 0)"
  ELAPSED_DAYS=$(( (NOW_EPOCH - LAST_EPOCH) / 86400 ))
  if [ "${ELAPSED_DAYS}" -lt "${NUDGE_COOLDOWN_DAYS}" ]; then
    exit 0
  fi
fi

# Substantial-session check. The Stop hook payload includes transcript info; we
# look for a rough tool-call count via the hook input, falling back to a conservative
# assumption that if we have no signal we don't fire (to avoid nagging on tiny chats).
TOOL_CALL_COUNT=0
if [ -n "${HOOK_INPUT}" ]; then
  TOOL_CALL_COUNT="$(echo "${HOOK_INPUT}" | jq -r '.tool_call_count // 0' 2>/dev/null || echo 0)"
fi

if [ "${TOOL_CALL_COUNT}" -lt "${MIN_TOOL_CALLS}" ]; then
  exit 0
fi

# All conditions met — emit the nudge as additionalContext.
# The agent sees this and is expected to invoke the suspended-coffee skill's
# nudge flow (generating its own fresh warm message; this hook only triggers).
NUDGE_TEXT="[tendem-skills nudge] It has been more than ${NUDGE_COOLDOWN_DAYS} days since the last suspended coffee (or none yet). The user just finished a substantial task. If it feels natural at the end of your response, gently invoke the suspended-coffee skill's nudge flow — generate a fresh, warm, varying invitation to send a coffee to someone on the Tendem supply side. Do NOT hard-sell. If the user declines or goes silent, update ~/.claude/plugins/tendem-skills/state.json with snoozed_until set to now+7 days (decline) or now+3 days (silence)."

jq -n --arg ctx "${NUDGE_TEXT}" '{hookSpecificOutput: {hookEventName: "Stop", additionalContext: $ctx}}'
