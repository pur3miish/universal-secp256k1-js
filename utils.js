import hmac_sha256 from "./hmac_sha256.js";
/**
 * Converts a byte array to a BigInt number.
 *
 * @param {Uint8Array} array - The byte array to convert.
 * @returns {bigint} The corresponding BigInt number.
 *
 * @example
 * const byteArray = new Uint8Array([ 7, 91, 205, 21, 48, 57 ]);
 * const number = arrayToNumber(byteArray);
 * console.log(number); // 123456789n
 */
export function number_to_array(number) {
  let hn = number.toString(16);
  // Pad the string to make sure it has an even length
  hn = hn.length % 2 ? hn.padStart(hn.length + 1, "0") : hn;
  // Create a Uint8Array from the hex string
  return Uint8Array.from(
    hn.match(/[a-f0-9A-F]{2}/gmu).map((i) => Number(`0x${i}`))
  );
}
/**
 * Converts a byte array to a BigInt number.
 *
 * @param {Uint8Array} array - The byte array to convert.
 * @returns {bigint} The corresponding BigInt number.
 *
 * @example
 * const byteArray = new Uint8Array([ 7, 91, 205, 21, 48, 57 ]);
 * const number = arrayToNumber(byteArray);
 * console.log(number); // 123456789n
 */
export function array_to_number(array) {
  return BigInt(
    `0x${array.reduce(
      (acc, i) => (acc += i.toString(16).padStart(2, "0")),
      ""
    )}`
  );
}
export const secp256k1 = Object.freeze({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
  mod: 115792089237316195423570985008687907853269984665640564039457584007908834671663n,
  n: 115792089237316195423570985008687907852837564279074904382605163141518161494337n,
  a: 0x0000000000000000000000000000000000000000000000000000000000000000n,
  b: 0x0000000000000000000000000000000000000000000000000000000000000007n,
  h: 1n,
});
export const powmod = (number, exponent, m) => {
  let r = 1n;
  let b = number % m;
  let e = exponent;
  if (b == 0n) return 0n;
  while (e > 0n) {
    if (e % 2n) r = (r * b) % m;
    e = e >> 1n;
    b = b ** 2n % m;
  }
  return r;
};
export function get_mod(val, mod) {
  return ((val % mod) + mod) % mod;
}
/**
 * Calculate the Modular Multiplicative Inverse
 * @kind function
 * @name mul_inverse
 * @param {bigint} val Value to perform modular multiplicitve inverse on.
 * @param {bigint} mod Modulo
 * @returns {bigint} the modular multiplicitve inverse of a `val`.
 */
export function mul_inverse(val, mod) {
  let dst, t, q;
  let b = mod;
  let a = get_mod(val, mod);
  const b0 = mod;
  let x0 = 0n;
  let x1 = 1n;
  if (mod == 1n) dst = 1n;
  else
    while (a > 1n) {
      q = a / b;
      t = b;
      dst = a % b;
      b = dst;
      a = t;
      t = x0;
      q = x0 * q;
      x0 = x1 - q;
      x1 = t;
    }
  if (x1 < 0n) x1 = x1 + b0;
  dst = x1;
  return dst;
}
/* Calculates a new point on the ECC curve. */
export function calc_new_point(Q, P, λ, mod) {
  const x = get_mod(get_mod(λ * λ, mod) - P.x - Q.x, mod);
  const y = get_mod(get_mod((P.x - x) * λ, mod) - P.y, mod);
  return { x, y };
}
/* Addition of two coordinates on an ECC curve. */
export function add(Q, P, mod) {
  const x = mul_inverse(P.x - Q.x, mod);
  const y = get_mod(get_mod(P.y - Q.y, mod) * x, mod); // slope
  return calc_new_point(Q, P, y, mod);
}
/* Doubling of two coordinates on an ECC curve. */
export function dbl(G, mod) {
  const numerator = get_mod(get_mod(G.x * G.x, mod) * 3n, mod);
  const denominator = get_mod(mul_inverse(2n * G.y, mod) * numerator, mod);
  return calc_new_point(G, G, denominator, mod);
}
export function double_and_add(G, k, mod, n) {
  k = get_mod(k, n);
  if (k == 1n) return G;
  else if (k % 2n) return add(double_and_add(G, k - 1n, mod, n), G, mod);
  else return double_and_add(dbl(G, mod), k / 2n, mod, n);
}
export function point_from_x(odd, x) {
  const { mod, b, a } = secp256k1;
  odd = BigInt(odd);
  const alpha = get_mod(
    get_mod(get_mod(BigInt(x) ** 3n, mod) + get_mod(a * x, mod), mod) + b,
    mod
  );
  let y = powmod(alpha, mod / 4n + 1n, mod);
  // @ts-expect-error TS annoying error
  if (!(y % 2n) ^ !odd) y = mod - y;
  return { x, y };
}
export async function get_signature(T, e, d, buffers, racid = 0) {
  const { x, y, mod, n } = secp256k1;
  const G = { x, y };
  let r, s;
  async function update_T({ buf_h2b, buf_F }) {
    const buf_pad_v = Uint8Array.from([...buf_h2b, 0]);
    const buf_k = await hmac_sha256(buf_pad_v, buf_F);
    const bufv = await hmac_sha256(buf_h2b, buf_k);
    const bufv2 = await hmac_sha256(bufv, buf_k);
    return array_to_number(bufv2);
  }
  const x1 = T - n;
  if (x1 >= 0n || 0n >= T)
    return get_signature(await update_T(buffers), e, d, buffers);
  let val = T;
  const Q = double_and_add(G, val, mod, n);
  if (Q.x == 0n && Q.y == 0n)
    return get_signature(await update_T(buffers), e, d, buffers);
  // https://bitcoin.stackexchange.com/questions/83035/how-to-determine-first-byte-recovery-id-for-signatures-message-signing
  let v = 0n;
  if (Q.x > n) v = 2n;
  r = number_to_array(Q.x);
  val = get_mod(mul_inverse(T, n) * (Q.x * d + e), n);
  // @ts-expect-error - it works in JS but niot ts
  if (Q.y % 2n) racid = 1n | v;
  // @ts-expect-error - it works in JS but niot ts
  else racid = 0n | v;
  // Enforce low S values, see BIP62.  if x coordinate is larger than order n
  if (buffers.canonical && val > n / 2n) {
    val = n - val;
    // @ts-expect-error - it works in JS but niot ts
    racid = racid ^ 1n; // XOR recovery id
  }
  s = number_to_array(val);
  return { r, s, racid };
}
