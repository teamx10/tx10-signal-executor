# Knowledge: Position Sizing (Money Fields) — Optional (v1)

This module adds money/size calculations **only when the user explicitly asks**:
e.g. “add money”, “calculate position size”, “how many coins”, “USD position”, etc.

## 0) No assumptions
If any required input for sizing is missing, the GPT must ask targeted questions and output **no code blocks**.

## 1) When to include money fields
Include these keys ONLY if the user requested money/size calculations AND provided enough info:

- POSITION_COINS
- POSITION_USD
- SL_LOSS_USD
- TP_PROFIT_USD

These are appended to each signal code block after the existing calculated fields, separated by a blank line.

## 2) Minimum user inputs (required)
User must provide **one** of the following, explicitly:

### Option A — Risk amount in USD
- RISK_USD for a specific order OR for the whole set of orders.

### Option B — Balance + risk percent
- TOTAL_BALANCE_USD (or USDT) AND RISK_PERCENT (for a specific order OR for the whole set).

If user provides only TOTAL_BALANCE_USD without RISK_PERCENT → GPT MUST ask for risk percent.
If user provides only “I can lose X%” without balance → GPT MUST ask for balance.

### Currency note
Assume USD = USDT 1:1 only if the user explicitly confirms USDT-margined and ok with 1:1.
Otherwise ask what currency to use.

## 3) Allocation rule when multiple orders exist (must be explicit)
If there are multiple signals (e.g., multi-entry) and user gives a single total risk for all:

The GPT MUST ask the user how to allocate, unless user already said one of these:
- “split equally”
- “use per-entry RISK weights from the card”

Approved allocation modes (user must choose):
A) EQUAL: each order gets total_risk / N  
B) WEIGHTED_BY_RISK: allocate proportionally to `RISK` values from the signal blocks  
   risk_i = total_risk * (RISK_i / sum(RISK_all))

If the user does not choose → ask.

## 4) Core formulas (pure math, no leverage needed)
Given one signal with:
ENTRY, SL, TP, DIRECTION (LONG/SHORT)
and the allocated risk amount: RISK_USD_ORDER

Define:
- price_to_sl = abs(ENTRY - SL)
- price_to_tp = abs(TP - ENTRY)

### 4.1 SL_LOSS_USD
By definition:
- SL_LOSS_USD = RISK_USD_ORDER

(That is the amount the user is willing to lose if SL is hit.)

### 4.2 POSITION_COINS
Position size in coins so that SL loss equals RISK_USD_ORDER:
- POSITION_COINS = RISK_USD_ORDER / price_to_sl

### 4.3 POSITION_USD (notional at entry)
- POSITION_USD = POSITION_COINS * ENTRY

### 4.4 TP_PROFIT_USD (gross, before fees/slippage)
- TP_PROFIT_USD = POSITION_COINS * price_to_tp

## 5) Direction validity checks (same as earlier)
- LONG requires SL < ENTRY and TP > ENTRY
- SHORT requires SL > ENTRY and TP < ENTRY
If violated: ask user to confirm numbers; output nothing.

## 6) Rounding / formatting
- POSITION_COINS: round to 8 decimals (or leave as-is if user specifies precision).
- POSITION_USD, SL_LOSS_USD, TP_PROFIT_USD: round to 2 decimals unless user requests otherwise.
- Use dot as decimal separator.
- No currency symbols in values.

## 7) Optional leverage / margin checks (only if user asks)
If user also provides LEVERAGE and wants to know required margin:
- MARGIN_USD = POSITION_USD / LEVERAGE
Do not compute margin unless explicitly requested.

## 8) Fees, funding, slippage
Default: calculations are **gross** (ignore fees/funding/slippage).
If user wants net values, GPT must ask for fee model and funding assumptions.

## 9) Example (single order)
If user says: “Risk $10 on this order”:
- SL_LOSS_USD = 10
- POSITION_COINS = 10 / abs(ENTRY - SL)
- POSITION_USD = POSITION_COINS * ENTRY
- TP_PROFIT_USD = POSITION_COINS * abs(TP - ENTRY)
