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

interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    [key: string]: unknown;
  };
}

interface RetailAccountClientProps {
  initialUser: AuthUser | null;
  initialProfile: Profile | null;
}

type TabId = "profile" | "orders" | "addresses" | "reviews";

function AccountContent({ initialUser, initialProfile }: RetailAccountClientProps) {
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

  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState(initialProfile?.full_name || initialUser?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || initialUser?.user_metadata?.phone || "");
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

  // Load User & Profile fallback
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
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
        if (profileData.role === "wholesale_customer") {
          window.location.assign("/wholesale/account");
          return;
        }
        setProfile(profileData);
        setFullName(profileData.full_name || currentUser.user_metadata?.full_name || "");
        setPhone(profileData.phone || currentUser.user_metadata?.phone || "");
      } else {
        setFullName(currentUser.user_metadata?.full_name || "");
        setPhone(currentUser.user_metadata?.phone || "");
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (!user) return;
    fetchOrders(activeTab === "orders" || activeTab === "reviews");
    fetchAddresses(activeTab === "addresses");
    fetchUserReviews(activeTab === "reviews");
  }, [user, fetchOrders, fetchAddresses, fetchUserReviews, activeTab]);

  // Handle Logout
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

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
                  Member
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

        {/* ── Mobile Tab Navigation ── */}
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

        {/* ── Desktop Tab Navigation ──── */}
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
          <div className="bg-white rounded-sm border border-[#EDE9DF] p-4 sm:p-8 shadow-xs">
            <div className="max-w-xl">
              <h2 className="font-serif text-xl font-bold text-[#1D211F]">Personal Information</h2>
              <p className="mt-1 text-xs text-[#5C6460]">
                Update your personal details for faster checkout and customized recommendations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RetailAccountClient(props: RetailAccountClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] p-8 text-center text-xs text-[#5C6460]">Loading account...</div>}>
      <AccountContent {...props} />
    </Suspense>
  );
}
