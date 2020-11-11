import { Mongo } from '../lib/mongo';

/**
 * Upgrade logic.
 */
export async function upgrade(ctx: Mongo) {
  await ctx.db.collection('credentials').createIndex({
    'achievement.nameNgrams': 'text',
  }, {
    default_language: 'none',
    name: 'nameNgrams',
  });

  await ctx.db.collection('credentials').createIndex({
    profileId: 1,
  }, {
    name: 'profile',
  });

  await ctx.db.collection('credentials').createIndex({
    'community._id': 1,
  }, {
    name: 'community',
  });

  await ctx.db.collection('credentials').createIndex({
    'achievement.tags': 1,
  }, {
    name: 'achievementTags',
  });

  await ctx.db.collection('credentials').createIndex({
    'stage': 1,
  }, {
    name: 'stage',
  });
}

/**
 * Downgrade logic.
 */
export async function downgrade(ctx: Mongo) {
  await ctx.db.dropCollection('credentials').catch(() => null);
}
