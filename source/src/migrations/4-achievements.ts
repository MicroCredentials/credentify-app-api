import { Mongo } from '../lib/mongo';

/**
 * Upgrade logic.
 */
export async function upgrade(ctx: Mongo) {
  await ctx.db.collection('achievements').createIndex({
    'nameNgrams': 'text',
  }, {
    default_language: 'none',
    name: 'ngrams',
  });

  await ctx.db.collection('achievements').createIndex({
    'tag': 1,
  }, {
    name: 'tag',
  });
}

/**
 * Downgrade logic.
 */
export async function downgrade(ctx: Mongo) {
  await ctx.db.dropCollection('achievements').catch(() => null);
}
