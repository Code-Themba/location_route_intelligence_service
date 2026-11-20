import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const cachedLocations = pgTable("cached_locations", {
  id: serial("id").primaryKey(),
  normalizedQuery: text("normalized_address").notNull().unique(),
  formattedAddress: text("formatted_address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  placeId: text("place_id").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cachedRoutes = pgTable(
  "cached_routes",
  {
    id: serial("id").primaryKey(),
    originId: integer("origin_id")
      .references(() => cachedLocations.id)
      .notNull(),
    destinationId: integer("destination_id")
      .references(() => cachedLocations.id)
      .notNull(),
    travelMode: text("travel_mode").notNull(),
    distanceInMeters: integer("distance_in_meters").notNull(),
    durationInSeconds: integer("duration_in_seconds").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("route_unique_idx").on(
      table.originId,
      table.destinationId,
      table.travelMode,
    ),
  ],
);
