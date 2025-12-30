# Amazon Price Drop Alert System

An intelligent Amazon price tracking system with AI-powered predictions and automatic email notifications. Track product prices, analyze trends, and get notified when prices drop to your target.

## Features

- **Product Tracking**: Add Amazon products via URL and automatically extract details (title, price, image, ASIN)
- **Price History**: Store and visualize historical price data with interactive charts
- **AI Predictions**: Analyze price trends using moving averages and statistical methods to predict optimal buying times
- **Smart Alerts**: Set manual target prices or use AI predictions
- **Email Notifications**: Automatic alerts when prices drop to or below target
- **Real-time Monitoring**: Manual price checks or scheduled automatic updates
- **Beautiful Dashboard**: Clean, modern interface to manage all tracked products

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Custom SVG charts for price visualization

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Edge Functions (Deno/TypeScript)
- Resend API for email notifications

**Features:**
- Price scraping with anti-bot protection
- Trend detection and prediction algorithms
- Rate limiting and error handling
- Modular, scalable architecture

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Optional: Email Notifications**

To enable email alerts, add a Resend API key:

```env
RESEND_API_KEY=your_resend_api_key
```

Get your free API key at [resend.com](https://resend.com)

### 3. Database Setup

The database schema is already deployed with the following tables:
- `products` - Tracked products
- `price_history` - Historical price data
- `alerts` - User alert configurations

### 4. Edge Functions

Four Edge Functions are deployed:
1. `add-product` - Add new products and extract Amazon data
2. `get-products` - Fetch products and their details
3. `check-prices` - Periodic price checking with AI predictions
4. `send-alert` - Email notification service

### 5. Run the Application

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage Guide

### Adding Products

1. Paste an Amazon product URL in the form
2. Optionally add your email for alerts
3. Choose between:
   - **Manual Target Price**: Set your desired price
   - **AI Prediction**: Let the system predict optimal price
4. Click "Track This Product"

### Viewing Price History

- Click on any product card to view detailed price history
- Interactive chart shows price trends over time
- See current, lowest, and highest prices
- View AI predictions and alert status

### Managing Alerts

- Alerts are automatically created when adding products with email
- System checks if current price meets target/predicted price
- Notifications sent only once per 24 hours to avoid spam
- View alert status in product details modal

### Manual Price Checks

Click the "Check Prices Now" button to:
- Scrape current prices for all active products
- Update price history
- Trigger predictions
- Send notifications if targets are met

## AI Price Prediction

The system uses statistical analysis to predict optimal buying times:

1. **Moving Averages**: Calculate 3-day and 5-day moving averages
2. **Trend Detection**: Identify declining, stable, or rising trends
3. **Smart Predictions**:
   - **Declining trend**: Predicts further drop
   - **Rising trend**: Suggests buying near historical minimum
   - **Stable trend**: Targets between average and minimum

## Automated Price Checking

For automated periodic checks, you can:

1. **Cron Job**: Set up a cron job to call the `check-prices` Edge Function
2. **Supabase Cron** (Enterprise): Use Supabase's pg_cron extension
3. **External Scheduler**: Services like GitHub Actions, Render Cron Jobs, or cron-job.org

Example using curl:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/check-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Important Notes

### Amazon Scraping

- Amazon actively blocks bots - scraping may occasionally fail
- The system includes user-agent rotation and delays
- Consider using [Amazon Product Advertising API](https://affiliate-program.amazon.com/tools) for production
- Respect Amazon's robots.txt and terms of service

### Rate Limiting

- Built-in 2-second delay between product checks
- Notification throttling (max once per 24 hours per alert)
- Consider using a proxy service for heavy usage

### Email Notifications

- Email sending requires RESEND_API_KEY configuration
- System gracefully handles missing email configuration
- Emails include product details, prices, and direct purchase links

## API Endpoints

### Add Product
```
POST /functions/v1/add-product
Body: { url, userEmail?, targetPrice? }
```

### Get Products
```
GET /functions/v1/get-products
GET /functions/v1/get-products?id={productId}
```

### Check Prices
```
POST /functions/v1/check-prices
```

### Send Alert
```
POST /functions/v1/send-alert
Body: { productId, alertId, currentPrice }
```

## Database Schema

### products
- `id` (uuid): Primary key
- `asin` (text): Amazon product ID
- `title` (text): Product name
- `url` (text): Amazon product URL
- `current_price` (numeric): Latest price
- `image_url` (text): Product image
- `is_active` (boolean): Tracking enabled
- `last_checked_at` (timestamp): Last check time

### price_history
- `id` (uuid): Primary key
- `product_id` (uuid): Foreign key to products
- `price` (numeric): Recorded price
- `checked_at` (timestamp): Check timestamp

### alerts
- `id` (uuid): Primary key
- `product_id` (uuid): Foreign key to products
- `user_email` (text): Notification email
- `target_price` (numeric): Manual target
- `use_prediction` (boolean): Use AI
- `predicted_price` (numeric): AI prediction
- `is_active` (boolean): Alert enabled
- `notified_at` (timestamp): Last notification

## Troubleshooting

**Products not loading?**
- Check environment variables are set correctly
- Verify Supabase project is active
- Check browser console for errors

**Scraping fails?**
- Amazon may be blocking requests
- Try again later or use different products
- Consider implementing proxy rotation

**No email notifications?**
- Verify RESEND_API_KEY is configured
- Check spam folder
- Verify email address is correct

**Price not updating?**
- Click "Check Prices Now" button
- Check product is marked as active
- Verify Amazon product page is still available

## Future Enhancements

- [ ] User authentication
- [ ] Multiple user support with private tracking
- [ ] Mobile app
- [ ] Price drop percentage alerts
- [ ] Multiple marketplace support (Walmart, eBay, etc.)
- [ ] Browser extension
- [ ] Webhook notifications
- [ ] Advanced ML models for predictions
- [ ] Product comparison tools

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions welcome! Please ensure code follows the existing style and includes appropriate error handling.
