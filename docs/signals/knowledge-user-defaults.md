# Knowledge: User Defaults (v1)

These are user-confirmed defaults to avoid repeat clarification questions.

## Instrument / market default
- Default market for BTC signals is **BTCUSDT (linear, USDT-margined)** unless the user explicitly specifies otherwise.

## Max loss definition
- If user says “max loss $X” / “потерять максимум $X”, interpret as:
    - **loss at Stop Loss trigger price (SL)**,
    - **excluding** fees / funding / slippage,
    - for the whole position.

## Profit calculation default
- If a TP is provided and user requests money sizing, compute **TP profit in USDT** using the given TP.

## Currency default
- Treat **$ as USDT 1:1** for calculations (USD = USDT).
- If user explicitly wants another currency or not 1:1 → follow user and ask if needed.