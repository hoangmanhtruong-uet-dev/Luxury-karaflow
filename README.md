# Royal Karaoke — Luxury Karaoke Booking Platform

Website đặt phòng karaoke cao cấp: khách hàng xem chi nhánh, phòng, menu, khuyến mãi và đặt phòng trực tuyến; đội vận hành quản lý đặt phòng, khách hàng, dịch vụ, media và thông báo trong cùng một hệ thống.

**Live production:** <https://web-karaoke-el42.onrender.com>

| Môi trường | URL |
| --- | --- |
| Website | <https://web-karaoke-el42.onrender.com> |
| Health check (live) | <https://web-karaoke-el42.onrender.com/api/health/live> |
| Health check (ready) | <https://web-karaoke-el42.onrender.com/api/health/ready> |
| Trang quản trị | <https://web-karaoke-el42.onrender.com/admin/login> |

> Thanh toán trực tuyến đang **tắt** (`PAYMENT_PROVIDER` để trống). Đặt phòng hiện được xác nhận bởi nhân viên.

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Cấu trúc repository](#cấu-trúc-repository)
- [Chạy local](#chạy-local)
- [Biến môi trường](#biến-môi-trường)
- [Lệnh thường dùng](#lệnh-thường-dùng)
- [Trang & API](#trang--api)
- [Kiểm thử](#kiểm-thử)
- [Triển khai production](#triển-khai-production)
- [Vận hành & bảo mật](#vận-hành--bảo-mật)
- [Tài liệu](#tài-liệu)

## Giới thiệu

Repository gồm ứng dụng chính `next-app` và hai template cũ `karaoke-luxury`, `next-monorepo`. **Chỉ `next-app` được phát triển và deploy**; hai template còn lại là Git history độc lập, không được app hoặc CI tham chiếu. Xem [`WORKSPACE_CLEANUP_PLAN.md`](./WORKSPACE_CLEANUP_PLAN.md) trước khi lưu trữ hoặc xóa chúng.

## Tính năng

### Dành cho khách hàng

- **Đặt phòng**: chọn chi nhánh, ngày giờ, phòng và dịch vụ đi kèm; giữ chỗ tạm thời trước khi nhân viên xác nhận.
- **Kiểm tra phòng trống**: tra cứu availability theo chi nhánh, phòng và khung giờ.
- **Tra cứu booking**: xem lại trạng thái đặt phòng bằng mã booking.
- **Danh mục công khai**: chi nhánh, phòng theo hạng (Standard, VIP, Premium, Presidential), menu, gallery, khuyến mãi.
- **Liên hệ**: gửi yêu cầu tư vấn, được lưu vào database và chuyển cho admin.
- **SEO & chia sẻ**: metadata động, Open Graph, sitemap và JSON-LD `LocalBusiness`.

### Dành cho quản trị viên

- Đăng nhập bảo mật bằng Auth.js, phân quyền theo vai trò và phạm vi chi nhánh.
- Bắt buộc đổi mật khẩu lần đầu; hỗ trợ 2FA (TOTP) và mã khôi phục dùng một lần.
- Quản lý booking: xem danh sách/chi tiết, đổi trạng thái, ghi chú, đổi phòng.
- Quản lý liên hệ, khách hàng, lịch đặt phòng, dịch vụ/menu và pricing rule.
- Quản lý nhân viên, media (upload ảnh lên Supabase Storage).
- Theo dõi outbox thông báo và retry thủ công khi gửi thất bại.
- Audit log cho các thao tác quan trọng.

### Nền tảng & vận hành

- Catalog công khai đọc trực tiếp từ PostgreSQL, không còn phụ thuộc dữ liệu tĩnh.
- Transaction và exclusion constraint chống double-booking.
- Idempotency cho thao tác đặt phòng và webhook thanh toán.
- Hàng đợi outbox + cron job cho email, nhắc lịch và hết hạn giữ chỗ.
- Security headers, rate limit, same-origin check, redaction log và production env verifier fail-closed.
- Kiểm thử unit, integration PostgreSQL, E2E Playwright và load test k6.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Ngôn ngữ | TypeScript |
| Giao diện | Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion, Lucide |
| Database | PostgreSQL, Prisma ORM 7 |
| Auth | Auth.js (NextAuth v5), bcryptjs, TOTP |
| Validation | Zod |
| Media | Supabase Storage |
| Testing | Vitest, Testing Library, Playwright, k6 |
| Triển khai | Render |

## Cấu trúc repository

```text
web-karaoke/
├── next-app/                 # Ứng dụng chính (Next.js)
│   ├── src/app/              # Pages, route handlers, admin area
│   ├── src/components/       # UI components
│   ├── src/lib/              # Business logic, auth, jobs, security
│   ├── prisma/               # Schema, migrations, seed
│   ├── e2e/                  # Playwright critical-path tests
│   ├── tests/load/           # k6 load/resilience tests
│   ├── scripts/              # Bootstrap, jobs, env verification
│   └── docs/                 # Runbook vận hành & bảo mật
├── karaoke-luxury/           # Template cũ — không deploy
├── next-monorepo/            # Template cũ — không deploy
├── package.json              # Lệnh root chuyển tiếp sang next-app
└── README.md
```

Root không dùng npm workspaces. Các script root gọi `npm --prefix next-app`, hoạt động trên PowerShell, Command Prompt và shell POSIX mà không cần `cd`.

## Chạy local

### Yêu cầu

- Node.js **20.9+** (khuyến nghị một bản LTS)
- npm
- PostgreSQL (local, Docker hoặc dịch vụ managed)

### Cài đặt

```powershell
npm --prefix next-app ci
Copy-Item next-app/.env.example next-app/.env
```

Trên macOS/Linux:

```sh
cp next-app/.env.example next-app/.env
```

Điền tối thiểu `DATABASE_URL` và `AUTH_SECRET` trong `next-app/.env`, sau đó chạy migration development:

```powershell
npm --prefix next-app exec -- prisma migrate dev
```

Seed dữ liệu mẫu (tuỳ chọn):

```powershell
npm --prefix next-app run prisma:seed
```

Khởi động dev server:

```powershell
npm run dev
```

Mở <http://localhost:3000>. Trang quản trị: <http://localhost:3000/admin/login>.

> Không bao giờ chạy `migrate dev`, reset, truncate hay test trên database production.

## Biến môi trường

Danh sách đầy đủ nằm trong [`next-app/.env.example`](./next-app/.env.example); mẫu production tại [`next-app/.env.production.example`](./next-app/.env.production.example).

| Nhóm | Biến chính | Ghi chú |
| --- | --- | --- |
| Database | `DATABASE_URL` | PostgreSQL; production dùng `sslmode=verify-full` |
| Database TLS | `DATABASE_SSL_CA_BASE64`, `DATABASE_SSL_CA_FILE`, `DATABASE_SSL_ALLOW_UNVERIFIED` | Production bắt buộc CA; không bật unverified |
| Auth | `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST` | `AUTH_URL` phải khớp canonical origin |
| Proxy/origin | `PRODUCTION_CANONICAL_ORIGIN`, `TRUSTED_PROXY_MODE`, `PRODUCTION_EXPECTED_PROXY_MODE` | Kiểm tra bởi verifier |
| Bảo mật | `SECURITY_EVENT_HASH_SECRET`, `TOTP_ENCRYPTION_KEY`, `RECOVERY_CODE_HASH_SECRET` | Mỗi secret một giá trị riêng |
| Brand/public | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_HOTLINE`, `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_BRANCH_SUMMARY`, `NEXT_PUBLIC_OPENING_HOURS` | Không dùng placeholder ở production |
| Media | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Không dùng filesystem local trên serverless |
| Jobs/email | `CRON_SECRET`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_WEBHOOK_URL`, `EMAIL_API_KEY`, `ADMIN_NOTIFICATION_EMAIL` | `EMAIL_PROVIDER=disabled` sẽ tạm dừng outbox |
| Booking | `BOOKING_HOLD_MINUTES`, `BOOKING_REMINDER_MINUTES`, `JOB_BATCH_SIZE` | Mặc định lần lượt 15, 120, 25 |
| Test | `TEST_DATABASE_URL`, `PRODUCTION_DATABASE_HOSTS`, `ALLOW_REMOTE_TEST_DATABASE` | DB test phải kết thúc bằng `_test` |
| Payment | `PAYMENT_PROVIDER`, `PAYMENT_WEBHOOK_SECRET` | Để trống khi thanh toán đang tắt |

Kiểm tra cấu hình production (in ra giá trị đã redact):

```powershell
npm --prefix next-app run verify:production-env
```

Chỉ deploy khi kết quả là `RESULT=PASS`.

## Lệnh thường dùng

### Từ root

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy dev server |
| `npm run build` | Tạo production build |
| `npm run start` | Chạy production build |
| `npm run lint` | Chạy ESLint |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm test` | Chạy unit/component tests |
| `npm run test:integration` | Chạy integration test trên DB test riêng |
| `npm run test:integration:local` | Kiểm tra DB local rồi chạy integration test |
| `npm run test:db:up` / `test:db:down` | Bật/tắt PostgreSQL test bằng Docker Compose |

### Trong `next-app`

| Lệnh | Mục đích |
| --- | --- |
| `npm run test:watch` | Chạy Vitest ở chế độ watch |
| `npm run test:e2e` | Chạy Playwright E2E |
| `npm run test:e2e:ui` | Mở Playwright UI |
| `npm run prisma:seed` | Seed dữ liệu mẫu |
| `npm run admin:bootstrap` | Tạo admin đầu tiên (một lần) |
| `npm run job:expire-bookings` | Hết hạn các booking giữ chỗ quá hạn |
| `npm run job:create-reminders` | Tạo sự kiện nhắc lịch |
| `npm run job:process-outbox` | Xử lý một batch outbox |
| `npm run format` | Format bằng Prettier |

## Trang & API

### Trang công khai

| Route | Mô tả |
| --- | --- |
| `/` | Trang chủ |
| `/booking` | Form đặt phòng |
| `/booking/lookup` | Tra cứu booking |
| `/branches`, `/branches/[slug]` | Danh sách và chi tiết chi nhánh |
| `/rooms` | Danh sách phòng |
| `/menu` | Menu đồ ăn/uống |
| `/gallery` | Thư viện không gian |
| `/promotions` | Khuyến mãi |
| `/contact` | Liên hệ |

### Trang quản trị

| Route | Mô tả |
| --- | --- |
| `/admin/login` | Đăng nhập |
| `/admin` | Dashboard |
| `/admin/bookings`, `/admin/bookings/[id]` | Quản lý booking |
| `/admin/calendar` | Lịch đặt phòng |
| `/admin/contact-requests` | Yêu cầu liên hệ |
| `/admin/customers` | Khách hàng |
| `/admin/services` | Dịch vụ/menu |
| `/admin/media` | Quản lý media |
| `/admin/payments` | Thanh toán (read-only) |
| `/admin/outbox` | Outbox/dead-letter |
| `/admin/staff` | Nhân viên |
| `/admin/2fa`, `/admin/2fa/setup` | Quản lý 2FA |

### API chính

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/api/branches` | GET | Chi nhánh đang hoạt động |
| `/api/rooms` | GET | Phòng đang hoạt động |
| `/api/menu-items` | GET | Menu đang hoạt động |
| `/api/availability` | GET | Kiểm tra phòng trống |
| `/api/bookings` | POST | Tạo booking |
| `/api/booking/lookup` | GET | Tra cứu booking |
| `/api/contact` | POST | Gửi liên hệ |
| `/api/health/live` | GET | Liveness |
| `/api/health/ready` | GET | Readiness (bao gồm DB) |
| `/api/admin/*` | — | API quản trị, yêu cầu session + quyền |
| `/api/internal/jobs/*` | POST | Cron jobs, yêu cầu `Authorization: Bearer <CRON_SECRET>` |
| `/api/payments/webhook` | POST | Webhook thanh toán (chỉ bật khi có provider) |

## Kiểm thử

Chạy nhanh trước khi push:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Integration test cần PostgreSQL riêng, database name kết thúc bằng `_test`:

```powershell
$env:TEST_DATABASE_URL="postgresql://test_user:test_password@localhost:5432/web_karaoke_test"
npm run test:integration
```

Runner sẽ từ chối production mode, DB không có hậu tố `_test`, host remote và target trùng `DATABASE_URL`. Nếu Docker đã cài, có thể dùng:

```powershell
Copy-Item next-app/.env.test.local.example next-app/.env.test.local
npm run test:db:up
npm run test:integration:local
npm run test:db:down
```

E2E (Playwright; cần build và server chạy tại `http://localhost:3000`):

```powershell
npm run build
npm --prefix next-app run test:e2e
```

CI trên GitHub Actions là nguồn xác nhận chính thức cho integration test PostgreSQL.

## Triển khai production

Ứng dụng chạy trên **Render** (Node Web Service):

| Cấu hình | Giá trị |
| --- | --- |
| Root Directory | `next-app` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| Health Check Path | `/api/health/ready` |

Quy trình phát hành:

1. Chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. Chạy integration test trên database test cô lập.
3. Chạy `npm --prefix next-app run verify:production-env` và yêu cầu `RESULT=PASS`.
4. Backup database, review migration rồi apply bằng credential migration riêng:

   ```powershell
   npm --prefix next-app exec -- prisma migrate deploy
   ```

5. Deploy đúng commit đã pass CI, sau đó kiểm tra `/api/health/live` và `/api/health/ready` trả `200`.

### Tạo admin đầu tiên

Chỉ chạy một lần, khi chưa có admin active:

```powershell
$env:ALLOW_ADMIN_BOOTSTRAP="true"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
$env:BOOTSTRAP_ADMIN_NAME="Admin"
$env:BOOTSTRAP_ADMIN_PASSWORD="<mật-khẩu-mạnh>"
npm --prefix next-app run admin:bootstrap
```

Sau khi bootstrap thành công, xóa toàn bộ biến `ALLOW_ADMIN_BOOTSTRAP` và `BOOTSTRAP_ADMIN_*`. Lần chạy thứ hai sẽ bị từ chối nếu đã có admin active.

### Cron jobs

Chạy từ worker host:

```powershell
npm --prefix next-app run job:expire-bookings
npm --prefix next-app run job:create-reminders
npm --prefix next-app run job:process-outbox
```

Hoặc gọi HTTP với `CRON_SECRET`:

```text
POST /api/internal/jobs/expire-bookings
POST /api/internal/jobs/create-reminders
POST /api/internal/jobs/process-outbox
Authorization: Bearer <CRON_SECRET>
```

Các job có batch giới hạn và an toàn khi chạy chồng lấn.

## Vận hành & bảo mật

- **Health checks**: `/api/health/live` kiểm tra process; `/api/health/ready` kiểm tra kết nối database. Dùng readiness làm health check của Render.
- **Secrets**: không commit secret; nhập trực tiếp trong secret manager của Render. `TOTP_ENCRYPTION_KEY` và `RECOVERY_CODE_HASH_SECRET` phải là hai giá trị độc lập.
- **Migration**: chỉ dùng `prisma migrate deploy` ở production; không chạy `migrate dev` hoặc reset.
- **Backup/restore**: rehearsal theo [`next-app/docs/BACKUP_RESTORE_RUNBOOK.md`](./next-app/docs/BACKUP_RESTORE_RUNBOOK.md).
- **Sự cố**: xem [`next-app/docs/INCIDENT_RESPONSE_RUNBOOK.md`](./next-app/docs/INCIDENT_RESPONSE_RUNBOOK.md) và [`next-app/docs/FAILURE_RESPONSE_MATRIX.md`](./next-app/docs/FAILURE_RESPONSE_MATRIX.md).
- **Bảo mật**: admin pages/API yêu cầu auth; mutation chính có permission, validation, same-origin và rate limit. Security headers, no-store cho admin và log redaction đã bật.
- **Payment**: real-money payment đang tắt; không cấu hình `PAYMENT_PROVIDER`/`PAYMENT_WEBHOOK_SECRET` cho đến khi hoàn tất kiểm thử sandbox và reconciliation.

## Tài liệu

| Tài liệu | Nội dung |
| --- | --- |
| [`next-app/README.md`](./next-app/README.md) | Chi tiết ứng dụng, thiết kế và API |
| [`PRODUCTION_CHECKLIST.md`](./PRODUCTION_CHECKLIST.md) | Checklist trước phát hành |
| [`next-app/docs/PRIVATE_PRODUCTION_DEPLOYMENT.md`](./next-app/docs/PRIVATE_PRODUCTION_DEPLOYMENT.md) | Runbook deploy production |
| [`next-app/docs/DEPLOYMENT.md`](./next-app/docs/DEPLOYMENT.md) | Deployment manifest (Render) |
| [`next-app/docs/SECURITY_OPERATIONS.md`](./next-app/docs/SECURITY_OPERATIONS.md) | Vận hành bảo mật |
| [`next-app/docs/SECURITY_AUDIT.md`](./next-app/docs/SECURITY_AUDIT.md) | Kết quả audit bảo mật |
| [`next-app/docs/LOAD_TEST_PLAN.md`](./next-app/docs/LOAD_TEST_PLAN.md) | Kế hoạch load test |
| [`RELEASE_STATUS_2026-08-01.md`](./RELEASE_STATUS_2026-08-01.md) | Trạng thái release gần nhất |
| [`FINAL_PROJECT_AUDIT.md`](./FINAL_PROJECT_AUDIT.md) | Audit tổng thể dự án |

---

Website được xây dựng cho **Royal Karaoke** — không gian giải trí sang trọng, phòng riêng và dịch vụ chuẩn VIP.
