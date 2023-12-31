'use client'

import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { ChainId } from "@biconomy/core-types";
import SocialLogin from "@biconomy/web3-auth"
import SmartAccount from "@biconomy/smart-account";
import dynamic from 'next/dynamic';

// Dynamically import Minter component
const Minter = dynamic(() => import('./components/minter.tsx'), { ssr: false });

export default function App() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [provider, setProvider] = useState<any>(null);
  const [acct, setAcct] = useState<any>(null);

  useEffect(() => {
    let configureLogin:any
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
  }, [interval])

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin()
      const signature1 = await socialLoginSDK.whitelistUrl('http://localhost:3000/')
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
        network: "testnet",
        whitelistUrls: {
          'http://localhost:3000/': signature1,
        }
      })
      sdkRef.current = socialLoginSDK
    }
    if (!sdkRef.current.provider) {
      sdkRef.current.showWallet()
      enableInterval(true)
    } else {
      setupSmartAccount()
    }
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) return
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    setProvider(web3Provider)
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: 80001,
        supportedNetworksIds: [80001],
        networkConfig: [
          {
            chainId: 80001,
            dappAPIKey: process.env.VITE_BICONOMY_API_KEY,
          },
        ],
      })
      const acct = await smartAccount.init()
      setAcct(acct)
      setSmartAccount(smartAccount)
      setLoading(false)
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
  }
  

  const logout = async () => {
    if (!sdkRef.current) {
      console.error('Web3Modal not initialized.')
      return
    }
    await sdkRef.current.logout()
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }

  console.log({ acct , provider})

 
  
  return (
    <div>
      
    
      {
        !smartAccount && !loading && <button onClick={login}>Login to get your SCW address </button>
      }
      {
        loading && <p>Loading account details...</p>
      }
      {
        !!smartAccount && (
          <div className="buttonWrapper">
            <h3>Smart account address: {smartAccount.address} </h3>
            <p></p>

            <Minter smartAccount= {smartAccount} provider={provider} acct={acct} />
            <br></br>
            <br></br>
            <button onClick={logout}>Logout</button>
          </div>
        )
      }
     <p>
      <br></br>
      <br></br>
      <a href="https://docs.biconomy.io/introduction/overview" target="_blank" className="read-the-docs">
  Click here to check out the docs
    </a></p>

    </div>
  )
}