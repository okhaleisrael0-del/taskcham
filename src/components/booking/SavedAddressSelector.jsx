import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Briefcase, Store, MapPin, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function SavedAddressSelector({ userEmail, onSelectAddress, selectedAddress, returnCoordinates = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', type: 'custom' });

  const { data: savedAddresses = [], refetch } = useQuery({
    queryKey: ['saved-addresses', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.SavedAddress.filter(
        { user_email: userEmail },
        '-created_date',
        20
      );
    },
    enabled: !!userEmail
  });

  const getIcon = (type) => {
    switch(type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'work': return <Briefcase className="h-4 w-4" />;
      case 'store': return <Store className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.label || !newAddress.address) {
      toast.error('Fyll i alla fält');
      return;
    }

    try {
      await base44.entities.SavedAddress.create({
        user_email: userEmail,
        label: newAddress.label,
        address: newAddress.address,
        address_type: newAddress.type,
        is_favorite: false
      });
      
      refetch();
      setShowDialog(false);
      setNewAddress({ label: '', address: '', type: 'custom' });
      toast.success('Adress sparad!');
    } catch (error) {
      toast.error('Kunde inte spara adress');
    }
  };

  if (!userEmail) return null;

  return (
    <div className="space-y-3">
      {savedAddresses.length > 0 && (
        <div>
          <Label className="mb-2 block text-sm font-medium">Snabbval - Sparade Adresser</Label>
          <div className="grid grid-cols-2 gap-2">
            {savedAddresses.map((saved) => (
              <Button
                key={saved.id}
                variant={selectedAddress === saved.address ? "default" : "outline"}
                className="justify-start h-auto py-3 px-4"
                onClick={() => onSelectAddress(saved.address, saved.lat, saved.lng)}
              >
                <div className="flex items-center gap-2 w-full">
                  {getIcon(saved.address_type)}
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{saved.label}</p>
                    <p className="text-xs opacity-70 truncate">{saved.address}</p>
                  </div>
                  {saved.is_favorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setShowDialog(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Spara Denna Adress
      </Button>

      {/* Save Address Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spara Adress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Etikett</Label>
              <Input
                placeholder="Hem, Jobb, ICA Maxi..."
                value={newAddress.label}
                onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
              />
            </div>
            <div>
              <Label>Adress</Label>
              <Input
                placeholder="Gatuadress, Göteborg"
                value={newAddress.address}
                onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
              />
            </div>
            <div>
              <Label>Typ</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { value: 'home', label: 'Hem', icon: Home },
                  { value: 'work', label: 'Jobb', icon: Briefcase },
                  { value: 'store', label: 'Butik', icon: Store },
                  { value: 'custom', label: 'Annan', icon: MapPin }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setNewAddress({...newAddress, type: type.value})}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                      newAddress.type === type.value
                        ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <type.icon className="h-5 w-5" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveAddress} className="bg-[#4A90A4] hover:bg-[#3d7a8c]">
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}