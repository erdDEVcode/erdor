import { BigVal } from 'bigval'
import { WALLETS } from 'narya'

import { BasicWallet, LedgerWallet, ProxyProvider } from '../src'
import { expect, PROXY_ENDPOINT } from './utils'

const MNEMONIC = 'fringe dry little minor note hundred lottery garment announce space throw captain seven slim common piece blame battle void pistol diagram melody phone mother'

describe('BasicWallet', () => {
  const proxy = new ProxyProvider(PROXY_ENDPOINT)

  it('can generate a random wallet', async () => {
    const w = BasicWallet.generateRandom()
    expect(w.address().length > 1).to.be.true
  })

  it('can load from a mnemonic', async () => {
    const w = BasicWallet.fromMnemonic(MNEMONIC)
    w.address().should.eql('erd1tcylw3y4s2y43xps0cjuvgql2zld9aze4c7ku6ekhezu39tpag5q6audht')
  })

  it('can load from a JSON file string', async () => {
    const w = BasicWallet.fromJsonKeyFileString(JSON.stringify(WALLETS.alice), 'password')
    w.address().should.eql('erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th')
  })

  it('can load from a PEM file string', async () => {
    const w = BasicWallet.fromPemFileString(`-----BEGIN PRIVATE KEY for erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th-----
NDEzZjQyNTc1ZjdmMjZmYWQzMzE3YTc3ODc3MTIxMmZkYjgwMjQ1ODUwOTgxZTQ4
YjU4YTRmMjVlMzQ0ZThmOTAxMzk0NzJlZmY2ODg2NzcxYTk4MmYzMDgzZGE1ZDQy
MWYyNGMyOTE4MWU2Mzg4ODIyOGRjODFjYTYwZDY5ZTE=
-----END PRIVATE KEY for erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th-----`)

    w.address().should.eql('erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th')
  })

  it('can sign a transaction with minimal tx info', async () => {
    const w = BasicWallet.fromMnemonic(MNEMONIC)

    const signedTransaction = await w.signTransaction({
      sender: w.address(),
      receiver: w.address(),
      value: new BigVal(1, 'coins'),
    }, proxy)

    expect(signedTransaction).to.deep.equal({
      nonce: 0,
      value: '1000000000000000000',
      receiver: 'erd1tcylw3y4s2y43xps0cjuvgql2zld9aze4c7ku6ekhezu39tpag5q6audht',
      sender: 'erd1tcylw3y4s2y43xps0cjuvgql2zld9aze4c7ku6ekhezu39tpag5q6audht',
      data: '',
      chainId: 'local-testnet',
      version: 1,
      signature: '26e145a58f5fbd6bbc46ad771518e9dc1208db7e03195aaf9ca8846708b95177d3518f99793c081c8210a0cfebe42850debb6f5b06009818cb6abe73f9e47e08'
    })
  })

  it('can sign a transaction with some extra info set', async () => {
    const w = BasicWallet.fromMnemonic(MNEMONIC)

    const signedTransaction = await w.signTransaction({
      sender: w.address(),
      receiver: w.address(),
      value: new BigVal(1, 'coins'),
      nonce: 53,
      gasPrice: 50000,
      gasLimit: 200000,
    }, proxy)

    expect(signedTransaction).to.deep.equal({
      nonce: 53,
      value: '1000000000000000000',
      receiver: 'erd1tcylw3y4s2y43xps0cjuvgql2zld9aze4c7ku6ekhezu39tpag5q6audht',
      sender: 'erd1tcylw3y4s2y43xps0cjuvgql2zld9aze4c7ku6ekhezu39tpag5q6audht',
      gasPrice: 50000,
      gasLimit: 200000,
      data: '',
      chainId: 'local-testnet',
      version: 1,
      signature: '54c5b4bddf71812f811bdbae1751fae628d30e4f246875d429f127ec34128cba25d31a369f23193ea890b9ef59092336fcff1618e7120cce43f6c8b2d1a59108'
    })
  })

  it('can be serlialized and deserialized', async () => {
    const w = BasicWallet.fromMnemonic(MNEMONIC)

    const s = w.serialize()

    expect(typeof s).to.equal('string')
    expect(!!s).to.be.true

    expect(BasicWallet.canDeserialize(s)).to.be.true
    expect(BasicWallet.canDeserialize('test')).to.be.false

    const w2 = BasicWallet.fromSerialized(s)
    expect(w2).to.be.instanceOf(BasicWallet)

    w2.address().should.eql('erd1tcylw3y4s2y43xps0cjuvgql2zld9aze4c7ku6ekhezu39tpag5q6audht')
  })

  it('will fail to deserialize corrupted data', async () => {
    const w = BasicWallet.fromMnemonic(MNEMONIC)

    const s = w.serialize()

    const s1 = `d${s}`
    const s2 = `${s}d`

    expect(BasicWallet.canDeserialize(s1)).to.be.false
    expect(BasicWallet.canDeserialize(s2)).to.be.true

    expect(() => BasicWallet.fromSerialized(s1)).to.throw
    expect(() => BasicWallet.fromSerialized(s2)).to.throw
  })
})
