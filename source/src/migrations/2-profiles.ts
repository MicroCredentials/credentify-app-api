import { Mongo } from '../lib/mongo';

/**
 * Upgrade logic.
 */
export async function upgrade(ctx: Mongo) {
  await ctx.db.collection('profiles').createIndex({
    email: 1,
  }, {
    unique: true,
    name: 'uniqueEmail',
  });
  await ctx.db.collection('profiles').createIndex({
    'profilePayments._id': 1,
  }, {
    unique: true,
    name: 'uniqueProfilePaymentId',
    sparse: true,
  });
  await ctx.db.collection('profiles').createIndex({
    'communityAbilities._id': 1,
  }, {
    unique: true,
    name: 'uniqueCommunityAbilityId',
    sparse: true,
  });
  await ctx.db.collection('profiles').createIndexes([
    {
      key: {
        'lastNameNgrams': 'text',
        'firstNameNgrams': 'text',
      },
      name: 'ngrams',
      default_language: 'none',
      weights: {
        'lastNameNgrams': 2,
        'firstNameNgrams': 1,
      },
    },
  ]);
}

/**
 * Downgrade logic.
 */
export async function downgrade(ctx: Mongo) {
  await ctx.db.dropCollection('profiles').catch(() => null);
}
