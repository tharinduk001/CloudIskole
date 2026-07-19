const MAILPIT_URL = "http://127.0.0.1:54324";

type MailpitMessage = { ID: string; To: { Address: string }[]; Created: string };

/**
 * Polls Mailpit for the most recent email to `email` and pulls the 6-digit
 * OTP out of its body. Supabase's local stack routes all auth emails here
 * (see README) so this is how e2e tests complete a real sign-in without any
 * mocking of Supabase Auth itself.
 */
export async function getLatestOtp(email: string, timeoutMs = 15_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const listRes = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=25`);
    if (listRes.ok) {
      const { messages } = (await listRes.json()) as { messages: MailpitMessage[] };
      const match = messages
        .filter((m) => m.To.some((t) => t.Address.toLowerCase() === email.toLowerCase()))
        .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime())[0];

      if (match) {
        const detailRes = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
        const detail = (await detailRes.json()) as { Text: string; HTML: string };
        const body = detail.Text || detail.HTML;
        const code = body.match(/\b(\d{6})\b/)?.[1];
        if (code) return code;
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`No OTP email arrived for ${email} within ${timeoutMs}ms`);
}
