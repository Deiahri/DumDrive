import dotenv from 'dotenv';

dotenv.config();


const pe = process.env;
const env_vars = {
  PORT: pe.PORT!,
  CLERK_SECRET_KEY: pe.CLERK_SECRET_KEY!,
  CLERK_PUBLISHABLE_KEY: pe.CLERK_PUBLISHABLE_KEY!,
  CLERK_JWKS_PUBLIC_KEY: pe.CLERK_JWKS_PUBLIC_KEY!,
  FE_ORIGIN: pe.FE_ORIGIN!,
  FB_ADMIN_JSON: JSON.parse(process.env.FB_ADMIN_JSON!),
  SELF_URL: pe.SELF_URL!,
  TESTING: pe.TESTING! == "true",
  // AI_SECRET_KEY: pe.AI_SECRET_KEY!,
  // DISABLE_AI: pe.DISABLE_AI == "true",
  // AI_ENDPOINT: pe.AI_ENDPOINT!
};

for (const [key, val] of Object.entries(env_vars)) {
  if (val == undefined) throw new Error(`Expeceted ${key} to be defined`);
}

export { env_vars };