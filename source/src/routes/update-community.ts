import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Community } from '../models/community';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.put('/communities/:communityId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which updates community data.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.UPDATE)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_UPDATE_COMMUNITY);
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  try {
    community.populate(body, PopulateStrategy.PROFILE);
    await community.validate();
    await community.update();
  } catch (error) {
    await community.handle(error);
  }

  if (community.isValid()) {
    return res.respond(200, community.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(community);
  }
}
