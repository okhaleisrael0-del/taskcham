import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, ThumbsUp, MessageCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewsSection({ customerEmail }) {
  const [selectedReview, setSelectedReview] = useState(null);

  const { data: reviews = [] } = useQuery({
    queryKey: ['customer-reviews', customerEmail],
    queryFn: async () => {
      if (!customerEmail) return [];
      return await base44.entities.Rating.filter(
        { customer_email: customerEmail, is_visible: true },
        '-created_date',
        50
      );
    },
    enabled: !!customerEmail
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['review-responses'],
    queryFn: () => base44.entities.ReviewResponse.filter({ is_visible: true })
  });

  const getResponseForReview = (reviewId) => {
    return responses.find(r => r.review_id === reviewId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mina Recensioner</h2>
        <p className="text-gray-600">Dina betyg och feedback om genomförda uppdrag</p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Du har inga recensioner än</p>
            <p className="text-sm mt-2">Betygsätt dina slutförda uppdrag för att bygga upp en historik</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const response = getResponseForReview(review.id);
            
            return (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">#{review.booking_number}</Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.created_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{review.driver_name}</span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {review.service_type?.replace('_', ' ')}
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
                        <Badge className="bg-green-100 text-green-800">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Rekommenderar
                        </Badge>
                      )}
                    </div>
                  </div>

                  {review.feedback && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 leading-relaxed">{review.feedback}</p>
                    </div>
                  )}

                  {review.categories && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(review.categories).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500 capitalize">{key.replace('_', ' ')}: </span>
                          <span className="font-semibold">{value}/5</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {response && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">Svar från {response.driver_name}</span>
                      </div>
                      <p className="text-sm text-blue-800">{response.response_text}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReview(review)}
                    >
                      Se Detaljer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recension #{selectedReview?.booking_number}</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{selectedReview.driver_name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedReview.created_date), 'dd MMMM yyyy')}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < selectedReview.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {selectedReview.feedback && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedReview.feedback}</p>
                </div>
              )}

              {selectedReview.categories && (
                <div>
                  <h4 className="font-semibold mb-3">Detaljerad Bedömning</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedReview.categories).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize text-gray-600">
                          {key.replace('_', ' ')}
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < value
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}