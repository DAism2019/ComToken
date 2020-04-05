import React,{ Suspense } from 'react'
import Web3ReactManager from 'Web3ReactManager'
import styled from 'styled-components'
import Header from 'components/Header'
import SignIn from './SignIn'

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`
const SignInWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  ${'' /* margin-top: -3rem; */}
`

export default function UserLogin({onLogin}) {
    return (
        <Suspense fallback = {null } >
          <Web3ReactManager >
              <HeaderWrapper>
                  <Header />
              </HeaderWrapper>
              <SignInWrapper>
                  <SignIn onLogin={onLogin}/>
              </SignInWrapper>
          </Web3ReactManager>
        </Suspense>
   )
}
