"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Building2, Mic2, Lock, Save, CheckCircle2,
  Instagram, Globe, Music, Hash, CreditCard, Camera, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  hasSociete?: boolean;
  societeName?: string | null;
  vatNumber?: string | null;
  billingAddress?: string | null;
  artist?: {
    id: string;
    displayName?: string | null;
    bio?: string | null;
    instagramUrl?: string | null;
    soundcloudUrl?: string | null;
    discordUrl?: string | null;
    websiteUrl?: string | null;
    payoutIban?: string | null;
  } | null;
  agency?: {
    id: string;
    displayName?: string | null;
    logoPath?: string | null;
  } | null;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form state — personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("BE");
  const [hasSociete, setHasSociete] = useState(false);
  const [societeName, setSocieteName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  // Artist-specific
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [payoutIban, setPayoutIban] = useState("");

  // Agency-specific
  const [agencyDisplayName, setAgencyDisplayName] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch(`${API}/users/me`, { credentials: "include" })
      .then((r) => r.json() as Promise<UserProfile>)
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "");
        setAddressLine1(data.addressLine1 ?? "");
        setAddressLine2(data.addressLine2 ?? "");
        setPostalCode(data.postalCode ?? "");
        setCity(data.city ?? "");
        setCountry(data.country ?? "BE");
        setHasSociete(data.hasSociete ?? false);
        setSocieteName(data.societeName ?? "");
        setVatNumber(data.vatNumber ?? "");
        setBillingAddress(data.billingAddress ?? "");
        if (data.artist) {
          setDisplayName(data.artist.displayName ?? "");
          setBio(data.artist.bio ?? "");
          setInstagramUrl(data.artist.instagramUrl ?? "");
          setSoundcloudUrl(data.artist.soundcloudUrl ?? "");
          setDiscordUrl(data.artist.discordUrl ?? "");
          setWebsiteUrl(data.artist.websiteUrl ?? "");
          setPayoutIban(data.artist.payoutIban ?? "");
        }
        if (data.agency) {
          setAgencyDisplayName(data.agency.displayName ?? "");
        }
      })
      .catch(() => toast.error("Impossible de charger le profil"));
  }, [user, router]);

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/upload/cover`, { method: "POST", credentials: "include", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return ((await res.json()) as { path: string }).path;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = profile?.avatarUrl ?? undefined;
      let logoPath = profile?.agency?.logoPath ?? undefined;

      if (avatarFile) {
        setUploadingAvatar(true);
        avatarUrl = await uploadFile(avatarFile);
        setAvatarFile(null);
        setUploadingAvatar(false);
      }
      if (logoFile) {
        logoPath = await uploadFile(logoFile);
        setLogoFile(null);
      }

      const body: Record<string, unknown> = {
        firstName, lastName,
        avatarUrl: avatarUrl || undefined,
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
      };
      if (profile?.artist) {
        body.artist = {
          displayName: displayName || undefined,
          bio: bio || undefined,
          instagramUrl: instagramUrl || undefined,
          soundcloudUrl: soundcloudUrl || undefined,
          discordUrl: discordUrl || undefined,
          websiteUrl: websiteUrl || undefined,
          payoutIban: payoutIban || undefined
        };
      }
      if (profile?.agency) {
        // logoPath saved directly via PATCH /agency/me
        if (logoPath !== profile.agency.logoPath) {
          await fetch(`${API}/agency/me`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ displayName: agencyDisplayName || undefined, logoPath })
          });
        } else {
          body.agency = { displayName: agencyDisplayName || undefined };
        }
      }
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("8 caractères minimum"); return; }
    if (newPassword !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API}/users/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword })
      });
      if (!res.ok) throw new Error();
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe modifié ! Un email de confirmation a été envoyé.");
    } catch {
      toast.error("Erreur lors du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-4 py-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  const role = profile.role;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && setAvatarFile(e.target.files[0])} />
      <input ref={logoRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])} />

      {/* Header with avatar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div
            onClick={() => avatarRef.current?.click()}
            className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[rgba(255,255,255,0.12)] bg-surface2 hover:border-violet/40 transition-colors group"
          >
            {avatarFile || profile.avatarUrl ? (
              <img
                src={avatarFile ? URL.createObjectURL(avatarFile) : `${API.replace("/api", "")}${profile.avatarUrl}`}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-cream/20" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cream">Mon profil</h1>
            <p className="text-xs text-cream/40 mt-0.5">{profile.email} · <span className="text-violet-light uppercase text-[10px] font-bold tracking-widest">{role}</span></p>
            <button type="button" onClick={() => avatarRef.current?.click()} className="mt-1 text-xs text-violet-light hover:underline">
              {avatarFile ? `${avatarFile.name}` : "Changer la photo"}
            </button>
          </div>
        </div>
      </motion.div>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        {/* Identity */}
        <Section icon={User} title="Identité" delay={0.05}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom">
              <Input placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Nom">
              <Input placeholder="Dupont" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field label="Date de naissance">
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </Field>
        </Section>

        {/* Address */}
        <Section icon={MapPin} title="Adresse" delay={0.1}>
          <Field label="Adresse">
            <Input placeholder="Rue de l'exemple 1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </Field>
          <Field label="Complément">
            <Input placeholder="Apt, étage…" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code postal">
              <Input placeholder="1000" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </Field>
            <Field label="Ville">
              <Input placeholder="Bruxelles" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </div>
          <Field label="Pays">
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
        </Section>

        {/* Société */}
        <Section icon={Building2} title="Société / Entreprise" delay={0.15}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasSociete(!hasSociete)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${hasSociete ? "bg-violet" : "bg-surface2 border border-[rgba(255,255,255,0.1)]"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${hasSociete ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-cream/70">J&apos;ai une société / entreprise</span>
          </div>
          <AnimatePresence>
            {hasSociete && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-2">
                  <Field label="Nom de la société">
                    <Input placeholder="Sauroraa SNC" value={societeName} onChange={(e) => setSocieteName(e.target.value)} />
                  </Field>
                  <Field label="Numéro TVA">
                    <Input placeholder="BE0123456789" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                  </Field>
                  <Field label="Siège / Adresse de facturation">
                    <Input placeholder="Rue du commerce 1, 1000 Bruxelles" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* Artist-specific */}
        {(role === "ARTIST") && (
          <Section icon={Mic2} title="Profil Artiste" delay={0.2}>
            <Field label="Nom d'artiste">
              <Input placeholder="Mon Alias" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Bio">
              <textarea
                placeholder="Décris ton style, tes influences…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full resize-none bg-surface2 border border-[rgba(255,255,255,0.08)] text-cream/80 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-violet/40 transition-colors placeholder:text-cream/25"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Instagram">
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/30" />
                  <Input className="pl-8" placeholder="@monpseudo" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                </div>
              </Field>
              <Field label="SoundCloud">
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/30" />
                  <Input className="pl-8" placeholder="soundcloud.com/…" value={soundcloudUrl} onChange={(e) => setSoundcloudUrl(e.target.value)} />
                </div>
              </Field>
              <Field label="Discord">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/30" />
                  <Input className="pl-8" placeholder="discord.gg/…" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} />
                </div>
              </Field>
              <Field label="Site web">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/30" />
                  <Input className="pl-8" placeholder="monsite.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                </div>
              </Field>
            </div>
            <Field label="IBAN de paiement">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/30" />
                <Input className="pl-8" placeholder="BE68 5390 0754 7034" value={payoutIban} onChange={(e) => setPayoutIban(e.target.value)} />
              </div>
            </Field>
          </Section>
        )}

        {/* Agency-specific */}
        {(role === "AGENCY") && (
          <Section icon={Building2} title="Profil Agence" delay={0.2}>
            <Field label="Nom de l'agence / label">
              <Input placeholder="Mon Label Music" value={agencyDisplayName} onChange={(e) => setAgencyDisplayName(e.target.value)} />
            </Field>
            <Field label="Logo de l'agence">
              <div
                onClick={() => logoRef.current?.click()}
                className="flex cursor-pointer items-center gap-4 rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-surface2 p-3 hover:border-violet/30 transition-colors"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface flex items-center justify-center">
                  {logoFile || profile?.agency?.logoPath ? (
                    <img
                      src={logoFile ? URL.createObjectURL(logoFile) : `${API.replace("/api", "")}${profile?.agency?.logoPath}`}
                      alt="logo"
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-cream/20" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-cream/70">{logoFile ? logoFile.name : "Choisir un logo"}</p>
                  <p className="text-xs text-cream/30 mt-0.5">JPG, PNG, WebP · max 5MB</p>
                </div>
                <Camera className="ml-auto h-4 w-4 text-cream/30" />
              </div>
            </Field>
          </Section>
        )}

        {/* Save button */}
        <Button type="submit" className="w-full gap-2" disabled={saving}>
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" /> Profil sauvegardé</>
          ) : (
            <><Save className="h-4 w-4" /> Sauvegarder le profil</>
          )}
        </Button>
      </form>

      {/* Password change */}
      <form onSubmit={(e) => void handlePasswordChange(e)}>
        <Section icon={Lock} title="Changer le mot de passe" delay={0.3}>
          <Field label="Nouveau mot de passe">
            <Input
              type="password"
              placeholder="8 caractères minimum"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmer le mot de passe">
            <Input
              type="password"
              placeholder="Répète le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Button type="submit" variant="outline" className="w-full gap-2" disabled={savingPassword || !newPassword}>
            {savingPassword ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <><Lock className="h-4 w-4" /> Modifier le mot de passe</>
            )}
          </Button>
        </Section>
      </form>
    </div>
  );
}

function Section({
  icon: Icon, title, delay, children
}: {
  icon: React.ElementType; title: string; delay: number; children: React.ReactNode;
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
