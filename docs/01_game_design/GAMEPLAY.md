# Gameplay

## Core Fantasy

The player is the lanista of a Roman gladiator school. They manage ambition, risk, reputation, money and human bodies under pressure.

The game should create tension during the week before resolving consequences in Sunday arena combats.

## Main Design Pillar

The player manages priorities, risks and exceptions, not repetitive micro-actions.

Manual assignment is allowed, but the game must remain playable with 8, 12 or more gladiators through weekly objectives, recommendations and automation.

## Weekly Gameplay Philosophy

The player should not manually move every gladiator every few in-game hours.

The week is played through:

- weekly objectives;
- automatic recommendations;
- alerts;
- building policies;
- contracts;
- events;
- risk/reward decisions;
- preparation for Sunday.

The player defines priorities and handles exceptions. The game handles routine assignments where possible.

Weekly planning, building policies and readiness alerts open as centered feature modals in the player UI. They should not turn the main game screen into a permanent dashboard.

## Removed Mechanic: Building Budgets

The previous 1-to-10 building budget mechanic is removed.

Buildings no longer have budget sliders. This keeps the player's attention on explicit decisions that create drama:

- purchase;
- upgrades;
- improvement modules;
- weekly policies;
- special actions;
- strategic choices;
- capacity constraints;
- building-specific effects.

Examples:

- the canteen may unlock meal plans instead of a budget slider;
- the training ground may unlock training doctrines;
- the infirmary may unlock medical treatments;
- the pleasure hall may unlock morale activities;
- the dormitory may unlock better beds and rest quality.

## Building Strategic Choices

Buildings are managed through level upgrades, purchasable improvements, weekly policies, strategic actions and building-specific mechanics.

Level upgrades define the building baseline. Improvements are explicit purchases that permanently expand what a building contributes. Policies are explicit weekly stance choices that shape how a building is used by assigned gladiators or the whole ludus.

The player should review improvements and policies while planning the week:

- buy an improvement when a permanent capability, capacity gain or persistent modifier is worth the treasury cost;
- select a policy when the current week calls for a different priority, such as safer training, richer meals, morale support or preventive care;
- use policies as named choices with clear tradeoffs, not as numeric budgets or sliders.

Paid policies spend treasury when selected. They do not create a hidden recurring budget slider. If the same policy is already selected, selecting it again has no effect and should not charge the player again.

Examples:

- Canteen: economical meals, balanced meals, rich meals, protein-focused meals.
- Training Ground: balanced training, strength doctrine, agility doctrine, defense doctrine, intensive training, light training.
- Dormitory: normal rest, extended rest, strict schedule, recovery priority.
- Pleasure Hall: quiet evening, games, songs, celebration.
- Infirmary: standard care, preventive care, urgent treatment, protect injured gladiators.

Building rules and formulas stay in `src/domain` and `src/game-data`. React components render choices and call domain or store actions.

## Weekly Gameplay Loop

### Monday: Planning and Consequences

The player reviews the previous Sunday results, sees injuries and reputation changes, receives new contracts, checks the renewed gladiator market and assigns weekly objectives.

Main actions:

- review arena results;
- inspect injured gladiators;
- buy or sell gladiators;
- accept weekly contracts;
- define weekly objectives;
- buy upgrades if needed.

### Tuesday and Wednesday: Development

The ludus operates according to routines. The player reacts to alerts, manages upgrades and handles events.

Main actions:

- adjust routines;
- solve events;
- perform special actions;
- monitor readiness;
- develop young gladiators.

### Thursday: Information and Scouting

The player starts receiving information about likely opponents and betting odds.

Main actions:

- scout opponents;
- compare readiness with expected matchups;
- decide whether to hide or reveal training;
- prepare betting strategy.

### Friday: Risk or Prudence

The last serious preparation day. The player chooses whether to push training or preserve gladiators.

Main actions:

- intensive training;
- final medical treatment;
- morale boost;
- public demonstration;
- secret preparation.

### Saturday: Final Preparation

The player locks in combat strategies and prepares bets.

Main actions:

- choose combat strategies;
- place bets;
- organize final meals and rest;
- review readiness warnings;
- confirm Sunday lineup.

### Sunday: Arena

Sunday becomes a special arena day at 08:00. The game enters a blocking event mode, automatically opens the arena interface and pauses simulation time until the player completes the arena flow.

Gladiators fight. Combats are turn-based and shown through a combat log. Results affect money, reputation, morale, injuries and future opportunities.

Sunday is the weekly climax and should be readable as a focused arena flow:

