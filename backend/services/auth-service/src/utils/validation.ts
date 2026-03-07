import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must only contain alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  phone: Joi.string().pattern(new RegExp('^\\+?[1-9]\\d{1,14}$')).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  department: Joi.string().valid('sales', 'marketing', 'operations', 'finance', 'it', 'hr').optional(),
  location: Joi.string().max(100).optional(),
  roleId: Joi.string().optional(),
  securityQuestions: Joi.array().items(
    Joi.object({
      question: Joi.string().required(),
      answer: Joi.string().min(2).required()
    })
  ).min(2).max(2).optional().messages({
    'array.min': 'Please provide at least 2 security questions',
    'array.max': 'Please provide no more than 2 security questions'
  }),
  permissions: Joi.object({
    read: Joi.boolean().default(false),
    write: Joi.boolean().default(false),
    delete: Joi.boolean().default(false),
    admin: Joi.boolean().default(false)
  }).optional(),
  moduleAccess: Joi.array().items(
    Joi.string().valid(
      'products_management',
      'order_processing',
      'customer_management',
      'analytics_reports',
      'content_management',
      'system_settings'
    )
  ).optional()
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().alphanum().optional(),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
}).or('email', 'username').messages({
  'object.missing': 'Please provide either email or username'
});

export const roleCreationSchema = Joi.object({
  name: Joi.string().alphanum().min(2).max(50).required(),
  displayName: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  permissions: Joi.array().items(Joi.string()).optional()
});

export const permissionCreationSchema = Joi.object({
  name: Joi.string().alphanum().min(2).max(50).required(),
  displayName: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  resource: Joi.string().required(),
  action: Joi.string().valid('read', 'write', 'delete', 'admin').required()
});
