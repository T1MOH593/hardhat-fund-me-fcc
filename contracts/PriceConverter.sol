// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function convertValueToUsd(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256 usdAmount) {
        uint256 ethPrice = getPrice(priceFeed);
        usdAmount = (ethPrice * ethAmount) / 1e18;
    }

    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // int256 price = 110000000000;
        return uint256(price * 1e10);
    }
}
