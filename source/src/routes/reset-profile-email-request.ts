import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { ResetProfileEmailRequest } from '../models/reset-profile-email-request';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/reset-email/request', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which sends an email to a user with a request token for resetting profile's email.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.RESET_EMAIL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CHANGE_EMAIL);
  }

  const emailReset = new ResetProfileEmailRequest({ currentEmail: context.profile.email }, { context });
  try {
    emailReset.populate(body, PopulateStrategy.PROFILE);
    await emailReset.validate();
    await emailReset.deliver();
  } catch (error) {
    emailReset.handle(error);
  }

  if (emailReset.isValid()) {
    res.respond(201, emailReset.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(emailReset);
  }
}
