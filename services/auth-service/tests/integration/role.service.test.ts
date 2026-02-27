import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import * as bcrypt from 'bcrypt';

const db = prisma as unknown as Record<string, any>;

async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}) {
  const hashed = await bcrypt.hash(data.password ?? 'Password123!', 10);
  return db['user'].create({
    data: {
      email: data.email,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? '+1234567890',
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? true,
    },
  });
}

async function assignRole(userId: string, roleId: string) {
  return db['userRole'].create({
    data: { userId, roleId, assignedBy: 'test-setup' },
  });
}

async function createRole(data: { name: string; description: string }) {
  return db['role'].create({
    data: { name: data.name, description: data.description, isDefault: false, isActive: true },
  });
}

describe('Role Routes Integration Tests', () => {
  let app: Application;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = createApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await db['userRole'].deleteMany().catch(() => {});
    await db['session'].deleteMany();
    await db['user'].deleteMany();
    await db['role'].deleteMany();

    const adminRole = await createRole({ name: 'ADMIN', description: 'Administrator role' });
    const userRole  = await createRole({ name: 'USER',  description: 'Regular user role'  });

    const adminUser   = await createUser({ email: 'admin@example.com', firstName: 'Admin',   lastName: 'User' });
    const regularUser = await createUser({ email: 'user@example.com',  firstName: 'Regular', lastName: 'User', phone: '+1234567891' });

    await assignRole(adminUser.id,   adminRole.id);
    await assignRole(regularUser.id, userRole.id);

    const adminLoginResponse = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLoginResponse.body.data.token;

    const userLoginResponse = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });
    userToken = userLoginResponse.body.data.token;
  });

  describe('POST /v1/roles', () => {
    it('should create a new role as admin', async () => {
      const roleData = { name: 'EDITOR', description: 'Content editor role', permissions: ['read:all', 'write:content'] };

      const response = await request(app)
        .post('/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.role.name).toBe('EDITOR');
      expect(response.body.data.role.description).toBe('Content editor role');

      const createdRole = await db['role'].findUnique({ where: { name: 'EDITOR' } });
      expect(createdRole).toBeTruthy();
    });

    it('should fail to create role without admin privileges', async () => {
      const response = await request(app)
        .post('/v1/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'EDITOR', description: 'Content editor role', permissions: ['read:all', 'write:content'] })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('permission');
    });

    it('should fail to create role with duplicate name', async () => {
      const response = await request(app)
        .post('/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ADMIN', description: 'Another admin role', permissions: ['read:all'] })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should fail with invalid role data', async () => {
      const response = await request(app)
        .post('/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', description: 'Invalid role', permissions: [] })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/v1/roles')
        .send({ name: 'EDITOR', description: 'Content editor role', permissions: ['read:all'] })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate permissions array', async () => {
      const response = await request(app)
        .post('/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'INVALID', description: 'Invalid permissions', permissions: 'not-an-array' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /v1/roles', () => {
    it('should get all roles as admin', async () => {
      const response = await request(app)
        .get('/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data.roles)).toBe(true);
      expect(response.body.data.roles.length).toBeGreaterThanOrEqual(2);
    });

    it('should get all roles as regular user', async () => {
      const response = await request(app)
        .get('/v1/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('roles');
    });

    it('should paginate roles correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await createRole({ name: `ROLE_${i}`, description: `Test role ${i}` });
      }

      const response = await request(app)
        .get('/v1/roles?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
      expect(response.body.data.roles.length).toBeLessThanOrEqual(3);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/v1/roles').expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return roles with correct structure', async () => {
      const response = await request(app)
        .get('/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const role = response.body.data.roles[0];
      expect(role).toHaveProperty('id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('description');
      expect(role).toHaveProperty('createdAt');
      expect(role).toHaveProperty('updatedAt');
    });
  });

  describe('GET /v1/roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await db['role'].findUnique({ where: { name: 'ADMIN' } });
      roleId = role.id;
    });

    it('should get role by id as admin', async () => {
      const response = await request(app)
        .get(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.role.id).toBe(roleId);
      expect(response.body.data.role.name).toBe('ADMIN');
    });

    it('should get role by id as regular user', async () => {
      const response = await request(app)
        .get(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail with non-existent role id', async () => {
      const response = await request(app)
        .get('/v1/roles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get(`/v1/roles/${roleId}`).expect(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /v1/roles/name/:name', () => {
    it('should get role by name as admin', async () => {
      const response = await request(app)
        .get('/v1/roles/name/ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.role.name).toBe('ADMIN');
    });

    it('should fail with non-existent role name', async () => {
      const response = await request(app)
        .get('/v1/roles/name/NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/v1/roles/name/ADMIN').expect(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /v1/roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await createRole({ name: 'MODERATOR', description: 'Moderator role' });
      roleId = role.id;
    });

    it('should update role as admin', async () => {
      const response = await request(app)
        .patch(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated moderator role', permissions: ['read:all', 'write:moderate', 'delete:spam'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.role.description).toBe('Updated moderator role');

      const updatedRole = await db['role'].findUnique({ where: { id: roleId } });
      expect(updatedRole?.description).toBe('Updated moderator role');
    });

    it('should fail to update role without admin privileges', async () => {
      const response = await request(app)
        .patch(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Updated description' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to update non-existent role', async () => {
      const response = await request(app)
        .patch('/v1/roles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/v1/roles/${roleId}`)
        .send({ description: 'Updated description' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should perform partial update', async () => {
      const response = await request(app)
        .patch(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Only description updated' })
        .expect(200);

      expect(response.body.data.role.description).toBe('Only description updated');
      expect(response.body.data.role.name).toBe('MODERATOR');
    });

    it('should prevent updating role name', async () => {
      const response = await request(app)
        .patch(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CHANGED_NAME', description: 'Updated description' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('cannot be changed');
    });
  });

  describe('DELETE /v1/roles/:id', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await createRole({ name: 'TEMPORARY', description: 'Temporary role' });
      roleId = role.id;
    });

    it('should delete role as admin', async () => {
      const response = await request(app)
        .delete(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('deleted');

      const deletedRole = await db['role'].findUnique({ where: { id: roleId } });
      expect(deletedRole).toBeNull();
    });

    it('should fail to delete role without admin privileges', async () => {
      const response = await request(app)
        .delete(`/v1/roles/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to delete system roles', async () => {
      const adminRole = await db['role'].findUnique({ where: { name: 'ADMIN' } });

      const response = await request(app)
        .delete(`/v1/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('system role');
    });

    it('should fail to delete role with assigned users', async () => {
      const role = await createRole({ name: 'ASSIGNED', description: 'Role with users' });

      const assignedUser = await createUser({
        email: 'assigned@example.com',
        firstName: 'Assigned',
        lastName: 'User',
        phone: '+1234567892',
      });
      await assignRole(assignedUser.id, role.id);

      const response = await request(app)
        .delete(`/v1/roles/${role.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('assigned users');
    });

    it('should fail to delete non-existent role', async () => {
      const response = await request(app)
        .delete('/v1/roles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).delete(`/v1/roles/${roleId}`).expect(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ── POST /v1/roles/:id/permissions ──────────────────────────────────────────
  describe('POST /v1/roles/:id/permissions', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await createRole({ name: 'CUSTOM', description: 'Custom role' });
      roleId = role.id;
    });

    it('should assign permissions to role as admin', async () => {
      const response = await request(app)
        .post(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['write:own', 'delete:own'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail without admin privileges', async () => {
      const response = await request(app)
        .post(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ permissions: ['write:own'] })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle duplicate permissions', async () => {
      const response = await request(app)
        .post(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['read:own', 'write:own'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail with invalid permissions data', async () => {
      const response = await request(app)
        .post(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: 'not-an-array' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ── DELETE /v1/roles/:id/permissions ────────────────────────────────────────
  describe('DELETE /v1/roles/:id/permissions', () => {
    let roleId: string;

    beforeEach(async () => {
      const role = await createRole({ name: 'FULL_ACCESS', description: 'Full access role' });
      roleId = role.id;
    });

    it('should remove permissions from role as admin', async () => {
      const response = await request(app)
        .delete(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['write:all', 'delete:all'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail without admin privileges', async () => {
      const response = await request(app)
        .delete(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ permissions: ['write:all'] })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle removal of non-existent permissions', async () => {
      const response = await request(app)
        .delete(`/v1/roles/${roleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['non:existent'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ── GET /v1/roles/:id/check-permission ──────────────────────────────────────
  describe('GET /v1/roles/:id/check-permission', () => {
    let adminRoleId: string;
    let userRoleId: string;

    beforeEach(async () => {
      const adminRole = await db['role'].findUnique({ where: { name: 'ADMIN' } });
      const userRole  = await db['role'].findUnique({ where: { name: 'USER'  } });
      adminRoleId = adminRole.id;
      userRoleId  = userRole.id;
    });

    it('should check if role has permission', async () => {
      const response = await request(app)
        .get(`/v1/roles/${adminRoleId}/check-permission?permission=read:all`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', true);
    });

    it('should return false for non-existent permission', async () => {
      const response = await request(app)
        .get(`/v1/roles/${userRoleId}/check-permission?permission=delete:all`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', false);
    });

    it('should fail without permission parameter', async () => {
      const response = await request(app)
        .get(`/v1/roles/${adminRoleId}/check-permission`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});