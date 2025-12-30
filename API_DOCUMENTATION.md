# API Documentation

Complete reference for all Edge Functions and API endpoints.

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Authentication

All endpoints use Bearer token authentication with the Supabase Anon Key:

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

## Endpoints

### 1. Add Product

Add a new Amazon product to track.

**Endpoint:** `POST /add-product`

**Request Body:**
```json
{
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "userEmail": "user@example.com",
  "targetPrice": 99.99
}
```

**Parameters:**
- `url` (string, required): Amazon product URL
- `userEmail` (string, optional): Email for price alerts
- `targetPrice` (number, optional): Manual target price (omit to use AI prediction)

**Success Response (200):**
```json
{
  "message": "Product added successfully",
  "product": {
    "id": "uuid",
    "asin": "B08N5WRWNW",
    "title": "Product Name",
    "url": "https://amazon.com/...",
    "current_price": 129.99,
    "image_url": "https://...",
    "is_active": true,
    "last_checked_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid URL or unable to extract product details
- `500`: Server error

**Example (curl):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/add-product \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "userEmail": "user@example.com",
    "targetPrice": 99.99
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/add-product',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: 'https://www.amazon.com/dp/B08N5WRWNW',
      userEmail: 'user@example.com',
      targetPrice: 99.99,
    }),
  }
);
const data = await response.json();
```

---

### 2. Get Products

Retrieve all tracked products or specific product details.

**Endpoint:** `GET /get-products`

**Query Parameters:**
- `id` (string, optional): Specific product ID to retrieve detailed information

**Success Response - All Products (200):**
```json
{
  "products": [
    {
      "id": "uuid",
      "asin": "B08N5WRWNW",
      "title": "Product Name",
      "url": "https://amazon.com/...",
      "current_price": 129.99,
      "image_url": "https://...",
      "is_active": true,
      "last_checked_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "alerts": [
        {
          "id": "uuid",
          "user_email": "user@example.com",
          "target_price": 99.99,
          "use_prediction": false,
          "predicted_price": null,
          "is_active": true,
          "notified_at": null,
          "created_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

**Success Response - Single Product (200):**
```json
{
  "product": { /* product object */ },
  "priceHistory": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "price": 129.99,
      "checked_at": "2024-01-15T10:30:00Z"
    }
  ],
  "alerts": [ /* array of alerts */ ]
}
```

**Example (curl):**
```bash
# Get all products
curl https://your-project.supabase.co/functions/v1/get-products \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Get specific product
curl "https://your-project.supabase.co/functions/v1/get-products?id=product-uuid" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 3. Check Prices

Manually trigger price checking for all active products.

**Endpoint:** `POST /check-prices`

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Price check completed",
  "checked": 5,
  "results": [
    {
      "asin": "B08N5WRWNW",
      "status": "checked",
      "currentPrice": 119.99,
      "targetPrice": 99.99
    },
    {
      "asin": "B08ABC123",
      "status": "alert_sent",
      "currentPrice": 89.99,
      "targetPrice": 99.99
    },
    {
      "asin": "B08XYZ789",
      "status": "failed",
      "reason": "Could not fetch price"
    }
  ]
}
```

**Status Values:**
- `checked`: Price updated successfully
- `alert_sent`: Price dropped, notification sent
- `alert_triggered_recently_notified`: Target met but recently notified
- `checked_no_alerts`: Price updated, no alerts configured
- `failed`: Unable to fetch price
- `error`: Processing error

**Example (curl):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/check-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Example (JavaScript):**
```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/check-prices',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY',
    },
  }
);
const data = await response.json();
```

---

### 4. Send Alert

Manually trigger email alert for a specific product. (Usually called internally by check-prices)

**Endpoint:** `POST /send-alert`

**Request Body:**
```json
{
  "productId": "uuid",
  "alertId": "uuid",
  "currentPrice": 89.99
}
```

**Parameters:**
- `productId` (string, required): Product UUID
- `alertId` (string, required): Alert UUID
- `currentPrice` (number, required): Current product price

**Success Response (200):**
```json
{
  "message": "Email sent successfully",
  "to": "user@example.com"
}
```

**Warning Response (200):**
```json
{
  "warning": "Email service not configured or failed",
  "error": "RESEND_API_KEY not configured"
}
```

**Error Response (404):**
```json
{
  "error": "Product or alert not found"
}
```

**Example (curl):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-alert \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "alertId": "alert-uuid",
    "currentPrice": 89.99
  }'
```

