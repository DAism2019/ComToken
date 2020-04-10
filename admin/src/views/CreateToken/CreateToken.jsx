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
import InputAdornment from '@material-ui/core/InputAdornment';
import { makeStyles } from '@material-ui/core/styles';
import { useTokenContract } from 'hooks';
import { useWeb3Context } from 'web3-react';
import { parse, stringify } from 'svgson'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { isAddress,getFirstContextByLabel } from "utils"
import { FilePicker } from 'react-file-picker'
import { isMobile } from 'react-device-detect'
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { useTranslation } from 'react-i18next'


// const ZERO_ADDRESS = ethers.constants.AddressZero

const ButtonWrapper = styled.div`
  ${ ({
    theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: center;
  `

const LogoWrapper = styled.div`
   margin-left: "10px"
`;

const useStyles = makeStyles(theme => ({
    note: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        bottom: "10px",
        color: "#00c1c2",
        display: "block",
        fontWeight: "400",
        fontSize: isMobile ? "13px" : "18px",
        lineHeight: isMobile ? "13px" : "18px",
        left: "0",
        marginLeft: "20px",
        position: "absolute",
        // width: "260px"
    },
    cardCategoryWhite: {
        // color: "rgba(33,33,33,.99)",
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
    transferButton: {
        margin: theme.spacing(6),
        width: "10%",
        backgroundColor: '#FF8623'
    },
    buttonWrapper: {
        // width:"100%"
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    selectButton: {
        backgroundColor: '#FF8623',
        marginTop: "10px",
        marginLeft: isMobile ? "200px" : 0
    }
}));

const BASE_URI = "http://kaihua.xyz:5050/token/"
const NAME = "name"
const ISSUER = "issuer"
const DESCRIPTION = "description"
const DESC = "desc"

const valuesInit = {
    limit: 0,
    buyLimit: 0,
    price: 0,
    beneficiary: "0x1234...",
    svgCode: ''
}

function CreateToken({ history }) {
    const classes = useStyles()
    const { t } = useTranslation()
    const contract = useTokenContract()
    const { account } = useWeb3Context()
    const showSnackbar = useSnackbarContext()
    const [owner, setOwner] = useState("")
    const ref = useRef()
    const [values, setValues] = useState(valuesInit)

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

    const doCreate = (event) => {
        event.preventDefault();
        const { limit, buyLimit, beneficiary, price, svgCode } = values;
        let _limit = + limit;
        if (Number.isNaN(_limit)) {
            return showSnackbar(t('error_maxLimit'), 'error');
        }
        let _buyLimit = + buyLimit;
        if (Number.isNaN(_buyLimit)) {
            return showSnackbar(t('error_maxLimit'), 'error');
        }
        let _price = + price;
        if (Number.isNaN(_price)) {
            return showSnackbar(t('error_price'), 'error');
        }
        if (!isAddress(beneficiary)) {
            return showSnackbar(t('invalid_address'), 'error');
        }
        _price = ethers.utils.parseEther("" + _price);
        if (!svgCode) {
            return showSnackbar(t('error_svg'), 'error');
        }
        let name = getFirstContextByLabel(svgCode,NAME)
        let desc = getFirstContextByLabel(svgCode,DESC)
        let description = getFirstContextByLabel(svgCode,DESCRIPTION)
        let issuer = getFirstContextByLabel(svgCode,ISSUER)
        if(!name || !issuer || (!desc && !description)) {
            return showSnackbar(t('label_absence'), 'error');
        }

        if (contract) {
            contract.createToken(_limit, _buyLimit, _price, beneficiary, BASE_URI, svgCode, {
                gasPrice: ethers.utils.parseUnits('2.5', 'gwei')
            }).then(response => {
                showSnackbar(t('transaction_send_success'), 'success')
            }).catch(err => {
                showSnackbar(err.message, 'error')
            });
        } else {
            showSnackbar(t("contract_null"), 'error')
        }

    };

    const handleChange = name => event => {
        setValues({
            ...values,
            [name]: event.target.value
        });
    };
    //refresh svg imgae
    useEffect(() => {
        if (ref.current && values.svgCode) {
            parse(values.svgCode).then(result => {
                let new_json = result;
                new_json.attributes.height = '300px'
                new_json.attributes.width = '300px'
                ref.current.innerHTML = stringify(new_json)
            })
        }
    }, [values.svgCode])

    //get owner
    useEffect(() => {
        if (contract) {
            let stale = false;
            contract.owner().then(r => {
                if (!stale) {
                    setOwner(r)
                }
            }).catch(err => { })


            return () => {
                stale = true
            }
        }
    }, [contract])

    //listen create
    useEffect(() => {
        if (account && contract) {
            let stale = false;
            let filter = contract.filters.CreateToken(account);
            contract.on(filter, (creator, typeId, event) => {
                if (!stale) {
                    showSnackbar(t("create_token_success"), 'success', () => {
                        history.push('/all')
                    })
                }
            });
            return () => {
                stale = true;
                contract.removeAllListeners('CreateToken')
            }
        }
    }, [account, contract, history, showSnackbar, t]);

    const { limit, buyLimit, beneficiary, price } = values;
    const valid = owner && account && account === owner
    return (
        <Card>
            <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>{t("create_token")}</h4>
                <p className={classes.cardCategoryWhite}>
                    {t("create_token_description")}
                </p>
            </CardHeader>
            <CardBody>
                <form onSubmit={doCreate} autoComplete="off" >
                    <FormControl margin="normal" required fullWidth>
                        <TextField required id="outlined-limit-required"
                            label={t("input_token_maxLimit")} value={limit}
                            onChange={handleChange('limit')} className={classes.textField}
                            margin="normal" type="number" variant="outlined" />
                        <TextField required id="outlined-buyLimit-required"
                            label={t("input_buy_limit")} value={buyLimit}
                            onChange={handleChange('buyLimit')} className={classes.textField}
                            margin="normal" type="number" variant="outlined" />
                        <TextField required id="outlined-price-required"
                            label={t("input_token_price")} value={price}
                            onChange={handleChange('price')} className={classes.textField}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                            margin="normal" variant="outlined" />
                        <div className={classes.note} >
                            {t("input_token_logo")}
                        </div>
                        <TextField required id="outlined-beneficiary-required"
                            label={t("input_beneficiary_address")} value={beneficiary}
                            onChange={handleChange('beneficiary')} className={classes.textField}
                            margin="normal" variant="outlined" />
                        <div className={classes.note} >
                            {t("input_token_logo")}
                        </div>
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
                    <LogoWrapper ref={ref} />
                    <ButtonWrapper>
                        <Button variant="contained"
                            type="submit"
                            disabled={!valid} className={classes.transferButton}>
                            {t("create")}
                        </Button>
                    </ButtonWrapper>
                </form>
            </CardBody>
        </Card>
    )
}

CreateToken.propTypes = {
    classes: PropTypes.object
};

export default withRouter(CreateToken)
