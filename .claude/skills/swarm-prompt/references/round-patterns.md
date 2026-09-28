# Round patterns

Five ways to structure a multi-agent run. Pick by what the goal actually needs, then fill the template.

## Fan-out → cross-review → converge

**Use when:** the goal has several distinct parts and you want one coherent result covering all of them. The default for "analyze X across these dimensions" and "work through this list of goals".

```
Round 1  N agents, one per workstream, independent, parallel
Round 2  each reads siblings' outputs, files a structured critique
Round 3  each revises its own file against critiques received
Final    orchestrator synthesizes, lists surviving disagreements
```

**Agents:** 3–6. **Cost:** N×3 runs roughly.

Strongest when the workstreams are different *questions* over shared material, so their answers can genuinely contradict. Weakest when workstreams are separate topics with no overlap — then cross-review has nothing to bite on and you should cut to round 1 plus synthesis.

## Parallel debate

**Use when:** there's one question, a decision hangs on it, and the answer isn't obvious. Architecture choices, build-vs-buy, whether to rewrite.

```
Round 1  3-5 agents take assigned positions independently, argue them
Round 2  each reads the others, attacks the strongest opposing argument,
         concedes anything it must
Round 3  each states its final position and its confidence
Final    orchestrator decides, with reasons, and states what would flip it
```

**Agents:** 3–5. **Cost:** N×3.

Positions must be assigned, not chosen — agents left to pick converge immediately. Include at least one position nobody in the room currently holds; unpopular options are exactly the ones that never get argued properly.

The final output must be a decision with reversal conditions, not a balanced overview. If the orchestrator can't decide, that itself is the finding and it goes to the user as an open choice.

## Stochastic consensus

**Use when:** you want the solution space mapped rather than a verdict. Early exploration, naming, feature ideation, "what are we not thinking of".

```
Round 1  5-8 agents brainstorm the same question under different framings
         (conservative / aggressive / contrarian / first-principles /
          constraint-free / outlier-hunter / adjacent-industry)
Final    orchestrator clusters ideas, counts how many agents independently
         reached each, and flags the singletons separately
```

**Agents:** 5–8. **Cost:** N×1 — the cheapest pattern, since there's no review round.

Two outputs matter and they matter differently. Convergent ideas — reached independently by several agents — are the safe bets. Singletons are the interesting ones; they're either the best idea in the run or noise, and they need a human to tell which. Never let the orchestrator discard singletons as outliers.

## Red team / blue team

**Use when:** a plan, design or piece of work already exists and needs attacking before it ships.

```
Round 1  blue team (1-2 agents) states the plan's rationale and assumptions
         red team (2-3 agents) attacks: failure modes, wrong assumptions,
         what breaks under load / adversarially / in six months
Round 2  blue responds to each attack: mitigate, accept, or dispute
Final    orchestrator lists attacks by severity with blue's response to each
```

**Agents:** 3–5. **Cost:** N×2.

Tell the red team explicitly not to hedge and not to end with a balanced summary — the default pull toward even-handedness is what makes most automated review useless. Attack the strongest version of the plan, not a straw man.

The useful artifact is the attack/response table, not a verdict.

## Staged pipeline with gates

**Use when:** the parts are genuinely sequential — each stage needs the previous stage's output — but each stage is big enough to warrant its own agent.

```
Stage 1  agent produces artifact → orchestrator reviews → user gate (optional)
Stage 2  agent reads stage 1's artifact, produces the next → review → gate
...
```

**Agents:** one per stage, sequential. **Cost:** N×1, but wall-clock is long.

This is the honest answer when a user asks for parallel agents on a sequential problem. Say so: parallelism here would mean later agents guessing at earlier outputs.

Put a user gate after any stage where a wrong output would waste everything downstream — typically after the plan or the decomposition. One minute of human review beats an hour of confidently wrong work.

## Combining

Patterns nest. A common shape for a big goal: stochastic consensus to generate options, then parallel debate on the top three, then red team on the winner. Run these as separate briefs with the user in between, not as one mega-brief — the human checkpoint between phases is worth more than the automation it costs.

## Choosing quickly

```
Is there existing work to attack?           → red team
Is it one question with a real decision?    → debate
Do you want options, not an answer?         → stochastic consensus
Are the parts sequential?                   → staged pipeline
Otherwise, multi-part goal                  → fan-out → cross-review → converge
```
