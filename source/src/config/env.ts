import * as dotenv from 'dotenv';

/**
 * Environment object interface.
 */
export interface Env {
  appEnv: string;
  appSecret: string;
  httpHost: string;
  httpPort: number;
  mongoUrl: string;
  mongoDb: string;
  mongoPool: number;
  pageDefaultLimit: number;
  pageMaxLimit: number;
  sendgridApiKey: string;
  signingMessage: string;
  apiUrl: string;
  bitskiClientId: string;
  bitskiCredentialsId: string;
  bitskiCredentialsSecret: string;
  actionsOrderId: string;
  assetLedgerDeployOrderId: string;
  valueLedgerDeployOrderId: string;
  executionerAddress: string;
  ledgerId: string;
}

/**
 * Load variables from .env.
 */
dotenv.config();

/**
 * Application environment.
 */
export const appEnv = process.env['APP_ENV'];

/**
 * Application secret.
 */
export const appSecret = process.env['APP_SECRET'];

/**
 * HTTP server hostname.
 */
export const httpHost = process.env['API_HOST'];

/**
 * HTTP server port.
 */
export const httpPort = parseInt(process.env['API_PORT']);

/**
 * MongoDB URL.
 */
export const mongoUrl = process.env['MONGO_URL'];

/**
 * MongoDB database name.
 */
export const mongoDb = process.env['MONGO_DB'];

/**
 * MongoDB connection pool size.
 */
export const mongoPool = parseInt(process.env['MONGO_POOL']);

/**
 * Pagination default size limit.
 */
export const pageDefaultLimit = parseInt(process.env['PAGE_DEFAULT_LIMIT']);

/**
 * Pagination maximum size limit.
 */
export const pageMaxLimit = parseInt(process.env['PAGE_MAX_LIMIT']);

/**
 * Sendgrid service API secret token.
 */
export const sendgridApiKey = process.env['SENDGRID_API_KEY'];

/**
 * Signing message.
 */
export const signingMessage = process.env['SIGNING_MESSAGE'];

/**
 * 0xcert API URL.
 */
export const apiUrl = process.env['API_URL'];

/**
 * Bitski client id.
 */
export const bitskiClientId = process.env['BITSKI_CLIENT_ID'];

/**
 * Bitski credentials id.
 */
export const bitskiCredentialsId = process.env['BITKSI_CREDENTIALS_ID'];

/**
 * Bitski credentials secret.
 */
export const bitskiCredentialsSecret = process.env['BITKSI_CREDENTIALS_SECRET'];

/**
 * Actions order id.
 */
export const actionsOrderId = process.env['ACTIONS_ORDER_ID'];

/**
 * Asset ledger deploy order id.
 */
export const assetLedgerDeployOrderId = process.env['ASSET_LEDGER_DEPLOY_ORDER_ID'];

/**
 * Value ledger deploy order id.
 */
export const valueLedgerDeployOrderId = process.env['VALUE_LEDGER_DEPLOY_ORDER_ID'];

/**
 * Executioner address.
 */
export const executionerAddress = process.env['EXECUTIONER_ADDRES'];

/**
 * Ledger ID.
 */
export const ledgerId = process.env['LEDGER_ID'];
