"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
  ShoppingBag,
  Phone,
  Home,
  Briefcase,
  X,
  AlertCircle,
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
  product_id?: string | null;
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

export interface Review {
  id: string;
  product_id: string;
  order_id: string;
  rating: number;
  body: string;
  created_at?: string;
}

interface Profile {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  updated_at?: string;
}

// Minimal shape of the Supabase auth user we actually read from.
interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    [key: string]: unknown;
  };
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

type TabId = "profile" | "orders" | "addresses" | "reviews";

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab === "orders" || initialTab === "addresses" || initialTab === "reviews"
      ? initialTab
      : "profile"
  );

  const mobileTabContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/account?tab=${tabId}`);
      }
      if (mobileTabContainerRef.current) {
        mobileTabContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      }
    },
    []
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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

  // Reviews state
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    productId: string;
    productName: string;
    productImage?: string | null;
    orderId: string;
    orderNumber: string;
    existingRating?: number;
    existingBody?: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewBody, setReviewBody] = useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const tabsList: { id: TabId; label: string; icon: typeof User; count?: number }[] = [
    { id: "profile", label: "Profile Details", icon: User },
    { id: "orders", label: "Recent Orders", icon: Package, count: orders.length },
    { id: "addresses", label: "Saved Addresses", icon: MapPin, count: addresses.length },
    { id: "reviews", label: "Reviews & Ratings", icon: Star, count: userReviews.length },
  ];

  const mobileOrderedTabs = [
    ...tabsList.filter((t) => t.id === activeTab),
    ...tabsList.filter((t) => t.id !== activeTab),
  ];

  // Keep tab synced with query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "orders" ||
      tabParam === "addresses" ||
      tabParam === "profile" ||
      tabParam === "reviews"
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load initial User & Profile
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (cancelled) return;

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
    return () => {
      cancelled = true;
    };
  }, []);

  // Track whether initial fetches have occurred to prevent reloading flash
  const fetchedOrdersRef = useRef(false);
  const fetchedAddressesRef = useRef(false);
  const fetchedReviewsRef = useRef(false);

  // Fetch Orders
  const fetchOrders = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading && !fetchedOrdersRef.current) setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
        fetchedOrdersRef.current = true;
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  // Fetch Addresses
  const fetchAddresses = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading && !fetchedAddressesRef.current) setLoadingAddresses(true);
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (res.ok && data.addresses) {
        setAddresses(data.addresses);
        fetchedAddressesRef.current = true;
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  // Fetch User's Reviews
  const fetchUserReviews = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading && !fetchedReviewsRef.current) setLoadingUserReviews(true);
    try {
      const res = await fetch("/api/reviews?userOnly=true");
      const data = await res.json();
      if (res.ok && data.reviews) {
        setUserReviews(data.reviews);
        fetchedReviewsRef.current = true;
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingUserReviews(false);
    }
  }, [user]);

  // Fetch tab data once user is authenticated
  useEffect(() => {
    if (!user) return;
    fetchOrders(activeTab === "orders" || activeTab === "reviews");
    fetchAddresses(activeTab === "addresses");
    fetchUserReviews(activeTab === "reviews");
  }, [user, fetchOrders, fetchAddresses, fetchUserReviews, activeTab]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam === "orders" ||
        tabParam === "addresses" ||
        tabParam === "profile" ||
        tabParam === "reviews"
      ) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openReviewModal = useCallback(
    (
      productId: string,
      productName: string,
      productImage: string | null | undefined,
      orderId: string,
      orderNumber: string
    ) => {
      const existing = userReviews.find(
        (r) => r.product_id === productId && r.order_id === orderId
      );
      if (existing) {
        return; // Already reviewed for this purchase
      }
      setReviewTarget({
        productId,
        productName,
        productImage,
        orderId,
        orderNumber,
        existingRating: undefined,
        existingBody: undefined,
      });
      setReviewRating(5);
      setReviewHoverRating(0);
      setReviewBody("");
      setReviewError(null);
      setReviewSuccess(null);
      setReviewModalOpen(true);
    },
    [userReviews]
  );

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewTarget) return;
    if (!user) {
      setReviewError("Please sign in with your registered account to submit a review.");
      return;
    }
    if (!reviewBody.trim()) {
      setReviewError("Please enter your review message.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: reviewTarget.productId,
          order_id: reviewTarget.orderId,
          rating: reviewRating,
          body: reviewBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review.");
      } else {
        setReviewSuccess("Thank you! Your review has been submitted and published.");
        fetchUserReviews();
        setTimeout(() => {
          setReviewModalOpen(false);
          setReviewSuccess(null);
        }, 1200);
      }
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  // Auto-open review modal if coming from email review link with orderId
  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam && orders.length > 0 && activeTab === "reviews") {
      const targetOrder = orders.find((o) => o.id === orderIdParam);
      if (
        targetOrder &&
        (targetOrder.status || "").toLowerCase() === "delivered" &&
        targetOrder.order_items &&
        targetOrder.order_items.length > 0
      ) {
        const unreviewedItem =
          targetOrder.order_items.find(
            (it) =>
              it.product_id &&
              !userReviews.some(
                (r) => r.product_id === it.product_id && r.order_id === targetOrder.id
              )
          ) || targetOrder.order_items[0];

        if (unreviewedItem && unreviewedItem.product_id) {
          const snap = unreviewedItem.product_snapshot || {};
          openReviewModal(
            unreviewedItem.product_id,
            snap.name || "Aurelle Product",
            snap.image,
            targetOrder.id,
            targetOrder.order_number
          );
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, searchParams, activeTab]);

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

  const resetAddressForm = useCallback(() => {
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
  }, [profile, user, addresses.length]);

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
    <div className="min-h-screen bg-[#FAF8F5] py-5 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto ">
        {/* ── Top Header Banner ─────────────────────────────── */}
        <div className="bg-white rounded-sm border border-[#EDE9DF] p-3 sm:p-8 shadow-xs mb-4 sm:mb-8 flex sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex w-14 h-14 rounded-full bg-[#183D2B] text-white items-center justify-center text-xl font-serif font-bold shrink-0">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#183D2B] text-white text-xs font-semibold hover:bg-[#102D20] transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
          >
     
            Sign Out
          </button>
        </div>

        {/* ── Mobile Tab Navigation (UNCHANGED) ── */}
        <div
          ref={mobileTabContainerRef}
          className="flex sm:hidden gap-2 overflow-x-auto pb-3 mb-2 sm:mb-6 scrollbar-none no-scrollbar -mx-4 px-4 scroll-smooth"
        >
          {mobileOrderedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-sm text-xs font-semibold tracking-wide shrink-0 transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? "bg-[#183D2B] text-white ring-1 ring-[#183D2B]"
                    : "bg-white border border-[#EDE9DF] text-[#5C6460] hover:text-[#183D2B] hover:border-[#183D2B]/30"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-[#8C938F]"} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#183D2B]/10 text-[#183D2B]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Desktop Tab Navigation (UNCHANGED markup/behavior) ──── */}
        <div className="hidden sm:flex sm:mb-4 gap-2 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile" ? " text-[#183D2B]" : " text-[#5C6460] hover:text-[#183D2B]"
            }`}
          >
            <User size={16} />
            Profile Details
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("orders")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
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
            onClick={() => handleTabChange("addresses")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
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

          <button
            type="button"
            onClick={() => handleTabChange("reviews")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "reviews"
                ? "border-[#183D2B] text-[#183D2B]"
                : "border-transparent text-[#5C6460] hover:text-[#183D2B]"
            }`}
          >
            <Star size={16} />
            Reviews & Ratings
            {userReviews.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#183D2B]/10 text-[#183D2B]">
                {userReviews.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: PROFILE DETAILS ───────────────────────── */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-sm border border-[#EDE9DF] p-2 sm:p-8 shadow-xs">
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
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 00 000 0000"
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
              <div className="bg-white rounded-sm border border-[#EDE9DF] p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#5C6460]">Loading your order history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-sm border border-[#EDE9DF] p-12 text-center space-y-4">
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
                  className="bg-white rounded-sm p-6 shadow-xs space-y-4 hover:border-[#183D2B]/30 transition-all"
                >
                  <div className="pb-3 border-b border-[#EDE9DF]/70">
                    {/* Row 1: order number + status badge + total — all on one line */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-[#183D2B] font-mono tracking-wider truncate">
                          {ord.order_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 shrink-0">
                          {ord.status}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#1D211F] shrink-0">
                        AED {Number(ord.total).toFixed(2)}
                      </span>
                    </div>
                    {/* Row 2: date + payment method */}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-[#8C938F]">
                        {new Date(ord.created_at).toLocaleDateString("en-AE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-[#5C6460] uppercase">
                        {ord.payment_status === "paid" ? "Paid Online" : "Cash on Delivery"}
                      </p>
                    </div>
                  </div>

                  {ord.order_items && ord.order_items.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {ord.order_items.map((item) => {
                        const snap = item.product_snapshot || {};
                        const image = snap.image;
                        return (
                          <div key={item.id} className="flex items-center justify-between text-xs py-1.5 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-[#FAF8F5] border border-[#EDE9DF] shrink-0 flex items-center justify-center">
                                {image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={image}
                                    alt={snap.name || "Product"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package size={20} className="text-[#8C938F]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[#1D211F] font-medium truncate">
                                  {snap.name || "Product"}
                                </p>
                                <p className="text-[#8C938F] text-[11px] mt-0.5">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="text-[#1D211F] font-semibold shrink-0">
                              AED {Number(item.line_total).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto"
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
              <div className="bg-white rounded-sm border border-[#EDE9DF] p-12 text-center space-y-4">
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

        {/* ── TAB 4: PRODUCT REVIEWS ───────────────────────── */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="bg-white rounded-sm border border-[#EDE9DF] p-3 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1D211F]">
                    Product Reviews & Ratings
                  </h2>
                  <p className="mt-1 text-xs text-[#5C6460]">
                    Review products from your delivered orders to share your experience with the community.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#183D2B]/10 text-[#183D2B] self-start sm:self-auto">
                  <ShieldCheck size={15} />
                  <span>Verified Customer Reviews</span>
                </div>
              </div>

              {loadingOrders || loadingUserReviews ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-[#5C6460]">Loading your orders and reviews…</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center max-w-sm mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#183D2B]/5 text-[#183D2B] flex items-center justify-center mx-auto">
                    <ShoppingBag size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1D211F]">No Orders Found</h3>
                    <p className="mt-1 text-xs text-[#5C6460] leading-relaxed">
                      You haven&apos;t placed any orders yet. Once your order is delivered, you can review your items here.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 py-2.5 px-5 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors"
                  >
                    Explore Products
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {orders.map((order) => {
                    const isDelivered = (order.status || "").toLowerCase() === "delivered";
                    const orderItems = order.order_items || [];

                    return (
                      <div
                        key={order.id}
                        className={`rounded-xl border transition-all ${
                          isDelivered
                            ? "border-[#EDE9DF] bg-white shadow-xs"
                            : "border-[#EDE9DF]/60 bg-[#FAF8F5]/50"
                        } p-5 sm:p-6`}
                      >
                        <div className="pb-4 mb-4 border-b border-[#EDE9DF]/60">
                          {/* Row 1: order number (left) + status badge (right) */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#1D211F] truncate">
                              Order #{order.order_number}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isDelivered && <Check size={12} />}
                              {order.status}
                            </span>
                          </div>
                          {/* Row 2: date */}
                          <p className="text-xs text-[#5C6460] mt-1">
                            {new Date(order.created_at).toLocaleDateString("en-AE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {orderItems.length === 0 ? (
                            <p className="text-xs text-[#8C938F] italic py-2">
                              No item details recorded for this order.
                            </p>
                          ) : (
                            orderItems.map((item) => {
                              const snap = item.product_snapshot || {};
                              const productId = item.product_id;
                              const existingReview = productId
                                ? userReviews.find(
                                    (r) => r.product_id === productId && r.order_id === order.id
                                  )
                                : null;

                              return (
                                <div
                                  key={item.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-14 h-14 rounded-md overflow-hidden bg-white border border-[#EDE9DF] shrink-0 flex items-center justify-center">
                                      {snap.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={snap.image}
                                          alt={snap.name || "Product"}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Package size={22} className="text-[#8C938F]" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#1D211F] truncate">
                                        {snap.name || "Aurelle Product"}
                                      </p>
                                      <p className="text-[11px] text-[#5C6460] mt-0.5">
                                        AED {Number(item.price_snapshot || 0).toFixed(2)} × {item.quantity}
                                      </p>
                                      {existingReview && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <div className="flex items-center text-amber-500">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                size={12}
                                                className={
                                                  i < existingReview.rating
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-gray-300"
                                                }
                                              />
                                            ))}
                                          </div>
                                          <span className="text-[10px] font-bold text-[#183D2B]">
                                            Rated {existingReview.rating}/5
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center self-end sm:self-auto shrink-0">
                                    {isDelivered ? (
                                      productId ? (
                                        existingReview ? (
                                          <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <Check size={13} className="text-emerald-600" />
                                            Reviewed
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openReviewModal(
                                                productId,
                                                snap.name || "Aurelle Product",
                                                snap.image,
                                                order.id,
                                                order.order_number
                                              )
                                            }
                                            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-[#183D2B] text-white hover:bg-[#102D20] shadow-xs"
                                          >
                                            <Star size={13} className="text-white" />
                                            Rate & Review
                                          </button>
                                        )
                                      ) : (
                                        <span className="text-[11px] text-[#8C938F]">
                                          Product unavailable
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-[11px] text-[#8C938F] italic bg-[#EDE9DF]/40 px-2.5 py-1 rounded">
                                        Review available once delivered
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                    placeholder="+971 00 000 0000"
                    className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white"
                  />
                </div>
              </div>

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

      {/* ── RATE & REVIEW MODAL ───────────────────────── */}
      {reviewModalOpen && reviewTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1D211F]/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE9DF] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE9DF]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1D211F]">
                  {reviewTarget.existingRating ? "Update Product Review" : "Write a Product Review"}
                </h3>
                <p className="text-[11px] text-[#5C6460] mt-0.5">
                  Order #{reviewTarget.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-md text-[#8C938F] hover:text-[#1D211F] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3.5 my-5 p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE9DF]">
              <div className="w-12 h-12 rounded-lg bg-white border border-[#EDE9DF] overflow-hidden shrink-0 flex items-center justify-center">
                {reviewTarget.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reviewTarget.productImage}
                    alt={reviewTarget.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={20} className="text-[#8C938F]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1D211F] truncate">
                  {reviewTarget.productName}
                </p>
                <p className="text-[11px] text-[#183D2B] font-semibold mt-0.5">
                  Verified Delivered Purchase
                </p>
              </div>
            </div>

            {reviewError && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                <Check size={16} className="shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-2">
                  Overall Rating *
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled =
                        reviewHoverRating > 0 ? star <= reviewHoverRating : star <= reviewRating;

                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                        >
                          <Star
                            size={28}
                            className={
                              isFilled
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300 hover:text-amber-200"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-[#183D2B] ml-2">
                    {reviewRating === 5 && "5 - Exceptional"}
                    {reviewRating === 4 && "4 - Very Good"}
                    {reviewRating === 3 && "3 - Average"}
                    {reviewRating === 2 && "2 - Below Expectation"}
                    {reviewRating === 1 && "1 - Poor"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D211F] mb-1.5">
                  Review Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your experience regarding texture, fragrance, effectiveness, and results..."
                  className="w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] p-3 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDE9DF]">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="py-2.5 px-4 rounded-md border border-[#EDE9DF] text-xs font-semibold text-[#5C6460] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="py-2.5 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
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