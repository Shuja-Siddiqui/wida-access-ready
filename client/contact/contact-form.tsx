import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, Loader2, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputField } from "@/components/input-field";
import { useApi, extractErrorMessage } from "@/hooks/use-api";

type Step = "form" | "sent";

export function ContactForm() {
  const { request } = useApi();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = name.trim() && email.trim() && message.trim() && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      await request("/api/contact", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      setStep("sent");
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("form");
    setName("");
    setEmail("");
    setMessage("");
    setErrorMsg("");
  };

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-3xl shadow-xl p-8 w-full">
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Your name"
                id="contact-name"
                type="text"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />

              <InputField
                label="Email address"
                id="contact-email"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Message</Label>
                <div className="relative">
                  <MessageSquare className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground stroke-[2]" />
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    className="pl-11 pt-3.5 min-h-[120px]"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm font-medium text-destructive px-1">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="btn-brand w-full h-14 mt-2 text-sm rounded-xl disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Send message"
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {step === "sent" && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="text-center space-y-6 py-4"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-growth-green/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-growth-green" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black tracking-tight">Message sent</h2>
              <p className="text-base text-muted-foreground font-medium leading-relaxed">
                Thanks for reaching out, {name}. We'll reply to{" "}
                <span className="font-bold text-foreground">{email}</span> soon.
              </p>
            </div>
            <Button
              onClick={reset}
              variant="outline"
              className="w-full h-14 font-semibold rounded-xl border border-border/40 shadow-sm hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 mt-4"
            >
              Send another message
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
