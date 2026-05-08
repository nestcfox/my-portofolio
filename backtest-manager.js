// Backtest Manager - handles trade table and calculations

class BacktestManager {
    constructor() {
        this.trades = [];
        this.tradeId = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addDefaultTrade();
    }

    setupEventListeners() {
        document.getElementById('addTradeBtn')?.addEventListener('click', () => this.addTrade());
        document.getElementById('runBacktestBtn')?.addEventListener('click', () => this.runBacktest());
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadData());
    }

    addTrade() {
        const trade = {
            id: this.tradeId++,
            pair: 'bitcoin',
            type: 'buy',
            entryDate: '',
            entryPrice: 0,
            sl: 0,
            tp: 0,
            exitDate: '',
            result: 'closed'
        };

        this.trades.push(trade);
        this.renderTable();
    }

    addDefaultTrade() {
        this.addTrade();
    }

    deleteTrade(id) {
        this.trades = this.trades.filter(t => t.id !== id);
        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('tradesBody');
        if (!tbody) return;

        tbody.innerHTML = this.trades.map((trade, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <div class="pair-buttons">
            <button class="pair-btn ${trade.pair === 'bitcoin' ? 'active' : ''}" onclick="backtestManager.updateTrade(${trade.id}, 'pair', 'bitcoin')" style="background: #f7931a; color: white;">BTC/USD</button>
            <button class="pair-btn ${trade.pair === 'gold' ? 'active' : ''}" onclick="backtestManager.updateTrade(${trade.id}, 'pair', 'gold')" style="background: #fbbf24; color: #000;">XAU/USD</button>
          </div>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-buy ${trade.type === 'buy' ? 'active' : ''}" onclick="backtestManager.updateTrade(${trade.id}, 'type', 'buy')">Buy</button>
            <button class="btn-sell ${trade.type === 'sell' ? 'active' : ''}" onclick="backtestManager.updateTrade(${trade.id}, 'type', 'sell')">Sell</button>
          </div>
        </td>
        <td><input type="date" value="${trade.entryDate}" onchange="backtestManager.updateTrade(${trade.id}, 'entryDate', this.value)" class="input-date"></td>
        <td class="cell-price"><input type="number" step="0.01" value="${trade.entryPrice}" placeholder="0.00" onchange="backtestManager.updateTrade(${trade.id}, 'entryPrice', parseFloat(this.value))" class="input-price"></td>
        <td class="cell-sl"><input type="number" step="0.01" value="${trade.sl}" placeholder="0.00" onchange="backtestManager.updateTrade(${trade.id}, 'sl', parseFloat(this.value))" class="input-price"></td>
        <td class="cell-tp"><input type="number" step="0.01" value="${trade.tp}" placeholder="0.00" onchange="backtestManager.updateTrade(${trade.id}, 'tp', parseFloat(this.value))" class="input-price"></td>
        <td class="cell-date"><input type="date" value="${trade.exitDate}" onchange="backtestManager.updateTrade(${trade.id}, 'exitDate', this.value)" class="input-date"></td>
        <td><span class="trade-result result-${trade.result}">${trade.result.toUpperCase()}</span></td>
        <td><button class="btn-delete" onclick="backtestManager.deleteTrade(${trade.id})">Delete</button></td>
      </tr>
    `).join('');
    }

    updateTrade(id, field, value) {
        const trade = this.trades.find(t => t.id === id);
        if (trade) {
            trade[field] = value;
            this.renderTable();
        }
    }

    async runBacktest() {
        if (this.trades.length === 0) {
            alert('Tambahkan minimal 1 trade');
            return;
        }

        // Fetch harga untuk setiap trade
        const tradesWithPrices = await Promise.all(
            this.trades.map(async (trade) => {
                try {
                    const entryPrice = trade.entryPrice || await this.getPrice(trade.pair, trade.entryDate);
                    const exitPrice = await this.getPrice(trade.pair, trade.exitDate);

                    // Determine result
                    let result = 'closed';
                    let effectiveExitPrice = exitPrice;

                    if (trade.type === 'buy') {
                        if (exitPrice >= trade.tp) {
                            result = 'tp';
                            effectiveExitPrice = trade.tp;
                        } else if (trade.sl && exitPrice <= trade.sl) {
                            result = 'sl';
                            effectiveExitPrice = trade.sl;
                        }
                    } else {
                        if (exitPrice <= trade.tp) {
                            result = 'tp';
                            effectiveExitPrice = trade.tp;
                        } else if (trade.sl && exitPrice >= trade.sl) {
                            result = 'sl';
                            effectiveExitPrice = trade.sl;
                        }
                    }

                    trade.entryPrice = entryPrice;
                    trade.exitPrice = effectiveExitPrice;
                    trade.result = result;

                    return trade;
                } catch (error) {
                    console.error('Error fetching price:', error);
                    return trade;
                }
            })
        );

        this.calculateStats(tradesWithPrices);
        this.showResults();
    }

    async getPrice(pair, date) {
        if (!date) throw new Error('Date required');

        if (pair === 'bitcoin') {
            const [year, month, day] = date.split('-');
            const formattedDate = `${day}-${month}-${year}`;
            const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formattedDate}&localization=false`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            return data.market_data?.current_price?.usd || 0;
        } else if (pair === 'gold') {
            // Dummy gold price (use real API in production)
            const basePrice = 1800;
            const daysSince2020 = Math.floor((new Date(date) - new Date('2020-01-01')) / (1000 * 60 * 60 * 24));
            return basePrice + (daysSince2020 * 0.5);
        }

        throw new Error('Unsupported pair');
    }

    calculateStats(trades) {
        const totalTrades = trades.length;
        const winTrades = trades.filter(t => {
            const priceDiff = t.type === 'buy' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
            return priceDiff > 0;
        });
        const lossTrades = totalTrades - winTrades.length;

        let totalProfit = 0;
        let totalLoss = 0;
        let totalPips = 0;
        let maxDrawdown = 0;
        let runningBalance = 0;
        let peakBalance = 0;
        let totalInvested = 0;

        trades.forEach(t => {
            const priceDiff = t.type === 'buy' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
            const percentage = (priceDiff / t.entryPrice) * 100;
            const profit = priceDiff;

            totalInvested += t.entryPrice;

            if (profit > 0) {
                totalProfit += profit;
            } else {
                totalLoss += Math.abs(profit);
            }

            totalPips += priceDiff;
            runningBalance += profit;

            if (runningBalance > peakBalance) {
                peakBalance = runningBalance;
            } else {
                const drawdown = ((peakBalance - runningBalance) / peakBalance) * 100;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        });

        const netProfit = totalProfit - totalLoss;
        const profitFactor = totalLoss === 0 ? 1 : totalProfit / totalLoss;
        const winRate = (winTrades.length / totalTrades) * 100;
        const avgProfit = netProfit / totalTrades;

        this.stats = {
            totalTrades,
            winTrades: winTrades.length,
            lossTrades,
            netProfit,
            profitFactor,
            winRate,
            avgProfit,
            totalProfit,
            totalLoss,
            totalPips,
            maxDrawdown,
            totalInvested
        };
    }

    showResults() {
        const results = document.getElementById('backtestResults');
        if (!results) return;

        const s = this.stats;

        document.getElementById('totalProfit').textContent = `$${s.netProfit.toFixed(2)}`;
        document.getElementById('totalProfitPercent').textContent = `${(s.netProfit / s.totalInvested * 100).toFixed(2)}%`;
        document.getElementById('avgProfit').textContent = `$${s.avgProfit.toFixed(2)}`;
        document.getElementById('avgProfitPercent').textContent = `${(s.avgProfit / (s.totalInvested / s.totalTrades) * 100).toFixed(2)}%`;
        document.getElementById('winRate').textContent = `${s.winRate.toFixed(2)}%`;
        document.getElementById('totalTrades').textContent = `${s.totalTrades} trades`;
        document.getElementById('avgHoldingPeriod').textContent = `${Math.ceil(s.totalTrades / 1)} days`;

        document.getElementById('totalTrade').textContent = `${s.totalTrades}x`;
        document.getElementById('probability').textContent = `${s.winRate.toFixed(2)}%`;
        document.getElementById('riskReward').textContent = `${s.profitFactor.toFixed(2)}:1`;
        document.getElementById('maxDrawdown').textContent = `${s.maxDrawdown.toFixed(2)}%`;

        // Consecutive (simplified)
        document.getElementById('consecutiveProfitTrade').textContent = `${s.winTrades}x`;
        document.getElementById('consecutiveProfitPips').textContent = `${s.totalProfit.toFixed(0)} pips`;
        document.getElementById('consecutiveLossTrade').textContent = `${s.lossTrades}x`;
        document.getElementById('consecutiveLossPips').textContent = `${s.totalLoss.toFixed(0)} pips`;

        results.classList.remove('hidden');
    }

    downloadData() {
        if (this.trades.length === 0) {
            alert('No trades to download');
            return;
        }

        const csv = [
            ['Pair', 'Type', 'Entry Date', 'Entry Price', 'SL', 'TP', 'Exit Date', 'Exit Price', 'Result', 'P&L'],
            ...this.trades.map(t => [
                t.pair,
                t.type,
                t.entryDate,
                t.entryPrice,
                t.sl,
                t.tp,
                t.exitDate,
                t.exitPrice || '-',
                t.result,
                (t.exitPrice - t.entryPrice) || '-'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backtest-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }
}

const backtestManager = new BacktestManager();
