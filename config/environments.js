// Environment Configuration for ShareBrain Platform
// This file defines different environments for development, staging, and production

const environments = {
  development: {
    name: 'Development',
    url: 'http://localhost:5000',
    database: {
      type: 'postgresql',
      ssl: false,
      pool: { min: 2, max: 10 }
    },
    auth: {
      bypass: true,
      demoUser: 'demo-user',
      domains: ['localhost:5000']
    },
    api: {
      timeout: 30000,
      retries: 3
    },
    logging: {
      level: 'debug',
      console: true
    }
  },
  
  staging: {
    name: 'Staging',
    url: 'https://test.sharebrain.me',
    database: {
      type: 'postgresql',
      ssl: true,
      pool: { min: 5, max: 20 }
    },
    auth: {
      bypass: false,
      googleOAuth: true,
      domains: ['test.sharebrain.me', 'staging.sharebrain.me']
    },
    api: {
      timeout: 60000,
      retries: 3
    },
    logging: {
      level: 'info',
      console: true
    }
  },
  
  production: {
    name: 'Production',
    url: 'https://sharebrain.me',
    database: {
      type: 'postgresql',
      ssl: true,
      pool: { min: 10, max: 50 }
    },
    auth: {
      bypass: false,
      googleOAuth: true,
      domains: ['sharebrain.me']
    },
    api: {
      timeout: 60000,
      retries: 5
    },
    logging: {
      level: 'error',
      console: false
    }
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
};

// Environment-specific configuration
const getConfig = () => {
  const env = getCurrentEnvironment();
  
  return {
    ...env,
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
    apiKeys: {
      openai: process.env.OPENAI_API_KEY,
      together: process.env.TOGETHER_API_KEY,
      github: process.env.GITHUB_ACCESS_TOKEN
    },
    replit: {
      domains: process.env.REPLIT_DOMAINS?.split(',') || env.auth.domains
    }
  };
};

module.exports = {
  environments,
  getCurrentEnvironment,
  getConfig
};