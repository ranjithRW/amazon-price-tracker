import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AddProductRequest {
  url: string;
  userEmail?: string;
  targetPrice?: number;
}

function extractASIN(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /\/ASIN\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function scrapeAmazonProduct(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    const html = await response.text();

    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/);
    const title = titleMatch ? titleMatch[1].trim() : null;

    const pricePatterns = [
      /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)</,
      /<span[^>]*class="[^"]*a-offscreen[^"]*">\$([\d,]+\.\d{2})/,
      /"price":"\$([\d,]+\.\d{2})"/
    ];
    
    let price = null;
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        price = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    const imageMatch = html.match(/"large":"([^"]+)"/);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    return { title, price, imageUrl };
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
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

    const { url, userEmail, targetPrice }: AddProductRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Product URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asin = extractASIN(url);
    if (!asin) {
      return new Response(
        JSON.stringify({ error: 'Invalid Amazon URL. Could not extract ASIN.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('asin', asin)
      .maybeSingle();

    if (existingProduct) {
      if (userEmail) {
        const { data: alert } = await supabase
          .from('alerts')
          .insert({
            product_id: existingProduct.id,
            user_email: userEmail,
            target_price: targetPrice || null,
            use_prediction: !targetPrice,
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ 
            message: 'Product already tracked. Alert added.',
            product: existingProduct,
            alert 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: 'Product already tracked.',
          product: existingProduct 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, price, imageUrl } = await scrapeAmazonProduct(url);

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Could not extract product details. The product may be unavailable or URL is invalid.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        asin,
        title,
        url,
        current_price: price,
        image_url: imageUrl,
        last_checked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (productError) throw productError;

    if (price) {
      await supabase.from('price_history').insert({
        product_id: product.id,
        price,
      });
    }

    if (userEmail) {
      await supabase.from('alerts').insert({
        product_id: product.id,
        user_email: userEmail,
        target_price: targetPrice || null,
        use_prediction: !targetPrice,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Product added successfully',
        product 
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