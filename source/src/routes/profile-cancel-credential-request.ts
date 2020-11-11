import { Application } from 'express';
import { CredentialStage, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Credential } from '../models/credential';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/credentials/:credentialId/cancel', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which creates a new user/profile (signup).
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const credential = new Credential({}, { context });
  await credential.populateById(params.credentialId);

  if (!credential.isPersistant()) {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS, { achievementId: params.credentialId });
  }

  if (credential.profileId.toString() !== context.profile.id.toString()) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CANCEL_CREDENTIAL);
  }

  if (credential.stage !== CredentialStage.REQUEST) {
    throw new UnauthorizedError(RouteErrorCode.CREDENTIAL_IN_INVALID_STAGE);
  }

  credential.stage = CredentialStage.CANCELED;
  try {
    await credential.validate();
    await credential.update();
  } catch (error) {
    await credential.handle(error);
  }

  if (credential.isValid()) {
    return res.respond(200, credential.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(credential);
  }
}
