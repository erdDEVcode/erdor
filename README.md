# DEPRECATED - elrond.js is now deprecated and no longer maintained. Please use [@elrondnetwork/erdjs](https://www.npmjs.com/package/@elrondnetwork/erdjs) instead.**

[![NPM module](https://badge.fury.io/js/elrondjs.svg)](https://badge.fury.io/js/elrondjs)
[![Join the community](https://img.shields.io/badge/Chat%20on-Telegram-brightgreen.svg?color=0088cc)](https://t.me/erdDEV)
[![Follow on Twitter](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/erd_dev)

Javascript SDK for the [Elrond](https://elrond.com) blockchain.

Features:

* Generate and load wallets (Ledger wallets too!)
* Sign and broadcast transactions
* Query the blockchain and work with smart contracts
* Cross-platform: Node.js, Browser, Web workers and React Native.
* Typescript definitions 🔥
* Full [documentation](https://github.com/erdDEVcode/elrondjs/blob/master/docs/guide.md)

## Installation

```
npm install --save elrondjs
```

_Note: If using with [React Native](https://reactnative.dev/) you will need to use a [shim](https://www.npmjs.com/package/react-native-crypto)._

## Usage

**Example - Claiming rewards from the Mainnet delegation contract**

```js
import { Contract, ProxyProvider, BasicWallet } from 'elrondjs'

;(async () => {
  // create connection to network
  const proxy = new ProxyProvider('https://api.elrond.com')

  // load wallet
  const wallet = BasicWallet.fromMnemonic('YOUR MNEMONIC HERE')

  // create contract interface
  // and tell it to use our provider and wallet
  const c = await Contract.at('erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt', {
    provider: proxy,
    signer: wallet,
    sender: wallet.address(),
  })

  // make the claim!
  await c.invoke('claimRewards', [], {
    gasLimit: 250000000
  })
})()
```

## Contributors guide

To build the lib and watch for changes:

```
npm run dev
```

To build the lib for production:

```
npm run build
```

To build the docs:

```
npm run build-docs
```

To publish a new release:

```
npm run release
```

To run the tests, first run `npm run devnet` in a separate terminal to start a local test network. Then run:

```
npm test
```


## License

ISC

