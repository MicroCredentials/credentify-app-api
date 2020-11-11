import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, UnauthorizedError } from '../lib/errors';
import { User } from '../models/user';
import { UserCursor } from '../models/user-cursor';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/users', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which returns profile's list of communities.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, query } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.READ_USER)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_READ_USER);
  }

  const userCursor = new UserCursor().populate(query, PopulateStrategy.PROFILE);
  const $match = {
    $and: [
      userCursor.buildQuery(),
      userCursor.buildPersistentFilter(),
    ],
  };

  const data = await context.mongo.db
    .collection('profiles')
    .aggregate([
      { $match },
      { $sort: userCursor.buildSort() },
      { $skip: userCursor.skip },
      { $limit: userCursor.limit },
    ])
    .toArray()
    .then((docs) => {
      return docs.map((d) => new User(d, { context }).serialize(SerializedStrategy.PROFILE));
    });

  const totalCount = await context.mongo.db
    .collection('profiles')
    .countDocuments($match);

  res.respond(200, data, {
    totalCount,
    skip: userCursor.skip,
    limit: userCursor.limit,
  });
}
