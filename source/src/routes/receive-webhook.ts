import { RequestStatus } from '@0xcert/client';
import { Application } from 'express';
import { CredentialStage, RouteErrorCode, SystemErrorCode, Webhook, WebhookEventKind } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, SystemError, ValidationError } from '../lib/errors';
import { Credential } from '../models/credential';

/**
 * Installs webhook-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which receives webhook.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, body } = req;

  if (body.event === WebhookEventKind.ORDER_REQUEST_CHANGED) {
    const webhook = body as Webhook;
    let actionsOrder = null;

    try {
      const client = await context.client;
      actionsOrder = await client.getOrder(webhook.requestRef);
    } catch (error) {
      throw new SystemError(SystemErrorCode.BLOCKCHAIN_CONNECTION_FAILED);
    }

    if (actionsOrder && actionsOrder.data && actionsOrder.data.ref) {
      const credential = await new Credential({}, { context }).populateByActionsOrderId(actionsOrder.data.ref);
      if (!credential.isPersistant()) {
        throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS);
      }
      try {
        if (actionsOrder.data.status === RequestStatus.SUCCESS || actionsOrder.data.status === RequestStatus.FINALIZED) {
          try {
            credential.stage = CredentialStage.COMPLETED;
            credential.txHash = actionsOrder.data.txHash;
            await credential.update();
          } catch (error) {
            await credential.handle(error);
          }

          if (!credential.isValid()) {
            throw new ValidationError(credential);
          }
        } else if (
          actionsOrder.data.status === RequestStatus.FAILURE ||
          actionsOrder.data.status === RequestStatus.CANCELED ||
          actionsOrder.data.status === RequestStatus.SUSPENDED
        ) {
          try {
            credential.stage = CredentialStage.ISSUING_FAILED;
            await credential.update();
          } catch (error) {
            await credential.handle(error);
          }

          if (!credential.isValid()) {
            throw new ValidationError(credential);
          }
        }
      } catch (error) {
        credential.stage = CredentialStage.ISSUING_FAILED;
        await credential.update();
      }
    }
  }
  res.respond(200, {});
}
