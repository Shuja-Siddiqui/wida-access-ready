import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContactForm } from "@/contact/contact-form";

export default function Contact() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Soft background illumination */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-trust-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 h-auto rounded-xl hover:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Button>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 mt-12"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-trust-blue to-[#e91e8c] flex items-center justify-center shadow-[0_8px_16px_rgba(255,77,141,0.2)] mb-6">
            <GraduationCap className="w-8 h-8 text-white stroke-[2]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">Contact us</h1>
          <p className="text-base text-muted-foreground font-medium max-w-[280px]">
            Questions about Access Ready? Send us a message and we'll get back to you.
          </p>
        </div>

        <ContactForm />
      </motion.div>
    </div>
  );
}
