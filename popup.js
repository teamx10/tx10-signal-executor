const allowedUrls = [
    new URL('https://www.hashhedge.com/client/trade'),
    new URL('https://trader.bitfunded.com/client/trade'),
];

const elements = {
    form: document.getElementById('trade-form'),
    textarea: document.getElementById('trade-input'),
    unsupported: document.getElementById('unsupported'),
    results: document.getElementById('fill-results'),
    resultsContent: document.getElementById('fill-results-content'),
    copyResultsButton: document.getElementById('copy-results'),
};

const state = {
    currentTabId: null,
    tradeContext: {
        totalBalance: null,
        leverage: 1,
    },
};

const DEMO = ``;

/**
 * Calculate TP1/TP2/TP3 levels from Entry/SL/TP using R-based logic.
 * Works for LONG and SHORT.
 */
function calculateTPLevels(input, options = {}) {
    const {
        entry,
        sl,
        tp,
        direction,
    } = input;

    const {
        profile = 'prop-conservative',
        precision = 8,
    } = options;

    if (!Number.isFinite(entry) || !Number.isFinite(sl) || !Number.isFinite(tp)) {
        throw new Error('entry/sl/tp must be finite numbers');
    }
    if (entry <= 0 || sl <= 0 || tp <= 0) {
        throw new Error('entry/sl/tp must be > 0');
    }

    const dir = String(direction).toLowerCase();
    const isLong = dir === 'long';
    const isShort = dir === 'short';
    if (!isLong && !isShort) {
        throw new Error('direction must be "LONG" or "SHORT"');
    }

    if (isLong) {
        if (!(sl < entry)) throw new Error('For LONG, SL must be lower than Entry');
        if (!(tp > entry)) throw new Error('For LONG, TP must be higher than Entry');
    } else {
        if (!(sl > entry)) throw new Error('For SHORT, SL must be higher than Entry');
        if (!(tp < entry)) throw new Error('For SHORT, TP must be lower than Entry');
    }

    const sign = isLong ? 1 : -1;
    const rDistanceRaw = Math.abs(entry - sl);
    if (rDistanceRaw === 0) throw new Error('Entry and SL cannot be equal');

    const fullDistRaw = Math.abs(tp - entry);
    const rrFullRaw = fullDistRaw / rDistanceRaw;

    const round = (v) => {
        const p = Math.pow(10, precision);
        return Math.round((v + Number.EPSILON) * p) / p;
    };

    const rDistance = round(rDistanceRaw);
    const rrFull = round(rrFullRaw);

    /** @type {Array<{ key: 'tp1'|'tp2'|'tp3', r: number, price: number }>} */
    const levels = [];
    const priceByR = (r) => round(entry + sign * r * rDistanceRaw);

    if (rrFullRaw < 1) {
        levels.push({key: 'tp1', r: rrFullRaw, price: round(tp)});
    } else if (rrFullRaw < 2) {
        levels.push({key: 'tp1', r: 1, price: priceByR(1)});
        levels.push({key: 'tp2', r: rrFullRaw, price: round(tp)});
    } else {
        levels.push({key: 'tp1', r: 1, price: priceByR(1)});
        levels.push({key: 'tp2', r: 2, price: priceByR(2)});
        levels.push({key: 'tp3', r: rrFullRaw, price: round(tp)});
    }

    const getLevelPrice = (key) => {
        const found = levels.find((l) => l.key === key);
        return found ? found.price : null;
    };

    const profiles = {
        'prop-conservative': {tp1: 50, tp2: 30, tp3: 20},
        balanced: {tp1: 30, tp2: 40, tp3: 30},
        aggressive: {tp1: 20, tp2: 30, tp3: 50},
    };

    let distribution = profiles[profile] || profiles['prop-conservative'];

    const tp1 = getLevelPrice('tp1');
    const tp2 = getLevelPrice('tp2');
    const tp3 = getLevelPrice('tp3');

    const exists = {tp1: !!tp1, tp2: !!tp2, tp3: !!tp3};
    const sum = (exists.tp1 ? distribution.tp1 : 0)
        + (exists.tp2 ? distribution.tp2 : 0)
        + (exists.tp3 ? distribution.tp3 : 0);

    if (sum === 0) {
        distribution = null;
    } else if (sum !== 100) {
        distribution = {
            tp1: exists.tp1 ? Math.round((distribution.tp1 / sum) * 100) : 0,
            tp2: exists.tp2 ? Math.round((distribution.tp2 / sum) * 100) : 0,
            tp3: exists.tp3 ? Math.round((distribution.tp3 / sum) * 100) : 0,
        };

        const drift = 100 - (distribution.tp1 + distribution.tp2 + distribution.tp3);
        if (drift !== 0) {
            if (exists.tp1) distribution.tp1 += drift;
            else if (exists.tp2) distribution.tp2 += drift;
            else if (exists.tp3) distribution.tp3 += drift;
        }
    }

    return {
        tp1,
        tp2,
        tp3,
        rrFull,
        rDistance,
        distribution,
        levels: levels.map((l) => ({
            key: l.key,
            price: l.price,
            r: round(l.r),
        })),
    };
}

