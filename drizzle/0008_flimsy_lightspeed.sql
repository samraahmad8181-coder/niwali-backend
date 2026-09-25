ALTER TABLE "orders" ADD COLUMN "track_id" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_track_id_unique" UNIQUE("track_id");