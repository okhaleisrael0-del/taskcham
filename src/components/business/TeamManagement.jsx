import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Mail, Shield, Users, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamManagement({ businessAccount, isAdmin }) {
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    department: '',
    role: 'member',
    booking_limit_monthly: 0
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', businessAccount?.id],
    queryFn: () => base44.entities.TeamMember.filter({ business_account_id: businessAccount.id }),
    enabled: !!businessAccount?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['business-bookings', businessAccount?.id],
    queryFn: () => base44.entities.Booking.filter({ business_account_id: businessAccount.id }),
    enabled: !!businessAccount?.id
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();
      
      // Create team member record
      const member = await base44.entities.TeamMember.create({
        business_account_id: businessAccount.id,
        user_email: data.email,
        full_name: data.full_name,
        department: data.department,
        role: data.role,
        booking_limit_monthly: data.booking_limit_monthly,
        status: 'invited',
        invited_by: currentUser.email,
        invite_date: new Date().toISOString()
      });

      // Send invitation email
      await base44.integrations.Core.SendEmail({
        to: data.email,
        subject: `Inbjudan till ${businessAccount.company_name} på TaskCham`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1E3A8A 0%, #14B8A6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>🎉 Du har blivit inbjuden!</h1>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #ddd;">
                <p>Hej ${data.full_name}!</p>
                <p>Du har blivit inbjuden att gå med i <strong>${businessAccount.company_name}</strong> på TaskCham.</p>
                
                <div style="background: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <p style="margin: 0;"><strong>Roll:</strong> ${data.role === 'admin' ? 'Team Admin' : 'Teammedlem'}</p>
                  ${data.department ? `<p style="margin: 5px 0 0 0;"><strong>Avdelning:</strong> ${data.department}</p>` : ''}
                </div>

                <p>Som teammedlem kan du:</p>
                <ul>
                  <li>Boka uppdrag under företagets konto</li>
                  <li>Få fakturering hanterad centralt</li>
                  <li>Se företagets bokningshistorik</li>
                  ${data.role === 'admin' ? '<li>Hantera teammedlemmar och analysera användning</li>' : ''}
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://taskcham.se'}/business-dashboard" 
                     style="background: #1E3A8A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Kom igång
                  </a>
                </div>

                <p style="color: #666; font-size: 12px;">Om du inte har ett TaskCham-konto kommer du att uppmanas att skapa ett när du loggar in.</p>
              </div>
            </body>
          </html>
        `
      });

      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        full_name: '',
        department: '',
        role: 'member',
        booking_limit_monthly: 0
      });
      toast.success('Teammedlem inbjuden!');
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, status }) => {
      await base44.entities.TeamMember.update(memberId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
      toast.success('Teammedlem uppdaterad');
    }
  });

  const getMemberBookingCount = (email) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return bookings.filter(b => 
      b.customer_email === email && 
      new Date(b.created_date) >= startOfMonth
    ).length;
  };

  const getMemberSpending = (email) => {
    return bookings
      .filter(b => b.customer_email === email && b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Endast företagets huvudadmin kan hantera teamet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
          <Button onClick={() => setShowInviteDialog(true)} className="bg-[#1E3A8A]">
            <UserPlus className="h-4 w-4 mr-2" />
            Bjud In Teammedlem
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers.map(member => {
            const bookingCount = getMemberBookingCount(member.user_email);
            const spending = getMemberSpending(member.user_email);

            return (
              <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{member.full_name || member.user_email}</h3>
                      {member.role === 'admin' && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge className={
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {member.status === 'active' ? 'Aktiv' :
                         member.status === 'invited' ? 'Inbjuden' :
                         'Avstängd'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{member.user_email}</p>
                    {member.department && (
                      <p className="text-xs text-gray-500 mb-2">📁 {member.department}</p>
                    )}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>📦 {bookingCount} bokningar denna månad</span>
                      <span>💰 {spending.toLocaleString('sv-SE')} kr totalt</span>
                      {member.booking_limit_monthly > 0 && (
                        <span className={bookingCount >= member.booking_limit_monthly ? 'text-red-600 font-semibold' : ''}>
                          📊 {bookingCount}/{member.booking_limit_monthly} limit
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {member.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => updateMemberMutation.mutate({ memberId: member.id, status: 'suspended' })}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    {member.status === 'suspended' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => updateMemberMutation.mutate({ memberId: member.id, status: 'active' })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {teamMembers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inga teammedlemmar än</p>
              <p className="text-sm mt-1">Bjud in dina anställda för att komma igång</p>
            </div>
          )}
        </div>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bjud In Teammedlem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>E-post *</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="namn@foretag.se"
                />
              </div>

              <div>
                <Label>Namn *</Label>
                <Input
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                  placeholder="Anna Andersson"
                />
              </div>

              <div>
                <Label>Avdelning</Label>
                <Select 
                  value={inviteForm.department} 
                  onValueChange={(val) => setInviteForm({ ...inviteForm, department: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj avdelning" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessAccount.departments?.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                    <SelectItem value="other">Annan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Roll</Label>
                <Select 
                  value={inviteForm.role} 
                  onValueChange={(val) => setInviteForm({ ...inviteForm, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Teammedlem (kan boka)</SelectItem>
                    <SelectItem value="admin">Team Admin (kan hantera team)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Månatlig bokningsgräns</Label>
                <Input
                  type="number"
                  value={inviteForm.booking_limit_monthly}
                  onChange={(e) => setInviteForm({ ...inviteForm, booking_limit_monthly: parseInt(e.target.value) || 0 })}
                  placeholder="0 = obegränsad"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Avbryt
              </Button>
              <Button
                onClick={() => inviteMemberMutation.mutate(inviteForm)}
                disabled={!inviteForm.email || !inviteForm.full_name || inviteMemberMutation.isPending}
                className="bg-[#1E3A8A]"
              >
                <Mail className="h-4 w-4 mr-2" />
                {inviteMemberMutation.isPending ? 'Skickar...' : 'Skicka Inbjudan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}