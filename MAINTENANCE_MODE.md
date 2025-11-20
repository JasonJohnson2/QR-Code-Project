# 🔧 Maintenance Mode Guide

## How to Enable/Disable Maintenance Mode

Your Cloudflare Worker now includes a simple maintenance mode toggle!

### To Enable Maintenance Mode:

1. Open `worker.js`
2. Find this line near the top (line 5):
   ```javascript
   const MAINTENANCE_MODE = false;
   ```
3. Change it to:
   ```javascript
   const MAINTENANCE_MODE = true;
   ```
4. Commit and push to your Git repository
5. Cloudflare will automatically deploy the change

### To Disable Maintenance Mode:

1. Open `worker.js`
2. Change the line back to:
   ```javascript
   const MAINTENANCE_MODE = false;
   ```
3. Commit and push

## What Happens When Maintenance Mode is ON?

- ✅ All visitors see a beautiful maintenance page
- ✅ Shows a spinning tools icon with gradient background
- ✅ Returns HTTP 503 status (standard for "Service Unavailable")
- ✅ Includes "Retry-After" header suggesting to check back in 1 hour
- ❌ Payment API (`/api/pay`) is NOT accessible
- ❌ All pages are blocked (index.html, payment-test.html, etc.)

## What Happens When Maintenance Mode is OFF?

- ✅ Normal site operation
- ✅ All pages accessible (index.html, payment-test.html, etc.)
- ✅ Payment API works normally
- ✅ Static assets served as usual

## Quick Deploy Command

If you want to deploy immediately without waiting for Git:

```bash
npx wrangler pages deploy
```

## Preview Before Deploying

Test locally before deploying to production:

```bash
npx wrangler pages dev
```

Then visit `http://localhost:8788` to see how it looks.

## Customizing the Maintenance Page

To customize the message or styling:
1. Open `worker.js`
2. Find the `maintenancePage()` function (around line 40)
3. Edit the HTML/CSS inside
4. Deploy

### Example Customizations:

**Change the message:**
```html
<h1>Scheduled Maintenance</h1>
<p>We're upgrading our servers for better performance.</p>
<p>Expected downtime: 2 hours</p>
```

**Change the colors:**
```css
background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
```

**Add a specific time:**
```html
<div class="time">
  <i class="fas fa-clock"></i>
  We'll be back at 3:00 PM EST
</div>
```

## Tips

- 💡 Enable maintenance mode BEFORE making major changes
- 💡 Test payment functionality in maintenance mode OFF before disabling it
- 💡 Consider scheduling maintenance during off-peak hours
- 💡 The maintenance page is mobile-responsive and looks good on all devices

---

**Current Status:** Maintenance Mode is currently **DISABLED** (set to `false`)

