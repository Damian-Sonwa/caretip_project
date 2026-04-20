-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."BusinessVerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('pending', 'processing', 'paid', 'failed', 'not_applicable');

-- CreateEnum
CREATE TYPE "public"."TipStatus" AS ENUM ('pending', 'success');

-- CreateEnum
CREATE TYPE "public"."GoalPeriod" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "public"."EmployeeActivationStatus" AS ENUM ('active', 'pending_activation');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "oauth_provider" TEXT,
    "oauth_subject" TEXT,
    "role" "public"."Role" NOT NULL,
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_activation_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "invite_code" TEXT,
    "invite_code_expires_at" TIMESTAMP(3),
    "stripe_account_id" TEXT,
    "user_id" TEXT NOT NULL,
    "verification_status" "public"."BusinessVerificationStatus" NOT NULL DEFAULT 'pending',
    "tax_id" TEXT,
    "legal_contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "registered_address" TEXT,
    "business_type" TEXT,
    "location" TEXT,
    "logo_path" TEXT,
    "verification_document_path" TEXT,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "business_id" TEXT NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."venue_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qr_slug" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "venue_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_EmployeeTableAssignments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,

    CONSTRAINT "_EmployeeTableAssignments_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "job_title" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "monthly_goal" DECIMAL(10,2),
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "activation_status" "public"."EmployeeActivationStatus" NOT NULL DEFAULT 'active',
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "location_id" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_goals" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "goal_amount" DECIMAL(10,2) NOT NULL,
    "goal_period" "public"."GoalPeriod" NOT NULL,
    "start_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tips" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."TipStatus" NOT NULL DEFAULT 'pending',
    "stripe_payment_intent_id" TEXT,
    "payout_status" "public"."PayoutStatus" NOT NULL DEFAULT 'not_applicable',
    "employee_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "location_id" TEXT,
    "table_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tip_feedback" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "location_id" TEXT,
    "table_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "rating" SMALLINT,
    "comment" TEXT,
    "tags" TEXT[],
    "customer_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tip_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_oauth_provider_subject_key" ON "public"."User"("oauth_provider", "oauth_subject");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "public"."password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "public"."password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_activation_tokens_token_hash_key" ON "public"."employee_activation_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "employee_activation_tokens_employee_id_idx" ON "public"."employee_activation_tokens"("employee_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "public"."businesses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_invite_code_key" ON "public"."businesses"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_user_id_key" ON "public"."businesses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "venue_tables_qr_slug_key" ON "public"."venue_tables"("qr_slug");

-- CreateIndex
CREATE INDEX "_EmployeeTableAssignments_B_index" ON "public"."_EmployeeTableAssignments"("B");

-- CreateIndex
CREATE UNIQUE INDEX "employees_slug_key" ON "public"."employees"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "public"."employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_business_id_location_id_idx" ON "public"."employees"("business_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_goals_employee_id_key" ON "public"."employee_goals"("employee_id");

-- CreateIndex
CREATE INDEX "tips_business_id_idx" ON "public"."tips"("business_id");

-- CreateIndex
CREATE INDEX "tips_business_id_status_idx" ON "public"."tips"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tip_feedback_transaction_id_key" ON "public"."tip_feedback"("transaction_id");

-- CreateIndex
CREATE INDEX "tip_feedback_business_id_idx" ON "public"."tip_feedback"("business_id");

-- CreateIndex
CREATE INDEX "tip_feedback_employee_id_idx" ON "public"."tip_feedback"("employee_id");

-- CreateIndex
CREATE INDEX "tip_feedback_created_at_idx" ON "public"."tip_feedback"("created_at");

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_activation_tokens" ADD CONSTRAINT "employee_activation_tokens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."businesses" ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venue_tables" ADD CONSTRAINT "venue_tables_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EmployeeTableAssignments" ADD CONSTRAINT "_EmployeeTableAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EmployeeTableAssignments" ADD CONSTRAINT "_EmployeeTableAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."venue_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_goals" ADD CONSTRAINT "employee_goals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tips" ADD CONSTRAINT "tips_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."venue_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tip_feedback" ADD CONSTRAINT "tip_feedback_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."tips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
