import * as ase from 'aws-serverless-express';
import { HttpServer, Mongo } from '..';
import * as env from '../config/env';

global['mongo'] = global['mongo'] || new Mongo(env);

const api = new HttpServer({
  env,
  mongo: global['mongo'],
});
const server = ase.createServer(api.app, null);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await global['mongo'].connect();

  return new Promise((resolve, reject) => {
    ase.proxy(server, event, {
      ...context,
      succeed: resolve,
    });
  });
};
