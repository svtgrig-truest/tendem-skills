# tendem-skills (internal / work-in-progress)

> ⚠️ **This repo is a private-ish working tree.** The two skills below are **not yet tested live** and should not be installed by anyone else in their current state. When each one is validated with real Tendem tasks, it will be lifted into its own standalone repo (like `suspended-coffee` already was) and made publicly installable.
>
> The published skill that lives here today:
>
> - [`suspended-coffee`](https://github.com/svtgrig-truest/suspended-coffee) — a tiny ritual where your agent, after a substantial session, offers to send a coffee via Tendem to one of the humans whose invisible work makes AI tools better.

## What's planned

Two Claude Code skills that route agent work to real human experts via [Tendem](https://tendem.ai) (a service from [Toloka.ai](https://toloka.ai), part of the Nebius group). The idea: your AI agent is already doing the research, drafting, and decision-making. When it hits a moment where a human in the loop would materially help — a number it can't verify, a legal clause it shouldn't guess at — it should just be able to reach for one.

| Skill | Status | When it would fire | Typical cost / turnaround |
|---|---|---|---|
| `/data-verification` | Agent self-detects uncertainty in synthesized numbers — cross-source variance, gated primary sources, load-bearing claims about to be published. | $10–20 / ~1 hour |
| `/legal-flag` | Strict auto-trigger on explicit legal artifacts — ToS language, IP/copyright, compliance (GDPR/CCPA/HIPAA), liability. | $30–50 / 1–2 hours |

Once each is validated end-to-end, it will move to its own repo and get a proper install path. Until then, treat the contents of `skills/` here as drafts.

## License

MIT — see [LICENSE](LICENSE).
