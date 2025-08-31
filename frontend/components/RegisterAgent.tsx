'use client'

import { SwiftClient } from '@swift-protocol/sdk'
import { useState } from 'react'

type Props = {
  swift?: SwiftClient
  registered: boolean
  onRegistered: () => void
}

export function RegisterAgent({ swift, registered, onRegistered }: Props) {
  const [isRegistering, setIsRegistering] = useState(false)
  if (registered) {
    return (
      <p className="mt-6 text-green-500 text-center">
        ✅ Agent already registered.
      </p>
    )
  }

  return (
    <div className="mt-6 text-center">
      <button
        onClick={async () => {
          if (!swift || isRegistering) return
          setIsRegistering(true)
          try {
            console.log('🔄 Registering agent...')
            const txHash = await swift.registerAgent()
            console.log('✅ Registration tx:', txHash)
            
            // Wait a moment then verify registration
            setTimeout(async () => {
              try {
                const address = await swift.signer.getAddress()
                const isNowRegistered = await swift.isAgentRegistered(address)
                console.log('🔍 Post-registration check:', isNowRegistered)
                if (isNowRegistered) {
                  onRegistered()
                }
              } catch (verifyErr) {
                console.warn('Could not verify registration, assuming success')
                onRegistered()
              }
            }, 1000)
          } catch (err) {
            console.error('Registration failed:', err)
            alert('Agent registration failed. See console for details.')
          } finally {
            setIsRegistering(false)
          }
        }}
        disabled={!swift || isRegistering}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRegistering ? 'Registering...' : 'Register Agent'}
      </button>
    </div>
  )
}
