import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, MessageCircle, ThumbsUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverReviewResponses({ driverProfile }) {
  const queryClient = useQueryClient();
  const [responseDialog, setResponseDialog] = useState({ open: false, review: null });
  const [responseText, setResponseText] = useState('');

  const { data: reviews = [] } = useQuery({
    queryKey: ['driver-reviews', driverProfile?.id],
    queryFn: async () => {
      if (!driverProfile?.id) return [];
      return await base44.entities.Rating.filter(
        { driver_id: driverProfile.id, is_visible: true },
        '-created_date',
        50
      );
    },
    enabled: !!driverProfile?.id
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['my-responses', driverProfile?.id],
    queryFn: async () => {
      if (!driverProfile?.id) return [];
      return await base44.entities.ReviewResponse.filter(
        { driver_id: driverProfile.id }
      );
    },
    enabled: !!driverProfile?.id
  });

  const createResponseMutation = useMutation({
    mutationFn: (data) => base44.entities.ReviewResponse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-responses']);
      setResponseDialog({ open: false, review: null });
      setResponseText('');
    }
  });

  const hasResponse = (reviewId) => {
    return responses.find(r => r.review_id === reviewId);
  };

  const handleSubmitResponse = () => {
    if (!responseText.trim()) return;

    createResponseMutation.mutate({
      review_id: responseDialog.review.id,
      driver_id: driverProfile.id,
      driver_name: driverProfile.name,
      response_text: responseText,
      is_visible: true
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Genomsnittligt Betyg</p>
                <p className="text-3xl font-bold text-amber-500">{avgRating}</p>
              </div>
              <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Totala Recensioner</p>
                <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rekommendationer</p>
                <p className="text-3xl font-bold text-green-600">
                  {reviews.filter(r => r.would_recommend).length}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dina Recensioner</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Inga recensioner än</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const existingResponse = hasResponse(review.id);

                return (
                  <Card key={review.id} className={review.rating >= 4 ? 'border-green-200' : review.rating <= 2 ? 'border-red-200' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">#{review.booking_number}</Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(review.created_date), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            från {review.customer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.would_recommend && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Rekommenderar
                            </Badge>
                          )}
                        </div>
                      </div>

                      {review.feedback && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-700">{review.feedback}</p>
                        </div>
                      )}

                      {existingResponse ? (
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-900">Ditt Svar</span>
                          </div>
                          <p className="text-sm text-blue-800">{existingResponse.response_text}</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResponseDialog({ open: true, review });
                            setResponseText('');
                          }}
                          className="mt-2"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Svara på Recension
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={responseDialog.open} onOpenChange={(open) => setResponseDialog({ open, review: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Svara på Recension</DialogTitle>
          </DialogHeader>
          {responseDialog.review && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < responseDialog.review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-2">från {responseDialog.review.customer_name}</p>
                {responseDialog.review.feedback && (
                  <p className="text-gray-700 italic">"{responseDialog.review.feedback}"</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ditt Svar</label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tacka för feedbacken eller ge din syn på situationen..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Var professionell och respektfull. Ditt svar kommer att synas offentligt.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialog({ open: false, review: null })}>
              Avbryt
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={!responseText.trim() || createResponseMutation.isPending}
              className="bg-[#4A90A4]"
            >
              {createResponseMutation.isPending ? 'Skickar...' : 'Skicka Svar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}