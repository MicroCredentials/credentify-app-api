import { Application } from 'express';
import { CommunityPermissionKind, ProfilePermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError, ValidationError  } from '../lib/errors';
import { Community } from '../models/community';
import { UpdateProfileCommunityAbilities } from '../models/update-profile-community-abilities';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/communities', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which creates a community.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.CREATE_COMMUNITY)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_COMMUNITY);
  }

  const community = new Community({}, { context });
  try {
    community.populate(body, PopulateStrategy.PROFILE);
    await community.validate();
    await community.create();
  } catch (error) {
    await community.handle(error);
  }

  if (!community.isValid()) {
    throw new ValidationError(community);
  }

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  try {
    updateCommunityAbilities.populate({
      profileId: context.profile.id,
      communityAbilities: [
        ...context.profile.communityAbilities || [],
        { communityId: community.id, kind: CommunityPermissionKind.READ },
        { communityId: community.id, kind: CommunityPermissionKind.UPDATE },
        { communityId: community.id, kind: CommunityPermissionKind.DELETE },
        { communityId: community.id, kind: CommunityPermissionKind.CREATE_KEY },
        { communityId: community.id, kind: CommunityPermissionKind.DELETE_KEY },
        { communityId: community.id, kind: CommunityPermissionKind.CREATE_ABILITY },
        { communityId: community.id, kind: CommunityPermissionKind.DELETE_ABILITY },
        { communityId: community.id, kind: CommunityPermissionKind.READ_ABILITY },
        { communityId: community.id, kind: CommunityPermissionKind.READ_KEY },
        { communityId: community.id, kind: CommunityPermissionKind.CREATE_KEY_ABILITY },
        { communityId: community.id, kind: CommunityPermissionKind.DELETE_KEY_ABILITY },
        { communityId: community.id, kind: CommunityPermissionKind.CREATE_ACHIEVEMENT },
        { communityId: community.id, kind: CommunityPermissionKind.DELETE_ACHIEVEMENT },
        { communityId: community.id, kind: CommunityPermissionKind.UPDATE_ACHIEVEMENT },
        { communityId: community.id, kind: CommunityPermissionKind.READ_ACHIEVEMENT },
      ],
    });
    await updateCommunityAbilities.validate();
    await updateCommunityAbilities.update();

  } catch (error) {
    await updateCommunityAbilities.handle(error);
  }

  if (!updateCommunityAbilities.isValid()) {
    // TODO: Handle user update failure.
    throw new ValidationError(updateCommunityAbilities);
  }

  return res.respond(201, community.serialize(SerializedStrategy.PROFILE));
}
