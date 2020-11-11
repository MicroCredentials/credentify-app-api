import { Cert } from '@0xcert/cert';
import { ActionCreateAsset, ActionKind, Priority } from '@0xcert/client';
import { BigNumber } from 'bignumber.js';
import { Application } from 'express';
import { ProfilePermissionKind } from '../config/permissions';
import { schema } from '../config/schema';
import { CredentialStage, RouteErrorCode, SerializedStrategy, SystemErrorCode } from '../config/types';
import { NextFunction, Request, Response } from '../http';
import { ResourceError, SystemError, UnauthenticatedError, UnauthorizedError, ValidationError } from '../lib/errors';
import { ObjectId } from '../models/base';
import { Credential } from '../models/credential';
import { Profile } from '../models/profile';

/**
 * Installs community-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post('/credentials/:credentialId/complete', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which marks the community as deleted. Community will be deleted after 30 days.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
// tslint:disable:cyclomatic-complexity
export async function resolve(req: Request, res: Response): Promise<void> {
  const { context, params, body } = req;

  if (!context.isAuthenticated()) {
    throw new UnauthenticatedError(RouteErrorCode.PROFILE_NOT_IDENTIFIED);
  }

  const credential = await new Credential({}, { context }).populateById(params.credentialId);
  if (!credential.isPersistant()) {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_DOES_NOT_EXISTS, { credentialId: params.credentialId });
  }

  if (!context.hasProfilePermission(ProfilePermissionKind.FINALISE_CREDENTIAL)) {
    throw new UnauthorizedError(RouteErrorCode.NOT_AUTHORIZED_TO_FINALISE_CREDENTIAL);
  }

  if (credential.stage !== CredentialStage.PENDING && credential.stage !== CredentialStage.ISSUING_FAILED) {
    throw new UnauthorizedError(RouteErrorCode.CREDENTIAL_IN_INVALID_STAGE);
  }

  const holder = await new Profile({}, { context }).populateById(credential.profileId);
  if (!holder.isPersistant()) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_EXIST, { profileId: credential.profileId });
  }

  if (!holder.wallet || !holder.wallet.address) {
    throw new ResourceError(RouteErrorCode.PROFILE_DOES_NOT_HAVE_LINKED_WALLET);
  }

  const metadata = {};

  const credentialId = new BigNumber(`0x${credential.id}`).toFixed(0);
  console.log(credentialId);

  metadata['identifier'] = credential.achievement.id || null;
  metadata['name'] = credential.achievement.name || null;
  metadata['title'] = credential.achievement.name || null;
  metadata['description'] = credential.achievement.definition || null;
  metadata['definition'] = credential.achievement.definition || null;
  metadata['refLanguage'] = credential.achievement.refLanguage || null;
  metadata['altLabel'] = credential.achievement.altLabel || null;
  metadata['learningOutcomeDesc'] = credential.achievement.learningOutcomeDesc || null;
  metadata['field'] = credential.achievement.field || null;
  metadata['EQFLevel'] = credential.achievement.eqfLevel || null;
  metadata['NQFLevel'] = credential.achievement.nqfLevel || null;
  metadata['creditSystem'] = credential.achievement.creditSystem || null;
  metadata['creditSysTitle'] = credential.achievement.creditSysTitle || null;
  metadata['creditSysDef'] = credential.achievement.creditSysDef || null;
  metadata['creditSysValue'] = credential.achievement.creditSysValue || null;
  metadata['creditSysIssuer'] = credential.achievement.creditSysIssuer || null;
  metadata['canConsistOf'] = credential.achievement.canConsistOfIds.toString() || null;
  metadata['creditSysRefNum'] = credential.achievement.creditSysRefNum || null;
  metadata['numCreditPoints'] = credential.achievement.numCreditPoints || null;
  metadata['ECTSCreditPoints'] = credential.achievement.ectsCreditPoints || null;
  metadata['volumeOfLearning'] = credential.achievement.volumeOfLearning || null;
  metadata['isPartialQual'] = credential.achievement.isPartialQual || null;
  metadata['consistsOf'] = credential.achievement.dependentAchievementIds.toString() || null;
  metadata['waysToAcquire'] = credential.achievement.waysToAcquire || null;
  metadata['eduCredType'] = credential.achievement.eduCredType || null;
  metadata['entryReq'] = credential.achievement.entryReq || null;
  metadata['learningOutcome'] = credential.achievement.learningOutcome || null;
  metadata['relatedOccupation'] = credential.achievement.relatedOccupation || null;
  metadata['recognition'] = credential.achievement.recognition || null;
  metadata['awardingBody'] = context.profile.id;
  metadata['awardingActivity'] = credential.achievement.awardingActivity || null;
  metadata['awardingMethod'] = credential.achievement.awardingMethod || null;
  metadata['gradeScheme'] = credential.achievement.gradeScheme || null;
  metadata['modeOfStudy'] = credential.achievement.modeOfStudy || null;
  metadata['publicKey'] = credential.achievement.publicKey || null;
  metadata['assesmentMethod'] = credential.achievement.assesmentMethod || null;
  metadata['accreditation'] = credential.achievement.accreditation || null;
  metadata['homePage'] = credential.achievement.homePage || null;
  metadata['landingPage'] = credential.achievement.landingPage || null;
  metadata['supplDoc'] = credential.achievement.supplDoc || null;
  metadata['dateIssued'] = credential._createdAt.toString() || null;
  metadata['dateModified'] = credential._createdAt.toString() || null;
  metadata['changeNote'] = null;
  metadata['historyNote'] = credential.achievement.historyNote || null;
  metadata['additionalNote'] = credential.achievement.additionalNote || null;
  metadata['status'] = credential.achievement.status || null;
  metadata['replaces'] = credential.achievement.replacesId || null;
  metadata['replacedBy'] = credential.achievement.replacedById || null;
  metadata['owner'] = credential.achievement.owner || null;
  metadata['creator'] = credential.achievement.creator || null;
  metadata['publisher'] = credential.achievement.publisherId || null;
  metadata['holder'] = `${holder.firstName} ${holder.lastName}`;
  metadata['dateOfBirth'] = null;
  metadata['studentId'] = holder.id;
  metadata['grade'] = credential.grade || null;
  metadata['creditsAwarded'] = credential.creditsAwarded || null;
  metadata['uniqueId'] = credential.id || null;
  metadata['credential'] = credential.achievement.name || null;
  metadata['expiryPeriod'] = credential.expiryPeriod || null;
  metadata['cheating'] = credential.cheating || null;
  metadata['$evidence'] = `https://${req.get('host')}/credentials/${credentialId}/evidence`;
  metadata['$schema'] = `https://${req.get('host')}/credentials/schema`;

  const cert = new Cert({ schema });
  const imprint = await cert.imprint(metadata);
  if (!imprint) {
    throw new ResourceError(RouteErrorCode.CREDENTIAL_INVALID_METADATA);
  }
  const evidence = await cert.notarize(metadata);

  // tslint:disable-next-line: no-dynamic-delete
  delete metadata['$evidence'];
  // tslint:disable-next-line: no-dynamic-delete
  delete metadata['$schema'];

  const actionCreateAsset: ActionCreateAsset = {
    kind: ActionKind.CREATE_ASSET,
    assetLedgerId: context.env.ledgerId,
    senderId: context.env.executionerAddress,
    receiverId: credential.wallet,
    id: `0x${credential.id}`,
    imprint,
  };

  const createAssetOrder = {
    signersIds: [context.env.executionerAddress],
    actions: [
      actionCreateAsset,
    ],
    wildcardSigner: false,
    automatedPerform: true,
    payerId: context.env.executionerAddress,
  };

  let actionsOrder = null;
  try {
    const client = await context.client;
    actionsOrder = await client.createOrder(createAssetOrder, Priority.LOW);
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    throw new SystemError(SystemErrorCode.BLOCKCHAIN_CONNECTION_FAILED);
  }

  try {
    credential.populate(body);
    credential.stage = CredentialStage.ISSUING;
    credential.awardingBodyId = context.profile.id;
    credential.actionsOrderId = new ObjectId(actionsOrder.data.ref);
    credential.metadata = metadata;
    credential.evidence = JSON.stringify(evidence);
    await credential.validate();
    await credential.update();
  } catch (error) {
    console.log(JSON.stringify(error, null , 2));
    await credential.handle(error);
  }

  if (credential.isValid()) {
    return res.respond(200, credential.serialize(SerializedStrategy.PROFILE));
  } else {
    throw new ValidationError(credential);
  }
}
