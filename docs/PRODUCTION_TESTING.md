# Production Testing

Use this checklist before deploying or after changing Meta channel integrations.

## Required Environment Variables

Set these in local `.env` and in Vercel:

```env
DATABASE_URL=
DIRECT_URL=
GROQ_API_KEY=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
INSTAGRAM_VERIFY_TOKEN=
WHATSAPP_VERIFY_TOKEN=
```

`NEXT_PUBLIC_APP_URL` must be the production domain without a trailing slash.

## Commands

```bash
npm run prisma:migrate
npm run prisma:seed
npm run db:verify
npm run production:check
npm run lint
npm run build
```

For the full local integration pass, keep the app running in one terminal:

```bash
npm run dev
```

Then run:

```bash
npm run production:integration
```

The integration script verifies:

- AEROCORE workspace seed data
- Authentication, logout, protected dashboard routes, and business scoping
- Business settings save
- Instagram and WhatsApp connection save
- Token masking in channel APIs
- Invalid token connection errors
- Instagram and WhatsApp webhook verification
- Instagram and WhatsApp webhook POST handling
- Duplicate `externalMessageId` protection
- End-to-end lead capture through Instagram and WhatsApp webhooks
- Webhook event and send attempt persistence

## Manual UI Checks

1. Login with `owner@aerocore.com / password123`.
2. Open `/dashboard/settings`.
3. Confirm business profile fields show AEROCORE.
4. Confirm Instagram and WhatsApp sections show token fields masked after saving.
5. Open `/dashboard/channels-debug`.
6. Confirm both webhook URLs use `NEXT_PUBLIC_APP_URL`.
7. Run the Instagram and WhatsApp simulation buttons.
8. Open Conversations, Leads, and Notifications to confirm new records appear.

## Manual Meta Setup Still Required

Instagram:

- Instagram account must be Professional.
- Instagram must be connected to a Facebook Page.
- Meta app webhook callback URL:
  `${NEXT_PUBLIC_APP_URL}/api/webhook/instagram`
- Meta webhook verify token:
  `INSTAGRAM_VERIFY_TOKEN`
- Save the Instagram Account ID and Page Access Token in Settings.

WhatsApp:

- Meta app must have WhatsApp Cloud API enabled.
- Meta webhook callback URL:
  `${NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`
- Meta webhook verify token:
  `WHATSAPP_VERIFY_TOKEN`
- Save the WhatsApp Phone Number ID, WhatsApp Business Account ID, and Access Token in Settings.

## Expected Status Labels

- Working: command passes or dashboard action creates the expected record.
- Needs Configuration: code works but a real Meta token, account ID, phone number ID, or webhook subscription is missing.
- Broken: command fails, route returns unexpected non-200 response, or database records are not created.
