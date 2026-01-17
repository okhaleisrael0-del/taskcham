import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { place_id } = await req.json();

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    console.log('Getting store details for:', place_id);

    // Get details using Google Places Details API
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.append('place_id', place_id);
    detailsUrl.searchParams.append('fields', 'name,formatted_address,geometry,formatted_phone_number,opening_hours,rating,photos,website,types');
    detailsUrl.searchParams.append('key', apiKey);

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status);
      return Response.json({ error: `Google Places error: ${data.status}` }, { status: 500 });
    }

    const place = data.result;
    const storeDetails = {
      place_id: place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number || null,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || null,
      website: place.website || null,
      photo_reference: place.photos?.[0]?.photo_reference || null,
      opening_hours: place.opening_hours?.weekday_text || null,
      open_now: place.opening_hours?.open_now || null,
      types: place.types || []
    };

    console.log('Store details retrieved:', storeDetails.name);

    return Response.json({ store: storeDetails });

  } catch (error) {
    console.error('Get store details error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});