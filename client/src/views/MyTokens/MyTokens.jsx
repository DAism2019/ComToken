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
import { useWeb3Context } from 'web3-react';
import Grid from '@material-ui/core/Grid';
import { isAddress, getIndexArray, convertTypeIdToBase,getFirstContextByLabel, shortTokenId } from 'utils'
import Button from '@material-ui/core/Button';
import { utils } from 'ethers'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTokenContract } from 'hooks';
import TextField from '@material-ui/core/TextField';
import Container from '@material-ui/core/Container';
import AlbumSvgItem from 'components/AlbumItem/AlbumSvgItem.jsx'
import Pagination from "material-ui-flat-pagination"
import CssBaseline from "@material-ui/core/CssBaseline"
import { useTranslation } from 'react-i18next'
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { withRouter } from 'react-router'
import { useGetStorageByNonce, useUpdateMany } from 'contexts/SVGProvider'

const isMainnet = process.env.REACT_APP_NETWORK_ID && process.env.REACT_APP_NETWORK_ID === "1"
const OPENSEA_URL = isMainnet ? 'https://opensea.io/assets/' : 'https://rinkeby.opensea.io/assets/'
const PAGE_SIZE = 8;
const SVG = 'svg'
const NAME = "name"
const ISSUER = "issuer"
const DESCRIPTION = "description"
const DESC = "desc"

