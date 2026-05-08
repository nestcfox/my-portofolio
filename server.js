const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple hard-coded user (for demo only)
const USER = {
    username: 'nestcfox',
    password: 'ChasingTheDreams'
};

app.use(
    session({
        secret: 'nestcfox-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 }
    })
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

function requireAuth(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    }

    res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === USER.username && password === USER.password) {
        req.session.loggedIn = true;
        return res.json({ success: true });
    }

    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

app.post('/api/backtest', requireAuth, async (req, res) => {
    const pair = String(req.body.pair || 'bitcoin');
    const direction = String(req.body.direction || 'buy');
    const entryDate = String(req.body.entryDate || '');
    const exitDate = String(req.body.exitDate || '');
    const tpPrice = Number(req.body.tpPrice) || 0;
    const slPrice = Number(req.body.slPrice) || 0;
    const capital = Number(req.body.capital) || 0;
    const leverage = Number(req.body.leverage) || 1;

    try {
        // Fetch historical prices
        const entryPrice = await getPrice(pair, entryDate);
        const exitPrice = await getPrice(pair, exitDate);

        // Determine status and effective exit price based on TP/SL
        let effectiveExitPrice = exitPrice;
        let status = 'Closed';
        if (direction === 'buy') {
            if (tpPrice && exitPrice >= tpPrice) {
                effectiveExitPrice = tpPrice;
                status = 'TP Hit';
            } else if (slPrice && exitPrice <= slPrice) {
                effectiveExitPrice = slPrice;
                status = 'SL Hit';
            }
        } else { // short
            if (tpPrice && exitPrice <= tpPrice) {
                effectiveExitPrice = tpPrice;
                status = 'TP Hit';
            } else if (slPrice && exitPrice >= slPrice) {
                effectiveExitPrice = slPrice;
                status = 'SL Hit';
            }
        }

        const priceDiff = direction === 'buy' ? effectiveExitPrice - entryPrice : entryPrice - effectiveExitPrice;
        const percentage = (priceDiff / entryPrice) * 100;
        const profit = (priceDiff / entryPrice) * capital * leverage;
        const profitFormatted = profit.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

        res.json({
            pair,
            direction,
            entryDate,
            exitDate,
            entryPrice,
            exitPrice,
            tpPrice,
            slPrice,
            capital,
            leverage,
            profit,
            profitFormatted,
            percentage,
            status
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch price data' });
    }
});

async function getPrice(pair, date) {
    if (!date) throw new Error('Date required');

    if (pair === 'bitcoin') {
        // CoinGecko API for BTC
        const [day, month, year] = date.split('-');
        const formattedDate = `${day}-${month}-${year}`;
        const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formattedDate}&localization=false`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('CoinGecko API error');
        const data = await response.json();
        return data.market_data?.current_price?.usd || 0;
    } else if (pair === 'gold') {
        // For Gold, use a simple approximation or dummy data (since free API for gold is limited)
        // In real app, use a paid API like GoldAPI.io
        // For demo, return a dummy price based on date
        const basePrice = 1800; // Approximate gold price in USD
        const daysSince2020 = Math.floor((new Date(date) - new Date('2020-01-01')) / (1000 * 60 * 60 * 24));
        return basePrice + (daysSince2020 * 0.5); // Dummy fluctuation
    }

    throw new Error('Unsupported pair');
}

// Always return index.html for SPA-style routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
