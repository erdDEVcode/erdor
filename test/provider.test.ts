import { WALLETS } from 'narya'

import { BasicWallet, ProxyProvider, setDefaultGasPriceAndLimit } from '../dist/cjs'

const { PROXY_ENDPOINT } = require('./utils')

describe('ProxyProvider', () => {
  let proxy: ProxyProvider

  beforeEach(async () => {
    proxy = new ProxyProvider(PROXY_ENDPOINT)
  })

  it('can get network config', async () => {
    const nc = await proxy.getNetworkConfig()
    expect(nc.chainId).toEqual('local-testnet')
  })

  it('can get address details', async () => {
    const { bech32: address } = WALLETS.alice
    const account = await proxy.getAddress(address)
    expect(account).toBeDefined()
    account.address.should.eql(address)
  })

  it('sign, send and wait for a transfer transaction, then get its on-chain form', async () => {
    const wallet1 = BasicWallet.fromJsonKeyFileString(JSON.stringify(WALLETS.alice), 'password')
    const wallet2 = BasicWallet.fromJsonKeyFileString(JSON.stringify(WALLETS.bob), 'password')

    const startingBalance = (await proxy.getAddress(wallet2.address())).balance

    const tx = await setDefaultGasPriceAndLimit({
      sender: wallet1.address(),
      receiver: wallet2.address(),
      value: '1',
    }, proxy)

    const signedTx = await wallet1.signTransaction(tx, proxy)
    expect(signedTx).toBeDefined()

    const receipt = await proxy.sendSignedTransaction(signedTx)
    expect(receipt.hash).toBeDefined()

    await proxy.waitForTransaction(receipt.hash)

    const endingBalance = (await proxy.getAddress(wallet2.address())).balance

    // TODO: check balance differences
    
    const txOnChain = await proxy.getTransaction(receipt.hash)
    expect(txOnChain.raw).toBeDefined()
  })
})
