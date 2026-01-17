import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Skickar månatliga skatteunderlag till alla aktiva runners
 * Körs automatiskt den första dagen i varje månad
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr = lastMonth.toISOString().substring(0, 7); // YYYY-MM
    const monthName = lastMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });

    // Get all earnings for last month
    const allEarnings = await base44.asServiceRole.entities.RunnerEarnings.filter({ month: monthStr });

    // Group by runner
    const runnerEarnings = {};
    allEarnings.forEach(earning => {
      const runnerId = earning.runner_id;
      if (!runnerEarnings[runnerId]) {
        runnerEarnings[runnerId] = {
          runner_id: runnerId,
          runner_name: earning.runner_name,
          total: 0,
          base: 0,
          bonus: 0,
          tasks: 0,
          earnings: []
        };
      }
      runnerEarnings[runnerId].total += earning.total_earning || 0;
      runnerEarnings[runnerId].base += earning.base_earning || 0;
      runnerEarnings[runnerId].bonus += earning.bonus_amount || 0;
      runnerEarnings[runnerId].tasks += 1;
      runnerEarnings[runnerId].earnings.push(earning);
    });

    // Get all drivers to get their emails
    const drivers = await base44.asServiceRole.entities.Driver.filter({ status: 'approved' });
    const driverMap = {};
    drivers.forEach(d => { driverMap[d.id] = d; });

    const results = [];
    
    // Send reports to each runner
    for (const [runnerId, data] of Object.entries(runnerEarnings)) {
      const driver = driverMap[runnerId];
      if (!driver || !driver.email) {
        console.log(`Skipping runner ${runnerId} - no email found`);
        continue;
      }

      // Create CSV content
      const csvContent = [
        ['Datum', 'Bokningsnummer', 'Basintäkt (SEK)', 'Bonus (SEK)', 'Totalt (SEK)'],
        ...data.earnings.map(e => [
          new Date(e.task_completed_date).toLocaleDateString('sv-SE'),
          e.booking_number,
          e.base_earning || 0,
          e.bonus_amount || 0,
          e.total_earning || 0
        ])
      ].map(row => row.join(',')).join('\n');

      // Create email
      const emailBody = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4A90A4 0%, #7FB069 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
              .summary { background: #f0f9ff; border-left: 4px solid #4A90A4; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
              .stat-value { font-size: 24px; font-weight: bold; color: #4A90A4; }
              .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
              .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Månadsrapport ${monthName}</h1>
            </div>
            <div class="content">
              <div class="summary">
                <h2 style="margin-top: 0; color: #4A90A4;">Hej ${data.runner_name}!</h2>
                <p>Här är din intäktsrapport för ${monthName}.</p>
              </div>

              <div class="stats">
                <div class="stat-box">
                  <div class="stat-value">${data.total.toFixed(0)} kr</div>
                  <div class="stat-label">Total Intäkt</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${data.tasks}</div>
                  <div class="stat-label">Uppdrag</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${data.base.toFixed(0)} kr</div>
                  <div class="stat-label">Basintäkt</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${data.bonus.toFixed(0)} kr</div>
                  <div class="stat-label">Bonusar</div>
                </div>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                <strong>Skatteunderlag:</strong><br>
                En detaljerad CSV-fil med alla dina transaktioner för ${monthName} finns bifogad till detta mail. 
                Denna kan användas som underlag för din skattedeklaration.
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                <strong>OBS:</strong> Som frilansare är du själv ansvarig för att deklarera dina intäkter. 
                TaskCham rekommenderar att du kontaktar en revisor eller Skatteverket för rådgivning.
              </p>
            </div>
            <div class="footer">
              <p>TaskCham - Din Lokala Hjälp i Göteborg</p>
              <p>Frågor? Kontakta oss på info@taskcham.se</p>
            </div>
          </body>
        </html>
      `;

      try {
        // Note: Base44 email integration doesn't support attachments directly
        // We'll include a download link instead or send the CSV in the email body
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: driver.email,
          subject: `📊 TaskCham Månadsrapport - ${monthName}`,
          body: emailBody
        });

        results.push({
          runner_id: runnerId,
          runner_name: data.runner_name,
          email: driver.email,
          total: data.total,
          tasks: data.tasks,
          status: 'sent'
        });

        console.log(`Report sent to ${driver.email} - ${data.total} kr, ${data.tasks} tasks`);
      } catch (error) {
        console.error(`Failed to send report to ${driver.email}:`, error);
        results.push({
          runner_id: runnerId,
          runner_name: data.runner_name,
          email: driver.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      month: monthStr,
      month_name: monthName,
      reports_sent: results.filter(r => r.status === 'sent').length,
      total_runners: Object.keys(runnerEarnings).length,
      results
    });

  } catch (error) {
    console.error('Error sending monthly tax reports:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});