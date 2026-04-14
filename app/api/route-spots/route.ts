import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Spot } from '@/types';

const VALID_SPOT_TYPES = ['street', 'park', 'diy', 'transition', 'flatground', 'other'] as const;
const VALID_STREET_FEATURES = ['ledge', 'stairs', 'handrail', 'gap', 'bank', 'other'] as const;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function parseDescriptionWithAI(description: string): Promise<{
  spot_types: string[];
  street_features: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[route-spots] GEMINI_API_KEY is not set — skipping AI filter');
    return { spot_types: [], street_features: [] };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are a skate spot classifier. A user will describe what kind of skate spots they are looking for.
Extract which spot types and street features they want from their description.

Valid spot_types: ${VALID_SPOT_TYPES.join(', ')}
Valid street_features: ${VALID_STREET_FEATURES.join(', ')}

Return ONLY valid JSON with no markdown, no explanation:
{
  "spot_types": [],
  "street_features": []
}

Rules:
- Only include values from the valid lists above
- If the user mentions rails, include "handrail"
- If the user mentions ledges/curbs, include "ledge"
- If the user says "anything" or gives no preference, return empty arrays
- If unclear, err on the side of fewer filters

User description: "${description}"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON — handle code fences or any surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    spot_types: (parsed.spot_types ?? []).filter((t: string) =>
      (VALID_SPOT_TYPES as readonly string[]).includes(t)
    ),
    street_features: (parsed.street_features ?? []).filter((t: string) =>
      (VALID_STREET_FEATURES as readonly string[]).includes(t)
    ),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const description = searchParams.get('description') ?? '';

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // Use Gemini to parse natural language into filter params
  let spotTypes: string[] = [];
  let streetFeatures: string[] = [];

  if (description) {
    try {
      const parsed = await parseDescriptionWithAI(description);
      spotTypes = parsed.spot_types;
      streetFeatures = parsed.street_features;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        message.includes('429') ||
        message.includes('Too Many Requests') ||
        message.includes('quota');
      console.error('[route-spots] AI parse error:', message);
      if (!isRateLimit) {
        return NextResponse.json(
          { error: 'AI error', message: `Could not parse your description: ${message}` },
          { status: 500 }
        );
      }
      // On rate limit, fall through with no filters — return all nearby spots
      console.warn('[route-spots] Rate limited by Gemini — returning unfiltered results');
    }
  }

  const supabase = await createClient();

  let query = supabase
    .from('spots')
    .select('id, name, address, city, spot_type, street_feature, difficulty, latitude, longitude')
    .eq('is_approved', true);

  if (spotTypes.length > 0 && streetFeatures.length > 0) {
    query = query.or(
      `spot_type.in.(${spotTypes.join(',')}),street_feature.in.(${streetFeatures.join(',')})`
    );
  } else if (spotTypes.length > 0) {
    query = query.in('spot_type', spotTypes);
  } else if (streetFeatures.length > 0) {
    query = query.in('street_feature', streetFeatures);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
  }

  const spots = (data as Spot[])
    .map((s) => ({
      ...s,
      distance: haversine(lat, lon, s.latitude, s.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  return NextResponse.json(spots);
}
