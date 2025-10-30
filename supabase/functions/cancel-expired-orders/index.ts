import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find orders that are pending and have expired (2 scenarios)
    // 1. locked_at < 5 minutes ago OR
    // 2. locked_at IS NULL and created_at < 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, locked_at, created_at')
      .eq('status', 'pending')
      .or(`locked_at.lt.${fiveMinutesAgo},and(locked_at.is.null,created_at.lt.${fiveMinutesAgo})`);

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredOrders?.length || 0} expired orders`);

    if (expiredOrders && expiredOrders.length > 0) {
      // Update expired orders to cancelled status
      const orderIds = expiredOrders.map(order => order.id);
      
      const { data: updatedOrders, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'expired' })
        .in('id', orderIds)
        .select();

      if (updateError) {
        console.error('Error updating orders:', updateError);
        throw updateError;
      }

      console.log(`Successfully expired ${updatedOrders?.length || 0} orders:`, orderIds);

      return new Response(
        JSON.stringify({
          success: true,
          cancelledCount: updatedOrders?.length || 0,
          orderIds: orderIds
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancelledCount: 0,
        message: 'No expired orders found'
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in cancel-expired-orders function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
