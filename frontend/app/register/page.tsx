"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/language-context";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, MapPin, Lock, Building2, ChevronRight, Mic2 } from "lucide-react";

type Role = "CLIENT" | "ARTIST";

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const { t } = useLanguage();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("BE");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [hasSociete, setHasSociete] = useState(false);
  const [societeName, setSocieteName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t.auth.first_last_required);
      return;
    }
    if (password.length < 8) {
      toast.error(t.auth.password_too_short);
      return;
    }
    try {
      await register(email, password, role, {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        country,
        hasSociete,
        societeName: hasSociete ? societeName || undefined : undefined,
        vatNumber: hasSociete ? vatNumber || undefined : undefined,
        billingAddress: hasSociete ? billingAddress || undefined : undefined
      });
      toast.success(t.auth.account_created);
      router.push(role === "ARTIST" ? "/dashboard/artist" : "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.register_failed);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-light mb-3">
          Sauroraa Records
        </p>
        <h1 className="text-3xl font-bold text-cream">{t.auth.register_title}</h1>
        <p className="mt-2 text-sm text-cream/50">
          {t.auth.register_sub}
        </p>
      </motion.div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {/* Identity */}
        <FormSection icon={User} title={t.auth.identity} delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`${t.auth.first_name} *`}>
              <Input
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Field>
            <Field label={`${t.auth.last_name} *`}>
              <Input
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label={t.auth.birth_date}>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Field>
        </FormSection>

        {/* Contact */}
        <FormSection icon={MapPin} title={t.auth.contact} delay={0.1}>
          <Field label={`${t.auth.email} *`}>
            <Input
              type="email"
              placeholder="tu@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label={t.auth.address}>
            <Input
              placeholder="Rue de l'exemple 1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </Field>
          <Field label={t.auth.address_extra}>
            <Input
              placeholder="Apt, étage, bât…"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.auth.postal_code}>
              <Input
                placeholder="1000"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </Field>
            <Field label={t.auth.city}>
              <Input
                placeholder="Bruxelles"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Field>
          </div>
          <Field label={t.auth.country}>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-surface border border-[rgba(255,255,255,0.08)] text-cream/70 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-violet/40 transition-colors"
            >
              <option value="BE">Belgique</option>
              <option value="FR">France</option>
              <option value="NL">Pays-Bas</option>
              <option value="LU">Luxembourg</option>
              <option value="CH">Suisse</option>
              <option value="DE">Allemagne</option>
              <option value="OTHER">Autre</option>
            </select>
          </Field>
        </FormSection>

        {/* Account type */}
        <FormSection icon={Mic2} title={t.auth.account_type} delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["CLIENT", "ARTIST"] as const).map((k) => {
              const info = {
                CLIENT: { name: "Fan / Auditeur", desc: "Accède aux releases et dubpacks" },
                ARTIST: { name: t.auth.artist, desc: t.auth.artist_desc }
              }[k];
              if (k === "CLIENT") {
                info.name = t.auth.fan_listener;
                info.desc = t.auth.fan_listener_desc;
              }
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRole(k)}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    role === k
                      ? "border-violet/50 bg-violet/10"
                      : "border-[rgba(255,255,255,0.08)] bg-surface hover:border-violet/25"
                  }`}
                >
                  <p className={`text-sm font-semibold ${role === k ? "text-cream" : "text-cream/70"}`}>
                    {info.name}
                  </p>
                  <p className="text-xs text-cream/40 mt-0.5">{info.desc}</p>
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Password */}
        <FormSection icon={Lock} title={t.auth.security} delay={0.2}>
          <Field label={`${t.auth.password} *`}>
            <Input
              type="password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>
        </FormSection>

        {/* Société */}
        <FormSection icon={Building2} title={t.auth.company} delay={0.25}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasSociete(!hasSociete)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                hasSociete ? "bg-violet" : "bg-surface2 border border-[rgba(255,255,255,0.1)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  hasSociete ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-cream/70">{t.auth.company_toggle}</span>
          </div>

          <AnimatePresence>
            {hasSociete && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-2">
                  <Field label={t.auth.society_name}>
                    <Input
                      placeholder="Sauroraa SNC"
                      value={societeName}
                      onChange={(e) => setSocieteName(e.target.value)}
                    />
                  </Field>
                  <Field label={t.auth.vat_number}>
                    <Input
                      placeholder="BE0123456789"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                    />
                  </Field>
                  <Field label={t.auth.billing_address}>
                    <Input
                      placeholder="Rue du commerce 1, 1000 Bruxelles"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                    />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </FormSection>

        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              {t.auth.create_account}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-cream/50">
          {t.auth.account_exists}{" "}
          <Link href="/login" className="text-violet-light hover:underline">
            {t.auth.connect}
          </Link>
        </p>

        <p className="text-center text-xs text-cream/30">
          {t.auth.terms_prefix}{" "}
          <Link href="/legal/cgu" className="text-cream/50 hover:underline">{t.auth.terms}</Link>
          {" "}{t.auth.and}{" "}
          <Link href="/legal/rgpd" className="text-cream/50 hover:underline">
            {t.auth.privacy}
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  delay,
  children
}: {
  icon: React.ElementType;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface p-6 space-y-4"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-[rgba(255,255,255,0.05)]">
        <Icon className="h-4 w-4 text-violet-light" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-cream/50">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-cream/70">{label}</label>
      {children}
    </div>
  );
}
