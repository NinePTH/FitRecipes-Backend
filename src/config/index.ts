interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    storageBucket: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    corsOrigin: string;
  };
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL!,
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'recipe-images-dev',
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  security: {
    bcryptRounds:
      Number(process.env.BCRYPT_ROUNDS) ||
      (process.env.NODE_ENV === 'development' ? 10 : 12),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests:
      Number(process.env.RATE_LIMIT_MAX_REQUESTS) ||
      (process.env.NODE_ENV === 'development' ? 1000 : 100),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Missing required environment variable: ${envVar}`);
  }
}

// Log configuration in development
if (config.nodeEnv === 'development') {
  console.log('🔧 Configuration loaded:');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(
    `   Database: ${config.database.url.split('@')[1]?.split('/')[0] || 'Local PostgreSQL'}`
  );
  console.log(`   Storage Bucket: ${config.supabase.storageBucket}`);
  console.log(`   CORS Origin: ${config.security.corsOrigin}`);
  console.log(
    `   Rate Limit: ${config.security.rateLimitMaxRequests} requests per ${config.security.rateLimitWindowMs / 60000} minutes`
  );
}

export default config;
