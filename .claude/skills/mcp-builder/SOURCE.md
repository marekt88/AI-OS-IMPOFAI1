# Origin

Third-party skill, vendored 2026-10-06 from files supplied by Marek.

- Upstream: Anthropic skills collection (`mcp-builder`). Same skill is also
  available in this session as `anthropic-skills:mcp-builder`.
- License: `SKILL.md` frontmatter points at `LICENSE.txt`. **That file was not
  supplied and is missing here.** Fetch it from upstream before redistributing
  this directory outside the team.

Copied verbatim, nothing edited:

- `SKILL.md`
- `reference/mcp_best_practices.md`
- `reference/node_mcp_server.md`
- `reference/python_mcp_server.md`
- `reference/evaluation.md`
- `scripts/evaluation.py`, `scripts/connections.py`, `scripts/requirements.txt`,
  `scripts/example_evaluation.xml`

The paths match the links inside `SKILL.md` (`./reference/...`,
`scripts/evaluation.py`), so the skill resolves its own references.

`scripts/evaluation.py` needs `pip install -r scripts/requirements.txt` and an
`ANTHROPIC_API_KEY` in the environment. Its default model
(`claude-3-7-sonnet-20250219`) is old — pass `-m` with a current model id.
