import { Application } from 'express';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError } from '../lib/errors';
import { Achievement } from '../models/achievement';
import { AchievementCursor } from '../models/achievement-cursor';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/achievements', (req: Request, res: Response, next: NextFunction) => {
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

  const achievementCursor = new AchievementCursor().populate({
    ...query,
  }, PopulateStrategy.PROFILE);
  const $match = {
    $and: [
      achievementCursor.buildQuery(context.profile),
      achievementCursor.buildPersistentFilter(),
    ],
  };

  const data = await context.mongo.db
    .collection('achievements')
    .aggregate([
      { $match },
      { $sort: achievementCursor.buildSort() },
      { $skip: achievementCursor.skip },
      { $limit: achievementCursor.limit },
    ])
    .toArray()
    .then((docs) => {
      return docs.map((d) => new Achievement(d, { context }).serialize(SerializedStrategy.PROFILE));
    });

  const totalCount = await context.mongo.db
    .collection('achievements')
    .countDocuments($match);

  res.respond(200, data, {
    totalCount,
    skip: achievementCursor.skip,
    limit: achievementCursor.limit,
  });
}
