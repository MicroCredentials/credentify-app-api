import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { readCreateCommunityCollaboratorRequestToken } from '../lib/jwt';
import { CommunityAbility } from '../models/community-ability';

/**
 * Installs community collaborators-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/communities/:communityId/collaborators', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware adds new community collaborator.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, body, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const tokenData = readCreateCommunityCollaboratorRequestToken(body.requestToken, context);
  if (!tokenData || tokenData.email !== context.profile.email || tokenData.communityId !== params.communityId) {
    throw new UnauthorizedError(RouteErrorCode.REQUEST_TOKEN_INVALID);
  }

  const readAbility = new CommunityAbility({}, { context });
  const readAchievementsAbility = new CommunityAbility({}, { context });

  try {
    readAbility.populate({
      communityId: tokenData.communityId,
      profileId: context.profile._id,
      kind: CommunityPermissionKind.READ,
    }, PopulateStrategy.PROFILE);
    await readAbility.validate();
    await readAbility.create(context.profile);
  } catch (err) {
    await readAbility.handle(err);
  }

  try {
    readAchievementsAbility.populate({
      communityId: tokenData.communityId,
      profileId: context.profile._id,
      kind: CommunityPermissionKind.READ_ACHIEVEMENT,
    }, PopulateStrategy.PROFILE);
    await readAchievementsAbility.validate();
    await readAchievementsAbility.create(context.profile);
  } catch (err) {
    await readAchievementsAbility.handle(err);
  }

  if (readAbility.isValid()) {
    if (readAchievementsAbility.isValid()) {
      return res.respond(201, [
        readAbility.serialize(SerializedStrategy.PROFILE),
        readAchievementsAbility.serialize(SerializedStrategy.PROFILE),
      ]);
    } else {
      throw new ValidationError(readAchievementsAbility);
    }
  } else {
    throw new ValidationError(readAbility);
  }
}
