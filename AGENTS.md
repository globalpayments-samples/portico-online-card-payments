# Portico Online Card Payments

> Charge cards through the Heartland Portico gateway using client-side tokenization, demonstrated in PHP, Node.js, Python, .NET, Java, and Go.

## Critical Patterns

1. **`withAllowDuplicates(true)` is required for sandbox testing.** Portico's duplicate detection rejects back-to-back transactions using the same card token within a short window. All six implementations pass this flag on every `charge()` call. Without it, consecutive test runs fail with a duplicate-detection error that looks like a code defect but is a gateway policy.

2. **This is Portico (Heartland), not GP-API.** Config class is `PorticoConfig`; the secret credential env var is `SECRET_API_KEY`. If you swap in `GpApiConfig` or read `GP_APP_ID`/`GP_APP_KEY`, the SDK silently uses the wrong auth path and all requests fail with a confusing error.

3. **Card data never reaches the server.** The frontend loads `globalpayments.js` from `js.globalpay.com` and tokenizes the card in the browser using `PUBLIC_API_KEY`. The server only ever receives a `payment_token` string. If `PUBLIC_API_KEY` is missing or wrong, the JS library fails silently — the form hangs and no token is produced.

4. **PHP routes use `.php` file extensions; all other languages do not.** PHP index.html calls `/config.php` and posts to `/process-payment.php`. Every other language's index.html calls `/config` and posts to `/process-payment`. Do not swap index.html files across languages — each is paired with its own backend routing.

## Repository Structure

### PHP (native PHP + Global Payments SDK)
- [`php/config.php`](php/config.php) — serves `GET /config.php`; loads `.env`, returns `PUBLIC_API_KEY`
- [`php/process-payment.php`](php/process-payment.php) — serves `POST /process-payment.php`; `configureSdk()` initializes `PorticoConfig`; `sanitizePostalCode()` strips non-alphanumeric input; `$card->charge()` executes the transaction
- [`php/composer.json`](php/composer.json) — `globalpayments/php-sdk` ^13.1
- [`php/.env.sample`](php/.env.sample) — copy to `.env` before running

### Node.js (Express + Global Payments SDK)
- [`nodejs/server.js`](nodejs/server.js) — single-file server; `PorticoConfig` initialized at module level; `sanitizePostalCode()` helper; `/config` and `/process-payment` route handlers; port via `process.env.PORT || 8000`
- [`nodejs/package.json`](nodejs/package.json) — `globalpayments-api` ^3.10.6
- [`nodejs/.env.sample`](nodejs/.env.sample) — copy to `.env` before running

### Python (Flask + Global Payments SDK)
- [`python/server.py`](python/server.py) — `configure_sdk()` initializes `PorticoConfig`; `get_config()` serves `/config`; `process_payment()` serves `/process-payment`; port via `os.getenv('PORT', 8000)`
- [`python/requirements.txt`](python/requirements.txt) — Flask 3.0, `globalpayments.api` 2.0.4
- [`python/.env.sample`](python/.env.sample) — copy to `.env` before running

### .NET (ASP.NET Core + Global Payments SDK)
- [`dotnet/Program.cs`](dotnet/Program.cs) — `ConfigureGlobalPaymentsSDK()` sets up `PorticoConfig`; `ConfigureEndpoints()` registers routes; `ConfigurePaymentEndpoint()` contains charge logic; `SanitizePostalCode()` helper; port via `PORT` env var defaulting to `"8000"`
- [`dotnet/dotnet.csproj`](dotnet/dotnet.csproj) — `GlobalPayments.Api` 9.0.16
- [`dotnet/.env.sample`](dotnet/.env.sample) — copy to `.env` before running

### Java (Jakarta EE servlet + Global Payments SDK)
- [`java/src/main/java/com/globalpayments/example/ProcessPaymentServlet.java`](java/src/main/java/com/globalpayments/example/ProcessPaymentServlet.java) — `@WebServlet(urlPatterns = {"/process-payment", "/config"})`; `init()` configures `PorticoConfig`; `doGet()` serves `/config`; `doPost()` processes `/process-payment`; `sanitizePostalCode()` helper
- [`java/pom.xml`](java/pom.xml) — `globalpayments-sdk` 14.2.20 (com.heartlandpaymentsystems)
- [`java/.env.sample`](java/.env.sample) — copy to `.env` before running

