import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Community } from '../models/community';
import { Key } from '../models/key';

/**
 * Installs community keys-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.delete('/communities/:communityId/keys/:keyId/abilities/:abilityId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which deletes community key ability.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  const key = new Key({}, { context });
  await key.populateById(community, params.keyId);

  if (!key.isPersistent()) {
     throw new ResourceError(RouteErrorCode.KEY_DOES_NOT_EXISTS, { keyId: params.keyId });
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.DELETE_KEY_ABILITY)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_DELETE_KEY_ABILITY);
  }

  await key.removeKeyAbility(community, params.abilityId);
  try {
    await key.validate();
  } catch (error) {
    await key.handle(error);
  }

  if (key.isValid()) {
    res.respond(200, key.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(key);
  }
}
