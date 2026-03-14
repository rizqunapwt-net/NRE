import http from 'http';

const API_BASE = 'http://localhost:9000/api/v1';

const endpoints = [
  '/public/catalog',
  '/public/categories',
  '/public/stats',
];

const iterations = 50;

async function runBenchmark() {
  console.log(`🚀 Starting API Performance Benchmark (${iterations} iterations per endpoint)\n`);

  for (const endpoint of endpoints) {
    const times = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await new Promise((resolve, reject) => {
          http.get(`${API_BASE}${endpoint}`, (res) => {
            res.on('data', () => {}); // consume data
            res.on('end', () => {
              if (res.statusCode === 200) {
                resolve();
              } else {
                reject(new Error(`Status ${res.statusCode}`));
              }
            });
          }).on('error', reject);
        });
        const end = performance.now();
        times.push(end - start);
      } catch (e) {
        errors++;
      }
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`   - Average: ${avg.toFixed(2)} ms`);
    console.log(`   - Min: ${min.toFixed(2)} ms`);
    console.log(`   - Max: ${max.toFixed(2)} ms`);
    console.log(`   - Errors: ${errors}\n`);
  }
}

runBenchmark();
