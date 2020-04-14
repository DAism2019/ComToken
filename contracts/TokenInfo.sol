pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract ERCTokenInterface {
    function mintToken(address[] calldata to, uint256[] calldata ids) external;
}


contract TokenInfo is Ownable {
    using SafeMath for uint256;
    //低128位全为1
    uint256 constant LOWER_LIMIT = uint256(uint128(~0));
    //高位128位全为1
    uint256 constant HIGHER_LIMIT = uint256(uint128(~0)) << 128;

    struct Info {
        address creator; //创建者
        string issuer; //发行组织
        uint256 repu; //纪念值
        uint256 amount; //已经发行数量
        uint256 buyAmount; //已经购买数量
        uint256 limit; //发行上限
        uint256 buyLimit; //购买上限
        uint256 price; //每个售价
        address payable beneficiary; //收益人
        string baseURI; //baseURI
        string icon; //SVG图片
        bool isLock; //是否锁定svg图片
    }
    //ERC721代币地址
    ERCTokenInterface public token;
    //纪念币类型数量
    uint256 public nonce;
    //每个账户在每个组织的声望总值
    mapping(string => mapping(address => uint256)) public allRepu; //名称 => 地址 => repu
    //所有纪念币类型信息
    mapping(uint256 => Info) public tokenInfos; // typeId => info
    //用户创建的纪念币类型,这里的类型只是index(nonce)，不是typeId
    mapping(address => uint256[]) public nftTypes; //creator => index[]

    //event
    event CreateToken(address indexed creator, uint256 typeId);
    event BuyToken(
        address indexed _buyer,
        address indexed _recipient,
        uint256 _tokenId
    );
    event BitchGiftToken(address indexed _operator, uint256 indexed typeId);
    event ChangeBaseURI(
        address indexed operator,
        uint256 indexed typeId,
        string newURI
    );
    event ChangeIcon(address indexed operator, uint256 indexed typeId);
    event LockIcon(address indexed _operator, uint256 indexed typeId);

    //仅限创建者
    modifier onlyCreator(uint256 _typeId) {
        require(
            tokenInfos[_typeId].creator == _msgSender(),
            "TokenInfo: permission denied"
        );
        _;
    }

    constructor(address _token) public {
        require(_token != address(0), "TokenInfo: zero_address");
        token = ERCTokenInterface(_token);
    }

    /////////////////////////////////--用户创建的纪念币信息查询--////////////////////////
    //获取用户创建的所有纪念币的数量
    function getUserCreated(address _creator) public view returns (uint256) {
        return nftTypes[_creator].length;
    }

    //在用户创建纪念币数量较少的情况下一次性返回所有创建的纪念币类型ID(为了简化，返回的是基础类型，也就是右移128位后的结果)
    function getUserAllCreated(address _creator)
        public
        view
        returns (uint256[] memory)
    {
        return nftTypes[_creator];
    }

    ////////////////////////////////--获取纪念币相关信息--//////////////////////////
    //获得纪念币的类型
    function getType(uint256 _tokenId) public view returns (uint256) {
        uint256 typeId = _tokenId & HIGHER_LIMIT;
        require(
            tokenInfos[typeId].creator != address(0),
            "TokenInfo: not a valid tokenId"
        );
        return typeId;
    }

    //判断一个类型是否存在
    function isType(uint256 _typeId) public view returns (bool) {
        return tokenInfos[_typeId].creator != address(0);
    }

    //为了简化，使用类型的基本索引来获取相应类型信息 前后端都可以使用
    //返回参数分别为[创建者、收益人]、[发行上限、已发行数量、出售上限、已经售出数量、售价、声望],发行组织
    function getInfoByNonce(uint256 _nonce)
        public
        view
        returns (
            address[2] memory addrs,
            uint256[6] memory nums,
            string memory issuer
        )
    {
        require(
            _nonce > 0 && _nonce <= nonce,
            "TokenInfo: nonce is not existed"
        );
        uint256 typeId = _nonce << 128;
        Info memory info = tokenInfos[typeId];
        addrs[0] = info.creator;
        addrs[1] = info.beneficiary;
        nums[0] = info.limit;
        nums[1] = info.amount;
        nums[2] = info.buyLimit;
        nums[3] = info.buyAmount;
        nums[4] = info.price;
        nums[5] = info.repu;
        issuer = info.issuer;
    }

    //获取baseURI，为了简化，使用类型的基本索引来获取信息 后台使用
    function baseTokenURIByNonce(uint256 _nonce)
        external
        view
        returns (string memory)
    {
        uint256 typeId = _nonce << 128;
        return tokenInfos[typeId].baseURI;
    }

    //获取baseURI，注意参数，提供给ERC721合约使用
    function baseTokenURI(uint256 tokenId)
        external
        view
        returns (string memory)
    {
        uint256 typeId = getType(tokenId);
        return tokenInfos[typeId].baseURI;
    }

    //单独获取是否锁定，在监听Lock变化事件后使用
    function getIsLockByNonce(uint256 _nonce) external view returns (bool) {
        uint256 typeId = _nonce << 128;
        return tokenInfos[typeId].isLock;
    }

    //获取每种类型的svg,单独获取
    function getTypeSVG(uint256 _nonce) external view returns (string memory) {
        uint256 typeId = _nonce << 128;
        return tokenInfos[typeId].icon;
    }

    //获取icon,注意参数，提供给ERC721合约使用
    function getTokenImageSvg(uint256 _tokenId)
        external
        view
        returns (string memory)
    {
        uint256 typeId = getType(_tokenId);
        return tokenInfos[typeId].icon;
    }

    ////////////////--创建者更新纪念币的部分信息--//////////////
    //更新baseURI
    function changeBaseURI(uint256 _typeId, string calldata _url)
        external
        onlyCreator(_typeId)
    {
        Info storage info = tokenInfos[_typeId];
        info.baseURI = _url;
        emit ChangeBaseURI(info.creator, _typeId, _url);
    }

    //更新ICON,锁定后无法更新
    function changeIcon(uint256 _typeId, string calldata _icon)
        external
        onlyCreator(_typeId)
    {
        Info storage info = tokenInfos[_typeId];
        require(!info.isLock, "TokenInfo: the icon has been locked");
        info.icon = _icon;
        emit ChangeIcon(info.creator, _typeId);
    }

    //锁定纪念币ICON，防止更新，锁定后无法解锁
    function lockIcon(uint256 _typeId) external onlyCreator(_typeId) {
        Info storage info = tokenInfos[_typeId];
        require(!info.isLock, "TokenInfo: the icon has been locked");
        info.isLock = true;
        emit LockIcon(info.creator, _typeId);
    }

    //创建纪念币 values 分别为[repu,price,_limit,_buylimit]
    function createToken(
        uint256[4] calldata values,
        string calldata _issuer,
        address payable _beneficiary,
        string calldata _baseURI,
        string calldata _icon
    ) external onlyOwner returns (uint256 typeId) {
        require(
            nonce < LOWER_LIMIT,
            "TokenInfo: the amount of type is maximum"
        );
        uint256 limit = _checkInput(_issuer, values[2], values[3]);
        typeId = (++nonce) << 128;
        Info memory info = Info(
            _msgSender(), //创建者
            _issuer,
            values[0],
            0, //已经发行数量
            0, //已经购买数量
            limit, //发行上限
            values[3], //购买上限
            values[1], //每个售价
            _beneficiary,
            _baseURI,
            _icon,
            false
        );
        tokenInfos[typeId] = info;
        nftTypes[_msgSender()].push(nonce);
        emit CreateToken(_msgSender(), typeId);
    }

    //检查创建纪念币时的输入参数是否正确并且返回发行上限
    function _checkInput(
        string memory _issuer,
        uint256 _limit,
        uint256 _buyLimit
    ) internal pure returns (uint256) {
        require(bytes(_issuer).length != 0, "TokenInfo: empty issuer");
        require(
            _buyLimit <= LOWER_LIMIT && _limit <= LOWER_LIMIT,
            "TokenInfo: out of LIMIT"
        );
        //如果发行上限为0，则代表无上限
        uint256 limit = _limit;
        if (limit == 0) {
            limit = LOWER_LIMIT;
        }
        require(_buyLimit <= limit, "TokenInfo: buyLimit error");
        return limit;
    }

    //购买纪念币，返回新生成的纪念币ID
    function buyToken(uint256 typeId, address recipient)
        external
        payable
        returns (uint256)
    {
        require(isType(typeId), "TokenInfo: not a valid typeId");
        Info storage info = tokenInfos[typeId];
        require(msg.value >= info.price, "TokenInfo: insufficient ethers");
        require(
            info.buyAmount.add(1) <= info.buyLimit,
            "TokenInfo: buyAmount is maximum"
        );
        require(
            info.amount.add(1) <= info.limit,
            "TokenInfo: amout is maximum"
        );
        info.buyAmount++;
        info.amount++;
        uint256 tokenId = typeId | info.amount;
        uint[] memory ids = new uint[](1);
        ids[0] = tokenId;
        address[] memory to = new address[](1);
        to[0] = recipient;
        token.mintToken(to,ids);
        allRepu[info.issuer][recipient] = allRepu[info.issuer][recipient].add(
            info.repu
        );
        info.beneficiary.transfer(msg.value);
        emit BuyToken(_msgSender(), recipient, tokenId);
    }

    //批量赠送纪念币
    function bitchGiftToken(uint256 typeId, address[] calldata to)
        external
        onlyCreator(typeId)
    {
        require(isType(typeId), "TokenInfo: not a valid typeId");
        uint256 len = to.length;
        Info storage info = tokenInfos[typeId];
        require(
            info.amount.add(len) <= info.limit,
            "TokenInfo: amout is maximum"
        );
        uint256[] memory ids = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            allRepu[info.issuer][to[i]] = allRepu[info.issuer][to[i]].add(
                info.repu
            );
            uint256 tokenId = typeId | (info.amount + i + 1);
            ids[i] = tokenId;
        }
        info.amount = info.amount.add(len);
        token.mintToken(to, ids);
        emit BitchGiftToken(info.creator, typeId);
    }
}
