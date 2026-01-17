import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, Car, FileText, Upload, Check, Loader2, Calendar, 
  Shield, CreditCard, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../LanguageContext';

export default function ProfileSection({ driverProfile }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_registration: driverProfile.vehicle_registration || '',
    vehicle_model: driverProfile.vehicle_model || '',
    vehicle_year: driverProfile.vehicle_year || '',
    vehicle_color: driverProfile.vehicle_color || '',
    insurance_company: driverProfile.insurance_company || '',
    insurance_policy_number: driverProfile.insurance_policy_number || '',
    insurance_expiry_date: driverProfile.insurance_expiry_date || '',
    drivers_license_number: driverProfile.drivers_license_number || '',
    drivers_license_expiry: driverProfile.drivers_license_expiry || '',
    bank_account: driverProfile.bank_account || '',
    payment_method: driverProfile.payment_method || 'bank_transfer',
    expertise: driverProfile.expertise || []
  });

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Driver.update(driverProfile.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-bookings']);
      toast.success(t('profileUpdated'));
    },
    onError: () => {
      toast.error(t('couldNotUpdate'));
    }
  });

  const handleDocumentUpload = async (file, documentType) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const updateData = {};
      updateData[documentType] = file_url;
      
      await base44.entities.Driver.update(driverProfile.id, updateData);
      queryClient.invalidateQueries(['driver-bookings']);
      toast.success(t('documentUploaded'));
    } catch (error) {
      toast.error(t('couldNotUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const expiry = new Date(date);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry < 30 && daysUntilExpiry > 0;
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Kontoöversikt */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('payoutStatus')}</p>
                <p className="font-semibold capitalize">{driverProfile.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('memberSince')}</p>
                <p className="font-semibold">
                  {new Date(driverProfile.created_date).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('completedTasks')}</p>
                <p className="text-2xl font-bold">{driverProfile.completed_tasks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">
            <User className="h-4 w-4 mr-2" />
            {t('personalInfo')}
          </TabsTrigger>
          <TabsTrigger value="vehicle">
            <Car className="h-4 w-4 mr-2" />
            {t('vehicleInfo')}
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            {t('documents')}
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            {t('paymentInfo')}
          </TabsTrigger>
        </TabsList>

        {/* Personlig Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>{t('personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('nameLabel')}</Label>
                  <Input value={driverProfile.name} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>{t('email')}</Label>
                  <Input value={driverProfile.email} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>{t('phoneLabel')}</Label>
                  <Input value={driverProfile.phone} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>{t('vehicle')}</Label>
                  <Input value={driverProfile.role} disabled className="bg-gray-50 capitalize" />
                </div>
              </div>

              <div>
                <Label>{t('serviceAreas')}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {driverProfile.service_areas?.map((area, idx) => (
                    <Badge key={idx} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <Label className="mb-3 block font-semibold">
                  🎯 Min Expertis (för Hjälp Hemma-uppdrag)
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Välj vad du är bra på så får du fler matchande uppdrag
                </p>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    { value: 'furniture_assembly', label: '🔧 Möbelmontering', color: 'border-blue-200 hover:bg-blue-50' },
                    { value: 'heavy_lifting', label: '💪 Tunga lyft', color: 'border-purple-200 hover:bg-purple-50' },
                    { value: 'pet_care', label: '🐕 Djurvård', color: 'border-amber-200 hover:bg-amber-50' },
                    { value: 'dishes_cleanup', label: '✨ Disk & städning', color: 'border-cyan-200 hover:bg-cyan-50' },
                    { value: 'household_help', label: '🏠 Allmän hushållshjälp', color: 'border-green-200 hover:bg-green-50' },
                    { value: 'store_pickup', label: '🛒 Butiksupphämtning', color: 'border-pink-200 hover:bg-pink-50' },
                    { value: 'parcel_returns', label: '📦 Paketreturer', color: 'border-indigo-200 hover:bg-indigo-50' },
                    { value: 'elderly_support', label: '👴 Äldrestöd', color: 'border-rose-200 hover:bg-rose-50' },
                    { value: 'tech_help', label: '💻 Teknikhjälp', color: 'border-violet-200 hover:bg-violet-50' },
                    { value: 'gardening', label: '🌱 Trädgårdsarbete', color: 'border-lime-200 hover:bg-lime-50' }
                  ].map(skill => (
                    <label 
                      key={skill.value} 
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.expertise.includes(skill.value)
                          ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                          : skill.color
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.expertise.includes(skill.value)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.expertise, skill.value]
                            : formData.expertise.filter(s => s !== skill.value);
                          setFormData({ ...formData, expertise: updated });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fordonsinformation */}
        <TabsContent value="vehicle">
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicleInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driverProfile.vehicle_type === 'none' ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('noVehicleRegistered')}</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="registration">{t('registrationNumber')} *</Label>
                      <Input
                        id="registration"
                        placeholder="ABC123"
                        value={formData.vehicle_registration}
                        onChange={(e) => setFormData({...formData, vehicle_registration: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">{t('makeModel')}</Label>
                      <Input
                        id="model"
                        placeholder="Volvo V70"
                        value={formData.vehicle_model}
                        onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">{t('year')}</Label>
                      <Input
                        id="year"
                        placeholder="2020"
                        value={formData.vehicle_year}
                        onChange={(e) => setFormData({...formData, vehicle_year: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">{t('color')}</Label>
                      <Input
                        id="color"
                        placeholder="Svart"
                        value={formData.vehicle_color}
                        onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      {t('insuranceInfo')}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insurance_company">{t('insuranceCompany')}</Label>
                        <Input
                          id="insurance_company"
                          placeholder="If Försäkring"
                          value={formData.insurance_company}
                          onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="policy_number">{t('policyNumber')}</Label>
                        <Input
                          id="policy_number"
                          placeholder="123456789"
                          value={formData.insurance_policy_number}
                          onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="insurance_expiry">{t('expiryDate')}</Label>
                        <Input
                          id="insurance_expiry"
                          type="date"
                          value={formData.insurance_expiry_date}
                          onChange={(e) => setFormData({...formData, insurance_expiry_date: e.target.value})}
                        />
                        {isExpiringSoon(formData.insurance_expiry_date) && (
                          <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('expiringSoon')}
                          </p>
                        )}
                        {isExpired(formData.insurance_expiry_date) && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('expired')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-4">{t('licenseInfo')}</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="license_number">{t('licenseNumber')}</Label>
                        <Input
                          id="license_number"
                          placeholder="12345678"
                          value={formData.drivers_license_number}
                          onChange={(e) => setFormData({...formData, drivers_license_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="license_expiry">{t('expiryDate')}</Label>
                        <Input
                          id="license_expiry"
                          type="date"
                          value={formData.drivers_license_expiry}
                          onChange={(e) => setFormData({...formData, drivers_license_expiry: e.target.value})}
                        />
                        {isExpiringSoon(formData.drivers_license_expiry) && (
                          <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('expiringSoon')}
                          </p>
                        )}
                        {isExpired(formData.drivers_license_expiry) && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('expired')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave} 
                    className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('saveChanges')}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokument */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>{t('documentsCertificates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Körkort */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{t('driversLicense')}</h4>
                    <p className="text-sm text-gray-500">{t('uploadLicense')}</p>
                  </div>
                  {driverProfile.document_drivers_license && (
                    <Badge className="bg-green-100 text-green-700">
                      <Check className="h-3 w-3 mr-1" />
                      {t('uploaded')}
                    </Badge>
                  )}
                </div>
                
                {driverProfile.document_drivers_license ? (
                  <div className="space-y-2">
                    <a 
                      href={driverProfile.document_drivers_license} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#4A90A4] hover:underline"
                    >
                      {t('viewDocument')}
                    </a>
                    <div>
                      <Label htmlFor="license-reupload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-gray-50">
                          <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                          <span className="text-sm text-gray-600">{t('uploadNew')}</span>
                        </div>
                      </Label>
                      <input
                        id="license-reupload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e.target.files[0], 'document_drivers_license')}
                      />
                    </div>
                  </div>
                ) : (
                  <Label htmlFor="license-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">{t('clickToUpload')}</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 10MB)</p>
                    </div>
                    <input
                      id="license-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleDocumentUpload(e.target.files[0], 'document_drivers_license')}
                    />
                  </Label>
                )}
              </div>

              {/* Försäkringsbevis */}
              {driverProfile.vehicle_type !== 'none' && (
                <>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{t('insuranceCert')}</h4>
                        <p className="text-sm text-gray-500">{t('uploadInsurance')}</p>
                      </div>
                      {driverProfile.document_insurance && (
                        <Badge className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          {t('uploaded')}
                        </Badge>
                      )}
                    </div>
                    
                    {driverProfile.document_insurance ? (
                      <div className="space-y-2">
                        <a 
                          href={driverProfile.document_insurance} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#4A90A4] hover:underline"
                        >
                          Visa dokument
                        </a>
                        <div>
                          <Label htmlFor="insurance-reupload" className="cursor-pointer">
                            <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-gray-50">
                              <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                              <span className="text-sm text-gray-600">Ladda upp nytt</span>
                            </div>
                          </Label>
                          <input
                            id="insurance-reupload"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e.target.files[0], 'document_insurance')}
                          />
                        </div>
                      </div>
                    ) : (
                      <Label htmlFor="insurance-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Klicka för att ladda upp</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 10MB)</p>
                        </div>
                        <input
                          id="insurance-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e.target.files[0], 'document_insurance')}
                        />
                      </Label>
                    )}
                  </div>

                  {/* Registreringsbevis */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{t('registrationCert')}</h4>
                        <p className="text-sm text-gray-500">{t('uploadRegistration')}</p>
                      </div>
                      {driverProfile.document_vehicle_registration && (
                        <Badge className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          {t('uploaded')}
                        </Badge>
                      )}
                    </div>
                    
                    {driverProfile.document_vehicle_registration ? (
                      <div className="space-y-2">
                        <a 
                          href={driverProfile.document_vehicle_registration} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#4A90A4] hover:underline"
                        >
                          Visa dokument
                        </a>
                        <div>
                          <Label htmlFor="registration-reupload" className="cursor-pointer">
                            <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-gray-50">
                              <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                              <span className="text-sm text-gray-600">Ladda upp nytt</span>
                            </div>
                          </Label>
                          <input
                            id="registration-reupload"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e.target.files[0], 'document_vehicle_registration')}
                          />
                        </div>
                      </div>
                    ) : (
                      <Label htmlFor="registration-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Klicka för att ladda upp</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 10MB)</p>
                        </div>
                        <input
                          id="registration-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e.target.files[0], 'document_vehicle_registration')}
                        />
                      </Label>
                    )}
                  </div>
                </>
              )}

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('uploadingDocument')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Betalningsinformation */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>{t('paymentInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  {t('paymentInfoNote')}
                </p>
              </div>

              <div>
                <Label>{t('paymentMethod')}</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setFormData({...formData, payment_method: 'bank_transfer'})}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      formData.payment_method === 'bank_transfer'
                        ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                      formData.payment_method === 'bank_transfer' ? 'text-[#4A90A4]' : 'text-gray-400'
                    }`} />
                    <p className="font-medium">{t('bankTransfer')}</p>
                  </button>
                  <button
                    onClick={() => setFormData({...formData, payment_method: 'swish'})}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      formData.payment_method === 'swish'
                        ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                      formData.payment_method === 'swish' ? 'text-[#4A90A4]' : 'text-gray-400'
                    }`} />
                    <p className="font-medium">{t('swish')}</p>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="bank_account">
                  {formData.payment_method === 'swish' ? t('swishNumber') : t('clearingAccount')}
                </Label>
                <Input
                  id="bank_account"
                  placeholder={formData.payment_method === 'swish' ? '07XXXXXXXX' : 'XXXX-XXXXXXX'}
                  value={formData.bank_account}
                  onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.payment_method === 'swish' 
                    ? t('swishFormat')
                    : t('accountFormat')}
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}