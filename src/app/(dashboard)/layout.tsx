import Nav from '@/components/Nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-lg mx-auto pb-24 px-4">
        {children}
      </main>
      <Nav />
    </div>
  )
}
