import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError, ValidationError  } from '../lib/errors';
import { readResetProfileEmailRequestToken } from '../lib/jwt';
import { ResetProfileEmail } from '../models/reset-profile-email';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.put('/profile/reset-email', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which resets profile's email.
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

  const tokenData = readResetProfileEmailRequestToken(body.requestToken, context);
  if (!tokenData) {
    throw new UnauthorizedError(RouteErrorCode.REQUEST_TOKEN_INVALID);
  }

  const resetEmail = new ResetProfileEmail({}, { context });
  try {
    resetEmail.populate({
      _id: context.profile.id,
      email: tokenData.email,
     });
    await resetEmail.validate();
    await resetEmail.update();
  } catch (error) {
    await resetEmail.handle(error);
  }

  if (resetEmail.isValid()) {
    return res.respond(200, resetEmail.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(resetEmail);
  }
}
