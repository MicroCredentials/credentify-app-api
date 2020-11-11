import * as bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

/**
 * Generates community's key value.
 */
export function generateCommunityKeyValue() {
  return bcrypt.hashSync(new Object().toString(), bcrypt.genSaltSync(10));
}
