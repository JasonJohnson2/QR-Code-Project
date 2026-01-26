import { useRef, useState } from 'react'
import { NmiPayments, NmiThreeDSecure } from '@nmipayments/nmi-pay-react'

// Generate random amount between $1.00 and $100.00
const generateRandomAmount = () => {
  return (Math.random() * 99 + 1).toFixed(2)
}

function PaymentForm() {
  const threeDSRef = useRef(null)
  const [paymentToken, setPaymentToken] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [amount] = useState(generateRandomAmount())
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isProcessing, setIsProcessing] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-123-4567',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '90210',
    country: 'US',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePay = () => {
    if (!isValid || !paymentToken) {
      setStatus({ type: 'error', message: 'Please complete the payment form' })
      return
    }

    setIsProcessing(true)
    setStatus({ type: '', message: '' })

    // Start 3D Secure authentication
    threeDSRef.current?.startThreeDSecure({
      paymentToken,
      currency: 'USD',
      amount: parseFloat(amount),
      firstName: formData.first_name,
      lastName: formData.last_name,
      city: formData.city,
      postalCode: formData.zip,
      country: formData.country,
      phone: formData.phone,
      address1: formData.address1,
      state: formData.state,
      challengeIndicator: '04',
    })
  }

  const processPayment = async (threeDSResult = null) => {
    try {
      const payload = {
        paymentToken,
        amount: parseFloat(amount),
        currency: 'USD',
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
      }

      // Add 3DS data if available
      if (threeDSResult) {
        payload.cardHolderAuth = threeDSResult.cardHolderAuth
        payload.cavv = threeDSResult.cavv
        payload.eci = threeDSResult.eci
        payload.directoryServerId = threeDSResult.directoryServerId
        payload.threeDsVersion = threeDSResult.threeDsVersion
        payload.xid = threeDSResult.xid
      }

      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: `Payment successful! Transaction ID: ${data.transactionId}` 
        })
      } else {
        setStatus({ type: 'error', message: data.error || 'Payment failed' })
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Payment failed' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="payment-form">
      {/* Order Summary */}
      <div className="section">
        <h2>Order Summary</h2>
        <div className="amount-display">
          <span>Total:</span>
          <span className="amount">${amount}</span>
        </div>
      </div>

      {/* Customer Information */}
      <div className="section">
        <h2>Customer Information</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="first_name">First Name *</label>
            <input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Last Name *</label>
            <input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="section">
        <h2>Billing Address</h2>
        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="address1">Address *</label>
            <input
              id="address1"
              name="address1"
              value={formData.address1}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="state">State *</label>
            <input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              maxLength={2}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="zip">ZIP Code *</label>
            <input
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Information - NMI Component */}
      <div className="section">
        <h2>Payment Information</h2>
        <NmiPayments
          tokenizationKey="t6nz42-7r3RDh-Z3R23S-7352z5"
          layout="multiLine"
          paymentMethods={['card', 'ach', 'apple-pay', 'google-pay']}
          expressCheckoutConfig={{
            amount: parseFloat(amount),
            currency: 'USD',
          }}
          appearance={{ theme: 'light' }}
          onChange={(data) => {
            setIsValid(data.complete)
            if (data.complete && data.token) {
              setPaymentToken(data.token)
              console.log('Payment token received:', data.token)
            }
          }}
          onPay={async (token, paymentMethod) => {
            // Handle express payments (Apple Pay, Google Pay) directly
            if (paymentMethod === 'apple-pay' || paymentMethod === 'google-pay') {
              setPaymentToken(token)
              setIsProcessing(true)
              await processPayment(null)
              return true
            }
          }}
        />
      </div>

      {/* 3D Secure Component */}
      <NmiThreeDSecure
        ref={threeDSRef}
        tokenizationKey="t6nz42-7r3RDh-Z3R23S-7352z5"
        modal={true}
        onComplete={async (result) => {
          console.log('3DS Complete:', result)
          await processPayment(result)
        }}
        onFailure={(error) => {
          console.error('3DS Failed:', error)
          setStatus({ type: 'error', message: `3DS Authentication failed: ${error.message}` })
          setIsProcessing(false)
        }}
        onChallenge={() => {
          console.log('3DS Challenge in progress...')
        }}
      />

      {/* Status Messages */}
      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}

      {/* Pay Button */}
      <button
        className="pay-button"
        onClick={handlePay}
        disabled={!isValid || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </button>

      <p className="security-note">
        🔒 Payment secured with 3D Secure authentication
      </p>
    </div>
  )
}

export default PaymentForm

