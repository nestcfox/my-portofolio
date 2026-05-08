# Portfolio Web3 (Nestcfox)

Ini adalah proyek sederhana untuk website portofolio dengan fitur backtest sederhana.

## Cara menjalankan (server lokal)
1. Buka terminal di folder project (`c:\Users\Hype GLK\Downloads\portofolioweb3`).
2. Jalankan:

```bash
npm install
npm start
```

3. Buka browser ke: http://localhost:3000

## Login (opsional, server)
- **Username:** `nestcfox`
- **Password:** `secret123`

Jika server tidak dijalankan, fitur backtest masih bisa dibuka dengan password lokal:
- **Password lokal:** `nestcfox2026`

## Fitur Backtest
- Jadi ada dua mode:
  1. **Server mode:** login + hit API `/api/backtest` (lebih “nyata”)
  2. **Local mode (fallback):** kalkulasi dilakukan di browser

## Catatan
- Ini adalah demo sederhana, **bukan sistem produksi**.
- Untuk benar-benar mengunci fitur, perlu backend yang terpisah dengan otentikasi nyata.