const roundValue = (value, precision = 8) => {
    if (!Number.isFinite(value)) {
        return null;
    }
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};

const calculatePositionAmount = (totalBalance, riskPercent, entryPrice, stopLossPrice, leverage = 1) => {
    const riskAmount = totalBalance * (riskPercent / 100);
    const distanceAmount = Math.abs(entryPrice - stopLossPrice);
    const safeLeverage = Number.isFinite(leverage) && leverage > 0 ? leverage : 1;

    if (!Number.isFinite(riskAmount) || !Number.isFinite(distanceAmount) || distanceAmount === 0) {
        return {amount: null, riskAmount: null, distanceAmount: null, positionAmount: null};
    }

    const positionAmount = (riskAmount * entryPrice) / distanceAmount;
    const amount = positionAmount / safeLeverage;

    return {
        coins: roundValue(positionAmount / entryPrice),
        amount: roundValue(amount),
        riskAmount: roundValue(riskAmount),
        distanceAmount: roundValue(distanceAmount),
        positionAmount: roundValue(positionAmount),
    };
};

const getPositionDetailsFromData = (data, leverageFromContext = 1) => {
    if (!data) {
        return null;
    }

    const requiredFields = ['TOTAL_BALANCE', 'RISK', 'ENTRY', 'SL'];
    const values = requiredFields.map((key) => Number(data[key]));

    if (values.some((value) => Number.isNaN(value))) {
        return null;
    }

    const [totalBalance, riskPercent, entryPrice, stopLossPrice] = values;
    const leverageCandidates = [Number(data.LEVERAGE), Number(leverageFromContext), 1];
    const leverage = leverageCandidates.find((value) => Number.isFinite(value) && value > 0) || 1;

    const result = calculatePositionAmount(
        totalBalance,
        riskPercent,
        entryPrice,
        stopLossPrice,
        leverage
    );

    if (!result || !Number.isFinite(result.amount)) {
        return null;
    }

    const tpPrice = Number(data.TP);
    const priceDiffToTp = Number.isNaN(tpPrice) ? null : tpPrice - entryPrice;
    const distanceToTpValue = Number.isNaN(tpPrice) ? null : Math.abs(priceDiffToTp);

    const percentFromEntry = (distance) => {
        if (!Number.isFinite(distance) || !Number.isFinite(entryPrice) || entryPrice === 0) {
            return null;
        }
        return roundValue((distance / entryPrice) * 100);
    };

    const distancePercentToSl = percentFromEntry(result.distanceAmount);
    const distancePercentToTp = percentFromEntry(distanceToTpValue);

    const riskReward =
        Number.isFinite(distanceToTpValue) &&
        Number.isFinite(result.distanceAmount) &&
        result.distanceAmount !== 0
            ? roundValue(distanceToTpValue / result.distanceAmount)
            : null;

    const coins =
        Number.isFinite(result.positionAmount) && Number.isFinite(entryPrice) && entryPrice !== 0
            ? roundValue(result.positionAmount / entryPrice)
            : null;

    const profitUsdIfTp =
        Number.isFinite(coins) && Number.isFinite(priceDiffToTp)
            ? roundValue(coins * priceDiffToTp)
            : null;

    const lossUsdIfSl =
        Number.isFinite(coins) && Number.isFinite(result.distanceAmount)
            ? roundValue(coins * result.distanceAmount)
            : null;

    const profitOfBalance =
        Number.isFinite(profitUsdIfTp) && Number.isFinite(totalBalance) && totalBalance !== 0
            ? roundValue((profitUsdIfTp / totalBalance) * 100)
            : null;

    let tpLevels = null;
    if (Number.isFinite(entryPrice) && Number.isFinite(stopLossPrice) && Number.isFinite(tpPrice)) {
        try {
            tpLevels = calculateTPLevels({
                entry: entryPrice,
                sl: stopLossPrice,
                tp: tpPrice,
                direction: data.DIRECTION || data.direction || data.Direction || 'LONG',
            });
        } catch (error) {
            console.warn('[Signal Executor] Failed to calculate TP levels', error);
        }
    }

    return {
        ...result,
        leverage,
        distanceToTp: roundValue(distanceToTpValue),
        distancePercentToSl,
        distancePercentToTp,
        riskReward,
        coins,
        profitUsdIfTp,
        lossUsdIfSl,
        profitOfBalance,
        winRate: Number.isFinite(riskReward) ? roundValue((1 / (1 + riskReward)) * 100) : null,
        tpLevels,
        riskValidation: (() => {
            if (!Number.isFinite(riskPercent) || !Number.isFinite(riskReward)) {
                return null;
            }

            let expectedRange;
            if (riskReward < 1.8) {
                expectedRange = {min: 0.25, max: 0.25};
            } else if (riskReward <= 2.2) {
                expectedRange = {min: 0.5, max: 0.5};
            } else {
                expectedRange = {min: 0.5, max: 0.75};
            }

            const isWithinRange = riskPercent >= expectedRange.min && riskPercent <= expectedRange.max;

            return {
                value: roundValue(riskPercent),
                expectedRange,
                isWithinRange,
            };
        })(),
    };
};

