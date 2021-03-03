const { DEBUG = false } = process.env;

export default function debug(...m) {
  if (DEBUG) {
    console.info(...m);
  }
}
