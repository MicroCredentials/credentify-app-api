import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { CredentialStage, PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Achievement } from '../models/achievement';
import { Community } from '../models/community';
import { Credential } from '../models/credential';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/credentials', (req: Request, res: Response, next: NextFunction) => {
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

  if (!context.hasProfilePermission(ProfilePermissionKind.REQUEST_CREDENTIAL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_REQUEST_CREDENTIAL);
  }

  if (!context.profile.wallet || !context.profile.wallet.address) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_HAVE_LINKED_WALLET);
  }

  const achievement = await new Achievement({}, { context }).populateById(body.achievementId);
  if (!achievement.isPersistant()) {
    throw new ResourceError(RouteErrorCode.ACHIEVEMENT_DOES_NOT_EXIST, { achievementId: body.achievementId });
  }

  const community = await new Community({}, { context }).populateById(achievement.communityId);
  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: achievement.communityId });
  }

  const data = await context.mongo.db
    .collection('credentials')
    .countDocuments({
      stage: CredentialStage.REQUEST,
      profileId: context.profile.id.toString(),
      'achievement._id': achievement._id,
      '_deletedAt': null,
    });

  if (data > 0) {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_REQUEST_ALREADY_EXIST);
  }

  const request = new Credential({}, { context });
  try {
    request.populate({
      profileId: context.profile.id,
      stage: CredentialStage.REQUEST,
      achievement,
      community,
      wallet: context.profile.wallet.address,
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
