import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle, XCircle, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessAccountManagement({ currentUser }) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, account: null });

  const { data: accounts = [] } = useQuery({
    queryKey: ['business-accounts'],
    queryFn: () => base44.entities.BusinessAccount.list('-created_date')
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['all-team-members'],
    queryFn: () => base44.entities.TeamMember.list()
  });

  const approveAccountMutation = useMutation({
    mutationFn: async (accountId) => {
      await base44.entities.BusinessAccount.update(accountId, {
        status: 'active',
        approved_by: currentUser.email,
        approval_date: new Date().toISOString()
      });

      const account = accounts.find(a => a.id === accountId);
      
      // Notify admin
      await base44.integrations.Core.SendEmail({
        to: account.admin_email,
        subject: `Företagskonto Godkänt - ${account.company_name}`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Grattis!</h2>
              <p>Ditt företagskonto för <strong>${account.company_name}</strong> har godkänts.</p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #16a34a;">✓ Konto aktiverat</p>
                <p style="margin: 10px 0 0 0;">Du kan nu börja bjuda in teammedlemmar och boka uppdrag.</p>
              </div>

              <p>Betalningsvillkor: ${account.payment_terms}</p>
              ${account.monthly_credit_limit > 0 ? 
                `<p>Kreditgräns: ${account.monthly_credit_limit.toLocaleString('sv-SE')} kr/månad</p>` : ''}

              <p>Logga in på TaskCham för att komma igång!</p>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['business-accounts']);
      toast.success('Företagskonto godkänt');
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ accountId, data }) => {
      await base44.entities.BusinessAccount.update(accountId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['business-accounts']);
      setEditDialog({ open: false, account: null });
      toast.success('Konto uppdaterat');
    }
  });

  const getAccountTeamCount = (accountId) => {
    return teamMembers.filter(m => m.business_account_id === accountId && m.status === 'active').length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Företagskonton
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map(account => {
            const teamCount = getAccountTeamCount(account.id);

            return (
              <div key={account.id} className={`border rounded-lg p-4 ${
                account.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : ''
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{account.company_name}</h3>
                      <Badge className={
                        account.status === 'active' ? 'bg-green-100 text-green-800' :
                        account.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {account.status === 'active' ? 'Aktiv' :
                         account.status === 'pending' ? 'Väntar Godkännande' :
                         'Avstängd'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Org.nr: {account.org_number}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>👤 {account.contact_person}</span>
                      <span>📧 {account.contact_email}</span>
                      <span>👥 {teamCount} teammedlemmar</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {account.payment_terms === 'monthly_invoice' ? 'Månadsfakturering' : account.payment_terms}
                      </Badge>
                      {account.monthly_credit_limit > 0 && (
                        <Badge variant="outline">
                          Kredit: {account.monthly_credit_limit.toLocaleString('sv-SE')} kr
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {account.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveAccountMutation.mutate(account.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Godkänn
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditDialog({ open: true, account })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inga företagskonton registrerade</p>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        {editDialog.account && (
          <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, account: null })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Redigera Företagskonto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Betalningsvillkor</Label>
                  <Select 
                    defaultValue={editDialog.account.payment_terms}
                    onValueChange={(val) => {
                      setEditDialog({ 
                        ...editDialog, 
                        account: { ...editDialog.account, payment_terms: val }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Förskottsbetalning</SelectItem>
                      <SelectItem value="net_30">Netto 30 dagar</SelectItem>
                      <SelectItem value="net_60">Netto 60 dagar</SelectItem>
                      <SelectItem value="monthly_invoice">Månadsfakturering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Månatlig Kreditgräns (kr)</Label>
                  <Input
                    type="number"
                    defaultValue={editDialog.account.monthly_credit_limit}
                    onChange={(e) => {
                      setEditDialog({ 
                        ...editDialog, 
                        account: { ...editDialog.account, monthly_credit_limit: parseInt(e.target.value) || 0 }
                      });
                    }}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select 
                    defaultValue={editDialog.account.status}
                    onValueChange={(val) => {
                      setEditDialog({ 
                        ...editDialog, 
                        account: { ...editDialog.account, status: val }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="suspended">Avstängd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialog({ open: false, account: null })}>
                  Avbryt
                </Button>
                <Button
                  onClick={() => updateAccountMutation.mutate({ 
                    accountId: editDialog.account.id,
                    data: {
                      payment_terms: editDialog.account.payment_terms,
                      monthly_credit_limit: editDialog.account.monthly_credit_limit,
                      status: editDialog.account.status
                    }
                  })}
                  className="bg-[#1E3A8A]"
                >
                  Spara
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}