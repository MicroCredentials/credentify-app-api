import { Mongo } from '../lib/mongo';

/**
 * Upgrade logic.
 */
export async function upgrade(ctx: Mongo) {
  await ctx.db.collection('communities').createIndex({
    'nameNgrams': 'text',
  }, {
    default_language: 'none',
    name: 'ngrams',
  });
}

/**
 * Downgrade logic.
 */
export async function downgrade(ctx: Mongo) {
  await ctx.db.dropCollection('communities').catch(() => null);
}
