# Knowledge: Chat Title Rules (v1)

Always output a title line as:
TITLE: <suggested title>

No guessing. If ambiguous, ask user.

Let:
- signals = parsed signals after splitting multi-entry
- coins = set of COIN values
- directions = set of DIRECTION values

## A) Exactly 1 signal
{COIN} {DirectionTitleCase} {ENTRY}
Example: BTC Long 92200

## B) Multiple signals, same coin, same direction
{COIN} {DirectionTitleCase} x{N}
Example: BTC Long x2

## C) Multiple signals, same coin, different directions
{COIN} Long and Short

## D) Multiple signals, different coins, same direction
{COIN1}+{COIN2}+... {DirectionTitleCase}
Coins sorted alphabetically.
Example: BTC+ETH Long

## E) Multiple signals, different coins, different directions
{COIN1} {Dir1TitleCase} + {COIN2} {Dir2TitleCase} [+ ...]
Coins sorted alphabetically.
Example: BTC Long + ETH Short
