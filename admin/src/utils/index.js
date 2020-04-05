import { ethers,utils } from 'ethers'
import TOKEN_ABI from 'constants/abis/token.json'
import { TOKEN_ADDRESS } from '../constants'
import UncheckedJsonRpcSigner from './signer'

const ZERO_UINT128 = "00000000000000000000000000000000"

export const ERROR_CODES = ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOKEN_DECIMALS'].reduce(
  (accumulator, currentValue, currentIndex) => {
    accumulator[currentValue] = currentIndex
    return accumulator
  },
  {}
)

export function safeAccess(object, path) {
  return object
    ? path.reduce(
        (accumulator, currentValue) => (accumulator && accumulator[currentValue] ? accumulator[currentValue] : null),
        object
      )
    : null
}

const ETHERSCAN_PREFIXES = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.'
}
export function getEtherscanLink(networkId, data, type) {
  const prefix = `https://${ETHERSCAN_PREFIXES[networkId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export function getNetworkName(networkId) {
  switch (networkId) {
    case 1: {
      return 'the Main Ethereum Network'
    }
    case 3: {
      return 'the Ropsten Test Network'
    }
    case 4: {
      return 'the Rinkeby Test Network'
    }
    case 5: {
      return 'the Görli Test Network'
    }
    case 42: {
      return 'the Kovan Test Network'
    }
    case 5777:{
      return 'the localhost'
    }
    default: {
      return 'the correct network'
    }
  }
}

export function shortenAddress(address, digits = 4) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, digits + 2)}...${address.substring(42 - digits)}`
}

export function shortTokenId(tokenId,digits = 4) {
    if(!tokenId) {
        return ''
    }
    tokenId = tokenId.toString()
    let len = tokenId.length;
    if (len <= digits * 2) {
      return tokenId
    }
    return `${tokenId.substring(0, digits + 2)}...${tokenId.substring(len - digits)}`
}

export function shortenTransactionHash(hash, digits = 4) {
  return `${hash.substring(0, digits + 2)}...${hash.substring(66 - digits)}`
}

export function isAddress(value) {
  try {
    return ethers.utils.getAddress(value.toLowerCase())
  } catch {
    return false
  }
}

export function calculateGasMargin(value, margin) {
  const offset = value.mul(margin).div(ethers.utils.bigNumberify(10000))
  return value.add(offset)
}

// account is optional
export function getProviderOrSigner(library, account) {
  return account ? new UncheckedJsonRpcSigner(library.getSigner(account)) : library
}

// account is optional
export function getContract(address, ABI, library, account) {
  if (!isAddress(address) || address === ethers.constants.AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return new ethers.Contract(address, ABI, getProviderOrSigner(library, account))
}


export function getTokenContract(networkId,library,account){
    return getContract(TOKEN_ADDRESS[networkId], TOKEN_ABI, library, account)
}


export function getPathBase() {
    return process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PATH_BASE : ''
}

export function convertTimetoTimeString(_times) {
        let now = new Date(_times),
            y = now.getFullYear(),
            m = now.getMonth() + 1,
            d = now.getDate();
        return y + "-" + (
            m < 10
            ? "0" + m
            : m) + "-" + (
            d < 10
            ? "0" + d
            : d) + " " + now.toTimeString().substr(0, 8);
}

export function getFirstContextByLabel(source,label){
    let label_start = '<' + label
    let label_end = '</' + label + '>'
    let start = source.indexOf(label_start) 
    if (start === -1) {
      return ""
    }
    let startIndex = start + label_start.length
    let start_close = source.indexOf(">",startIndex)
    let end = source.indexOf(label_end)
    if( end !== -1){
        return source.substring(start_close + 1,end)
    }else{
        return ''
    }
}

export function getIndexArray(amount,pagesize,_offset,origin=0){
     let result = []
     let start = _offset
     if(start > amount -1) {
         return result
     }
     let end = _offset + pagesize - 1
     if(end > amount -1)
       end = amount -1
     for(let i=start;i<=end;i++)
       result.push(i + origin)
     return result
 }

export function getIndexArrayReverse(amount,pagesize,offset,origin=0){
     let start = amount - offset -1
     if(start <0)
         return []
     let end = start - pagesize + 1
     if(end <= 0)
         end = 0
     let result = []
     for(let i=start;i>=end;i--){
         result.push(i+origin)
     }
     return result
 }

 export function convertTypeIdToBase(typeId) {
     let result = typeId.toHexString()
     result = result.substring(0,result.length - 32)
     return + utils.bigNumberify(result)
 }

 export function convertTypeBaseToType(typeNonce) {
     let het_str = utils.bigNumberify(typeNonce).toHexString()
     het_str += ZERO_UINT128;
     return utils.bigNumberify(het_str)
 }
