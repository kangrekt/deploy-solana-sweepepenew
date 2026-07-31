document.addEventListener('DOMContentLoaded', () => {
    // --- Auto-Scale Layout to fit any screen like an image (Desktop Only) ---
    function autoScaleLayout() {
        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            document.body.style.zoom = 1;
            document.body.style.transform = 'none';
            document.body.style.width = '100%';
            document.documentElement.style.height = 'auto';
            return;
        }

        const targetWidth = 1920;
        const currentWidth = window.innerWidth;
        const scale = currentWidth / targetWidth;
        
        // Lock width to 1920px for desktop scaling
        document.body.style.width = '1920px';
        
        // Use CSS zoom for WebKit/Blink (Chrome, Edge, Safari, Opera)
        document.body.style.zoom = scale;
        
        // Fallback for Firefox
        if (navigator.userAgent.toLowerCase().includes('firefox')) {
            document.body.style.transform = `scale(${scale})`;
            document.body.style.transformOrigin = 'top left';
            // Adjust height to prevent empty space below
            document.documentElement.style.height = (document.body.scrollHeight * scale) + 'px';
        }
    }
    window.addEventListener('resize', autoScaleLayout);
    autoScaleLayout(); // Run immediately

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
    const caElement = document.getElementById('ca-text');
    const TOKEN_CA = caElement ? caElement.innerText.trim() : '';
    const isSoon = !TOKEN_CA || TOKEN_CA.toUpperCase() === 'SOON';

    const DEX_API_URL = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_CA}`;

    // Update iframe chart dynamically
    const chartIframe = document.querySelector('.chart-placeholder iframe');
    if (isSoon) {
        const chartPlaceholder = document.querySelector('.chart-placeholder');
        if (chartPlaceholder) {
            chartPlaceholder.innerHTML = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size: 4rem; font-weight: 900; color: var(--neon-cyan); letter-spacing: 5px; text-shadow: 0 0 20px var(--neon-cyan); font-family: \'Orbitron\', sans-serif;">SOON</div>';
        }
        document.querySelectorAll('.dynamic-symbol').forEach(el => {
            el.innerText = '$SWEEP';
        });
        document.title = "$SWEEP - Stop Wasting Everything";
    } else if (chartIframe) {
        chartIframe.src = `https://dexscreener.com/solana/${TOKEN_CA}?embed=1&theme=dark&trades=0&info=0`;
    }

    // Update Solscan Holders link dynamically
    const solscanLink = document.getElementById('solscan-holders-link');
    if (solscanLink) {
        solscanLink.href = `https://solscan.io/token/${TOKEN_CA}#holders`;
    }

    // Real-time LP Locked Sync via RugCheck
    async function syncLpLocked() {
        if (isSoon) return;
        try {
            const res = await fetch(`https://api.rugcheck.xyz/v1/tokens/${TOKEN_CA}/report`);
            const data = await res.json();
            
            const lpEl = document.getElementById('sync-lp-locked');
            if (!lpEl || !data.markets || data.markets.length === 0) return;

            // Calculate total LP locked percentage exactly like RugCheck Web UI
            let totalLockedUSD = 0;
            data.markets.forEach(m => {
                if (m.lp && m.lp.lpLockedUSD) {
                    totalLockedUSD += m.lp.lpLockedUSD;
                }
            });

            const totalMarketLiquidity = data.totalMarketLiquidity || 0;
            let pct = 0;

            if (totalMarketLiquidity > 0) {
                pct = (totalLockedUSD / totalMarketLiquidity) * 100;
            } else {
                // Fallback if totalMarketLiquidity is 0
                let biggestPool = data.markets.sort((a,b) => (b.lp?.quoteUSD || 0) - (a.lp?.quoteUSD || 0))[0];
                if (biggestPool && biggestPool.lp && typeof biggestPool.lp.lpLockedPct === 'number') {
                    pct = biggestPool.lp.lpLockedPct;
                }
            }

            if (pct >= 99.9) {
                lpEl.innerText = '100% LOCKED';
                lpEl.style.color = 'var(--up-green)';
            } else if (pct > 0) {
                lpEl.innerText = `${pct.toFixed(2)}%`;
                if (pct < 50) {
                    lpEl.style.color = 'var(--down-red)';
                } else {
                    lpEl.style.color = 'var(--neon-cyan)';
                }
            } else {
                lpEl.innerText = 'UNLOCKED / CLMM';
                lpEl.style.color = 'var(--down-red)';
            }
            // Sync Creator Address
            const creatorEl = document.getElementById('sync-creator');
            if (creatorEl && data.creator) {
                const c = data.creator;
                const shortC = c.substring(0, 4) + '...' + c.substring(c.length - 4);
                // Create a clickable link to Solscan
                creatorEl.innerHTML = `<a href="https://solscan.io/account/${c}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,0.5);">${shortC}</a>`;
                creatorEl.style.color = '#fff';
            }
            
        } catch (e) {
            console.error('LP sync error:', e);
        }
    }
    syncLpLocked();

    // Update any Buy links to Pump.fun dynamically
    document.querySelectorAll('a').forEach(link => {
        if (link.innerText.includes('BUY') && link.getAttribute('href') === '#') {
            link.href = `https://pump.fun/${TOKEN_CA}`;
            link.target = "_blank";
        }
    });

    let latestTickerData = null;
    let isFirstFetch = true;

    async function fetchDexData() {
        if (isSoon) return;
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
        if (isSoon) return;
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
                        let address = holder.address.substring(0, 4) + '...' + holder.address.substring(holder.address.length - 4);
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
                            <div class="holder-rank">${i + 1}</div>
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

    // Load Memes from JSON
    async function loadMemes() {
        const memeContainer = document.getElementById('meme-grid-container');
        if (!memeContainer) return;

        try {
            // Append a random timestamp to prevent browser caching old memes.json
            const response = await fetch('memes.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error("Could not load memes.json");
            const memes = await response.json();

            memeContainer.innerHTML = '';
            // Store all meme elements to easily paginate them
            const memeElements = [];

            memes.forEach(meme => {
                const memeDiv = document.createElement('div');
                memeDiv.classList.add('meme-thumbnail');
                // Render as a pure image instead of background/video
                memeDiv.innerHTML = `
                    <img src="${meme.thumbnail || meme.url}" alt="${meme.title || 'Meme'}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
                `;

                // Open image in modal if clicked
                memeDiv.addEventListener('click', () => {
                    openVideoModal(meme.thumbnail || meme.url);
                });

                memeContainer.appendChild(memeDiv);
                memeElements.push(memeDiv);
            });

            // --- NEW: Lock Grid Height with Blank Placeholders ---
            // Pad the array with invisible divs until it's a multiple of 12
            // This ensures the grid always stays 2 rows tall even on the last page!
            while (memeElements.length % 12 !== 0) {
                const blankDiv = document.createElement('div');
                blankDiv.classList.add('meme-thumbnail');
                blankDiv.style.visibility = 'hidden'; // Takes up space but is invisible
                memeContainer.appendChild(blankDiv);
                memeElements.push(blankDiv);
            }
            // -----------------------------------------------------

            // --- Pagination Logic ---
            let currentPage = 0;
            const itemsPerPage = 12; // Exactly 2 rows (6 columns * 2)
            const prevBtn = document.getElementById('prev-memes-btn');
            const nextBtn = document.getElementById('next-memes-btn');

            function renderMemePage() {
                const start = currentPage * itemsPerPage;
                const end = start + itemsPerPage;

                memeElements.forEach((el, index) => {
                    if (index >= start && index < end) {
                        el.style.display = 'block';
                    } else {
                        el.style.display = 'none'; // Completely hides the element from the grid
                    }
                });

                // Update button states
                if (prevBtn && nextBtn) {
                    if (currentPage === 0) {
                        prevBtn.style.opacity = '0.5';
                        prevBtn.style.pointerEvents = 'none';
                    } else {
                        prevBtn.style.opacity = '1';
                        prevBtn.style.pointerEvents = 'auto';
                    }

                    if (end >= memeElements.length) {
                        nextBtn.style.opacity = '0.5';
                        nextBtn.style.pointerEvents = 'none';
                    } else {
                        nextBtn.style.opacity = '1';
                        nextBtn.style.pointerEvents = 'auto';
                    }
                }
            }

            if (prevBtn && nextBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 0) {
                        currentPage--;
                        renderMemePage();
                    }
                });

                nextBtn.addEventListener('click', () => {
                    if ((currentPage + 1) * itemsPerPage < memeElements.length) {
                        currentPage++;
                        renderMemePage();
                    }
                });
            }

            // Function to strictly align Holders List with Meme Grid
            function syncHoldersHeight() {
                const holdersList = document.getElementById('holders-list');
                if (memeContainer && holdersList) {
                    // Reset height first to get accurate natural top position
                    holdersList.style.maxHeight = 'none';

                    const memeGridRect = memeContainer.getBoundingClientRect();
                    const holdersListRect = holdersList.getBoundingClientRect();

                    // Calculate current JS scale factor applied to the body (if desktop)
                    const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
                    const scale = isMobile ? 1 : (window.innerWidth / 1920);

                    // Pixel-perfect calculation: Bottom of meme grid - Top of holders list, divided by scale
                    const targetHeight = (memeGridRect.bottom - holdersListRect.top) / scale;

                    holdersList.style.maxHeight = Math.max(100, targetHeight) + 'px';
                }
            }

            // Initial render
            renderMemePage();

            // Sync heights slightly after render to ensure images are calculated
            setTimeout(syncHoldersHeight, 100);
            window.addEventListener('resize', syncHoldersHeight);

            // ------------------------
        } catch (error) {
            console.error("Error loading memes:", error);
            memeContainer.innerHTML = '<div style="color: #aaa; grid-column: 1 / -1; text-align: center;">Could not load memes...</div>';
        }
    }

    // Video Modal Logic
    const videoModal = document.getElementById('video-modal');
    const videoModalBody = document.getElementById('video-modal-body');
    const videoModalClose = document.querySelector('.video-modal-close');

    function openVideoModal(url) {
        if (!videoModal) return;
        videoModalBody.innerHTML = `
                        <img src="${url}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
                    `; videoModal.style.display = 'flex';
    }

    function closeVideoModal() {
        if (!videoModal) return;
        videoModal.style.display = 'none';
        videoModalBody.innerHTML = ''; // This stops the video completely
    }

    if (videoModalClose) {
        videoModalClose.addEventListener('click', closeVideoModal);
    }

    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }

    loadMemes();

});

// Particles.js Init (From Clanker)
if (window.particlesJS) {
    particlesJS('particles-js', {
        'particles': {
            'number': { 'value': 80, 'density': { 'enable': true, 'value_area': 800 } },
            'color': { 'value': '#00dfff' }, /* Changed from Clanker purple to Sweep Cyan */
            'shape': { 'type': 'circle' },
            'opacity': { 'value': 0.5, 'random': true },
            'size': { 'value': 3, 'random': true },
            'line_linked': { 'enable': true, 'distance': 150, 'color': '#00dfff', 'opacity': 0.2, 'width': 1 },
            'move': { 'enable': true, 'speed': 2, 'direction': 'none', 'random': true, 'straight': false, 'out_mode': 'out', 'bounce': false }
        },
        'interactivity': {
            'detect_on': 'canvas',
            'events': {
                'onhover': { 'enable': true, 'mode': 'grab' },
                'onclick': { 'enable': true, 'mode': 'push' },
                'resize': true
            },
            'modes': {
                'grab': { 'distance': 140, 'line_linked': { 'opacity': 1 } },
                'push': { 'particles_nb': 4 }
            }
        },
        'retina_detect': true
    });
}
