import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// MÉTRICAS
export const getRequestDuration = new Trend('get_request_duration', true);
export const statusOK = new Rate('status_ok');

// CONFIGURAÇÃO DO TESTE
export const options = {
  thresholds: {
    http_req_duration: ['p(90)<6800'], // 90% abaixo de 6800ms
    status_ok: ['rate>0.95'], // 95% devem ser status 200
    get_request_duration: ['p(90)<6800']
  },
  stages: [
    { duration: '30s', target: 7 }, // sobe até 7 VUs
    { duration: '2m', target: 92 }, // rampa até 92 VUs
    { duration: '1m', target: 92 }, // mantém 92 VUs
    { duration: '30s', target: 0 } // rampa para 0 (graceful)
  ]
};

// RELATÓRIO HTML + STDOUT
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// TESTE GET
export default function () {
  const url = 'https://dummyjson.com/products/1';

  const res = http.get(url);

  // métricas
  getRequestDuration.add(res.timings.duration);
  statusOK.add(res.status === 200);

  // check
  check(res, {
    'Status 200 OK': () => res.status === 200
  });
}
