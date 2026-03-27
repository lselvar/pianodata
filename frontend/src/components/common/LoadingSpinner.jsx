export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="w-8 h-8 border-4 border-piano-200 border-t-piano-600 rounded-full animate-spin" />
    </div>
  )
}
