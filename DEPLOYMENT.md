# Cloudflare Pages Deployment Guide

## ✅ Setup Complete!

Your project is now configured to deploy to Cloudflare Pages with the NMI Payments integration using the CDN approach (no npm install needed on Cloudflare).

## 📁 What's Been Added

1. **`wrangler.jsonc`** - Configuration file for Cloudflare deployment
2. **`payment-test.html`** - Standalone test page with NMI Payments via CDN
3. Updated **`index.html`** - Added button to access the payment test page
4. Updated **`index.css`** - Added button styling

## 🚀 How to Deploy to Cloudflare Pages

### Option 1: Via Cloudflare Dashboard (Recommended)

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages**
3. Your project should already be connected to your Git repository
4. Simply **push your changes** to your Git repository
5. Cloudflare will automatically build and deploy

### Option 2: Via Wrangler CLI

```bash
npx wrangler pages deploy
```

## 🧪 Testing Your Deployment

Once deployed, you can access:

- **Main Page**: `https://your-project.pages.dev/`
- **Payment Test**: `https://your-project.pages.dev/payment-test.html`
- **Full Payment Component**: `https://your-project.pages.dev/PaymentComponent/paymentComponent.html`

## 🔑 Important Notes

### NMI API Keys

The test page uses a test tokenization key: `z4ZWYx-QWAv8X-D8X4d5-5NZpD3`

**Replace this with your own NMI tokenization key** in:
- `payment-test.html` (line 192)
- `PaymentComponent/PaymentComponent.js` (line 262)

You can get your tokenization key from your NMI merchant portal.

### CDN Approach (Current Setup)

The payment integration uses **Skypack CDN** to load `@nmipayments/nmi-pay`:

```javascript
import { mountNmiPayments } from 'https://cdn.skypack.dev/@nmipayments/nmi-pay';
```

**Advantages:**
- ✅ No build process needed
- ✅ Works immediately on Cloudflare Pages
- ✅ No npm dependencies to manage
- ✅ Fast deployment

**Alternative CDN providers:**
- [unpkg.com](https://unpkg.com/@nmipayments/nmi-pay)
- [jsdelivr.net](https://cdn.jsdelivr.net/npm/@nmipayments/nmi-pay)

## 🔒 Security

The NMI Payment component uses **tokenization**, meaning:
- Sensitive card data never touches your server
- Payment information is sent directly to NMI
- You only receive a secure token
- Reduces PCI DSS compliance requirements (SAQ A level)

## 📝 Backend Integration

The test page currently **simulates** payment processing. To actually process payments, you need to:

1. Create a backend API endpoint (e.g., `/api/process-payment`)
2. Send the payment token from frontend to your backend
3. Use NMI's server-side API to process the payment with the token

Example backend endpoint needed (not included in static deployment):

```javascript
// Your backend (Node.js, Python, PHP, etc.)
POST /api/process-payment
{
  "paymentToken": "token_from_frontend",
  "amount": 10.99,
  "firstName": "John",
  "lastName": "Doe",
  // ... other customer data
}
```

## 📚 Resources

- [NMI Frontend Integration Guide](https://docs.nmi.com/docs/integration-guide-implement-frontend)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)

## 🐛 Troubleshooting

### "Missing entry-point" Error
✅ **Fixed!** - The `wrangler.jsonc` file now tells Cloudflare to deploy your static assets.

### Payment widget not loading
- Check browser console for errors
- Verify your tokenization key is valid
- Make sure you're using HTTPS (required for payment processing)

### Import errors
- The project uses ES modules with import maps
- Modern browsers only (Chrome 89+, Firefox 108+, Safari 16.4+)

---

**Questions?** Check the console logs in your browser's developer tools - the test page includes comprehensive logging!

