const url = process.env.SANDBOX_URL;
const password = process.env.SANDBOX_PASSWORD;
const expected = process.env.EXPECTED_REVISION;
if (!url || !password || !expected) throw new Error('Missing verification configuration');
const headers = {
  authorization: `Basic ${Buffer.from(`${process.env.SANDBOX_USERNAME ?? 'pilot'}:${password}`).toString('base64')}`,
};
const response = await fetch(`${url}/__host/release`, { headers });
if (!response.ok) throw new Error(`Sandbox startup failed: HTTP ${response.status}`);
const release = await response.json();
if (release.revision !== expected)
  throw new Error(
    `Rollout is not yet verified: expected ${expected}, received ${release.revision}. Re-run verification after rollout completion.`,
  );
const page = await fetch(url, { headers });
if (!page.ok || !(await page.text()).includes('Autono'))
  throw new Error('App HTML verification failed');
console.log(`Verified Autono staging image ${release.revision}`);
