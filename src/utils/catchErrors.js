/**
 * @param {function} fn fall sem á að gripa villur fyrir
 * @returns villumelding eða næsta middleware
 */
export default function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}
