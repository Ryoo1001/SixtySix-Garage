export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 flex flex-col md:flex-row justify-between items-center py-6">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BengkelPro. Hak Cipta Dilindungi.
          </p>
        </div>
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Syarat & Ketentuan</a>
          <a href="#" className="hover:text-foreground">Kebijakan Privasi</a>
          <a href="#" className="hover:text-foreground">Hubungi Kami</a>
        </div>
      </div>
    </footer>
  );
}
