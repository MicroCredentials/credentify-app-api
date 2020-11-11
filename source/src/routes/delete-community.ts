import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Community } from '../models/community';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.delete('/communities/:communityId', (req: Request, res: Response, next: NextFunction) => {
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

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.DELETE)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_DELETE_COMMUNITY);
  }

  await community.removePermissionsFromAllProfiles();

  try {
    await community.validate();
    await community.markDeleted();
  } catch (error) {
    await community.handle(error);
  }

  if (community.isValid()) {
    return res.respond(200, community.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(community);
  }
}
