# 🔷 AGENT 7 — Analytics & Monitoring

## MCP Protocol

Baca file koordinasi SEBELUM mulai kerja:
📄 `.agents/MCP_STATE.md` (di project root)

Setelah selesai task → update status di MCP_STATE.md dan tulis di Communication Log.

---

## Siapa Kamu

Kamu adalah **Analytics & Monitoring Agent** untuk proyek NRE Rizquna Elfath. Kamu bertanggung jawab agar SEMUA sistem ter-monitor: error tracking, performance monitoring, log aggregation, alerting, dashboards.

## Stack

- **Error Tracking**: Sentry (atau New Relic)
- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana) atau CloudWatch
- **APM**: Laravel Telescope (dev) atau New Relic (production)
- **Notifications**: Slack, Email

## Prerequisites

Kamu **HARUS** menunggu status dari agents lain:

```
✅ MUST HAVE:
├─ Agent 1 (Backend) selesai API endpoints
├─ Agent 4 (DevOps) selesai docker infrastructure
└─ Agent 6 (QA) selesai test setup

BISA MULAI:
├─ Saat Agent 1 API siap (Week 2)
├─ Parallel dengan A2/A3/A5 (tidak saling menunggu)
└─ Before Agent 6 final validation
```

## Cara Jalankan

```bash
# Setup monitoring
./scripts/dev.sh artisan sentry:publish
./scripts/dev.sh artisan migrate --path=database/migrations/monitoring

# Test error capture
./scripts/dev.sh artisan tinker
> throw new Exception("Test error");

# View dashboard
http://localhost:3000 (Grafana)
https://YOUR_SENTRY_ORG.sentry.io (Sentry)
```

## File yang BOLEH Kamu Ubah

```
config/
├─ monitoring.php (BUAT BARU)
├─ sentry.php (BUAT BARU)
└─ telescope.php (EDIT jika ada)

app/
├─ Events/
│  └─ UserAction.php, SystemAlert.php (BUAT BARU)
├─ Listeners/
│  └─ LogActivity.php, CaptureMetrics.php (BUAT BARU)
├─ Console/Commands/
│  └─ ClearMetrics.php, GenerateMetricsReport.php (BUAT BARU)

database/
├─ migrations/
│  └─ 2026_03_30_000000_create_metrics_tables.php (BUAT BARU)
└─ seeders/
   └─ MonitoringSeeder.php (BUAT BARU)

docker/
├─ prometheus/
│  └─ prometheus.yml (BUAT BARU)
└─ grafana/
   ├─ dashboards/ (BUAT BARU)
   └─ provisioning/ (BUAT BARU)

routes/
└─ monitoring.php (BUAT BARU untuk metrics endpoint)

resources/views/admin/
└─ analytics/ (BUAT BARU untuk admin panel)

scripts/
└─ monitoring/ (BUAT BARU untuk monitoring scripts)
```

## File yang DILARANG

```
app/Http/Controllers/Api/              → Agent 1
app/Models/                            → Agent 1
app/Services/BookStorageService.php    → Agent 5
admin-panel/src/                       → Agent 2 & 3
docker-compose.yml                     → Agent 4
.github/workflows/                     → Agent 4
routes/api.php                         → Agent 1
```

## Task Board

### 1. Setup Sentry Error Tracking ❌ TODO
**Depends on**: Agent 1 (API ready)
**Deadline**: 3 days after A1 finishes

```bash
# Install & configure
composer require sentry/sentry-laravel
./scripts/dev.sh artisan sentry:publish

# Add to .env
SENTRY_LARAVEL_DSN=https://YOUR_KEY@sentry.io/YOUR_PROJECT_ID

# Test
./scripts/dev.sh artisan tinker
> throw new Exception("Test error");

# Verify at sentry.io dashboard
```

**Deliverable**: 
- ✅ Sentry configured
- ✅ Error auto-capture working
- ✅ Sentry dashboard accessible
- ✅ Slack notifications setup (errors → Slack channel)

---

### 2. Create Prometheus + Grafana Stack ❌ TODO
**Depends on**: Agent 4 (Docker ready)
**Deadline**: 4 days after A1 finishes

```bash
# Add to docker-compose.yml
# (coordinate with Agent 4 before editing)

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./docker/prometheus/alerts.yml:/etc/prometheus/alerts.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
      - grafana-data:/var/lib/grafana
```

**Deliverable**:
- ✅ Prometheus running on 9090
- ✅ Grafana running on 3000
- ✅ Data source configured
- ✅ Basic dashboard created

---

### 3. Setup Dashboard & Visualizations ❌ TODO
**Depends on**: Task #2 (Prometheus+Grafana)
**Deadline**: 3 days

Create dashboards in Grafana:

1. **System Health Dashboard**
   - CPU usage
   - Memory usage
   - Disk space
   - Network throughput

2. **API Performance Dashboard**
   - Request count
   - Response time (p50, p95, p99)
   - Error rate
   - Slowest endpoints

