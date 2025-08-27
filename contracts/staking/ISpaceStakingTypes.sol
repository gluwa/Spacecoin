// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISpaceStakingTypes {
    struct StakeInfo {
        uint256 stakedAmount;
        int256 totalDebt;
        uint64 firstStakeTimestamp;
        uint128 totalClaimedReward;
        bool isLocked;
    }
    
    struct UnstakeRequest {
        uint128 amount;
        uint64 availableOn;
        uint64 next;
    }
    
    struct UnstakeQueue {
        uint64 head;
        uint64 tail;
        uint64 nextRequestId;
        uint128 totalPending;
    }

    struct CompletedUnstake {
        uint128 amount;
        uint64 claimedAt;
    }
}