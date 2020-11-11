import { BigNumber } from 'bignumber.js';
import { Application } from 'express';
import { CredentialStage, RouteErrorCode } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError } from '../lib/errors';
import { Credential } from '../models/credential';

/**
 * Installs credential-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/credentials/:credentialId/evidence', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which returns specific credential metadata.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<any> {
  const { context, params } = req;

  let credentialId = params.credentialId;
  try {
    if (Number(credentialId)) {
      credentialId = new BigNumber(credentialId).toString(16);
    }
  } catch {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS, { credentialId:  params.credentialId });
  }

  const credential = await new Credential({}, { context }).populateById(credentialId);
  if (!credential.isPersistant() || credential.stage !== CredentialStage.COMPLETED) {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS, { credentialId:  params.credentialId });
  }

  return res.json(JSON.parse(credential.evidence));
}
