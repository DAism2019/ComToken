import React,{useState,useEffect} from 'react';
import { useWeb3Context } from 'web3-react'
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import IconButton from '@material-ui/core/IconButton';
import { ThemeProvider } from '@material-ui/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import { green } from '@material-ui/core/colors';
import clsx from 'clsx';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles,createMuiTheme } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { reactLocalStorage } from 'reactjs-localstorage';
import { useSnackbarContext } from 'contexts/SnackBarProvider.jsx';
import { useTranslation } from 'react-i18next'

const APIKEY = process.env.REACT_APP_APPKEY
const USERNAME = 'username'
const PASSWORD = 'password'
const CHECKED = 'checked'
const PRE_USERNAME = process.env.REACT_APP_USERNAME
const PRE_PASSWORD = process.env.REACT_APP_PASSWORD

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      {/* <Link color="inherit" href="https://naturaldao.io/"> */}
        NaturalDAO
      {/* </Link>{' '} */}
      {new Date().getFullYear()}
      {'. Built with '}
      <Link color="inherit" href="https://material-ui.com/">
        Material-UI.
      </Link>
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(6, 0, 2),
  },
  margin: {
    margin: theme.spacing(1),
  },
  textField: {
    flexBasis: 200,
  }
}));

const theme = createMuiTheme({
  palette: {
    primary: green,
  },
});

export default function SignIn({onLogin}) {
  const classes = useStyles();
  const [valid,setValid] = useState(false)
  const {active,account,error} = useWeb3Context()
  const {t} = useTranslation()
  const showSnackbar = useSnackbarContext()
  const [values, setValues] = React.useState({
      [USERNAME]:'',
      [PASSWORD]:'',
      [CHECKED]:false,
      showPassword: false,
  });
  const handleChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value });
  };
  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };
  function onSubmit(event){
      event.preventDefault();
      reactLocalStorage.setObject(APIKEY,values)
      if (values.username && values.password && values.username === PRE_USERNAME && values.password === PRE_PASSWORD){
          if(onLogin)
            onLogin()
      }else{
          showSnackbar(t("invalid_username_password"),"error")
      }

  }
  const handleChangeBox = (event) =>{
      setValues({
          ...values,
          checked:event.target.checked
      })
  };

  useEffect(()=>{
      let initInfos = reactLocalStorage.getObject(APIKEY)
      if(initInfos[USERNAME] && initInfos[PASSWORD] && initInfos[CHECKED]===true){
          setValues({
              [USERNAME]:initInfos[USERNAME],
              [PASSWORD]:initInfos[PASSWORD],
              [CHECKED]:initInfos[CHECKED],
              showPassword:false
          })
      }
  },[])

  useEffect(()=>{
      const flag = active && account && (!error)
      setValid(flag)
  },[active,account,error])

  return (
           <Container component="main" maxWidth="xs">
             <CssBaseline />
             <div className={classes.paper}>
               <Avatar className={classes.avatar}>
                 <LockOutlinedIcon />
               </Avatar>
               <Typography component="h1" variant="h5">
                 {t("sign_in")}
               </Typography>
               <form className={classes.form} onSubmit = {onSubmit}>
                   <ThemeProvider theme={theme}>
                       <TextField
                         fullWidth
                         required
                         className={classes.margin}
                         value={values.username}
                         onChange={handleChange(USERNAME)}
                         label={t("username")}
                         id="mui-theme-provider-outlined-input"
                       />
                 </ThemeProvider>

                 <FormControl
                     fullWidth
                     className={clsx(classes.margin, classes.textField)}>
                   <InputLabel htmlFor="adornment-password">{t("password")}</InputLabel>
                   <Input
                     fullWidth
                     required
                     id="adornment-password"
                     type={values.showPassword ? 'text' : 'password'}
                     value={values.password}
                     onChange={handleChange(PASSWORD)}
                     endAdornment={
                       <InputAdornment position="end">
                         <IconButton
                           aria-label="toggle password visibility"
                           onClick={handleClickShowPassword}
                           onMouseDown={handleMouseDownPassword}
                         >
                           {values.showPassword ? <Visibility /> : <VisibilityOff />}
                         </IconButton>
                       </InputAdornment>
                     }
                   />
                 </FormControl>
                 <FormControlLabel
                   name='remember'
                   control={<Checkbox value="remember"
                       checked={values.checked}
                       onChange={handleChangeBox} color="primary" />}
                   label={t("remember_me")}
                 />
                 <Button
                   type="submit"
                   fullWidth
                   variant="contained"
                   color="primary"
                   disabled={!valid}
                   className={classes.submit}
                 >
                   {t("sign_in")}
                 </Button>
               </form>
             </div>
             <Box mt={8}>
               <Copyright />
             </Box>
           </Container>
  );
}
