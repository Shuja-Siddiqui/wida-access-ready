import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { ContactForm } from "@/contact/contact-form";

export default function Contact() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-trust-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-sm mb-6">
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
