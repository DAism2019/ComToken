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
import React,{useState,useEffect} from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// @material-ui/core components
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import { makeStyles } from '@material-ui/core/styles';
import { useWeb3Context } from 'web3-react';
import Grid from '@material-ui/core/Grid';
import { isAddress,getIndexArray,convertTypeIdToBase,shortTokenId } from 'utils'
import Button from '@material-ui/core/Button';
import { utils } from 'ethers'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useMoleContract } from 'hooks';
import TextField from '@material-ui/core/TextField';
import Container from '@material-ui/core/Container';
// import AlbumSvgItem from 'components/AlbumItem/AlbumSvgItem.jsx'
import AlbumSvgItemNew from 'components/AlbumItem/AlbumNew.jsx'
import Pagination from "material-ui-flat-pagination"
import CssBaseline from "@material-ui/core/CssBaseline"
import { useTranslation } from 'react-i18next'
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { withRouter } from 'react-router'
import {ALL_SVGS} from  '../../constants/svgs'

const OPENSEA_URL = 'https://rinkeby.opensea.io/assets/'
const PAGE_SIZE = 8;

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
     buttonWrapper:{
         display: 'flex',
         flexDirection: 'column',
         alignItems: 'center'
     },
     cardGrid: {
       paddingTop: theme.spacing(8),
       paddingBottom: theme.spacing(8),
     }
}));

