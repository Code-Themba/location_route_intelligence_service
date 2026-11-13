CREATE TABLE "chached_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"normalized_address" text NOT NULL,
	"formatted_address" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"place_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chached_locations_normalized_address_unique" UNIQUE("normalized_address")
);
--> statement-breakpoint
CREATE TABLE "chached_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"origin_id" integer NOT NULL,
	"destination_id" integer NOT NULL,
	"travel_mode" text NOT NULL,
	"distance_in_meters" integer NOT NULL,
	"duration_in_seconds" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chached_routes" ADD CONSTRAINT "chached_routes_origin_id_chached_locations_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."chached_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chached_routes" ADD CONSTRAINT "chached_routes_destination_id_chached_locations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."chached_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "route_unique_idx" ON "chached_routes" USING btree ("origin_id","destination_id","travel_mode");