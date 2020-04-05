/**
*  本文件用来全局获取和改变每种类型对应的SVG源码及对应的发行者、名称、描述等，不用每次都解析
*  存储内容随着开发逐渐增加
*/
import React, {
    useEffect,
    createContext,
    useMemo,
    useReducer,
    useContext,
    useCallback
} from 'react'
import { reactLocalStorage } from 'reactjs-localstorage';
import { safeAccess } from 'utils'

//需要在.env.local等文件中设置REACT_APP_APPKEY，代表本APP的key或者ID
//这里加上"SVG"用来和保存密码的区分开
const appKey = process.env.REACT_APP_APPKEY + 'SVG';
//创建上下文环境，固定用法
const StorageContext = createContext()
function useStorageContext() {
    return useContext(StorageContext)
}
/**  本地存储计划示例，
{

    "1":{
            "svg":"ifajfay08",
            "name":"gold",
            "description":"this is a description",
            "issuer":"NaturalDAO"
    }             
}
*/
const UPDATE = 'UPDATE'
const UPDATEALL = 'UPDATEALL'
const INIT = 'INIT'

function reducer(state, { type, payload }) {
    switch (type) {
        //更新某一个类型的内容
        case UPDATE: {
            const { nonce, info } = payload
            return {
                ...state,
                ["" + nonce]: info
            }
        }
        //更新多个信息的内容
        case UPDATEALL: {
            return {
                ...state,
                ...payload
            }
        }
        //初始化整个变量
        case INIT: {
            return payload
        }
        default: {
            throw Error(`Unexpected action type in StorageContext reducer: '${type}'.`)
        }
    }
}

//定义一个provider
export default function Provider({ children }) {
    //内存中保留一份缓存，不用每次从本地存储读取
    const [state, dispatch] = useReducer(reducer, null)
    //存储更新的同时也更新内存缓存
    const updateByNonce = useCallback((nonce, info) => {
        reactLocalStorage.setObject(appKey, {
            ...state,
            ["" + nonce]: info
        })
        dispatch({
            type: UPDATE,
            payload: {
                nonce,
                info
            }
        })
    }, [state])

    const updateAll = useCallback(payload => {
        reactLocalStorage.setObject(appKey, {
            ...state,
            ...payload
        })
        dispatch({
            type:UPDATEALL,
            payload,
        })
    },[state])
    //这个不用更新存储，就是从存储得到的
    const init = useCallback(payload => {
        dispatch({ type: INIT, payload })
    }, [])

    //provider返回值，注意返回的方法包装在一个对象中
    return (<StorageContext.Provider value={useMemo(() => [state, { updateByNonce,updateAll,init }], [state, updateByNonce,updateAll,init])}>
        {children}
    </StorageContext.Provider>)
}

/**
* 用来初始化
*/
export function useStorage() {
    const [data, { init }] = useStorageContext();

    useEffect(() => {
        if (!data) {
            let _data = reactLocalStorage.getObject(appKey);
            init(_data)
        }
    }, [data, init])
    return data
}

//获取对应类型的信息
export function useGetStorageByNonce() {
    const [data,] = useStorageContext()

    return useCallback((nonce) => {
        return safeAccess(data, ["" + nonce])
    }, [data])
}

//更新对应类型的信息
export function useUpdateStorageByNonce() {
    const [, { updateByNonce }] = useStorageContext()

    return useCallback((nonce, info) => {
        updateByNonce(nonce, info)
    }, [updateByNonce])
}

//同时更新多个信息
export function useUpdateMany() {
    const [, { updateAll }] = useStorageContext()

    return useCallback((payload) => {
        updateAll(payload)
    }, [updateAll])
}
