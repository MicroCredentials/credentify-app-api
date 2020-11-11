import { Application } from 'express';
import { ObjectId } from 'mongodb';
import { CommunityPermissionKind, KeyPermissionKind } from '../config/permissions';
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
  app.post('/communities/:communityId/keys', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which creates new community's key.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, params, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.CREATE_KEY)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_KEY);
  }

  const key = new Key({}, { context });
  try {
    key.populate({
      ...body.ttl ? { ttl: body.ttl } : {},
      ...body.permissions ? {
        keyAbilities: body.permissions.map((p: KeyPermissionKind) => {
            return {
              _id: new ObjectId(),
              kind: p,
            };
          }),
      } : {},
    });
    await key.validate();
    await key.create(community);
  } catch (error) {
    await key.handle(error);
  }

  if (key.isValid()) {
    return res.respond(201, key.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(key);
  }
}
