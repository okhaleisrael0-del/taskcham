import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('[Automated Payouts] Starting automated payout processing...');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admins or system can run this
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      console.error('[Automated Payouts] Unauthorized access attempt');
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all approved drivers with balance >= 100 SEK
    const drivers = await base44.asServiceRole.entities.Driver.filter({
      status: 'approved',
      dashboard_access: 'active'
    });
    
    console.log(`[Automated Payouts] Found ${drivers.length} approved drivers`);
    
    const eligibleDrivers = drivers.filter(d => (d.current_balance || 0) >= 100);
    console.log(`[Automated Payouts] ${eligibleDrivers.length} drivers eligible for payout (balance >= 100 SEK)`);
    
    let processedCount = 0;
    let totalAmount = 0;
    
    for (const driver of eligibleDrivers) {
      const payoutAmount = driver.current_balance;
      
      console.log(`[Automated Payouts] Processing payout for ${driver.name}: ${payoutAmount} SEK`);
      
      // Create payout record with auto-approved status
      await base44.asServiceRole.entities.Payout.create({
        driver_id: driver.id,
        driver_name: driver.name,
        driver_email: driver.email,
        amount: payoutAmount,
        status: 'completed',
        payment_method: driver.payment_method || 'bank_transfer',
        bank_account: driver.bank_account,
        request_date: new Date().toISOString(),
        processed_date: new Date().toISOString(),
        processed_by: 'automated_system',
        notes: 'Automated weekly payout'
      });
      
      // Update driver balance and total paid out
      await base44.asServiceRole.entities.Driver.update(driver.id, {
        current_balance: 0,
        total_paid_out: (driver.total_paid_out || 0) + payoutAmount
      });
      
      // Send notification to driver
      try {
        // Email notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: driver.email,
          subject: '💰 Utbetalning Genomförd - TaskCham',
          body: `
Hej ${driver.name},

Din utbetalning har genomförts!

Belopp: ${payoutAmount.toFixed(0)} SEK
Metod: ${driver.payment_method === 'swish' ? 'Swish' : 'Banköverföring'}
Konto: ${driver.bank_account}

Pengarna bör vara på ditt konto inom 1-3 arbetsdagar.

Tack för ditt hårda arbete!

Vänliga hälsningar,
TaskCham
          `
        });
        
        // SMS notification if phone available
        if (driver.phone) {
          await base44.asServiceRole.functions.invoke('sendSMS', {
            to: driver.phone,
            message: `TaskCham: Din utbetalning på ${payoutAmount.toFixed(0)} SEK har genomförts! Pengarna kommer inom 1-3 dagar.`
          });
        }
        
        console.log(`[Automated Payouts] Notifications sent to ${driver.name}`);
      } catch (notifError) {
        console.error(`[Automated Payouts] Failed to send notification to ${driver.name}:`, notifError.message);
      }
      
      processedCount++;
      totalAmount += payoutAmount;
    }
    
    console.log(`[Automated Payouts] Completed: ${processedCount} payouts processed, total: ${totalAmount.toFixed(0)} SEK`);
    
    return Response.json({
      success: true,
      processed: processedCount,
      totalAmount: totalAmount,
      message: `Processed ${processedCount} automated payouts totaling ${totalAmount.toFixed(0)} SEK`
    });
    
  } catch (error) {
    console.error('[Automated Payouts] Error:', error.message);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});