- weekly preparation is locked once Sunday arena resolution starts at 08:00;
- the player first sees an arena-day introduction explaining the schedule;
- eligible owned gladiators are placed into a combat queue for the current week;
- each combat has a visible opponent, rank and strategy;
- the player chooses the next combat from the arena hub;
- the combat presentation reveals the existing combat log turn by turn;
- the player returns to the arena hub between combats;
- rewards and consequences are applied once per combat and cannot be doubled by repeated Sunday ticks;
- once all combats have been presented, the player reviews a final summary showing win/loss record, arena gains, contract gains, total gains and reputation changes;
- accepting the summary ends the arena flow and advances automatically to Sunday 20:00.

If no gladiator is eligible, the arena still opens at 08:00, shows a clear empty state and lets the player acknowledge the summary before advancing to Sunday 20:00.

Daily events also use blocking event mode. When a daily event appears during the week, the game opens the event modal and pauses simulation time until the player chooses a resolution. Daily events do not appear on Sunday.

## Weekly Objectives

Each gladiator has one weekly objective.

Initial objectives:

- `balanced`: keep the gladiator in acceptable condition while slowly improving skills.
- `fightPreparation`: maximize Sunday readiness by prioritizing health, energy, satiety and morale.
- `trainStrength`: push strength at the cost of short-term readiness risk.
- `trainAgility`: push agility at the cost of short-term readiness risk.
- `trainDefense`: push defense at the cost of short-term readiness risk.
- `recovery`: prioritize health and energy for injured or exhausted gladiators.
- `moraleBoost`: recover morale after defeats, harsh training or negative events.
- `protectChampion`: keep an important gladiator safe and fresh.
- `prepareForSale`: improve visible value through morale, health and reputation stability before selling.

## Training Intensity

Each routine can have an intensity:

- `light`: safe, slow progress;
- `normal`: default;
- `hard`: faster progress, more fatigue;
- `brutal`: high progress, high fatigue, morale loss and injury risk.

Intensity controls risk and reward.

## Automatic Assignment

Automatic assignment uses a simple priority system:

1. If health is critically low, go to the infirmary.
2. If energy is critically low, go to the dormitory.
3. If satiety is critically low, go to the canteen.
4. If morale is critically low, go to the pleasure hall.
5. Otherwise, follow the weekly objective.

Manual override must remain possible.

## Readiness Score

Each gladiator displays a Sunday readiness score.

Readiness summarizes who needs attention without replacing detailed stats.

Reference weights:

- health: 35%;
- energy: 25%;
- morale: 15%;
- satiety: 15%;
- reputation stability: 10%.

The result is clamped between 0 and 100.

## Alerts

The game surfaces problems automatically.

Examples:

- health is too low for Sunday;
- energy is too low;
- morale collapse risk;
- no roster place available for a new gladiator;
- a contract is at risk;
- a champion is overtraining;
- a gladiator is ready for a more difficult rank.

Alert severities:

- `info`;
- `warning`;
- `critical`.

## Contracts

Contracts give weekly goals and create dilemmas.

Examples:

- win at least 2 fights on Sunday;
- make a Bronze 2 gladiator win;
- win with a gladiator below 60 health;
- organize a public demonstration before Sunday;
- sell a gladiator for a minimum price.

## Events

Events make the week feel alive.

Recommended frequency for MVP: at most one event per day.

Event examples:

- a gladiator refuses training;
- a patrician visits the ludus;
- a medicus offers expensive treatment;
- a rival lanista spreads rumors;
- two gladiators develop a rivalry;
- a young gladiator shows promise;
- a bookmaker offers suspicious odds.

Each event presents a choice with clear consequences.

## Betting Integration

Betting should not only happen on Sunday. The player can prepare betting decisions during the week.

Suggested flow:

- Thursday: first odds appear.
- Friday: player can influence public perception.
- Saturday: bets are locked.
- Sunday: results are resolved.

Possible actions:

- scout opponent;
- hide training;
- public demonstration;
- spread rumor;
- bribe informant;
- place bet;
- avoid suspicious betting.

## Combat Strategy Preparation

The player can choose a combat strategy before Sunday:

- `balanced`;
- `aggressive`;
- `defensive`;
- `evasive`;
- `exhaustOpponent`;
- `protectInjury`.

The week's training can improve strategy effectiveness.

Examples:

- a gladiator trained defense all week receives a small bonus when using a defensive strategy;
- a tired gladiator performs poorly with an aggressive strategy.

## Fun Target

The week should repeatedly ask interesting questions:

- Should I protect my champion or push him harder?
- Should I take this risky contract?
- Should I spend money on treatment?
- Should I train young gladiators even if they lose Sunday?
- Should I hide my gladiator's true form to improve betting odds?
- Should I sell a gladiator now or after one more victory?
