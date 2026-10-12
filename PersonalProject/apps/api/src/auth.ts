import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'hourly-development-better-auth-secret-key-987654321',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [
    'hourly://',
    'exp://',
    'http://localhost:3000',
    'http://10.0.2.2:3000',
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy-github-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-github-client-secret',
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || 'dummy-facebook-client-id',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'dummy-facebook-client-secret',
    },
  },
});

