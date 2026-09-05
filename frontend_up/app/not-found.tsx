import Link from "next/link"
import { ArrowLeft, Home, Briefcase, FileQuestion } from "lucide-react"

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg">
            <FileQuestion className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Page or Document Not Found
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The page, document, or resource you are looking for does not exist or has been moved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/en"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/en/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
