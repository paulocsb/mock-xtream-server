# Mock Xtream Codes Server

A tiny mock of the **Xtream Codes Player API** for building and testing **IPTV
client apps** without a real IPTV provider. It answers the endpoints a typical
Xtream client calls and serves only **public-domain / Creative Commons** sample
media — so you can develop, demo, and even pass app-store review without
exposing a paid line.

- **VOD & episodes** → Blender / Google sample films (Big Buck Bunny, Sintel,
  Tears of Steel, …)
- **Live** → Apple and Mux public test HLS streams
- **Any username / password is accepted** — it's a mock.

> Not affiliated with Xtream Codes. For development, testing, CI, and demos.

## Use cases

- Local development against a stable, known dataset.
- CI / automated UI tests.
- App Store / TestFlight review for **login-gated** IPTV clients — reviewers get
  a working sign-in with content that's legal to distribute.
- Demos and screenshots.

## Run it

### Local (Node + Express)

```bash
npm install
npm start            # http://localhost:8080   (override with $PORT)
```

### Cloudflare Workers (always-on HTTPS, free tier)

Requires **Node ≥ 20**.

```bash
npx wrangler login
npx wrangler deploy
```

You get `https://<name>.<subdomain>.workers.dev`, or bind a custom domain in the
Cloudflare dashboard.

### Smoke test (either mode)

```bash
BASE=http://localhost:8080          # or your deployed URL
curl "$BASE/player_api.php?username=demo&password=demo"
curl "$BASE/player_api.php?username=demo&password=demo&action=get_vod_streams"
```

Point your IPTV client at the base URL with any username/password.

## Endpoints

| Request | Returns |
|---|---|
| `GET /player_api.php` *(no action)* | account / auth (status `Active`) |
| `…?action=get_vod_categories` / `get_vod_streams` / `get_vod_info` | movies (VOD) |
| `…?action=get_series_categories` / `get_series` / `get_series_info` | series |
| `…?action=get_live_categories` / `get_live_streams` | live channels |
| `GET /movie/:user/:pass/:id.ext` | 302 → sample MP4 |
| `GET /live/:user/:pass/:id.m3u8` | 302 → test HLS |
| `GET /series/:user/:pass/:id.ext` | 302 → sample MP4 |

## Sample content & attribution

Stream paths 302-redirect to upstream public URLs:

- **Movies / episodes** — [Blender open movies](https://studio.blender.org/films/)
  and Google's public sample videos bucket.
- **Live** — Apple `bipbop` and [Mux](https://test-streams.mux.dev) test HLS
  streams.

All sample media is public-domain / Creative Commons or vendor-provided test
content. Replace it with your own legal sources as needed.

## Customize

Edit the `MOVIES`, `SERIES`, `LIVES`, and `*_TARGET` maps at the top of
`worker.js` (Cloudflare) or `server.js` (Node) to change titles, categories, or
point streams at your own content.

## Files

| File | Purpose |
|---|---|
| `worker.js` | Cloudflare Worker (fetch handler) |
| `server.js` | Node / Express server — same behavior, for local or other hosts |
| `wrangler.toml` | Cloudflare Workers config |

## License

MIT — see [LICENSE](LICENSE).
