import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().min(1),
  DB_POOL_LIMIT: z.coerce.number().int().positive().default(3),
  AUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default("gadgetwizard-api"),
  JWT_AUDIENCE: z.string().default("gadgetwizard-client"),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24),
  AUTH_COOKIE_NAME: z.string().default("gw_session"),
  APP_BASE_URL: z.string().url().optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_USERNAME: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().min(1).default("GadgetWizard"),
  PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: z.coerce.number().int().positive().default(30),
  CDN_BASE_URL: z.string().url(),
  CDN_API_BASE_URL: z.string().url().optional(),
  CDN_API_KEY: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let parsedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (parsedEnv) {
    return parsedEnv;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  parsedEnv = {
    ...result.data,
    SMTP_USER: result.data.SMTP_USER ?? result.data.SMTP_USERNAME,
    SMTP_PASS: result.data.SMTP_PASS ?? result.data.SMTP_PASSWORD,
  };
  return parsedEnv;
}
