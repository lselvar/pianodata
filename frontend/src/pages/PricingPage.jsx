import PricingCard from '../components/subscription/PricingCard'

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Simple Pricing</h1>
        <p className="text-gray-500 mt-2">Start with a 7-day free trial. No credit card required.</p>
      </div>
      <PricingCard />
    </div>
  )
}
