import { Cron, Mongo } from '..';
import * as env from '../config/env';
// import { JobKind } from '../config/types';

const mongo = new Mongo(env);
const cron = new Cron({
  env,
  mongo,
  kinds: [],
});

(async () => {
  await mongo.connect();

  // mongo.db.collection('jobs').insertOne({
  //   kind: JobKind.SENDGRID_TRANSACTIONAL_EMAIL,
  //   sleepUntil: new Date(),
  //   interval: '* * * * * *', // every second
  // });

  await cron.start();
})().catch(async (err) => {
  console.log(err);
  await cron.stop();
  await mongo.close();
});
