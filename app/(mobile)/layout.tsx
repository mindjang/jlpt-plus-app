export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-page w-full overflow-x-hidden">
      <div className="mx-auto max-w-lg w-full min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}

