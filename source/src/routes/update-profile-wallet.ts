import { Application } from 'express';
import { PopulateStrategy, RouteErrorCode, SerializedStrategy } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { UnauthenticatedError, ValidationError } from '../lib/errors';
import { UpdateWallet } from '../models/update-wallet';

/**
 * Installs profile wallet-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.put('/profile/wallet', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which updates updates profile's wallet.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const updateWallet = new UpdateWallet({}, { context });
  try {
    updateWallet.populate(body, PopulateStrategy.PROFILE);
    await updateWallet.populateAddressBySignature(body.signature);
    await updateWallet.validate();
    await updateWallet.update(context.profile);
  } catch (error) {
    await updateWallet.handle(error);
  }

  if (updateWallet.isValid()) {
    return res.respond(200, updateWallet.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(updateWallet);
  }
}