const getResultsPlainText = () => {
    if (!elements.resultsContent) {
        return '';
    }
    return elements.resultsContent.dataset.plaintext || elements.resultsContent.textContent || '';
};

const copyResultsToClipboard = async () => {
    const text = getResultsPlainText();
    if (!text.trim()) {
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
};

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const ResultRenderer = (() => {
    const hide = () => {
        if (!elements.results || !elements.resultsContent || !elements.copyResultsButton) {
            return;
        }
        elements.resultsContent.textContent = '';
        elements.resultsContent.dataset.plaintext = '';
        elements.results.classList.add('hidden');
        elements.copyResultsButton.classList.add('hidden');
    };

    const formatValue = (value) => (Number.isFinite(value) ? value : 'N/A');
    const formatPercent = (value) => (Number.isFinite(value) ? `${value}%` : 'N/A');

    const buildRiskLine = (riskValidation) => {
        if (!riskValidation) {
            return {html: null, plain: null};
        }

        const {value, isWithinRange, expectedRange} = riskValidation;
        const expectedText = expectedRange
            ? expectedRange.min === expectedRange.max
                ? `${expectedRange.min}%`
                : `${expectedRange.min}-${expectedRange.max}%`
            : '';
        const baseText = `RISK=${value}%`;
        const finalText = isWithinRange || !expectedText ? baseText : `${baseText} (expected ${expectedText})`;
        const className = isWithinRange ? 'risk-line risk-ok' : 'risk-line risk-bad';

        return {
            html: `<span class="${className}">${escapeHtml(finalText)}</span>`,
            plain: finalText,
        };
    };

    const buildTpLines = (tpLevels) => {
        if (!tpLevels || !Array.isArray(tpLevels.levels)) {
            return [];
        }

        const getTpLine = (key) => {
            const level = tpLevels.levels.find((item) => item.key === key);
            return level ? formatValue(level.price) : 'N/A';
        };

        return ['', `TP1=${getTpLine('tp1')}`, `TP2=${getTpLine('tp2')}`, `TP3=${getTpLine('tp3')}`];
    };

    const render = (details) => {
        if (!elements.results || !elements.resultsContent || !elements.copyResultsButton) {
            return;
        }

        if (!details) {
            hide();
            return;
        }

        const lines = [
            `AMOUNT=${formatValue(details.amount)}`,
            `POSITION_AMOUNT=${formatValue(details.positionAmount)}`,
            `COINS=${formatValue(details.coins)}`,
            '',
            `DISTANCE_TO_SL=${formatValue(details.distanceAmount)}# (${formatPercent(details.distancePercentToSl)})`,
            `DISTANCE_TO_TP=${formatValue(details.distanceToTp)}# (${formatPercent(details.distancePercentToTp)})`,
            '',
            `RR=${formatValue(details.riskReward)}`,
            `RISK_USDT=${formatValue(details.riskAmount)}`,
            `WINRATE=${formatValue(details.winRate)}%`,
            '',
            `LOSS_USD_AT_SL=${formatValue(details.lossUsdIfSl)}`,
            `PROFIT_USD_IF_TP=${formatValue(details.profitUsdIfTp)}`,
            `PROFIT_OF_BALANCE=${formatPercent(details.profitOfBalance)}`,
            ...buildTpLines(details.tpLevels),
        ];

        const riskLine = buildRiskLine(details.riskValidation);
        const plainLines = [...lines];
        if (riskLine.plain) {
            plainLines.splice(3, 0, riskLine.plain);
        }

        const htmlLines = lines.map((line) => escapeHtml(line));
        if (riskLine.html) {
            htmlLines.splice(3, 0, riskLine.html);
        }

        elements.resultsContent.dataset.plaintext = plainLines.join('\n');
        elements.resultsContent.innerHTML = htmlLines.join('<br/>');
        elements.results.classList.remove('hidden');
        elements.copyResultsButton.classList.remove('hidden');
    };

    return {render};
})();

const parseSignalMessage = (message) =>
    message
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .reduce((acc, line) => {
            const separatorIndex = line.indexOf('=');
            if (separatorIndex === -1) {
                return acc;
            }

            const key = line.slice(0, separatorIndex).trim();
            if (!key) {
                return acc;
            }

            const valueRaw = line.slice(separatorIndex + 1).trim();
            if (!valueRaw) {
                acc[key] = valueRaw;
                return acc;
            }

            const numericValue = Number(valueRaw);
            acc[key] = Number.isNaN(numericValue) ? valueRaw : numericValue;
            return acc;
        }, {});

const matchesAllowedPage = (urlString) => {
    try {
        const url = new URL(urlString);
        return allowedUrls.some((allowedUrl) => url.origin === allowedUrl.origin && url.pathname === allowedUrl.pathname);
    } catch (error) {
        return false;
    }
};

const setVisibility = ({isSupported}) => {
    if (!elements.form || !elements.unsupported) {
        return;
    }

    if (isSupported) {
        elements.form.classList.remove('hidden');
        elements.unsupported.classList.add('hidden');
    } else {
        elements.form.classList.add('hidden');
        elements.unsupported.classList.remove('hidden');
    }
};

const ChromeBridge = {
    run(func, args = [], onSuccess = () => {}, errorLabel = 'Script execution failed') {
        if (!state.currentTabId) {
            return;
        }

        chrome.scripting.executeScript(
            {
                target: {tabId: state.currentTabId, allFrames: true},
                func,
                args,
            },
            (results) => {
                if (chrome.runtime.lastError) {
                    console.error(`[Signal Executor] ${errorLabel}`, chrome.runtime.lastError);
                    return;
                }

                onSuccess(results);
            }
        );
    },
};

function extractAssetValuesFromPage() {
    const getFirstNonZeroValue = (texts, pattern) => {
        for (const text of texts) {
            const match = text.match(pattern);
            if (!match) {
                continue;
            }
            const value = parseFloat(match[1]);
            if (!Number.isNaN(value) && value !== 0) {
                return value;
            }
        }
        return null;
    };

    const getNumber = (selector, pattern) => {
        const elements = document.querySelectorAll(selector);
        const texts = Array.from(elements)
            .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean);

        return getFirstNonZeroValue(texts, pattern);
    };

    const totalBalance = getNumber('.assets-value', /(-?\d+(?:\.\d+)?)\s*USDT\b/i);
    if (!totalBalance) {
        return;
    }
    console.log('[Signal Executor] Total Balance', totalBalance);

    const leverage = getNumber('.leverage-row', /(-?\d+(?:\.\d+)?)\s*X\b/i);
    console.log('[Signal Executor] Leverage', leverage);

    const stopsCheckbox = document.querySelector('.full_stop_left');
    const stopsCheckboxUncheckbox = document.querySelector('.full_stop_left .uncheckbox');
    if (stopsCheckbox && stopsCheckboxUncheckbox) {
        stopsCheckbox.click();
    }

    return {totalBalance, leverage};
}

