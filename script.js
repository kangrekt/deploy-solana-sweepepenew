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
                
                // Update Browser Title
                document.title = formattedSymbol + " - Stop Wasting Everything";
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

    // Fetch Top Holders from Rugcheck API
    async function fetchRugCheckHolders() {
        const holdersList = document.getElementById('holders-list');
        if (!holdersList) return;
        
        try {
            const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${TOKEN_CA}/report`);
            if (!response.ok) throw new Error("Rugcheck API error");
            const data = await response.json();
            
            if (data) {
                // Update Total Holders in Top Stats Bar
                if (data.totalHolders) {
                    const topHoldersStat = document.getElementById('sync-stat-holders');
                    if (topHoldersStat) {
                        topHoldersStat.innerText = data.totalHolders.toLocaleString('en-US');
                    }
                }
                
                // Calculate and Update Total Supply
                if (data.topHolders && data.topHolders.length > 0) {
                    const firstHolder = data.topHolders[0];
                    if (firstHolder.pct > 0) {
                        // For memecoins (like Pump.fun) this correctly infers the original supply (e.g. 1B)
                        const calculatedSupply = Math.round(firstHolder.uiAmount / (firstHolder.pct / 100));
                        const formattedSupply = calculatedSupply.toLocaleString('en-US');
                        
                        const supplyStat = document.getElementById('sync-stat-supply');
                        if (supplyStat) supplyStat.innerText = formattedSupply;
                        
                        const supplyDonut = document.getElementById('sync-donut-supply');
                        if (supplyDonut) supplyDonut.innerText = formattedSupply;
                    }
                }
                
                // Update Top Holders Card (if exists)
                if (data.topHolders && holdersList) {
                    let html = '';
                    // Get top 8 accounts
                for (let i = 0; i < Math.min(8, data.topHolders.length); i++) {
                    const holder = data.topHolders[i];
                    const percent = holder.pct.toFixed(2);
                    let address = holder.address.substring(0,4) + '...' + holder.address.substring(holder.address.length - 4);
                    let addrColor = "var(--text-main)";
                    
                    if (i === 0 && percent > 5) {
                        address = "Raydium Pool / Maker";
                        addrColor = "var(--neon-cyan)";
                    } else if (holder.insider) {
                        address += " (Insider)";
                        addrColor = "#ff3366";
                    }
                    
                    const amountStr = parseFloat(holder.uiAmountString).toLocaleString('en-US', { maximumFractionDigits: 0 });
                    const ticker = (data.fileMeta && data.fileMeta.symbol) ? data.fileMeta.symbol : "TOKEN";
                    
                    html += `
                        <div class="holder-item">
                            <div class="holder-rank">${i+1}</div>
                            <div class="holder-info">
                                <span class="holder-address" style="color: ${addrColor};">${address}</span>
                                <span class="holder-amount">${amountStr} ${ticker}</span>
                            </div>
                            <div class="holder-percent">${percent}%</div>
                        </div>
                    `;
                }
                
                holdersList.innerHTML = html;
                }
            }
        } catch (e) {
            console.error("Rugcheck fetch failed:", e);
            holdersList.innerHTML = '<div style="text-align: center; color: #ff3366; padding: 20px;">Failed to load holders from Rugcheck. API rate limited.</div>';
        }
    }
    
    // Initial fetch for holders
    fetchRugCheckHolders();

});
