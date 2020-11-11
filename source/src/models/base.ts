import { Model, ModelConfig, prop } from '@rawmodel/core';
import { ObjectId } from 'mongodb';
import { Context } from '../context';

/**
 * Common model related objects.
 */
export { prop, ObjectId };

/**
 * Base model.
 */
export class ModelBase extends Model<Context> {

  /**
   * Class constructor.
   * @param data Input data.
   * @param config Model configuration.
   */
  public constructor(data?: any, config?: ModelConfig<Context>) {
    super(data, config);
  }

}
