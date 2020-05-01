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
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import { useTokenInfoContract } from 'hooks';
import { getFirstContextByLabel, convertTypeIdToBase, convertTypeBaseToType } from 'utils';
import { useWeb3Context } from 'web3-react';
import styled from 'styled-components'
import { utils, constants } from 'ethers'
import { isMobile } from 'react-device-detect'
import { parse, stringify } from 'svgson'
import { useTranslation } from 'react-i18next'
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { useGetStorageByNonce, useUpdateStorageByNonce } from 'contexts/SVGProvider'
import copy from 'copy-to-clipboard'
import orange from '@material-ui/core/colors/orange';

const ButtonWrapper = styled.div`
  ${ ({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  margin: 0.5rem;
  justify-content: center;
`

const LogoWrapper = styled.div`
  margin: 1.0rem;
  text-align: center;
`

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
    submit: {
        fontSize: 18,
        width: isMobile ? "50%" : "20%",
        color: "white",
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        background: orange[700],
        marginTop: theme.spacing(6),
        '&:disabled': {
            background: orange[200],
        },
        '&:hover': {
            backgroundColor: orange[700],
        },
        '&:active': {
            backgroundColor: orange[700],
        }
    },
    copyText: {
        // width:"100%",
        textAlign: "right",
        textDecoration: "underline",
        fontSize: "13px",
        marginBottom: theme.spacing(-5)
    },
    transferButton: {
        margin: theme.spacing(6),
        width: "10%",
        backgroundColor: '#FF8623'
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
    issuer:"",
    repu:constants.Zero,
    buyLimit: constants.Zero,
    buyAmount: constants.Zero,
    price: 0,
}



const SVG = 'svg'
const NAME = "name"
const DESC = "desc"
const ISSUER = "issuer"

function TokenDetail({ history }) {
    const classes = useStyles()
    const hash = history.location.hash;
    const [type, setType] = useState(-1);
    const [tempType, setTempType] = useState()
    const contract = useTokenInfoContract()
    const { account } = useWeb3Context()
    const showSnackbar = useSnackbarContext()
    const ref = useRef()
    const { t } = useTranslation()
    const [infos, setInfos] = useState(info_init)
    const [meta, setMeta] = useState(meta_init)
    const getSvg = useGetStorageByNonce()
    const updateOne = useUpdateStorageByNonce()
    const [isPending, setIsPending] = useState(false)
    const [inPanel, setInpanel] = useState(true)

    function showMeta() {
        const { name, desc } = meta;
        return (
            <div>
                <ContentWrapper>
                    {t("token_name") + ": " + name}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_descrip") + ": " + desc}
                </ContentWrapper>
            </div>
        )
    }

    //显示代币数量和价格信息，客户端也可使用
    function showInfos() {
        const { creator, buyLimit, buyAmount, repu,price,issuer } = infos;
        return (
            <div>
                <ContentWrapper>
                    {t("issue_org") + ": " + issuer}
                </ContentWrapper>
                <ContentWrapper>
                    {t("creator_address") + ": " + creator}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_buyLimit") + ": " + buyLimit}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_buyAmount") + ": " + buyAmount}
                </ContentWrapper>
                <ContentWrapper>
                    {t("token_price") + ": " + utils.formatEther(price) + ' ETH'}
                </ ContentWrapper>
                <ContentWrapper>
                    {t("token_repu") + ": " +  ((+ repu)/10**6).toFixed(6)}
                </ ContentWrapper>
            </div>
        )
    }

    //判断是否在当前页面
    useEffect(() => {
        return () => {
            setInpanel(false)
        }
    }, [])

    //判断有无typeid
    useEffect(() => {
        if (hash && hash.length > 1) {
            let _type = hash.substring(1);
            _type = parseInt(+ _type)
            if (Number.isNaN(_type) || _type <= 0) {
                setType(0)
            } else {
                setTempType(_type)
            }
        } else {
            setType(0);
        }
    }, [hash])

    //判断是否存在
    useEffect(() => {
        if (tempType && contract) {
            let stale = false;
            contract.nonce().then(nonce => {
                let _nonce = + nonce
                if (tempType <= _nonce && tempType > 0) {
                    if (!stale) {
                        setType(tempType)
                    } else {
                        //pass
                    }
                } else {
                    setType(0)
                }
            }).catch(e => { setType(0) })

            return () => {
                stale = true
            }
        }
    }, [tempType, contract])

    //刷新纪念币相关信息
    useEffect(() => {
        if (type > 0 && contract) {
            let stale = false
            //先从本地获取meta
            function getMeta() {
                let meta_info = getSvg(type) || {}
                //不存在
                if (!meta_info[SVG]) {
                    contract.getTypeSVG(type).catch(e => { }).then(svg => {
                        let name = getFirstContextByLabel(svg, NAME)
                        let desc = getFirstContextByLabel(svg, DESC)
                        let issuer = getFirstContextByLabel(svg, ISSUER)
                        let payLoad = {
                            svg,
                            name,
                            desc,
                            issuer
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
                    let buyLimit = r[1][2]
                    let buyAmount = r[1][3]
                    let price = r[1][4]
                    let repu = r[1][5]
                    let issuer = r[2]
                    if (!stale) {
                        setInfos({
                            creator,
                            buyLimit,
                            buyAmount,
                            price,
                            repu,
                            issuer
                        })
                    }
                }).catch(e => { })
            }
            getMeta()
            getAmountInfo()
            contract.on("BuyToken", (_buyer, _recipient, _tokenId, event) => {
                let _nonce = convertTypeIdToBase(_tokenId)
                if (_nonce === type) {
                    getAmountInfo()
                }
            })

            return () => {
                stale = true
                contract.removeAllListeners('BuyToken')
            }
        }
    }, [type, getSvg, updateOne, contract])

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

    //copyurl地址
    const copyURL = (event) => {
        event.preventDefault();
        if (copy(window.location.href)) {
            showSnackbar(t("url_copied"), 'info', null)
        }
    }

    //购买纪念币
    function doPurchase(event) {
        event.preventDefault()
        const { price } = infos;
        let typeId = convertTypeBaseToType(type)
        contract.buyToken(typeId, account, {
            value: price,
            gasPrice: utils.parseUnits('6.0', 'gwei')
        }).then(tx => {
            showSnackbar(t("transaction_send_success"), 'success')
            if (inPanel) {
                setIsPending(true)
                tx.wait().then(td => {
                    if (inPanel) {
                        setIsPending(false)
                        if (td.status === 1) {
                            //success
                            showSnackbar(t("purchase_success"), 'success', () => {
                                history.push("/mine");
                            })
                        } else {
                            showSnackbar(t("purchase_failed"), 'info')
                        }
                    }
                })
            }
        }).catch(err => {
            showSnackbar(err.message, 'error')
        });
    }

    function showBuyBtn() {
        const { buyLimit, buyAmount } = infos
        if (buyAmount.gte(buyLimit)) {
            return null
        } else {
            return (
                <ButtonWrapper>
                    <Button
                        onClick={doPurchase}
                        variant="contained"
                        disabled={isPending || !account}
                        className={classes.submit}>
                        {isPending && <CircularProgress style={{ marginRight: "10px" }} />}
                        {isPending ? t("pending") : t('purchase')}
                    </Button>
                </ButtonWrapper>
            )
        }
    }


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
                    <div className={classes.copyText}>
                        <Button onClick={copyURL}>
                            {t("click_share")}
                        </Button>
                    </div>
                    <LogoWrapper ref={ref} />
                    {showMeta()}
                    {showInfos()}
                    {showBuyBtn()}
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
