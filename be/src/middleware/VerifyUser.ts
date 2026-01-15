import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '../auth/clerk';
import { env_vars } from '../scripts/env_vars';

export default async function verifyUser(req: Request, res: Response, next: NextFunction) {
  try {
    // localhost path can be missing sometimes
    if (req.url[0] == '/') {
      req.url = env_vars.FE_ORIGIN+req.url;
    }

    const clerkResponse = await clerkClient.authenticateRequest((req as any), {
      authorizedParties: [env_vars.FE_ORIGIN],
      publishableKey: env_vars.CLERK_PUBLISHABLE_KEY,
      // secretKey: env_vars.CLERK_SECRET_KEY,
      // jwtKey: env_vars.CLERK_JWKS_PUBLIC_KEY
    });

    if (!clerkResponse) {
      throw new Error();
    }

    const subID = clerkResponse.toAuth()?.userId; // will be used as subID
    // console.log(clerkResponse.toAuth());

    if (!subID) throw new Error('No User ID');

    req.headers.USER_SUB_ID = subID; // Attach user info to the request object if needed
    next();
  } catch (error) {
    console.error('authError', (error as Error).message);
    return res.status(403).json({ error: 'Forbidden: User verification failed' });
  }
}

export function GetSubIDFromHeaders(req: Request) {
  return req.headers.USER_SUB_ID as string;
}