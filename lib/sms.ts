export async function sendSMS(to: string, message: string): Promise<boolean> {
  const apiUser = process.env.ELKS_API_USERNAME;
  const apiPass = process.env.ELKS_API_PASSWORD;

  if (!apiUser || !apiPass) {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  [DEV] SMS till ${to}`);
    console.log(`║  ${message}`);
    console.log(`╚══════════════════════════════════════╝\n`);
    return true;
  }

  try {
    const res = await fetch('https://api.46elks.com/a1/sms', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiUser}:${apiPass}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ from: 'ClubFreja', to, message }),
    });
    return res.ok;
  } catch (err) {
    console.error('SMS error:', err);
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
