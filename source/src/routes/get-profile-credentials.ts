import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError } from '../lib/errors';
import { Credential } from '../models/credential';
import { CredentialCursor } from '../models/credential-cursor';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/profile/credentials', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which returns profile's list of credentials.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, query } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.READ_CREDENTIAL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_READ_CREDENTIAL);
  }
  query.filterProfileIds = [context.profile.id];

  const credentialCursor = new CredentialCursor().populate(query, PopulateStrategy.PROFILE);
  const $match = {
    $and: [
      credentialCursor.buildQuery(),
      credentialCursor.buildPersistentFilter(),
    ],
  };

  const data = await context.mongo.db
    .collection('credentials')
    .aggregate([
      { $match },
      { $sort: credentialCursor.buildSort() },
      { $skip: credentialCursor.skip },
      { $limit: credentialCursor.limit },
    ])
    .toArray()
    .then((docs) => {
      return docs.map((d) => new Credential(d, { context }).serialize(SerializedStrategy.PROFILE));
    });

  const totalCount = await context.mongo.db
    .collection('credentials')
    .countDocuments($match);

  res.respond(200, data, {
    totalCount,
    skip: credentialCursor.skip,
    limit: credentialCursor.limit,
  });
}
