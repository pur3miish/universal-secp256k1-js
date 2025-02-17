# Isomorphic SEPC256K1 JS

[![NPM Package](https://img.shields.io/npm/v/isomorphic-secp256k1-js.svg)](https://www.npmjs.org/package/isomorphic-secp256k1-js) [![CI status](https://github.com/pur3miish/isomorphic-secp256k1-js/workflows/CI/badge.svg)](https://github.com/pur3miish/isomorphic-secp256k1-js/actions) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pur3miish/isomorphic-secp256k1-js/blob/main/LICENSE)

An ultra lightweight [Universal](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) (Browser and Node) JavaScript [Elliptic Curve Digital Signature Algorithm](https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm) (ECDSA) for secp256k1 curve that is used for many blockchains.

## Exports

The [npm](https://npmjs.com) package doesn’t have a main index module, so use deep imports from the ECMAScript modules that are exported via the [`package.json`](./package.json) field [`exports`](https://nodejs.org/api/packages.html#exports):

Three main functions for recovering public key from a secp256k1 signature, signing and recovering public key from private key.

- [`recover_public_key.js`](./src/recover_public_key.ts)
- [`sign.js`](./src/sign.ts)
- [`get_public_key.js`](./src/get_public_key.ts)

And Some utility functions.

- [`sha256.js`](./src/sha256.ts)
- [`hmac_sha256.js`](./src/hmac_sha256.ts)
- [`utils.js`](./src/utils.ts)

## Features

We have no sideEffects so the package can be tree shaken.

## Installation

For [Node.js](https://nodejs.org), to install [`isomorphic-secp256k1-js`](https://npm.im/isomorphic-secp256k1-js) run:

```sh
npm i isomorphic-secp256k1-js
```

Then import:

## Examples

Recover public key from private key.

```js
const private_key = new Uint8Array([
  210, 101, 63, 247, 203, 178, 216, 255, 18, 154, 194, 126, 245, 120, 28, 230,
  139, 37, 88, 196, 26, 116, 175, 31, 45, 220, 166, 53, 203, 238, 240, 125,
]);

// Compressed public key.
console.log(get_public_key(private_key));
```

Generate a secp25k1 digital signature.

```js
const private_key = new Uint8Array([
  210, 101, 63, 247, 203, 178, 216, 255, 18, 154, 194, 126, 245, 120, 28, 230,
  139, 37, 88, 196, 26, 116, 175, 31, 45, 220, 166, 53, 203, 238, 240, 125,
]);

const data = Uint8Array.from([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
]);

sign({ hash: data, private_key }).then(console.log);
```

> The logged output is { r: [23, …, 89], s: [111, …, 142], v: 1 }

```js
const { number_to_array } = await import("isomorphic-secp256k1-js/utils");

const key_pair = await recover_public_key({
  data,
  signature: {
    r: number_to_array(
      50172533143525448505731076092836454339589141171079665638497512992118311974590n
    ),
    s: number_to_array(
      3372897403575535231543296615264124933490702058654620386530787287980439847001n
    ),
    v: 0,
  },
});
console.log(key_pair);
```

> Logged output was Uint8Array(33) [2,192,222,210,188,31,19,5,…

## Requirements

Supported runtime environments:

- [Node.js](https://nodejs.org) versions `>=16.0.0`.
- Browsers matching the [Browserslist](https://browsersl.ist) query [`> 0.5%, not OperaMini all, not dead`](https://browsersl.ist/?q=%3E+0.5%25%2C+not+OperaMini+all%2C+not+dead).
