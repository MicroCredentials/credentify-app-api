import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Profile } from '../models/profile';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.delete('/profile', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which marks the profile as deleted. Profile will be deleted after 30 days.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.DELETE)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_DELETE_PROFILE);
  }

  const profile = new Profile(context.profile, { context });
  try {
    await profile.markDeleted();
  } catch (error) {
    await profile.handle(error);
  }

  if (profile.isValid()) {
    return res.respond(200, profile.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(profile);
  }
}
