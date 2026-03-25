import PaymentForm from './PaymentForm'

function App() {
  return (
    <div className="app">
      <header>
        <h1>Secure Checkout</h1>
        <nav className="test-nav">
          <a href="/collectjs-wallet-test.html" className="nav-link">
            Collect.js Wallet Test
          </a>
          <a href="/payment-test.html" className="nav-link">
            CDN Payment Test
          </a>
        </nav>
      </header>
      <main>
        <PaymentForm />
      </main>
    </div>
  )
}

export default App

