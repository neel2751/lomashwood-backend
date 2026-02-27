
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   
CREATE EXTENSION IF NOT EXISTS "citext";     
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    


CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'DELETED'
);

CREATE TYPE "AuthProvider" AS ENUM (
  'EMAIL',
  'GOOGLE',
  'FACEBOOK',
  'APPLE',
  'GITHUB'
);

CREATE TYPE "TokenType" AS ENUM (
  'ACCESS',
  'REFRESH',
  'PASSWORD_RESET',
  'EMAIL_VERIFICATION',
  'MAGIC_LINK',
  'INVITE'
);

CREATE TYPE "RoleType" AS ENUM (
  'SYSTEM',
  'CUSTOM'
);

CREATE TYPE "AuditAction" AS ENUM (
  'USER_REGISTERED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_LOGIN_FAILED',
  'USER_PASSWORD_CHANGED',
  'USER_PASSWORD_RESET_REQUESTED',
  'USER_PASSWORD_RESET_COMPLETED',
  'USER_EMAIL_VERIFIED',
  'USER_PROFILE_UPDATED',
  'USER_STATUS_CHANGED',
  'USER_ROLE_ASSIGNED',
  'USER_ROLE_REVOKED',
  'USER_DELETED',
  'USER_RESTORED',
  'SESSION_CREATED',
  'SESSION_REVOKED',
  'SESSION_EXPIRED',
  'TOKEN_BLACKLISTED',
  'ROLE_CREATED',
  'ROLE_UPDATED',
  'ROLE_DELETED',
  'PERMISSION_GRANTED',
  'PERMISSION_REVOKED',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'MFA_VERIFIED',
  'SUSPICIOUS_ACTIVITY'
);

CREATE TYPE "MfaMethod" AS ENUM (
  'TOTP',
  'EMAIL_OTP',
  'SMS_OTP',
  'BACKUP_CODE'
);

CREATE TABLE "users" (
  
  "id"                      TEXT          NOT NULL,

  
  "email"                   CITEXT        NOT NULL,
  "email_verified"          BOOLEAN       NOT NULL DEFAULT FALSE,
  "email_verified_at"       TIMESTAMPTZ,

  "phone_number"            TEXT,
  "phone_verified"          BOOLEAN       NOT NULL DEFAULT FALSE,
  "phone_verified_at"       TIMESTAMPTZ,

  "first_name"              TEXT          NOT NULL,
  "last_name"               TEXT          NOT NULL,
  "display_name"            TEXT,
  "avatar_url"              TEXT,

  
  "password_hash"           TEXT,
  "auth_provider"           "AuthProvider" NOT NULL DEFAULT 'EMAIL',
  "provider_id"             TEXT,

  
  "status"                  "UserStatus"  NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "is_active"               BOOLEAN       NOT NULL DEFAULT TRUE,
  "is_super_admin"          BOOLEAN       NOT NULL DEFAULT FALSE,

  
  "mfa_enabled"             BOOLEAN       NOT NULL DEFAULT FALSE,
  "mfa_method"              "MfaMethod",
  "mfa_enrolled_at"         TIMESTAMPTZ,

  
  "failed_login_attempts"   INTEGER       NOT NULL DEFAULT 0,
  "locked_until"            TIMESTAMPTZ,
  "last_login_at"           TIMESTAMPTZ,
  "last_login_ip"           TEXT,
  "last_activity_at"        TIMESTAMPTZ,
  "password_changed_at"     TIMESTAMPTZ,
  "force_password_reset"    BOOLEAN       NOT NULL DEFAULT FALSE,

  
  "created_at"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "deleted_at"              TIMESTAMPTZ,
  "created_by"              TEXT,
  "updated_by"              TEXT,

  CONSTRAINT "users_pkey"                 PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key"            UNIQUE ("email"),
  CONSTRAINT "users_phone_number_key"     UNIQUE ("phone_number")
);


CREATE INDEX "users_email_idx"            ON "users" ("email");
CREATE INDEX "users_status_idx"           ON "users" ("status");
CREATE INDEX "users_is_active_idx"        ON "users" ("is_active");
CREATE INDEX "users_auth_provider_idx"    ON "users" ("auth_provider", "provider_id");
CREATE INDEX "users_deleted_at_idx"       ON "users" ("deleted_at");
CREATE INDEX "users_last_activity_idx"    ON "users" ("last_activity_at");
CREATE INDEX "users_created_at_idx"       ON "users" ("created_at");


