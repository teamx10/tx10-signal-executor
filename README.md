# tx10-signal-executor

Chrome Extension that parses trading signals (ENTRY/SL/TP/RISK), calculates position size and TP levels, and automatically fills the order form on supported prop‑trading platforms (HashHedge & BitFunded).

---

## 🚀 Installation

You can install the extension in two ways:

### A) Clone from GitHub

```bash
git clone https://github.com/teamx10/tx10-signal-executor
cd tx10-signal-executor
```

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the folder of the repository
5. Pin the extension to the toolbar (click the puzzle icon → pin)

### B) Download from Releases

1. Download the latest `.zip` archive here:  
https://github.com/teamx10/tx10-signal-executor/releases
2. Unzip the archive
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the unzipped folder
7. Pin the extension to the toolbar

---

## 📌 Usage Guide

### 0. Use AI to extract the signal data

Train ChatGPT (or any AI) to read screenshots and convert them to text.

Example:

Screenshot → AI →

```
COIN=BTC
DIRECTION=LONG
ENTRY=92200
TP=96000
SL=90670
RISK=0.75
```

### 1. Take a screenshot of the Telegram signal  
Make sure all values are clear on the screenshot.

### 2. Convert screenshot → text  
Use ChatGPT, Claude, Gemini or any OCR tool.

### 3. Copy the extracted text

### 4. Open the trading page

Supported platforms:

- https://www.hashhedge.com/client/trade
- https://trader.bitfunded.com/client/trade

### 5. Check that the correct coin is selected  
Example: BTCUSDT Perpetual

### 6. Open the extension

Click the pinned icon in the Chrome toolbar.

### 7. Verify auto‑detected balance and leverage

The extension extracts your balance and leverage from the page automatically.

Example:

```
TOTAL_BALANCE=10003.27
LEVERAGE=5
```

Make sure the values match your current trading account.

### 8. Paste the signal data

Paste the extracted text from AI into the input field.

### 9. Click **Fill**  
The extension will:

- calculate position size
- calculate RR and winrate proxy
- calculate TP1/2/3
- auto‑fill the order form fields

Verify all fields are correct before submitting.

### 10. Place your order 🎯  
Once everything is correct — place the order.

---

## 🧠 Example Signal

```
TOTAL_BALANCE=10003.27
LEVERAGE=5
ENTRY=92200
TP=96000
SL=90670
RISK=0.75
DIRECTION=LONG
```

---

## ✔️ Supported Features

- Parse text signals (`KEY=VALUE` format)
- Auto‑parse balance and leverage from the UI
- R/R and winrate proxy
- TP1 TP2 TP3 based on R values
- Auto‑fill order form
- Copy calculated metrics
- Uses safe event‑based input typing

---

## 🛠️ Development

Make changes locally and reload extension in Chrome.

---

## 📜 License

MIT
