// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./ISpaceStakingTypes.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract SpaceStakingBase is ISpaceStakingTypes {

    uint32 public constant RATE_DENOMINATOR = 100_000;
    
    IERC20 public immutable token;
    
    uint32 public interestRate;
    uint32 public stakingPeriod;
    uint32 public unstakingPeriod;
    bool public allowedStakingStatus;           
    bool public rewardGenerationStatus;
    
    uint64 public lastRewardGenerationEnabledAt;
    uint64 public lastRewardGenerationDisabledAt;      
    uint64 public lastInterestUpdateTime;
    uint32 public previousInterestRate;
    
    mapping(address owner => uint64 timeStamp) lastDebtUpdated;

    mapping(address => StakeInfo) public stakeInfo;
    mapping(address => UnstakeQueue) internal _unstakeQueues;
    mapping(address => mapping(uint64 => UnstakeRequest)) internal _unstakeRequests;
    mapping(address => CompletedUnstake[]) public completedUnstakes;
    
    uint256 public totalStaked;
    address public operator;
    uint64 public contractDisabledAt;

    
    constructor(address _token, address _operator) {
        require(_token != address(0), "Invalid token");
        require(_operator != address(0), "Invalid operator");
        
        token = IERC20(_token);
        operator = _operator;
        
        interestRate = 0;
        stakingPeriod = 0;
        unstakingPeriod = 14 days;

        allowedStakingStatus = true;
        rewardGenerationStatus = true;
        
        lastRewardGenerationEnabledAt = uint64(block.timestamp);
    }
}