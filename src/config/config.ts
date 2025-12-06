import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(9090),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    DATABASE_URL: Joi.string().required().description('Database connection URL'),
    SHADOW_DATABASE_URL: Joi.string().optional().description('Shadow database URL for migrations'),
    FRONTEND_URL: Joi.string().required().description('Frontend application URL'),
    GOOGLE_CLIENT_ID: Joi.string().optional().description('Google Client ID'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

type Config = {
  env: string;
  port: number;
  jwt: { 
    secret: string;
    expiresIn: string;
  };
  database: {
    url: string;
    shadowUrl?: string;
  };
  frontend_url: string;
  google?: {
    client_id: string;
  };
};

const config: Config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  database: {
    url: envVars.DATABASE_URL,
    shadowUrl: envVars.SHADOW_DATABASE_URL,
  },
  frontend_url: envVars.FRONTEND_URL,
};

if (envVars.GOOGLE_CLIENT_ID) {
  config.google = {
    client_id: envVars.GOOGLE_CLIENT_ID,
  };
}

export default config;
