import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendAlertRequest {
  productId: string;
  alertId: string;
  currentPrice: number;
}

async function sendEmailViaSMTP(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Amazon Price Alert <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

function generateEmailHTML(product: any, alert: any, currentPrice: number) {
  const savings = alert.target_price 
    ? ((alert.target_price - currentPrice) / alert.target_price * 100).toFixed(1)
    : '0';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .product { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .product img { max-width: 200px; display: block; margin: 0 auto 20px; }
          .price { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .old-price { text-decoration: line-through; color: #6b7280; font-size: 20px; }
          .savings { background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .button { display: inline-block; background: #ff9900; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px auto; text-align: center; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Price Drop Alert!</h1>
            <p>Your tracked product is now at your target price!</p>
          </div>
          <div class="content">
            <div class="product">
              ${product.image_url ? `<img src="${product.image_url}" alt="Product">` : ''}
              <h2 style="text-align: center; color: #1f2937;">${product.title}</h2>
              
              <div class="price">
                $${currentPrice.toFixed(2)}
              </div>
              
              ${alert.target_price ? `
                <div style="text-align: center;">
                  <span class="old-price">Target: $${parseFloat(alert.target_price).toFixed(2)}</span>
                </div>
              ` : ''}
              
              ${parseFloat(savings) > 0 ? `
                <div class="savings">
                  Save ${savings}% - Buy Now!
                </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${product.url}" class="button">
                  Buy Now on Amazon →
                </a>
              </div>
            </div>
            
            <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin-top: 0; color: #4338ca;">💡 Quick Tips:</h3>
              <ul style="color: #4338ca;">
                <li>Price may change quickly - act fast!</li>
                <li>Check seller ratings and reviews</li>
                <li>Verify shipping costs and delivery time</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you set up a price alert.</p>
            <p>ASIN: ${product.asin} | Checked at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
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

    const { productId, alertId, currentPrice }: SendAlertRequest = await req.json();

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    const { data: alert } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (!product || !alert) {
      return new Response(
        JSON.stringify({ error: 'Product or alert not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHTML = generateEmailHTML(product, alert, currentPrice);
    const subject = `🔔 Price Drop Alert: ${product.title.substring(0, 50)}...`;

    const result = await sendEmailViaSMTP(alert.user_email, subject, emailHTML);

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          message: 'Email sent successfully',
          to: alert.user_email 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          warning: 'Email service not configured or failed',
          error: result.error 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});