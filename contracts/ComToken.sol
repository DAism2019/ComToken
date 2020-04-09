pragma solidity ^ 0.5.0;


import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import './Strings.sol';


//以下是为了接入opensea
contract OwnableDelegateProxy {}


contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}


//主合约，实现了一个721创建多种NFT
contract ComToken is ERC721Full, Ownable {
    using Strings for string;
    //纪念币能发行的最大数量
    uint constant MAX_LIMIT = uint(uint128(~0));
    //低128位全为1
    uint256 constant NF_INDEX_MASK = uint(uint128(~0));
    //高位128位全为1
    uint constant TYPE_MASK = uint(uint128(~0)) << 128;
    //alhpa钱包所需要支持的接口
    /* bytes4(keccak256('getBalances(address)')) == 0xc84aae17 */
    bytes4 private constant _INTERFACE_ID_Token_BALANCES = 0xc84aae17;
    //获取代币图标，自定义接口
    /* bytes4(keccak256('getTokenImageSvg(uint256)')) == 0x87d2f48c */
    bytes4 private constant _INTERFACE_ID_TOKEN_IMAGE_SVG = 0x87d2f48c;

    struct TokenInfo {
        address creator; //创建者
        uint amount; //已经发行数量
        uint buyAmount;//已经购买数量
        uint limit; //发行上限
        uint buyLimit;//购买上限
        uint price; //每个售价
        address payable beneficiary;     //收益人
        string baseURI; //baseURI
        string icon; //SVG图片
    }

    //白名单（代理）
    address proxyRegistryAddress;
    //纪念币类型索引
    uint public nonce;
    //所有纪念币类型信息
    mapping(uint => TokenInfo) public tokenInfos;  // type => info
    //用户创建的纪念币类型
    mapping(address => uint[]) public nftTypes;     //creator => type[]

    //event
    event CreateToken(address indexed creator,uint typeId);
    event ChangePrice(address indexed operator,uint indexed typeId,uint newPrice);
    event ChangeBaseURI(address indexed operator,uint indexed typeId,string newURI);
    event ChangeIcon(address indexed operator,uint indexed typeId);
    event BuyToken(address indexed _buyer,address indexed _recipient, uint _tokenId);
    event MintToken(address indexed _operator,uint indexed typeId);

    //仅限创建者
    modifier onlyCreator(uint typeId) {
        require(tokenInfos[typeId].creator == _msgSender(),"ComToken: permission denied");
        _;
    }

    constructor(string memory name, string memory symbol, address _proxyRegistryAddress) public ERC721Full(name, symbol) {
        require(_proxyRegistryAddress != address(0),"ComToken: Zero Address");
        proxyRegistryAddress = _proxyRegistryAddress;
        _registerInterface(_INTERFACE_ID_Token_BALANCES);
        _registerInterface(_INTERFACE_ID_TOKEN_IMAGE_SVG);
    }

    //检查是否类型ID
    function isType(uint _typeId) public view returns(bool) {
        //首先判断是否在范围内
        uint _nonce = getTypeBase(_typeId);
        if(_nonce == 0 || _nonce > nonce) {
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
    //返回参数分别为[创建者、收益人]、[发行上限、已发行数量、出售上限、已经售出数量、售价]
    function getInfoByNonce(uint _nonce) public view returns(address[2] memory addrs,uint[5] memory nums) {
        require(_nonce > 0 && _nonce <= nonce,"ComToken: nonce is not existed");
        uint type_id = _nonce << 128;
        TokenInfo memory info = tokenInfos[type_id];
        addrs[0] = info.creator;
        addrs[1] = info.beneficiary;
        nums[0] = info.limit;
        nums[1] = info.amount;
        nums[2] = info.buyLimit;
        nums[3] = info.buyAmount;
        nums[4] = info.price;
    }

    //获取每种类型的基础URI，为了简化，使用类型的基本索引来获取信息
    function getTypeURI(uint _nonce) external view returns(string memory) {
        require(_nonce > 0 && _nonce <= nonce,"ComToken: nonce is not existed");
        uint type_id = _nonce << 128;
        return tokenInfos[type_id].baseURI;
    }

    //获取每种类型的svg
    function getTypeSVG(uint _nonce) external view returns(string memory) {
        require(_nonce > 0 && _nonce <= nonce,"ComToken: nonce is not existed");
        uint type_id = _nonce << 128;
        return tokenInfos[type_id].icon;
    }

    //获取每个代币的uri，兼容opensea
    function tokenURI(uint _tokenId) external view returns(string memory) {
        require(isExisted(_tokenId),"ComToken: tokenId is not existed");
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
    //在用户创建纪念币数量较少的情况下一次性返回所有创建的纪念币类型ID(为了简化，返回的是基础类型，也就是右移128位后的结果)
    function getUserAllCreated(address _creator) public view returns(uint[] memory) {
        return nftTypes[_creator];
    }

    //创建纪念币
    function createToken(uint _limit,uint _buyLimt, uint _price,address payable _beneficiary, string calldata _baseURI, string calldata _icon)
    external
    onlyOwner
    returns(uint _typeId) {
        require(_buyLimt < MAX_LIMIT && _limit < MAX_LIMIT, "ComToken: out of max_limit");
        //如果发行上限为0，则代表无上限
        uint limit = _limit;
        if (limit == 0) {
            limit = MAX_LIMIT;
        }
        require(_buyLimt <= limit, "ComToken: buyLimit error");
        require(nonce + 1 <= MAX_LIMIT,"ComToken: the amount of type is maxinum");
        _typeId = (++nonce) << 128;
        TokenInfo memory info = TokenInfo(
            _msgSender(), //创建者
            0,  //已经发行数量
            0,  //已经购买数量
            limit, //发行上限
            _buyLimt,  //购买上限
            _price, //每个售价
            _beneficiary,
            _baseURI,
            _icon
        );
        tokenInfos[_typeId] = info;
        nftTypes[_msgSender()].push(nonce);
        emit CreateToken(_msgSender(),_typeId);
    }

    //用户购买纪念币
    function buyToken(uint typeId, address recipient) external payable {
        require(isType(typeId), "ComToken: not a type");
        TokenInfo storage info = tokenInfos[typeId];
        require(msg.value >= info.price, "ComToken: insufficient ethers or zero price");
        //总数量和购买数量都加1
        info.amount ++;
        info.buyAmount ++;
        //限定出售数量
        require(info.buyAmount <= info.buyLimit && info.amount <= info.limit, "ComToken: out of the limit");
        uint id = typeId | info.amount;
        _mint(recipient, id);
        info.beneficiary.transfer(msg.value);
        emit BuyToken(_msgSender(),recipient,id);
    }

    //创建者批量赠送(赠送不占用出售数量)
    function mintToken(uint typeId,address[] calldata to) external onlyCreator(typeId) {
        TokenInfo storage info = tokenInfos[typeId];
        uint len = to.length;
        uint hasMint = info.amount.sub(info.buyAmount);
        require(hasMint.add(len) <= info.limit.sub(info.buyLimit),"ComToken: out of the mint limit");
        // require(info.amount.add(len) <= info.limit,"ComToken: out of the limit");
        for (uint i = 0;i < len;i++) {
            uint id = typeId | (info.amount + i + 1);
            _mint(to[i], id);
        }
        info.amount = info.amount.add(len);
        emit MintToken(_msgSender(),typeId);
    }

    //创建者改变纪念币价格
    function changePrice(uint typeId,uint newPrice) external onlyCreator(typeId) {
        TokenInfo storage info = tokenInfos[typeId];
        info.price = newPrice;
        emit ChangePrice(info.creator,typeId,newPrice);
    }

    function changeBaseURI(uint typeId,string calldata _url) external onlyCreator(typeId) {
        TokenInfo storage info = tokenInfos[typeId];
        info.baseURI = _url;
        emit ChangeBaseURI(info.creator,typeId,_url);
    }

    function changeIcon(uint typeId,string calldata _svg) external onlyCreator(typeId) {
        TokenInfo storage info = tokenInfos[typeId];
        info.icon = _svg;
        emit ChangeIcon(info.creator,typeId);
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
