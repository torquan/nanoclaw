# Historical Targets

Append-only log of target changes during the 90-day challenge. The dashboard uses these ranges to display date-aware targets and compute historical adherence correctly (so a day that hit its target-at-the-time stays green).

## Luis

### Protein target
| Effective from | Effective until | Target | Reason |
|---|---|---|---|
| 2026-03-14 | 2026-03-23 | 140 g/day | Initial estimate (1.6 g × ~88 kg) |
| 2026-03-24 | present | 160 g/day | Bumped to 1.8 g × 88 kg after Mar 24 InBody baseline |

### Kcal target
| Effective from | Effective until | Target | Reason |
|---|---|---|---|
| 2026-03-14 | 2026-04-18 | 2650 kcal/day | Original target (300 deficit from calculated TDEE 2916) |
| 2026-04-19 | present | 2400 kcal/day | Recalibrated after 5 weeks of real data. Real TDEE estimated ~2700 via energy balance (Mar 24 InBody → Apr 18: -0.5 kg on 2575 kcal avg → TDEE ~2750; alt anchor Mar 16 → Apr 18 gave 2662; central estimate 2700). Calculated TDEE over-estimated NEAT. New 300 kcal deficit → ~1.2 kg fat/month. |

### TDEE
| Effective from | Effective until | Value | Source |
|---|---|---|---|
| 2026-03-14 | 2026-04-18 | 2916 kcal/day | BMR 1881 × 1.55 activity multiplier (moderately active) |
| 2026-04-19 | present | 2700 kcal/day | Energy-balance calculation from 5 weeks of real intake + weight data. Revisit after next InBody. |

## Miley

### Protein target
| Effective from | Effective until | Target | Reason |
|---|---|---|---|
| 2026-03-14 | present | 80 g/day | 1.6 g × 50.4 kg baseline weight |

### Kcal target
| Effective from | Effective until | Training day | Rest day | Reason |
|---|---|---|---|---|
| 2026-03-14 | present | 2000 kcal | 1600 kcal | Calorie cycling for lean bulk; based on TDEE ~1707 + training-day surplus |

### TDEE
| Effective from | Effective until | Value | Source |
|---|---|---|---|
| 2026-03-14 | present | 1707 kcal/day | BMR 1198 × 1.425 activity (2× gym + 1× bouldering/dance per week). Not yet recalibrated — only 4 weigh-ins, too little data. |

## Rules for the dashboard

- Ranges are half-open: a target applies **on** its "effective from" date and continues until the next row starts. "present" means "open-ended, use this row for all dates ≥ effective from".
- When rendering a day's target or evaluating adherence, look up the target whose range contains that day's date.
- When the target changes, the label on the dashboard (e.g. ring labels, "kcal left" tiles, target lines on the stats chart) should reflect the target that was active on the displayed date, not the current one.
- When adding new history, append a new row and set the previous row's "effective until" to the day before the new row's "effective from".

## Related

- `memories/training-plans.md` — workout plan details
- Dashboard code: `/workspace/extra/fitness-challenge/apps/report/server.js`
