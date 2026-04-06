export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗂️</div>
          <h1 className="text-3xl font-extrabold text-violet-700">Boreganizer</h1>
          <p className="text-stone-500 mt-1 text-sm">Organize the boring stuff.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
