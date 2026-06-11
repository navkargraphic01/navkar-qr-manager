export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-navkar-700 mx-auto flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <p className="text-muted-foreground text-sm">Loading Navkar QR Manager...</p>
      </div>
    </div>
  )
}
