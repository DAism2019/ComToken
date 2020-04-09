/*!

=========================================================
* Material Dashboard React - v1.7.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React, { useState, useEffect, useRef } from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
import { withRouter } from 'react-router'
// @material-ui/core components
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import { makeStyles } from '@material-ui/core/styles';
import { useTokenContract } from 'hooks';
import { isAddress,getFirstContextByLabel,convertTypeIdToBase,convertTypeBaseToType } from 'utils';
import { useWeb3Context } from 'web3-react';
import { FilePicker } from 'react-file-picker'
import styled from 'styled-components'
import { utils,constants } from 'ethers'
import InputAdornment from '@material-ui/core/InputAdornment';
import { isMobile } from 'react-device-detect'
import { parse, stringify } from 'svgson'
import { useTranslation } from 'react-i18next'
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { useGetStorageByNonce, useUpdateStorageByNonce } from 'contexts/SVGProvider'
import { Divider } from "@material-ui/core";

const ButtonWrapper = styled.div `
  ${ ({theme}) => theme.flexRowNoWrap}
  width: 100%;
  margin: 0.5rem;
  justify-content: center;
`

const LogoWrapper = styled.div`
  margin: 1.0rem;
  text-align: center;
`

const MAX_LIMIT = utils.bigNumberify("0xffffffffffffffffffffffffffffffff")

const useStyles = makeStyles(theme => ({
    cardTitleWhite: {
        color: "#FFFFFF",
        marginTop: "0px",
        minHeight: "auto",
        fontWeight: "300",
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        marginBottom: "3px",
        textDecoration: "none"
    },
    transferButton: {
        margin: theme.spacing(6),
        width: "10%",
        backgroundColor: '#FF8623'
    },
    selectButton: {
        backgroundColor: '#FF8623',
        marginTop: "10px",
        marginLeft: isMobile ? "200px" : 0
    },
    priceUpdate: {
        marginTop: theme.spacing(-2),
    }
}));

//解析图片上的元数据
const meta_init = {
    svg: "",
    name: "",
    description: "",
    issuer: ""
}

//获取链上其它数据
const info_init = {
    creator: "",
    limit: constants.Zero,
    amount: constants.Zero,
    buyLimit: constants.Zero,
    buyAmount: constants.Zero,
    price: 0,
    beneficiary: "",     //这个数据后台管理才需要
    baseURI: ""         //这个数据后台管理才需要
}

//需要修改的数据 只有后台管理才需要
const value_init = {
    newPrice: "",
    newBaseURI: "",
    svgCode:"",
    to: ""
}

const SVG = 'svg'
const NAME = "name"
const ISSUER = "issuer"
const DESCRIPTION = "description"
const DESC = "desc"

function TokenDetail({ history }) {
    const classes = useStyles()
    const hash = history.location.hash;
    const [type, setType] = useState(-1);
    const [tempType,setTempType] = useState()
    const contract = useTokenContract()
    const { account } = useWeb3Context()
    const showSnackbar = useSnackbarContext()
    const ref = useRef()
    const refNew = useRef()
    const { t } = useTranslation()
    const [infos, setInfos] = useState(info_init)
    const [values, setValues] = useState(value_init)
    const [meta, setMeta] = useState(meta_init)
    const getSvg = useGetStorageByNonce()
    const updateOne = useUpdateStorageByNonce()

    const valid = account && infos.creator && account === infos.creator
    const send_rest = infos.limit.sub(infos.buyLimit).sub(infos.amount.sub(infos.buyAmount))

    function showMeta() {
        const { name, description, issuer } = meta;
        return (
            <div>
                <ContentWrapper>
                    {t("token_name") + ": " + name}
                </ContentWrapper>
                <ContentWrapper>
                    {t("issue_org") + ":" + issuer}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_descrip") + ": " + description}
                </ContentWrapper>
            </div>
        )
    }

    //显示代币数量和价格信息，客户端也可使用
    function showInfos() {
        const { creator, limit, amount, buyLimit, buyAmount, price } = infos;
        return (
            <div>
                <ContentWrapper>
                    {t("creator_address") + ": " + creator}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_limit") + ": " + (limit.eq(MAX_LIMIT) ? t("infinite") : limit)}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_amount") + ": " + amount}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_buyLimit") + ": " + buyLimit}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_buyAmount") + ": " + buyAmount}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_sendAmount") + ": " + (limit.eq(MAX_LIMIT) ? t("infinite") : send_rest)}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_price") + ": " + utils.formatEther(price) + ' ETH'}
                </ ContentWrapper>
            </div>
        )
    }

    //显示代币一些额外信息，后台使用
    function showExtraInfos() {
        const { beneficiary, baseURI } = infos
        return (
            <div>
                <ContentWrapper>
                    {t("token_beneficiary") + ": " + beneficiary}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_baseURI") + ": " + baseURI}
                </ContentWrapper>
            </div>
        )
    }

    const handleChange = name => event => {
        setValues({
            ...values,
            [name]: event.target.value
        });
    };

    function getSvgFile(fileObject) {
        // setFileName(fileObject['name'])
        fileObject.text().then(result => {
            if (result.length > 11000)
                return showSnackbar(t("size_over_limit"), 'warning');
            setValues({
                ...values,
                svgCode: result
            });
        })
    }

    //批量赠送代币
    function doMint(event) {
        event.preventDefault()
        let _from = [];
        let _source = values.to.split(',');
        for (let i = 0; i < _source.length; i++) {
            let _address = _source[i].trim()
            if (!isAddress(_address)) {
                return showSnackbar(t("invalid_address"), 'error')
            }
            _from.push(_address)
        }
        let typeId = convertTypeBaseToType(type)
        if (contract) {
            contract.mintToken(typeId, _from, {
                gasPrice: utils.parseUnits('6.0', 'gwei')
            }).then(response => {
                showSnackbar(t("transaction_send_success"), 'success')
            }).catch(err => {
                showSnackbar(err.message, 'error')
            });
        }
    }

    //更改发行价格
    function doUpdatePrice(event) {
        event.preventDefault()
        let _price = values.newPrice
        _price = + _price;
        if (Number.isNaN(_price)) {
            return showSnackbar(t("invalid_input"), 'error')
        }
        _price = utils.parseEther("" + _price);
        let typeId = convertTypeBaseToType(type)
        if (contract) {
            contract.changePrice(typeId, _price, {
                gasPrice: utils.parseUnits('6.0', 'gwei')
            }).then(response => {
                showSnackbar(t("transaction_send_success"), 'success')
            }).catch(err => {
                showSnackbar(err.message, 'error')
            });
        }
    }
    //更改发行价格
    function doUpdateIcon(event) {
        event.preventDefault()
        let typeId = convertTypeBaseToType(type)
        if (contract) {
            contract.changeIcon(typeId, values.svgCode, {
                gasPrice: utils.parseUnits('6.0', 'gwei')
            }).then(response => {
                showSnackbar(t("transaction_send_success"), 'success')
            }).catch(err => {
                showSnackbar(err.message, 'error')
            });
        }
    }

    //更改baseURI
    function doUpdateBaseURI(event) {
        event.preventDefault()
        let uri = values.newBaseURI
        let typeId = convertTypeBaseToType(type)
        if (contract) {
            contract.changeBaseURI(typeId, uri, {
                gasPrice: utils.parseUnits('6.0', 'gwei')
            }).then(response => {
                showSnackbar(t("transaction_send_success"), 'success')
            }).catch(err => {
                showSnackbar(err.message, 'error')
            });
        }
    }

    //显示赠送面板
    function showMintPanel() {
        return (
            <div>
                <ContentWrapper>
                    {t("send_token")}
                </ContentWrapper>
                <form onSubmit={doMint} autoComplete="off" className={classes.priceUpdate}>
                    <FormControl margin="normal" required fullWidth>
                        <TextField id="outlined-multiline-static" multiline required rows="3"
                            label={t("multi_receipent")} value={values.to}
                            className={classes.textField} margin="normal"
                            onChange={handleChange('to')} variant="outlined" />
                    </FormControl>
                    <ButtonWrapper>
                        <Button variant="contained"
                            type="submit"
                            disabled={!valid || send_rest.lte(constants.Zero)}
                            className={classes.transferButton}>
                            {t("send")}
                        </Button>
                    </ButtonWrapper>
                </form>
            </div>

        )
    }
    //显示更新价格面板
    function showPricePanel() {
        return (
            <div>
                <ContentWrapper>
                    {t("change_price")}
                </ContentWrapper>
                <form onSubmit={doUpdatePrice} autoComplete="off" className={classes.priceUpdate} >
                    <FormControl margin="normal" required fullWidth>
                        <TextField required id="outlined-name-required"
                            label={t('new_price')} value={values.newPrice}
                            onChange={handleChange('newPrice')} className={classes.textField}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                            margin="normal" variant="outlined" />
                    </FormControl>
                    <ButtonWrapper>
                        <Button variant="contained"
                            type="submit"
                            disabled={!valid}
                            className={classes.transferButton}>
                            {t("update")}
                        </Button>
                    </ButtonWrapper>
                </form>
            </div>
        )
    }
    //显示更改SVG图标面板
    function showIconPanel() {
        return (
            <div>
                <ContentWrapper>
                    {t("change_icon")}
                </ContentWrapper>
                <form onSubmit={doUpdateIcon} autoComplete="off" className={classes.priceUpdate} >
                    <FormControl margin="normal" required fullWidth>
                    <div className={classes.buttonWrapper}>
                            <FilePicker
                                extensions={['svg']}
                                onChange={fileObject => getSvgFile(fileObject)}
                                onError={errMsg => (showSnackbar(errMsg, 'error'))}
                            >
                                <Button variant="contained" className={classes.selectButton}>
                                    {t("select")}
                                </Button>
                            </FilePicker>
                        </div>
                    </FormControl>
                    <LogoWrapper ref={refNew} />
                    <ButtonWrapper>
                        <Button variant="contained"
                            type="submit"
                            disabled={!valid}
                            className={classes.transferButton}>
                            {t("update")}
                        </Button>
                    </ButtonWrapper>
                </form>
            </div>
        )
    }

    //显示更新baseURI面板
    function showURIPanel() {
        return (
            <div>
                <ContentWrapper>
                    {t("change_baseURI")}
                </ContentWrapper>
                <form onSubmit={doUpdateBaseURI} autoComplete="off" className={classes.priceUpdate} >
                    <FormControl margin="normal" required fullWidth>
                        <TextField required id="outlined-name-required"
                            label={t('new_baseURI')} value={values.newBaseURI}
                            onChange={handleChange('newBaseURI')} className={classes.textField}
                            margin="normal" variant="outlined" />
                    </FormControl>
                    <ButtonWrapper>
                        <Button variant="contained"
                            type="submit"
                            disabled={!valid}
                            className={classes.transferButton}>
                            {t("update")}
                        </Button>
                    </ButtonWrapper>
                </form>
            </div>
        )
    }


    //判断有无typeid
    useEffect(() => {
        if (hash && hash.length > 1) {
            let _type = hash.substring(1);
            _type = parseInt(+ _type)
            if (Number.isNaN(_type) || _type <= 0) {
                // setValues(value_init)
                setType(0)
            } else {
                setTempType(_type)
            }
        } else {
            setType(0);
        }
    }, [hash])

    //refresh svg imgae
    useEffect(() => {
        if (refNew.current && values.svgCode) {
            parse(values.svgCode).then(result => {
                let new_json = result;
                new_json.attributes.height = '300px'
                new_json.attributes.width = '300px'
                refNew.current.innerHTML = stringify(new_json)
            })
        }
    }, [values.svgCode])

    //判断是否存在
    useEffect(() => {
        if(tempType && contract) {
            let stale = false;
            contract.nonce().then(nonce => {
                let _nonce = + nonce
                if(tempType  <=  _nonce && tempType > 0) {
                    if(!stale) {
                        setType(tempType)
                    }else{
                        //pass
                    }
                }else{
                    setType(0)
                }
            }).catch(e => {setType(0)})

            return () => {
                stale = true
            }
        }
    },[tempType,contract])

    //刷新纪念币相关信息
    useEffect(() => {
        if (type > 0 && contract) {
            let stale = false
            //先从本地获取meta
            function getMeta() {
                let meta_info = getSvg(type) || {}
                //不存在
                if (!meta_info[SVG]) {
                    contract.getTypeSVG(type).catch(e => {}).then(svg =>{
                        let name = getFirstContextByLabel(svg, NAME)
                        let issuer = getFirstContextByLabel(svg, ISSUER)
                        let description = getFirstContextByLabel(svg, DESCRIPTION) || getFirstContextByLabel(svg, DESC)
                        let payLoad = {
                            svg,
                            name,
                            issuer,
                            description
                        }
                        updateOne(type, payLoad)
                    })
                } else {      
                    setMeta(meta_info)
                }
            }
            
            //获取数量信息
            function getAmountInfo() {
                contract.getInfoByNonce(type).then(r => {
                    let creator = r[0][0]
                    let beneficiary = r[0][1]
                    let limit = r[1][0]
                    let amount = r[1][1]
                    let buyLimit = r[1][2]
                    let buyAmount = r[1][3]
                    let price = r[1][4]
                    if(!stale) {
                        setInfos(oldInfos => ({
                            ...oldInfos,
                            creator,
                            beneficiary,
                            limit,
                            amount,
                            buyLimit,
                            buyAmount,
                            price
                        }))
                    }
                }).catch(e => {})
            }

            //获取uri
            function getBaseURI() {
                contract.getTypeURI(type).then(r => {
                    if(!stale){
                        setInfos(oldInfos => (
                            {
                                ...oldInfos,
                                baseURI:r
                            }
                        ))
                    }
                }).catch(e => {})
            }

            getMeta()
            getAmountInfo()
            getBaseURI()
            //todo 监听事件 此处没有filters的问题
            let typeId = convertTypeBaseToType(type)
            let mintFilter = contract.filters.MintToken(null,typeId)
            contract.on(mintFilter,(_operator,typeId,event)=>{
                getAmountInfo()
            })
            contract.on("BuyToken",(_buyer,_recipient,_tokenId,event)=>{
                let _nonce = convertTypeIdToBase(_tokenId)
                if(_nonce === type) {
                    getAmountInfo()
                }
            })

            return () => {
                stale = true
                contract.removeAllListeners('BuyToken')
                contract.removeAllListeners('MintToken')
            }
        }
    }, [type,getSvg,updateOne,contract])

    //强制刷新
    useEffect(()=> {
        if(type > 0 && contract) {
            let typeId = convertTypeBaseToType(type)
            let filter = contract.filters.ChangeIcon(account,typeId)
            contract.on(filter,(operator,typeId,event) => {
                contract.getTypeSVG(type).catch(e => {}).then(svg =>{
                    let name = getFirstContextByLabel(svg, NAME)
                    let issuer = getFirstContextByLabel(svg, ISSUER)
                    let description = getFirstContextByLabel(svg, DESCRIPTION) || getFirstContextByLabel(svg, DESC)
                    let payLoad = {
                        svg,
                        name,
                        issuer,
                        description
                    }
                    updateOne(type, payLoad)
                })
            })
        }
    },[type,contract,updateOne,account])

    //refresh svg imgae
    useEffect(() => {
        if (ref.current && meta.svg) {
            parse(meta.svg).then(result => {
                let new_json = result;
                new_json.attributes.height = '300px'
                new_json.attributes.width = '300px'
                ref.current.innerHTML = stringify(new_json)
            })
        }
    }, [meta.svg])

    //监听更改价格和baseURI事件
    //这里在本机测试filters问题，使用filters后会多次收到回调，需要在测试网上测试
    useEffect(() => {
        if (contract && account && type > 0 ) {
            let stale = false;
            let typeId = convertTypeBaseToType(type)
            let priceFilter = contract.filters.ChangePrice(account,typeId)
            contract.on(priceFilter, (operator, typeId, newPrice, event) => {
                console.log("in filter")
                if (!stale) {
                    setInfos(oldInfos => (
                        {
                            ...oldInfos,
                            price: newPrice
                        }
                    ))
                    showSnackbar(t("update_price_success"), 'success')
                }
            });
            let uriFilter = contract.filters.ChangeBaseURI(account, typeId)
            contract.on(uriFilter, (operator, typeId, newURI, event) => {
                if (!stale) {
                    setInfos(oldInfos => (
                        {
                            ...oldInfos,
                            baseURI: newURI
                        }
                    ))
                    showSnackbar(t("update_uri_success"), 'success')
                }
            })

            return () => {
                stale = true;
                contract.removeAllListeners('ChangePrice')
                contract.removeAllListeners('ChangeBaseURI')
            }
        }
    }, [contract,showSnackbar,t,type,account])

    
    return (
        <Card>
            <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>{t("token_detail")}</h4>
            </CardHeader>
            <CardBody>
                {type > 0 ? <div>
                        <div style={{ width: "100%", textAlign: "center" }}>
                            <h2>{meta.name}</h2>
                        </div>
                        <LogoWrapper ref={ref} />
                        {showMeta()}
                        {showInfos()}
                        {showExtraInfos()}
                        <Divider style={{marginTop:"20px",marginBottom:"20px"}}/>
                        {showMintPanel()}
                        {showPricePanel()}
                        {showURIPanel()}
                        {showIconPanel()}
                        
                    </div>
                    : type === 0 ? <h3>{t("no_token")}</h3>
                    : <h3>{t("is_getting")}</h3>
                }
            </CardBody>
        </Card>
    )
}

TokenDetail.propTypes = {
    classes: PropTypes.object
};

const font_size = isMobile ? 20 : 20
const margin_top = isMobile ? 10 : 15

function ContentWrapper({ children }) {
    return (<div style={{ fontSize: font_size, marginTop: margin_top }}>
        {children}
    </div>)
}

export default withRouter(TokenDetail)
