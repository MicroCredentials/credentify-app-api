import { Application } from 'express';
import { PopulateStrategy, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ValidationError } from '../lib/errors';
import { CreateProfileRequest } from '../models/create-profile-request';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/request', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which sends an email with request token to a user.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  const request = new CreateProfileRequest({}, { context });
  try {
    request.populate(body, PopulateStrategy.PROFILE);
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
