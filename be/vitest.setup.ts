import dotenv from 'dotenv';

import { beforeAll } from 'vitest';
import { env_vars } from './src/scripts/env_vars';
import { DBDeleteAllTestDocuments } from './src/db/db';

// setups .env variable access
dotenv.config();

if (!env_vars.TESTING) {
    throw new Error('Expected testing mode to be true, but env.TESTING='+env_vars.TESTING);
}

beforeAll(async () => {
    await DBDeleteAllTestDocuments();
});