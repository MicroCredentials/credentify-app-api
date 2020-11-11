import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError,  } from '../lib/errors';
import { CommunityAbility } from '../models/community-ability';
import { Profile } from '../models/profile';

/**
 * Installs community abilities-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.delete('/communities/:communityId/abilities/:abilityId', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware removes community ability for a specific profile.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const profile = await new Profile({}, { context }).populateByCommunityAbilityId(params.abilityId);
  if (!profile.isPersistant()) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_EXIST);
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.DELETE_ABILITY) && profile.id.toString() !== context.profile.id) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_DELETE_COMMUNITY_ABILITY);
  }

  const communityAbility = new CommunityAbility({ _id: params.abilityId }, { context });
  try {
    await communityAbility.delete(profile);
  } catch (err) {
    await communityAbility.handle(err);
  }

  if (communityAbility.isValid()) {
    return res.respond(201, communityAbility.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(communityAbility);
  }
}
