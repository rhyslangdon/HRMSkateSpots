'use client';
import { useState } from 'react';

export default function PaymentPage() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Format card number as 4242 4242 4242 4242
  function formatCardNumber(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  // Format expiry as MM/YY
  function formatExpiry(value: string) {
    let v = value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
    return v.slice(0, 5);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Basic fake validation
    if (
      cardNumber.replace(/\D/g, '').length !== 16 ||
      expiry.length !== 5 ||
      cvc.length < 3 ||
      !name ||
      !address ||
      !city ||
      !postal ||
      !country
    ) {
      setError('Please fill out all fields with valid info.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Update subscription in Supabase
      (async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user) {
            setError('Could not get user info. Please log in.');
            return;
          }
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ subscription_status: 'premium' })
            .eq('id', user.id);
          if (updateError) {
            setError('Failed to upgrade subscription. Try again.');
            return;
          }
          setSuccess(true);
        } catch (err) {
          setError('Unexpected error. Try again.');
        }
      })();
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto mt-16 mb-16 p-8 border rounded-xl bg-background shadow">
      <h1 className="text-2xl font-bold mb-2 text-foreground text-center">Payment Details</h1>
      <div className="mb-8 text-center">
        <div className="inline-block bg-muted rounded-lg px-6 py-4 shadow-sm">
          <div className="text-lg font-semibold text-foreground">Premium Subscription</div>
          <div className="text-2xl font-bold text-primary mt-1">
            $19.00 <span className="text-base font-normal text-muted-foreground">/ month</span>
          </div>
          <ul className="mt-2 text-sm text-muted-foreground text-left list-disc list-inside">
            <li>Unlimited skate spot submissions</li>
            <li>Access to premium features</li>
            <li>Priority support</li>
            <li>Cancel anytime</li>
          </ul>
        </div>
      </div>
      {success ? (
        <div className="text-green-600 font-semibold text-center">
          Payment successful! Your account is now premium.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="font-semibold text-lg mb-2">Card Information</legend>
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                Card Number
              </label>
              <input
                id="cardNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                className="w-full border rounded px-3 py-2 tracking-widest text-lg font-mono"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                disabled={loading}
                autoComplete="cc-number"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="expiry" className="block text-sm font-medium mb-1">
                  Expiry
                </label>
                <input
                  id="expiry"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9/]*"
                  className="w-full border rounded px-3 py-2 font-mono"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  disabled={loading}
                  autoComplete="cc-exp"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="cvc" className="block text-sm font-medium mb-1">
                  CVC
                </label>
                <input
                  id="cvc"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full border rounded px-3 py-2 font-mono"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  disabled={loading}
                  autoComplete="cc-csc"
                  required
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="font-semibold text-lg mb-2">Billing Address</legend>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Name on card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address
              </label>
              <input
                id="address"
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="123 Main St"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                autoComplete="address-line1"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={loading}
                  autoComplete="address-level2"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="postal" className="block text-sm font-medium mb-1">
                  Postal Code
                </label>
                <input
                  id="postal"
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Postal Code"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  disabled={loading}
                  autoComplete="postal-code"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                Country
              </label>
              <input
                id="country"
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={loading}
                autoComplete="country"
                required
              />
            </div>
          </fieldset>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-2 rounded disabled:opacity-60 mt-2"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay & Upgrade'}
          </button>
        </form>
      )}
    </div>
  );
}
