import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { computeZksyncCreate2Address, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk';
import { ChainId } from '../../../src/util/chains';

/**
 * Computes a pool address
 * @param factoryAddress The Uniswap V3 factory address
 * @param tokenA The first token of the pair, irrespective of sort order
 * @param tokenB The second token of the pair, irrespective of sort order
 * @param fee The fee tier of the pool
 * @param initCodeHashManualOverride Override the init code hash used to compute the pool address if necessary
 * @param chainId
 * @returns The pool address
 */
export function computePoolAddress({
  factoryAddress,
  tokenA,
  tokenB,
  fee,
  initCodeHashManualOverride,
  chainId,
}: {
  factoryAddress: string
  tokenA: Token
  tokenB: Token
  fee: FeeAmount
  initCodeHashManualOverride?: string
  chainId?: ChainId
}): string {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  const salt = keccak256(
    ['bytes'],
    [defaultAbiCoder.encode(['address', 'address', 'uint24'], [token0.address, token1.address, fee])]
  )
  const initCodeHash = initCodeHashManualOverride ?? "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54"

  // ZKSync uses a different create2 address computation
  // Most likely all ZKEVM chains will use the different computation from standard create2
  switch (chainId) {
    case ChainId.ZKSYNC:
      return computeZksyncCreate2Address(factoryAddress, initCodeHash, salt)
    default:
      return getCreate2Address(factoryAddress, salt, initCodeHash)
  }
}
