"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Plus,
  Check,
  Edit2,
  Trash2,
  Star,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  Clock,
  Phone,
  Mail,
  Home,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AccountAuthModal from "@/components/auth/AccountAuthModal";

export interface Address {
  id: string;
  user_id: string;
  label?: string | null;
  full_name: string;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_snapshot?: {
    name?: string;
    image?: string;
    slug?: string;
  };
  sku_snapshot?: string;
  price_snapshot: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_amount: number;
  total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address: any;
  created_at: string;
  order_items?: OrderItem[];
}

const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses">(
    initialTab === "orders" || initialTab === "addresses" ? initialTab : "profile"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "Dubai",
    country: "AE",
    isDefault: false,
  });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Keep tab synced with query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "orders" || tabParam === "addresses" || tabParam === "profile") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load initial User & Profile
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Fetch profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || currentUser.user_metadata?.full_name || "");
        setPhone(profileData.phone || currentUser.user_metadata?.phone || "");
      } else {
        setFullName(currentUser.user_metadata?.full_name || "");
        setPhone(currentUser.user_metadata?.phone || "");
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  // Fetch Orders
  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Addresses
  const fetchAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (res.ok && data.addresses) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === "orders") fetchOrders();
      if (activeTab === "addresses") fetchAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  // Handle Profile Update
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileMessage(null);

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
        .eq("id", user.id);

      if (error) throw error;
      setProfileMessage("Profile details updated successfully.");
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      console.error("Profile update failed:", err);
      setProfileMessage("Failed to update profile details.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Handle Address Submit (Create or Update)
  async function handleAddressSubmit(e: React.FormEvent) {
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
        state: addressForm.city,
        country: addressForm.country,
        isDefault: addressForm.isDefault,
      };

      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save address.");
      }

      setAddressModalOpen(false);
      setEditingAddressId(null);
      resetAddressForm();
      fetchAddresses();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Error saving address.");
    } finally {
      setAddressSaving(false);
    }
  }

  // Set Address As Default
  async function handleSetDefault(id: string) {
    try {
      const res = await fetch("/api/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  }

  // Delete Address
  async function handleDeleteAddress(id: string) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  }

  // Edit Address setup
  function openEditAddress(addr: Address) {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || "Home",
      fullName: addr.full_name || "",
      phone: addr.phone || "",
      addressLine1: addr.address_line1 || "",
      addressLine2: addr.address_line2 || "",
      city: addr.city || "Dubai",
      country: addr.country || "AE",
      isDefault: addr.is_default,
    });
    setAddressModalOpen(true);
  }

  function resetAddressForm() {
    setAddressForm({
      label: "Home",
      fullName: profile?.full_name || user?.user_metadata?.full_name || "",
      phone: profile?.phone || user?.user_metadata?.phone || "",
      addressLine1: "",
      addressLine2: "",
      city: "Dubai",
      country: "AE",
      isDefault: addresses.length === 0,
    });
    setAddressError(null);
  }

  // Handle Logout
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  // If loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5C6460]">Loading your Aurelle account...</p>
        </div>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#EDE9DF] p-8 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mx-auto">
            <User size={30} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1D211F]">Sign In to Your Account</h1>
            <p className="mt-1.5 text-xs text-[#5C6460] leading-relaxed">
              Access your personal profile, track recent orders, and manage saved delivery addresses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-3 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer"
          >
            Sign In or Create Account
          </button>
          <AccountAuthModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialMode="login"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* ── Top Header Banner ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#EDE9DF] p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#183D2B] text-white flex items-center justify-center text-xl font-serif font-bold shrink-0">
              {fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-[#1D211F]">
                  {fullName || "Aurelle Member"}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2B]/10 text-[#183D2B] uppercase tracking-wider">
                  {profile?.role === "wholesale" ? "Wholesale Partner" : "Member"}
                </span>
              </div>
              <p className="text-xs text-[#5C6460] mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#EDE9DF] text-xs font-semibold text-[#5C6460] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* ── Tab Navigation ───────────────────────────────── */}
        <div className="flex border-b border-[#EDE9DF] mb-8 gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("profile");
              router.replace("/account?tab=profile");
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-[#183D2B] text-[#183D2B]"
                : "border-transparent text-[#5C6460] hover:text-[#183D2B]"
            }`}
          >
            <User size={16} />
            Profile Details
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              router.replace("/account?tab=orders");
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "orders"
                ? "border-[#183D2B] text-[#183D2B]"
                : "border-transparent text-[#5C6460] hover:text-[#183D2B]"
            }`}
          >
            <Package size={16} />
            Recent Orders
            {orders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#183D2B]/10 text-[#183D2B]">
                {orders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("addresses");
              router.replace("/account?tab=addresses");
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "addresses"
                ? "border-[#183D2B] text-[#183D2B]"
                : "border-transparent text-[#5C6460] hover:text-[#183D2B]"
            }`}
          >
            <MapPin size={16} />
            Saved Addresses
            {addresses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#183D2B]/10 text-[#183D2B]">
                {addresses.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: PROFILE DETAILS ───────────────────────── */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-[#EDE9DF] p-6 sm:p-8 shadow-xs">
            <div className="max-w-xl">
              <h2 className="font-serif text-xl font-bold text-[#1D211F]">Personal Information</h2>
              <p className="mt-1 text-xs text-[#5C6460]">
                Update your personal details for faster checkout and customized recommendations.
              </p>

              {profileMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-[#183D2B]/10 border border-[#183D2B]/20 p-3 text-xs text-[#183D2B]">
                  <Check size={16} />
                  <span>{profileMessage}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user.email || ""}
                      className="h-10 w-full rounded-md border border-[#EDE9DF] bg-gray-100 px-3.5 text-xs text-[#5C6460] outline-none cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-[#183D2B] font-medium">
                      <ShieldCheck size={14} />
                      Verified
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-[#8C938F]">
                    Email address is linked to your login and cannot be altered directly.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1.5">
                    Phone / Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="py-2.5 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {profileSaving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 2: RECENT ORDERS ─────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="bg-white rounded-2xl border border-[#EDE9DF] p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#5C6460]">Loading your order history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EDE9DF] p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mx-auto">
                  <ShoppingBag size={26} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1D211F]">No Orders Yet</h3>
                  <p className="mt-1 text-xs text-[#5C6460]">
                    You haven’t placed any orders with Aurelle yet.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-block py-2.5 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-[#EDE9DF] p-6 shadow-xs space-y-4 hover:border-[#183D2B]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EDE9DF]/70 gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#183D2B] font-mono tracking-wider">
                          {ord.order_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8C938F]">
                        Placed on {new Date(ord.created_at).toLocaleDateString("en-AE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-sm font-bold text-[#1D211F]">
                        AED {Number(ord.total).toFixed(2)}
                      </span>
                      <p className="text-[10px] text-[#5C6460] uppercase">
                        {ord.payment_status === "paid" ? "Paid Online" : "Cash on Delivery"}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  {ord.order_items && ord.order_items.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {ord.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#1D211F] font-medium">
                              {item.product_snapshot?.name || "Product"}
                            </span>
                            <span className="text-[#8C938F]">× {item.quantity}</span>
                          </div>
                          <span className="text-[#1D211F] font-semibold">
                            AED {Number(item.line_total).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Delivery summary */}
                  {ord.shipping_address && (
                    <div className="pt-2 text-[11px] text-[#5C6460] flex items-center gap-1.5 border-t border-[#EDE9DF]/40">
                      <MapPin size={12} className="text-[#183D2B] shrink-0" />
                      <span>
                        Delivering to: {ord.shipping_address.streetAddress || ord.shipping_address.addressLine1},{" "}
                        {ord.shipping_address.emirate || ord.shipping_address.city}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB 3: SAVED ADDRESSES ───────────────────────── */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1D211F]">Your Delivery Addresses</h2>
                <p className="mt-0.5 text-xs text-[#5C6460]">
                  Manage your delivery destinations for fast and seamless checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  resetAddressForm();
                  setAddressModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Add Address
              </button>
            </div>

            {loadingAddresses ? (
              <div className="bg-white rounded-2xl border border-[#EDE9DF] p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#5C6460]">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EDE9DF] p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mx-auto">
                  <MapPin size={26} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1D211F]">No Saved Addresses</h3>
                  <p className="mt-1 text-xs text-[#5C6460]">
                    Save your primary home or office address to enjoy 1-click checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddressId(null);
                    resetAddressForm();
                    setAddressModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Add New Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                      addr.is_default
                        ? "border-[#183D2B] ring-1 ring-[#183D2B]/20"
                        : "border-[#EDE9DF] hover:border-[#183D2B]/40"
                    }`}
                  >
                    <div>
                      {/* Address Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F7F5EF] text-[#183D2B]">
                            {addr.label?.toLowerCase() === "office" ? (
                              <Briefcase size={11} />
                            ) : (
                              <Home size={11} />
                            )}
                            {addr.label || "Home"}
                          </span>

                          {addr.is_default && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2B] text-white tracking-wider">
                              <Star size={10} className="fill-white" />
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditAddress(addr)}
                            className="p-1.5 text-[#5C6460] hover:text-[#183D2B] rounded-md hover:bg-[#F7F5EF] transition-colors"
                            title="Edit Address"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-[#5C6460] hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Address Details */}
                      <h4 className="text-sm font-bold text-[#1D211F]">{addr.full_name}</h4>
                      <p className="text-xs text-[#5C6460] mt-1 leading-relaxed">
                        {addr.address_line1}
                        {addr.address_line2 && <span>, {addr.address_line2}</span>}
                        <br />
                        {addr.city}, United Arab Emirates
                      </p>
                      {addr.phone && (
                        <p className="text-xs text-[#5C6460] mt-2 flex items-center gap-1.5">
                          <Phone size={12} className="text-[#8C938F]" />
                          {addr.phone}
                        </p>
                      )}
                    </div>

                    {/* Set default footer */}
                    {!addr.is_default && (
                      <div className="pt-4 mt-3 border-t border-[#EDE9DF]/60">
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs text-[#183D2B] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Set as Default Address
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT ADDRESS MODAL ───────────────────────── */}
      {addressModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1D211F]/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE9DF]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE9DF]">
              <h3 className="font-serif text-lg font-bold text-[#1D211F]">
                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="text-[#5C6460] hover:text-[#183D2B] p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            {addressError && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                {addressError}
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="mt-4 space-y-3.5">
              {/* Address Label Selector */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {["Home", "Office", "Villa", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                        addressForm.label === lbl
                          ? "border-[#183D2B] bg-[#183D2B] text-white"
                          : "border-[#EDE9DF] bg-[#F7F5EF] text-[#5C6460] hover:border-[#183D2B]/50"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="Full name"
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                  Street Address & Building / Villa Number *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="e.g. Burj Crown Tower, Apt 1402"
                  className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                />
              </div>

              {/* Area / Landmark */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                  Area / Neighborhood / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="e.g. Downtown Dubai or near Dubai Mall"
                  className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                    Emirate / City *
                  </label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                  >
                    {UAE_EMIRATES.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled
                    value="United Arab Emirates"
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-gray-100 px-3.5 text-xs text-[#5C6460] outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Default checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-[#1D211F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded border-[#EDE9DF] text-[#183D2B] focus:ring-[#183D2B]"
                  />
                  <span>Set as default delivery address</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDE9DF]">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="py-2.5 px-4 rounded-md border border-[#EDE9DF] text-xs font-semibold text-[#5C6460] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="py-2.5 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {addressSaving ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
