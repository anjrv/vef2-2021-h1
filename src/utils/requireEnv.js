import { isEmpty } from './validation.js';

/**
 * Hjálparfall til að skoða hvort umhverfi er rétt uppsett
 *
 * @param {object} vars environment variables
 */
export default function requireEnv(vars = []) {
  const missing = [];

  vars.forEach((v) => {
    if (!process.env[v] || isEmpty(process.env[v])) {
      missing.push(v);
    }
  });

  if (missing.length > 0) {
    console.error(`${missing.join(', ')} vantar í umhverfi`);
    process.exit(1);
  }
}
