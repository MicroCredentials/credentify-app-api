import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError } from '../lib/errors';
import { toObjectId } from '../lib/parsers';
import { Community } from '../models/community';
import { Profile } from '../models/profile';

/**
 * Installs community collaborators-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/communities/:communityId/collaborators/:collaboratorId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware returns specific community collaborator.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.READ_ABILITY)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_READ_COMMUNITY_ABILITY);
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  const data = await context.mongo.db
    .collection('profiles')
    .findOne({
      _id: toObjectId(params.collaboratorId),
      'communityAbilities.communityId': params.communityId,
    })
    .then((doc) => {
      return doc === null ? null : new Profile(doc, { context }).serialize(SerializedStrategy.PROFILE);
    });

  res.respond(200, data);
}
