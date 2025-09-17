CREATE TABLE "note_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"tag" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_note_tags_note_id" ON "note_tags" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_tags_tag" ON "note_tags" USING btree ("tag");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_tags_note_tag" ON "note_tags" USING btree ("note_id","tag");