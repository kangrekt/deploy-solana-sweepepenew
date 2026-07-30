document.addEventListener('DOMContentLoaded', () => {
    // Copy CA to Clipboard (Hero Section)
    const copyBtn = document.getElementById('copy-btn');
    const caText = document.getElementById('ca-text');

    if (copyBtn && caText) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(caText.innerText).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = '✅';
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                }, 2000);
            });
        });
    }

    // Copy CA (Small buttons in dashboard and footer)
    const smallCopyBtns = document.querySelectorAll('.copy-btn-small');
    smallCopyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find the nearest text to copy
            const container = e.target.closest('.ca-container-small') || e.target.closest('.ca-box');
            if (container) {
                const textToCopy = container.querySelector('.ca-text-small').innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = e.target.innerText;
                    e.target.innerText = '✅';
                    setTimeout(() => {
                        e.target.innerText = originalText;
                    }, 2000);
                });
            }
        });
    });

    // Smooth Scrolling for Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Update active class
                document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Real-time DexScreener Sync
    const TOKEN_CA = 'Agmu8Xgn7rU4zFv4DMPrEBhYDdPsmiEG5hCiYyvSpump';
    const DEX_API_URL = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_CA}`;
    
    let latestTickerData = null;
    let isFirstFetch = true;

    async function fetchDexData() {
        try {
            const response = await fetch(DEX_API_URL);
            const data = await response.json();
            
            if (data && data.pairs && data.pairs.length > 0) {
                // Find the best pair
                const pair = data.pairs[0];
                
                // Format numbers
                const priceUsd = parseFloat(pair.priceUsd);
                let formattedPrice = '$' + priceUsd.toFixed(8);
                if (priceUsd > 0.01) formattedPrice = '$' + priceUsd.toFixed(4);
                
                const mcapValue = pair.marketCap || pair.fdv || 0;
                const formattedMcap = '$' + mcapValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
                
                const volM5Value = (pair.volume && pair.volume.m5) ? pair.volume.m5 : 0;
                const formattedVolM5 = '$' + volM5Value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                
                const volH1Value = (pair.volume && pair.volume.h1) ? pair.volume.h1 : 0;
                const formattedVolH1 = '$' + volH1Value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                
                const volH6Value = (pair.volume && pair.volume.h6) ? pair.volume.h6 : 0;
                const formattedVolH6 = '$' + volH6Value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                
                const volH24Value = (pair.volume && pair.volume.h24) ? pair.volume.h24 : 0;
                const formattedVolH24 = '$' + volH24Value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                
                const priceChange = pair.priceChange && pair.priceChange.h24 ? pair.priceChange.h24 : 0;
                const isPositive = priceChange >= 0;
                const changeIcon = isPositive ? '▲' : '▼';
                const changeClass = isPositive ? 'up' : 'down';
                const formattedChange = `${changeIcon} ${Math.abs(priceChange).toFixed(2)}%`;

                const symbol = pair.baseToken && pair.baseToken.symbol ? pair.baseToken.symbol : 'SWEEP';
                const formattedSymbol = '$' + symbol.replace(/^\$/, ''); // Ensure only one $

                // Save latest ticker data
                latestTickerData = {
                    price: formattedPrice,
                    change: formattedChange,
                    changeClass: changeClass,
                    mcap: formattedMcap,
                    volM5: formattedVolM5,
                    volH1: formattedVolH1,
                    volH6: formattedVolH6,
                    volH24: formattedVolH24,
                    symbol: formattedSymbol
                };

                // If first fetch, update ticker immediately
                if (isFirstFetch) {
                    updateTickerBar();
                    isFirstFetch = false;
                }

                // Update Stats Bar (Every 5s)
                updateElement('sync-stat-price', formattedPrice);
                updateElement('sync-stat-change', formattedChange, changeClass);
                updateElement('sync-stat-mcap', formattedMcap);
                updateElement('sync-stat-vol-h24', formattedVolH24);

                // Update Chart Header (Every 5s)
                updateElement('sync-chart-price', formattedPrice);
                updateElement('sync-chart-change', formattedChange, changeClass);

                // Update other Symbols (Every 5s)
                document.querySelectorAll('.dynamic-symbol').forEach(el => {
                    if (!el.closest('.ticker-move')) {
                        el.innerText = formattedSymbol;
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching DexScreener data:", error);
        }
    }

    function updateTickerBar() {
        if (!latestTickerData) return;
        updateElement('sync-ticker-price', latestTickerData.price);
        updateElement('sync-ticker-change', latestTickerData.change, latestTickerData.changeClass);
        updateElement('sync-ticker-mcap', latestTickerData.mcap);
        updateElement('sync-ticker-vol-m5', latestTickerData.volM5);
        updateElement('sync-ticker-vol-h1', latestTickerData.volH1);
        updateElement('sync-ticker-vol-h6', latestTickerData.volH6);
        updateElement('sync-ticker-vol-h24', latestTickerData.volH24);
        
        const tickerSymbolEl = document.querySelector('.ticker-move .dynamic-symbol');
        if (tickerSymbolEl) {
            tickerSymbolEl.innerText = latestTickerData.symbol;
        }
    }

    function updateElement(id, text, changeClass = null) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = text;
            if (changeClass) {
                el.className = ''; // reset classes
                el.classList.add(changeClass);
            }
        }
    }

    // Attach listener for when the ticker animation completes a cycle
    const tickerMoveEl = document.querySelector('.ticker-move');
    if (tickerMoveEl) {
        tickerMoveEl.addEventListener('animationiteration', () => {
            updateTickerBar();
        });
    }

    // Initial fetch
    fetchDexData();
    // Fetch every 5 seconds
    setInterval(fetchDexData, 5000);

    // Real-time Pump.fun Transactions via WebSocket
    const ws = new WebSocket('wss://pumpportal.fun/api/data');
    
    ws.onopen = function() {
        const payload = {
            method: "subscribeTokenTrade",
            keys: [TOKEN_CA]
        };
        ws.send(JSON.stringify(payload));
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.signature && data.txType) {
                addTransactionToDOM(data);
            }
        } catch (err) {
            console.error("Error parsing WS message", err);
        }
    };

    function addTransactionToDOM(tx) {
        const txList = document.getElementById('tx-list');
        if (!txList) return;

        if (txList.innerHTML.includes('Waiting for live')) {
            txList.innerHTML = '';
        }

        const isBuy = tx.txType === 'buy';
        const typeColor = isBuy ? '#00ff88' : '#ff3366';
        const typeText = isBuy ? 'BUY' : 'SELL';
        const icon = isBuy ? '🟢' : '🔴';
        const solAmount = tx.solAmount ? tx.solAmount.toFixed(4) : (tx.vSolInteg / 1000000000 || 0).toFixed(4);
        const maker = tx.traderPublicKey ? tx.traderPublicKey.substring(0, 4) + '...' + tx.traderPublicKey.substring(tx.traderPublicKey.length - 4) : 'Unknown';

        const txHtml = `
            <a href="https://solscan.io/tx/${tx.signature}" target="_blank" class="dex-btn" style="padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; text-decoration: none; border-radius: 0; background: transparent;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.2rem;">${icon}</span>
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: ${typeColor}; font-weight: bold; font-size: 0.9rem;">${typeText}</span>
                        <span style="color: #aaa; font-size: 0.75rem;">${maker}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="text-align: right; color: white; font-weight: bold; font-family: monospace;">
                        ${solAmount} SOL
                    </div>
                    <span class="arrow">></span>
                </div>
            </a>
        `;

        txList.insertAdjacentHTML('afterbegin', txHtml);

        if (txList.children.length > 50) {
            txList.removeChild(txList.lastChild);
        }
    }
});
