const fsService = require('../scripts/fileService');
const fileName = "./test/address.json";

const ComToken = artifacts.require("ComToken");


const data = {
    "ComToken": ComToken.address
}

module.exports = function(deployer) {
    fsService.writeJson(fileName, data);
    console.log('address save over');
};
