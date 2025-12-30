# Quick Setup Guide

## Required Environment Variables

Create a `.env` file in the project root with these variables:

```env
# Required - Get these from your Supabase project dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional - For email notifications (get free key from resend.com)
RESEND_API_KEY=re_your_key_here
```

## Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Getting Email API Key (Optional)

1. Go to [resend.com](https://resend.com) and sign up
2. Create a free account (100 emails/day)
3. Go to **API Keys** and create a new key
4. Copy the key → `RESEND_API_KEY`

Without this, the system will still work but won't send email notifications.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your credentials
# (See above)

# 3. Run the application
npm run dev
```

## Automated Price Checking

The system includes manual price checking via the "Check Prices Now" button. For automatic scheduled checks:

### Option 1: Cron Job (Linux/Mac)

Add to crontab (`crontab -e`):

```bash
# Check prices every 6 hours
0 */6 * * * curl -X POST https://your-project.supabase.co/functions/v1/check-prices -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Option 2: GitHub Actions

Create `.github/workflows/check-prices.yml`:

```yaml
name: Check Prices
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  check-prices:
    runs-on: ubuntu-latest
    steps:
      - name: Check Prices
        run: |
          curl -X POST https://your-project.supabase.co/functions/v1/check-prices \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Option 3: Cron-job.org

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Add new cron job:
   - URL: `https://your-project.supabase.co/functions/v1/check-prices`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_ANON_KEY`
   - Schedule: Every 6 hours

## How to Use

1. **Add a Product**:
   - Paste Amazon product URL
   - Add your email (optional)
   - Set target price or use AI prediction
   - Click "Track This Product"

2. **View Details**:
   - Click on any product card
   - See price history chart
   - Check AI predictions
   - View alert status

3. **Check Prices**:
   - Click "Check Prices Now" button
   - Or wait for scheduled checks
   - System updates prices and sends alerts

## Testing

Test with any Amazon product URL:
```
https://www.amazon.com/dp/B08N5WRWNW
```

## Troubleshooting

**"Failed to add product"**
- Verify Amazon URL is valid
- Try a different product
- Amazon may be blocking the request

**"Failed to fetch products"**
- Check `.env` file exists and has correct values
- Verify Supabase project is active
- Check browser console for detailed errors

**Email not sending**
- Verify `RESEND_API_KEY` is set in `.env`
- Check email address is valid
- Look in spam folder
- System works without email - just no notifications

**Prices not updating**
- Use "Check Prices Now" button
- Amazon may be rate limiting
- Wait a few minutes and try again

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to your preferred hosting:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Any static hosting

3. Set environment variables in hosting dashboard

4. Set up scheduled price checks using one of the methods above

## Important Notes

- Amazon actively blocks bots - scraping may occasionally fail
- Email requires Resend API key (100 free emails/day)
- Notifications sent max once per 24 hours per alert
- Consider using Amazon Product Advertising API for production

## Support

For issues or questions, check the main README.md file for detailed documentation.
