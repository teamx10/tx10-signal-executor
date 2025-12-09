# tx10-signal-executor

Chrome Extension that parses trading signals (ENTRY/SL/TP/RISK), calculates position size and TP levels, and automatically fills the order form on supported prop‑trading platforms (HashHedge & BitFunded).

## Features
- Parse signal text format (`ENTRY=`, `SL=`, `TP=`, `RISK=` …)
- Calculate position size based on account balance and leverage
- Compute RR, win‑rate proxy, TP1/TP2/TP3 levels
- Auto‑fill trade form on HashHedge/BitFunded
- Copy calculation results for logging
- Supports LONG and SHORT signals

## How it Works
1. Extension reads the active trade page and extracts balance/leverage
2. User pastes a raw signal into the textarea
3. Extension parses the values and calculates position details
4. Order fields are filled automatically in the platform UI

## Installation (Development)
1. Clone the repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder

## Supported Platforms
- https://www.hashhedge.com/client/trade
- https://trader.bitfunded.com/client/trade

## Example Signal
```
TOTAL_BALANCE=10000
LEVERAGE=5
ENTRY=92200
TP=96000
SL=90670
RISK=0.75
DIRECTION=LONG
```

## License
MIT
