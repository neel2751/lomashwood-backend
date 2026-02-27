# Auth Service - Prisma Database Documentation

## Overview

This directory contains the Prisma schema and migrations for the **Auth Service** of the Lomash Wood platform. The Auth Service is responsible for user authentication, session management, and role-based access control.

## Database Provider

- **Provider**: PostgreSQL
- **ORM**: Prisma

## Schema Structure

### Models

#### User
- Stores user account information
- Fields: id, email, password (hashed), firstName, lastName, phone, isEmailVerified, isActive, createdAt, updatedAt
- Relations: Sessions, Roles

#### Session
- Manages user sessions and JWT tokens
- Fields: id, userId, token, refreshToken, expiresAt, ipAddress, userAgent, createdAt, updatedAt
- Relations: User

#### Role
- Defines user roles and permissions
- Fields: id, name, description, permissions, createdAt, updatedAt
- Relations: Users (many-to-many)

#### PasswordReset
- Handles password reset tokens
- Fields: id, userId, token, expiresAt, isUsed, createdAt
- Relations: User

#### EmailVerification
- Manages email verification tokens
- Fields: id, userId, token, expiresAt, isVerified, createdAt
- Relations: User

## Migrations

### Migration Workflow

1. **Create a migration**:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```

2. **Apply migrations in production**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Reset database (development only)**:
   ```bash
   npx prisma migrate reset
   ```

4. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

### Migration Naming Convention

Use descriptive names that indicate what the migration does:
- `init` - Initial schema creation
- `add_email_verification` - Adding email verification feature
- `add_role_permissions` - Adding role-based permissions
- `update_session_table` - Modifying session table structure

## Seeding

The `seed.ts` file contains initial data for:
- Default admin user
- Default user roles (Admin, User, Customer)
- System permissions

### Run Seed

```bash
npm run db:seed
```

Or directly:
```bash
npx prisma db seed
```

## Prisma Commands

### Generate Prisma Client

```bash
npx prisma generate
```

### Open Prisma Studio (Database GUI)

```bash
npx prisma studio
```

### Format Schema

```bash
npx prisma format
```

### Validate Schema

```bash
npx prisma validate
```

## Environment Variables

Required environment variables for database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lomash_auth?schema=public"
```

## Database Indexes

The following indexes are created for performance optimization:

- `User.email` - Unique index for fast email lookups
- `Session.token` - Index for session token validation
- `Session.userId` - Index for user session retrieval
- `Role.name` - Unique index for role names
- `PasswordReset.token` - Index for password reset token lookup
- `EmailVerification.token` - Index for email verification lookup

## Soft Deletes

The schema implements soft deletes using:
- `deletedAt` timestamp field
- `isActive` boolean flag

This ensures data integrity and audit trail.

## Audit Fields

All models include:
- `createdAt` - Timestamp of record creation
- `updatedAt` - Timestamp of last update
- `deletedAt` - Timestamp of soft deletion (where applicable)

## Security Considerations

1. **Passwords**: Never stored in plain text - always hashed using bcrypt
2. **Tokens**: Session and reset tokens are securely generated and time-limited
3. **Sessions**: Include IP address and user agent for security auditing
4. **Refresh Tokens**: Rotated on each use to prevent replay attacks

## Relations and Constraints

### Foreign Keys
- `Session.userId` → `User.id` (CASCADE on delete)
- `PasswordReset.userId` → `User.id` (CASCADE on delete)
- `EmailVerification.userId` → `User.id` (CASCADE on delete)

### Unique Constraints
- `User.email` - Ensures unique user emails
- `Role.name` - Ensures unique role names

## Best Practices

1. **Always create migrations**: Never modify the database manually
2. **Test migrations**: Test in development before applying to production
3. **Backup before migrate**: Always backup production database before migrations
4. **Version control**: Commit migration files to Git
5. **Descriptive names**: Use clear migration names for future reference

## Troubleshooting

### Migration Conflicts

If you encounter migration conflicts:

```bash
# Check migration status
npx prisma migrate status

# Resolve conflicts by marking as applied
npx prisma migrate resolve --applied <migration_name>

# Or rollback
npx prisma migrate resolve --rolled-back <migration_name>
```

### Connection Issues

1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running
3. Verify network connectivity
4. Check firewall rules

### Schema Drift

If schema and database are out of sync:

```bash
# Push schema to database (use with caution in production)
npx prisma db push

# Or create a new migration
npx prisma migrate dev
```

## Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Auth Service Architecture](../../../docs/architecture/auth-service.md)

## Support

For issues or questions:
1. Check the [troubleshooting guide](../../../docs/troubleshooting.md)
2. Review [architecture documentation](../../../docs/architecture/)
3. Contact the backend team

---

**Last Updated**: February 2026
**Maintained By**: Lomash Wood Backend Team