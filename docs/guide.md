## Introduction

The **elrondjs** library is a Javascript library for working with the [Elrond](https://elrond.com) blockchain.

Some of it's features:

* Generate and load wallets, sign and broadcast transactions
* Query the blockchain and work with smart contracts
* Cross-platform: Works in Node.js, Browser, Web workers and React Native.
* Typescript definitions.

This guide will go through the main concepts and how to use it.

## Getting started

_Note: throughout this guide we're going to assume you already have Node.js installed and that you have some experience programming with Node.js and Javascript in general._

Install the [NPM](npmjs.com) package:

```shell
npm install --save elrondjs
```

Now let's use it to check on our [eGLD delegation rewards](https://elrond.com/blog/egold-delegation-waiting-list-guide/) on the Elrond mainnet. In an editor enter:

```js
const { 
  Contract, 
  ProxyProvider, 
  BasicWallet, 
  ContractQueryResultDataType, 
  addressToHexString, 
  parseQueryResult 
} = require('elrondjs')

;(async () => {
  // create connection to network
  const proxy = new ProxyProvider('https://gateway.elrond.com')

  // load wallet
  const wallet = BasicWallet.fromMnemonic('YOUR MNEMONIC HERE')

  // create interface to official delegation contract
  const c = await Contract.at('erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt', {
    provider: proxy,
    signer: wallet,
    sender: wallet.address(),
  })

  // get delegation rewards
  const ret = await c.query('getClaimableRewards', [ addressToHexString(wallet.address()) ])

  // parse
  const claimable = parseQueryResult(ret, { type: ContractQueryResultDataType.INT })
  console.log(claimable)
})()
```

_Note: make sure to replace `'YOUR MNEMONIC HERE'` in the above code example with a wallet mnemonic of your choice. You can create a new Elrond wallet by visiting [https://wallet.elrond.com](https://wallet.elrond.com)._

If you run this script in your shell it should output a single number corresponding to the total delegation rewards which can be claimed for the wallet represented by the mnemonic. For example, if you try it with the mnemonic `wine connect affair surge wealth wide pact naive cry cover sadness casino` it will return `0`.

Congratulations! You've just made a successful call to a contract on the Elrond mainnet. Now let's try claiming any outstanding rewards by sending a transaction to the chain:

_Note: ensure you have enough eGLD in your wallet to cover the transaction fee_.

```js
const { 
  Contract, 
  ProxyProvider, 
  BasicWallet, 
  ContractQueryResultDataType, 
  addressToHexString, 
  parseQueryResult 
} = require('.')

;(async () => {
  // create connection to network
  const proxy = new ProxyProvider('https://gateway.elrond.com')

  // load wallet
  const wallet = BasicWallet.fromMnemonic('YOUR MNEMONIC HERE')

  // create contract interface
  // and tell it to use our provider and wallet
  const c = await Contract.at('erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt', {
    provider: proxy,
    signer: wallet,
    sender: wallet.address(),
  })

  // claim delegation rewards
  await c.invoke('claimRewards')
})()
```

If you run this without any errors then you'll have just sent a transaction to the delegation contract to claim pending rewards.

## Querying a network

Communication with an Elrond network is done through a `Provider` instance.

Elrondjs provides a concrete implementation known as the `ProxyProvider`. This provider which connects to an [Elrond Proxy](https://docs.elrond.com/tools/proxy) and can be initialized as follows:

```js
const { ProxyProvider } = require('elrondjs')

const provider = new ProxyProvider('https://gateway.elrond.com')
```

_Note: `gateway.elrond.com` is the official Elrond mainnet proxy maintained by the Elrond team. Feel free to replace this with your own Proxy endpoint address_.

Providers must implement the following API:

* `getNetworkConfig: () => Promise<NetworkConfig>` - get network information
* `getAddress: (address: string) => Promise<Address>` - get information about an address
* `queryContract: (params: ContractQueryParams) => Promise<ContractQueryResult>` - read from a contract
* `sendSignedTransaction: (signedTx: SignedTransaction) => Promise<string>` - broadcast a transaction to the network
* `waitForTransaction: (txHash: string) => Promise<TransactionReceipt>` - wait for transaction to finish executing on the network
* `getTransaction: (txHash: string) => Promise<TransactionOnChain>` - get transaction information

The `ProxyProvider` constructor takes a second parameter which can be used to configure its default request settings:

```js
const provider = new ProxyProvider('endpoint URL', {
  callOptions: { // options to apply to all requests
    timeout: 5000, // milliseconds
    headers: {
      'X-Custom-Header': 'value',
    },
  }
})
```

The `onRequest` and `onResponse` properties allow for hooking into the request-response process so that you inspect the raw data that gets passed to the underlying [axios](https://www.npmjs.com/package/axios) request package:

```js
const provider = new ProxyProvider('endpoint URL', {
  onRequest: (urlPath, requestOptions) => {
    // will get called for every request, and provides the raw request data that gets passed to Axios
  },
  onResponse: (urlPath, requestOptions, response, error) => {
    // the raw response or error returned for the given request from Axios
  },
})
```

### Get network config

Basic configuration information about a network can be queried using the `getNetworkConfig()` method, to obtain a `NetworkConfig` instance:

```js
await provider.getNetworkConfig()
```

For example, running the above on the public mainnet returns:

```js
{
  version: 'v1.1.10.0',
  chainId: '1',
  gasPerDataByte: 1500,
  minGasPrice: 1000000000,
  minGasLimit: 50000,
  minTransactionVersion: 1
}
```

### Get address information

To get information about an address:

```js
await provider.getAddress('erd1qqqqq...')
```

This will return an `AddressInfo` object with the following structure:

* `address` - bech32 format address 
* `balance` - eGLD balance
* `nonce` - next transaction nonce
* `username` - the [username ("herotag")](https://elrond.com/blog/elrond-distributed-name-service/) mapped to this addresss
* `code` - bytecode at address (empty if not a smart contract address)


## Signing transactions

To sign transactions a `Signer` implementation is needed:

```js
{
  signTransaction: (tx: Transaction, provider: Provider) => Promise<SignedTransaction>,
}
```

Any object that implements the above interface can be used to sign transactions. 

### Wallets

A `Wallet` usually represents an externally-owned address and extends the `Signer` interface.

Elrondjs has built-in support for loading the following types of user wallets:

* `BasicWallet` - Mnemonic, PEM and/or JSON files
* `LedgerWallet` - Ledger hardware wallets

For example:

```js
const { BasicWallet } = require('elrondjs')

const wallet = BasicWallet.fromMenmonic('tourist judge garden detail summer differ want voyage foot good design text')
```

Sometimes you may wish to create a _dummy_ wallet for testing purposes. This can be done as follows:

```js
const { BasicWallet } = require('elrondjs')

const wallet = BasicWallet.generateRandom()
```

To connect to a Ledger hardware wallet one or more [transports](https://github.com/LedgerHQ/ledgerjs#ledgerhqhw-transport-) will need to be passed in. For example, to connect to Ledger in a browser environment:

```js
const TransportWebUsb = require('@ledgerhq/hw-transport-webusb').default
const TransportU2F = require('@ledgerhq/hw-transport-u2f').default

const { LedgerWallet } = require('elrondjs')

// The first transport that works will be the one that's used for all subsequent calls
const wallet = await LedgerWallet.connect([ TransportWebUsb, TransportU2F ])
```

Wallets additionally provide the ability to retrieve the signer address:

```js
const wallet = BasicWallet.generateRandom()

console.log( wallet.address() ) // erd1q.....
```

## Transactions

Transactions may involve value transfers (eGLD and tokens) and/or smart contract interactions. 

An unsigned `Transaction` must at minimum contain:

* `sender` - sender address in bech32 format
* `receiver` - receiver address in bech32 format
* `value` - Amount of eGLD to transfer (denominated in `10^18`, i.e. the value `1 * 10^18` represents `1 eGLD`)

They may also additionally specify the following properties:

* `nonce` - the nonce to use
* `gasPrice` - gas price to use
* `gasLimit` - gas limit to use
* `data` - data string to send alongside transaction
* `meta` - additional configuration to pass to the signer

_Note: the `meta` parameter is non-standard and optional, and is meant for customizing the UI and/or performing custom configuration on the `Signer`. It does not get passed to the network._

### Simple transaction

A simple transaction can be constructed as follows:

```js
const { BigVal } = require('elrondjs')

const tx = {
  sender: 'erd1tmz6ax3ylejsa3n528uedztrnp70w4p4ptgz23harervvnnf932stkw6h9',
  receiver: 'erd19hdzdg2tmjmfk2kvplsssf3ps7rnyaumhpjhg0l50r938hftkh2qr4cu92',
  value: new BigVal(2, 'coins') // 2 eGLD
}
```

To sign a transaction we need a `Signer` instance. The `BasicWallet` class implements the `Signer` interface and thus an instance of it can be used to sign a transaction:

```js
const wallet = ... // create a wallet instance
const provider = ... // create a Provider instance
const tx = ... // create a Transaction instance

// Signing a transaction requires access to a Provider so that the signer can set the correct nonce, transaction version, etc.
await signedTx = await wallet.signTransaction(tx, provider) 
```

A `SignedTransaction` can be broadcast to the network using a provider:

```js
const hash = await provider.sendSignedTransaction(signedTx)
```

Once a transaction has been broadcast to the network a hash is returned. This can be used to wait until the transaction has finished executing:

```js
try {
  const receipt = await provider.waitForTransaction(hash)

  console.log('Succeeded', receipt.transactionOnChain)
} catch (err) {
  console.error('Failed')

  // The "receipt" contains the TransactionReceipt instance
  console.log(err.receipt.transactionOnChain)
}
```


### Auto-calculate gas 

The gas price and gas limits can be auto-calculated:

```js
const tx = await setDefaultGasPriceAndLimit({
  sender: 'erd1tmz6ax3ylejsa3n528uedztrnp70w4p4ptgz23harervvnnf932stkw6h9',
  receiver: 'erd19hdzdg2tmjmfk2kvplsssf3ps7rnyaumhpjhg0l50r938hftkh2qr4cu92',
  value: new BigVal(2, 'coins'), // 2 eGLD
  data: 'test',
}, provider)

/*
tx.gasPrice and tx.gasLimit will now be set according to network defaults
*/
```

### Query transaction status

And at any time the status of a transaction can be queried through the provider to obtain a `TransactionOnChain` instance:

```js
const txOnChain = await provider.getTransaction(txReceipt.hash)
```

This returns an object with the following properties (in addition to core `Transaction` properties):

* `raw` - raw transaction data
* `smartContractResults` - list of smart contract result objects.
* `smartContractErrors` - list of smart contract error messages. If non-empty then transaction is marked as failed.
* `status` - transaction status - success, pending or failed


## Contracts

The `Contract` class provides the necessary methods for interacting with smart contracts. 

### Deploying

To deploy a new contract:

```js
const receipt = await Contract.deploy(/* bytecode */, /* contract metadata */, /* constructor arguments */, {
  provider: // Provider instance,
  signer: // Signer instance,
  sender: // sender address
})
```

For example:

```js
const { BasicWallet, ProxyProvider, Contract, numberToHex } = require('elrondjs')

const provider = new ProxyProvider('https://gateway.elrond.com')

const wallet = BasicWallet.generateRandom()

const adderWasm = fs.readFileSync(path.join(__dirname, 'adder.wasm'))

const { contract } = await Contract.deploy(addderWasm, { upgradeable: true }, [ numberToHex(3) ], {
  provider,
  signer: wallet,
  sender: wallet.address(),
})

console.log(`Contract has been deployed at: ${contract.address}`)
```

Contract metadata specifies the following properties about a contract and can be changed via an upgrade:

* `upgradeable` - whether this contract can be upgraded (default is no)
* `readable` - whether other contracts can read this contract's data without calling a getter
* `payable` - whether this contract can receive eGLD and ESDT tokens via a transfer (without calling one of its methods).

### Pre-calculate address

The contract deploment address is based on the sender's address and nonce and nothing else. It can thus easily be calculated ahead-of-time using:

```js
const expectedAddress = await Contract.computeDeployedAddress('erd1q...', provider)
```

We can go further and calculate the expected contract deployment address for a specific nonce:

```js
const expectedAddress = await Contract.computeDeployedAddressWithNonce('erd1q...', 23)
```


### Querying

To get a `Contract` instance to talk to an existing on-chain contract:

```js
const contract = await Contract.at('erdq1...')
```

If we supply a `Provider` then it will be queried to ensure that a contract exists at the given address:

```js
// this will throw an error if contract doesn't exist at the addres
const contract = await Contract.at('erdq1...', {
  provider: // Provider instance,
})
```

We pass in a `Provider` that is to be used for all subsequent requests. Note that we can also specify a default gas limit and gas price, etc to use for subsequent transactions.

To query a contract (i.e. call a read-only method on it):

```js
await contract.query('method name', [ /* method arguments */ ])
```

This will internally query the blockchain in read-only mode (i.e. not using a transaction) using the provider passed in during construction. The provider can be overridden on a per-call basis:

```js
await contract.query('method name', [ /* method arguments */ ], { 
  provider: ...// another Provider instance to use instead of the one passed in to the constructor
})
```

If the smart contract method you are querying makes use of the caller address and/or value transferred you can also set these using the transaction options:

```js
await contract.query('method name', [ /* method arguments */ ], { 
  provider: ..., // another Provider instance to use instead of the one passed in to the constructor
  sender: 'erd1343....',
  value: new BigVal(100, 'coins'), // 100 eGLD
})
```

### Parsing return values

When a contract is queries the return value is an array of one or more values. For example, the `getUserStakeByType` method of the Mainnet staking contract returns 5 values:

```js
const { addressToHexString } = require('elrondjs')

... // initialize contract object

const returnData = await contract.query('getUserStakeByType', [ addressToHexString('erd1a...')])

/*
  `returnData` is an array of values:

  1. Withdrawable amount (int)
  2. Amount in delegation queue (int)
  3. Amount actively delegated (int)
  4. Unstaked amount (int)
  5. Deferred pament amount (int)
*/
```

The raw returned data is usually in string format. To parse the data to obtain the value we want we use the `parseQueryResult()` method:

```js
// this will return a Number
const waitingStake = parseQueryResult(returnData, { index: 1, type: ContractQueryResultDataType.INT })
```

The `index` parameter above refers to the index of the desired value in the return data array. If ommitted then it's assumed to equal `0`. The `type` parameter specifies the expected data type of the final parsed result. Thus, in this example `waitingStake` will be of type `Number`. The currently supported types are:

* `BOOLEAN` (`Boolean`) - boolean values
* `INT` (`Number`) - integers
* `BIG_INT` (`BigVal`) - large integers
* `HEX` - (`string`) - hex strings
* `ADDRESS` (`string`) - bech32 addresses
* `STRING` (`string`) - general strings

The `BigVal` type is from the [bigval](https://github.com/erdDEVcode/bigval) library and is the recommended way of handling large numbers in your code. ElrondJS exports a copy of this library through its own API.

### Invoking via transaction

If we wish to send a transaction to a contract (i.e. write data) we need to pass in a `Signer` and set the `sender` address for transactions:

```js
const contract = await Contract.at('contract bech32 address here', {
  provider: ...// Provider instance,
  signer: ...// Signer instance, e.g. a wallet
  sender: ...// wallet bech32 address
})

await contract.invoke('method name', [ /* method arguments */])
```

This will internally do the following in sequence:

1. Use the `Provider` to fetch the current `NetworkConfig`
1. Use the current `NetworkConfig` to set the gas price and calculate the gas limit to be used
1. Sign the transaction using the `Signer`
1. Broadcast the `SignedTransaction` to the network using the `Provider`
1. Wait for transaction to finish executing using the `Provider.waitForTransaction()`

We can of course override the various values on a per-call basis:

```js
const contract = await Contract.at('contract bech32 address here', {
  provider: ...// Provider instance,
  signer: ...// Singer instance, e.g. an BasicWallet
  sender: ...// wallet bech32 address
})

await contract.invoke('method name', [ /* method arguments */], {
  provider: ...// new Provider instance
  signer: ...// new Signer instance
  sender: ...// different from address
  gasLimit: 250000000,
  gasPrice: 1000000,
  value: '123',
})
```

### Transferring eGLD and tokens

When invoking a contract method it is possible to transfer both eGLD and ESDT tokens as part of the call. The `TransactionOptions` parameter has the following properties which can be set:

* `value` (`string`) - eGLD amount to send (denominated in smallest unit).
* `esdt` (`TokenAmount`) - ESDT token amount to send.

For example:

```js
const c = Contract.at('erd1qq....', { provider })

const t = await Token.new('MyToken', 'MYTOKEN', '1000', 18, ...)

await c.invoke('doSomething', [], {
  value: '1000000000000000000', // 1 eGLD
  esdt: {
    id: t.id,
    value: '999'
  }
})
```

_Note: It is not possible to transfer both eGLD and ESDT tokens in the same transaction. This is a limitation within the blockchain protocol itself._

### Upgrading

If a contract's current metadata marks it as upgradeable then it can be upgraded by its owner. This means that the bytecode gets changed but the 
contract on-chain address stays the same.

An example:

```js
const contract = await Contract.at('erdq1...', {
  provider,
  signer: wallet,
  sender: wallet.address(),
})

await contract.upgrade(/*new code wasm */, /* new metadata */, /* constructor args */)
```

### Function arguments

When passing arguments to contract functions it is necessary to format them as hex strings. 

The following utility methods are made available to facilitate this:

* `numberToHex()` - convert number to hex representation
* `stringToHex()` - convert string to hex representation

For example, given a contract function `getValues()` which takes a string and an integer as parameters:

```js
const c = Contract.at('erd1qq....', { provider })

const ret = await c.query('getValues', [
  stringToHex("name"),
  numberToHex(5)
])
```


## Tokens

ESDT tokens are supported out-of-the-box using the `Tokens` class. 

### List all tokens

To fetch a list of all available tokens:

```js
const { Token } = require('elrondjs')

const ids = await Token.getAllTokenIds({ provider })
```

This returns the list of unique identifiers of each token. To obtain more detailed information about a token you will 
need to use load each individual token and then call the `getInfo()` method (see below).

### Creating a new token

```js
const { BigVal } = require('elrondjs')

const token = await Token.new(
  'TokenName', // name
  'TICKER', // ticker
  new BigVal('1000'), // supply
  18, // num decimals
  {
    // a "TokenConfig" object
    canBurn: false,
    canChangeOwner: false,
    canFreeze: false,
    canMint: false,
    canPause: false,
    canUpgrade: false,
    canWipe: false,
  },
  { 
    provider,
    signer,
    sender,
  }
)

console.log(token.id) // unique token identifier
```

_Note: the `sender` account will be set as the initial owner of the token._


### Using an existing token

To load an existing token:

```js
const token = await Token.load('unique token id', { provider })
```

### Common operations

Once a `Token` instance has been obtained, the following operations are available:

* `getInfo()` - get information about the token including its owner, pause status, configuration, etc
* `balanceOf()` - get token balance for given address
* `transfer()` - send tokens to another address
* `mint()` - mint more tokens to owner or to a specific address
* `burn()` - burn one's own tokens
* `pause()` - pause token minting and transfers
* `unPause()` - undo a previous `pause()` call
* `freeze()` - freeze the token balance owned by a specific address
* `wipe()` - erase a prevously frozen address's token balance 
* `changeOwner()` - transfer ownership of the token to another address
* `updateConfig()` - update the token configuration

For example, transferring tokens to another address:

```js
await token.transfer('recipient bech32 address', '100')  // send 100 tokens to recipient
```

## Usernames ("herotags")

The [Elrond DNS](https://elrond.com/blog/elrond-distributed-name-service/) system powers the user-friendly usernames you see throughout (also known as _herotags_ in [Maiar](https://maiar.com)). 

Finding the username mapped to an address is done via the `Proxy.getAddress()` call, as shown earlier. In this section we will outline how to resolve from the username back to the address as well as how to register new usernames.

### Resolving a name

To resolve an existing username to the address it is mapped to:

```js
const { Dns } = require('elrondjs')

const dns = new Dns({ 
  provider: // Provider instance,
  signer: // Signer instance,
  sender: // sender address
})

// let's resolve the `testname` username:
const address = await dns.resolve('testname.elrond')
```

Notice that username must always be specified in the format `XXX.elrond`, otherwise the call will fail.

### Registering a name

To register a new username against an address the transaction must be signed by that address, i.e. you can only a register a username 
for the address you are sending from:

```js
const { Dns } = require('elrondjs')

const dns = new Dns({ 
  provider: // Provider instance,
  signer: // Signer instance,
  sender: // sender address <- the username will resolve to this address
})

// let's register the `funkytown` username/herotag for the sender address
await dns.register('funkytown.elrond')
```

And that's it! If you now try to resolve `funkytown.elrond` it should give you the sender address.

_NOTE: If the above call fails then it's likely because `funkytown` has already been registered, so feel free to try other words._

## Typescript support

First-class support for Typescript is built-in. Even the [API docs](/docs/api) are generated from the Typescript source code and comments.


