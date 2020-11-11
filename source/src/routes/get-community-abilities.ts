import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError } from '../lib/errors';
import { Community } from '../models/community';
import { CommunityAbility } from '../models/community-ability';

/**
 * Installs community abilities-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/communities/:communityId/abilities', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which returns all community abilities of a community for a user.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, params, body } = req;

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
      'communityAbilities.communityId': params.communityId,
    })
    .then((doc) => {
      return doc === null ? [] : doc.communityAbilities.map((d) => new CommunityAbility(d, { context }).serialize(SerializedStrategy.PROFILE));
    });

  res.respond(200, data);
}
