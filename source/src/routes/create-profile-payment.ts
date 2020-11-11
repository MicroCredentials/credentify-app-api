import { Application } from 'express';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, ValidationError } from '../lib/errors';
import { ProfilePayment } from '../models/profile-payment';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/payments', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which creates a new user/profile (signup).
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const profilePayment = new ProfilePayment({}, { context });
  try {
    await profilePayment.populate(body, PopulateStrategy.PROFILE);
    await profilePayment.validate();
    await profilePayment.create(context.profile);
  } catch (err) {
    await profilePayment.handle(err);
  }

  if (profilePayment.isValid()) {
    return res.respond(201, profilePayment.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(profilePayment);
  }
}
