export default function Footer() {
  return (
    <footer className="text-center py-6 bg-[#fafafa] text-gray-600">
      <div className="mx-auto max-w-6xl px-4">
        © {new Date().getFullYear()} Tiny Steps Learning
        <nav className="mt-2 flex gap-4 justify-center text-[#e05c0a] font-semibold">
          <a href="/main/courses/">Courses</a>
          <a href="/main/parents/">Parents</a>
          <a href="/blog/">Blog</a>
          <a href="/main/book-demo/">Book a Trial</a>
        </nav>
      </div>
    </footer>
  );
}
