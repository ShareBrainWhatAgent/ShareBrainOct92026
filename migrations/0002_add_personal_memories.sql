ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT FALSE NOT NULL;
--> statement-breakpoint
CREATE TABLE "personal_memories" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" varchar NOT NULL REFERENCES users(id),
    "agent_id" integer NOT NULL REFERENCES agents(id),
    "memory_key" varchar(100) NOT NULL,
    "memory_value" text NOT NULL,
    "original_statement" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
