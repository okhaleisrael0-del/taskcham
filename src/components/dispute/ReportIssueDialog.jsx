import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportIssueDialog({ booking, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');

  const submitDispute = useMutation({
    mutationFn: async () => {
      await base44.entities.Dispute.create({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        driver_id: booking.assigned_driver_id,
        driver_name: booking.assigned_driver_name,
        issue_type: issueType,
        description: description,
        status: 'open',
        payment_frozen: true
      });

      // Update booking to freeze payment
      await base44.entities.Booking.update(booking.id, {
        payment_status: 'frozen'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-bookings']);
      toast.success('Problemrapport skickad. Vi kontaktar dig inom 24 timmar.');
      onClose();
      setIssueType('');
      setDescription('');
    },
    onError: () => {
      toast.error('Kunde inte skicka rapport');
    }
  });

  const issueTypes = [
    { value: 'item_damaged', label: 'Skadat gods' },
    { value: 'wrong_delivery', label: 'Fel leveransadress' },
    { value: 'late_delivery', label: 'Försenad leverans' },
    { value: 'missing_items', label: 'Saknade varor' },
    { value: 'unprofessional_behavior', label: 'Oprofessionellt beteende' },
    { value: 'other', label: 'Annat problem' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Rapportera Problem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              När du rapporterar ett problem fryser vi betalningen till föraren tills ärendet är löst.
            </p>
          </div>

          <div>
            <Label>Typ av Problem</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Välj problemtyp..." />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Beskriv Problemet</Label>
            <Textarea
              placeholder="Berätta vad som hände..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            onClick={() => submitDispute.mutate()}
            disabled={!issueType || !description || submitDispute.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitDispute.isPending ? 'Skickar...' : 'Skicka Rapport'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}