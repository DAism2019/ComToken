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
import React, { useState, useEffect } from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// @material-ui/core components
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
// import { useWeb3Context } from 'web3-react';
import { getIndexArray, getFirstContextByLabel } from 'utils'
import { useTokenContract } from 'hooks';
import Container from '@material-ui/core/Container';
import AlbumSvgItem from 'components/AlbumItem/AlbumSvgItem.jsx'
import Pagination from "material-ui-flat-pagination"
import CssBaseline from "@material-ui/core/CssBaseline"
import { withRouter } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useGetStorageByNonce, useUpdateMany } from 'contexts/SVGProvider'

const PAGE_SIZE = 8;
const SVG = 'svg'
const NAME = "name"
const ISSUER = "issuer"
const DESCRIPTION = "description"
const DESC = "desc"


const useStyles = makeStyles(theme => ({
    cardCategoryWhite: {
        //   color: "rgba(33,33,33,.99)",
        color: "white",
        margin: "0",
        fontSize: "14px",
        marginTop: "0",
        marginBottom: "0"
    },
    cardTitleWhite: {
        color: "#FFFFFF",
        marginTop: "0px",
        minHeight: "auto",
        fontWeight: "300",
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        marginBottom: "3px",
        textDecoration: "none"
    },
    buttonWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    cardGrid: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    }
}));

function LatestTokens({ history }) {
    const contract = useTokenContract()
    const { t } = useTranslation()
    // const { account } = useWeb3Context()
    const [offset, setOffset] = useState(0)
    const [typeCount, setTypeCount] = useState(-1)
    const [typeArray, setTypeArray] = useState([])
    const [cards, setCards] = useState([])
    const classes = useStyles();
    const getSvg = useGetStorageByNonce()
    const updateMany = useUpdateMany()
    const handleClick = baseType => () => {
        history.push('/detail#' + baseType)
    }

    //刷新所有纪念币数量
    useEffect(() => {
        if (contract) {
            let stale = false
            async function getTokenCount() {
                let nonce = await contract.nonce()
                nonce = + nonce;
                if (!stale) {
                    setTypeCount(nonce);
                }
            }
            getTokenCount();
            contract.on("CreateToken", (_operator, _typeId) => {
                getTokenCount();
            });
            return () => {
                stale = true;
                contract.removeAllListeners('CreateToken')
            }
        }
    }, [contract])

    //刷新typeArray
    useEffect(() => {
        if (typeCount > 0) {
            function getTypeArray() {
                let type_array = []
                if (typeCount <= PAGE_SIZE) {
                    for (let i = 1; i <= typeCount; i++) {
                        type_array.push(i)
                    }
                } else {
                    type_array = getIndexArray(typeCount, PAGE_SIZE, offset, 1)
                }
                setTypeArray(type_array)
            }
            getTypeArray();
        }
    }, [typeCount, offset])

    //更新纪念币图标信息等
    useEffect(() => {
        if (contract && typeArray.length > 0) {
            let stale = false
            function getTokenInfo() {
                let _cards = []
                let all_promise = []
                let actual_array = []
                for (let i = 0; i < typeArray.length; i++) {
                    let nonce = typeArray[i]
                    //判断是否本地存在svg
                    let info = getSvg(nonce) || {}
                    if (!info[SVG]) {
                        actual_array.push(nonce)
                        all_promise.push(contract.getTypeSVG(nonce))
                    } else {
                        _cards.push([nonce, info[SVG], info[NAME]])
                    }
                }
                if (all_promise.length !== 0) {
                    Promise.all(all_promise).catch(err => { }).then(r => {
                        //解析svg
                        let payload = {}
                        for (let i = 0; i < r.length; i++) {
                            let svg = r[i]
                            let name = getFirstContextByLabel(svg, NAME)
                            let issuer = getFirstContextByLabel(svg, ISSUER)
                            let description = getFirstContextByLabel(svg, DESCRIPTION) || getFirstContextByLabel(svg, DESC)
                            payload["" + actual_array[i]] = {
                                svg,
                                name,
                                issuer,
                                description
                            }
                            _cards.push([actual_array[i], svg, name])
                        }
                        if (!stale) {
                            updateMany(payload)
                        }
                    })
                } else {
                    setCards(_cards)
                }
            }
            getTokenInfo()

            return () => {
                stale = true
            }
        }
    }, [contract, typeArray, getSvg, updateMany])

    return (
        <Card>
            <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>{t("all_token")}</h4>
                <p className={classes.cardCategoryWhite}>
                    {typeCount === -1 ? t("is_getting") :
                        t('has_token').replace('{tokencount}', typeCount < 0 ? 0 : typeCount)}
                </p>
            </CardHeader>
            <CardBody>
                <Container className={classes.cardGrid} maxWidth={'xl'}>
                    <Grid container spacing={4} >
                        {cards.map((card, index) => (
                            <AlbumSvgItem key={card[0]}
                                tokenId={card[0]}
                                codeSource={card[1]}
                                name={card[2]}
                                onClick={handleClick(card[0])}
                            />
                        ))}
                    </Grid>
                </Container>
                <CssBaseline />
                <div className={classes.buttonWrapper}>
                    <Pagination
                        limit={PAGE_SIZE}
                        offset={offset}
                        total={typeCount}
                        size='large'
                        onClick={(e, _offset) => {
                            if (_offset === offset)
                                return;
                            setOffset(_offset)
                        }}
                    />
                </div>
            </CardBody>
        </Card>
    );
}

LatestTokens.propTypes = {
    classes: PropTypes.object
};

export default withRouter(LatestTokens)
