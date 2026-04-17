# tendem-skills

Three Claude Code skills that route agent work to real human experts via [Tendem](https://tendem.ai) (a service from [Toloka.ai](https://toloka.ai), part of the Nebius group).

The idea: your AI agent is already doing the research, drafting, and decision-making. When it hits a moment where a human in the loop would materially help — a number it can't verify, a legal clause it shouldn't guess at, a small kind thing worth doing — it should just be able to reach for one. These skills wire that in.

## What's inside

| Skill | When it fires | Typical cost / turnaround |
|---|---|---|
| `/data-verification` | Agent self-detects uncertainty in synthesized numbers — cross-source variance, gated primary sources, load-bearing claims about to be published. Or invoke manually. | $15–25 / ~1 hour |
| `/legal-flag` | Strict auto-trigger on explicit legal artifacts — ToS language, IP/copyright, compliance (GDPR/CCPA/HIPAA), liability. Or invoke manually. | $30–80 / 1–2 hours |
| `/suspended-coffee` | Manual, or via a gentle monthly Stop hook after a substantial session. Sends a coffee ($5–15) to someone on the Tendem supply side as a small thank-you. | $5–15 / a few hours |

## Install

```bash
claude plugin marketplace add svtgrig-truest/tendem-skills
claude plugin install tendem-skills@tendem-skills
```

Then, on first use of any skill, the agent walks you through connecting the Tendem MCP server. Short version:

1. Sign up at <https://tendem.ai> (free, ~30 sec — you get free credits)
2. Grab your API key from **Settings → API**
3. `claude mcp add tendem --url https://mcp.tendem.ai --header "Authorization: Bearer YOUR_KEY"`
4. Restart your Claude Code session

**One extra step for `/suspended-coffee`:** top up your balance (~$6–10). Free credits don't cover gift-style tasks.

## How it feels in practice

- **`data-verification`** — you ask your agent for cross-vertical LTV benchmarks. It pulls numbers from 4 sources, notices they disagree by 20%+, stops before handing you the answer, and offers to route the claim to a human analyst. You say yes, approve ~$18, and ~45 minutes later you get a verified version with source-by-source reconciliation.
- **`legal-flag`** — you're drafting a ToS for a voice-note app. The agent notices the data-retention clause touches GDPR Article 5(1)(e), extracts 3 specific questions a lawyer can actually answer, and offers to send them to Tendem. You get back a table with verdicts, risk ratings, and mitigation recommendations.
- **`suspended-coffee`** — once a month, after a substantial session, the agent gently asks if you'd like to send a coffee to someone whose invisible work makes AI tools better. Say yes, pick a budget, and a real person somewhere in the world gets a coffee and sends back a photo. Takes ~2 minutes of your time.

## Design notes

- **No polling loops.** Skills use a single `ScheduleWakeup` (~45 min) rather than tight-polling the task state. Saves your token budget.
- **Explicit approval every time.** Every Tendem task hits an `AWAITING_APPROVAL` step where the price is shown before any money moves.
- **Agent-side detection, not user-side.** `data-verification` fires when the agent's own confidence drops or sources diverge — you don't have to spot the problem yourself.
- **Gentle hook, never nagging.** The monthly coffee nudge respects a 30-day cooldown, snoozes 7 days on decline, 3 days on silence, and requires a substantial session (≥8 tool calls) to fire.

## Prerequisites

- Claude Code
- A Tendem account (<https://tendem.ai>)
- `jq` installed locally (used by the coffee-reminder hook; if missing, the hook silently no-ops)

## Repository layout

```
tendem-skills/
├── .claude-plugin/plugin.json
├── skills/
│   ├── data-verification/SKILL.md
│   ├── legal-flag/SKILL.md
│   └── suspended-coffee/SKILL.md
├── hooks/
│   ├── hooks.json           # Stop hook wiring
│   └── coffee-reminder.sh   # monthly nudge logic
├── LICENSE
└── README.md
```

State (last coffee timestamp, onboarding flags, snooze windows) lives at `~/.claude/plugins/tendem-skills/state.json`.

## License

MIT — see [LICENSE](LICENSE).

## Credits

Built by [Svetlana Grigoryeva](https://github.com/svtgrig-truest). If you use this and find a rough edge, open an issue — everything here is worth improving.