const useStyles = makeStyles(theme => ({
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

function MyTokens({ history }) {
  const classes = useStyles();
  const contract = useTokenContract()
  const [offset, setOffset] = useState(0)
  const { t } = useTranslation()
  const [tokenCount, setTokenCount] = useState(-1)
  const [tokenIndexArray, setTokenIndexArray] = useState([])
  const [tokenIdArray, setTokenIdArray] = useState([])
  const { account } = useWeb3Context()
  const [cards, setCards] = useState([])
  const [open, setOpen] = React.useState(false);
  const [recipient, setRecipient] = useState('');
  const [transferId, setTransferId] = useState('')
  const showSnackbar = useSnackbarContext()
  const getSvg = useGetStorageByNonce()
  const updateMany = useUpdateMany()

  //刷新token数量
  useEffect(() => {
    if (contract && account) {
      let stale = false
      async function getTokenCount() {
        let _tokenCount = await contract.balanceOf(account)
        _tokenCount = + _tokenCount;
        if (!stale) {
          setTokenCount(_tokenCount);
        }
      }
      getTokenCount();
      contract.on('Transfer', (from, to, tokenId, event) => {
        if (from === account) {
          showSnackbar(t("send_simple_token_success"), 'success')
          getTokenCount();
        } else if (to === account) {
          showSnackbar(t("receive_simple_token"), 'success')
          getTokenCount();
        }
      });

      return () => {
        stale = true;
        contract.removeAllListeners('Transfer')
      }
    }
  }, [contract, account, t, showSnackbar])

  //刷新indexArray
  useEffect(() => {
    if (contract && tokenCount > 0 && account) {
      let idArray = getIndexArray(tokenCount, PAGE_SIZE, offset)
      setTokenIndexArray(idArray);
    }
  }, [contract, tokenCount, account, offset]);

  //根据tokenID显示图标
  useEffect(() => {
    if (contract && account && tokenIdArray.length > 0) {
      let types = []
      let _cards = []
      for (let i = 0; i < tokenIdArray.length; i++) {
        let id = tokenIdArray[i]
        let typeId = convertTypeIdToBase(id)
        let info = getSvg(typeId) || {}
        if (!info[SVG]) {
          if (types.indexOf(typeId) !== -1) {
            types.push(typeId)
          }
        } else {
          _cards.push([id, info[SVG], info[NAME],typeId])
        }
      }
      if (types.length > 0) {
        let allPromise = []
        for (let i = 0; i < types.length; i++) {
          allPromise.push(contract.getTypeSVG(types[i]))
        }
        Promise.all(allPromise).catch(err => { }).then(r => {
          let payload = {}
          for (let i = 0; i < r.length; i++) {
            let _type = types[i]
            let svg = r[i]
            let name = getFirstContextByLabel(svg, NAME)
            let issuer = getFirstContextByLabel(svg, ISSUER)
            let description = getFirstContextByLabel(svg, DESCRIPTION) || getFirstContextByLabel(svg, DESC)
            payload["" + _type] = {
              svg,
              name,
              issuer,
              description
            }
          }
          updateMany(payload)
        })
      } else {
        _cards.sort((a, b) => {
          return a[3] - b[3]
        })
        setCards(_cards)
      }
    }
  }, [contract, account,getSvg,updateMany,tokenIdArray])

  //刷新纪念币tokenId列表
  useEffect(() => {
    if (contract && account && tokenIndexArray.length > 0) {
      let stale = false
      function getTokenInfoByOffset() {
        let allPromise = []
        for (let i = 0; i < tokenIndexArray.length; i++) {
          allPromise.push(contract.tokenOfOwnerByIndex(account, tokenIndexArray[i]))
        }
        if (allPromise.length > 0) {
          Promise.all(allPromise).then(results => {
            let token_ids = []
            for (let tokenId of results) {
              token_ids.push(tokenId)
            }
            if(!stale) {
              setTokenIdArray(token_ids)
            }
          })
        }

      }
      getTokenInfoByOffset()
      return () => {
        stale = true
      }
    }
  }, [contract, account, tokenIndexArray, offset])

  const handleClose = () => {
    setOpen(false);
    setRecipient('');
  };
  const handleChange = name => event => {
    if (name === 'recipient') {
      setRecipient(event.target.value)
    }
  };
  const onSend = (tokenId) => event => {
    setTransferId(tokenId)
    setOpen(true);
  };


  const onSell = (tokenId) => event => {
    let url = OPENSEA_URL + contract.address + '/' + tokenId.toString()
    // let url_fale = OPENSEA_URL + '0xe3a69aacd1b368a6407f7879da9127ceb7d34b07' + "/1?"
    window.open(url)
  }
  const onSubmit = (event) => {
    if (!isAddress(recipient)) {
      return showSnackbar(t("invalid_address"), 'error')
    }
    if (recipient.toLowerCase() === account.toLowerCase()) {
      return showSnackbar(t("send_self"), 'error')
    }
    let args = [account, recipient, transferId];
    let method = contract.transferFrom
    handleClose();
    method(...args, {
      gasPrice: utils.parseUnits('6.0', 'gwei')
      // gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
    }).then(response => {
      showSnackbar(t("transaction_send_success"), 'success')
    }).catch(err => {
      return showSnackbar(err, 'error')
    });
  }

  const show_id = shortTokenId((transferId ? transferId.toHexString() : ''), 6)
  return (
    <Card>
      <CardHeader color="primary">
        <h4 className={classes.cardTitleWhite}>{t("my_owned_token")}</h4>
        <p className={classes.cardCategoryWhite}>
          {tokenCount === -1 && account ? t("is_getting") :
            t('owned_token').replace("{tokencount}", tokenCount < 0 ? 0 : tokenCount)}
        </p>
      </CardHeader>
      <CardBody>
        <Container className={classes.cardGrid} maxWidth={'xl'}>
          {/* End hero unit */}
          <Grid container spacing={4} >
            {cards.map(card => (
              <AlbumSvgItem key={card[0].toHexString()}
                codeSource={card[1]}
                tokenId={card[0]}
                name={card[2]}
                onSend={onSend(card[0])}
                onSell={onSell(card[0])}
              />
            ))}
          </Grid>
        </Container>
        <CssBaseline />
        <div className={classes.buttonWrapper}>
          <Pagination
            limit={PAGE_SIZE}
            offset={offset}
            total={tokenCount}
            size='large'
            onClick={(e, _offset) => {
              if (_offset === offset)
                return;
              setOffset(_offset)
            }}
          />
        </div>
        <Dialog fullWidth maxWidth='sm'
          open={open} onClose={handleClose} aria-labelledby="form-dialog-title" >
          <DialogTitle id="form-dialog-title">{t("send_token").replace('{id}', show_id)}</DialogTitle>
          <DialogContent>
            <DialogContentText style={{ width: "100%" }}>
              {t("input_recipient") + ":"}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Ethereum Address"
              type="text"
              onChange={handleChange('recipient')}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary" >
              {t("cancel")}
            </Button>
            <Button onClick={onSubmit} color="primary">
              {t("send")}
            </Button>
          </DialogActions>
        </Dialog>
      </CardBody>
    </Card>
  );
}

MyTokens.propTypes = {
  classes: PropTypes.object
};

export default withRouter(MyTokens)