function fillTradeInputsInPage(data) {
    if (!data) {
        console.warn('[Signal Executor] No payload supplied');
        return false;
    }

    const setInputValue = (input, value) => {
        if (!input || typeof value === 'undefined' || value === null) {
            return false;
        }

        const nextValue = String(value);
        if (input.value === nextValue) {
            return true;
        }

        input.value = nextValue;
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        return true;
    };

    const typeInputValue = (input, value) => {
        if (!input || typeof value === 'undefined' || value === null) {
            return false;
        }

        const nextValue = String(value);
        if (input.value === nextValue) {
            return true;
        }

        const dispatchKeyboardEvent = (type, key) => {
            const keyCode = key.length === 1 ? key.charCodeAt(0) : 0;
            return input.dispatchEvent(
                new KeyboardEvent(type, {
                    key,
                    code: keyCode ? `Key${key.toUpperCase()}` : key,
                    keyCode,
                    charCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true,
                })
            );
        };

        input.focus();
        if (typeof input.select === 'function') {
            input.select();
        }

        const supportsExecCommand = typeof document.execCommand === 'function';
        if (supportsExecCommand) {
            document.execCommand('delete');
        } else if (typeof input.setRangeText === 'function') {
            input.setRangeText('', 0, input.value.length, 'start');
        } else {
            input.value = '';
        }
        input.dispatchEvent(new Event('input', {bubbles: true}));

        for (const char of nextValue) {
            dispatchKeyboardEvent('keydown', char);
            dispatchKeyboardEvent('keypress', char);
            if (supportsExecCommand) {
                document.execCommand('insertText', false, char);
            } else if (typeof input.setRangeText === 'function') {
                const {selectionStart = input.value.length, selectionEnd = input.value.length} = input;
                input.setRangeText(char, selectionStart, selectionEnd, 'end');
            } else {
                input.value += char;
            }
            input.dispatchEvent(new Event('input', {bubbles: true}));
            dispatchKeyboardEvent('keyup', char);
        }

        input.dispatchEvent(new Event('change', {bubbles: true}));
        return true;
    };

    const entryInputs = document.querySelectorAll('.trade-input-content input.ant-input');
    const priceInput = entryInputs && entryInputs.length ? entryInputs[0] : null;
    const amountInput = entryInputs && entryInputs.length > 1 ? entryInputs[1] : null;

    const stopsInputs = document.querySelectorAll('.stop-profit-row input.ant-input');
    const tpInput = stopsInputs && stopsInputs.length ? stopsInputs[0] : null;
    const slInput = stopsInputs && stopsInputs.length > 1 ? stopsInputs[1] : null;

    const priceFilled = setInputValue(priceInput, data.ENTRY);
    const amountFilled = typeInputValue(amountInput, data.amount);
    const tpFilled = setInputValue(tpInput, data.TP);
    const slFilled = setInputValue(slInput, data.SL);

    return Boolean(priceFilled || amountFilled || tpFilled || slFilled);
}

