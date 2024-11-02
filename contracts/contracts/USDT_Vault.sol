// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {USDT} from "./Tokens.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import {console} from "hardhat/console.sol";
contract USDT_Vault is ReentrancyGuard, Ownable {
    USDT private s_usdtToken;
    bool public isClaimPaused;
    uint256 public precisionNumerator = 1_000_000_000;
    uint256 private s_noOfYieldGenerated;
    uint256 private s_totalDeposits;

    struct YieldGenerated {
        uint256 yieldPerUSDT;
        uint256 yieldGenerated;
        uint256 claimedReward;
    }

    mapping(uint256 => YieldGenerated) private s_yieldGenerated;

    struct Deposit {
        uint256 amount;
        uint256 yieldingStartedAt;
    }

    mapping(address => Deposit) private s_userDeposits;

    // hasClaimed[user][noOfYieldGenerated]
    mapping(address => mapping(uint256 => bool)) private s_hasClaimed;

    event Vault_isClaimPaused(bool isClaimPaused);
    event Vault_Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Vault_Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    event Vault_ClaimReward(address indexed user, uint256 amount, uint256 timestamp);
    event Vault_EmergencyWithdrawal(address indexed user, uint256 amount);
    event Vault_DepositYieldGenerated(address indexed user, uint256 noOfYieldGenerated, uint256 yieldPerUSDT);

    error Vault__ClaimPaused();
    error Vault__AlreadyClaimed();
    error Vault__NoDepositsFound();
    error Vault__NoRewardToClaim();
    error Vault__InsufficientBalance();
    error Vault__ZeroAmountNotAllowed();
    error Vault__YieldAlreadyGenerated();

    modifier zeroAmountNotAllowed(uint256 amount) {
        if (amount == 0) {
            revert Vault__ZeroAmountNotAllowed();
        }
        _;
    }

    modifier pause() {
        if (isClaimPaused) {
            revert Vault__ClaimPaused();
        }
        _;
    }


    constructor(address _usdtToken) {
        s_usdtToken = USDT(_usdtToken);
    }

    function usdtToken() public view returns (address) {
        return address(s_usdtToken);
    }
    
    function currentYieldNo() public view returns (uint256) {
        return s_noOfYieldGenerated;
    }

    function getYield(uint256 noOfYieldGenerated) public view returns (YieldGenerated memory) {
        return s_yieldGenerated[noOfYieldGenerated];
    }

    function getUserDeposit(address user) public view returns (Deposit memory) {
        return s_userDeposits[user];
    }

    function getTotalDeposits() public view returns (uint256) {
        return s_totalDeposits;
    }
    
    function getRewardPool() public view returns (uint256 generatedYield, uint256 claimedReward) {
        uint256 totalNoOfYieldGenerated = s_noOfYieldGenerated;
        for (uint i = 1; i <= totalNoOfYieldGenerated; i++) {
            generatedYield += s_yieldGenerated[i].yieldGenerated;
            claimedReward += s_yieldGenerated[i].claimedReward;
        }
    }
    
    function getUserReward(address userAddress, uint256 yeildingStartAt) public view returns (uint256 totalReward) {
        uint256 totalNoOfYieldGenerated = s_noOfYieldGenerated;
        Deposit memory user = getUserDeposit(userAddress);
        yeildingStartAt;
        
        for (uint i; i <= totalNoOfYieldGenerated; i++) {
            if (!s_hasClaimed[userAddress][i]) {
                uint256 yieldForUser = (user.amount * s_yieldGenerated[i].yieldPerUSDT) / precisionNumerator;
                totalReward += yieldForUser;
            }
        }
    }

    function deposit(uint256 amount) external nonReentrant zeroAmountNotAllowed(amount) returns (bool) {
        if (s_userDeposits[msg.sender].amount == 0) {
            s_userDeposits[msg.sender].yieldingStartedAt = s_noOfYieldGenerated;
        }
        s_userDeposits[msg.sender].amount += amount;
        s_totalDeposits += amount;
        emit Vault_Deposit(msg.sender, amount, block.timestamp);

        return s_usdtToken.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external nonReentrant zeroAmountNotAllowed(amount) returns (bool) {
        if (amount > s_userDeposits[msg.sender].amount) {
            revert Vault__InsufficientBalance();
        }
        s_userDeposits[msg.sender].amount -= amount;
        if (s_userDeposits[msg.sender].amount == 0) {
            delete s_userDeposits[msg.sender];
        }
        s_totalDeposits -= amount;
        emit Vault_Withdrawal(msg.sender, amount, block.timestamp);

        return s_usdtToken.transfer(msg.sender, amount);
    }

    function depositYieldGenerated(uint256 amount) external onlyOwner zeroAmountNotAllowed(amount) returns (bool) {
        s_noOfYieldGenerated++;
        uint256 totalDeposits = getTotalDeposits();
        if (totalDeposits == 0) {
            revert Vault__NoDepositsFound();
        }
        uint256 yieldPerUSDT = (amount * precisionNumerator) / totalDeposits;
        s_yieldGenerated[s_noOfYieldGenerated] = YieldGenerated(yieldPerUSDT, amount, 0);


        emit Vault_DepositYieldGenerated(msg.sender, s_noOfYieldGenerated, yieldPerUSDT);
        return s_usdtToken.transferFrom(msg.sender, address(this), amount);
    }

    function claimReward() external pause nonReentrant returns (bool) {
        uint256 totalReward;
        uint256 totalNoOfYieldGenerated = s_noOfYieldGenerated;
        Deposit memory user = s_userDeposits[msg.sender];

        for (user.yieldingStartedAt; user.yieldingStartedAt <= totalNoOfYieldGenerated; user.yieldingStartedAt++) {
            if (!s_hasClaimed[msg.sender][user.yieldingStartedAt]) {
                s_hasClaimed[msg.sender][user.yieldingStartedAt] = true;
                uint256 yieldForUser = user.amount * s_yieldGenerated[user.yieldingStartedAt].yieldPerUSDT;
                s_yieldGenerated[user.yieldingStartedAt].claimedReward += yieldForUser / precisionNumerator;
                totalReward += yieldForUser;
            }
        }
        if (totalReward == 0) {
            revert Vault__NoRewardToClaim();
        }
        totalReward = totalReward / precisionNumerator;
        if (totalReward > s_usdtToken.balanceOf(address(this))) {
            revert Vault__InsufficientBalance();
        }
        emit Vault_ClaimReward(msg.sender, totalReward, block.timestamp);
        return s_usdtToken.transfer(msg.sender, totalReward);
    }

    function emergencyWithdraw(address withdrawTo) external onlyOwner returns (bool) {
        uint256 balance = s_usdtToken.balanceOf(address(this));
        if (balance == 0) {
            revert Vault__InsufficientBalance();
        }
        emit Vault_EmergencyWithdrawal(withdrawTo, balance);
        return s_usdtToken.transfer(withdrawTo, balance);
    }

    function toggleClaim() external onlyOwner {
        isClaimPaused = !isClaimPaused;
        emit Vault_isClaimPaused(isClaimPaused);
    }

}
