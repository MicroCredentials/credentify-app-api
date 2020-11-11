import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { CredentialStage, PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Achievement } from '../models/achievement';
import { Community } from '../models/community';
import { Credential } from '../models/credential';
import { Profile } from '../models/profile';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/credentials', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which creates a new user/profile (signup).
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const profile = await new Profile({}, { context }).populateById(body.profileId);
  if (!profile.isPersistant()) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_EXIST, { profileId: body.profileId });
  }

  if (!profile.wallet || !profile.wallet.address) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_HAVE_LINKED_WALLET);
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.CREATE_CREDENTIAL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_CREDENTIAL);
  }

  const achievement = await new Achievement({}, { context }).populateById(body.achievementId);
  if (!achievement.isPersistant()) {
    throw new ResourceError(RouteErrorCode.ACHIEVEMENT_DOES_NOT_EXIST, { achievementId: body.achievementId });
  }

  const community = await new Community({}, { context }).populateById(achievement.communityId);
  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: achievement.communityId });
  }

  const request = new Credential({}, { context });
  try {
    request.populate({
      profileId: body.profileId,
      stage: CredentialStage.PENDING,
      achievement,
      community,
      wallet: profile.wallet.address,
    }, PopulateStrategy.PROFILE);
    await request.validate();
    await request.create();
  } catch (err) {
    await request.handle(err);
  }

  if (request.isValid()) {
    return res.respond(201, request.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(request);
  }
}
