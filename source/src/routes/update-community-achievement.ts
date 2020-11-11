import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Achievement } from '../models/achievement';
import { Community } from '../models/community';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.put('/communities/:communityId/achievements/:achievementId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which creates a new user/profile (signup).
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, body, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.UPDATE_ACHIEVEMENT)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_UPDATE_COMMUNITY_ACHIEVEMENT);
  }

  const request = await new Achievement({}, { context }).populateById(params.achievementId);
  if (!request.isPersistant()) {
    throw new ResourceError(RouteErrorCode.ACHIEVEMENT_DOES_NOT_EXIST, { achievementId: params.achievementId });
  }

  try {
    request.populate(body, PopulateStrategy.PROFILE);
    await request.validate();
    await request.update();
  } catch (err) {
    await request.handle(err);
  }

  if (request.isValid()) {
    return res.respond(201, request.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(request);
  }
}
