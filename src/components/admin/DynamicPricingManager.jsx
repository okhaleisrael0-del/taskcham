import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CloudRain, TrendingUp, MapPin, Plus, Edit, Trash2 } from 'lucide-react';

export default function DynamicPricingManager() {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState({ open: false, rule: null });
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'time_based',
    adjustment_type: 'percentage',
    adjustment_value: 0,
    description: '',
    is_active: true,
    priority: 0
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['dynamic-pricing-rules'],
    queryFn: () => base44.entities.DynamicPricingRule.list('-priority')
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.DynamicPricingRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dynamic-pricing-rules']);
      setEditDialog({ open: false, rule: null });
      resetForm();
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DynamicPricingRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dynamic-pricing-rules']);
      setEditDialog({ open: false, rule: null });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.DynamicPricingRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['dynamic-pricing-rules']);
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_type: 'time_based',
      adjustment_type: 'percentage',
      adjustment_value: 0,
      description: '',
      is_active: true,
      priority: 0
    });
  };

  const handleEdit = (rule) => {
    setFormData(rule || {
      rule_name: '',
      rule_type: 'time_based',
      adjustment_type: 'percentage',
      adjustment_value: 0,
      description: '',
      is_active: true,
      priority: 0
    });
    setEditDialog({ open: true, rule });
  };

  const handleSave = () => {
    if (editDialog.rule) {
      updateRuleMutation.mutate({ id: editDialog.rule.id, data: formData });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const getRuleIcon = (type) => {
    const icons = {
      time_based: <Clock className="h-4 w-4" />,
      weather_based: <CloudRain className="h-4 w-4" />,
      demand_based: <TrendingUp className="h-4 w-4" />,
      area_based: <MapPin className="h-4 w-4" />
    };
    return icons[type] || <Clock className="h-4 w-4" />;
  };

  const getRuleColor = (type) => {
    const colors = {
      time_based: 'bg-blue-100 text-blue-800',
      weather_based: 'bg-cyan-100 text-cyan-800',
      demand_based: 'bg-purple-100 text-purple-800',
      area_based: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dynamisk Prissättning</h2>
          <p className="text-gray-600">Hantera automatiska prisjusteringar baserat på realtidsdata</p>
        </div>
        <Button onClick={() => handleEdit(null)} className="bg-[#4A90A4]">
          <Plus className="h-4 w-4 mr-2" />
          Ny Regel
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getRuleColor(rule.rule_type)}>
                      {getRuleIcon(rule.rule_type)}
                      <span className="ml-1">{rule.rule_type.replace('_', ' ')}</span>
                    </Badge>
                    <h3 className="text-lg font-semibold">{rule.rule_name}</h3>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        updateRuleMutation.mutate({ 
                          id: rule.id, 
                          data: { ...rule, is_active: checked } 
                        })
                      }
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-[#4A90A4]">
                      {rule.adjustment_type === 'percentage' ? `+${rule.adjustment_value}%` : `+${rule.adjustment_value} SEK`}
                    </span>
                    <Badge variant="outline">Prioritet: {rule.priority}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Är du säker på att du vill ta bort denna regel?')) {
                        deleteRuleMutation.mutate(rule.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Inga prisregler än. Skapa din första regel för dynamisk prissättning.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, rule: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editDialog.rule ? 'Redigera Regel' : 'Ny Prisregel'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Regelnamn</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="t.ex. Rusningstid Morgon"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Regeltyp</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_based">Tidsbaserad</SelectItem>
                    <SelectItem value="weather_based">Väderbaserad</SelectItem>
                    <SelectItem value="demand_based">Efterfrågebaserad</SelectItem>
                    <SelectItem value="area_based">Områdesbaserad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Justeringstyp</Label>
                <Select
                  value={formData.adjustment_type}
                  onValueChange={(value) => setFormData({ ...formData, adjustment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Procent (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fast belopp (SEK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Justeringsvärde</Label>
                <Input
                  type="number"
                  value={formData.adjustment_value}
                  onChange={(e) => setFormData({ ...formData, adjustment_value: parseFloat(e.target.value) })}
                  placeholder={formData.adjustment_type === 'percentage' ? '20' : '50'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.adjustment_type === 'percentage' ? 'Exempel: 20 = +20%' : 'Exempel: 50 = +50 SEK'}
                </p>
              </div>

              <div>
                <Label>Prioritet</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Högre nummer = högre prioritet</p>
              </div>
            </div>

            <div>
              <Label>Beskrivning</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskriv när denna regel ska tillämpas..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Aktiv regel</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, rule: null })}>
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.rule_name || !formData.adjustment_value}
              className="bg-[#4A90A4]"
            >
              {editDialog.rule ? 'Uppdatera' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}