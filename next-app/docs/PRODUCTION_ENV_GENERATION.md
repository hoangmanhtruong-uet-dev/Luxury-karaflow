# Hướng dẫn sinh Production Secrets

Tài liệu này hướng dẫn cách sinh từng secret cần thiết cho production environment.

## 1. AUTH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 2. SECURITY_EVENT_HASH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. RECOVERY_CODE_HASH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 4. TOTP_ENCRYPTION_KEY (32 bytes, base64)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 5. CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 6. DATABASE_SSL_CA (nếu dùng Aiven)

Tải CA certificate từ Aiven console, sau đó:

```bash
# Trên Linux/macOS:
base64 -w 0 ca.pem > ca.base64
# Copy nội dung ca.base64 vào DATABASE_SSL_CA_BASE64

# Trên Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ca.pem"))
```

## 7. PRODUCTION_CANONICAL_ORIGIN

```
https://your-domain.com
```

## 8. AUTH_URL

```
https://your-domain.com
```

## 9. TRUSTED_PROXY_MODE

Chọn một trong:
- `cloudflare` — nếu dùng Cloudflare
- `vercel` — nếu deploy trên Vercel
- `single` — nếu chỉ có một proxy layer

## 10. PRODUCTION_EXPECTED_PROXY_MODE

Phải **giống** `TRUSTED_PROXY_MODE`.

## 11. NEXT_PUBLIC_SITE_URL

```
https://your-domain.com
```

## 12. NEXT_PUBLIC_HOTLINE

Số điện thoại thật, format: `0901234567` (9-11 digits, không bắt đầu bằng `1900`).

## Kiểm tra sau khi cấu hình

```bash
npm run verify:production-env
```

Kết quả phải là `RESULT=PASS`. Nếu `RESULT=FAIL`, kiểm tra lại các biến được đánh dấu FAIL trong output.
