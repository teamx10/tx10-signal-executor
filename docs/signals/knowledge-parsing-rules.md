# Knowledge: Parsing Rules (v1)

## Absolute rules
- Never invent values. Never guess. Never infer.
- Never “normalize” numbers. Output digits exactly as shown (remove only `%` sign from RISK).
- If any digit/character is not perfectly readable: ask user to type the exact value(s). Do not output code blocks.

## Required fields: how to extract

### COIN
- Must be explicitly present (e.g., “BTC Short”, “ETH Long”).
- Output ticker uppercase.

### DIRECTION
- “Long” → LONG
- “Short” → SHORT

### ENTRY
ENTRY is a numeric entry price.
- “Limit order:” list → each line is an ENTRY (multiple signals).
- “Market 92200” → ENTRY is `92200` (number after word). In this system, it is still an entry price.

### ORDER_TYPE (user-defined)
- If the card contains a specific numeric entry price (i.e., you can extract ENTRY) → ORDER_TYPE=LIMIT
- If the card contains NO entry price anywhere → ORDER_TYPE=MARKET
If unclear whether ENTRY exists: ask user.

### TP / SL
- Extract exact numbers after “Take Profit” and “Stop loss”.

### RISK (per-entry priority)
- If per-entry risk exists next to ENTRY line (e.g., “2860 - 0.5%”) → RISK=0.5 for that signal.
- Total “Risk - 1%” must not override per-entry.
- If only total risk exists and no per-entry risk exists → use total risk.
- Never split or recalc risk; use exactly written.