CREATE INDEX "users_active_nondel_idx"    ON "users" ("email")
  WHERE "is_active" = TRUE AND "deleted_at" IS NULL;


CREATE INDEX "users_first_name_trgm_idx"  ON "users" USING GIN ("first_name" gin_trgm_ops);
CREATE INDEX "users_last_name_trgm_idx"   ON "users" USING GIN ("last_name"  gin_trgm_ops);


CREATE TABLE "roles" (
  "id"          TEXT          NOT NULL,
  "name"        TEXT          NOT NULL,
  "slug"        TEXT          NOT NULL,
  "description" TEXT,
  "type"        "RoleType"    NOT NULL DEFAULT 'CUSTOM',
  "is_default"  BOOLEAN       NOT NULL DEFAULT FALSE,
  "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE,

  
  "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "deleted_at"  TIMESTAMPTZ,
  "created_by"  TEXT,
  "updated_by"  TEXT,

  CONSTRAINT "roles_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "roles_name_key"   UNIQUE ("name"),
  CONSTRAINT "roles_slug_key"   UNIQUE ("slug")
);

CREATE INDEX "roles_slug_idx"       ON "roles" ("slug");
CREATE INDEX "roles_is_active_idx"  ON "roles" ("is_active");
CREATE INDEX "roles_is_default_idx" ON "roles" ("is_default");
CREATE INDEX "roles_deleted_at_idx" ON "roles" ("deleted_at");

CREATE TABLE "permissions" (
  "id"          TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,   
  "slug"        TEXT        NOT NULL,   
  "resource"    TEXT        NOT NULL,
  "action"      TEXT        NOT NULL,
  "description" TEXT,
  "is_active"   BOOLEAN     NOT NULL DEFAULT TRUE,

  
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "permissions_pkey"                 PRIMARY KEY ("id"),
  CONSTRAINT "permissions_name_key"             UNIQUE ("name"),
  CONSTRAINT "permissions_slug_key"             UNIQUE ("slug"),
  CONSTRAINT "permissions_resource_action_key"  UNIQUE ("resource", "action")
);

CREATE INDEX "permissions_resource_idx"   ON "permissions" ("resource");
CREATE INDEX "permissions_is_active_idx"  ON "permissions" ("is_active");

