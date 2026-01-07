# Knowledge: Math Rules (v1)

Compute only after ENTRY/SL/TP/DIRECTION are known with 100% certainty.

All outputs are rounded to 2 decimals, dot as decimal separator, no `%` sign.

## DISTANCE_TO_SL (%)
- LONG: ((ENTRY - SL) / ENTRY) * 100
- SHORT: ((SL - ENTRY) / ENTRY) * 100

## DISTANCE_TO_TP (%)
- LONG: ((TP - ENTRY) / ENTRY) * 100
- SHORT: ((ENTRY - TP) / ENTRY) * 100

## RR
RR = DISTANCE_TO_TP / DISTANCE_TO_SL

## Validity
If DISTANCE_TO_SL <= 0 or DISTANCE_TO_TP <= 0 for the given direction:
- Do NOT output code blocks.
- Ask user to confirm the numbers.
