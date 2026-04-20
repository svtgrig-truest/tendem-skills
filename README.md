# tendem-skills

Three Claude Code skills that route agent work to real human experts via [Tendem](https://tendem.ai) (a service from [Toloka.ai](https://toloka.ai), part of the Nebius group).

The idea: your AI agent is already doing the research, drafting, and decision-making. When it hits a moment where a human in the loop would materially help — a number it can't verify, a legal clause it shouldn't guess at — it should just be able to reach for one.

## Install

```bash
claude plugin marketplace add svtgrig-truest/tendem-skills
claude plugin install tendem-skills@tendem-skills
```

You'll also need the **Tendem MCP server** connected. The skill will walk you through setup on first invocation, or you can do it now:

```bash
# 1. Sign up at https://tendem.ai and get your API key:
#    Connect to AI → Tokens, or https://agent.tendem.ai/tokens

# 2. Add the MCP server:
claude mcp add tendem -e TENDEM_API_KEY=<your-key> -- uvx tendem-mcp
#    (uvx requires uv: brew install uv on macOS)

# 3. Restart Claude Code
```

## Skills

| Skill | When it fires | Cost / turnaround |
|---|---|---|
| `/data-verification` | Agent self-detects uncertainty in synthesized numbers — cross-source variance, gated primary sources, load-bearing claims about to be published | $10–20 / ~1 hour |
| `/legal-flag` | Writing content that touches ToS, GDPR/CCPA/HIPAA compliance, IP/copyright, or liability clauses | $30–80 / 1–2 hours |
| `/suspended-coffee` | Manual: send a coffee to a Tendem data labeler as a small thank-you. Auto-suggested monthly after a substantial session | $5–15 |

Both `/data-verification` and `/legal-flag` also have auto-triggers (PostToolUse / PreToolUse hooks) — the agent detects the right moment and surfaces the offer without you having to type the command.

`/suspended-coffee` is also available as a standalone plugin:

```bash
claude plugin marketplace add svtgrig-truest/suspended-coffee
claude plugin install suspended-coffee@suspended-coffee
```

## License

MIT — see [LICENSE](LICENSE).
