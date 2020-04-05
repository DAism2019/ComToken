pragma solidity ^ 0.5 .0;


import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import './Strings.sol';

interface IERC20Mintable() {
    function mint(address account, uint256 amount) public returns (bool);
}


//以下是为了接入opensea
contract OwnableDelegateProxy {}


contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}


//主合约，实现了一个721创建多种NFT
contract MoleCoin is ERC721Full, Ownable {
    using Strings for string;
    //纪念币能发行的最大数量
    uint constant MAX_LIMIT = uint(uint128(~0));
    //低128位全为1
    uint256 constant NF_INDEX_MASK = uint(uint128(~0));
    //高位128位全为1
    uint constant TYPE_MASK = uint(uint128(~0)) << 128;
    //alhpa钱包所需要支持的接口
    /* bytes4(keccak256('getBalances(address)')) == 0xc84aae17 */
    bytes4 private constant _INTERFACE_ID_COIN_BALANCES = 0xc84aae17;
    //获取代币图标，自定义接口
    /* bytes4(keccak256('getTokenImageSvg(uint256)')) == 0x87d2f48c */
    bytes4 private constant _INTERFACE_ID_TOKEN_IMAGE_SVG = 0x87d2f48c;

    struct TokenInfo {
        address creator; //创建者
        uint amount; //已经发行数量
        uint buyAmount;//已经购买数量
        uint limit; //发行上限
        uint price; //每个售价
        uint repAmount; //获得声望
        address payable beneficiary;     //收益人
        string baseURI; //baseURI
        string icon; //SVG图片

    }

    //白名单（代理）
    address proxyRegistryAddress;
    //纪念币类型索引
    uint public typeNonce;
    //所有纪念币类型信息
    mapping(uint => TokenInfo) public tokenInfos;
    //用户创建的纪念币类型
    mapping(address => uint[]) public nftTypes;
    //每个纪念币的初始购买者，用于以后发代币和声望
    /* mapping(uint => address) public tokenOrigin; */

    IERC20Mintable public rep;

    //event
    event CreateCoin(address indexed creator,uint typeId);
    event ChangePrice(address indexed operator,uint indexed typeId,uint newPrice);
    event ChangeBaseURI(address indexed operator,uint indexed typeId,string newURI);
    event BuyCoin(address indexed _buyer,address indexed _recipient, uint _tokenId);
    event SendCoin(address indexed _operator,address indexed _recipient, uint _tokenId);

    constructor(string memory name, string memory symbol, address _proxyRegistryAddress,adddress _repAddress) public ERC721Full(name, symbol) {
        require(_proxyRegistryAddress != address(0) && _repAddress != address(0),"MoleCoin: Zero Address");
        proxyRegistryAddress = _proxyRegistryAddress;
        rep = IERC20Mintable(_repAddress)
        _registerInterface(_INTERFACE_ID_COIN_BALANCES);
        _registerInterface(_INTERFACE_ID_TOKEN_IMAGE_SVG);
    }

    //检查是否类型ID
    function isType(uint _typeId) public view returns(bool) {
        //首先判断是否在范围内
        uint nonce = getTypeBase(_typeId);
        if(nonce == 0 || nonce > typeNonce) {
            return false;
        }
        //判断是否tokenId
        return (_typeId & NF_INDEX_MASK) == 0;
    }

    //获得纪念币的类型
    function getType(uint _tokenId) public pure returns(uint) {
        return _tokenId & TYPE_MASK;
    }

    //获取tokenId的高128位，它表示类型的索引
    function getTypeBase(uint _tokenId) public pure returns(uint) {
        return (_tokenId & TYPE_MASK) >> 128;
    }

    //获取tokenId的低128位，它表示在某一类型中的编号
    function getTokenIdBase(uint _tokenId) public pure returns(uint) {
        return _tokenId & NF_INDEX_MASK;
    }

    //判断某一个tokenId是否存在
    function isExisted(uint _tokenId) public view returns(bool) {
        uint _type = getType(_tokenId);
        if (!isType(_type)) {
            return false;
        }
        uint token_nonce = getTokenIdBase(_tokenId);
        if (token_nonce == 0 || token_nonce > tokenInfos[_type].amount) {
            return false;
        }
        return true;

    }
    //为了简化，使用类型的基本索引来获取相应类型信息
    //返回参数分别为[创建者、收益人]、[已发行数量、发行上限、发行售价]、baseURI、icon
    function getTokenInfoByTypeNonce(uint _typeNonce) public view returns(
        address[2] memory addrs,
        uint[3] memory nums,
        string memory _baseURI,
        string memory _icon)
    {
        require(_typeNonce > 0 && _typeNonce <= typeNonce,"MoleCoin: type is not existed");
        uint type_id = _typeNonce << 128;
        TokenInfo memory info = tokenInfos[type_id];
        addrs[0] = info.creator;
        addrs[1] = info.beneficiary;
        nums[0] = info.amount;
        nums[1] = info.limit;
        nums[2] = info.price;
        _baseURI = info.baseURI;
        _icon = info.icon;
    }

    //获取每个代币的uri，兼容opensea
    function tokenURI(uint _tokenId) external view returns(string memory) {
        require(isExisted(_tokenId),"MoleCoin: tokenId is not existed");
        uint _type = getType(_tokenId);
        string memory base_uri = tokenInfos[_type].baseURI;
        return Strings.strConcat(
            base_uri,
            Strings.uint2str(_tokenId)
        );
    }

    //获取代币图标，自定义接口
    function getTokenImageSvg(uint _tokenId) external view returns(string memory) {
        uint _type = getType(_tokenId);
        return tokenInfos[_type].icon;
    }

    /////////////////////////////////--纪念币创建、增发接口--////////////////////////
    //获取用户创建的所有纪念币的数量
    function getUserCreated(address _creator) public view returns(uint) {
        return nftTypes[_creator].length;
    }
    //在用户创建纪念币数量较少的情况下一次性返回所有创建的纪念币类型ID
    function getUserAllCreated(address _creator) public view returns(uint[] memory) {
        return nftTypes[_creator];
    }

    //创建纪念币
    function createCoin(uint _buyLimt, uint _price,uint _repAmount,address payable _beneficiary, string calldata _baseURI, string calldata _icon)
    external
    onlyOwner
    returns(uint _typeId) {
        require(_buyLimt < MAX_LIMIT, "MoleCoin: out of max_limit");
        require(typeNonce.add(1) <= MAX_LIMIT,"MoleCoin: out of limit");
        _typeId = (++typeNonce) << 128;
        TokenInfo memory info = TokenInfo(
            _msgSender(),
            0,
            _buyLimt,
            _price,
            _repAmount,
            _beneficiary,
            _baseURI,
            _icon
        );
        tokenInfos[_typeId] = info;
        nftTypes[_msgSender()].push(_typeId);
        emit CreateCoin(_msgSender(),_typeId);
    }

    //用户购买纪念币
    function buyCoin(uint typeId, address recipient) external payable {
        require(isType(typeId), "MoleCoin: not a type");
        TokenInfo storage info = tokenInfos[typeId];
        require(msg.value >= info.price, "MoleCoin: insufficient ethers or zero price");
        //总数量和购买数量都加1
        info.amount ++;
        info.buyAmount ++;
        //限定出售数量
        require(info.buyAmount <= info.limit && info.amount < MAX_LIMIT, "MoleCoin: out of the limit");
        uint id = typeId | info.amount;
        _mint(recipient, id);
        rep.mint(recipient,info.repAmount);
        info.beneficiary.transfer(msg.value);
        emit BuyCoin(_msgSender(),recipient,id);
    }

    //创建者赠送纪念币
    function sendCoin(uint typeId, address recipient) external {
        require(isType(typeId), "MoleCoin: not a type");
        TokenInfo storage info = tokenInfos[typeId];
        require(_msgSender() == info.creator,"MoleCoin: permission denied");
        info.amount ++;
        require(info.amount < MAX_LIMIT,"MoleCoin: out of the limit");
        uint id = typeId | info.amount;
        _mint(recipient, id);
        rep.mint(recipient,info.repAmount);
        emit SendCoin(_msgSender(),recipient,id);
    }

    //创建者改变纪念币价格
    function changePrice(uint typeId,uint newPrice) external {
        require(isType(typeId), "MoleCoin: not a type");
        TokenInfo storage info = tokenInfos[typeId];
        require(_msgSender() == info.creator,"MoleCoin: permission denied");
        info.price = newPrice;
        emit ChangePrice(info.creator,typeId,newPrice);
    }

    function changeBaseURI(uint typeId,string calldata _url) external {
        require(isType(typeId), "MoleCoin: not a type");
        TokenInfo storage info = tokenInfos[typeId];
        require(_msgSender() == info.creator,"MoleCoin: permission denied");
        info.baseURI = _url;
        emit ChangeBaseURI(info.creator,typeId,_url);
    }

    //兼容alpha钱包
    function getBalances(address owner) public view returns(uint[] memory) {
        return _tokensOfOwner(owner);
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(
        address owner,
        address operator
    )
    public
    view
    returns(bool) {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

}
