import { Application } from 'express';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthorizedError, ValidationError } from '../lib/errors';
import { AuthProfile } from '../models/auth-profile';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/auth', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware for authenticating a user (login).
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  const auth = new AuthProfile(body, { context });
  try {
    await auth.validate();
    await auth.authenticate();
  } catch (err) {
    await auth.handle(err);
  }

  if (auth.isValid()) {
    if (auth.authToken) {
      return res.respond(200, auth.serialize(SerializedStrategy.PROFILE));
    } else {
      throw new UnauthorizedError(RouteErrorCode.PROFILE_CREDENTIALS_INVALID);
    }
  } else {
    throw new ValidationError(auth);
  }
}
