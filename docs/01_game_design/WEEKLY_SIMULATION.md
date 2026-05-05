# Weekly Simulation

This document is the source of truth for the macro simulation loop.

## State

The week is driven by `GameTimeState.phase`:

- `planning`: the player edits allocations and handles management;
- `simulation`: a daily plan has just been resolved;
- `event`: a blocking event needs a decision;
- `arena`: Sunday combat resolution;
- `report`: week summary and rollover;
- `gameOver`: the ludus is bankrupt.

`WeeklyPlanningState.days` stores the plan for every day of the current week.
`GameTimeState.pendingActionTrigger` stores explicit player-gated macro actions such as
`startWeek` and `enterArena`. While a pending action exists, the game clock is blocked until the
player triggers that action.

## Daily Plan

Each `DailyPlan` contains three point buckets:

- `gladiatorTimePoints`;
- `laborPoints`;
- `adminPoints`.

It also contains `buildingActivitySelections`, a per-activity selection map that lets the player route an existing activity bucket toward one unlocked specialized building activity.

All buckets share the same activity keys:

- `training`;
- `meals`;
- `sleep`;
- `production`;

The plan is global to the ludus. It does not assign individual gladiator routes or per-character routine tasks.

Each bucket has a fixed daily budget:

- gladiator time: 12 points;
- labor: 8 points;
- administration: 6 points.

`updateDailyPlan` clamps updates so a bucket cannot exceed its budget.

## Unlocked Building Activities

Building skills can expose `unlockedActivities`. These are building-specific macro activity ids unlocked by purchased skills, not new point budgets.

Unlocked activities are intended to specialize the existing daily plan buckets. A planning surface can offer them as optional choices inside the relevant gladiator, labor or admin allocation, while the resolver keeps using the same daily budget limits and macro effect pipeline.

Unlocked activities do not apply automatically. A daily plan must select the activity in `buildingActivitySelections` for the matching generic activity, such as selecting `canteen.supplyContracts` for `production`. When a selected activity affects simulation, it resolves as a building-driven macro modifier: it depends on the purchased skill, the owning building and the selected daily plan points. It should not bypass event gating or weekly projection rules.

Random events may also require selected building activities. A definition with `triggerBuildingActivities` only becomes eligible when the matching specialized activity is selected and its parent daily activity has allocated points.

## Daily Resolver

`resolveDailyPlan(save, plan, random)` returns a next save and a `DailySimulationSummary`.

It resolves:

- training XP and fatigue;
- food and sleep penalties or bonuses;
- injury chance;
- production income;
- active building and skill effects;
- happiness and rebellion;
- daily ledger entries;
- current week ledger summary;
- macro random events filtered by planned activities;
- game over.

Gladiators carry permanent and temporary traits in `Gladiator.traits`. A trait without `expiresAt` is permanent and always active. A trait with `expiresAt` is temporary and stays active while `currentDate < expiresAt`.

Permanent traits can modify training, combat, reward or injury-risk calculations without generating alerts. Temporary traits represent short-lived states. `injury` sets the gladiator training XP multiplier to `0`, blocks Sunday arena eligibility and shows an alert. If a gladiator is injured during training, that day grants no training XP for that gladiator and applies `injury` for 2 days. `victoryAura` is applied on the Monday after a Sunday arena win, lasts 3 days, increases training XP by 10% and does not show an alert.

Macro effects are read from purchased building levels, improvements, policies and skills. Effect values are applied directly from their definitions.

The weekly financial projection is recalculated separately from the current ledger. It estimates the current plan's income and expenses from daily simulation drafts, includes upcoming active loan repayments, and excludes one-shot entries that already happened this week. Projection paths must not write ledger entries or create random events.

Current applied macro effect types:

- `increaseIncome`: reserved for future income channels;
- `increaseProduction`: boosts production income;
- `reduceExpense`: reduces daily maintenance expenses;
- `increaseHappiness`: improves daily happiness movement;
- `decreaseRebellion`: lowers daily rebellion movement;
- `increaseReputation`: adds reputation from public/admin activity;
- `reduceInjuryRisk`: lowers training injury chance;

If a random event is created, its id is recorded in the daily summary and the save enters `event` phase. `resolveWeekStep` will not advance again while pending events remain. Event definitions can be gated by broad `triggerActivities`, specific `triggerBuildingActivities`, or remain global. Treasury changes caused by event choices are recorded in the financial ledger and can trigger debt defeat.

## Projection

`projectDailyPlan(save, plan)` resolves a deterministic preview with no random injuries and no random events. It returns a `DailySimulationSummary` and does not mutate the input save.

`projectWeeklyPlan(save)` resolves the planned Monday-to-Saturday sequence into a projected `WeeklyReport`. It compounds daily consequences across the projected week and aggregates:

- treasury delta;
- reputation delta;
- happiness delta;
- rebellion delta;
- injury count.

## Weekly Step

`resolveWeekStep(save, random)` advances the macro loop.

If the current day is not Sunday:

1. Resolve the current daily plan.
2. Append the daily summary to the running weekly report.
3. Move to the next day.
4. Set phase to `event` if a decision is pending; otherwise use `planning`, except Sunday which moves to `arena` with `pendingActionTrigger: 'enterArena'`.

If the current day is Sunday:

1. Keep the save in `arena` phase with `pendingActionTrigger: 'enterArena'` until the player chooses to go to the arena.
2. `resolvePendingGameAction(save, 'enterArena')` starts the Sunday arena.
3. Complete the arena day with `completeSundayArenaDay`.
4. Apply weekly loan payments.
5. Create the final weekly report.
6. Advance year/week if needed.
7. Refresh the market.
8. Create a new default weekly plan.
9. Apply post-arena temporary traits from the completed Sunday combats.
10. Remove expired gladiator traits.
11. Set Monday to `planning` with `pendingActionTrigger: 'startWeek'`.

## Reports

`createWeeklyReport` aggregates:

- treasury delta;
- reputation delta;
- happiness delta;
- rebellion delta;
- injury count;
- daily summaries.

The save keeps the most recent reports in `planning.reports`.

## Failure

If treasury reaches `GAME_BALANCE.macroSimulation.gameOverTreasuryThreshold`, the save becomes:

```ts
ludus.gameStatus = 'lost';
time.phase = 'gameOver';
```
