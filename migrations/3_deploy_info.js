const ComToken = artifacts.require("ComToken");
const TokenInfo = artifacts.require("TokenInfo");

module.exports = function(deployer, network) {
    deployer.deploy(TokenInfo,ComToken.address );
};