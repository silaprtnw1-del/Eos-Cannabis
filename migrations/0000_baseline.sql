CREATE TYPE "public"."batch_status" AS ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."plant_stage" AS ENUM('CLONE', 'VEG', 'FLOWER', 'HARVESTED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('OPERATOR', 'SUPERVISOR', 'AUDITOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('CLONING', 'VEG', 'FLOWER', 'DRYING', 'CURING', 'PACKAGING');--> statement-breakpoint
CREATE TABLE "action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actiontype" text NOT NULL,
	"operatorid" uuid NOT NULL,
	"targettype" text NOT NULL,
	"targetid" text NOT NULL,
	"plantid" text,
	"details" jsonb NOT NULL,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"strainname" text NOT NULL,
	"status" "batch_status" DEFAULT 'ACTIVE' NOT NULL,
	"startdate" timestamp with time zone DEFAULT now() NOT NULL,
	"enddate" timestamp with time zone,
	"metadata" jsonb,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultivation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logdate" timestamp with time zone DEFAULT now() NOT NULL,
	"batchid" text,
	"roomname" text NOT NULL,
	"watervolume" double precision NOT NULL,
	"waterunit" text DEFAULT 'liters' NOT NULL,
	"phin" double precision NOT NULL,
	"ecin" double precision NOT NULL,
	"runoffvolume" double precision,
	"phout" double precision,
	"ecout" double precision,
	"nutrientsfeed" jsonb NOT NULL,
	"operatorid" uuid NOT NULL,
	"notes" text,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environmental_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recordedat" timestamp with time zone DEFAULT now() NOT NULL,
	"roomname" text NOT NULL,
	"tempc" double precision NOT NULL,
	"humidityrh" double precision NOT NULL,
	"vpd" double precision,
	"ppfd" integer,
	"dli" double precision,
	"sensorraw" jsonb,
	"sensorid" text,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gacp_compliance_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkdate" text NOT NULL,
	"operatorid" uuid NOT NULL,
	"tasks" jsonb NOT NULL,
	"haspestincident" boolean DEFAULT false NOT NULL,
	"incidentdetails" text,
	"correctiveaction" text,
	"audittrail" jsonb DEFAULT '[]' NOT NULL,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gacp_compliance_checklists_checkdate_unique" UNIQUE("checkdate")
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" text PRIMARY KEY NOT NULL,
	"strainname" text NOT NULL,
	"stage" "plant_stage" DEFAULT 'CLONE' NOT NULL,
	"roomname" text NOT NULL,
	"plantedat" timestamp with time zone DEFAULT now() NOT NULL,
	"harvestedat" timestamp with time zone,
	"batchid" text,
	"metadata" jsonb,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "room_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "rooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"fullname" text NOT NULL,
	"role" "role_type" DEFAULT 'OPERATOR' NOT NULL,
	"isactive" boolean DEFAULT true NOT NULL,
	"phone" text,
	"createdat" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_operatorid_users_id_fk" FOREIGN KEY ("operatorid") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_plantid_plants_id_fk" FOREIGN KEY ("plantid") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultivation_logs" ADD CONSTRAINT "cultivation_logs_batchid_batches_id_fk" FOREIGN KEY ("batchid") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultivation_logs" ADD CONSTRAINT "cultivation_logs_operatorid_users_id_fk" FOREIGN KEY ("operatorid") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gacp_compliance_checklists" ADD CONSTRAINT "gacp_compliance_checklists_operatorid_users_id_fk" FOREIGN KEY ("operatorid") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_batchid_batches_id_fk" FOREIGN KEY ("batchid") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;