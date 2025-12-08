import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar ordens expiradas diretamente - NÃO expirar ordens que já foram confirmadas
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, locked_at, created_at, status, payment_confirmed_at')
      .in('status', ['pending', 'paid'])
      .is('payment_confirmed_at', null) // CRÍTICO: Não expirar ordens já confirmadas
      .lt('locked_at', fifteenMinutesAgo);

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredOrders?.length || 0} expired orders (excluding confirmed ones)`);

    if (expiredOrders && expiredOrders.length > 0) {
      // Update expired orders to expired status
      const orderIds = expiredOrders.map((order) => order.id);
      
      const { data: updatedOrders, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'expired' })
        .in('id', orderIds)
        .is('payment_confirmed_at', null) // Dupla verificação de segurança
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
