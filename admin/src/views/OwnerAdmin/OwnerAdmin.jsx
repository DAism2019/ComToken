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
// @material-ui/core components
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
// import Search from "@material-ui/icons/Search";
import { makeStyles } from '@material-ui/core/styles';
import { useTokenInfoContract } from 'hooks';
import { useWeb3Context } from 'web3-react';
import styled from 'styled-components'
import { ethers } from 'ethers'
import { isAddress } from "utils"
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { useTranslation } from 'react-i18next'

const ButtonWrapper = styled.div`
  ${ ({
    theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: center;
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
    }
}));


function OwnerAdmin() {
    const classes = useStyles()
    const { t } = useTranslation()
    const contract = useTokenInfoContract()
    const { account } = useWeb3Context()
    const showSnackbar = useSnackbarContext()
    const [owner, setOwner] = useState("")
    const [newOwner,setNewOwner] = useState("")

    const doChange = (e) => {
        e.preventDefault()
        if(!isAddress(newOwner)) {
            return showSnackbar(t('invalid_address'), 'error');
        }
        if (contract) {
            contract.transferOwnership(newOwner, {
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

    const handleChange = (e) => {
        let value = e.currentTarget.value;
        setNewOwner(value)
    }

    //get owner
    useEffect(() => {
        if (contract) {
            let stale = false;
            function getOwner() {
                contract.owner().then(r => {
                    if (!stale) {
                        setOwner(r)
                    }
                }).catch(err => { })
            }
            contract.on("OwnershipTransferred",(previousOwner,newOwner)=>{
                getOwner()
            })
            getOwner()

            return () => {
                stale = true
            }
        }
    }, [contract])

    const valid = owner && account && account === owner
    return (
        <Card>
            <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>{t("owner_admin")}</h4>
            </CardHeader>
            <CardBody>
                <form onSubmit={doChange} autoComplete="off" >
                    <FormControl margin="normal" required fullWidth>
                        <TextField required id="outlined-owner-required"
                            label={t("owner_address")} value={owner}
                            readOnly
                            error
                            className={classes.textField}
                            margin="normal" variant="outlined" />
                        <TextField required id="outlined-newOwner-required"
                            label={t("input_new_owner")} value={newOwner}
                            onChange={handleChange} className={classes.textField}
                            margin="normal" variant="outlined" />
                       
                    </FormControl>
                   
                    <ButtonWrapper>
                        <Button variant="contained"
                            type="submit"
                            disabled={!valid} className={classes.transferButton}>
                            {t("change")}
                        </Button>
                    </ButtonWrapper>
                </form>
            </CardBody>
        </Card>
    )
}

export default OwnerAdmin