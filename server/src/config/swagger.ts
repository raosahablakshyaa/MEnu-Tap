import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TapMenu API',
      version: '5.0.0',
      description: 'TapMenu Restaurant OS — Full Platform API including QR Ordering, Kitchen Display, and Customer Sessions',
    },
    servers: [{ url: `http://localhost:${config.PORT}${config.API_PREFIX}`, description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        sessionId: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Session-Id',
          description: 'Customer session ID (returned after QR scan)',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
            errors: { type: 'object', nullable: true },
          },
        },
        // ── Phase 5 schemas ──────────────────────────────────────────────
        QrValidation: {
          type: 'object',
          properties: {
            restaurant: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                logo: { type: 'string', nullable: true },
                coverImage: { type: 'string', nullable: true },
                description: { type: 'string', nullable: true },
                operationalInfo: { type: 'object' },
                branding: {
                  type: 'object',
                  properties: {
                    themeColor: { type: 'string' },
                    accentColor: { type: 'string' },
                  },
                },
              },
            },
            table: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                tableNumber: { type: 'string' },
                displayName: { type: 'string' },
                floor: { type: 'integer' },
                floorName: { type: 'string', nullable: true },
                capacity: { type: 'integer' },
                status: { type: 'string' },
              },
            },
            qrCode: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                token: { type: 'string' },
                scansCount: { type: 'integer' },
              },
            },
          },
        },
        CustomerSession: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', format: 'uuid' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            menuItemId: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'integer', minimum: 1 },
            variantName: { type: 'string', nullable: true },
            addons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
            notes: { type: 'string', nullable: true },
            subtotal: { type: 'number' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            restaurantId: { type: 'string' },
            tableId: { type: 'string' },
            tableNumber: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            totalItems: { type: 'integer' },
            subtotal: { type: 'number' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string' },
            restaurantId: { type: 'string' },
            tableId: { type: 'string', nullable: true },
            tableNumber: { type: 'string', nullable: true },
            sessionId: { type: 'string', nullable: true },
            customerName: { type: 'string', nullable: true },
            customerPhone: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  menuItemId: { type: 'string', nullable: true },
                  name: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                  variantName: { type: 'string', nullable: true },
                  subtotal: { type: 'number' },
                  notes: { type: 'string', nullable: true },
                },
              },
            },
            subtotal: { type: 'number' },
            taxAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            totalAmount: { type: 'number' },
            currency: { type: 'string', default: 'INR' },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded', 'partial'],
            },
            paymentMethod: {
              type: 'string',
              enum: ['cash', 'upi', 'card', 'wallet', 'net_banking', 'razorpay', 'split'],
              nullable: true,
            },
            estimatedPrepTime: { type: 'integer', nullable: true },
            notes: { type: 'string', nullable: true },
            feedbackGiven: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PublicMenuItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            categoryId: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            images: { type: 'array', items: { type: 'string' } },
            foodType: { type: 'string', enum: ['veg', 'non_veg', 'vegan', 'jain', 'egg'] },
            spiceLevel: { type: 'string', enum: ['mild', 'medium', 'hot', 'extra_hot'], nullable: true },
            price: { type: 'number' },
            discountPrice: { type: 'number', nullable: true },
            taxRate: { type: 'number' },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  discountPrice: { type: 'number', nullable: true },
                  isAvailable: { type: 'boolean' },
                },
              },
            },
            addons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  isAvailable: { type: 'boolean' },
                },
              },
            },
            isBestSeller: { type: 'boolean' },
            isChefRecommended: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            isAvailable: { type: 'boolean' },
            isOutOfStock: { type: 'boolean' },
            preparationTime: { type: 'integer', nullable: true },
            calories: { type: 'integer', nullable: true },
          },
        },
        CustomerFeedback: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderId: { type: 'string' },
            sessionId: { type: 'string' },
            customerName: { type: 'string', nullable: true },
            foodRating: { type: 'integer', minimum: 1, maximum: 5 },
            serviceRating: { type: 'integer', minimum: 1, maximum: 5 },
            ambienceRating: { type: 'integer', minimum: 1, maximum: 5 },
            overallRating: { type: 'number' },
            comment: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      // ── Phase 5 tags ──────────────────────────────────────────────────
      { name: 'PublicMenu', description: 'Customer-facing QR menu (no auth required)' },
      { name: 'Cart', description: 'Customer cart management' },
      { name: 'CustomerOrder', description: 'Customer order placement and tracking' },
      { name: 'Kitchen', description: 'Kitchen Display System — real-time order management' },
      { name: 'OwnerQR', description: 'QR code management for restaurant owners' },
      // ── Existing tags ─────────────────────────────────────────────────
      { name: 'Admin Dashboard', description: 'Super Admin dashboard analytics' },
      { name: 'Admin Restaurants', description: 'Restaurant management' },
      { name: 'Admin Subscriptions', description: 'Subscription & plan management' },
      { name: 'Admin Revenue', description: 'Revenue & transactions' },
      { name: 'Admin Users', description: 'User management' },
      { name: 'Admin Coupons', description: 'Coupon management' },
      { name: 'Admin Notifications', description: 'Broadcast notifications' },
      { name: 'Admin Support', description: 'Support ticket management' },
      { name: 'Admin Audit', description: 'Audit logs' },
      { name: 'Admin Reports', description: 'Report generation' },
      { name: 'Admin Settings', description: 'Platform settings' },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/docs/**/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'TapMenu API Docs',
  }));
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
}
