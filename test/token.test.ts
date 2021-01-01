import { WALLETS } from 'narya'
import delay from 'delay'

import { expect, PROXY_ENDPOINT } from './utils'
import { BasicWallet, ProxyProvider, Token } from '../dist/cjs'

describe('ESDT tokens', () => {
  const provider = new ProxyProvider(PROXY_ENDPOINT)
  const signer = BasicWallet.fromJsonKeyFileString(JSON.stringify(WALLETS.bob), 'password')
  const sender = signer.address()

  it('can list existing tokens', async () => {
    const ids = await Token.getAllTokenIds({ provider })
    expect(ids).to.be.instanceOf(Array)
  })

  it('can create a new token', async () => {
    const t = await Token.new(
      'RamToken', 
      'RAM', 
      '10000', 
      18, 
      {
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

    expect(t.id).to.exist

    const info = await t.getInfo()

    expect(info.name).to.eql('RamToken')
    expect(info.ticker).to.eql('RAM')
    expect(info.supply).to.eql('10000')
    expect(info.decimals).to.eql(18)
    expect(info.owner).to.eql(WALLETS.bob.bech32)
    expect(info.config.canBurn).to.be.false
    expect(info.config.canChangeOwner).to.be.false
    expect(info.config.canFreeze).to.be.false
    expect(info.config.canMint).to.be.false
    expect(info.config.canPause).to.be.false
    expect(info.config.canUpgrade).to.be.false
    expect(info.config.canWipe).to.be.false
  })

  it('can create a new token with custom config', async () => {
    const t = await Token.new(
      'RamToken',
      'RAM',
      '10000',
      18,
      {
        canBurn: false,
        canChangeOwner: true,
        canFreeze: false,
        canMint: true,
        canPause: false,
        canUpgrade: true,
        canWipe: false,
      },
      {
        provider,
        signer,
        sender,
      }
    )

    expect(t.id).to.exist

    const info = await t.getInfo()

    expect(info.config.canBurn).to.be.false
    expect(info.config.canChangeOwner).to.be.true
    expect(info.config.canFreeze).to.be.false
    expect(info.config.canMint).to.be.true
    expect(info.config.canPause).to.be.false
    expect(info.config.canUpgrade).to.be.true
    expect(info.config.canWipe).to.be.false
  })

  describe('once issued', () => {
    let token: Token

    beforeAll(async () => {
      const name = `RAM${~~(Math.random() * 1000)}`

      token = await Token.new(
        name,
        name,
        '100000000000000000000', /* 100 * 10^18 */
        18,
        {
          canBurn: true,
          canChangeOwner: true,
          canFreeze: true,
          canMint: true,
          canPause: true,
          canUpgrade: true,
          canWipe: true,
        },
        {
          provider,
          signer,
          sender,
        }
      )

      // give time for data to be saved in node
      await delay(15000)
    })

    it('can be transferred', async () => {
      await token.balanceOf(sender).should.eventually.eql('100000000000000000000')

      const reciever = WALLETS.eve.bech32
      const rec = await token.transfer(reciever, '100')
      await rec.promise()

      await token.balanceOf(reciever).should.eventually.eq('100')
      await token.balanceOf(sender).should.eventually.eql('99999999999999999900')
    })

    it('can mint more to the owner', async () => {
      const rec = await token.mint('1')
      await rec.promise()

      await delay(15000)

      await token.balanceOf(sender).should.eventually.eql('99999999999999999901')

      const info = await token.getInfo()
      expect(info.supply).to.eql('100000000000000000001')
    })

    it('can mint more to any address', async () => {
      const rec = await token.mint('1', WALLETS.dan.bech32)
      await rec.promise()
      
      await delay(15000)

      await token.balanceOf(WALLETS.dan.bech32).should.eventually.eql('1')

      const info = await token.getInfo()
      expect(info.supply).to.eql('100000000000000000002')
    })
  })
})