const scanAssetValues = () => {
    ChromeBridge.run(
        extractAssetValuesFromPage,
        [],
        (results) => {
            if (!results || !results.length) {
                console.log('[Signal Executor] No asset values found');
                return;
            }

            const findInputKey = (key) => results.find(
                (frameResult) =>
                    frameResult &&
                    frameResult.result &&
                    typeof frameResult.result[key] !== 'undefined' &&
                    frameResult.result[key] !== null
            );

            const totalBalanceResult = findInputKey('totalBalance');
            const leverageResult = findInputKey('leverage');

            const lines = [];
            if (totalBalanceResult && typeof totalBalanceResult.result.totalBalance === 'number') {
                state.tradeContext.totalBalance = totalBalanceResult.result.totalBalance;
                lines.push(`TOTAL_BALANCE=${totalBalanceResult.result.totalBalance}`);
            }

            if (leverageResult && typeof leverageResult.result.leverage === 'number' && leverageResult.result.leverage > 0) {
                state.tradeContext.leverage = leverageResult.result.leverage;
                lines.push(`LEVERAGE=${leverageResult.result.leverage}`);
            }

            if (lines.length && elements.textarea) {
                elements.textarea.value = `${lines.join('\n')}\n${DEMO}\n`;
            }
        },
        'Failed to scan asset values'
    );
};

