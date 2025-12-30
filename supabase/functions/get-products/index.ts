import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: 'Product not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch all price history entries (high limit to ensure we get complete history)
      const { data: priceHistory } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('checked_at', { ascending: true })
        .limit(10000); // High limit to ensure we get all history entries

      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('product_id', productId);

      return new Response(
        JSON.stringify({ 
          product: product || null,
          priceHistory: priceHistory || [],
          alerts: alerts || []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*, alerts(*)')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ products: [], error: productsError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure products is always an array and each product has alerts as an array
    const normalizedProducts = (products || []).map((product: any) => ({
      ...product,
      alerts: product.alerts || []
    }));

    return new Response(
      JSON.stringify({ products: normalizedProducts }),
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