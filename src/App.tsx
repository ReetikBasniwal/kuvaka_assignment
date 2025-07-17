
import { LoadingScreen } from './components/LoadingScreen'
import { Dashboard } from './components/Dashboard'
import { Toaster } from './components/ui/toaster'
import { OTPAuth } from './components/OTPAuth'
import { useOTPAuth } from './hooks/useOTPAuth'

function App() {
  const { user, isLoading, isAuthenticated, login } = useOTPAuth()

  if (isLoading) {
    return <LoadingScreen />
  }
  
  if (!isAuthenticated || !user) {
    return <OTPAuth onAuthenticated={login} />
  }

  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  )
}

export default App