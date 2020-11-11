import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Context } from '../context';

/**
 * Generates a new request token needed when creating a new profile.
 * @param email Profile email.
 * @param passwordHash Password hash.
 * @param ctx Request context.
 */
export function generateCreateProfileRequestToken(email: string, passwordHash: string, firstName: string, lastName: string, ctx: Context) {
  if (!email || !passwordHash || !firstName || !lastName) {
    return null;
  }
  return jwt.sign({ email, passwordHash, firstName, lastName }, ctx.env.appSecret, {
    subject: 'createProfile',
  });
}

/**
 * Generates a new request token needed when creating a new community collaborator.
 * @param email Profile email.
 * @param communityId Community ID.
 * @param ctx Request context.
 */
export function generateCreateCommunityCollaboratorRequestToken(email: string, communityId: ObjectId, ctx: Context) {
  if (!email || !communityId) {
    return null;
  }
  return jwt.sign({ email, communityId }, ctx.env.appSecret, {
    subject: 'createCommunityCollaborator',
  });
}

/**
 * Generates a new request token needed when resetting profile's email.
 * @param email Profile email.
 * @param ctx Request context.
 */
export function generateResetProfileEmailRequestToken(email: string, ctx: Context) {
  if (!email) {
    return null;
  }
  return jwt.sign({ email }, ctx.env.appSecret, {
    subject: 'resetProfileEmail',
    expiresIn: '1d',
  });
}

/**
 * Generates a new request token needed when resetting profile's password. Request token expires in one day.
 * @param email Profile email.
 * @param ctx Request context.
 */
export function generateResetProfilePasswordRequestToken(email: string, ctx: Context) {
  if (!email) {
    return null;
  }
  return jwt.sign({ email }, ctx.env.appSecret, {
    subject: 'resetProfilePassword',
    expiresIn: '1d',
  });
}

/**
 * Generates a new authentication token.
 * @param profileId Profile id.
 * @param ctx Request context.
 */
export function generateAuthToken(profileId: string, ctx: Context) {
  if (!profileId) {
    return null;
  }
  return jwt.sign({ profileId }, ctx.env.appSecret, {
    subject: 'authProfile',
  });
}

/**
 * Parses create profile request token.
 * @param token Request token.
 * @param ctx Request context.
 */
export function readCreateProfileRequestToken(token: string, ctx: Context) {
  try {
    const { email, passwordHash, firstName, lastName } = jwt.verify(token, ctx.env.appSecret, {
      subject: 'createProfile',
    }) as any;
    if (email && passwordHash) {
      return {
        email: email as string,
        passwordHash: passwordHash as string,
        firstName: firstName as string,
        lastName: lastName as string,
      };
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Parses new community collaborator request token.
 * @param token Request token.
 * @param ctx Request context.
 */
export function readCreateCommunityCollaboratorRequestToken(token: string, ctx: Context) {
  try {
    const { email, communityId } = jwt.verify(token, ctx.env.appSecret, {
      subject: 'createCommunityCollaborator',
    }) as any;
    if (email && communityId) {
      return {
        email: email as string,
        communityId: communityId as string,
      };
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Parses reset profile password request token.
 * @param token Request token.
 * @param ctx Request context.
 */
export function readResetProfilePasswordRequestToken(token: string, ctx: Context) {
  try {
    const { email } = jwt.verify(token, ctx.env.appSecret, {
      subject: 'resetProfilePassword',
    }) as any;
    if (email) {
      return {
        email: email as string,
      };
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Parses reset profile email request token.
 * @param token Request token.
 * @param ctx Request context.
 */
export function readResetProfileEmailRequestToken(token: string, ctx: Context) {
  try {
    const { email } = jwt.verify(token, ctx.env.appSecret, {
      subject: 'resetProfileEmail',
    }) as any;
    if (email) {
      return {
        email: email as string,
      };
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Returns authentication token data.
 * @param token Authentication token.
 * @param ctx Request context.
 */
export function readAuthToken(token: string, ctx: Context) {
  try {
    const { profileId } = jwt.verify(token, ctx.env.appSecret, {
      subject: 'authProfile',
    }) as any;
    if (profileId) {
      return { profileId: new ObjectId(profileId) };
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}
