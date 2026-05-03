# Gameplay

## Core Fantasy

The player is the lanista of a Roman gladiator school. The ludus is managed as a house, business and small productive estate: gladiators remain important, but most decisions are now made at ludus scale.

The weekly rhythm is:

1. Plan the week through shared daily allocations.
2. Resolve daily consequences for training, needs, money, staff and risks.
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

Current visible planning tasks are:

- `strengthTraining`;
- `agilityTraining`;
- `defenseTraining`;
- `lifeTraining`;
- `production`.

The default planning baseline is 6 gladiator time points per day before building effects and roster scaling. Training pressure increases injury risk and can reduce happiness when overdone. Training injuries create a weekly injury state that blocks physical activity and gladiator contract participation until the next week begins. Gladiator health, energy and morale are not daily attributes; they are temporary combat gauges calculated at fight start from aptitudes, especially life.

Gladiator planning points are budgeted and clamped by the domain. The planning UI previews daily and weekly projected deltas before the week is resolved.

## Daily Resolution

`resolveDailyPlan` is the daily macro resolver.

Each day resolves:

- vital needs and gauge changes;
- training progress;
- injury checks;
- contract and production income;
- staff wages and maintenance costs;
- staff experience growth;
- building efficiency updates;
- happiness and rebellion movement;
- ledger entries and current week summary;
- game over if treasury reaches the defeat threshold.

Injured gladiators lose their personal gains for incompatible activities through the daily result and become a week-level planning risk.

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

The ledger records daily income and expenses, building activity income, arena rewards, event treasury choices, staff purchase and sale, gladiator market purchase and sale, building purchase and upgrade, improvements, policies and skill purchases. The finance projection is calculated from the weekly plan and active loan repayments, not from one-shot ledger lines already recorded.

Loans:

- `smallLoan`: available from Domus level 1;
- `businessLoan`: available from Domus level 2;
- `patronLoan`: available from Domus level 4.

If treasury reaches `-1000`, the save enters `gameOver`.

## Staff

Staff is stored in `StaffState`.

Types:

- `slave`: can work in `canteen` and `dormitory`;
- `trainer`: can only work in `trainingGround`.

Assigned staff increases building efficiency until the building's required staff count is covered. Extra staff beyond that requirement cannot inflate the base efficiency. Building experience grows slowly each assigned day and can provide up to a 20% efficiency bonus.

Assignments are mirrored in `StaffState.assignments` and `BuildingState.staffAssignmentIds`. Building efficiency uses the building definition's `requiredStaffByLevel`, then adds the capped staff experience bonus.

Staff can be unassigned from a building. Staff purchase and sale actions are recorded in the financial ledger.

The number of owned staff members is capped by Domus level. The current rule grants 3 staff places per Domus level, from 3 at level 1 to 18 at level 6.

The staff market refreshes weekly alongside the gladiator market.

## Buildings

Buildings no longer have capacity. Capacity is not used as the way to limit building usage. Instead, each building has:

- purchase state;
- level;
- efficiency;
- purchased skill ids;
- assigned staff ids;
- optional configuration and selected policy.

Building levels unlock stronger global effects and future feature branches. Skill trees contain four tiers of five skills per building. Tier 2 requires three tier 1 skills, tier 3 requires building level 3, and tier 4 requires building level 5 plus the key tier 3 branch.

Building skills can unlock building-specific macro activities. These activities are specialized planning options that spend the existing daily point pools rather than adding a separate building budget. They must be selected in the daily plan for their matching generic activity before they affect simulation, which prevents every unlocked option from stacking automatically.

Daily simulation applies purchased building, improvement, policy and skill effects directly to macro outcomes. These effects are scaled by operational efficiency, so staffing shortages reduce income, production, happiness and other building-driven benefits. Some random events are gated by selected building activities, so a specialized event can only appear when the player actually routed points into that activity.

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