function MyTokens({history}) {
    const mole_contract = useMoleContract()
    const [offset,setOffset] = useState(0)
    const {t} = useTranslation()
    const [tokenCount,setTokenCount] = useState(-1)
    const [tokenArray,setTokenArray] = useState([])
    const { account } = useWeb3Context()
    const [cards,setCards] = useState([])
    const [open, setOpen] = React.useState(false);
    const [recipient,setRecipient] = useState('');
    const [transferId,setTransferId ] = useState('')

    const classes = useStyles();
    const showSnackbar= useSnackbarContext()

    //刷新token数量
    useEffect(()=>{
        if(mole_contract && account){
          let stale = false
          async function getTokenCount(){
              let _tokenCount = await mole_contract.balanceOf(account)
              _tokenCount = + _tokenCount;
              if(!stale)
                setTokenCount(_tokenCount);
          }
          getTokenCount();
          mole_contract.on('Transfer',(from,to,tokenId,event)=>{
             if(from === account){
                 showSnackbar(t("send_simple_token_success"),'success')
                 getTokenCount();
             }else if (to === account){
                 showSnackbar(t("receive_simple_token"),'success')
                 getTokenCount();
             }
          });
          return () => {
               stale = true;
               mole_contract.removeAllListeners('Transfer')
          }
        }
    },[mole_contract,account,t,showSnackbar])

    //刷新tokenArray
    useEffect(()=>{
        if(mole_contract && tokenCount > 0 && account ){
            let idArray = getIndexArray(tokenCount,PAGE_SIZE,offset)
            setTokenArray(idArray);
        }
    },[mole_contract,tokenCount,account,offset]);

    //刷新纪念币信息
    useEffect(()=>{
        if( mole_contract && account && tokenArray.length > 0){
            let stale = false
            function getTokenInfoByOffset(){
                let _cards = []
                let allPromise = []
                for(let i=0;i<tokenArray.length;i++){
                    allPromise.push(mole_contract.tokenOfOwnerByIndex(account,tokenArray[i]))
                    // let tokenId = await mole_contract.tokenOfOwnerByIndex(account,tokenArray[i])
                    // let baseType = convertTypeIdToBase(tokenId)
                    // let svgCode = All_ICONS[baseType -1]
                    // let baseType = await mole_contract.getNonFungibleBaseType(tokenId)
                    // let svgCode = (await mole_contract.allTypeInfos(baseType)).svgCode
                    // let title = getFirstContextByLabel(svgCode,SVG_TITLE);
                    // let _data = [tokenId,svgCode,baseType]
                    // _cards.push(_data)
                }
                if (allPromise.length > 0) {
                    Promise.all(allPromise).then(results => {
                        for (let tokenId of results) {
                            let baseType = convertTypeIdToBase(tokenId)
                            // let svgCode = getIconByTypeId(baseType)
                            let _data = [tokenId,baseType]
                            _cards.push(_data)
                        }
                        _cards.sort((a,b) => {
                            return a[2] - b[2]
                        })
                        if(!stale){
                            setCards(_cards)
                        }
                    })
                }
                // if(!stale){
                //     setCards(_cards)
                // }
            }
            getTokenInfoByOffset()
            return ()=>{
              stale = true
            }
        }
    },[mole_contract,account,tokenArray,offset])

    const handleClose = () => {
        setOpen(false);
        setRecipient('');
    };
    const handleChange = name => event => {
        if(name === 'recipient'){
          setRecipient(event.target.value)
        }
    };
    const onSend = (tokenId) => event => {
        setTransferId(tokenId)
        setOpen(true);
    };

    // const handleClick = baseType => () => {
    //     history.push('/detail#' + baseType)
    // }

    const onSell = (tokenId) => event => {
        let url = OPENSEA_URL + mole_contract.address + '/' + tokenId.toString()
        // let url_fale = OPENSEA_URL + '0xe3a69aacd1b368a6407f7879da9127ceb7d34b07' + "/1?"
        window.open(url)
    }
    const onSubmit = (event) => {
        if (!isAddress(recipient)){
            return showSnackbar(t("invalid_address"),'error')
        }
        if(recipient.toLowerCase() === account.toLowerCase()){
            return showSnackbar(t("send_self"),'error')
        }
        let args = [account,recipient,transferId];
        let method = mole_contract.transferFrom
        handleClose();
        method(...args,{
           gasPrice:utils.parseUnits('6.0','gwei')
           // gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
        }).then(response => {
            showSnackbar(t("transaction_send_success"),'success')
        }).catch(err =>{
            return showSnackbar(err,'error')
        });
    }

    const show_id = shortTokenId ((transferId ? transferId.toHexString() : ''),6)
    return (
        <Card>
         <CardHeader color="primary">
           <h4 className={classes.cardTitleWhite}>{t("my_owned_token")}</h4>
           <p className={classes.cardCategoryWhite}>
               {tokenCount === -1 && account ? t("is_getting") :
               t('owned_token').replace("{tokencount}",tokenCount < 0 ? 0 :tokenCount)}
           </p>
         </CardHeader>
         <CardBody>
             <Container className={classes.cardGrid}  maxWidth={'xl'}>
               {/* End hero unit */}
               <Grid container spacing={4} >
                 {cards.map(card => (
                     <AlbumSvgItemNew key={card[0].toHexString()}
                         // index={card[1]}
                         codeSource={ALL_SVGS[card[1]-1]}
                         tokenId={card[0]}
                         // svgCode={card[1]}
                         // onClick={handleClick(card[1])}
                         onSend = {onSend(card[0])}
                         onSell = {onSell(card[0])}
                      />
                 ))}
               </Grid>
             </Container>
             <CssBaseline />
             <div className = {classes.buttonWrapper}>
                 <Pagination
                  limit={PAGE_SIZE}
                  offset={offset}
                  total={tokenCount}
                  size ='large'
                  onClick={(e,_offset) => {
                       if(_offset === offset)
                           return;
                       setOffset(_offset)
                  }}
                />
             </div>
             <Dialog fullWidth maxWidth='sm'
                 open={open} onClose={handleClose} aria-labelledby="form-dialog-title" >
               <DialogTitle id="form-dialog-title">{t("send_token").replace('{id}',show_id)}</DialogTitle>
               <DialogContent>
                 <DialogContentText style={{width:"100%"}}>
                   {t("input_recipient") + ":"}
                 </DialogContentText>
                 <TextField
                   autoFocus
                   margin="dense"
                   id="name"
                   label="Ethereum Address"
                   type="text"
                   onChange = {handleChange('recipient')}
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
