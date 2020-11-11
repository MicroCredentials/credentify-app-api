import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Achievement } from '../models/achievement';
import { Community } from '../models/community';

/**
 * Installs community keys-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.delete('/communities/:communityId/achievements/:achievementId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which deletes key.
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

  const achievement = new Achievement({}, { context });
  await achievement.populateById(params.achievementId);

  if (!achievement.isPersistant()) {
     throw new ResourceError(RouteErrorCode.ACHIEVEMENT_DOES_NOT_EXIST, { keyId: params.keyId });
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.DELETE_ACHIEVEMENT)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_DELETE_COMMUNITY_ACHIEVEMENT);
  }

  try {
    await achievement.markDeleted();
  } catch (error) {
    await achievement.handle(error);
  }

  if (achievement.isValid()) {
    res.respond(200, achievement.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(achievement);
  }
}