### Go (net/http + Global Payments SDK)
- [`go/main.go`](go/main.go) — `handleConfig()` serves `/config`; `handlePayment()` processes `/process-payment`; `sanitizePostalCode()` helper; SDK configured in `main()` via `serviceconfigs.NewPorticoConfig()`; port via `os.Getenv("PORT")` fallback to `"8000"`
- [`go/go.mod`](go/go.mod) — `github.com/globalpayments/go-sdk` v1.1.3
- [`go/.env.sample`](go/.env.sample) — copy to `.env` before running

### Shared
- [`docker-compose.yml`](docker-compose.yml) — multi-service; Node.js :8001, Python :8002, PHP :8003, Java :8004, Go :8005, .NET :8006 (all map to internal :8000)
- No root `index.html` — each language dir has its own copy; Go serves from `go/static/`; .NET serves from `dotnet/wwwroot/`

## API Surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/config` (or `/config.php` for PHP) | Returns `publicApiKey` for `globalpayments.js` initialization |
| POST | `/process-payment` (or `/process-payment.php` for PHP) | Accepts `payment_token`, `billing_zip`, `amount` (form-encoded); returns transaction ID |

Node.js, Python, .NET, Java, and Go expose identical paths. PHP uses `.php` extension paths matched to its per-language `index.html`.

## Environment Variables

```bash
PUBLIC_API_KEY=pkapi_cert_...   # Public key for globalpayments.js frontend tokenization
SECRET_API_KEY=skapi_cert_...   # Server-side key for PorticoConfig SDK authentication
PORT=8000                        # Optional; all languages default to 8000
```

A `.env.sample` exists in all six language directories. Copy it to `.env` and fill in your credentials before running.

## Test Cards

Use these card numbers in the Portico sandbox.

| Brand | Number | CVV | Expiry |
|-------|--------|-----|--------|
| Visa | 4012002000060016 | 123 | Any future date |
| Mastercard | 5473500000000014 | 123 | Any future date |

Get sandbox credentials at [developer.globalpayments.com](https://developer.globalpayments.com).

## Architecture Summary

**Payment flow:** Browser loads `globalpayments.js` → card tokenized client-side with `PUBLIC_API_KEY` → form posts `payment_token` + `billing_zip` + `amount` to `/process-payment` → SDK submits charge to Portico cert endpoint → transaction ID returned

**No raw card data on server:** The server only ever receives the token. Raw PAN never crosses the network boundary.

## Security Notes

These demos have no auth on `/process-payment`, hardcode `developerId`/`versionNumber` values, and point to the Heartland certification (sandbox) URL. For production: add auth middleware, replace `serviceUrl` with the production Portico endpoint, use secrets management instead of `.env` files, and enable HTTPS.

## How to Run

```bash
cd php && ./run.sh       # PHP — :8000
cd nodejs && ./run.sh    # Node.js — :8000
cd python && ./run.sh    # Python — :8000
cd dotnet && ./run.sh    # .NET — :8000
cd java && ./run.sh      # Java — :8000
cd go && ./run.sh        # Go — :8000
# All at once:
docker-compose up
```

## How to Verify

```bash
# Config endpoint
curl http://localhost:8000/config
# Expected: {"success":true,"data":{"publicApiKey":"pkapi_cert_..."}}

# /process-payment requires a payment_token from globalpayments.js (browser-generated).
# It cannot be produced with curl alone. Use the HTML form in each language's index.html
# with a test card to run a full end-to-end flow.
```

## Making Changes

All language implementations expose identical behavior (see PHP path divergence in Critical Patterns). A change to one must be applied to all — each language in a separate commit. Do not modify [`docker-compose.yml`](docker-compose.yml) port mappings without updating all six services. Each language dir has its own `index.html` — update all copies when changing the frontend.

## SDK Versions

- **PHP**: `globalpayments/php-sdk` ^13.1
- **Node.js**: `globalpayments-api` ^3.10.6
- **.NET**: `GlobalPayments.Api` 9.0.16
- **Java**: `globalpayments-sdk` (com.heartlandpaymentsystems) 14.2.20
- **Python**: `globalpayments.api` 2.0.4
- **Go**: `github.com/globalpayments/go-sdk` v1.1.3
