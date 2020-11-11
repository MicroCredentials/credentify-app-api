import { Application } from 'express';
import { schema } from '../config/schema';
import { NextFunction, Request, Response } from '../http';
/**
 * Installs credential-related routes on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.get('/credentials/schema', (req: Request, res: Response, next: NextFunction) => {
    resolve(req, res).catch(next);
  });
}

/**
 * A middleware which returns schema.
 * @param req ExpressJS request object.
 * @param res ExpressJS response object.
 */
export async function resolve(req: Request, res: Response): Promise<any> {
  return res.json(schema);
}
