import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Restaurant',
      version: '1.0.0',
      description:
        'API REST para McChapin 2.0'
    },
    servers: [
      {
        url: 'https://desarrollo-web1-backend.onrender.com',
        description: 'Servidor de producción (Render)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor local de desarrollo',
      },
    ],
    // Esquema de seguridad reutilizable: JWT enviado como "Bearer <token>"
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Agrupa las rutas en la interfaz por categorías (coincide con los comentarios de tu index.ts)
    tags: [
      { name: 'Auth', description: 'Login, logout y sesión actual' },
      { name: 'Categorías', description: 'Catálogo de categorías de productos' },
      { name: 'Usuarios', description: 'Gestión de usuarios' },
    ],
  },
  // Dónde buscar los comentarios JSDoc que describen cada endpoint
  apis: ['./src/routes/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);