# Instagram DM Setup

This app can receive Instagram DM webhooks from Meta and send replies through the Meta Graph API.

## Requirements

- Instagram account must be a Professional account.
- Instagram account must be connected to a Facebook Page.
- Meta app must have Messenger/Instagram messaging permissions approved for production use.
- The business must have an Instagram Page ID and Page Access Token saved in dashboard settings.

## Environment variable

Add this locally and in Vercel:

```env
INSTAGRAM_VERIFY_TOKEN=""
```

Use any long random string. You will paste the same value into Meta webhook verification.

## Dashboard settings

Open:

```text
/dashboard/settings
```

In the Instagram connection section, paste:

- Instagram Page ID
- Instagram Access Token

Save settings. The status badge shows connected when both values are present.

## Meta webhook URL

In your Meta app webhook settings, use:

```text
https://your-vercel-domain.vercel.app/api/webhook/instagram
```

For local development with a tunnel, use:

```text
https://your-ngrok-domain.ngrok-free.app/api/webhook/instagram
```

Webhook verification:

- Verify token: the same value as `INSTAGRAM_VERIFY_TOKEN`
- Callback URL: `/api/webhook/instagram`

## What happens after connection

When a DM arrives:

1. Meta sends the webhook event to `/api/webhook/instagram`.
2. The app finds the matching business by `instagramPageId`.
3. The existing message pipeline runs:
   - FAQ matching
   - Groq AI fallback
   - lead capture
   - HOT lead notifications
4. The reply is sent back through Meta Graph API.
5. The conversation appears in the existing dashboard.

## Safety notes

- Never commit Instagram access tokens.
- Store tokens only in `.env` or dashboard settings.
- The webhook returns `200` to Meta even when reply sending fails, and logs the send error without logging the token.
