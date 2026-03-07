# TradeTrackFX — Paystack Setup Guide

## Quick Reference — 3 Steps to Go Live

---

## Step 1: Get Your Paystack Keys

1. Go to [paystack.com](https://paystack.com) → Sign Up / Log In
2. Go to **Settings → API Keys & Webhooks**
3. Copy:
   - ✅ **Test Secret Key** (starts with `sk_test_...`) — for testing
   - ✅ **Live Secret Key** (starts with `sk_live_...`) — for real payments

---

## Step 2: Upgrade Firebase to Blaze Plan

Cloud Functions require the **Blaze (pay-as-you-go)** plan.
> Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Usage & Billing → Upgrade to Blaze

You won't be charged unless you exceed free tier limits (1M function calls/month is free).

---

## Step 3: Set Your Paystack Secret Key

Run this command IN THE `/functions` folder:

```bash
# Set the key in Firebase Secrets (secure, never exposed)
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# → Paste your sk_test_... or sk_live_... key when prompted
```

---

## Step 4: Set Paystack Callback URL

In Paystack Dashboard → **Settings → API Keys** → **Callback URL**:

```
https://tradetrack-44b18.web.app/payment-success.html
```

> Replace `tradetrack-44b18` with your actual Firebase project ID if different.

---

## Step 5: Set Paystack Webhook URL

In Paystack Dashboard → **Settings → API Keys** → **Webhook URL**:

```
https://us-central1-tradetrack-44b18.cloudfunctions.net/paystackWebhook
```

> Note: Get the exact URL after deploying via `firebase deploy --only functions`

---

## Step 6: Deploy Everything

```bash
# From the project root:
firebase deploy
```

Or deploy separately:

```bash
firebase deploy --only hosting    # Frontend
firebase deploy --only functions  # Backend (requires Blaze)
firebase deploy --only firestore:rules  # Security Rules
```

---

## Step 7: Update Contact Page Social Links

Edit `contact.html` and replace:
- `YOUR_INSTAGRAM_HERE` → your actual Instagram handle (e.g. `@tradetrackfx`)
- `YOUR_TIKTOK_HERE` → your actual TikTok handle

---

## Testing Checklist

Use Paystack **test** mode first:

| Test | Card Number | Expected |
|------|-------------|----------|
| Successful payment | `4084 0840 8408 4081` | Subscription activates |
| Failed payment | `4084 0840 8408 4081` (3D Secure to decline) | No change |
| M-Pesa (test) | Use any valid KE phone number | Confirm via OTP |

Test M-Pesa: Use phone `0700000000` in test mode → it'll simulate instantly.

---

## Architecture Summary

```
User clicks "Get Pro"
    ↓
Frontend calls createPaystackTransaction (Cloud Function)
    ↓
Cloud Function → Paystack API → returns authorization_url
    ↓
User redirected to Paystack checkout (card / M-Pesa)
    ↓
Paystack POSTs to paystackWebhook (Cloud Function)
    ↓
Webhook verifies HMAC signature → Updates Firestore
    ↓
Frontend polls Firestore via real-time listener
    ↓
payment-success.html shows confirmation ✅
```

---

## iPad / Safari Fix Applied

The site now uses:
- **Long-polling mode** on iOS/Safari (prevents connection drops)
- **Graceful persistence fallback** (no more crash on iPad private mode)
- **iPad Pro detection** via `maxTouchPoints`
