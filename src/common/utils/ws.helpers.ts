import { EventFilter } from 'ethers'
import { ERC20__factory, IntentSource__factory } from '../../typing/contracts'
import { SourceIntentDataModel } from '../../intent/schemas/source-intent-data.schema'

/**
 * Creates the filter for the events that we want to listen to for the IntentSource contract
 *
 * event IntentCreated(
 *      bytes32 indexed _hash,
 *      address _creator,
 *      uint256 indexed _destinationChain,
 *      address[] _targets,
 *      bytes[] _data,
 *      address[] _rewardTokens,
 *      uint256[] _rewardAmounts,
 *      uint256 indexed _expiryTime,
 *      bytes32 nonce
 *  );
 *
 * @param sourceIntentContractAddress address of the contract
 * @returns
 */
export function getCreateIntentLogFilter(sourceIntentContractAddress: string): EventFilter {
  const intentCreated = IntentSource__factory.createInterface().getEvent('IntentCreated').topicHash
  return {
    address: sourceIntentContractAddress,
    topics: [intentCreated],
  }
}

/**
 *
 * @param erc20Address
 * @param from
 * @param to
 * @returns
 */
export function getTransferLogFilter(
  erc20Address: string,
  from?: string,
  to?: string,
): EventFilter {
  const transfer = ERC20__factory.createInterface().encodeFilterTopics('Transfer', [from, to])
  return {
    address: erc20Address,
    topics: transfer,
  }
}

/**
 * Decodes the IntentCreated event log
 *
 * @param data the encoded data from the event log
 * @param topics the log topics
 * @returns
 */
export function decodeCreateIntentLog(data: string, topics: string[]): SourceIntentDataModel {
  const ii = IntentSource__factory.createInterface()
  const frag = ii.getEvent('IntentCreated')
  const decode = ii.decodeEventLog(frag, data, topics)
  return SourceIntentDataModel.fromEvent(decode)
}

/**
 * Decodes the Transfer event log
 *
 * @param data the encoded data from the event log
 * @param topics the log topics
 * @returns
 */
export function decodeTransferLog(data: string, topics: string[]) {
  const ii = ERC20__factory.createInterface()
  const frag = ii.getEvent('Transfer')
  const decode = ii.decodeEventLog(frag, data, topics)
  return decode
}

/**
 * Returns the selector for the erc20 function
 * @param funName the name of the erc20 function
 * @returns
 */
export function getERC20Selector(
  funName:
    | 'allowance'
    | 'approve'
    | 'balanceOf'
    | 'decimals'
    | 'name'
    | 'symbol'
    | 'totalSupply'
    | 'transfer'
    | 'transferFrom',
): string {
  return ERC20__factory.createInterface().getFunction(funName).selector
}
