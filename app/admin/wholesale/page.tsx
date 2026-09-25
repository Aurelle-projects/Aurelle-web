"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import {
  Check,
  X,
  Clock,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  Image as ImageIcon,
  Save,
  Layers,
  Sparkles,
  AlertCircle,
  Eye,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

interface WholesaleApp {
  id: string;
  company_name: string;
  trade_license_number: string;
  contact_person: string;
  email: string;
  phone: string;
  business_type?: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  created_at: string;
  country?: string | null;
  expected_order_volume?: string | null;
  notes?: string | null;
  tax_number?: string | null;
  trade_license_url?: string | null;
}

interface BannerItem {
  url: string | null;
  public_id: string | null;
  link: string;
}

interface WholesaleStatItem {
  heading: string;
  description: string;
}

interface WholesaleFaqItem {
  question: string;
  answer: string;
}

export default function AdminWholesalePage() {
  const [activeTab, setActiveTab] = useState<"applications" | "banners">("applications");
  const [applications, setApplications] = useState<WholesaleApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingApp, setViewingApp] = useState<WholesaleApp | null>(null);

  function getWhatsAppNumber(app: WholesaleApp): string {
    if (app.notes) {
      const match = app.notes.match(/WhatsApp:\s*([^\n\r]+)/i);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return app.phone || "";
  }

  // Wholesale Banners & Hero state
  const [banner1, setBanner1] = useState<BannerItem>({ url: null, public_id: null, link: "" });
  const [banner2, setBanner2] = useState<BannerItem>({ url: null, public_id: null, link: "" });
  const [heroSettings, setHeroSettings] = useState<{
    hero_title: string;
    hero_subtitle: string;
    hero_tagline: string;
    background_image_url: string | null;
    background_image_public_id: string | null;
    mobile_image_url: string | null;
    mobile_image_public_id: string | null;
  }>({
    hero_title: "Direct B2B Beauty & Cosmetics Distribution",
    hero_subtitle: "Access verified wholesale pricing, low starter MOQs, and consolidated GCC carton & pallet logistics for licensed pharmacies, salons, and beauty retailers.",
    hero_tagline: "UAE & GCC Commercial Trade Network",
    background_image_url: null,
    background_image_public_id: null,
    mobile_image_url: null,
    mobile_image_public_id: null,
  });
  // Wholesale About Section state
  const [aboutSettings, setAboutSettings] = useState<{
    heading: string;
    description: string;
    image_url: string | null;
    image_public_id: string | null;
  }>({
    heading: "",
    description: "",
    image_url: null,
    image_public_id: null,
  });

  // Wholesale Statistics state (Exactly 4 statistics)
  const [statsSettings, setStatsSettings] = useState<WholesaleStatItem[]>([
    { heading: "", description: "" },
    { heading: "", description: "" },
    { heading: "", description: "" },
    { heading: "", description: "" },
  ]);

  // Wholesale FAQ / Accordion state (Exactly 5 questions with left side image)
  const [faqSettings, setFaqSettings] = useState<{
    heading: string;
    description: string;
    image_url: string | null;
    image_public_id: string | null;
    items: WholesaleFaqItem[];
  }>({
    heading: "",
    description: "",
    image_url: null,
    image_public_id: null,
    items: [
      { question: "", answer: "" },
      { question: "", answer: "" },
      { question: "", answer: "" },
      { question: "", answer: "" },
      { question: "", answer: "" },
    ],
  });

  // Wholesale Mission & Vision state (Exclusively for Wholesale About page)
  const [missionVisionSettings, setMissionVisionSettings] = useState<{
    mission_heading: string;
    mission_description: string;
    vision_heading: string;
    vision_description: string;
  }>({
    mission_heading: "",
    mission_description: "",
    vision_heading: "",
    vision_description: "",
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wholesale", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.applications)) {
          setApplications(json.applications as WholesaleApp[]);
        }
        if (json.wholesale_home_banners?.images) {
          const imgs = json.wholesale_home_banners.images;
          if (imgs[0]) setBanner1({ url: imgs[0].url || null, public_id: imgs[0].public_id || null, link: imgs[0].link || "" });
          if (imgs[1]) setBanner2({ url: imgs[1].url || null, public_id: imgs[1].public_id || null, link: imgs[1].link || "" });
        }
        if (json.wholesale_hero) {
          const h = json.wholesale_hero;
          setHeroSettings((prev) => ({
            ...prev,
            ...h,
            background_image_url:
              h.background_image_url ||
              h.banner_image_url ||
              h.banner_url ||
              h.image_url ||
              h.desktop_image_url ||
              prev.background_image_url,
            background_image_public_id:
              h.background_image_public_id ||
              h.banner_public_id ||
              h.public_id ||
              prev.background_image_public_id,
            mobile_image_url:
              h.mobile_image_url ||
              h.mobile_banner_url ||
              prev.mobile_image_url,
            mobile_image_public_id:
              h.mobile_image_public_id ||
              h.mobile_public_id ||
              prev.mobile_image_public_id,
          }));
        }
        if (json.wholesale_about) {
          const a = json.wholesale_about;
          setAboutSettings({
            heading: a.heading || "",
            description: a.description || "",
            image_url: a.image_url || null,
            image_public_id: a.image_public_id || null,
          });
        }
        if (json.wholesale_statistics) {
          const rawItems = Array.isArray(json.wholesale_statistics)
            ? json.wholesale_statistics
            : json.wholesale_statistics.items || [];
          const loadedStats: WholesaleStatItem[] = [0, 1, 2, 3].map((index) => {
            const item = rawItems[index] || {};
            return {
              heading: item.heading || "",
              description: item.description || "",
            };
          });
          setStatsSettings(loadedStats);
        }
        if (json.wholesale_faq) {
          const f = json.wholesale_faq;
          const rawFaqItems = Array.isArray(f.items) ? f.items : [];
          const loadedFaq: WholesaleFaqItem[] = [0, 1, 2, 3, 4].map((index) => {
            const it = rawFaqItems[index] || {};
            return {
              question: it.question || "",
              answer: it.answer || "",
            };
          });
          setFaqSettings({
            heading: f.heading || "",
            description: f.description || "",
            image_url: f.image_url || null,
            image_public_id: f.image_public_id || null,
            items: loadedFaq,
          });
        }
        if (json.wholesale_mission_vision) {
          const mv = json.wholesale_mission_vision;
          setMissionVisionSettings({
            mission_heading: mv.mission_heading || "",
            mission_description: mv.mission_description || "",
            vision_heading: mv.vision_heading || "",
            vision_description: mv.vision_description || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load wholesale admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: WholesaleApp["status"]) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );

    try {
      await fetch("/api/admin/wholesale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch {
      // Local state fallback
    }
  }

  function updateStat(index: number, updates: Partial<WholesaleStatItem>) {
    setStatsSettings((prev) => {
      const copy = [...prev];
      const current = copy[index] || { heading: "", description: "" };
      copy[index] = {
        heading: updates.heading !== undefined ? updates.heading : current.heading,
        description: updates.description !== undefined ? updates.description : current.description,
      };
      return copy;
    });
  }

  function updateFaqItem(index: number, updates: Partial<WholesaleFaqItem>) {
    setFaqSettings((prev) => {
      const copy = [...prev.items];
      const current = copy[index] || { question: "", answer: "" };
      copy[index] = {
        question: updates.question !== undefined ? updates.question : current.question,
        answer: updates.answer !== undefined ? updates.answer : current.answer,
      };
      return { ...prev, items: copy };
    });
  }

  async function handleSaveBanners() {
    setSavingSettings(true);
    setSaveMessage(null);
    try {
      const images = [];
      if (banner1.url) images.push(banner1);
      if (banner2.url) images.push(banner2);

      await Promise.all([
        fetch("/api/admin/wholesale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "wholesale_home_banners",
            value: { images },
          }),
        }),
        fetch("/api/admin/wholesale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "wholesale_hero",
            value: heroSettings,
          }),
        }),
        fetch("/api/admin/wholesale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "wholesale_about",
            value: aboutSettings,
          }),
        }),
        fetch("/api/admin/wholesale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "wholesale_statistics",
            value: { items: statsSettings.slice(0, 4) },
          }),
        }),
        fetch("/api/admin/wholesale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "wholesale_mission_vision",
            value: missionVisionSettings,
          }),
        }),
        fetch("/api/admin/wholesale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "wholesale_faq",
            value: {
              heading: faqSettings.heading,
              description: faqSettings.description,
              image_url: faqSettings.image_url,
              image_public_id: faqSettings.image_public_id,
              items: faqSettings.items.slice(0, 5),
            },
          }),
        }),
      ]);

      setSaveMessage("Wholesale banners & content saved successfully!");
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setSaveMessage(err?.message || "Failed to save wholesale settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.trade_license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="B2B Wholesale Portal Management"
        subtitle="Manage wholesale applications, review partner credentials, and configure independent wholesale banners & headlines."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#DCCFB9]/40 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#183D2B] text-white"
                : "bg-[#FAF8F5] text-[#5C6460] hover:text-[#14231B]"
            }`}
          >
            <Building2 size={15} />
            <span>Applications ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "banners"
                ? "bg-[#183D2B] text-white"
                : "bg-[#FAF8F5] text-[#5C6460] hover:text-[#14231B]"
            }`}
          >
            <ImageIcon size={15} />
            <span>Wholesale Banners &amp; Content</span>
          </button>
        </div>

        {/* TAB 1: Applications */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-sm border border-[#DCCFB9]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6460]" />
                <input
                  type="text"
                  placeholder="Search by company name, contact, or trade license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9] rounded-sm text-sm text-[#1D211F] outline-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-sm text-xs font-semibold text-[#1D211F] outline-none cursor-pointer w-full sm:w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="py-20 text-center text-[#5C6460]">Loading wholesale applications...</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white p-12 rounded-sm border border-[#DCCFB9]/60 text-center text-[#5C6460] space-y-2">
                <Building2 size={36} className="mx-auto text-[#8E9590]" />
                <p className="font-semibold text-sm">No wholesale applications found</p>
                <p className="text-xs text-[#8E9590]">New wholesale trade submissions will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-5 rounded-sm border border-[#DCCFB9]/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-base text-[#14231B]">{app.company_name}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                            app.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#5C6460] pt-1">
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-[#8E9590]" />
                          <span>{app.contact_person}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-[#8E9590]" />
                          <span>{app.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-[#8E9590]" />
                          <span>{app.phone}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                      {/* WhatsApp Chat Button */}
                      {(() => {
                        const rawWa = getWhatsAppNumber(app);
                        const cleanWa = rawWa.replace(/\D/g, "");
                        const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
                          `Hello ${app.contact_person}, this is Aurelle B2B Wholesale regarding your enquiry for ${app.company_name}.`
                        )}`;
                        return (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-sm bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={14} />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        );
                      })()}

                      {/* Eye / View Details Button */}
                      <button
                        type="button"
                        onClick={() => setViewingApp(app)}
                        className="px-2.5 py-1.5 rounded-sm bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#14231B] border border-[#DCCFB9] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="View All Details"
                      >
                        <Eye size={14} className="text-[#183D2B]" />
                        <span className="hidden sm:inline">Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStatus(app.id, "approved")}
                        className="px-3 py-1.5 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(app.id, "rejected")}
                        className="px-3 py-1.5 rounded-sm bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Wholesale Banners & Hero Settings */}
        {activeTab === "banners" && (
          <div className="bg-white p-6 sm:p-8 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-8">
            <div>
              <h3 className="text-base font-serif font-bold text-[#14231B]">
                Wholesale Promotional Banners &amp; Hero Content
              </h3>
              <p className="text-xs text-[#5C6460] mt-1">
                Configure offers and banners displayed exclusively on the Wholesale website. These settings are completely separated from the retail homepage.
              </p>
            </div>

            {saveMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-sm text-xs font-semibold flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* Wholesale Hero text settings */}
            <div className="space-y-4 pt-2 border-t border-[#EFEAE0]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231B]">
                Wholesale Hero Headline &amp; Tagline
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Hero Overline / Tagline
                  </label>
                  <input
                    type="text"
                    value={heroSettings.hero_tagline}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_tagline: e.target.value })}
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={heroSettings.hero_title}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_title: e.target.value })}
                    className="w-full h-9 px-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                    Hero Subtitle / Description
                  </label>
                  <textarea
                    rows={2}
                    value={heroSettings.hero_subtitle}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_subtitle: e.target.value })}
                    className="w-full p-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Wholesale Hero Banner Images (Desktop + Mobile) */}
              <div className="pt-3 border-t border-[#EFEAE0]/80">
                <div className="mb-3">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#14231B]">
                    Wholesale Hero Background Banner (Full Width)
                  </h5>
                  <p className="text-[11px] text-[#5C6460]">
                    Upload the main banner displayed behind the Wholesale Hero text.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#FAF8F5] rounded-sm">
                    <CloudinaryUploader
                      label="Wholesale Hero Desktop Banner"
                      description="Recommended: 1920x1000px, aspect ratio wide"
                      aspectRatio="wide"
                      folder="aurelle/wholesale_hero"
                      value={heroSettings.background_image_url || undefined}
                      publicId={heroSettings.background_image_public_id || undefined}
                      onUploadSuccess={(asset: CloudinaryAsset) => {
                        setHeroSettings((prev) => ({
                          ...prev,
                          background_image_url: asset.secure_url,
                          background_image_public_id: asset.public_id,
                        }));
                      }}
                      onRemove={() => {
                        setHeroSettings((prev) => ({
                          ...prev,
                          background_image_url: null,
                          background_image_public_id: null,
                        }));
                      }}
                    />
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-sm">
                    <CloudinaryUploader
                      label="Wholesale Hero Mobile Banner"
                      description="Recommended: 800x1200px (optional, falls back to desktop)"
                      aspectRatio="wide"
                      folder="aurelle/wholesale_hero"
                      value={heroSettings.mobile_image_url || undefined}
                      publicId={heroSettings.mobile_image_public_id || undefined}
                      onUploadSuccess={(asset: CloudinaryAsset) => {
                        setHeroSettings((prev) => ({
                          ...prev,
                          mobile_image_url: asset.secure_url,
                          mobile_image_public_id: asset.public_id,
                        }));
                      }}
                      onRemove={() => {
                        setHeroSettings((prev) => ({
                          ...prev,
                          mobile_image_url: null,
                          mobile_image_public_id: null,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale About Section */}
            <div className="space-y-4 pt-6 border-t border-[#EFEAE0]">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231B]">
                  Wholesale About Section
                </h4>
                <p className="text-[11px] text-[#5C6460] mt-0.5">
                  Configure the Wholesale About section with an image on the left, and heading &amp; description on the right.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left side: Image */}
                <div className="lg:col-span-5 p-4 bg-[#FAF8F5] rounded-sm space-y-3">
                  <h5 className="text-xs font-bold text-[#14231B]">About Section Image (Left)</h5>
                  <CloudinaryUploader
                    label="About Image"
                    description="Recommended: Square or 4:3 / 16:9 ratio, up to 2MB"
                    aspectRatio="square"
                    folder="aurelle/wholesale_about"
                    value={aboutSettings.image_url || undefined}
                    publicId={aboutSettings.image_public_id || undefined}
                    onUploadSuccess={(asset: CloudinaryAsset) => {
                      setAboutSettings((prev) => ({
                        ...prev,
                        image_url: asset.secure_url,
                        image_public_id: asset.public_id,
                      }));
                    }}
                    onRemove={() => {
                      setAboutSettings((prev) => ({
                        ...prev,
                        image_url: null,
                        image_public_id: null,
                      }));
                    }}
                  />
                </div>

                {/* Right side: Heading & Description */}
                <div className="lg:col-span-7 p-4 bg-[#FAF8F5] rounded-sm space-y-4">
                  <h5 className="text-xs font-bold text-[#14231B]">About Content (Right)</h5>
                  <div>
                    <label className="block text-[11px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Heading
                    </label>
                    <input
                      type="text"
                      placeholder="Enter heading..."
                      value={aboutSettings.heading}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, heading: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Enter description..."
                      value={aboutSettings.description}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, description: e.target.value })}
                      className="w-full p-3 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale Statistics Section (Max 4 Statistics) */}
            <div className="space-y-4 pt-6 border-t border-[#EFEAE0]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231B]">
                    Wholesale Statistics Section (4 Statistics)
                  </h4>
                  <p className="text-[11px] text-[#5C6460] mt-0.5">
                    Add heading and small description for up to 4 statistics.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#8E9590] bg-[#FAF8F5] px-2.5 py-1 rounded-sm border border-[#DCCFB9]/50 w-fit">
                  Maximum 4 statistics
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsSettings.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF8F5] rounded-sm border border-[#DCCFB9]/60 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#EFEAE0]">
                        <span className="text-xs font-bold text-[#14231B]">
                          Statistic #{idx + 1}
                        </span>
                        {(stat.heading || stat.description) && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStat(idx, {
                                heading: "",
                                description: "",
                              })
                            }
                            className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Heading */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                          Heading
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 500+ Salons"
                          value={stat.heading}
                          onChange={(e) => updateStat(idx, { heading: e.target.value })}
                          className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                        />
                      </div>

                      {/* Small Description */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                          Small Description
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Registered GCC partners"
                          value={stat.description}
                          onChange={(e) => updateStat(idx, { description: e.target.value })}
                          className="w-full p-2 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wholesale Mission & Vision Section (Only on Wholesale About Page) */}
            <div className="space-y-4 pt-6 border-t border-[#EFEAE0]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231B]">
                      Wholesale Mission &amp; Vision Section
                    </h4>
                    <span className="text-[10px] bg-[#183D2B]/10 text-[#183D2B] font-semibold px-2 py-0.5 rounded-full">
                      Wholesale About Page Only
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6460] mt-0.5">
                    Configure the Mission and Vision headings and descriptions displayed exclusively on the Wholesale About Us page.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mission Card */}
                <div className="p-4 bg-[#FAF8F5] rounded-sm border border-[#DCCFB9]/60 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#EFEAE0]">
                    <span className="text-xs font-bold text-[#14231B]">
                      Our Mission
                    </span>
                    {(missionVisionSettings.mission_heading || missionVisionSettings.mission_description) && (
                      <button
                        type="button"
                        onClick={() =>
                          setMissionVisionSettings((prev) => ({
                            ...prev,
                            mission_heading: "",
                            mission_description: "",
                          }))
                        }
                        className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Mission Heading
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Empowering GCC Beauty Retailers"
                      value={missionVisionSettings.mission_heading}
                      onChange={(e) =>
                        setMissionVisionSettings((prev) => ({
                          ...prev,
                          mission_heading: e.target.value,
                        }))
                      }
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Mission Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter mission description..."
                      value={missionVisionSettings.mission_description}
                      onChange={(e) =>
                        setMissionVisionSettings((prev) => ({
                          ...prev,
                          mission_description: e.target.value,
                        }))
                      }
                      className="w-full p-2 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-y"
                    />
                  </div>
                </div>

                {/* Vision Card */}
                <div className="p-4 bg-[#FAF8F5] rounded-sm border border-[#DCCFB9]/60 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#EFEAE0]">
                    <span className="text-xs font-bold text-[#14231B]">
                      Our Vision
                    </span>
                    {(missionVisionSettings.vision_heading || missionVisionSettings.vision_description) && (
                      <button
                        type="button"
                        onClick={() =>
                          setMissionVisionSettings((prev) => ({
                            ...prev,
                            vision_heading: "",
                            vision_description: "",
                          }))
                        }
                        className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Vision Heading
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., The Benchmark for Regional B2B Cosmetics"
                      value={missionVisionSettings.vision_heading}
                      onChange={(e) =>
                        setMissionVisionSettings((prev) => ({
                          ...prev,
                          vision_heading: e.target.value,
                        }))
                      }
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Vision Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter vision description..."
                      value={missionVisionSettings.vision_description}
                      onChange={(e) =>
                        setMissionVisionSettings((prev) => ({
                          ...prev,
                          vision_description: e.target.value,
                        }))
                      }
                      className="w-full p-2 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale FAQ / Accordion Section (Max 5 Questions) */}
            <div className="space-y-4 pt-6 border-t border-[#EFEAE0]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231B]">
                    Wholesale FAQ / Accordion Section (5 Questions)
                  </h4>
                  <p className="text-[11px] text-[#5C6460] mt-0.5">
                    Configure the left-side image and up to 5 accordion questions &amp; answers on the right.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#8E9590] bg-[#FAF8F5] px-2.5 py-1 rounded-sm border border-[#DCCFB9]/50 w-fit">
                  Maximum 5 questions
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side: Image & Section Heading */}
                <div className="lg:col-span-5 p-4 bg-[#FAF8F5] rounded-sm border border-[#DCCFB9]/60 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Frequently Asked Questions"
                      value={faqSettings.heading}
                      onChange={(e) => setFaqSettings({ ...faqSettings, heading: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                      Section Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Learn more about our vision, heritage and commitment..."
                      value={faqSettings.description}
                      onChange={(e) => setFaqSettings({ ...faqSettings, description: e.target.value })}
                      className="w-full p-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-[#14231B] mb-2">FAQ Image (Left Side)</h5>
                    <CloudinaryUploader
                      label="Upload FAQ Image"
                      description="Recommended: Square or portrait ratio"
                      aspectRatio="square"
                      folder="aurelle/wholesale_faq"
                      value={faqSettings.image_url || undefined}
                      publicId={faqSettings.image_public_id || undefined}
                      onUploadSuccess={(asset: CloudinaryAsset) => {
                        setFaqSettings((prev) => ({
                          ...prev,
                          image_url: asset.secure_url,
                          image_public_id: asset.public_id,
                        }));
                      }}
                      onRemove={() => {
                        setFaqSettings((prev) => ({
                          ...prev,
                          image_url: null,
                          image_public_id: null,
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Right Side: 5 Accordion Questions & Answers */}
                <div className="lg:col-span-7 space-y-3">
                  {faqSettings.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#FAF8F5] rounded-sm border border-[#DCCFB9]/60 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-[#EFEAE0]">
                        <span className="text-xs font-bold text-[#14231B]">
                          Question #{idx + 1}
                        </span>
                        {(item.question || item.answer) && (
                          <button
                            type="button"
                            onClick={() => updateFaqItem(idx, { question: "", answer: "" })}
                            className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter question #${idx + 1}...`}
                          value={item.question}
                          onChange={(e) => updateFaqItem(idx, { question: e.target.value })}
                          className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#14231B] uppercase tracking-wider mb-1">
                          Answer
                        </label>
                        <textarea
                          rows={3}
                          placeholder={`Enter answer #${idx + 1}...`}
                          value={item.answer}
                          onChange={(e) => updateFaqItem(idx, { answer: e.target.value })}
                          className="w-full p-2 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Wholesale Home Banners (2 banners reused via HomeBanners) */}
            <div className="space-y-6 pt-4 border-t border-[#EFEAE0]">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231B]">
                  Wholesale Home Banners (Dual Grid)
                </h4>
                <p className="text-[11px] text-[#5C6460] mt-0.5">
                  Managed independently from retail banners. Reuses the HomeBanners component.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banner 1 */}
                <div className="p-4 bg-[#FAF8F5] rounded-sm space-y-3">
                  <h5 className="text-xs font-bold text-[#14231B]">Wholesale Banner 1</h5>
                  <CloudinaryUploader
                    label="Banner 1 Image"
                    description="Aspect ratio 5:4 recommended"
                    aspectRatio="wide"
                    folder="aurelle/wholesale_banners"
                    value={banner1.url || undefined}
                    publicId={banner1.public_id || undefined}
                    onUploadSuccess={(asset: CloudinaryAsset) => {
                      setBanner1((prev) => ({ ...prev, url: asset.secure_url, public_id: asset.public_id }));
                    }}
                    onRemove={() => {
                      setBanner1((prev) => ({ ...prev, url: null, public_id: null }));
                    }}
                  />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6460] mb-1">
                      Banner 1 Link Href
                    </label>
                    <input
                      type="text"
                      value={banner1.link}
                      onChange={(e) => setBanner1({ ...banner1, link: e.target.value })}
                      placeholder="#all-products or /wholesale/products/..."
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>
                </div>

                {/* Banner 2 */}
                <div className="p-4 bg-[#FAF8F5] rounded-sm space-y-3">
                  <h5 className="text-xs font-bold text-[#14231B]">Wholesale Banner 2</h5>
                  <CloudinaryUploader
                    label="Banner 2 Image"
                    description="Aspect ratio 5:4 recommended"
                    aspectRatio="wide"
                    folder="aurelle/wholesale_banners"
                    value={banner2.url || undefined}
                    publicId={banner2.public_id || undefined}
                    onUploadSuccess={(asset: CloudinaryAsset) => {
                      setBanner2((prev) => ({ ...prev, url: asset.secure_url, public_id: asset.public_id }));
                    }}
                    onRemove={() => {
                      setBanner2((prev) => ({ ...prev, url: null, public_id: null }));
                    }}
                  />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6460] mb-1">
                      Banner 2 Link Href
                    </label>
                    <input
                      type="text"
                      value={banner2.link}
                      onChange={(e) => setBanner2({ ...banner2, link: e.target.value })}
                      placeholder="#all-products"
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#EFEAE0] flex justify-end">
              <button
                type="button"
                onClick={handleSaveBanners}
                disabled={savingSettings}
                className="px-6 py-3 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save size={15} />
                <span>{savingSettings ? "Saving Settings..." : "Save Wholesale Banners & Settings"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Wholesale Enquiry Details Modal ── */}
      {viewingApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setViewingApp(null)}
        >
          <div
            className="bg-white rounded-md border border-[#DCCFB9] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEAE0] bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-[#14231B]">
                      {viewingApp.company_name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                        viewingApp.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : viewingApp.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {viewingApp.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E9590] mt-0.5 flex items-center gap-1.5">
                    <Clock size={11} />
                    <span>Submitted on {new Date(viewingApp.created_at).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="p-1.5 rounded-sm text-[#8E9590] hover:text-[#14231B] hover:bg-[#EFEAE0]/50 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#14231B]">
              {/* Contact Information Cards */}
              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8E9590] mb-2.5">
                  Contact & Business Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#FAF8F5] p-4 rounded-sm border border-[#EDE9DF]">
                  <div>
                    <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                      Contact Person
                    </span>
                    <span className="font-semibold text-sm text-[#14231B] block mt-0.5">
                      {viewingApp.contact_person}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                      Company / Organization
                    </span>
                    <span className="font-semibold text-sm text-[#14231B] block mt-0.5">
                      {viewingApp.company_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                      Mobile Phone
                    </span>
                    <a
                      href={`tel:${viewingApp.phone}`}
                      className="font-semibold text-xs text-[#183D2B] hover:underline inline-flex items-center gap-1.5 mt-1"
                    >
                      <Phone size={13} />
                      <span>{viewingApp.phone}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                      WhatsApp Number
                    </span>
                    {(() => {
                      const wa = getWhatsAppNumber(viewingApp);
                      const cleanWa = wa.replace(/\D/g, "");
                      return (
                        <a
                          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                            `Hello ${viewingApp.contact_person}, this is Aurelle B2B Wholesale regarding your enquiry for ${viewingApp.company_name}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-xs text-[#25D366] hover:underline inline-flex items-center gap-1.5 mt-1"
                        >
                          <MessageCircle size={13} />
                          <span>{wa}</span>
                        </a>
                      );
                    })()}
                  </div>

                  <div>
                    <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                      Business Email
                    </span>
                    <span className="font-semibold text-xs text-[#14231B] block mt-1">
                      {viewingApp.email && !viewingApp.email.includes("@wholesale.aurelle.ae") ? (
                        <a
                          href={`mailto:${viewingApp.email}`}
                          className="text-[#183D2B] hover:underline inline-flex items-center gap-1.5"
                        >
                          <Mail size={13} />
                          <span>{viewingApp.email}</span>
                        </a>
                      ) : (
                        <span className="text-[#8E9590] italic">Not provided</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                      Country / Region
                    </span>
                    <span className="font-semibold text-xs text-[#14231B] block mt-1">
                      {viewingApp.country || "United Arab Emirates"}
                    </span>
                  </div>

                  {viewingApp.expected_order_volume && (
                    <div>
                      <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                        Order Volume / Quantity
                      </span>
                      <span className="font-bold text-xs text-[#183D2B] block mt-1">
                        {viewingApp.expected_order_volume}
                      </span>
                    </div>
                  )}

                  {viewingApp.trade_license_number && viewingApp.trade_license_number !== "—" && (
                    <div>
                      <span className="text-[#8E9590] block text-[10px] uppercase font-bold tracking-wider">
                        Trade License / Reg Number
                      </span>
                      <span className="font-semibold text-xs text-[#14231B] block mt-1">
                        {viewingApp.trade_license_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enquiry Notes & Summary */}
              {viewingApp.notes && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8E9590] mb-2.5">
                    Enquiry Requirements &amp; Notes
                  </h4>
                  <div className="bg-[#FAF8F5] p-4 rounded-sm border border-[#EDE9DF] space-y-1.5 whitespace-pre-line leading-relaxed text-xs text-[#2D3330]">
                    {viewingApp.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#EFEAE0] bg-[#FAF8F5] gap-3">
              {(() => {
                const wa = getWhatsAppNumber(viewingApp);
                const cleanWa = wa.replace(/\D/g, "");
                return (
                  <a
                    href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                      `Hello ${viewingApp.contact_person}, this is Aurelle B2B Wholesale regarding your enquiry for ${viewingApp.company_name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-sm bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Open WhatsApp Chat</span>
                  </a>
                );
              })()}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {viewingApp.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      updateStatus(viewingApp.id, "approved");
                      setViewingApp((prev) => (prev ? { ...prev, status: "approved" } : null));
                    }}
                    className="px-4 py-2.5 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                )}
                {viewingApp.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => {
                      updateStatus(viewingApp.id, "rejected");
                      setViewingApp((prev) => (prev ? { ...prev, status: "rejected" } : null));
                    }}
                    className="px-4 py-2.5 rounded-sm bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingApp(null)}
                  className="px-4 py-2.5 rounded-sm bg-white hover:bg-gray-100 text-[#5C6460] border border-[#DCCFB9] text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
