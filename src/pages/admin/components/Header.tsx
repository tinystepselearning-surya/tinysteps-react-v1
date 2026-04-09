import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenMenu?: () => void;
}

export default function Header({ onOpenMenu: _onOpenMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center px-4">
        <Link to="/" className="flex items-center" aria-label="Go to Tiny Steps homepage">
          <img src="/logo-header.webp" alt="Tiny Steps" className="h-8 w-auto" />
        </Link>
      </div>
    </header>
  );
}
