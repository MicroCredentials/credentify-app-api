import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthorizedError, ValidationError } from '../lib/errors';
import { readCreateProfileRequestToken } from '../lib/jwt';
import { CreateProfile } from '../models/create-profile';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile', (req: Request, res: Response, next: NextFunction) => {
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

  const tokenData = readCreateProfileRequestToken(body.requestToken, context);
  if (!tokenData) {
    throw new UnauthorizedError(RouteErrorCode.REQUEST_TOKEN_INVALID);
  }

  const profile = new CreateProfile({}, { context });
  try {
    profile.populate({
      firstName: tokenData.firstName,
      lastName: tokenData.lastName,
      _createdAt: new Date(),
      email: tokenData.email,
      passwordHash: tokenData.passwordHash,
      profileAbilities: [
        { kind: ProfilePermissionKind.AUTH },
        { kind: ProfilePermissionKind.DELETE },
        { kind: ProfilePermissionKind.RESET_PASSWORD },
        { kind: ProfilePermissionKind.RESET_EMAIL },
        { kind: ProfilePermissionKind.UPDATE },
        { kind: ProfilePermissionKind.READ_CREDENTIAL },
        { kind: ProfilePermissionKind.REQUEST_CREDENTIAL },
      ],
    });
    await profile.validate();
    await profile.create();
  } catch (err) {
    await profile.handle(err);
  }

  if (profile.isValid()) {
    return res.respond(201, profile.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(profile);
  }
}
