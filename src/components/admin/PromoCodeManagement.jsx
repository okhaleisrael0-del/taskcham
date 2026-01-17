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
import { Plus, Edit, Trash2, Tag, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function PromoCodeManagement() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    discount_value: '',
    max_discount: '',
    minimum_order: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    per_user_limit: 1,
    description: '',
    is_active: true
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => base44.entities.PromoCode.list('-created_date')
  });

  const { data: usages = [] } = useQuery({
    queryKey: ['promo-usages'],
    queryFn: () => base44.entities.PromoCodeUsage.list()
  });

  const createPromoMutation = useMutation({
    mutationFn: async (data) => {
      if (editingPromo) {
        await base44.entities.PromoCode.update(editingPromo.id, data);
      } else {
        await base44.entities.PromoCode.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promo-codes']);
      setShowDialog(false);
      setEditingPromo(null);
      resetForm();
      toast.success(editingPromo ? 'Kampanjkod uppdaterad' : 'Kampanjkod skapad');
    }
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['promo-codes']);
      toast.success('Kampanjkod raderad');
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      discount_value: '',
      max_discount: '',
      minimum_order: '',
      valid_from: '',
      valid_until: '',
      usage_limit: '',
      per_user_limit: 1,
      description: '',
      is_active: true
    });
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      type: promo.type,
      discount_value: promo.discount_value,
      max_discount: promo.max_discount || '',
      minimum_order: promo.minimum_order || '',
      valid_from: promo.valid_from?.split('T')[0] || '',
      valid_until: promo.valid_until?.split('T')[0] || '',
      usage_limit: promo.usage_limit || '',
      per_user_limit: promo.per_user_limit || 1,
      description: promo.description || '',
      is_active: promo.is_active
    });
    setShowDialog(true);
  };

  const getUsageCount = (promoId) => {
    return usages.filter(u => u.promo_code_id === promoId).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kampanjkoder</CardTitle>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ny Kampanjkod
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {promoCodes.map(promo => {
            const usageCount = getUsageCount(promo.id);
            const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
            const isLimitReached = promo.usage_limit && promo.used_count >= promo.usage_limit;

            return (
              <div key={promo.id} className={`border rounded-lg p-4 ${!promo.is_active || isExpired ? 'bg-gray-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#FACC15] text-gray-900 font-mono text-base px-3 py-1">
                        {promo.code}
                      </Badge>
                      {!promo.is_active && <Badge variant="outline">Inaktiv</Badge>}
                      {isExpired && <Badge variant="destructive">Utgången</Badge>}
                      {isLimitReached && <Badge variant="destructive">Limit nådd</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>💰 {promo.type === 'percentage' ? `${promo.discount_value}%` : `${promo.discount_value} kr`}</span>
                      {promo.minimum_order > 0 && <span>📦 Min: {promo.minimum_order} kr</span>}
                      <span>📊 {promo.used_count || 0}/{promo.usage_limit || '∞'} användningar</span>
                      {promo.valid_until && (
                        <span>📅 Till {new Date(promo.valid_until).toLocaleDateString('sv-SE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(promo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Radera denna kampanjkod?')) {
                          deletePromoMutation.mutate(promo.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {usageCount > 0 && (
                  <div className="bg-green-50 rounded-lg p-2 text-sm text-green-800">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {usageCount} användningar • Totalt rabatterat: {
                      usages
                        .filter(u => u.promo_code_id === promo.id)
                        .reduce((sum, u) => sum + (u.discount_amount || 0), 0)
                        .toLocaleString('sv-SE')
                    } kr
                  </div>
                )}
              </div>
            );
          })}

          {promoCodes.length === 0 && (
            <p className="text-center text-gray-500 py-8">Inga kampanjkoder skapade än</p>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPromo ? 'Redigera' : 'Skapa'} Kampanjkod</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label>Kod *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Procent</SelectItem>
                      <SelectItem value="fixed_amount">Fast belopp</SelectItem>
                      <SelectItem value="first_order">Första beställning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rabattvärde * {formData.type === 'percentage' ? '(%)' : '(kr)'}</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '10' : '50'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max rabatt (kr)</Label>
                  <Input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Min ordervärde (kr)</Label>
                  <Input
                    type="number"
                    value={formData.minimum_order}
                    onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gäller från</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gäller till</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total användningsgräns</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Obegränsad"
                  />
                </div>
                <div>
                  <Label>Per användare</Label>
                  <Input
                    type="number"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <Label>Beskrivning</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="50% rabatt på din första beställning"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  id="is_active"
                />
                <Label htmlFor="is_active">Aktiv kampanjkod</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); setEditingPromo(null); }}>
                Avbryt
              </Button>
              <Button
                onClick={() => createPromoMutation.mutate(formData)}
                disabled={!formData.code || !formData.discount_value}
              >
                {editingPromo ? 'Uppdatera' : 'Skapa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}