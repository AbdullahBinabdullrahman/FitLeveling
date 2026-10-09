# FitLeveling 0.2.0

- Coach replies survive invalid proposals, with one formatting retry. Invalid proposals cannot be applied. Validation logs include only field paths and codes.
- Three free hero emotes: Shuffle, Robot dance, Victory dance; Stop returns to idle.
- Four coin-unlocked weapons: Void Reaper, Frost Bow, Storm Lance, Nova Gauntlet.
- Three coin-unlocked effects: Storm Strike, Frostfall, Galaxy Spiral.
- Two skins: Void Walker and Rose Quartz; Beat Headset accessory.
- Web and mobile use the same 24-item catalog and existing inventory/equipment slots. No new migration is required.
- Reduced-motion and the hero animation setting disable dances and looping effects.

Validation: 88 tests; web typecheck/build; mobile typecheck/lint/web export; demo unlock/equip of Void Reaper and Storm Strike.
Native signed builds and device animation performance still need device testing.
