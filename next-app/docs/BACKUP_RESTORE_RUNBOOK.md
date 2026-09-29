# Backup / Restore / Rollback Runbook

## Backup

### Automated Backups (Aiven)

| Item | Status | Evidence |
|------|--------|----------|
| Daily automated backup | ⬜ Cần xác nhận từ Aiven console | Chưa có bằng chứng |
| Backup retention (days) | ⬜ Cần xác nhận | Chưa có bằng chứng |
| PITR (Point-in-Time Recovery) | ⬜ Cần xác nhận | Chưa có bằng chứng |
| Backup encryption | ⬜ Cần xác nhận | Chưa có bằng chứng |
| Backup access control | ⬜ Cần xác nhận | Chưa có bằng chứng |

### Manual Backup Procedure

```bash
# 1. Create database dump
pg_dump $DATABASE_URL --format=custom --file=backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Upload to secure storage (example: S3)
aws s3 cp backup_*.dump s3://your-backup-bucket/karaoke/

# 3. Verify dump integrity
pg_restore --list backup_*.dump > /dev/null && echo "Backup valid"
```

## Restore

### Restore Procedure

```bash
# 1. Create new database (or drop existing)
createdb $RESTORE_DATABASE_URL

# 2. Restore from dump
pg_restore --clean --if-exists $RESTORE_DATABASE_URL < backup_*.dump

# 3. Verify row counts
psql $RESTORE_DATABASE_URL -c "SELECT COUNT(*) FROM \"Booking\";"
psql $RESTORE_DATABASE_URL -c "SELECT COUNT(*) FROM \"Branch\";"
psql $RESTORE_DATABASE_URL -c "SELECT COUNT(*) FROM \"Room\";"

# 4. Run application migrations (if needed)
npm --prefix next-app exec -- prisma migrate deploy

# 5. Update DATABASE_URL to point to restored database
# 6. Restart application
```

### Restore Testing

| Item | Status | Evidence |
|------|--------|----------|
| Restore rehearsal performed | ⬜ Chưa diễn tập | Chưa có bằng chứng |
| RPO (Recovery Point Objective) | ⬜ Cần xác nhận | Chưa có bằng chứng |
| RTO (Recovery Time Objective) | ⬜ Cần xác nhận | Chưa có bằng chứng |

## Rollback

### Application Rollback

1. **Identify bad deploy**: Check Render dashboard for failed health checks
2. **Rollback**: Click "Rollback" on previous successful deploy
3. **Verify**: Health check returns 200 within 60 seconds
4. **Monitor**: Watch error rates for 15 minutes

### Database Rollback

> ⚠️ Database rollback is DESTRUCTIVE. Only perform if data corruption is confirmed.

1. **Stop application** (prevent new writes)
2. **Restore from backup** (see Restore procedure)
3. **Verify data integrity**
4. **Update DATABASE_URL**
5. **Restart application**

### Rollback Testing

| Item | Status | Evidence |
|------|--------|----------|
| Application rollback tested | ⬜ Chưa diễn tập | Chưa có bằng chứng |
| Database rollback tested | ⬜ Chưa diễn tập | Chưa có bằng chứng |

## Monitoring & Alerts

### Required Alerts

| Alert | Threshold | Destination | Status |
|-------|-----------|-------------|--------|
| Health check failure | 2 consecutive failures | ⬜ Cần cấu hình | Chưa có |
| Error rate > 5% | 5 minutes | ⬜ Cần cấu hình | Chưa có |
| Response time p95 > 2s | 5 minutes | ⬜ Cần cấu hình | Chưa có |
| DB connection pool > 80% | 5 minutes | ⬜ Cần cấu hình | Chưa có |
| Disk usage > 80% | 1 hour | ⬜ Cần cấu hình | Chưa có |

### Log Drain

| Destination | Status | Evidence |
|-------------|--------|----------|
| External log aggregation | ⬜ Cần cấu hình | Chưa có bằng chứng |
| Error tracking (Sentry/etc) | ⬜ Cần cấu hình | Chưa có bằng chứng |
| Uptime monitoring | ⬜ Cần cấu hình | Chưa có bằng chứng |

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Complete outage | 15 minutes |
| P1 | Major feature broken | 30 minutes |
| P2 | Minor feature broken | 2 hours |
| P3 | Cosmetic issue | 1 business day |

### Contact

| Role | Name | Contact |
|------|------|---------|
| On-call engineer | | ⬜ Cần cung cấp |
| Business owner | | ⬜ Cần cung cấp |
| Infrastructure | | ⬜ Cần cung cấp |
