import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Community } from '../models/community';
import { CommunityAbility } from '../models/community-ability';
import { Profile } from '../models/profile';

/**
 * Installs community abilities-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/communities/:communityId/abilities', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which adds new community ability to profile.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, params, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.CREATE_ABILITY)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_COMMUNITY_ABILITY);
  }

  const profile = new Profile({}, { context });
  await profile.populateById(body.profileId);

  if (!profile.isPersistant()) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_EXIST, { profileId: body.profileId });
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  if (!profile.communityAbilities.find((a) => a.communityId.toString() === params.communityId && a.kind === CommunityPermissionKind.READ)) {
    throw new ResourceError(RouteErrorCode.PROFILE_NOT_COMMUNITY_COLLABORATOR);
  }

  const communityAbility = new CommunityAbility({}, { context });
  try {
    await communityAbility.populate({
      kind: body.kind,
      communityId: params.communityId,
    }, PopulateStrategy.PROFILE);
    await communityAbility.validate();
    await communityAbility.create(profile);
  } catch (err) {
    await communityAbility.handle(err);
  }

  if (communityAbility.isValid()) {
    return res.respond(201, communityAbility.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(communityAbility);
  }
}
