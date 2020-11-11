import { Mongo } from '../..';
import * as env from '../../config/env';

/**
 * Sets spec context variable.
 */
export async function createContextHelper(stage) {
  const mongo = await new Mongo(env).connect();
  await mongo.upgrade();
  stage.set('context', {
    env,
    mongo,
  });
}

/**
 * Closes spec context mongo connection.
 */
export async function closeContextMongoHelper(stage) {
  await stage.get('context').mongo.close();
}

/**
 * Removes spec context mongo data.
 */
export async function cleenupContextMongoHelper(stage) {
  await stage.get('context').mongo.cleenup();
}
