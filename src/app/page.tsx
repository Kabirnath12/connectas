export default function Home() {
  const categories = ["Creators", "Services", "Businesses", "Opportunities", "Property", "Vehicles", "Marketplace", "Freelancers"];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight">CollabX</h1>
          <div className="hidden gap-8 md:flex">
            <a href="#explore" className="text-sm text-gray-600 hover:text-black">Explore</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-black">How it works</a>
            <a href="#categories" className="text-sm text-gray-600 hover:text-black">Categories</a>
          </div>
          <a href="/login" className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">Get Started</a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-24 text-center md:py-32">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">COLLABX</p>
        <h2 className="text-5xl font-bold tracking-tight md:text-7xl">Everything connects.</h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
          Discover people, showcase your work, find opportunities, discover services and collaborate with businesses.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a href="/login" className="rounded-full bg-black px-7 py-3.5 font-medium text-white hover:bg-gray-800">Get Started</a>
          <a href="#explore" className="rounded-full border border-gray-300 px-7 py-3.5 font-medium hover:bg-gray-50">Explore CollabX</a>
        </div>
      </section>

      <section id="explore" className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold">What are you looking for?</h3>
          <p className="mt-3 text-gray-600">Find people, services, businesses, opportunities and more.</p>
          <div className="mt-8 flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <input className="w-full px-5 py-4 outline-none" placeholder="Try “restaurant photographer in Guwahati”" />
            <button className="bg-black px-7 font-medium text-white">Search</button>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6 py-20">
        <h3 className="text-3xl font-bold">One platform. Many possibilities.</h3>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div key={category} className="rounded-2xl border border-gray-200 p-6 hover:shadow-sm">
              <h4 className="text-lg font-semibold">{category}</h4>
              <p className="mt-2 text-sm text-gray-600">Discover and connect on CollabX.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <h3 className="text-3xl font-bold">Don’t tell people what you can do. Show them.</h3>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {["Showcase your work", "Get discovered", "Collaborate and grow"].map((x, i) => (
              <div key={x} className="rounded-2xl border border-white/20 p-6">
                <div className="text-sm text-white/60">0{i + 1}</div>
                <h4 className="mt-3 text-xl font-semibold">{x}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CollabX. Everything connects.
      </footer>
    </main>
  );
}
