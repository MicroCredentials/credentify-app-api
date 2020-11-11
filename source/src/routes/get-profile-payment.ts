import { Application } from 'express';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError } from '../lib/errors';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/profile/payments/:id', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which returns profile data.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }
  const payment = context.profile.profilePayments.filter((payment) => payment.id.toString() === params.id)[0];
  if (!payment) {
    return res.respond(200, null);
  } else {
    return res.respond(200, payment.serialize(SerializedStrategy.PROFILE));
  }
}