const PopupController = (() => {
    const init = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs && tabs.length ? tabs[0] : null;
            const isSupported = Boolean(tab && tab.url && matchesAllowedPage(tab.url));
            if (isSupported && tab) {
                state.currentTabId = tab.id;
                setVisibility({isSupported: true});
                scanAssetValues();
            } else {
                setVisibility({isSupported: false});
            }
        });

        elements.form?.addEventListener('submit', handleSubmit);
        elements.copyResultsButton?.addEventListener('click', handleCopyResults);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!state.currentTabId || !elements.textarea) {
            return;
        }

        const text = elements.textarea.value;
        if (!text) {
            console.log('Signal Executor: nothing to submit.');
            ResultRenderer.render(null);
            return;
        }

        const messageData = parseSignalMessage(text);
        const positionDetails = getPositionDetailsFromData(messageData, state.tradeContext.leverage);
        const payload = {...messageData, ...(positionDetails || {})};
        ResultRenderer.render(positionDetails || null);
        if (!positionDetails) {
            console.warn('[Signal Executor] Unable to calculate position amount with the provided data');
        }
        console.log('[Signal Executor] Parsed data:', payload);

        ChromeBridge.run(
            fillTradeInputsInPage,
            [payload],
            (results) => {
                const wasFilled = Array.isArray(results) && results.some((result) => result && result.result);
                if (!wasFilled) {
                    console.warn('[Signal Executor] Could not update trade form inputs');
                }
            },
            'Failed to fill trade inputs'
        );
    };

    const handleCopyResults = () => {
        copyResultsToClipboard().catch((error) => {
            console.error('[Signal Executor] Failed to copy results', error);
        });
    };

    return {init};
})();

document.addEventListener('DOMContentLoaded', () => {
    PopupController.init();
});
