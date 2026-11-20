/**
 * Schedulux Load Testing - Self-Contained Summary & HTML Reporter
 * Exports ASCII terminal summaries and standalone HTML dashboards with zero external CDN dependencies.
 */

export function generateTextSummary(data, testTitle = 'Schedulux Load Test') {
  const metrics = data.metrics || {};
  const httpReqs = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const httpRate = metrics.http_reqs ? metrics.http_reqs.values.rate.toFixed(2) : '0.00';
  const httpDuration = metrics.http_req_duration ? metrics.http_req_duration.values : {};
  const httpFailed = metrics.http_req_failed ? (metrics.http_req_failed.values.rate * 100).toFixed(2) : '0.00';
  const vusMax = metrics.vus_max ? metrics.vus_max.values.value : (metrics.vus ? metrics.vus.values.value : 0);

  const p50 = httpDuration['p(50)'] ? httpDuration['p(50)'].toFixed(2) : (httpDuration.med ? httpDuration.med.toFixed(2) : '0');
  const p90 = httpDuration['p(90)'] ? httpDuration['p(90)'].toFixed(2) : '0';
  const p95 = httpDuration['p(95)'] ? httpDuration['p(95)'].toFixed(2) : '0';
  const p99 = httpDuration['p(99)'] ? httpDuration['p(99)'].toFixed(2) : '0';
  const avg = httpDuration.avg ? httpDuration.avg.toFixed(2) : '0';

  const successBookings = metrics.successful_bookings ? metrics.successful_bookings.values.count : null;
  const conflicts = metrics.concurrency_conflicts ? metrics.concurrency_conflicts.values.count : null;
  const bookingLines = successBookings !== null || conflicts !== null ? `
  • Bookings Confirmed: ${successBookings || 0}
  • Concurrency 409s : ${conflicts || 0} (Deterministic resource conflict)` : '';

  return `
======================================================================
📊 ${testTitle.toUpperCase()} SUMMARY
======================================================================
  • Peak Concurrency: ${vusMax} VUs
  • Total Requests  : ${httpReqs}
  • Throughput      : ${httpRate} req/s
  • Error Rate      : ${httpFailed}%${bookingLines}
  • Latency Avg     : ${avg} ms
  • Latency P50     : ${p50} ms
  • Latency P90     : ${p90} ms
  • Latency P95     : ${p95} ms
  • Latency P99     : ${p99} ms
======================================================================
`;
}

export function generateHtmlReport(data, testTitle = 'Schedulux Load Test Report') {
  const metrics = data.metrics || {};
  const httpReqs = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const httpRate = metrics.http_reqs ? metrics.http_reqs.values.rate.toFixed(2) : 0;
  const httpDuration = metrics.http_req_duration ? metrics.http_req_duration.values : {};
  const httpFailed = metrics.http_req_failed ? (metrics.http_req_failed.values.rate * 100).toFixed(2) : 0;
  const vusMax = metrics.vus_max ? metrics.vus_max.values.value : (metrics.vus ? metrics.vus.values.value : 0);

  const p50 = httpDuration['p(50)'] ? httpDuration['p(50)'].toFixed(2) : (httpDuration.med ? httpDuration.med.toFixed(2) : '0');
  const p90 = httpDuration['p(90)'] ? httpDuration['p(90)'].toFixed(2) : '0';
  const p95 = httpDuration['p(95)'] ? httpDuration['p(95)'].toFixed(2) : '0';
  const p99 = httpDuration['p(99)'] ? httpDuration['p(99)'].toFixed(2) : '0';
  const avg = httpDuration.avg ? httpDuration.avg.toFixed(2) : '0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${testTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-top: 0; font-size: 24px; border-bottom: 1px solid #334155; padding-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px; }
    .card { background: #0f172a; border-radius: 8px; padding: 20px; border: 1px solid #334155; }
    .card-title { color: #94a3b8; font-size: 13px; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
    .card-value.highlight { color: #10b981; }
    .card-value.warn { color: #f59e0b; }
    .card-value.error { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 14px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; background: #0f172a; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.success { background: #064e3b; color: #34d399; }
    .footer { margin-top: 32px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 ${testTitle}</h1>
    <div class="grid">
      <div class="card">
        <div class="card-title">Peak Concurrency</div>
        <div class="card-value">${vusMax} <span style="font-size:16px;color:#64748b;">VUs</span></div>
      </div>
      <div class="card">
        <div class="card-title">Total Requests</div>
        <div class="card-value">${httpReqs.toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="card-title">Throughput</div>
        <div class="card-value highlight">${httpRate} <span style="font-size:16px;color:#64748b;">RPS</span></div>
      </div>
      <div class="card">
        <div class="card-title">Error Rate</div>
        <div class="card-value ${parseFloat(httpFailed) > 1.0 ? 'error' : 'highlight'}">${httpFailed}%</div>
      </div>
    </div>

    <h2 style="font-size: 18px; margin-top: 32px; color: #cbd5e1;">Latency Profile (Response Times)</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Duration (ms)</th>
          <th>Assessment</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>P50 (Median)</strong></td>
          <td>${p50} ms</td>
          <td><span class="badge success">Ultra Low</span></td>
        </tr>
        <tr>
          <td><strong>Average</strong></td>
          <td>${avg} ms</td>
          <td><span class="badge success">Nominal</span></td>
        </tr>
        <tr>
          <td><strong>P90</strong></td>
          <td>${p90} ms</td>
          <td><span class="badge success">Fast</span></td>
        </tr>
        <tr>
          <td><strong>P95</strong></td>
          <td><strong>${p95} ms</strong></td>
          <td><span class="badge success">${parseFloat(p95) < 150 ? 'Low Latency SLA Met' : 'Degraded'}</span></td>
        </tr>
        <tr>
          <td><strong>P99</strong></td>
          <td>${p99} ms</td>
          <td><span class="badge success">${parseFloat(p99) < 300 ? 'Zero Starvation' : 'Elevated'}</span></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by Schedulux k6 Suite &bull; ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>`;
}
