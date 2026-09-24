import { motion } from "framer-motion";
import { AppLogo } from "@/components/app-logo";
import { ContactForm } from "@/contact/contact-form";

export default function Contact() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center py-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-trust-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <AppLogo href="/" imageClassName="h-14 mb-6" />
          <h1 className="heading-page text-3xl mb-3">Contact us</h1>
          <p className="text-base text-muted-foreground font-medium max-w-[280px]">
            Questions about goELprep? Send us a message and we'll get back to you.
          </p>
        </div>

        <ContactForm />
      </motion.div>
    </div>
  );
}