CREATE TABLE "role_permissions" (
  "id"            TEXT        NOT NULL,
  "role_id"       TEXT        NOT NULL,
  "permission_id" TEXT        NOT NULL,

  
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by"    TEXT,

  CONSTRAINT "role_permissions_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "role_permissions_role_permission_key"
    UNIQUE ("role_id", "permission_id"),
  CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id")
    REFERENCES "roles" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id")
    REFERENCES "permissions" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "role_permissions_role_id_idx"       ON "role_permissions" ("role_id");
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" ("permission_id");


CREATE TABLE "user_roles" (
  "id"          TEXT        NOT NULL,
  "user_id"     TEXT        NOT NULL,
  "role_id"     TEXT        NOT NULL,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "assigned_by" TEXT,
  "expires_at"  TIMESTAMPTZ,

  CONSTRAINT "user_roles_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "user_roles_user_role_key"
    UNIQUE ("user_id", "role_id"),
  CONSTRAINT "user_roles_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_roles_role_id_fkey"
    FOREIGN KEY ("role_id")
    REFERENCES "roles" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "user_roles_user_id_idx"   ON "user_roles" ("user_id");
CREATE INDEX "user_roles_role_id_idx"   ON "user_roles" ("role_id");
CREATE INDEX "user_roles_expires_at_idx" ON "user_roles" ("expires_at")
  WHERE "expires_at" IS NOT NULL;


CREATE TABLE "sessions" (
  "id"              TEXT        NOT NULL,
  "user_id"         TEXT        NOT NULL,
  "token"           TEXT        NOT NULL,
  "token_hash"      TEXT        NOT NULL,

  
  "ip_address"      TEXT,
  "user_agent"      TEXT,
  "device_id"       TEXT,
  "device_type"     TEXT,
  "browser"         TEXT,
  "os"              TEXT,
  "location"        TEXT,

  
  "is_active"       BOOLEAN     NOT NULL DEFAULT TRUE,
  "expires_at"      TIMESTAMPTZ NOT NULL,
  "last_access_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "revoked_at"      TIMESTAMPTZ,
  "revoked_reason"  TEXT,

  
  "mfa_verified"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "mfa_verified_at" TIMESTAMPTZ,

  
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "sessions_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "sessions_token_key"      UNIQUE ("token"),
  CONSTRAINT "sessions_token_hash_key" UNIQUE ("token_hash"),
  CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sessions_user_id_idx"         ON "sessions" ("user_id");
CREATE INDEX "sessions_token_hash_idx"      ON "sessions" ("token_hash");
CREATE INDEX "sessions_is_active_idx"       ON "sessions" ("is_active");
CREATE INDEX "sessions_expires_at_idx"      ON "sessions" ("expires_at");
CREATE INDEX "sessions_created_at_idx"      ON "sessions" ("created_at");
CREATE INDEX "sessions_user_active_idx"     ON "sessions" ("user_id", "is_active");


CREATE INDEX "sessions_active_live_idx"     ON "sessions" ("user_id", "expires_at")
  WHERE "is_active" = TRUE AND "revoked_at" IS NULL;


CREATE TABLE "refresh_tokens" (
  "id"          TEXT        NOT NULL,
  "user_id"     TEXT        NOT NULL,
  "token_hash"  TEXT        NOT NULL,
  "family"      TEXT        NOT NULL,
  "generation"  INTEGER     NOT NULL DEFAULT 1,

  
  "is_used"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "is_revoked"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "used_at"     TIMESTAMPTZ,
  "revoked_at"  TIMESTAMPTZ,
  "expires_at"  TIMESTAMPTZ NOT NULL,

  
  "ip_address"  TEXT,
  "user_agent"  TEXT,

  
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "refresh_tokens_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "refresh_tokens_token_hash_key" UNIQUE ("token_hash"),
  CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "refresh_tokens_user_id_idx"      ON "refresh_tokens" ("user_id");
CREATE INDEX "refresh_tokens_token_hash_idx"   ON "refresh_tokens" ("token_hash");
CREATE INDEX "refresh_tokens_family_idx"       ON "refresh_tokens" ("family");
CREATE INDEX "refresh_tokens_is_revoked_idx"   ON "refresh_tokens" ("is_revoked");
CREATE INDEX "refresh_tokens_expires_at_idx"   ON "refresh_tokens" ("expires_at");
CREATE INDEX "refresh_tokens_user_revoked_idx" ON "refresh_tokens" ("user_id", "is_revoked");


CREATE TABLE "password_reset_tokens" (
  "id"          TEXT        NOT NULL,
  "user_id"     TEXT        NOT NULL,
  "token_hash"  TEXT        NOT NULL,

  
  "is_used"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "used_at"     TIMESTAMPTZ,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "ip_address"  TEXT,

  
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "password_reset_tokens_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_tokens_token_hash_key" UNIQUE ("token_hash"),
  CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "password_reset_tokens_user_id_idx"    ON "password_reset_tokens" ("user_id");
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens" ("token_hash");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" ("expires_at");
CREATE INDEX "password_reset_tokens_is_used_idx"    ON "password_reset_tokens" ("is_used")
  WHERE "is_used" = FALSE;

CREATE TABLE "email_verification_tokens" (
  "id"          TEXT        NOT NULL,
  "user_id"     TEXT        NOT NULL,
  "email"       CITEXT      NOT NULL,
  "token_hash"  TEXT        NOT NULL,

  
  "is_used"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "used_at"     TIMESTAMPTZ,
  "expires_at"  TIMESTAMPTZ NOT NULL,

  
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "email_verification_tokens_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "email_verification_tokens_token_hash_key" UNIQUE ("token_hash"),
  CONSTRAINT "email_verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "email_ver_tokens_user_id_idx"    ON "email_verification_tokens" ("user_id");
CREATE INDEX "email_ver_tokens_token_hash_idx" ON "email_verification_tokens" ("token_hash");
CREATE INDEX "email_ver_tokens_email_idx"      ON "email_verification_tokens" ("email");
CREATE INDEX "email_ver_tokens_expires_at_idx" ON "email_verification_tokens" ("expires_at");


CREATE TABLE "otp_secrets" (
  "id"           TEXT        NOT NULL,
  "user_id"      TEXT        NOT NULL,
  "method"       "MfaMethod" NOT NULL,

  
  "secret"       TEXT,
  "qr_code_url"  TEXT,

  
  "is_verified"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "verified_at"  TIMESTAMPTZ,
  "is_active"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "disabled_at"  TIMESTAMPTZ,

  
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "otp_secrets_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "otp_secrets_user_method_key"
    UNIQUE ("user_id", "method"),
  CONSTRAINT "otp_secrets_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "otp_secrets_user_id_idx"  ON "otp_secrets" ("user_id");
CREATE INDEX "otp_secrets_is_active_idx" ON "otp_secrets" ("is_active")
  WHERE "is_active" = TRUE;


CREATE TABLE "backup_codes" (
  "id"          TEXT        NOT NULL,
  "user_id"     TEXT        NOT NULL,
  "code_hash"   TEXT        NOT NULL,

  
  "is_used"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "used_at"     TIMESTAMPTZ,

  
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "backup_codes_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "backup_codes_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "backup_codes_user_id_idx"      ON "backup_codes" ("user_id");
CREATE INDEX "backup_codes_user_unused_idx"  ON "backup_codes" ("user_id", "is_used")
  WHERE "is_used" = FALSE;

CREATE TABLE "token_blacklist" (
  "id"          TEXT         NOT NULL,
  "token_hash"  TEXT         NOT NULL,
  "token_type"  "TokenType"  NOT NULL,
  "user_id"     TEXT,
  "reason"      TEXT,
  "expires_at"  TIMESTAMPTZ  NOT NULL,

  
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "token_blacklist_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "token_blacklist_token_hash_key" UNIQUE ("token_hash")
  
);

CREATE INDEX "token_blacklist_token_hash_idx" ON "token_blacklist" ("token_hash");
CREATE INDEX "token_blacklist_expires_at_idx" ON "token_blacklist" ("expires_at");
CREATE INDEX "token_blacklist_user_id_idx"    ON "token_blacklist" ("user_id")
  WHERE "user_id" IS NOT NULL;
CREATE INDEX "token_blacklist_token_type_idx" ON "token_blacklist" ("token_type");


CREATE TABLE "audit_logs" (
  "id"          TEXT          NOT NULL,
  "user_id"     TEXT,
  "action"      "AuditAction" NOT NULL,
  "resource"    TEXT,
  "resource_id" TEXT,
  "ip_address"  TEXT,
  "user_agent"  TEXT,
  "metadata"    JSONB,
  "success"     BOOLEAN       NOT NULL DEFAULT TRUE,
  "error_code"  TEXT,
  "error_msg"   TEXT,

  
  "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "audit_logs_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_user_id_idx"       ON "audit_logs" ("user_id");
CREATE INDEX "audit_logs_action_idx"        ON "audit_logs" ("action");
CREATE INDEX "audit_logs_resource_idx"      ON "audit_logs" ("resource", "resource_id");
CREATE INDEX "audit_logs_ip_address_idx"    ON "audit_logs" ("ip_address");
CREATE INDEX "audit_logs_created_at_idx"    ON "audit_logs" ("created_at");
CREATE INDEX "audit_logs_success_idx"       ON "audit_logs" ("success");
CREATE INDEX "audit_logs_user_action_idx"   ON "audit_logs" ("user_id", "action");
CREATE INDEX "audit_logs_created_action_idx" ON "audit_logs" ("created_at", "action");


CREATE INDEX "audit_logs_metadata_gin_idx"  ON "audit_logs" USING GIN ("metadata")
  WHERE "metadata" IS NOT NULL;


CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


CREATE TRIGGER "users_set_updated_at"
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


CREATE TRIGGER "roles_set_updated_at"
  BEFORE UPDATE ON "roles"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


CREATE TRIGGER "sessions_set_updated_at"
  BEFORE UPDATE ON "sessions"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


CREATE TRIGGER "refresh_tokens_set_updated_at"
  BEFORE UPDATE ON "refresh_tokens"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


CREATE TRIGGER "otp_secrets_set_updated_at"
  BEFORE UPDATE ON "otp_secrets"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    TEXT          NOT NULL,
  "checksum"              TEXT          NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        TEXT          NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "applied_steps_count"   INTEGER       NOT NULL DEFAULT 0,

  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);