"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Building2,
  MapPin,
  Shield,
  Package,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Globe,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface WholesaleProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
}

interface WholesaleApplicationData {
  id?: string;
  business_name: string | null;
  contact_person: string | null;
  business_type: string | null;
  country: string | null;
  expected_order_volume: string | null;
  trade_license_url: string | null;
  notes: string | null;
  status: string | null;
}

interface SavedAddress {
  id: string;
  label: string | null;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
}

interface WholesaleAccountClientProps {
  profile: WholesaleProfile;
  wholesaleApp: WholesaleApplicationData | null;
}

type TabSection = "overview" | "business" | "addresses" | "security" | "orders";

export default function WholesaleAccountClient({
  profile: initialProfile,
  wholesaleApp,
}: WholesaleAccountClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active section sync
  const [activeSection, setActiveSection] = useState<TabSection>("overview");

  useEffect(() => {
    const sectionParam = searchParams.get("section") || searchParams.get("tab");
    if (
      sectionParam === "overview" ||
      sectionParam === "business" ||
      sectionParam === "addresses" ||
      sectionParam === "security" ||
      sectionParam === "orders"
    ) {
      setActiveSection(sectionParam as TabSection);
    }
  }, [searchParams]);

  const handleSectionChange = (section: TabSection) => {
    setActiveSection(section);
    router.push(`/wholesale/account?section=${section}`, { scroll: false });
  };

  // Editable Profile Form State
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialProfile.id);

      if (error) throw error;
      setProfileSuccess("Contact details updated successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      console.error("Wholesale profile update error:", err);
      setProfileError("Failed to update profile details. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Address State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    label: "Main Warehouse",
    fullName: initialProfile.full_name || "",
    phone: initialProfile.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "Dubai",
    state: "Dubai",
    postalCode: "",
    country: "AE",
    isDefault: false,
  });

  const loadAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "addresses") {
      loadAddresses();
    }
  }, [activeSection]);

  const handleOpenAddressModal = (addressToEdit?: SavedAddress) => {
    setAddressError(null);
    if (addressToEdit) {
      setEditingAddressId(addressToEdit.id);
      setAddressForm({
        label: addressToEdit.label || "Business Address",
        fullName: addressToEdit.full_name || "",
        phone: addressToEdit.phone || "",
        addressLine1: addressToEdit.address_line1 || "",
        addressLine2: addressToEdit.address_line2 || "",
        city: addressToEdit.city || "Dubai",
        state: addressToEdit.state || addressToEdit.city || "Dubai",
        postalCode: addressToEdit.postal_code || "",
        country: addressToEdit.country || "AE",
        isDefault: addressToEdit.is_default || false,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        label: "Main Warehouse",
        fullName: fullName || initialProfile.full_name || "",
        phone: phone || initialProfile.phone || "",
        addressLine1: "",
        addressLine2: "",
        city: "Dubai",
        state: "Dubai",
        postalCode: "",
        country: "AE",
        isDefault: addresses.length === 0,
      });
    }
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    setAddressError(null);

    try {
      const payload = {
        id: editingAddressId,
        label: addressForm.label,
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2,
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        country: addressForm.country,
        isDefault: addressForm.isDefault,
      };

      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save address.");

      setShowAddressModal(false);
      await loadAddresses();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAddresses();
      }
    } catch (err) {
      console.error("Delete address failed:", err);
    }
  };

  // Password Update State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/wholesale");
  };

  const companyDisplayName = wholesaleApp?.business_name || "Verified Wholesale Account";

  return (
    <div className="bg-[#FAF8F5] min-h-screen pb-16">
      {/* Top Banner Header */}
      <div className="bg-[#14231B] text-white py-8 sm:py-10 border-b border-[#DCCFB9]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-[#183D2B] text-[#DCCFB9] px-2.5 py-1 rounded-xs border border-[#DCCFB9]/20">
                  B2B Portal
                </span>
                <span className="text-xs text-white/60">•</span>
                <span className="text-xs text-[#DCCFB9] font-medium">
                  {companyDisplayName}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-white">
                Wholesale Account
              </h1>
              <p className="text-xs sm:text-sm text-white/75 mt-1 max-w-2xl">
                Manage your verified business profile, contact details, delivery addresses, and account security.
              </p>
            </div>

            {/* Approved Customer Status Pill */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-white/10 backdrop-blur-xs border border-emerald-500/30 text-emerald-300 shrink-0 self-start md:self-auto">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Approved Wholesale Customer
                </p>
                <p className="text-[10px] text-white/70">
                  Verified B2B Procurement Status
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Account Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Tabs (Desktop) & Mobile Select/Tabs */}
          <div className="lg:col-span-1">
            {/* Mobile Horizontal Tabs */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-[#EFEAE0] mb-4">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "business", label: "Business Info", icon: Building2 },
                { id: "addresses", label: "Addresses", icon: MapPin },
                { id: "security", label: "Security", icon: Shield },
                { id: "orders", label: "Orders", icon: Package },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSectionChange(tab.id as TabSection)}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-sm whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                      isActive
                        ? "bg-[#183D2B] text-white shadow-xs"
                        : "bg-white text-[#5C6460] hover:text-[#14231B] border border-[#EFEAE0]"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Vertical Sidebar */}
            <div className="hidden lg:block bg-white rounded-sm border border-[#EFEAE0] shadow-xs p-2 sticky top-24">
              <div className="p-3 border-b border-[#EFEAE0] mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590]">
                  Navigation
                </p>
              </div>
              <nav className="space-y-1">
                {[
                  {
                    id: "overview",
                    label: "Account Overview",
                    desc: "Contact details & summary",
                    icon: User,
                  },
                  {
                    id: "business",
                    label: "Business Information",
                    desc: "Company application details",
                    icon: Building2,
                  },
                  {
                    id: "addresses",
                    label: "Saved Addresses",
                    desc: "Warehouse & delivery points",
                    icon: MapPin,
                  },
                  {
                    id: "security",
                    label: "Security & Password",
                    desc: "Auth credentials",
                    icon: Shield,
                  },
                  {
                    id: "orders",
                    label: "Orders History",
                    desc: "B2B order records",
                    icon: Package,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSectionChange(tab.id as TabSection)}
                      className={`w-full flex items-center justify-between p-3 rounded-sm text-left cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#183D2B] text-white shadow-xs"
                          : "text-[#14231B] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={16}
                          className={isActive ? "text-[#DCCFB9]" : "text-[#183D2B]"}
                        />
                        <div>
                          <p className="text-xs font-bold">{tab.label}</p>
                          <p
                            className={`text-[10px] ${
                              isActive ? "text-white/80" : "text-[#8E9590]"
                            }`}
                          >
                            {tab.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={isActive ? "text-white/80" : "text-[#8E9590]"}
                      />
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 pt-3 border-t border-[#EFEAE0]">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 p-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-sm transition-colors text-left cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* ── SECTION: OVERVIEW / CONTACT DETAILS ──────────────── */}
            {(activeSection === "overview" || activeSection === "business") && (
              <>
                {/* Editable Profile Information */}
                <div className="bg-white rounded-sm border border-[#EFEAE0] shadow-xs p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#EFEAE0] mb-5">
                    <div>
                      <h2 className="text-base font-bold text-[#14231B] flex items-center gap-2">
                        <User size={18} className="text-[#183D2B]" />
                        <span>Contact Information</span>
                      </h2>
                      <p className="text-xs text-[#5C6460]">
                        Update your primary contact person name and phone number.
                      </p>
                    </div>
                  </div>

                  {profileSuccess && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-600" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-[#14231B] mb-1">
                        Business Email <span className="text-xs font-normal text-[#8E9590]">(Read-only)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={initialProfile.email}
                          readOnly
                          disabled
                          className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#EFEAE0] rounded-sm text-[#5C6460] cursor-not-allowed font-mono"
                        />
                        <Mail size={14} className="absolute left-3 top-2.5 text-[#8E9590]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14231B] mb-1">
                        Full Name / Contact Person
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-white border border-[#EFEAE0] rounded-sm text-[#14231B] focus:outline-none focus:border-[#183D2B]"
                        placeholder="Full Name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14231B] mb-1">
                        Phone / WhatsApp Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EFEAE0] rounded-sm text-[#14231B] focus:outline-none focus:border-[#183D2B]"
                          placeholder="+971 50 123 4567"
                        />
                        <Phone size={14} className="absolute left-3 top-2.5 text-[#8E9590]" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-5 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {profileSaving ? "Saving..." : "Save Profile Details"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Read-Only Verified Business Information */}
                <div className="bg-white rounded-sm border border-[#EFEAE0] shadow-xs p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#EFEAE0] mb-5">
                    <div>
                      <h2 className="text-base font-bold text-[#14231B] flex items-center gap-2">
                        <Building2 size={18} className="text-[#183D2B]" />
                        <span>Registered Business Information</span>
                      </h2>
                      <p className="text-xs text-[#5C6460]">
                        Verified company information on file with Aurelle Wholesale Desk.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#183D2B] bg-[#183D2B]/10 px-2.5 py-1 rounded-xs font-semibold">
                      <Lock size={12} />
                      <span>Admin Verified</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-sm bg-[#FAF8F5] border border-[#EFEAE0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590] block mb-1">
                        Company / Business Name
                      </span>
                      <span className="font-bold text-[#14231B] text-sm flex items-center gap-2">
                        <Briefcase size={14} className="text-[#183D2B]" />
                        {wholesaleApp?.business_name || "Ekodrix"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF8F5] border border-[#EFEAE0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590] block mb-1">
                        Contact Person
                      </span>
                      <span className="font-semibold text-[#14231B]">
                        {wholesaleApp?.contact_person || initialProfile.full_name || "Unais K"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF8F5] border border-[#EFEAE0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590] block mb-1">
                        Business Type
                      </span>
                      <span className="font-semibold text-[#14231B] capitalize">
                        {wholesaleApp?.business_type || "Retailer / Distributor"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF8F5] border border-[#EFEAE0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590] block mb-1">
                        Country / Jurisdiction
                      </span>
                      <span className="font-semibold text-[#14231B] flex items-center gap-1.5">
                        <Globe size={13} className="text-[#183D2B]" />
                        {wholesaleApp?.country || "United Arab Emirates"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF8F5] border border-[#EFEAE0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590] block mb-1">
                        Expected Order Volume
                      </span>
                      <span className="font-semibold text-[#14231B] flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-[#183D2B]" />
                        {wholesaleApp?.expected_order_volume || "AED 5,000 – 25,000 / month"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF8F5] border border-[#EFEAE0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590] block mb-1">
                        Trade License / Reference
                      </span>
                      <span className="font-semibold text-[#14231B] flex items-center gap-1.5">
                        <FileText size={13} className="text-[#183D2B]" />
                        {wholesaleApp?.trade_license_url ? "Verified License Document" : "On File with Admin"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-sm bg-[#183D2B]/5 border border-[#183D2B]/20 text-xs text-[#183D2B] flex items-start gap-2.5">
                    <Lock size={15} className="shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Need to update business details?</strong> Approval-sensitive business fields (such as Trade License, Company Name, or Jurisdiction) are protected under B2B compliance rules. To update these details, please reach out directly to the{" "}
                      <Link href="/wholesale/contact" className="underline font-bold hover:text-[#102D20]">
                        Wholesale Trade Desk
                      </Link>.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── SECTION: ADDRESSES ───────────────────────────────── */}
            {activeSection === "addresses" && (
              <div className="bg-white rounded-sm border border-[#EFEAE0] shadow-xs p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#EFEAE0] mb-5 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#14231B] flex items-center gap-2">
                      <MapPin size={18} className="text-[#183D2B]" />
                      <span>Saved Wholesale & Warehouse Addresses</span>
                    </h2>
                    <p className="text-xs text-[#5C6460]">
                      Manage delivery points for your wholesale orders and goods receiving.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddressModal()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add Address</span>
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="py-8 text-center text-xs text-[#8E9590]">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[#EFEAE0] rounded-sm bg-[#FAF8F5]">
                    <MapPin size={32} className="mx-auto text-[#8E9590] mb-2" />
                    <h3 className="text-sm font-bold text-[#14231B] mb-1">No saved addresses yet</h3>
                    <p className="text-xs text-[#5C6460] mb-4">
                      Add a warehouse, main office, or retail location address for seamless B2B order delivery.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddressModal()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-sm"
                    >
                      <Plus size={14} />
                      <span>Add First Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-sm border relative flex flex-col justify-between ${
                          addr.is_default
                            ? "border-[#183D2B] bg-[#183D2B]/5"
                            : "border-[#EFEAE0] bg-white hover:border-[#183D2B]/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[#14231B]">
                              {addr.label || "Address"}
                            </span>
                            {addr.is_default && (
                              <span className="text-[9px] uppercase tracking-wider font-bold bg-[#183D2B] text-white px-2 py-0.5 rounded-xs">
                                Default Delivery Point
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#14231B]">{addr.full_name}</p>
                          <p className="text-xs text-[#5C6460] mt-1">{addr.address_line1}</p>
                          {addr.address_line2 && (
                            <p className="text-xs text-[#5C6460]">{addr.address_line2}</p>
                          )}
                          <p className="text-xs text-[#5C6460]">
                            {addr.city}, {addr.country}
                          </p>
                          {addr.phone && (
                            <p className="text-xs text-[#5C6460] mt-1">Tel: {addr.phone}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#EFEAE0]">
                          <button
                            type="button"
                            onClick={() => handleOpenAddressModal(addr)}
                            className="inline-flex items-center gap-1 text-xs text-[#183D2B] font-semibold hover:underline cursor-pointer"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <span className="text-xs text-[#8E9590]">•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION: SECURITY & PASSWORD ─────────────────────── */}
            {activeSection === "security" && (
              <div className="bg-white rounded-sm border border-[#EFEAE0] shadow-xs p-6">
                <div className="pb-4 border-b border-[#EFEAE0] mb-5">
                  <h2 className="text-base font-bold text-[#14231B] flex items-center gap-2">
                    <Shield size={18} className="text-[#183D2B]" />
                    <span>Security & Password</span>
                  </h2>
                  <p className="text-xs text-[#5C6460]">
                    Manage authentication password for your wholesale account.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-[#14231B] mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pr-10 pl-3 py-2 text-xs bg-white border border-[#EFEAE0] rounded-sm text-[#14231B] focus:outline-none focus:border-[#183D2B]"
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[#8E9590] hover:text-[#14231B]"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14231B] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EFEAE0] rounded-sm text-[#14231B] focus:outline-none focus:border-[#183D2B]"
                      placeholder="Repeat new password"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-5 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {passwordSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── SECTION: ORDERS ─────────────────────────────────── */}
            {activeSection === "orders" && (
              <div className="bg-white rounded-sm border border-[#EFEAE0] shadow-xs p-8 text-center">
                <div className="w-16 h-16 bg-[#183D2B]/10 text-[#183D2B] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={30} />
                </div>
                <h2 className="text-lg font-bold text-[#14231B] mb-1">No wholesale orders yet</h2>
                <p className="text-xs text-[#5C6460] max-w-md mx-auto mb-6 leading-relaxed">
                  Your B2B order history and invoice records will appear here once wholesale ordering is enabled for your account.
                </p>
                <Link
                  href="/wholesale/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors shadow-xs"
                >
                  <span>Browse Wholesale Catalog</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#EFEAE0] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE0] mb-4">
              <h3 className="text-sm font-bold text-[#14231B]">
                {editingAddressId ? "Edit Delivery Address" : "Add Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-[#8E9590] hover:text-[#14231B] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {addressError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
                {addressError}
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                  Address Label (e.g. Main Warehouse, Retail Store)
                </label>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#EFEAE0] rounded-sm"
                  placeholder="Main Warehouse"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                    Contact / Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#EFEAE0] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#EFEAE0] rounded-sm"
                    placeholder="+971 50 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                  Street Address Line 1 *
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#EFEAE0] rounded-sm"
                  placeholder="Building, Street, Area"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#EFEAE0] rounded-sm"
                  placeholder="Unit, Floor, Warehouse No."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                    City / Emirate *
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#EFEAE0] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#14231B] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={addressForm.country}
                    readOnly
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EFEAE0] rounded-sm font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded-xs border-[#EFEAE0] text-[#183D2B]"
                />
                <label htmlFor="isDefaultCheck" className="text-xs text-[#14231B]">
                  Set as default delivery address for wholesale orders
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#EFEAE0] mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5C6460] hover:text-[#14231B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="px-4 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm"
                >
                  {addressSaving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
