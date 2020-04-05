//本文件使用Material UI来显示一个Svg图标，使用相册的方式
import React,{useRef,useEffect,useState} from 'react';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

//用来短显示tokenId
import {shortTokenId} from 'utils'
//转换svg和json
import {parse, stringify} from 'svgson'
//多语言
import { useTranslation } from 'react-i18next'
//屏幕改变大小监测
import ReactResizeDetector from 'react-resize-detector';

const useStyles = makeStyles(theme => ({
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    btnWrapper:{
        width:"100%",
        textAlign:"center",
    },
    cardContent: {
        flexGrow: 1,
        backgroundColor:'rgba(230,230,230,.30)'
    },
    headerWrapper:{
        justifyContent:"center"
    },
    btn:{
        margin:"5px",
        backgroundColor:'rgba(90,230,230,.30)',
        width:"25%"
    }
}));


//参数分别为要显示的tokenId，名称，点击（详情），售卖、赠送，显示的svg源码
function AlbumSvgItem({tokenId,name,onClick,onSell,onSend,codeSource}) {
    const classes = useStyles()
    const refItem = useRef()
    const refContainer = useRef()
    const [svgCode,setSvgCode] = useState('')
    const {t} = useTranslation()

    //记录最后一次缩放后宽度大小，防止松开鼠标时再触发一次大小重绘
    let lastWidth = 0

    //使用容器宽度重新计算svg显示大小
    const onResize = () => {
        if(refItem.current && svgCode && refContainer.current && refContainer.current.clientWidth){
            const width = refContainer.current.clientWidth
            if (lastWidth === width) {
                return
            }else{
                lastWidth = width
            }
            let newSvgCode = svgCode
            newSvgCode.attributes.width = width
            newSvgCode.attributes.height = width
            let _svgItem = stringify(newSvgCode);
            //采用innerHTML方法才能让svg中所有的元素都发挥作用，比如鼠标点击事件
            refItem.current.innerHTML = _svgItem;
        }
    }

    //加载时解析源码
    useEffect(()=>{
        if(codeSource) {
            parse(codeSource).then(r => {
              setSvgCode(r)
            }).catch(err =>{
              //
            })
        }
    },[codeSource])

    //自定义button，简化代码
    const MyBtn = ({onClick,children}) => {
      return(
        <Button size="small" variant="outlined" color="primary" onClick={onClick} className={classes.btn}>
        {children}
        </Button>
      )
    }

    return (
        <Grid item xs={12} sm={6} md={3} >
          <ReactResizeDetector handleWidth onResize={onResize} />
          <Card className={classes.card} ref={refContainer}>
              <div className={classes.headerWrapper} ref ={refItem} />
              <CardContent className={classes.cardContent}>
                  {
                      tokenId &&  <Typography gutterBottom  >
                         {"# " + shortTokenId(tokenId,6)}
                       </Typography>
                  }
                  {
                      name && <Typography>
                        {t("name") + ": " + name}
                      </Typography>
                  }

              </CardContent>
              <CardActions>
                  <div className={classes.btnWrapper}>
                      {onClick && <MyBtn onClick={onClick}>
                        {t("detail")}
                      </MyBtn>}
                      {onSend && <MyBtn onClick={onSend}>
                        {t("send")}
                      </MyBtn>}
                      {onSell && <MyBtn onClick={onSell}>
                        {t("sell")}
                      </MyBtn>}
                  </div>
              </CardActions>
          </Card>
        </Grid>
    )
}

export default AlbumSvgItem
