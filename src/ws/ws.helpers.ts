import { Utils } from 'alchemy-sdk'
import { EventFilter } from 'ethers'

/**
 * 
 * event IntentCreated(
        bytes32 indexed _hash,
        address _creator,
        uint256 indexed _destinationChain,
        address[] _targets,
        bytes[] _data,
        address[] _rewardTokens,
        uint256[] _rewardAmounts,
        uint256 indexed _expiryTime,
        bytes32 nonce
    );

 * @param sourceIntentContractAddress 
 * @returns 
 */
export function getCreateIntentLogFilter(sourceIntentContractAddress: string): EventFilter {
  return {
    address: sourceIntentContractAddress,
    topics: [
      Utils.id(
        'IntentCreated(bytes32,address,uint256,address[],bytes[],address[],uint256[],uint256,bytes32)',
      ),
    ],
  }
}
