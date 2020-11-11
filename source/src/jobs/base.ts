import { Model, ModelConfig, prop } from '@rawmodel/core';
import { ObjectId } from 'mongodb';
import { JobKind } from '../config/types';
import { Context } from '../context';
import { integerParser, toObjectId } from '../lib/parsers';

/**
 * Common job related objects.
 */
export { prop, ObjectId };

/**
 * Base model.
 */
export class JobBase extends Model<Context> {

  /**
   * Database ID.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
  })
  public _id: ObjectId;

  /**
   * Job kind.
   */
  @prop({
    parser: { resolver: integerParser() },
  })
  public kind: JobKind;

  /**
   * Class constructor.
   * @param data Input data.
   * @param config Job configuration.
   */
  public constructor(data?: any, config?: ModelConfig<Context>) {
    super(data, config);
  }

  /**
   * Performs job operation.
   */
  public async perform(): Promise<any> {
    throw new Error('Perform operation not implemented');
  }

}
