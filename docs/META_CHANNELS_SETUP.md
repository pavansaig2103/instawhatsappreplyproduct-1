# Meta Channels Setup

This app supports Meta channel webhooks for Instagram and WhatsApp. Both channels use the same core pipeline:

1. Match FAQ.
2. Use Groq AI fallback when needed.
3. Capture lead details.
4. Create HOT lead notifications.
5. Save conversations and messages to Supabase PostgreSQL.

## Environment variables

Add these locally and in Vercel:

```env
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
INSTAGRAM_VERIFY_TOKEN=""
WHATSAPP_VERIFY_TOKEN=""
```

Use long random strings for the verify tokens. Paste the same values into Meta webhook setup.

## Webhook URLs

The app builds webhook URLs from `NEXT_PUBLIC_APP_URL`:

```text
${NEXT_PUBLIC_APP_URL}/api/webhook/instagram
${NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp
```

Do not use random Vercel preview URLs for production Meta setup.

## Instagram setup checklist

1. Use an Instagram Professional account.
2. Connect the Instagram account to a Facebook Page.
3. Create/configure a Meta app with Instagram messaging permissions.
4. Add webhook URL:
   ```text
   ${NEXT_PUBLIC_APP_URL}/api/webhook/instagram
   ```
5. Use `INSTAGRAM_VERIFY_TOKEN` as the webhook verify token.
6. Subscribe to messaging webhook events.
7. In `/dashboard/settings`, paste:
   - Instagram Account ID
   - Instagram Access Token
8. Click Save, then Test connection.

## WhatsApp setup checklist

1. Create or open a Meta Business app with WhatsApp Cloud API enabled.
2. Add a WhatsApp Business Account and phone number.
3. Copy:
   - WhatsApp Phone Number ID
   - WhatsApp Business Account ID
   - WhatsApp Access Token
4. Add webhook URL:
   ```text
   ${NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp
   ```
5. Use `WHATSAPP_VERIFY_TOKEN` as the webhook verify token.
6. Subscribe to message webhook events.
7. In `/dashboard/settings`, paste:
   - WhatsApp Phone Number ID
   - WhatsApp Business Account ID
   - WhatsApp Access Token
8. Click Save, then Test connection.

## Debug page

Open:

```text
/dashboard/channels-debug
```

The page shows:

- Instagram webhook URL.
- WhatsApp webhook URL.
- Whether verify tokens exist.
- Saved channel connections.
- Last 20 webhook events.
- Last 20 send attempts.
- Simulate Instagram DM.
- Simulate WhatsApp message.

Simulation buttons call the real `processInboundMessage` pipeline and create real dashboard conversations.

## Debug statuses

Webhook event statuses:

- `RECEIVED`: raw payload was saved.
- `PROCESSED`: message was processed and reply send succeeded.
- `FAILED`: processing or send failed.
- `IGNORED`: event was not actionable or was a duplicate.

Send attempt statuses:

- `SUCCESS`: Meta API accepted the outbound reply.
- `FAILED`: Meta API returned an error or network call failed.

## Safety

- Never commit access tokens.
- Tokens are stored server-side only.
- Settings never show full saved tokens.
- Webhook payloads are saved for diagnostics, but access tokens are not part of Meta webhook payloads.
- POST webhooks always return `200` to Meta.
