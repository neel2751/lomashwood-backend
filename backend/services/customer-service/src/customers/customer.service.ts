import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, PaginatedResponse } from '../../../../../packages/api-client/src/types/api.types';

interface Customer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  preferences: any;
  addresses: any[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tags: string[];
  notes?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Review {
  id: string;
  customerId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  helpful: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  category: 'GENERAL' | 'ORDER' | 'PRODUCT' | 'DELIVERY' | 'PAYMENT' | 'TECHNICAL' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'WAITING_VENDOR' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  attachments?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Wishlist {
  id: string;
  customerId: string;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: Date;
}

interface GetCustomersParams {
  page: number;
  limit: number;
  filters: {
    search?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetReviewsParams {
  page: number;
  limit: number;
  filters: {
    customerId?: string;
    productId?: string;
    rating?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetSupportTicketsParams {
  page: number;
  limit: number;
  filters: {
    customerId?: string;
    status?: string;
    priority?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export class CustomerService {
  private customers: Customer[] = [];
  private reviews: Review[] = [];
  private supportTickets: SupportTicket[] = [];
  private wishlists: Wishlist[] = [];

  constructor() {
    this.initializeMockData();
  }

  async getCustomers(params: GetCustomersParams): Promise<PaginatedResponse<Customer[]>> {
    try {
      let filteredCustomers = [...this.customers];

      // Apply search filter
      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c =>
          c.firstName.toLowerCase().includes(searchTerm) ||
          c.lastName.toLowerCase().includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm) ||
          c.phone?.includes(searchTerm)
        );
      }

      // Apply status filter
      if (params.filters.status) {
        filteredCustomers = filteredCustomers.filter(c => c.status === params.filters.status);
      }

      // Apply date range filter
      if (params.filters.startDate) {
        filteredCustomers = filteredCustomers.filter(c => c.createdAt >= params.filters.startDate!);
      }

      if (params.filters.endDate) {
        filteredCustomers = filteredCustomers.filter(c => c.createdAt <= params.filters.endDate!);
      }

      // Sort customers
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredCustomers.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Customer];
        let bValue: any = b[sortBy as keyof Customer];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredCustomers.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedCustomers,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get customers error:', error);
      return {
        success: false,
        message: 'Failed to fetch customers',
        error: 'GET_CUSTOMERS_FAILED',
      };
    }
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    try {
      const customer = this.customers.find(c => c.id === id);
      
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
          error: 'CUSTOMER_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      console.error('Get customer error:', error);
      return {
        success: false,
        message: 'Failed to fetch customer',
        error: 'GET_CUSTOMER_FAILED',
      };
    }
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    try {
      // Check if customer with same email already exists
      const existingCustomer = this.customers.find(c => c.email === customerData.email);
      if (existingCustomer) {
        return {
          success: false,
          message: 'Customer with this email already exists',
          error: 'CUSTOMER_ALREADY_EXISTS',
        };
      }

      const customer: Customer = {
        id: uuidv4(),
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.customers.push(customer);

      // Create empty wishlist for the customer
      const wishlist: Wishlist = {
        id: uuidv4(),
        customerId: customer.id,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.wishlists.push(wishlist);

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      console.error('Create customer error:', error);
      return {
        success: false,
        message: 'Failed to create customer',
        error: 'CREATE_CUSTOMER_FAILED',
      };
    }
  }

  async updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Customer>> {
    try {
      const customerIndex = this.customers.findIndex(c => c.id === id);
      
      if (customerIndex === -1) {
        return {
          success: false,
          message: 'Customer not found',
          error: 'CUSTOMER_NOT_FOUND',
        };
      }

      const updatedCustomer: Customer = {
        ...this.customers[customerIndex],
        ...customerData,
        updatedAt: new Date(),
      };

      this.customers[customerIndex] = updatedCustomer;

      return {
        success: true,
        data: updatedCustomer,
      };
    } catch (error) {
      console.error('Update customer error:', error);
      return {
        success: false,
        message: 'Failed to update customer',
        error: 'UPDATE_CUSTOMER_FAILED',
      };
    }
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      const customerIndex = this.customers.findIndex(c => c.id === id);
      
      if (customerIndex === -1) {
        return {
          success: false,
          message: 'Customer not found',
          error: 'CUSTOMER_NOT_FOUND',
        };
      }

      this.customers.splice(customerIndex, 1);

      // Also delete related data
      this.reviews = this.reviews.filter(r => r.customerId !== id);
      this.supportTickets = this.supportTickets.filter(t => t.customerId !== id);
      this.wishlists = this.wishlists.filter(w => w.customerId !== id);

      return {
        success: true,
        message: 'Customer deleted successfully',
      };
    } catch (error) {
      console.error('Delete customer error:', error);
      return {
        success: false,
        message: 'Failed to delete customer',
        error: 'DELETE_CUSTOMER_FAILED',
      };
    }
  }

  async getReviews(params: GetReviewsParams): Promise<PaginatedResponse<Review[]>> {
    try {
      let filteredReviews = [...this.reviews];

      // Apply filters
      if (params.filters.customerId) {
        filteredReviews = filteredReviews.filter(r => r.customerId === params.filters.customerId);
      }

      if (params.filters.productId) {
        filteredReviews = filteredReviews.filter(r => r.productId === params.filters.productId);
      }

      if (params.filters.rating) {
        filteredReviews = filteredReviews.filter(r => r.rating === params.filters.rating);
      }

      if (params.filters.status) {
        filteredReviews = filteredReviews.filter(r => r.status === params.filters.status);
      }

      // Sort reviews
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredReviews.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Review];
        let bValue: any = b[sortBy as keyof Review];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredReviews.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedReviews,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get reviews error:', error);
      return {
        success: false,
        message: 'Failed to fetch reviews',
        error: 'GET_REVIEWS_FAILED',
      };
    }
  }

  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpful'>): Promise<ApiResponse<Review>> {
    try {
      const review: Review = {
        id: uuidv4(),
        ...reviewData,
        helpful: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.reviews.push(review);

      return {
        success: true,
        data: review,
      };
    } catch (error) {
      console.error('Create review error:', error);
      return {
        success: false,
        message: 'Failed to create review',
        error: 'CREATE_REVIEW_FAILED',
      };
    }
  }

  async getSupportTickets(params: GetSupportTicketsParams): Promise<PaginatedResponse<SupportTicket[]>> {
    try {
      let filteredTickets = [...this.supportTickets];

      // Apply filters
      if (params.filters.customerId) {
        filteredTickets = filteredTickets.filter(t => t.customerId === params.filters.customerId);
      }

      if (params.filters.status) {
        filteredTickets = filteredTickets.filter(t => t.status === params.filters.status);
      }

      if (params.filters.priority) {
        filteredTickets = filteredTickets.filter(t => t.priority === params.filters.priority);
      }

      if (params.filters.category) {
        filteredTickets = filteredTickets.filter(t => t.category === params.filters.category);
      }

      // Sort tickets
      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';
      
      filteredTickets.sort((a, b) => {
        let aValue: any = a[sortBy as keyof SupportTicket];
        let bValue: any = b[sortBy as keyof SupportTicket];
        
        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Pagination
      const total = filteredTickets.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedTickets,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get support tickets error:', error);
      return {
        success: false,
        message: 'Failed to fetch support tickets',
        error: 'GET_SUPPORT_TICKETS_FAILED',
      };
    }
  }

  async createSupportTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<SupportTicket>> {
    try {
      const ticket: SupportTicket = {
        id: uuidv4(),
        ...ticketData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.supportTickets.push(ticket);

      return {
        success: true,
        data: ticket,
      };
    } catch (error) {
      console.error('Create support ticket error:', error);
      return {
        success: false,
        message: 'Failed to create support ticket',
        error: 'CREATE_SUPPORT_TICKET_FAILED',
      };
    }
  }

  async getWishlist(customerId: string): Promise<ApiResponse<Wishlist>> {
    try {
      const wishlist = this.wishlists.find(w => w.customerId === customerId);
      
      if (!wishlist) {
        return {
          success: false,
          message: 'Wishlist not found',
          error: 'WISHLIST_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: wishlist,
      };
    } catch (error) {
      console.error('Get wishlist error:', error);
      return {
        success: false,
        message: 'Failed to fetch wishlist',
        error: 'GET_WISHLIST_FAILED',
      };
    }
  }

  async addToWishlist(customerId: string, productId: string): Promise<ApiResponse<Wishlist>> {
    try {
      let wishlist = this.wishlists.find(w => w.customerId === customerId);
      
      if (!wishlist) {
        // Create new wishlist if it doesn't exist
        wishlist = {
          id: uuidv4(),
          customerId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.wishlists.push(wishlist);
      }

      // Check if product is already in wishlist
      const existingItem = wishlist.items.find(item => item.productId === productId);
      if (existingItem) {
        return {
          success: false,
          message: 'Product is already in wishlist',
          error: 'PRODUCT_ALREADY_IN_WISHLIST',
        };
      }

      // Add product to wishlist (mock product data)
      const wishlistItem: WishlistItem = {
        id: uuidv4(),
        productId,
        productName: `Product ${productId}`,
        productImage: `/images/products/${productId}.jpg`,
        price: 999.99,
        addedAt: new Date(),
      };

      wishlist.items.push(wishlistItem);
      wishlist.updatedAt = new Date();

      return {
        success: true,
        data: wishlist,
      };
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return {
        success: false,
        message: 'Failed to add to wishlist',
        error: 'ADD_TO_WISHLIST_FAILED',
      };
    }
  }

  async removeFromWishlist(customerId: string, productId: string): Promise<ApiResponse<Wishlist>> {
    try {
      const wishlist = this.wishlists.find(w => w.customerId === customerId);
      
      if (!wishlist) {
        return {
          success: false,
          message: 'Wishlist not found',
          error: 'WISHLIST_NOT_FOUND',
        };
      }

      const itemIndex = wishlist.items.findIndex(item => item.productId === productId);
      
      if (itemIndex === -1) {
        return {
          success: false,
          message: 'Product not found in wishlist',
          error: 'PRODUCT_NOT_IN_WISHLIST',
        };
      }

      wishlist.items.splice(itemIndex, 1);
      wishlist.updatedAt = new Date();

      return {
        success: true,
        data: wishlist,
      };
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return {
        success: false,
        message: 'Failed to remove from wishlist',
        error: 'REMOVE_FROM_WISHLIST_FAILED',
      };
    }
  }

  private initializeMockData(): void {
    // Initialize mock customers
    this.customers = [
      {
        id: uuidv4(),
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+44 20 7123 4567',
        avatar: '/images/customers/john.jpg',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'MALE',
        preferences: {
          newsletter: true,
          smsNotifications: false,
          preferredLanguage: 'en',
        },
        addresses: [
          {
            type: 'HOME',
            street: '123 Main St',
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'UK',
            isDefault: true,
          },
        ],
        status: 'ACTIVE',
        tags: ['VIP', 'REPEAT_CUSTOMER'],
        notes: 'High-value customer, prefers premium products',
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock reviews
    this.reviews = [
      {
        id: uuidv4(),
        customerId: this.customers[0].id,
        productId: 'product-1',
        orderId: 'order-1',
        rating: 5,
        title: 'Excellent Quality',
        content: 'The kitchen cabinets are absolutely beautiful! Perfect fit and great quality.',
        images: ['/images/reviews/kitchen-1.jpg'],
        helpful: 12,
        status: 'APPROVED',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock support tickets
    this.supportTickets = [
      {
        id: uuidv4(),
        customerId: this.customers[0].id,
        subject: 'Delivery Issue',
        description: 'My order was delivered to the wrong address.',
        category: 'DELIVERY',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedTo: 'support-1',
        tags: ['URGENT', 'DELIVERY'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize mock wishlists
    this.wishlists = [
      {
        id: uuidv4(),
        customerId: this.customers[0].id,
        items: [
          {
            id: uuidv4(),
            productId: 'product-2',
            productName: 'Modern Bedroom Set',
            productImage: '/images/products/bedroom-1.jpg',
            price: 1899.99,
            addedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
