/**
 * Network configuration.
 * 
 * These values are obtained by querying an Elrond network.
 */
export interface NetworkConfig {
  /**
   * The version of the Elrond software running on the network.
   */
  version: string,
  /**
   * The unique id of the chain.
   */
  chainId: string,
  /**
   * Gas limit per byte of data sent with a transaction.
   */
  gasPerDataByte: number,
  /**
   * The minimum gas limit of a basic transaction, excluding the gast cost of additional data sent along.
   */
  minGasLimit: number,
  /**
   * The minimum gas price for sending transactions.
   */
  minGasPrice: number,
  /**
   * The minimum value for the transaction version field.
   */
  minTransactionVersion: number,
}

/**
 * Data for an Elrond address.
 * 
 * This may be an externally-owned account or a contract address.
 */
export interface Address {
  /**
   * The bech32 address.
   */
  address: string,
  /**
   * The balance.
   * 
   * Denominated in the smallest unit (10^18 eGLD).
   */
  balance: string,
  /**
   * The last nonce used for sending transactions.
   */
  nonce: number,
  /**
   * The code, if any, at this address.
   */
  code: string,
}


/**
 * ESDT token data for an Elrond address.
 * 
 * This may be an externally-owned account or a contract address.
 */
export interface TokenData {
  /**
   * The token identifer.
   */
  id: string,
  /**
   * The token balance.
   */
  balance: string,
}



/**
 * Contract metadata, used for when deploying/upgrading a contract.
 */
export interface ContractMetadata {
  /**
   * Whether the contract is upgradeable.
   */
  upgradeable?: boolean,
  /**
   * Whether other contracts can read this contract's data (without calling one of its pure functions).
   */
  readable?: boolean,
  /**
   * Whether the contract can receive eGLD and ESDT tokens via a transfer(without calling one of its methods).
   */
  payable?: boolean,
}


/**
 * Represents the parameters for querying a contract.
 */
export interface ContractQueryParams {
  /**
   * Address of the contract.
   */
  contractAddress: string,
  /**
   * Name of the function to call.
   */
  functionName: string,
  /**
   * Arguments to pass to the function.
   */
  args: string[],
}

/**
 * Represents the result of querying a contract.
 */
export interface ContractQueryResult {
  /**
   * The data returned from the query call.
   */
  returnData: string[],
  /**
   * The result code, indicating success or failure.
   */
  returnCode: string,
  /**
   * Amount of gas which would be refunded had this been a transaction.
   */
  gasRefund: number,
  /**
   * Amount of gas that would be unused had this been a transaction.
   */
  gasRemaining: number,
}

/**
 * Represents the different possible types of a query result.
 */
export enum ContractQueryResultDataType {
  /**
   * Boolean value.
   */
  BOOLEAN,
  /**
   * Integer.
   */
  INT,
  /**
   * Hex string.
   */
  HEX,
  /**
   * Generic string.
   */
  STRING,
  /**
   * Address string.
   */
  ADDRESS,
}

/**
 * Represents options for parsing a contract query result.
 */
export interface ContractQueryResultParseOptions {
  /**
   * The desired type to parse the result as.
   */
  type: ContractQueryResultDataType,
  /**
   * The index into the `returnData` array at which th result lies.
   */
  index?: number,
  /**
   * A regular expression for the parsing the result string to obtain the data.
   */
  regex?: RegExp,
}

/**
 * Represents an unsigned transaction.
 */
export interface Transaction {
  /**
   * The sender address in bech32 format.
   */
  sender: string,
  /**
   * The receiver address in bech32 format.
   */
  receiver: string,
  /**
   * The amount of eGLD to transfer.
   * 
   * Denominated in the smallest unit (10^18).
   */
  value: string,
  /** 
   * The sender nonce to use.
   */
  nonce?: number,
  /**
   * The gas price.
   * 
   * Denominated in the smallest unit (10^18).
   */
  gasPrice?: number,
  /**
   * The gas limit.
   */
  gasLimit?: number,
  /**
   * The data to send in the transaction.
   */
  data?: string,
  /**
   * Options to pass to the transaction signer.
   * 
   * The specific structure of this value will depend on the signer being used.
   */
  meta?: object,
}

/**
 * Represents a signed transaction.
 */
export interface SignedTransaction extends Transaction {
  /**
   * The transaction nonce.
   */
  nonce: number,
  /**
   * The network chain id.
   */
  chainId: string,
  /**
   * Transaction version.
   */
  version: number,
  /**
   * The signature.
   */
  signature: string,
}

/**
 * Represents a receipt returned from the blockchain for a transaction that was broadcast.
 */
export interface TransactionReceipt {
  /**
   * The final signed transaction.
   */
  signedTransaction: SignedTransaction,
  /**
   * The transaction hash, for tracking purposes.
   */
  hash: string,
  /**
   * Promise that resolves once transaction is complete
   */
  promise: () => Promise<TransactionOnChain>,
}


/**
 * Transaction status.
 */
