import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { Community } from '../models/community';
import { CreateCommunityCollaboratorRequest } from '../models/create-community-collaborator-request';

/**
 * Installs community collaborators-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/communities/:communityId/collaborators/request', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which sends an email with request token to a user.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {

  const { context, body, params } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasCommunityPermission(params.communityId, CommunityPermissionKind.CREATE_ABILITY)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_COMMUNITY_ABILITY);
  }

  const community = new Community({}, { context });
  await community.populateById(params.communityId);

  if (!community.isPersistent()) {
    throw new ResourceError(RouteErrorCode.COMMUNITY_DOES_NOT_EXISTS, { communityId: params.communityId });
  }

  const request = new CreateCommunityCollaboratorRequest({}, { context });
  try {
    request.populate({ ...body, ...params }, PopulateStrategy.PROFILE);
    await request.validate();
    await request.deliver();
  } catch (err) {
    await request.handle(err);
  }

  if (request.isValid()) {
    return res.respond(201, request.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(request);
  }
}
