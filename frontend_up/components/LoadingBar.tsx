"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation" // Use usePathname for App Router
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingBar() {
  const pathname = usePathname() // Get current pathname
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // When pathname changes, start loading
    setLoading(true)

    // Simulate loading completion after a short delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500) // Adjust delay as needed

    return () => clearTimeout(timer)
  }, [pathname]) // Re-run effect when pathname changes

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-[9999]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          exit={{ width: "100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  )
}
