import { Application } from 'express';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError } from '../lib/errors';
import { toObjectId } from '../lib/parsers';
import { Community } from '../models/community';
import { CommunityCursor } from '../models/community-cursor';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/communities', (req: Request, res: Response, next: NextFunction) => {
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

  const communityCursor = new CommunityCursor().populate(query, PopulateStrategy.PROFILE);
  const $match = {
    $and: [
      communityCursor.buildQuery(context.profile),
      communityCursor.buildPersistentFilter(),
    ],
  };

  const data = await context.mongo.db
    .collection('communities')
    .aggregate([
      { $match },
      { $sort: communityCursor.buildSort() },
      { $skip: communityCursor.skip },
      { $limit: communityCursor.limit },
    ])
    .toArray()
    .then((docs) => {
      return docs.map((d) => new Community(d, { context }).serialize(SerializedStrategy.PROFILE));
    });

  const totalCount = await context.mongo.db
    .collection('communities')
    .countDocuments($match);

  res.respond(200, data, {
    totalCount,
    skip: communityCursor.skip,
    limit: communityCursor.limit,
  });
}
