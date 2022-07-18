// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__FewMoney();
error FundMe__NotOwner();

/**
 * @title this contract feeds data prices
 * @dev dsckjdwckwcwc
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMAL_USD = 1 * 1e18;

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToFundersIndex;

    address payable private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address s_priceFeedAddress) {
        i_owner = payable(msg.sender);
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        if (msg.value.convertValueToUsd(s_priceFeed) < MINIMAL_USD) {
            revert FundMe__FewMoney();
        }
        if (s_addressToFundersIndex[msg.sender] == 0) {
            s_funders.push(msg.sender);
            s_addressToFundersIndex[msg.sender] = s_funders.length;
        }
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 i = 0; i < funders.length; i++) {
            s_addressToAmountFunded[funders[i]] = 0;
        }
        s_funders = new address[](0);
        (bool successCall, ) = i_owner.call{value: address(this).balance}("");
        require(successCall, "not successful");
    }

    function getAddressToAmountFunded(address addr)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[addr];
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToFundersIndex(address addr)
        public
        view
        returns (uint256)
    {
        return s_addressToFundersIndex[addr];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
