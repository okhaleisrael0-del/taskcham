import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Zap, Package, Moon, Cloud, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingAddonsManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState({ open: false, addon: null });
  const [formData, setFormData] = useState({
    addon_type: 'express',
    name: '',
    description: '',
    price_type: 'fixed',
    amount: 0,
    is_active: true,
    auto_apply: false,
    priority: 0
  });

  const { data: addons = [] } = useQuery({
    queryKey: ['pricing-addons'],
    queryFn: () => base44.entities.PricingAddon.list('-priority')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PricingAddon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-addons']);
      setDialog({ open: false, addon: null });
      resetForm();
      toast.success('Tillägg skapat');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PricingAddon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-addons']);
      setDialog({ open: false, addon: null });
      resetForm();
      toast.success('Tillägg uppdaterat');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PricingAddon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-addons']);
      toast.success('Tillägg raderat');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PricingAddon.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-addons']);
    }
  });

  const resetForm = () => {
    setFormData({
      addon_type: 'express',
      name: '',
      description: '',
      price_type: 'fixed',
      amount: 0,
      is_active: true,
      auto_apply: false,
      priority: 0
    });
  };

  const handleOpenDialog = (addon = null) => {
    if (addon) {
      setFormData(addon);
    } else {
      resetForm();
    }
    setDialog({ open: true, addon });
  };

  const handleSubmit = () => {
    if (dialog.addon) {
      updateMutation.mutate({ id: dialog.addon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAddonIcon = (type) => {
    switch (type) {
      case 'express': return <Zap className="h-5 w-5 text-orange-600" />;
      case 'heavy_items': return <Package className="h-5 w-5 text-purple-600" />;
      case 'evening_night': return <Moon className="h-5 w-5 text-indigo-600" />;
      case 'weather_surcharge': return <Cloud className="h-5 w-5 text-blue-600" />;
      default: return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const addonTypeLabels = {
    express: 'Express',
    heavy_items: 'Tunga varor',
    evening_night: 'Kväll & Natt',
    weather_surcharge: 'Vädertillägg',
    multiple_stops: 'Flera stopp',
    waiting_time: 'Väntetid',
    fragile_items: 'Ömtåliga varor'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pristillägg</h2>
          <p className="text-sm text-gray-600">Hantera dynamiska pristillägg (Göteborg-modellen)</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nytt Tillägg
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {addons.map((addon) => (
          <Card key={addon.id} className={!addon.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getAddonIcon(addon.addon_type)}
                  <div>
                    <h3 className="font-semibold">{addon.name}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {addonTypeLabels[addon.addon_type]}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={addon.is_active}
                  onCheckedChange={(checked) => 
                    toggleActiveMutation.mutate({ id: addon.id, is_active: checked })
                  }
                />
              </div>

              {addon.description && (
                <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Pris:</span>
                <span className="font-bold text-lg text-primary">
                  {addon.price_type === 'percentage' 
                    ? `+${addon.amount}%` 
                    : `+${addon.amount} kr`}
                </span>
              </div>

              {addon.auto_apply && (
                <Badge className="bg-blue-100 text-blue-800 mb-3">
                  Automatisk applicering
                </Badge>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(addon)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Redigera
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Radera detta tillägg?')) {
                      deleteMutation.mutate(addon.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {addons.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Plus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Inga tillägg konfigurerade</p>
            <p className="text-sm text-gray-400 mt-1">Skapa ditt första pristillägg</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, addon: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.addon ? 'Redigera Tillägg' : 'Nytt Tillägg'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Typ av tillägg</Label>
              <Select
                value={formData.addon_type}
                onValueChange={(value) => setFormData({ ...formData, addon_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(addonTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Namn</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="t.ex. Expressleverans"
              />
            </div>

            <div>
              <Label>Beskrivning</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskriv tillägget..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pristyp</Label>
                <Select
                  value={formData.price_type}
                  onValueChange={(value) => setFormData({ ...formData, price_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fast belopp (kr)</SelectItem>
                    <SelectItem value="percentage">Procent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Belopp</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Aktiv</Label>
                <p className="text-xs text-gray-500">Tillgänglig för kunder</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Automatisk applicering</Label>
                <p className="text-xs text-gray-500">Appliceras automatiskt vid villkor</p>
              </div>
              <Switch
                checked={formData.auto_apply}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_apply: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, addon: null })}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.amount}>
              {dialog.addon ? 'Uppdatera' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}