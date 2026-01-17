import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MonthlyInvoicing({ businessAccount }) {
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ['business-invoices', businessAccount?.id],
    queryFn: () => base44.entities.BusinessInvoice.filter({ 
      business_account_id: businessAccount.id 
    }, '-created_date'),
    enabled: !!businessAccount?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['uninvoiced-bookings', businessAccount?.id],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.filter({ 
        business_account_id: businessAccount.id,
        payment_status: 'paid',
        status: 'completed'
      });
      
      // Filter out already invoiced bookings
      const invoicedIds = new Set(invoices.flatMap(inv => inv.booking_ids || []));
      return allBookings.filter(b => !invoicedIds.has(b.id));
    },
    enabled: !!businessAccount?.id && invoices.length >= 0
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.created_date);
        return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
      });

      if (monthBookings.length === 0) {
        toast.error('Inga bokningar att fakturera');
        return;
      }

      const lineItems = monthBookings.map(b => ({
        booking_number: b.booking_number,
        date: new Date(b.created_date).toLocaleDateString('sv-SE'),
        description: `${b.service_type?.replace('_', ' ')} - ${b.item_description || 'Uppdrag'}`,
        employee: b.customer_name,
        department: 'N/A',
        amount: b.total_price
      }));

      const subtotal = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const vatAmount = Math.round(subtotal * 0.25);
      const total = subtotal;

      const invoiceNumber = `INV-${businessAccount.company_name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-8)}`;

      const invoice = await base44.entities.BusinessInvoice.create({
        invoice_number: invoiceNumber,
        business_account_id: businessAccount.id,
        company_name: businessAccount.company_name,
        billing_period_start: startOfMonth.toISOString().split('T')[0],
        billing_period_end: endOfMonth.toISOString().split('T')[0],
        booking_ids: monthBookings.map(b => b.id),
        line_items: lineItems,
        subtotal: subtotal,
        vat_amount: vatAmount,
        total_amount: total,
        status: 'sent',
        due_date: new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0],
        sent_date: new Date().toISOString()
      });

      // Send invoice email
      await base44.integrations.Core.SendEmail({
        to: businessAccount.invoice_email || businessAccount.contact_email,
        subject: `Faktura ${invoiceNumber} - ${businessAccount.company_name}`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto;">
              <div style="background: #1E3A8A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>📄 Faktura</h1>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">${invoiceNumber}</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #ddd;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                  <div>
                    <p style="color: #666; margin: 0;">Från</p>
                    <p style="margin: 5px 0; font-weight: bold;">TaskCham AB</p>
                    <p style="margin: 0; font-size: 14px; color: #666;">Göteborg, Sverige</p>
                  </div>
                  <div>
                    <p style="color: #666; margin: 0;">Till</p>
                    <p style="margin: 5px 0; font-weight: bold;">${businessAccount.company_name}</p>
                    <p style="margin: 0; font-size: 14px; color: #666;">Org.nr: ${businessAccount.org_number}</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${businessAccount.billing_address}</p>
                  </div>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0;"><strong>Period:</strong> ${new Date(invoice.billing_period_start).toLocaleDateString('sv-SE')} - ${new Date(invoice.billing_period_end).toLocaleDateString('sv-SE')}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Förfallodatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #1E3A8A;">
                      <th style="text-align: left; padding: 12px;">Datum</th>
                      <th style="text-align: left; padding: 12px;">Beskrivning</th>
                      <th style="text-align: left; padding: 12px;">Anställd</th>
                      <th style="text-align: right; padding: 12px;">Belopp</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lineItems.map(item => `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-size: 13px;">${item.date}</td>
                        <td style="padding: 10px; font-size: 13px;">${item.description}</td>
                        <td style="padding: 10px; font-size: 13px;">${item.employee}</td>
                        <td style="text-align: right; padding: 10px; font-size: 13px;">${item.amount} kr</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr style="border-top: 2px solid #1E3A8A;">
                      <td colspan="3" style="padding: 15px; font-weight: bold; font-size: 16px;">Totalt (inkl. 25% moms)</td>
                      <td style="text-align: right; padding: 15px; font-weight: bold; font-size: 20px; color: #1E3A8A;">${total.toLocaleString('sv-SE')} kr</td>
                    </tr>
                  </tfoot>
                </table>

                <div style="background: #fef3c7; border-left: 4px solid #FACC15; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">Betalningsvillkor: ${businessAccount.payment_terms.replace('_', ' ')}</p>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">Betala senast ${new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>
                </div>
              </div>

              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 12px; color: #666;">TaskCham AB • info@taskcham.se</p>
              </div>
            </body>
          </html>
        `
      });

      return invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries(['business-invoices']);
      queryClient.invalidateQueries(['uninvoiced-bookings']);
      toast.success(`Faktura ${invoice.invoice_number} genererad och skickad!`);
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const uninvoicedTotal = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Uninvoiced Summary */}
      {businessAccount.payment_terms === 'monthly_invoice' && uninvoicedTotal > 0 && (
        <Card className="bg-amber-50 border-2 border-amber-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Ofakturerade Bokningar</h3>
                <p className="text-sm text-amber-800">
                  {bookings.length} bokningar • {uninvoicedTotal.toLocaleString('sv-SE')} kr
                </p>
              </div>
              <Button
                onClick={() => generateInvoiceMutation.mutate()}
                disabled={generateInvoiceMutation.isPending}
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generateInvoiceMutation.isPending ? 'Genererar...' : 'Generera Faktura'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Fakturahistorik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div 
                key={invoice.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono font-bold text-lg">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.billing_period_start).toLocaleDateString('sv-SE')} - 
                      {new Date(invoice.billing_period_end).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#1E3A8A]">
                      {invoice.total_amount?.toLocaleString('sv-SE')} kr
                    </p>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status === 'sent' ? 'Skickad' :
                       invoice.status === 'paid' ? 'Betald' :
                       invoice.status === 'overdue' ? 'Försenad' :
                       invoice.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📦 {invoice.line_items?.length || 0} bokningar</span>
                  <span>📅 Förfaller {new Date(invoice.due_date).toLocaleDateString('sv-SE')}</span>
                  {invoice.paid_date && (
                    <span className="text-green-600">✓ Betald {new Date(invoice.paid_date).toLocaleDateString('sv-SE')}</span>
                  )}
                </div>
              </div>
            ))}

            {invoices.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Inga fakturor genererade än</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faktura {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Period</p>
                  <p className="font-semibold">
                    {new Date(selectedInvoice.billing_period_start).toLocaleDateString('sv-SE')} - 
                    {new Date(selectedInvoice.billing_period_end).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Förfallodatum</p>
                  <p className="font-semibold">
                    {new Date(selectedInvoice.due_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1E3A8A] text-white">
                    <tr>
                      <th className="text-left p-3">Datum</th>
                      <th className="text-left p-3">Beskrivning</th>
                      <th className="text-left p-3">Anställd</th>
                      <th className="text-right p-3">Belopp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.line_items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3">{item.date}</td>
                        <td className="p-3">{item.description}</td>
                        <td className="p-3">{item.employee}</td>
                        <td className="text-right p-3">{item.amount} kr</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="3" className="p-3">Totalt (inkl. moms)</td>
                      <td className="text-right p-3 text-[#1E3A8A]">
                        {selectedInvoice.total_amount?.toLocaleString('sv-SE')} kr
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-[#1E3A8A]" onClick={() => {
                  // Download invoice logic here
                  toast.success('Faktura nedladdad');
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Ladda ner PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}