import { Application, RequestHandler } from 'express';
import { Env } from '../config/env';
import { ProfilePermissionKind } from '../config/permissions';
import { RouteErrorCode } from '../config/types';
import { Context } from '../context';
import { NextFunction, Request, Response } from '../http';
import { UnauthorizedError } from '../lib/errors';
import { Mongo } from '../lib/mongo';

/**
 * Applies context middleware to application.
 * @param app ExpressJS application.
 * @param stage Stage instance.
 */
export function inject(app: Application, env: Env, mongo: Mongo): void {
  app.use(createContext(env, mongo));
}

/**
 * Returns a middleware which creates a new context object for each request and
 * saves it to the request object.
 * @param stage Stage instance.
 */
export function createContext(env: Env, mongo: Mongo): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {

    req.context = await new Context(env, mongo).authenticate(
      req.query.authToken
      || (req.get('authorization') || '').split(' ').reverse()[0],
    );

    if (
      !!req.context.profile
      && !req.context.hasProfilePermission(ProfilePermissionKind.AUTH)
    ) {
      throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_AUTHENTICATE);
    }

    next();
  };
}
