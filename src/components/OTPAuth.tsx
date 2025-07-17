import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MessageCircle, Phone, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/use-toast'
import type { Country, OTPState } from '../types'

interface OTPAuthProps {
  onAuthenticated: (user: { id: string; phone: string; countryCode: string }) => void
}

export function OTPAuth({ onAuthenticated }: OTPAuthProps) {
  const { toast } = useToast()
  const [countries, setCountries] = useState<Country[]>([])
  const [otpState, setOtpState] = useState<OTPState>({
    step: 'phone',
    phone: '',
    countryCode: '+1',
    otp: '',
    isLoading: false,
    error: null,
    timeLeft: 0,
    canResend: true
  })

  // Fetch countries from restcountries.com
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2')
        const data = await response.json()
        
        const formattedCountries: Country[] = data
          .filter((country: any) => country.idd?.root && country.idd?.suffixes?.[0])
          .map((country: any) => ({
            name: country.name.common,
            code: country.cca2,
            dialCode: country.idd.root + (country.idd.suffixes[0] || ''),
            flag: country.flag
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name))

        setCountries(formattedCountries)
      } catch (error) {
        console.error('Failed to fetch countries:', error)
        // Fallback countries
        setCountries([
          { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
          { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
          { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
          { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' }
        ])
      }
    }

    fetchCountries()
  }, [])

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpState.timeLeft > 0) {
      interval = setInterval(() => {
        setOtpState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
          canResend: prev.timeLeft <= 1
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpState.timeLeft])

  const sendOTP = async () => {
    if (!otpState.phone.trim()) {
      setOtpState(prev => ({ ...prev, error: 'Please enter a valid phone number' }))
      return
    }

    setOtpState(prev => ({ ...prev, isLoading: true, error: null }))

    // Simulate API call with setTimeout
    setTimeout(() => {
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString()
      console.log(`🔐 OTP sent to ${otpState.countryCode}${otpState.phone}: ${generatedOTP}`)
      
      // Store OTP in sessionStorage for validation (in real app, this would be server-side)
      sessionStorage.setItem('otp', generatedOTP)
      sessionStorage.setItem('otpPhone', `${otpState.countryCode}${otpState.phone}`)
      
      setOtpState(prev => ({
        ...prev,
        step: 'otp',
        isLoading: false,
        timeLeft: 60,
        canResend: false
      }))

      toast({
        title: "OTP Sent!",
        description: `Verification code sent to ${otpState.countryCode}${otpState.phone}`,
      })
    }, 1500)
  }

  const verifyOTP = async () => {
    if (!otpState.otp.trim() || otpState.otp.length !== 6) {
      setOtpState(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }))
      return
    }

    setOtpState(prev => ({ ...prev, isLoading: true, error: null }))

    // Simulate OTP verification with setTimeout
    setTimeout(() => {
      const storedOTP = sessionStorage.getItem('otp')
      const storedPhone = sessionStorage.getItem('otpPhone')

      if (otpState.otp === storedOTP) {
        // Success - create user session
        const user = {
          id: `user_${Date.now()}`,
          phone: otpState.phone,
          countryCode: otpState.countryCode
        }
        
        // Store user in localStorage
        localStorage.setItem('otpUser', JSON.stringify(user))
        
        // Clean up OTP data
        sessionStorage.removeItem('otp')
        sessionStorage.removeItem('otpPhone')
        
        setOtpState(prev => ({ ...prev, step: 'verified', isLoading: false }))
        
        toast({
          title: "Verification Successful!",
          description: "Welcome to the app!",
        })

        // Call the authentication callback
        setTimeout(() => onAuthenticated(user), 1000)
      } else {
        setOtpState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid OTP. Please try again.'
        }))
      }
    }, 1000)
  }

  const resendOTP = () => {
    if (otpState.canResend) {
      setOtpState(prev => ({ ...prev, otp: '', error: null }))
      sendOTP()
    }
  }

  const goBack = () => {
    setOtpState(prev => ({
      ...prev,
      step: 'phone',
      otp: '',
      error: null,
      timeLeft: 0,
      canResend: true
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center">
            {otpState.step === 'phone' && <Phone className="w-8 h-8 text-white" />}
            {otpState.step === 'otp' && <Shield className="w-8 h-8 text-white" />}
            {otpState.step === 'verified' && <MessageCircle className="w-8 h-8 text-white" />}
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              {otpState.step === 'phone' && 'Enter Phone Number'}
              {otpState.step === 'otp' && 'Verify OTP'}
              {otpState.step === 'verified' && 'Verified!'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
              {otpState.step === 'phone' && 'We\'ll send you a verification code'}
              {otpState.step === 'otp' && `Code sent to ${otpState.countryCode}${otpState.phone}`}
              {otpState.step === 'verified' && 'Welcome to your AI companion'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {otpState.step === 'phone' && (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={otpState.countryCode}
                    onValueChange={(value) => setOtpState(prev => ({ ...prev, countryCode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.dialCode}>
                          <div className="flex items-center space-x-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-gray-500">({country.dialCode})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-50 dark:bg-gray-700 border border-r-0 rounded-l-md">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {otpState.countryCode}
                      </span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="1234567890"
                      value={otpState.phone}
                      onChange={(e) => setOtpState(prev => ({ 
                        ...prev, 
                        phone: e.target.value.replace(/\D/g, ''),
                        error: null 
                      }))}
                      className="rounded-l-none"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              {otpState.error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {otpState.error}
                </div>
              )}

              <Button 
                onClick={sendOTP}
                disabled={otpState.isLoading || !otpState.phone.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {otpState.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </>
          )}

          {otpState.step === 'otp' && (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otpState.otp}
                    onChange={(e) => setOtpState(prev => ({ 
                      ...prev, 
                      otp: e.target.value.replace(/\D/g, '').slice(0, 6),
                      error: null 
                    }))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>

                {otpState.timeLeft > 0 && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                    Resend OTP in {formatTime(otpState.timeLeft)}
                  </div>
                )}

                {otpState.canResend && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={resendOTP}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Resend OTP
                    </Button>
                  </div>
                )}
              </div>

              {otpState.error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {otpState.error}
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={verifyOTP}
                  disabled={otpState.isLoading || otpState.otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {otpState.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={goBack}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Phone Number
                </Button>
              </div>
            </>
          )}

          {otpState.step === 'verified' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                Phone number verified successfully!
              </p>
              <div className="animate-pulse">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Setting up your account...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}