export enum TransactionStatus {
  /**
   * This means the transaction is yet to be executed by the network.
   */
  PENDING = 0,
  /**
   * This means the transaction was executed by the network and performed all of its actions.
   */
  SUCCESS = 1,
  /**
   * This means the transaction failed to be executed by the network and/or failed to perform all of its actions.
   */
  FAILURE,
}

/**
 * Represents a previously broadcast transction.
 */
export interface TransactionOnChain extends Transaction {
  /**
   * Raw transaction data from the chain.
   */
  raw: object,
  /**
   * Smart contract error messages.
   */
  smartContractErrors: string[],
  /**
   * Transaction result status.
   */
  status: TransactionStatus,
}

/**
 * Interface for interacting with the Elrond network.
 */
export interface Provider {
  /**
   * Get configuration information for the chain.
   */
  getNetworkConfig: () => Promise<NetworkConfig>,
  /**
   * Get on-chain information for given address.
   * 
   * @param address The address.
   */
  getAddress: (address: string) => Promise<Address>,
  /**
   * Get ESDT token for given address and token.
   * 
   * @param address The address.
   * @param token The token id.
   * 
   * @return Balance as base-10 unsigned integer.
   */
  getESDTData: (address: string, token: string) => Promise<TokenData>,
  /**
   * Query a contract.
   * 
   * This will call the given contract function in read-only mode.
   *
   * @param params Contract query parameters.
   */
  queryContract: (params: ContractQueryParams) => Promise<ContractQueryResult>,
  /**
   * Broadcast a signed transaction to the network.
   *
   * @param signedTx The transaction.
   */
  sendSignedTransaction: (signedTx: SignedTransaction) => Promise<TransactionReceipt>,
  /**
   * Wait for a broadcast transaction to finish executing.
   * 
   * This will throw an `TransactionFailedError` if the transaction fails for any reason.
   *
   * @param txHash Hash of transaction to wait for.
   * @throws {TransactionFailedError} If transaction fails.
   */
  waitForTransaction: (txHash: string) => Promise<TransactionOnChain>,
  /**
   * Get information about a transaction.
   *
   * @param txHash Hash of transaction to query.
   */
  getTransaction: (txHash: string) => Promise<TransactionOnChain>,
}


/**
 * Interface for signing and sending transactions.
 */
export interface Signer {
  /**
   * Sign a transaction.
   * 
   * @param tx The transaction to sign.
   * @param provider The provider to use for querying chain information.
   */
  signTransaction: (tx: Transaction, provider: Provider) => Promise<SignedTransaction>,
}


/**
 * Represents a wallet.
 */
export interface Wallet extends Signer {
  /**
   * Get address of this wallet in bech32 format.
   */
  address: () => string,
}




/**
 * Options for interacting sending transactions.
 */
export interface TransactionOptions {
  /**
   * Sender bech32 address.
   */
  sender?: string,
  /**
   * Amount to transfer.
   * 
   * Denominated in the smallest eGLD unit (10^18).
   */
  value?: string,
  /**
   * Gas price.
   * 
   * Denominated in the smallest eGLD unit (10^18).
   */
  gasPrice?: number,
  /**
   * Gas limit.
   */
  gasLimit?: number,
  /**
   * Options to pass to the transaction signer.
   *
   * The specific structure of this value will depend on the signer being used.
   */
  meta?: object,
  /**
   * The provider to use.
   */
  provider?: Provider,
  /**
   * The transaction signer to use.
   */
  signer?: Signer,
}



/**
 * ESDT token configuration.
 */
export interface TokenConfig {
  /**
   * Whether more units of this token can be minted by the owner after initial issuance, increasing the supply.
   */
  canMint: boolean,
  /**
   * Whether users may burn some of their tokens, reducing the supply.
   */
  canBurn: boolean,
  /**
   * Whether the owner may prevent all transactions of the token, apart from minting and burning.
   */
  canPause: boolean,
  /**
   * Whether the owner may freeze a specific account, preventing transfers to and from that account.
   */
  canFreeze: boolean,
  /**
   * Whether the owner may wipe out the tokens held by a frozen account, reducing the supply.
   */
  canWipe: boolean,
  /**
   * Whether the owner may transfer ownership of the token to another account.
   */
  canChangeOwner: boolean,
  /**
   * Whether the owner may change the token configuration.
   */
  canUpgrade: boolean,
}


/**
 * ESDT token information.
 */
export interface TokenInfo {
  /**
   * Token identifier.
   */
  id: string,
  /**
   * The user-friendly name of the token.
   */
  name: string,
  /**
   * The ticker of the token.
   */
  ticker: string,
  /**
   * The bech32 address of the owner of this token.
   */
  owner: string,
  /**
   * Total supply, denominated in base-10.
   */
  supply: string,
  /**
   * No. of decimals.
   */
  decimals: number,
  /**
   * Whether token is currently paused.
   */
  paused: boolean,
  /**
   * Token configuration.
   */
  config: TokenConfig,
}