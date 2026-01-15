
const env_vars = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL
};

for (const [key, val] of Object.entries(env_vars)) {
  if (!val) {
    throw new Error(`Expected ${key} to be defined`);
  }
}

export { env_vars };
