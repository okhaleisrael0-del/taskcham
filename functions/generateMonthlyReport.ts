import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { startOfMonth, endOfMonth, subMonths, format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting monthly report generation');

    // Get date range for previous month
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const startDate = startOfMonth(lastMonth);
    const endDate = endOfMonth(lastMonth);

    console.log('Report period:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));

    // Fetch all data
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 1000);
    const payouts = await base44.asServiceRole.entities.Payout.list('-created_date', 1000);
    const drivers = await base44.asServiceRole.entities.Driver.list('-created_date', 500);

    // Filter bookings for the period
    const periodBookings = bookings.filter(b => {
      const date = new Date(b.created_date);
      return date >= startDate && date <= endDate && b.status === 'completed' && b.payment_status === 'paid';
    });

    // Calculate metrics
    const totalRevenue = periodBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const platformFees = periodBookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);
    const driverEarnings = periodBookings.reduce((sum, b) => sum + (b.driver_earnings || 0), 0);

    // Filter payouts for the period
    const periodPayouts = payouts.filter(p => {
      const date = new Date(p.processed_date || p.created_date);
      return date >= startDate && date <= endDate && p.status === 'completed';
    });

    const totalPaidOut = periodPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Driver statistics
    const activeDrivers = drivers.filter(d => d.status === 'approved').length;
    const driversByTasks = drivers
      .filter(d => d.completed_tasks > 0)
      .sort((a, b) => (b.completed_tasks || 0) - (a.completed_tasks || 0))
      .slice(0, 5);

    // Service type breakdown
    const serviceBreakdown = periodBookings.reduce((acc, b) => {
      const type = b.service_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Generate HTML report
    const reportHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4A90A4; border-bottom: 3px solid #4A90A4; padding-bottom: 10px; }
            h2 { color: #7FB069; margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
            .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
            .metric-value { font-size: 28px; font-weight: bold; color: #4A90A4; display: block; }
            .metric-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #4A90A4; color: white; }
            tr:hover { background: #f5f5f5; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <h1>TaskCham Månatlig Rapport</h1>
          <p><strong>Rapportperiod:</strong> ${format(startDate, 'MMMM yyyy', { locale: 'sv' })}</p>
          <p><strong>Genererad:</strong> ${format(now, 'yyyy-MM-dd HH:mm')}</p>

          <div class="summary">
            <h2>Sammanfattning</h2>
            <div class="metric">
              <span class="metric-value">${totalRevenue.toFixed(0)} SEK</span>
              <span class="metric-label">Total Omsättning</span>
            </div>
            <div class="metric">
              <span class="metric-value">${platformFees.toFixed(0)} SEK</span>
              <span class="metric-label">Plattformsavgift (20%)</span>
            </div>
            <div class="metric">
              <span class="metric-value">${driverEarnings.toFixed(0)} SEK</span>
              <span class="metric-label">Förarens Intäkter (80%)</span>
            </div>
            <div class="metric">
              <span class="metric-value">${totalPaidOut.toFixed(0)} SEK</span>
              <span class="metric-label">Utbetalat till Förare</span>
            </div>
            <div class="metric">
              <span class="metric-value">${periodBookings.length}</span>
              <span class="metric-label">Slutförda Bokningar</span>
            </div>
            <div class="metric">
              <span class="metric-value">${activeDrivers}</span>
              <span class="metric-label">Aktiva Förare</span>
            </div>
          </div>

          <h2>Tjänstetyper</h2>
          <table>
            <tr>
              <th>Tjänstetyp</th>
              <th>Antal Bokningar</th>
              <th>Procentandel</th>
            </tr>
            ${Object.entries(serviceBreakdown).map(([type, count]) => `
              <tr>
                <td>${type.replace('_', ' ')}</td>
                <td>${count}</td>
                <td>${((count / periodBookings.length) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </table>

          <h2>Topp 5 Förare</h2>
          <table>
            <tr>
              <th>Namn</th>
              <th>Slutförda Uppdrag</th>
              <th>Total Intäkter</th>
            </tr>
            ${driversByTasks.map(driver => `
              <tr>
                <td>${driver.name}</td>
                <td>${driver.completed_tasks || 0}</td>
                <td>${(driver.total_earnings || 0).toFixed(0)} SEK</td>
              </tr>
            `).join('')}
          </table>

          <h2>Utbetalningar</h2>
          <p><strong>Antal utbetalningar:</strong> ${periodPayouts.length}</p>
          <p><strong>Total utbetald summa:</strong> ${totalPaidOut.toFixed(0)} SEK</p>
          <p><strong>Genomsnittlig utbetalning:</strong> ${periodPayouts.length > 0 ? (totalPaidOut / periodPayouts.length).toFixed(0) : 0} SEK</p>

          <div class="footer">
            <p>TaskCham - Din Lokala Hjälp i Göteborg</p>
            <p>Denna rapport genererades automatiskt av systemet.</p>
          </div>
        </body>
      </html>
    `;

    // Get admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminUsers = allUsers.filter(u => u.role === 'admin');

    console.log(`Sending report to ${adminUsers.length} admin(s)`);

    // Send email to all admins
    for (const admin of adminUsers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `TaskCham Månatlig Rapport - ${format(startDate, 'MMMM yyyy')}`,
        body: reportHtml
      });
    }

    console.log('Monthly report sent successfully');

    return Response.json({
      success: true,
      period: `${format(startDate, 'yyyy-MM-dd')} - ${format(endDate, 'yyyy-MM-dd')}`,
      metrics: {
        totalRevenue,
        platformFees,
        driverEarnings,
        totalPaidOut,
        bookingsCount: periodBookings.length,
        activeDrivers
      },
      sentTo: adminUsers.map(a => a.email)
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});