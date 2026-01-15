import Image from "next/image";

export function Header() {
    return (
        <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center justify-center">
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                <Image
                    src="/logo.png"
                    alt="表态 Logo"
                    fill
                    className="object-cover"
                />
            </div>
            <h1 className="sr-only">表态 (BiaoTai)</h1>
        </header>
    );
}
