import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function scrapeAmazonPrice(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const pricePatterns = [
      /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)/,
      /<span[^>]*class="[^"]*a-offscreen[^"]*">\$([\d,]+\.\d{2})/,
      /"price":"\$([\d,]+\.\d{2})"/
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }

    return null;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

function calculateMovingAverage(prices: number[], window: number): number {
  if (prices.length < window) return prices.reduce((a, b) => a + b, 0) / prices.length;
  const recent = prices.slice(-window);
  return recent.reduce((a, b) => a + b, 0) / window;
}

function detectTrend(prices: number[]): 'declining' | 'stable' | 'rising' {
  if (prices.length < 3) return 'stable';
  
  const recent = prices.slice(-5);
  const ma3 = calculateMovingAverage(recent, 3);
  const ma5 = calculateMovingAverage(prices, 5);
  
  if (ma3 < ma5 * 0.95) return 'declining';
  if (ma3 > ma5 * 1.05) return 'rising';
  return 'stable';
}

function predictOptimalPrice(prices: number[], currentPrice: number): number {
  if (prices.length < 3) return currentPrice * 0.9;
  
  const minPrice = Math.min(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const trend = detectTrend(prices);
  
  if (trend === 'declining') {
    return Math.min(currentPrice * 0.95, (minPrice + avgPrice) / 2);
  } else if (trend === 'rising') {
    return minPrice * 1.05;
  } else {
    return (minPrice + avgPrice) / 2;
  }
}

async function sendNotification(productId: string, alertId: string, currentPrice: number) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    await fetch(`${supabaseUrl}/functions/v1/send-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ productId, alertId, currentPrice }),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active products to check' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const product of products) {
      try {
        const currentPrice = await scrapeAmazonPrice(product.url);
        
        if (currentPrice === null) {
          results.push({ asin: product.asin, status: 'failed', reason: 'Could not fetch price' });
          continue;
        }

        await supabase.from('price_history').insert({
          product_id: product.id,
          price: currentPrice,
        });

        await supabase
          .from('products')
          .update({
            current_price: currentPrice,
            last_checked_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        const { data: priceHistory } = await supabase
          .from('price_history')
          .select('price')
          .eq('product_id', product.id)
          .order('checked_at', { ascending: true });

        const prices = priceHistory?.map(p => parseFloat(p.price as any)) || [];
        const predictedPrice = predictOptimalPrice(prices, currentPrice);

        const { data: alerts } = await supabase
          .from('alerts')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_active', true);

        if (alerts && alerts.length > 0) {
          for (const alert of alerts) {
            if (alert.use_prediction) {
              await supabase
                .from('alerts')
                .update({ predicted_price: predictedPrice })
                .eq('id', alert.id);
            }

            const targetPrice = alert.target_price || alert.predicted_price || predictedPrice;
            
            if (currentPrice <= targetPrice) {
              const lastNotified = alert.notified_at ? new Date(alert.notified_at) : null;
              const now = new Date();
              const hoursSinceNotification = lastNotified 
                ? (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60)
                : 999;

              if (hoursSinceNotification > 24) {
                await sendNotification(product.id, alert.id, currentPrice);
                await supabase
                  .from('alerts')
                  .update({ notified_at: now.toISOString() })
                  .eq('id', alert.id);
                
                results.push({
                  asin: product.asin,
                  status: 'alert_sent',
                  currentPrice,
                  targetPrice,
                });
              } else {
                results.push({
                  asin: product.asin,
                  status: 'alert_triggered_recently_notified',
                  currentPrice,
                  targetPrice,
                });
              }
            } else {
              results.push({
                asin: product.asin,
                status: 'checked',
                currentPrice,
                targetPrice,
              });
            }
          }
        } else {
          results.push({
            asin: product.asin,
            status: 'checked_no_alerts',
            currentPrice,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error checking product ${product.asin}:`, error);
        results.push({ asin: product.asin, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Price check completed',
        checked: products.length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});