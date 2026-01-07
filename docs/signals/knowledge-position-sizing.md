# Knowledge: Position Sizing (Money Fields + MAX_LEVERAGE) — Optional (v2)

This module adds money/size calculations **only when the user explicitly asks**:
e.g. “add money”, “calculate position size”, “how many coins”, “USD position”, “max leverage”, etc.

## 0) No assumptions
If any required input is missing, the GPT must ask targeted questions and output **no code blocks**.

## 1) When to include money fields
Include these keys ONLY if the user requested money/size calculations AND provided enough info:

- POSITION_COINS
- POSITION_USD
- SL_LOSS_USD
- TP_PROFIT_USD
- MAX_LEVERAGE

These are appended to each signal code block after the existing calculated fields, separated by a blank line.

## 2) Minimum user inputs (required)
User must provide inputs for **risk** and for **max leverage**.

### 2.1 Inputs needed to size the position (risk)
User must provide **one** of the following:

#### Option A — Risk amount in USD
- RISK_USD for a specific order OR for the whole set of orders.

#### Option B — Balance + risk percent
- TOTAL_BALANCE_USD (or USDT) AND RISK_PERCENT (for a specific order OR for the whole set).

If user provides only TOTAL_BALANCE_USD without RISK_PERCENT → ask for risk percent.
If user provides only “I can lose X%” without balance → ask for balance.

### 2.2 Inputs needed for MAX_LEVERAGE (margin constraint)
To compute MAX_LEVERAGE exactly (without exchange liquidation assumptions), the user must provide:

- MARGIN_AVAILABLE_USD (margin budget available for THIS order), OR an explicit rule like:
  - “use TOTAL_BALANCE as margin for this order”
  - “use allocated balance share as margin”
  - “use $X margin per order”

If margin budget is not provided → ask: “What margin (USD/USDT) is available for this order to open the position?”

### Currency note
Assume USD = USDT 1:1 only if the user explicitly confirms USDT-margined and ok with 1:1.
Otherwise ask what currency to use.

## 3) Allocation rule when multiple orders exist (must be explicit)
If there are multiple signals and user gives a single total risk (or a single margin budget) for all:

The GPT MUST ask the user how to allocate, unless user already said one of these:
- “split equally”
- “use per-entry RISK weights from the card”

Approved allocation modes (user must choose):
A) EQUAL: each order gets total / N  
B) WEIGHTED_BY_RISK: allocate proportionally to `RISK` values from the signal blocks  
   share_i = total * (RISK_i / sum(RISK_all))

If the user does not choose → ask.

## 4) Core formulas (pure math; leverage not needed for sizing)
Given one signal with:
ENTRY, SL, TP, DIRECTION (LONG/SHORT)
and the allocated risk amount: RISK_USD_ORDER

Define:
- price_to_sl = abs(ENTRY - SL)
- price_to_tp = abs(TP - ENTRY)

### 4.1 SL_LOSS_USD
By definition:
- SL_LOSS_USD = RISK_USD_ORDER

### 4.2 POSITION_COINS
Position size in coins so that SL loss equals RISK_USD_ORDER:
- POSITION_COINS = RISK_USD_ORDER / price_to_sl

### 4.3 POSITION_USD (notional at entry)
- POSITION_USD = POSITION_COINS * ENTRY

### 4.4 TP_PROFIT_USD (gross, before fees/slippage)
- TP_PROFIT_USD = POSITION_COINS * price_to_tp

## 5) MAX_LEVERAGE (exact, margin-only definition)
This `MAX_LEVERAGE` is computed **exactly** from the margin constraint only:

Let:
- MARGIN_AVAILABLE_USD_ORDER = margin budget available for this order (provided by user)
- POSITION_USD = notional position size at entry (computed above)

Then:
- MAX_LEVERAGE = POSITION_USD / MARGIN_AVAILABLE_USD_ORDER

Interpretation:
- With leverage L, required margin is: MARGIN_REQUIRED = POSITION_USD / L
- The maximum leverage that still fits into available margin is exactly: POSITION_USD / MARGIN_AVAILABLE

Important:
- This does **NOT** model liquidation price, maintenance margin, fees, funding, or exchange-specific rules.
- If the user wants “max leverage that keeps liquidation beyond SL”, GPT MUST ask for:
  exchange (Bybit/Binance/etc), contract type, margin mode (cross/isolated), maintenance margin model/MMR, fee assumptions — otherwise it cannot be exact.

## 6) Direction validity checks (same as earlier)
- LONG requires SL < ENTRY and TP > ENTRY
- SHORT requires SL > ENTRY and TP < ENTRY
If violated: ask user to confirm numbers; output nothing.

## 7) Rounding / formatting
- POSITION_COINS: round to 8 decimals (or user-specified).
- POSITION_USD, SL_LOSS_USD, TP_PROFIT_USD, MARGIN_AVAILABLE_USD_ORDER: round to 2 decimals (or user-specified).
- MAX_LEVERAGE: round to 2 decimals unless user requests integer/round-down.
- Use dot as decimal separator. No currency symbols.

## 8) Fees, funding, slippage
Default: calculations are **gross** (ignore fees/funding/slippage).
If user wants net values, GPT must ask for fee model and funding assumptions.
