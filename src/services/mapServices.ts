import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { cachedLocations, cachedRoutes } from "../db/schema";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // Time to live in cache 7 days
const TRAVEL_MODE_MAP: Record<string, string> = {
  DRIVING: "DRIVE",
  WALKING: "WALK",
  BICYCLING: "BICYCLE",
};

export async function getOrFetchLocation(rawAddress: string) {
  const normalized = rawAddress.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(cachedLocations)
    .where(eq(cachedLocations.normalizedQuery, normalized));
  console.log(existing);
  /*
    Check if the data is still in cache if it is get it from cached memory if not fire off a request to fetch it.
    */

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return { source: "cache", data: existing };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(rawAddress)}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const payload = await response.json();

  if (payload.status !== "OK" || !payload.results.length) {
    throw new Error(`Geocoding failed: ${payload.status}`);
  }

  const topResult = payload.results[0];
  const locationRecord = {
    normalizedQuery: normalized,
    formattedAddress: topResult.formatted_address,
    latitude: topResult.geometry.location.lat,
    longitude: topResult.geometry.location.lng,
    placeId: topResult.place_id,
    updatedAt: new Date(),
  };

  const [saved] = await db
    .insert(cachedLocations)
    .values(locationRecord)
    .onConflictDoUpdate({
      target: cachedLocations.normalizedQuery,
      set: locationRecord,
    })
    .returning();

  return { source: "google_api", data: saved };
}

export async function getOrFetchRoutes(
  originText: string,
  destText: string,
  mode: string,
) {
  const normalizedMode = mode.toUpperCase();
  const googleTravelMode = TRAVEL_MODE_MAP[normalizedMode] || "DRIVE";
  const origin = await getOrFetchLocation(originText);
  const destination = await getOrFetchLocation(destText);

  const [existingRoute] = await db
    .select()
    .from(cachedRoutes)
    .where(
      and(
        eq(cachedRoutes.originId, origin.data.id),
        eq(cachedRoutes.destinationId, destination.data.id),
        eq(cachedRoutes.travelMode, mode),
      ),
    );
  if (
    existingRoute &&
    Date.now() - existingRoute.updatedAt.getTime() < CACHE_TTL_MS
  ) {
    return {
      source: "cache",
      origin: origin.data.formattedAddress,
      destination: destination.data.formattedAddress,
      distanceMeters: existingRoute.distanceInMeters,
      durationSeconds: existingRoute.durationInSeconds,
    };
  }

  const routeRes = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: origin.data.placeId
          ? { placeId: origin.data.placeId }
          : {
              location: {
                latLng: {
                  latitude: origin.data.latitude,
                  longitude: origin.data.longitude,
                },
              },
            },
        destination: destination.data.placeId
          ? { placeId: destination.data.placeId }
          : {
              location: {
                latLng: {
                  latitude: destination.data.latitude,
                  longitude: destination.data.longitude,
                },
              },
            },
        travelMode: googleTravelMode,
      }),
    },
  );

  const routeData = await routeRes.json();
  console.log(routeData);
  const route = routeData.routes?.[0];
  if (!route) {
    console.error("Empty Routes Response:", JSON.stringify(routeData, null, 2));
    throw new Error("No route found between locations");
  }

  const durationInSeconds = parseInt(route.duration.replace("s", ""), 10);

  await db
    .insert(cachedRoutes)
    .values({
      originId: origin.data.id,
      destinationId: destination.data.id,
      travelMode: mode,
      distanceInMeters: route.distanceMeters,
      durationInSeconds,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  return {
    source: "google_api",
    origin: origin.data.formattedAddress,
    destination: destination.data.formattedAddress,
    distanceInMeters: route.distanceMeters,
    durationInSeconds,
  };
}
