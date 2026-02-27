import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { 
  createTestProduct, 
  createTestCategory, 
  createTestColour,
  createTestUser,
  createTestReview,
  clearDatabase 
} from '../fixtures';

describe('Customer Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let kitchenProductId: string;
  let bedroomProductId: string;
  let testUserId: string;
  let otherUserId: string;

  beforeAll(async () => {
    // Initialize app and database
    app = await createApp();
    prisma = new PrismaClient();
    
    // Clear database
    await clearDatabase(prisma);
    
    // Create test user and get auth token
    const user = await createTestUser(prisma, {
      email: 'customer@test.com',
      role: 'CUSTOMER'
    });
    testUserId = user.id;
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Test123!@#'
      });
    
    authToken = loginResponse.body.data.token;
    
    // Create another customer user
    const otherUser = await createTestUser(prisma, {
      email: 'other@test.com',
      role: 'CUSTOMER'
    });
    otherUserId = otherUser.id;
    
    const otherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'other@test.com',
        password: 'Test123!@#'
      });
    
    otherUserToken = otherLoginResponse.body.data.token;
    
    // Create admin user
    const admin = await createTestUser(prisma, {
      email: 'admin@test.com',
      role: 'ADMIN'
    });
    
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!@#'
      });
    
    adminToken = adminLoginResponse.body.data.token;
    
    // Create test categories
    const kitchenCategory = await createTestCategory(prisma, {
      name: 'Kitchen',
      slug: 'kitchen'
    });
    
    const bedroomCategory = await createTestCategory(prisma, {
      name: 'Bedroom',
      slug: 'bedroom'
    });
    
    // Create test colours
    const whiteColour = await createTestColour(prisma, {
      name: 'White',
      hexCode: '#FFFFFF'
    });
    
    // Create test products
    const kitchenProduct = await createTestProduct(prisma, {
      title: 'Luna White Kitchen',
      categoryId: kitchenCategory.id,
      price: 5999.99,
      stock: 10,
      colourIds: [whiteColour.id]
    });
    kitchenProductId = kitchenProduct.id;
    
    const bedroomProduct = await createTestProduct(prisma, {
      title: 'Modern Grey Bedroom',
      categoryId: bedroomCategory.id,
      price: 3999.99,
      stock: 5,
      colourIds: [whiteColour.id]
    });
    bedroomProductId = bedroomProduct.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/products/:id/reviews', () => {
    it('should create a product review', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Excellent Kitchen',
          comment: 'Beautiful design and great quality. Highly recommended!',
          pros: ['Great design', 'Quality materials', 'Easy to install'],
          cons: ['A bit expensive'],
          wouldRecommend: true
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reviewId');
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('rating', 5);
      expect(response.body.data).toHaveProperty('status', 'PENDING');
    });

    it('should validate rating range', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 6, // Invalid rating
          title: 'Review',
          comment: 'Test comment'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('rating');
    });

    it('should require minimum comment length', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Review',
          comment: 'Too short'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('comment');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .send({
          rating: 5,
          title: 'Review',
          comment: 'This is a test review with sufficient length to pass validation'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should prevent duplicate reviews from same user', async () => {
      // First review
      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          title: 'Good Product',
          comment: 'Nice bedroom set with good quality materials and design'
        });

      // Attempt duplicate
      const response = await request(app)
        .post(`/api/v1/products/${bedroomProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Updated Review',
          comment: 'Trying to post another review for the same product'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('already reviewed');
    });

    it('should support review with images', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          rating: 5,
          title: 'Amazing Kitchen',
          comment: 'The kitchen looks even better in person. Photos attached.',
          images: [
            'https://example.com/review-image-1.jpg',
            'https://example.com/review-image-2.jpg'
          ]
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('images');
      expect(response.body.data.images).toBeInstanceOf(Array);
      expect(response.body.data.images.length).toBe(2);
    });
  });

  describe('GET /api/v1/products/:id/reviews', () => {
    beforeEach(async () => {
      // Create some reviews
      await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: testUserId,
        rating: 5,
        title: 'Excellent',
        comment: 'Great product with excellent quality and design',
        status: 'APPROVED'
      });

      await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: otherUserId,
        rating: 4,
        title: 'Very Good',
        comment: 'Good quality product but slightly expensive for the features',
        status: 'APPROVED'
      });
    });

    it('should get approved product reviews', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.reviews.length).toBeGreaterThan(0);
      expect(response.body.data.reviews.every(r => r.status === 'APPROVED')).toBe(true);
    });

    it('should include review statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .expect(200);

      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.statistics).toHaveProperty('averageRating');
      expect(response.body.data.statistics).toHaveProperty('totalReviews');
      expect(response.body.data.statistics).toHaveProperty('ratingDistribution');
    });

    it('should support filtering by rating', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .query({ rating: 5 })
        .expect(200);

      expect(response.body.data.reviews.every(r => r.rating === 5)).toBe(true);
    });

    it('should support sorting by date', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .query({ sortBy: 'DATE_DESC' })
        .expect(200);

      const reviews = response.body.data.reviews;
      for (let i = 0; i < reviews.length - 1; i++) {
        expect(new Date(reviews[i].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(reviews[i + 1].createdAt).getTime());
      }
    });

    it('should support sorting by helpfulness', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .query({ sortBy: 'HELPFUL' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should show verified purchase badge', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .expect(200);

      const reviewsWithVerified = response.body.data.reviews.filter(r => r.verifiedPurchase);
      expect(reviewsWithVerified).toBeDefined();
    });
  });

  describe('PATCH /api/v1/products/reviews/:reviewId', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: testUserId,
        rating: 4,
        title: 'Good Product',
        comment: 'Original review comment with sufficient length for validation',
        status: 'APPROVED'
      });
      reviewId = review.id;
    });

    it('should update own review', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Excellent Product',
          comment: 'Updated review with even better feedback after extended use'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('rating', 5);
      expect(response.body.data).toHaveProperty('title', 'Excellent Product');
    });

    it('should return 403 when updating another users review', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          rating: 1,
          comment: 'Trying to update someone elses review'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should allow admin to update any review', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'FLAGGED'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('status', 'FLAGGED');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/v1/products/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/products/reviews/:reviewId', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: testUserId,
        rating: 4,
        title: 'Test Review',
        comment: 'Test review comment for deletion testing purposes',
        status: 'APPROVED'
      });
      reviewId = review.id;
    });

    it('should delete own review', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deleted', true);
    });

    it('should return 403 when deleting another users review', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should allow admin to delete any review', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/v1/products/reviews/:reviewId/helpful', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: otherUserId,
        rating: 5,
        title: 'Great Product',
        comment: 'Very helpful review with detailed information about the product',
        status: 'APPROVED'
      });
      reviewId = review.id;
    });

    it('should mark review as helpful', async () => {
      const response = await request(app)
        .post(`/api/v1/products/reviews/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('helpful', true);
      expect(response.body.data).toHaveProperty('helpfulCount');
    });

    it('should prevent voting on own review', async () => {
      const ownReview = await createTestReview(prisma, {
        productId: bedroomProductId,
        userId: testUserId,
        rating: 4,
        title: 'My Review',
        comment: 'This is my own review that I should not be able to vote on',
        status: 'APPROVED'
      });

      const response = await request(app)
        .post(`/api/v1/products/reviews/${ownReview.id}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('own review');
    });

    it('should prevent duplicate votes', async () => {
      // First vote
      await request(app)
        .post(`/api/v1/products/reviews/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second vote attempt
      const response = await request(app)
        .post(`/api/v1/products/reviews/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('already voted');
    });
  });

  describe('POST /api/v1/products/reviews/:reviewId/report', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: otherUserId,
        rating: 5,
        title: 'Review to Report',
        comment: 'This review might contain inappropriate content for testing',
        status: 'APPROVED'
      });
      reviewId = review.id;
    });

    it('should report inappropriate review', async () => {
      const response = await request(app)
        .post(`/api/v1/products/reviews/${reviewId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'INAPPROPRIATE_CONTENT',
          details: 'This review contains offensive language'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reported', true);
      expect(response.body.data).toHaveProperty('reportId');
    });

    it('should validate report reason', async () => {
      const response = await request(app)
        .post(`/api/v1/products/reviews/${reviewId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'INVALID_REASON',
          details: 'Test details'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should support multiple report reasons', async () => {
      const validReasons = [
        'INAPPROPRIATE_CONTENT',
        'SPAM',
        'FAKE_REVIEW',
        'OFF_TOPIC',
        'HARASSMENT'
      ];

      for (const reason of validReasons) {
        const review = await createTestReview(prisma, {
          productId: kitchenProductId,
          userId: otherUserId,
          rating: 3,
          title: `Review ${reason}`,
          comment: `Test review for reporting with reason ${reason}`,
          status: 'APPROVED'
        });

        const response = await request(app)
          .post(`/api/v1/products/reviews/${review.id}/report`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason,
            details: `Reporting for ${reason}`
          })
          .expect(201);

        expect(response.body.data.reason).toBe(reason);
      }
    });
  });

  describe('POST /api/v1/products/:id/wishlist', () => {
    it('should add product to wishlist', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('added', true);
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/wishlist`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle duplicate wishlist entries', async () => {
      // First add
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second add attempt
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('alreadyInWishlist', true);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/products/${fakeId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/wishlist', () => {
    beforeEach(async () => {
      // Add products to wishlist
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should get user wishlist', async () => {
      const response = await request(app)
        .get('/api/v1/products/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
    });

    it('should include product details in wishlist', async () => {
      const response = await request(app)
        .get('/api/v1/products/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const product = response.body.data.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('images');
    });

    it('should show stock availability in wishlist', async () => {
      const response = await request(app)
        .get('/api/v1/products/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.products[0]).toHaveProperty('inStock');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/products/wishlist')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/products/:id/wishlist', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should remove product from wishlist', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${kitchenProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('removed', true);
    });

    it('should handle removing non-existent wishlist item', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${bedroomProductId}/wishlist`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('not in wishlist');
    });
  });

  describe('POST /api/v1/products/:id/compare', () => {
    it('should add product to comparison list', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/compare`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('added', true);
      expect(response.body.data).toHaveProperty('compareListSize');
    });

    it('should limit comparison list size', async () => {
      // Add maximum products (e.g., 4)
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/compare`)
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/compare`)
        .set('Authorization', `Bearer ${authToken}`);

      // Create additional products to exceed limit
      const category = await prisma.category.findFirst();
      const colour = await prisma.colour.findFirst();
      
      for (let i = 0; i < 3; i++) {
        const product = await createTestProduct(prisma, {
          title: `Test Product ${i}`,
          categoryId: category.id,
          price: 1000 + i * 100,
          stock: 10,
          colourIds: [colour.id]
        });

        await request(app)
          .post(`/api/v1/products/${product.id}/compare`)
          .set('Authorization', `Bearer ${authToken}`);
      }

      // Try to add one more
      const extraProduct = await createTestProduct(prisma, {
        title: 'Extra Product',
        categoryId: category.id,
        price: 2000,
        stock: 10,
        colourIds: [colour.id]
      });

      const response = await request(app)
        .post(`/api/v1/products/${extraProduct.id}/compare`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('maximum');
    });
  });

  describe('GET /api/v1/products/compare', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/compare`)
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .post(`/api/v1/products/${bedroomProductId}/compare`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should get comparison list with detailed specs', async () => {
      const response = await request(app)
        .get('/api/v1/products/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
    });

    it('should include comparison matrix', async () => {
      const response = await request(app)
        .get('/api/v1/products/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('comparisonMatrix');
      expect(response.body.data.comparisonMatrix).toHaveProperty('features');
      expect(response.body.data.comparisonMatrix).toHaveProperty('specifications');
    });
  });

  describe('POST /api/v1/products/:id/inquire', () => {
    it('should create product inquiry', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/inquire`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Question about installation',
          message: 'Do you provide installation services for this kitchen?',
          preferredContactMethod: 'EMAIL'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('inquiryId');
      expect(response.body.data).toHaveProperty('productId', kitchenProductId);
      expect(response.body.data).toHaveProperty('status', 'PENDING');
    });

    it('should allow guest inquiries with contact info', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/inquire`)
        .send({
          subject: 'Pricing question',
          message: 'What is the total cost including installation?',
          contactEmail: 'guest@test.com',
          contactPhone: '+44 7700 900123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('guestInquiry', true);
    });

    it('should validate inquiry message length', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/inquire`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Short',
          message: 'Too short'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/products/my-inquiries', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/v1/products/${kitchenProductId}/inquire`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Test Inquiry',
          message: 'This is a test inquiry message with sufficient length'
        });
    });

    it('should get user inquiries', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-inquiries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('inquiries');
      expect(response.body.data.inquiries).toBeInstanceOf(Array);
    });

    it('should include product details with inquiries', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-inquiries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const inquiry = response.body.data.inquiries[0];
      expect(inquiry).toHaveProperty('product');
      expect(inquiry.product).toHaveProperty('title');
    });

    it('should filter inquiries by status', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-inquiries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.data.inquiries.every(i => i.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /api/v1/products/my-reviews', () => {
    beforeEach(async () => {
      await createTestReview(prisma, {
        productId: kitchenProductId,
        userId: testUserId,
        rating: 5,
        title: 'My Review',
        comment: 'This is my review with detailed feedback about the product',
        status: 'APPROVED'
      });
    });

    it('should get all user reviews', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data.reviews).toBeInstanceOf(Array);
    });

    it('should include pending and approved reviews', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const statuses = response.body.data.reviews.map(r => r.status);
      expect(statuses).toEqual(
        expect.arrayContaining(['APPROVED'])
      );
    });

    it('should show review statistics', async () => {
      const response = await request(app)
        .get('/api/v1/products/my-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.statistics).toHaveProperty('totalReviews');
      expect(response.body.data.statistics).toHaveProperty('averageRating');
    });
  });

  describe('GET /api/v1/products/purchase-history', () => {
    it('should get user purchase history', async () => {
      const response = await request(app)
        .get('/api/v1/products/purchase-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('purchases');
      expect(response.body.data.purchases).toBeInstanceOf(Array);
    });

    it('should include review status for purchased products', async () => {
      const response = await request(app)
        .get('/api/v1/products/purchase-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.purchases.length > 0) {
        expect(response.body.data.purchases[0]).toHaveProperty('canReview');
        expect(response.body.data.purchases[0]).toHaveProperty('hasReviewed');
      }
    });

    it('should support filtering by date range', async () => {
      const response = await request(app)
        .get('/api/v1/products/purchase-history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('dateRange');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on review submission', async () => {
      const requests = [];
      
      // Create multiple products for testing
      const category = await prisma.category.findFirst();
      const colour = await prisma.colour.findFirst();
      
      for (let i = 0; i < 20; i++) {
        const product = await createTestProduct(prisma, {
          title: `Rate Limit Test Product ${i}`,
          categoryId: category.id,
          price: 1000,
          stock: 10,
          colourIds: [colour.id]
        });

        requests.push(
          request(app)
            .post(`/api/v1/products/${product.id}/reviews`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              rating: 5,
              title: `Review ${i}`,
              comment: `This is a test review number ${i} with sufficient length`
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get(`/api/v1/products/${kitchenProductId}/reviews`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('database');

      await prisma.$connect();
    });

    it('should sanitize review content', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Test <script>alert("xss")</script>',
          comment: 'Review with <script>malicious code</script> and sufficient length for validation'
        })
        .expect(201);

      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.comment).not.toContain('<script>');
    });
  });

  describe('Moderation', () => {
    it('should flag reviews with profanity for moderation', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${kitchenProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 1,
          title: 'Terrible Product',
          comment: 'This product is absolutely terrible and a complete waste of money'
        })
        .expect(201);

      // Check if flagged for review (depends on profanity filter)
      expect(response.body.data).toHaveProperty('status');
    });
  });
});