---

## Direct Database Access

You can also access the database directly using the Supabase client:

### Query Products
```javascript
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);
```

### Query Price History
```javascript
const { data: history } = await supabase
  .from('price_history')
  .select('*')
  .eq('product_id', productId)
  .order('checked_at', { ascending: false })
  .limit(30);
```

### Query Alerts
```javascript
const { data: alerts } = await supabase
  .from('alerts')
  .select('*')
  .eq('product_id', productId)
  .eq('is_active', true);
```

### Create Alert
```javascript
const { data: alert } = await supabase
  .from('alerts')
  .insert({
    product_id: productId,
    user_email: 'user@example.com',
    target_price: 99.99,
    use_prediction: false,
  })
  .select()
  .single();
```

### Update Alert
```javascript
await supabase
  .from('alerts')
  .update({ is_active: false })
  .eq('id', alertId);
```

---

## Error Handling

All endpoints return JSON responses with appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid parameters)
- `404`: Not found
- `500`: Internal server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

**Best Practices:**
1. Always check response status code
2. Handle network errors with try-catch
3. Implement retry logic for failed requests
4. Add delay between bulk requests
5. Log errors for debugging

---

## Rate Limiting

**Recommendations:**
- Max 1 request per second for add-product
- Check-prices includes 2-second delay between products
- Email notifications throttled to 1 per 24 hours per alert

**Amazon Scraping:**
- Amazon actively blocks bots
- Implement exponential backoff for failures
- Consider rotating user agents
- For production, use Amazon Product Advertising API

---

## Webhooks

To integrate with external services, create custom Edge Functions that:

1. Listen for database changes using Supabase Realtime
2. Call your webhook endpoints
3. Transform data as needed

**Example:**
```javascript
supabase
  .channel('price-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'price_history'
  }, (payload) => {
    // Send webhook
    fetch('https://your-webhook-url.com', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  })
  .subscribe();
```

---

## Scheduled Execution

Set up automated price checking using:

### Cron Job
```bash
0 */6 * * * curl -X POST https://your-project.supabase.co/functions/v1/check-prices -H "Authorization: Bearer YOUR_ANON_KEY"
```

### GitHub Actions
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/check-prices -H "Authorization: Bearer ${{ secrets.SUPABASE_KEY }}"
```

### Vercel Cron (vercel.json)
```json
{
  "crons": [{
    "path": "/api/check-prices",
    "schedule": "0 */6 * * *"
  }]
}
```

---

## Testing

### Manual Testing
Use the "Check Prices Now" button in the UI or call the endpoint directly.

### Automated Testing
```javascript
// Test adding product
const testProduct = async () => {
  const response = await fetch('/functions/v1/add-product', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: 'https://www.amazon.com/dp/B08N5WRWNW',
      userEmail: 'test@example.com',
      targetPrice: 99.99,
    }),
  });

  console.assert(response.ok, 'Product should be added');
  const data = await response.json();
  console.assert(data.product.asin === 'B08N5WRWNW', 'ASIN should match');
};
```

---

## Security Considerations

1. **Never expose service role key** - Only use anon key in frontend
2. **Validate all inputs** - Edge Functions validate URLs and data
3. **Rate limiting** - Implement on production deployments
4. **Email validation** - System validates email format
5. **SQL injection** - Using Supabase client prevents SQL injection
6. **XSS protection** - React escapes output by default

---

## Support

For issues or questions:
- Check README.md for detailed documentation
- Review SETUP_GUIDE.md for configuration help
- Check browser console for client-side errors
- Check Supabase logs for server-side errors
