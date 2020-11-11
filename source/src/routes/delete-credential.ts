import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { CredentialStage, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Credential } from '../models/credential';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.delete('/credentials/:credentialId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which marks the community as deleted. Community will be deleted after 30 days.
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
    throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS, { credentialId: params.credentialId });
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.DELETE_CREDENTIAL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_DELETE_CREDENTIAL);
  }

  if (credential.stage === CredentialStage.COMPLETED) {
    throw new UnauthorizedError(RouteErrorCode.CREDENTIAL_IN_COMPLETE_STAGE_CANNOT_BE_DELETED);
  }

  try {
    await credential.markDeleted();
  } catch (error) {
    await credential.handle(error);
  }

  if (credential.isValid()) {
    return res.respond(200, credential.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(credential);
  }
}
