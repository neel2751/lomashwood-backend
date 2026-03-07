import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

interface Review {
  id: string;
  productId: string;
  customerId: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

interface CreateReviewRequest {
  productId: string;
  customerId: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  [key: string]: any;
}

interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  [key: string]: any;
}

interface ReviewFilters {
  productId?: string;
  customerId?: string;
  rating?: number;
  verified?: boolean;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class ReviewService {
  constructor(private HttpClient: HttpClient) {}

  async getReviews(params?: ReviewFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Review[]>> {
    return this.HttpClient.get<PaginatedResponse<Review[]>>('/reviews', { params });
  }

  async getReview(reviewId: string): Promise<Review> {
    return this.HttpClient.get<Review>(`/reviews/${reviewId}`);
  }

  async createReview(reviewData: CreateReviewRequest): Promise<Review> {
    return this.HttpClient.post<Review>('/reviews', reviewData);
  }

  async updateReview(reviewId: string, updateData: UpdateReviewRequest): Promise<Review> {
    return this.HttpClient.put<Review>(`/reviews/${reviewId}`, updateData);
  }

  async deleteReview(reviewId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/reviews/${reviewId}`);
  }

  async getProductReviews(productId: string, params?: {
    page?: number;
    limit?: number;
    rating?: number;
    verified?: boolean;
    sortBy?: 'date' | 'rating' | 'helpful';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Review[]>> {
    return this.HttpClient.get<PaginatedResponse<Review[]>>(`/reviews/product/${productId}`, { params });
  }

  async getProductReviewSummary(productId: string): Promise<{
    productId: string;
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    verifiedReviews: number;
    averageRatingByPeriod: {
      lastMonth: number;
      lastQuarter: number;
      lastYear: number;
    };
    topPros: Array<{
      text: string;
      count: number;
    }>;
    topCons: Array<{
      text: string;
      count: number;
    }>;
    recentReviews: Array<{
      id: string;
      rating: number;
      title: string;
      content: string;
      customerName: string;
      verified: boolean;
      createdAt: string;
    }>;
  }> {
    return this.HttpClient.get<any>(`/reviews/product/${productId}/summary`);
  }

  async getCustomerReviews(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Review[]>> {
    return this.HttpClient.get<PaginatedResponse<Review[]>>(`/reviews/customer/${customerId}`, { params });
  }

  async createCustomerReview(customerId: string, reviewData: {
    productId: string;
    orderId?: string;
    rating: number;
    title: string;
    content: string;
    images?: File[];
    pros?: string[];
    cons?: string[];
    verified?: boolean;
  }): Promise<Review> {
    const formData = new FormData();
    formData.append('productId', reviewData.productId);
    formData.append('rating', reviewData.rating.toString());
    formData.append('title', reviewData.title);
    formData.append('content', reviewData.content);

    if (reviewData.orderId) {
      formData.append('orderId', reviewData.orderId);
    }

    if (reviewData.pros) {
      formData.append('pros', JSON.stringify(reviewData.pros));
    }

    if (reviewData.cons) {
      formData.append('cons', JSON.stringify(reviewData.cons));
    }

    if (reviewData.images) {
      reviewData.images.forEach((image, index) => {
        formData.append(`images_${index}`, image);
      });
    }

    return this.HttpClient.post<Review>(`/reviews/customer/${customerId}`, formData);
  }

  async getPendingReviews(params?: {
    page?: number;
    limit?: number;
    type?: 'FLAGGED' | 'REPORTED' | 'NEW';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    productId: string;
    productName: string;
    customerId: string;
    customerName: string;
    rating: number;
    title: string;
    content: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    flags: Array<{
      type: string;
      reason: string;
      reportedBy: string;
      reportedAt: string;
    }>;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/reviews/moderation/pending', { params });
  }

  async approveReview(reviewId: string, moderatorNotes?: string): Promise<Review> {
    return this.HttpClient.post<Review>(`/reviews/${reviewId}/approve`, { moderatorNotes });
  }

  async rejectReview(reviewId: string, reason: string, moderatorNotes?: string): Promise<Review> {
    return this.HttpClient.post<Review>(`/reviews/${reviewId}/reject`, { reason, moderatorNotes });
  }

  async flagReview(reviewId: string, flagData: {
    reason: string;
    description?: string;
    reporterId?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/reviews/${reviewId}/flag`, flagData);
  }

  async unflagReview(reviewId: string): Promise<void> {
    return this.HttpClient.post<void>(`/reviews/${reviewId}/unflag`);
  }

  async getReviewResponses(reviewId: string): Promise<Array<{
    id: string;
    reviewId: string;
    responderId: string;
    responderName: string;
    responderType: 'CUSTOMER' | 'BUSINESS' | 'MODERATOR';
    content: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt?: string;
  }>> {
    return this.HttpClient.get<any[]>(`/reviews/${reviewId}/responses`);
  }

  async addReviewResponse(reviewId: string, responseData: {
    content: string;
    isPublic?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/reviews/${reviewId}/responses`, responseData);
  }

  async updateReviewResponse(reviewId: string, responseId: string, updateData: {
    content?: string;
    isPublic?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/reviews/${reviewId}/responses/${responseId}`, updateData);
  }

  async deleteReviewResponse(reviewId: string, responseId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/reviews/${reviewId}/responses/${responseId}`);
  }

  async voteReview(reviewId: string, voteData: {
    helpful: boolean;
    customerId?: string;
  }): Promise<{
    reviewId: string;
    helpfulVotes: number;
    totalVotes: number;
    userVote?: boolean;
  }> {
    return this.HttpClient.post<any>(`/reviews/${reviewId}/vote`, voteData);
  }

  async getReviewVotes(reviewId: string): Promise<{
    helpfulVotes: number;
    notHelpfulVotes: number;
    totalVotes: number;
    userVote?: boolean;
  }> {
    return this.HttpClient.get<any>(`/reviews/${reviewId}/votes`);
  }

  async getReviewAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    categoryId?: string;
  }): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    verifiedReviews: number;
    reviewTrends: Array<{
      date: string;
      reviews: number;
      averageRating: number;
    }>;
    topRatedProducts: Array<{
      productId: string;
      productName: string;
      reviews: number;
      averageRating: number;
    }>;
    lowRatedProducts: Array<{
      productId: string;
      productName: string;
      reviews: number;
      averageRating: number;
    }>;
    reviewVolume: Array<{
      period: string;
      count: number;
      growth: number;
    }>;
    customerSatisfaction: {
      overall: number;
      byPeriod: Record<string, number>;
    };
    commonThemes: {
      positive: Array<{
        theme: string;
        count: number;
        sentiment: number;
      }>;
      negative: Array<{
        theme: string;
        count: number;
        sentiment: number;
      }>;
    };
  }> {
    return this.HttpClient.get<any>('/reviews/analytics', { params });
  }

  async getProductReviewAnalytics(productId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    productId: string;
    productName: string;
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    verifiedReviews: number;
    reviewTrends: Array<{
      date: string;
      reviews: number;
      averageRating: number;
    }>;
    customerSatisfaction: {
      overall: number;
      byPeriod: Record<string, number>;
    };
    commonThemes: {
      positive: Array<{
        theme: string;
        count: number;
        sentiment: number;
      }>;
      negative: Array<{
        theme: string;
        count: number;
        sentiment: number;
      }>;
    };
    competitorComparison?: {
      industryAverage: number;
      topCompetitor: number;
      ranking: number;
    };
  }> {
    return this.HttpClient.get<any>(`/reviews/analytics/product/${productId}`, { params });
  }

  async getReviewInsights(productId: string, params?: {
    type?: 'SENTIMENT' | 'KEYWORDS' | 'TRENDS' | 'COMPARISON';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    productId: string;
    insights: {
      sentiment: {
        overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        score: number;
        distribution: {
          positive: number;
          neutral: number;
          negative: number;
        };
      };
      keywords: Array<{
        word: string;
        frequency: number;
        sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        context: string[];
      }>;
      trends: Array<{
        date: string;
        sentiment: number;
        volume: number;
        keyTopics: string[];
      }>;
      comparison?: {
        vsPreviousPeriod: {
          sentimentChange: number;
          volumeChange: number;
          ratingChange: number;
        };
        vsCompetitors: {
          avgRating: number;
          avgSentiment: number;
          reviewVolume: number;
        };
      };
    };
    recommendations: Array<{
      type: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
      actionItems: string[];
    }>;
  }> {
    return this.HttpClient.get<any>(`/reviews/insights/${productId}`, { params });
  }

  async exportReviews(params?: {
    format?: 'csv' | 'excel' | 'json';
    productId?: string;
    categoryId?: string;
    rating?: number;
    verified?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/reviews/export', {
      params,
      responseType: 'blob',
    });
  }

  async importReviews(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateProducts?: boolean;
    validateCustomers?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.HttpClient.post<any>('/reviews/import', formData);
  }

  async searchReviews(query: string, params?: {
    page?: number;
    limit?: number;
    productId?: string;
    rating?: number;
    verified?: boolean;
    hasResponse?: boolean;
  }): Promise<PaginatedResponse<Review[]>> {
    return this.HttpClient.get<PaginatedResponse<Review[]>>('/reviews/search', {
      params: { q: query, ...params },
    });
  }

  async getReviewSettings(): Promise<{
    moderation: {
      autoApprove: boolean;
      requireVerification: boolean;
      flagThreshold: number;
      flaggedReviewAction: 'HIDE' | 'REVIEW' | 'REJECT';
    };
    display: {
      showVerifiedBadge: boolean;
      showHelpfulVotes: boolean;
      allowImages: boolean;
      maxImages: number;
      minContentLength: number;
      maxContentLength: number;
    };
    notifications: {
      newReviewNotification: boolean;
      flaggedReviewNotification: boolean;
      responseNotification: boolean;
    };
    incentives: {
      enableReviewIncentives: boolean;
      incentiveType: 'DISCOUNT' | 'POINTS' | 'LOYALTY';
      incentiveValue: number;
      verificationRequired: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/reviews/settings');
  }

  async updateReviewSettings(settings: {
    moderation?: {
      autoApprove?: boolean;
      requireVerification?: boolean;
      flagThreshold?: number;
      flaggedReviewAction?: 'HIDE' | 'REVIEW' | 'REJECT';
    };
    display?: {
      showVerifiedBadge?: boolean;
      showHelpfulVotes?: boolean;
      allowImages?: boolean;
      maxImages?: number;
      minContentLength?: number;
      maxContentLength?: number;
    };
    notifications?: {
      newReviewNotification?: boolean;
      flaggedReviewNotification?: boolean;
      responseNotification?: boolean;
    };
    incentives?: {
      enableReviewIncentives?: boolean;
      incentiveType?: 'DISCOUNT' | 'POINTS' | 'LOYALTY';
      incentiveValue?: number;
      verificationRequired?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/reviews/settings', settings);
  }

  async verifyReview(reviewId: string, verificationData: {
    orderId: string;
    proofOfPurchase?: File;
    additionalInfo?: string;
  }): Promise<Review> {
    const formData = new FormData();
    formData.append('orderId', verificationData.orderId);

    if (verificationData.additionalInfo) {
      formData.append('additionalInfo', verificationData.additionalInfo);
    }

    if (verificationData.proofOfPurchase) {
      formData.append('proofOfPurchase', verificationData.proofOfPurchase);
    }

    return this.HttpClient.post<Review>(`/reviews/${reviewId}/verify`, formData);
  }

  async getVerificationRequests(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    reviewId: string;
    customerId: string;
    customerName: string;
    orderId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    notes?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/reviews/verification/requests', { params });
  }

  async approveVerification(requestId: string, notes?: string): Promise<void> {
    return this.HttpClient.post<void>(`/reviews/verification/${requestId}/approve`, { notes });
  }

  async rejectVerification(requestId: string, reason: string, notes?: string): Promise<void> {
    return this.HttpClient.post<void>(`/reviews/verification/${requestId}/reject`, { reason, notes });
  }
}