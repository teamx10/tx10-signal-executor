# Knowledge: TP Levels (TP1/TP2/TP3) Rules (v1)

Use only when user explicitly asks to calculate TP1/TP2/TP3 (different TPs, R-based TP levels, etc).

## No assumptions about selection
If the request could apply to multiple signals (e.g., multiple ENTRY for ETH Long), you MUST ask:
“For which exact signal(s) should I calculate TP levels? Specify ENTRY (or say ‘all’).”

## Calculation logic (match provided calculateTPLevels)
Given entry, sl, tp, direction.

Validation (if violated: ask user to confirm; output nothing):
- entry/sl/tp are finite numbers > 0
- direction is LONG or SHORT
- LONG: sl < entry and tp > entry
- SHORT: sl > entry and tp < entry
- rDistanceRaw = abs(entry - sl) != 0

Compute:
- rDistanceRaw = abs(entry - sl)
- rrFullRaw = abs(tp - entry) / rDistanceRaw
- sign = +1 for LONG, -1 for SHORT
- priceByR(r) = entry + sign * r * rDistanceRaw

Levels:
- rrFullRaw < 1: TP1 = tp
- rrFullRaw < 2: TP1 = priceByR(1), TP2 = tp
- else: TP1 = priceByR(1), TP2 = priceByR(2), TP3 = tp

Rounding for generated TP prices:
- Round TP1/TP2/TP3 to 8 decimals (precision=8).

## Output for generated orders
For each generated TP level, output a NEW signal code block in the SAME schema as original:
COIN, ORDER_TYPE, ENTRY, TP, SL, RISK, DIRECTION, DISTANCE_TO_SL, DISTANCE_TO_TP, RR
- Only TP changes to the level price.
- Recompute DISTANCE_TO_TP and RR for each generated order.
- Do NOT add TP1/TP2/TP3 keys.
