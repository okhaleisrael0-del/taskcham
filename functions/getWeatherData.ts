import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Get weather data for location using LLM with internet context
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { lat, lng } = await req.json();
    
    if (!lat || !lng) {
      return Response.json({ 
        condition: 'clear', 
        temp: 15,
        description: 'Unknown'
      });
    }

    // Use InvokeLLM with internet context to get current weather
    const weatherResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Get current weather conditions for coordinates ${lat}, ${lng} (Gothenburg area). Return only weather condition category (clear, rain, snow, storm, cloudy) and temperature in celsius.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          condition: {
            type: "string",
            enum: ["clear", "rain", "snow", "storm", "cloudy", "fog"]
          },
          temp: {
            type: "number"
          },
          description: {
            type: "string"
          }
        }
      }
    });

    return Response.json(weatherResponse);

  } catch (error) {
    console.error('Weather fetch error:', error);
    return Response.json({ 
      condition: 'clear', 
      temp: 15,
      description: 'Okänt'
    });
  }
});