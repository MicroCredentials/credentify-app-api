import { MongoCron } from 'mongodb-cron';
import { Env } from './config/env';
import { JobKind } from './config/types';
import { Mongo } from './lib/mongo';

/**
 * Background job processor configuration options.
 */
export interface CronConfig {
  env: Env;
  mongo: Mongo;
  kinds: JobKind[];
  nextDelay?: number;
  reprocessDelay?: number;
  idleDelay?: number;
  lockDuration?: number;
}

/**
 * Background job processor.
 */
export class Cron {
  public config: CronConfig;
  protected cron: MongoCron;

  /**
   * Class constructor.
   * @param config Configuration object.
   */
  public constructor(config: CronConfig) {
    this.config = {
      nextDelay: 0,
      reprocessDelay: 0,
      idleDelay: 1000,
      lockDuration: 3600000, // job can process for 1h
      ...config,
    };
  }

  /**
   * Starts the worker.
   * @param host Server hostname.
   * @param port Server listening port.
   */
  public async start() {
    this.cron = new MongoCron({
      collection: this.config.mongo.db.collection('jobs'),
      onDocument: this.onDocument.bind(this),
      onError: this.onError.bind(this),
      condition: { kind: { $in: this.config.kinds } },
      nextDelay: this.config.nextDelay,
      reprocessDelay: this.config.reprocessDelay,
      idleDelay: this.config.idleDelay,
      lockDuration: this.config.lockDuration,
    });

    await this.cron.start();

    return this;
  }

  /**
   * Stops the worker.
   */
  public async stop() {
    await this.cron.stop();

    return this;
  }

  /**
   * Triggers on job processing,
   * @param doc Job document.
   */
  protected async onDocument(doc: any) {
    const context = this.config as any;

    switch (doc.kind) {
      default:
        throw new Error(`Unknown job kind ${doc.kind}.`);
    }
  }

  /**
   * Triggers on job processing,
   * @param doc Job document.
   */
  protected async onError(err: any) {
    console.log('System error:', err);
  }

}
