# Gameplay

## Core Fantasy

The player is the lanista of a Roman gladiator school. They manage ambition, risk, reputation, money and human bodies under pressure.

The game creates tension during the week before resolving consequences in Sunday arena combats.

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
- events;
- market decisions;
- arena preparation;
- risk/reward decisions.

The player defines priorities and handles exceptions. The game handles routine assignments where possible.

Weekly planning, building policies and alerts open as focused feature flows instead of permanently occupying the main game screen.

## Removed Mechanic: Building Budgets

The previous 1-to-10 building budget mechanic is removed.

Buildings no longer have budget sliders. This keeps the player's attention on explicit decisions that create drama:

- purchase;
- upgrades;
- improvement modules;
- weekly policies;
- special actions;
- named choices;
- capacity constraints;
- building-specific effects.

Building rules and formulas stay in `src/domain` and `src/game-data`. React components render choices and call domain or store actions.

## Building Strategic Choices

Buildings are managed through level upgrades, purchasable improvements, weekly policies, strategic actions and building-specific mechanics.

Level upgrades define the building baseline. Improvements are explicit purchases that permanently expand what a building contributes. Policies are explicit weekly stance choices that shape how a building is used by assigned gladiators or the whole ludus.

Paid policies spend treasury when selected. They do not create a hidden recurring budget slider. If the same policy is already selected, selecting it again has no effect and should not charge the player again.

Examples:

- Canteen: economical meals, balanced meals, rich meals, protein-focused meals.
- Training Ground: balanced training, strength doctrine, agility doctrine, defense doctrine, brutal discipline.
- Pleasure Hall: quiet evening, games and songs, grand entertainment.
- Infirmary: basic care, preventive care, intensive treatment.

## Weekly Gameplay Loop

### Monday: Planning and Consequences

The player reviews the previous Sunday results, sees injuries and reputation changes, checks the renewed gladiator market and assigns weekly objectives.

Main actions:

- review arena results;
- inspect injured gladiators;
- buy or sell gladiators;
- define weekly objectives;
- buy upgrades if needed.

### Tuesday and Wednesday: Development

The ludus operates according to routines. The player reacts to alerts, manages upgrades and handles events.

Main actions:

- adjust routines;
- solve events;
- perform special actions;
- develop young gladiators;
- keep gauges under control.

### Thursday: Midweek Adjustments

The player reviews the state of the ludus and corrects problems before the weekend.

Main actions:

- adjust weekly objectives;
- respond to alerts;
- preserve tired or injured gladiators;
- decide how much risk the roster can take before Sunday.

### Friday and Saturday: Risk or Prudence

The player chooses whether to push training, restore gauges or preserve important gladiators before Sunday.

Main actions:

- intensive training;
- medical treatment;
- morale support;
- final meals and rest;
- review alerts.

### Sunday: Arena

Sunday becomes a special arena day at 06:00. The game enters a blocking arena mode and pauses simulation time until the player completes the arena flow.

Gladiators fight. Combats are turn-based and shown through a combat log. Results affect money, reputation, morale, health, energy and future opportunities.

Sunday is the weekly climax and should be readable as a focused arena flow:

- routine management is locked once Sunday arena resolution starts at 06:00;
- the player first sees an arena-day introduction explaining the schedule;
- eligible owned gladiators are placed into a combat queue for the current week;
- each eligible gladiator receives a random same-league opponent only when the Sunday arena flow starts;
- each combat has a visible opponent, rank and victory or defeat state;
- the player advances through the dedicated arena route combat by combat;
- the combat presentation reveals the existing combat log turn by turn;
- the player returns to the arena hub between combats;
- rewards and consequences are applied once per combat and cannot be doubled by repeated Sunday ticks;
- arena rewards are split into a fixed participation bonus by league rank and a victory bonus weighted by the gladiator's decimal odds;
- the victory bonus also includes a public stake modifier that can move the payout by -20 to +20 treasury when the combat is generated;
- once all combats have been presented, the player reviews a final summary showing win/loss record, arena gains, total gains and reputation changes;
- accepting the summary ends the arena flow and advances automatically to Sunday 20:00.

If no gladiator is eligible, the arena still opens at 06:00, shows a clear empty state and lets the player acknowledge the summary before advancing to Sunday 20:00.

Daily events also use blocking event mode. When a daily event appears during the week, the game opens the event modal and pauses simulation time until the player chooses a resolution. Daily events do not appear on Sunday.

## Weekly Objectives

Each gladiator has one weekly objective.

Current objectives:

- `balanced`: keep the gladiator in acceptable condition while slowly improving skills.
- `trainStrength`: push strength through training-ground activity.
- `trainAgility`: push agility through training-ground activity.
- `trainDefense`: push defense through training-ground activity.
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

## Alerts

The game surfaces problems automatically.

Examples:

- health is too low;
- energy is too low;
- morale collapse risk;
- no roster place available for a new gladiator;
- a champion is overtraining;
- a gladiator is ready for a more difficult rank.

Alert severities:

- `info`;
- `warning`;
- `critical`.

## Events

Events make the week feel alive.

Recommended frequency: at most one event per day.

Event examples:

- a gladiator refuses training;
- a patrician visits the ludus;
- a medicus offers expensive treatment;
- a rival lanista spreads rumors;
- two gladiators develop a rivalry;
- a young gladiator shows promise;
- a merchant offers a dubious training tonic.

Each event presents a choice with clear consequences.

## Fun Target

The week should repeatedly ask interesting questions:

- Should I protect my champion or push him harder?
- Should I spend money on treatment?
- Should I train young gladiators even if they lose Sunday?
- Should I sell a gladiator now or after one more victory?