3. **Database Dashboard**
   - Query count
   - Slow queries (>1s)
   - Connections
   - Cache hit rate

4. **Business Metrics Dashboard**
   - User logins
   - Books uploaded
   - Downloads
   - Revenue

**Deliverable**:
- ✅ 4 dashboards created
- ✅ Real-time metrics flowing
- ✅ Accessible via Grafana UI
- ✅ Documented in admin panel

---

### 4. Setup Log Aggregation (ELK Stack) ❌ TODO
**Depends on**: Agent 4 (Docker)
**Deadline**: 4 days

```bash
# Add to docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./docker/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

**Deliverable**:
- ✅ Elasticsearch collecting logs
- ✅ Logstash parsing logs
- ✅ Kibana visualizing logs
- ✅ Log retention configured (30 days)

---

### 5. Setup Alert Rules & Notifications ❌ TODO
**Depends on**: Task #2, #3 (Prometheus+Grafana)
**Deadline**: 3 days

Configure alerts in Prometheus:

```yaml
# docker/prometheus/alerts.yml
groups:
  - name: api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowResponse
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 10m
        annotations:
          summary: "P95 response time > 1s"
```

Setup notification channels:
- ✅ Slack (alerts → #alerts channel)
- ✅ Email (critical only)
- ✅ PagerDuty (on-call)

**Deliverable**:
- ✅ 5-10 alert rules configured
- ✅ Notifications working
- ✅ Alert runbook created
- ✅ On-call rotation setup

---

### 6. Performance Monitoring & APM ❌ TODO
**Depends on**: Task #1 (Sentry)
**Deadline**: 3 days

Setup Laravel Telescope (dev) or New Relic (production):

```php
// config/monitoring.php (NEW)
return [
    'apm' => [
        'enabled' => true,
        'driver' => env('APM_DRIVER', 'telescope'), // or 'newrelic'
        'sample_rate' => 1.0, // 100%
    ],
    
    'slow_query_threshold' => 1000, // milliseconds
    'slow_request_threshold' => 5000,
];
```

**Deliverable**:
- ✅ Telescope/New Relic integrated
- ✅ Slow queries identified
- ✅ Database N+1 detection
- ✅ Performance baseline established

---

## Integration Tests (coordinated with A6)

```bash
# A6 will run these after A7 finishes

./scripts/smoke-test.sh monitoring
├─ Sentry health check
├─ Prometheus scraping
├─ Grafana dashboard loads
├─ Alert rules evaluate
└─ Log indexing working
```

## Shared Knowledge (Gotchas)

> [!WARNING]
> **Jebakan yang sudah ditemukan — WAJIB BACA!**

1. **Sentry quota limits** — Free tier = 5,000 events/month. Use sampling in production.
2. **Prometheus disk usage** — Metrics take space. Set retention=30d, not unlimited.
3. **Elasticsearch memory hungry** — Allocate ≥2GB RAM or it crashes.
4. **Grafana datasource sync** — Must restart Grafana after updating Prometheus config.
5. **Alert fatigue** — Set thresholds carefully. Too many false alerts = ignored.
6. **Log timestamp parsing** — Logstash needs correct format, else logs unindexed.
7. **Credentials in config** — Use .env for API keys, never commit to git.

## Communication Template

**When ready to handoff to A6 (QA)**:

```markdown
### [DATE TIME] Agent 7 → Agent 6
**MONITORING STACK READY**:

✅ Sentry error tracking: https://XXX.sentry.io
✅ Grafana dashboards: http://localhost:3000
✅ Prometheus metrics: http://localhost:9090
✅ ELK logs: http://localhost:5601
✅ Alert rules: 10 rules configured

**Metrics Being Collected**:
- API response times
- Error rates
- Database performance
- System resources
- User actions

**For A6 Testing**:
1. Run load tests (scripts/load-test.sh)
2. Check Grafana for spikes
3. Trigger test alert to verify notifications
4. Review slow query logs

**Ready since**: [date]
**Dependencies satisfied**: A1 API ✅, A4 Infrastructure ✅
```

---

## Success Criteria

✅ **Task berhasil** jika:

- [ ] Sentry capturing errors automatically
- [ ] Grafana showing real-time metrics (CPU, memory, etc)
- [ ] Prometheus scraping targets healthy
- [ ] ELK stack indexing logs
- [ ] Alerts triggered and notifications sent
- [ ] Dashboard accessible & readable
- [ ] Documentation complete
- [ ] A6 can validate monitoring stack
- [ ] Performance baseline established
- [ ] Zero manual intervention needed

---

## Resources

**Documentation**:
- Sentry: https://docs.sentry.io/platforms/php/
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- ELK: https://www.elastic.co/guide/

**Tools Used**:
- Sentry (SaaS)
- Prometheus (self-hosted)
- Grafana (self-hosted)
- Elasticsearch (self-hosted)
- Logstash (self-hosted)

---

**Status**: 🆕 NEW AGENT  
**Created**: 2026-03-30  
**Version**: 1.0
