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
  app.post('/credentials/:credentialId/reject', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which marks the community as deleted. Community will be deleted after 30 days.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, params, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const credential = new Credential({}, { context });
  await credential.populateById(params.credentialId);

  if (!credential.isPersistant()) {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS, { credentialId: params.credentialId });
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.MANAGE_REQUEST_CREDENTIAL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_MANAGE_REQUEST_CREDENTIAL);
  }

  if (credential.stage !== CredentialStage.REQUEST) {
    throw new UnauthorizedError(RouteErrorCode.CREDENTIAL_IN_INVALID_STAGE);
  }

  credential.stage = CredentialStage.REJECTED;
  if (typeof body.note !== 'undefined') {
    credential.note = body.note;
  }

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
