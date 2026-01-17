import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query, location } = await req.json();

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    console.log('Searching stores:', query, location);

    // Search using Google Places Text Search API
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', `${query} in Sweden`);
    if (location?.lat && location?.lng) {
      searchUrl.searchParams.append('location', `${location.lat},${location.lng}`);
      searchUrl.searchParams.append('radius', '50000'); // 50km radius
    }
    searchUrl.searchParams.append('key', apiKey);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return Response.json({ error: `Google Places error: ${data.status}` }, { status: 500 });
    }

    const stores = data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      photo_reference: place.photos?.[0]?.photo_reference || null,
      rating: place.rating || null,
      open_now: place.opening_hours?.open_now || null
    }));

    console.log(`Found ${stores.length} stores`);

    return Response.json({ stores });

  } catch (error) {
    console.error('Store search error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});