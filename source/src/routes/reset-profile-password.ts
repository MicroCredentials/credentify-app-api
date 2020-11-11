import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError  } from '../lib/errors';
import { readResetProfilePasswordRequestToken } from '../lib/jwt';
import { Profile } from '../models/profile';
import { ResetProfilePassword } from '../models/reset-profile-password';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.put('/profile/reset-password', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which resets profile's password.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  const tokenData = readResetProfilePasswordRequestToken(body.requestToken, context);
  if (!tokenData) {
    throw new UnauthorizedError(RouteErrorCode.REQUEST_TOKEN_INVALID);
  }

  const profile = new Profile({}, { context });
  await profile.populateByEmail(tokenData.email);

  if (!profile.isPersistant()) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_EXIST, { email: tokenData.email });
  }
  context.profile = profile;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (
    !context.hasProfilePermission(ProfilePermissionKind.AUTH)
    || !context.hasProfilePermission(ProfilePermissionKind.RESET_PASSWORD)
  ) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CHANGE_PASSWORD);
  }

  try {
    await profile.validate();
  } catch (error) {
    await profile.handle(error);
  }

  if (!profile.isValid()) {
    throw new ValidationError(profile);
  }

  const resetPassword = new ResetProfilePassword({}, { context });
  try {
    resetPassword.populate({
      _id: profile.id,
      password: body.password,
     });
    await resetPassword.validate();
    await resetPassword.update();
  } catch (error) {
    await resetPassword.handle(error);
  }

  if (resetPassword.isValid()) {
    return res.respond(200, resetPassword.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(resetPassword);
  }
}
