import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Share2, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            <span className="font-bold text-xl">Media Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Personal Media Library
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload, share, and embed your media files. Powered by GitHub and jsDelivr CDN.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Easy Upload</h3>
                <p className="text-muted-foreground">
                  Drag and drop files or click to upload. Supports images, videos, and audio files up to 100MB.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Share & Embed</h3>
                <p className="text-muted-foreground">
                  Get public URLs via jsDelivr CDN. Embed anywhere with HTML, Markdown, or BBCode.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">100% Free</h3>
                <p className="text-muted-foreground">
                  Powered by GitHub and jsDelivr. No subscriptions. No limits.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Media Manager. Built with Next.js, GitHub, jsDelivr, and Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}
