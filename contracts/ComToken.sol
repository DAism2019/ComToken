pragma solidity ^0.5.0;

import './Strings.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";



contract OwnableDelegateProxy {}


contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}


//TokenInfo接口
contract TokenInfoInterface {
    function baseTokenURI(uint tokenId) public view returns (string memory);
    function getTokenImageSvg(uint _tokenId) external view returns (string memory);
}


//主合约，实现了一个721创建多种NFT
contract ComToken is ERC721Full {
    using Strings for string;
    //alhpa钱包所需要支持的接口
    /* bytes4(keccak256('getBalances(address)')) == 0xc84aae17 */
    bytes4 private constant _INTERFACE_ID_Token_BALANCES = 0xc84aae17;
    //获取代币图标，自定义提案接口
    /* bytes4(keccak256('getTokenImageSvg(uint256)')) == 0x87d2f48c */
    bytes4 private constant _INTERFACE_ID_TOKEN_IMAGE_SVG = 0x87d2f48c;
    //白名单（代理） opensea使用
    address proxyRegistryAddress;
    //纪念币信息接口实例
    TokenInfoInterface public tokenInfo;

    constructor(
        string memory name,
        string memory symbol,
        address _proxyRegistryAddress
    ) public ERC721Full(name, symbol) {
        require(_proxyRegistryAddress != address(0), "ComToken: Zero Address");
        proxyRegistryAddress = _proxyRegistryAddress;
        _registerInterface(_INTERFACE_ID_Token_BALANCES);
        _registerInterface(_INTERFACE_ID_TOKEN_IMAGE_SVG);
    }

    //设置tokenInfo地址，仅可设置一次
    function setTokenInfo(address _address) external {
        require(_address != address(0), "ComToken: zero_address");
        require(
            address(tokenInfo) == address(0),
            "ComToken: token_address has been setup"
        );
        tokenInfo = TokenInfoInterface(_address);
    }

    //兼容alpha钱包
    function getBalances(address owner) public view returns (uint256[] memory) {
        return _tokensOfOwner(owner);
    }

    //获取代币图标，兼容自定义提案接口
    function getTokenImageSvg(uint256 _tokenId) external view returns (string memory){
        return tokenInfo.getTokenImageSvg(_tokenId);
    }

    //获取每个代币的uri，兼容opensea
    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(
            ownerOf(_tokenId) != address(0),
            "ComToken: tokenId is not existed"
        );
        string memory base_uri = tokenInfo.baseTokenURI(_tokenId);
        return Strings.strConcat(
            base_uri,
            Strings.uint2str(_tokenId)
        );
    }

    //创建者批量赠送(赠送不占用出售数量)
    function mintToken(address[] calldata to, uint256[] calldata ids) external {
        require(
            address(tokenInfo) == _msgSender(),
            "ComToken: permission denied"
        );
        require(to.length == ids.length, "ComToken: invalid params");
        uint256 len = to.length;
        for (uint256 i = 0; i < len; i++) {
            _mint(to[i], ids[i]);
        }
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        returns (bool)
    {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }
        
        return super.isApprovedForAll(owner, operator);
    }
}
