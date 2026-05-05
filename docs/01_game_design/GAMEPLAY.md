# Gameplay

## Core Fantasy

The player is the lanista of a Roman gladiator school. The ludus is managed as a house, business and small productive estate: gladiators remain important, but most decisions are now made at ludus scale.

The weekly rhythm is:

1. Plan the week through shared daily allocations.
2. Resolve daily consequences for training, needs, money and risks.
3. Handle blocking events when they appear.
4. Resolve Sunday arena combat as the weekly climax.
5. Review reports and start the next week.

## Main Design Pillar

The player manages priorities, risk and money, not minute-by-minute movement.

The game should support larger rosters and more buildings by avoiding continuous individual micromanagement. Gladiators follow the shared ludus plan unless an exception prevents them from participating.

## Macro Planning

The planning model is day-based. The current player-facing planner uses one active point pool:

- `gladiatorTimePoints`: time spent by gladiators.

Legacy `laborPoints` and `adminPoints` fields may still exist in the save shape for compatibility with the current schema, but the app no longer exposes or resolves them as active planning notions. Synchronization clears those buckets to prevent stale hidden allocations.

Current visible planning task:

- `training`.

The default planning baseline is 6 gladiator time points per day before building effects and roster scaling. Training pressure increases injury risk and can reduce happiness when overdone. Training injuries create a temporary `injury` gladiator trait that blocks training XP and arena eligibility while it is active. Gladiator health, energy and morale are not daily attributes; they are temporary combat gauges calculated at fight start from aptitudes, especially life.

Training tasks award training XP instead of directly changing strength, agility, defense or life.

Gladiator planning points are budgeted and clamped by the domain. The planning UI previews daily and weekly projected deltas before the week is resolved.

## Daily Resolution

`resolveDailyPlan` is the daily macro resolver.

Each day resolves:

- vital needs and gauge changes;
- training XP;
- injury checks;
- production income;
- building effects;
- happiness and rebellion movement;
- level-up and skill allocation alerts;
- ledger entries and current week summary;
- game over if treasury reaches the defeat threshold.

Gladiator traits can modify daily gains, combat gauges, combat XP, arena rewards and injury risk. Permanent traits are profile characteristics and do not create alerts. Temporary traits represent short-lived states: `injury` sets training XP to zero, blocks Sunday combat and creates an alert; `victoryAura` boosts training XP after an arena win without creating an alert.

## Gladiator Progression

Gladiators progress through lifetime experience.

- Training and combat award XP.
- Level is derived from total XP thresholds and is not an independently tuned stat.
- Reaching a new level derives one additional whole skill point to allocate.
- Available skill points are calculated from XP-derived level and allocated skills.

Strength, agility, defense and life are integer skills from 1 to 10. Skill increases are applied as whole-point allocations, then clamped to the 1..10 range.

Training allocations influence daily training pressure. Training-ground effects increase XP earned from the daily plan. Combat XP is awarded from arena outcome, with victory and tougher opposition allowed to grant stronger XP rewards.

When a gladiator has available skill points, planning alerts and gladiator detail UI should make that actionable without forcing immediate allocation. Manual allocation remains the default; any future auto-allocation behavior must be an explicit player-facing option.

## Economy

Treasury is the central pressure. Arena participation no longer pays a reward. A Sunday combat only pays treasury when the gladiator wins.

The economy now includes:

- ledger entries;
- current week ledger summary;
- weekly projections;
- active loans;
- daily income and expense categories;
- weekly loan repayment;
- loan buyout.

The ledger records daily income and expenses, building activity income, arena rewards, event treasury choices, gladiator market purchase and sale, building purchase and upgrade, improvements, policies and skill purchases. The finance projection is calculated from the weekly plan and active loan repayments, not from one-shot ledger lines already recorded.

Gladiator market prices are based exclusively on accumulated experience. Sale value is calculated dynamically from the purchase price multiplier.

Loans:

- `smallLoan`: available from Domus level 1;
- `businessLoan`: available from Domus level 2;
- `patronLoan`: available from Domus level 4.

If treasury reaches `-1000`, the save enters `gameOver`.

## Buildings

Buildings no longer have capacity. Capacity is not used as the way to limit building usage. Instead, each building has:

- purchase state;
- level;
- purchased skill ids;
- optional configuration and selected policy.

Roster capacity is a separate Ludus limit driven by the Dormitory. A purchased Dormitory provides one base gladiator place, and each extra roster place is a Dormitory improvement that must be bought after the required Dormitory level is unlocked. Upgrading the Dormitory never recruits or grants an extra gladiator automatically.

Building levels unlock stronger global effects and future feature branches. Skill trees contain four tiers of five skills per building. Tier 2 requires three tier 1 skills, tier 3 requires building level 3, and tier 4 requires building level 5 plus the key tier 3 branch.

Building skills can unlock building-specific macro activities. These activities are specialized planning options that spend the existing daily point pools rather than adding a separate building budget. They must be selected in the daily plan for their matching generic activity before they affect simulation, which prevents every unlocked option from stacking automatically.

Daily simulation applies purchased building, improvement, policy and skill effects directly to macro outcomes. Some random events are gated by selected building activities, so a specialized event can only appear when the player actually routed points into that activity.

Current building ids:

- `domus`;
- `trainingGround`;
- `canteen`;
- `dormitory`.

The first save includes all current buildings. There are no optional building purchases in the current build.

## Sunday Arena

Sunday combat is preserved as a focused combat flow.

The weekly simulation reaches Sunday through `resolveWeekStep`, then `resolveSundayArena` delegates to the existing combat domain.

Arena reward rule:

- win: the gladiator earns the victory reward;
- loss: no treasury reward;
- reputation and combat consequences still apply.

Combat rewards remain odds-based for winners and include the public stake modifier.

Combat XP is separate from treasury rewards. A combat can grant XP even when it does not grant money, but the treasury rule above remains unchanged.

## Events

Events should be eligible only when their source activity or global condition is present.

Activity-gated examples:

- training accidents, noble humiliation, new technique;
- fever, recovery, medicus demand;
- army request, contract dispute;
- grain blight, surplus harvest, weapon defect;
- escape attempt, riot spark;
- refinancing offer, tax inspection, bookmaker scandal.

Global events may still trigger from debt, reputation, rivalry or rebellion state.

When rebellion reaches a critical level, a priority rebellion crisis can appear regardless of the weekly activity mix. It offers three resolution paths: pay for calm, repress the riot, or free all gladiators and rebuild the roster.

## Loss State

The game can now be lost. If treasury reaches `-1000`, the ludus status becomes `lost` and time phase becomes `gameOver`.
