import { Mongo } from '../lib/mongo';

/**
 * Upgrade logic.
 */
export async function upgrade(ctx: Mongo) {
  await ctx.db.collection('jobs').createIndex({
    kind: 1,
    sleepUntil: 1,
  }, {
    sparse: true,
    name: 'jobs',
  });
}

/**
 * Downgrade logic.
 */
export async function downgrade(ctx: Mongo) {
  await ctx.db.dropCollection('jobs').catch(() => null);
}
