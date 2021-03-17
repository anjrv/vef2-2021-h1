const { DEBUG = false } = process.env;

/**
 * Hjálparfall fyrir debugging, auðvelt að slökkva á
 *
 * @param  {...any} m skilaboð
 */
export default function debug(...m) {
  if (DEBUG) {
    console.info(...m);
  }
}
