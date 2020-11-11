import { Application } from 'express';
import { PopulateStrategy, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ValidationError } from '../lib/errors';
import { ResetProfilePasswordRequest } from '../models/reset-profile-password-request';

/**
 * Installs profile-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/profile/reset-password/request', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which sends profile password reset email with password reset token to user.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  const passwordResetRequest = new ResetProfilePasswordRequest({}, { context });
  try {
    passwordResetRequest.populate(body, PopulateStrategy.PROFILE);
    await passwordResetRequest.validate();
    await passwordResetRequest.deliver();
  } catch (error) {
    await passwordResetRequest.handle(error);
  }

  if (passwordResetRequest.isValid()) {
    return res.respond(201, passwordResetRequest.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(passwordResetRequest);
  }
}
