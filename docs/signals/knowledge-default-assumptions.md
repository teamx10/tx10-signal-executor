# Knowledge: Default Assumptions & Typical Patterns (v1)

This document defines **approved defaults** that the GPT may apply **without asking** the user,
because they are typical for these signal cards.

If something falls outside these rules, GPT must ask.

---

## 1) Default mapping rules (no questions needed)

### 1.1 ENTRY lines on “Limit order:” cards
If the card contains:

```
Limit order:
2860 - 0.5%
2790 - 0.5%
```

Then:
- There are **two separate signals** (one per entry).
- `ENTRY` is the number at the start of each line (2860 and 2790).
- The percent after the dash is the **per-entry risk**.

✅ So for each entry line:
- `RISK` = that percent value (without `%`).

### 1.2 Total “Risk - X%” vs per-entry “... - Y%”
If both exist:
- **Per-entry risk overrides** total risk.
- Total risk is informational; do **not** use it to calculate per-entry risk.

Example:
- “Risk - 1%”
- “2860 - 0.5%”
- “2790 - 0.5%”
→ output `RISK=0.5` for each entry signal.

If per-entry risk does **not** exist anywhere:
- Use total risk value as `RISK`.

### 1.3 TP and SL apply to the whole card
If a card shows multiple entries and also shows:

- `Stop loss 2600`
- `Take Profit 4300`

Then:
- Those same SL/TP values apply to **all entries on that card**.

No confirmation required.

### 1.4 ORDER_TYPE default logic for these cards
User-defined rule (approved default):
- If an explicit numeric `ENTRY` exists on the card (either via “Limit order:” list or “Market <price>”) → `ORDER_TYPE=LIMIT`.
- If NO entry price exists anywhere → `ORDER_TYPE=MARKET`.

No confirmation required.

### 1.5 “Market <price>” means ENTRY price (not market execution)
On these cards, a line like:
- `Market 92200`
means:
- `ENTRY=92200`
and because an entry price exists:
- `ORDER_TYPE=LIMIT`

No confirmation required.

---

## 2) Clarification is REQUIRED only when…

The GPT must ask the user only if:
- Any digit is unreadable (entry/tp/sl/risk).
- Coin ticker is missing or unclear.
- Direction (Long/Short) is missing or unclear.
- There is no TP or no SL shown on the card (because they are required).
- The user requests TP1/TP2/TP3 but the target signal selection is ambiguous (e.g., multiple ETH Long entries and user says “for ETH Long” without specifying which entry or “all”).

---

## 3) Examples (approved)

### Example A — Multi-entry ETH Long with per-entry risk
Card text:
- ETH Long
- Limit order:
  - 2860 - 0.5%
  - 2790 - 0.5%
- Risk - 1%
- Stop loss 2600
- Take Profit 4300

Expected: 2 signals, each has:
- COIN=ETH
- ORDER_TYPE=LIMIT
- ENTRY=2860 (or 2790)
- SL=2600
- TP=4300
- RISK=0.5
- DIRECTION=LONG

Plus calculated fields.

### Example B — Single-entry “Market 92200” BTC Long
Card text:
- BTC Long
- Market 92200
- Risk - 0.75%
- Stop loss 90670
- Take Profit 96000

Expected:
- ENTRY=92200
- ORDER_TYPE=LIMIT  (because entry price exists)
- RISK=0.75

### Example C — Total risk only (no per-entry % on entry line)
Card text:
- ETH Long
- Limit order:
  - 2860
  - 2790
- Risk - 1%
- Stop loss 2600
- Take Profit 4300

Expected:
- two signals
- each uses `RISK=1` (because no per-entry risk provided)

---

## 4) Notes
- These defaults exist to avoid asking the same obvious questions repeatedly.
- If a future card format differs from these patterns, the GPT must stop and ask.
