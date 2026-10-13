"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import {
  Save,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Globe,
  Heart,
  Award,
  Leaf,
  Star,
  Smile,
  Truck,
  Gem,
  CheckCircle,
  AlertCircle,
  Check,
  Layers,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";

interface PillarItem {
  icon: string;
  title: string;
  description: string;
}

interface AboutFormData {
  hero_badge: string;
  hero_title: string;
  hero_quote: string;
  story_tagline: string;
  story_title: string;
  story_paragraph_1: string;
  story_paragraph_2: string;
  story_image_url: string | null;
  story_image_public_id: string | null;
  pillars: PillarItem[];
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  cta_button_link: string;
  meta_title: string;
  meta_description: string;
}

const DEFAULT_FORM_DATA: AboutFormData = {
  hero_badge: "Our Heritage & Purpose",
  hero_title: "Everyday Essentials. Elevated.",
  hero_quote:
    "“True luxury lies in the elevation of everyday moments — the morning wash, the spritz of oud, the soothing restorative oil.”",
  story_tagline: "Founded in Dubai, UAE",
  story_title: "Born From a Desire for Daily Perfection",
  story_paragraph_1:
    "Headquartered in the vibrant cosmetic trade hub of Dubai, Aurelle Cosmetics Trading FZ-LLC was established to bridge the gap between unattainable high-glamour cosmetics and basic utilitarian hygiene.",
  story_paragraph_2:
    "We believe that every product entering your home — whether a hydrating peptide serum, an artisanal linen mist, or a tear-free infant wash — should inspire calm, confidence, and sensorial pleasure.",
  story_image_url:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  story_image_public_id: null,
  pillars: [
    {
      icon: "Sparkles",
      title: "Elevated Formulations",
      description:
        "Dermatologist-developed bio-actives, cold-pressed botanicals, and high-potency marine collagens.",
    },
    {
      icon: "ShieldCheck",
      title: "100% Authentic Sourcing",
      description:
        "Every single product is verified, batch-tested, and tracked with full chain-of-custody documentation.",
    },
    {
      icon: "Globe",
      title: "Built for the Gulf",
      description:
        "Formulated specifically to endure air-conditioning dryness, intense sun exposure, and regional humidity.",
    },
    {
      icon: "Heart",
      title: "Family-Centric",
      description:
        "Safe, gentle, and cruelty-free options crafted for infants, adolescents, and adults alike.",
    },
  ],
  cta_title: "Experience Aurelle Today",
  cta_description:
    "Discover our collection of 10 thoughtfully curated categories or connect with our commercial wholesale division.",
  cta_button_text: "Shop The Collection",
  cta_button_link: "/shop",
  meta_title: "About Aurelle Cosmetics UAE | Dubai Heritage & Philosophy | من نحن",
  meta_description:
    "Learn about Aurelle Cosmetics Trading FZ-LLC, our Dubai heritage, formulation ethos, and commitment to elevating everyday beauty and wellness in the UAE.",
};

const AVAILABLE_ICONS = [
  { value: "Sparkles", label: "Sparkles (Luxury)", icon: Sparkles },
  { value: "ShieldCheck", label: "ShieldCheck (Authentic)", icon: ShieldCheck },
  { value: "Globe", label: "Globe (Regional / Gulf)", icon: Globe },
  { value: "Heart", label: "Heart (Family / Care)", icon: Heart },
  { value: "Award", label: "Award (Quality)", icon: Award },
  { value: "Leaf", label: "Leaf (Natural / Clean)", icon: Leaf },
  { value: "Star", label: "Star (Premium)", icon: Star },
  { value: "Smile", label: "Smile (Gentle / Family)", icon: Smile },
  { value: "Truck", label: "Truck (Fast Delivery)", icon: Truck },
  { value: "Gem", label: "Gem (Prestige)", icon: Gem },
  { value: "CheckCircle", label: "CheckCircle (Verified)", icon: CheckCircle },
];

export default function AdminAboutPage() {
  const [formData, setFormData] = useState<AboutFormData>(DEFAULT_FORM_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/about");
        const json = await res.json();
        if (json.settings) {
          setFormData({
            ...DEFAULT_FORM_DATA,
            ...json.settings,
            pillars:
              Array.isArray(json.settings.pillars) && json.settings.pillars.length === 4
                ? json.settings.pillars
                : DEFAULT_FORM_DATA.pillars,
          });
        }
      } catch (err) {
        console.error("Failed to load about settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (field: keyof AboutFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePillarChange = (index: number, field: keyof PillarItem, value: string) => {
    setFormData((prev) => {
      const nextPillars = [...prev.pillars];
      const current = nextPillars[index] || { icon: "Sparkles", title: "", description: "" };
      nextPillars[index] = {
        icon: current.icon,
        title: current.title,
        description: current.description,
        [field]: value,
      };
      return { ...prev, pillars: nextPillars };
    });
  };


  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);

      const res = await fetch("/api/admin/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: "success", text: "About Us page content saved successfully!" });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: "error", text: json.error || "Failed to save changes." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "An unexpected error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col pb-16">
        <AdminHeader
          title="About Us Page"
          subtitle="Customize editorial story, heritage narrative, imagery, brand pillars, and call to action."
        />
        <div className="p-8 text-center text-xs text-[#8C938F]">Loading About page content...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="About Us Page"
        subtitle="Customize editorial hero, brand heritage story, imagery, brand pillars, and call to action."
      />

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Top Quick Bar */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-[#DCCFB9]/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#183D2B]">
            <BookOpen size={16} />
            <span>Storefront /about Page Editor</span>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="/about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#DCCFB9] hover:bg-[#F7F5EF] text-[#1D211F] text-xs font-semibold rounded-md transition-all cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>View Live Page</span>
            </a>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={13} />
              <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
            </button>
          </div>
        </div>

        {/* Status notification */}
        {message && (
          <div
            className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* ─── 1. Hero & Editorial Section ─── */}
          <div className="bg-white p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-[#183D2B]" />
              <span>1. Hero & Editorial Header</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Overline Badge
                </label>
                <input
                  type="text"
                  value={formData.hero_badge}
                  onChange={(e) => handleChange("hero_badge", e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none"
                  placeholder="e.g. Our Heritage & Purpose"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Page Headline (H1)
                </label>
                <input
                  type="text"
                  value={formData.hero_title}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none font-serif"
                  placeholder="e.g. Everyday Essentials. Elevated."
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Editorial Quote / Subheading
                </label>
                <textarea
                  rows={2}
                  value={formData.hero_quote}
                  onChange={(e) => handleChange("hero_quote", e.target.value)}
                  className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none italic font-serif leading-relaxed"
                  placeholder="e.g. “True luxury lies in the elevation of everyday moments...”"
                />
              </div>
            </div>
          </div>

          {/* ─── 2. Narrative Heritage Story & Image ─── */}
          <div className="bg-white p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2 flex items-center gap-2">
              <ImageIcon size={14} className="text-[#183D2B]" />
              <span>2. Brand Heritage & Story Narrative</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Narrative Text */}
              <div className="lg:col-span-7 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Story Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.story_tagline}
                    onChange={(e) => handleChange("story_tagline", e.target.value)}
                    className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none"
                    placeholder="e.g. Founded in Dubai, UAE"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Story Heading (H2)
                  </label>
                  <input
                    type="text"
                    value={formData.story_title}
                    onChange={(e) => handleChange("story_title", e.target.value)}
                    className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none font-serif font-bold"
                    placeholder="e.g. Born From a Desire for Daily Perfection"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    First Paragraph
                  </label>
                  <textarea
                    rows={4}
                    value={formData.story_paragraph_1}
                    onChange={(e) => handleChange("story_paragraph_1", e.target.value)}
                    className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none leading-relaxed"
                    placeholder="Describe company founding, Dubai headquarters, and market purpose..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Second Paragraph
                  </label>
                  <textarea
                    rows={4}
                    value={formData.story_paragraph_2}
                    onChange={(e) => handleChange("story_paragraph_2", e.target.value)}
                    className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none leading-relaxed"
                    placeholder="Describe product philosophy, sensorial experience, and family care..."
                  />
                </div>
              </div>

              {/* Right Column: Story Image Uploader */}
              <div className="lg:col-span-5 bg-[#FAF8F5] p-4 rounded-lg border border-[#DCCFB9]/50 space-y-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider">
                  Story Image
                </label>
                <p className="text-[11px] text-[#5C6460]">
                  Recommended: 4:3 or 16:9 ratio, clear luxury beauty aesthetic, up to 2MB.
                </p>
                <CloudinaryUploader
                  label="Heritage Story Image"
                  aspectRatio="wide"
                  folder="aurelle/about"
                  value={formData.story_image_url || undefined}
                  publicId={formData.story_image_public_id || undefined}
                  onUploadSuccess={(asset: CloudinaryAsset) => {
                    setFormData((prev) => ({
                      ...prev,
                      story_image_url: asset.secure_url,
                      story_image_public_id: asset.public_id,
                    }));
                  }}
                  onRemove={() => {
                    setFormData((prev) => ({
                      ...prev,
                      story_image_url: null,
                      story_image_public_id: null,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* ─── 3. 4 Brand Pillars ─── */}
          <div className="bg-white p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2 flex items-center gap-2">
              <Layers size={14} className="text-[#183D2B]" />
              <span>3. Brand Pillars (4 Core Value Cards)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#FAF8F5] border border-[#DCCFB9]/60 rounded-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#DCCFB9]/30 pb-1.5">
                    <span className="text-[11px] font-bold text-[#183D2B] uppercase tracking-wider">
                      Pillar #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-[#8C938F] uppercase font-bold">Icon:</label>
                      <select
                        value={pillar.icon}
                        onChange={(e) => handlePillarChange(idx, "icon", e.target.value)}
                        className="h-7 px-2 bg-white border border-[#DCCFB9] rounded text-[11px] font-medium text-[#1D211F] outline-none"
                      >
                        {AVAILABLE_ICONS.map((ico) => (
                          <option key={ico.value} value={ico.value}>
                            {ico.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={pillar.title}
                      onChange={(e) => handlePillarChange(idx, "title", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] focus:border-[#183D2B] outline-none font-serif font-bold"
                      placeholder="e.g. Elevated Formulations"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={pillar.description}
                      onChange={(e) => handlePillarChange(idx, "description", e.target.value)}
                      className="w-full p-2 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] focus:border-[#183D2B] outline-none leading-relaxed"
                      placeholder="Enter description..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── 4. Call To Action (Bottom Card) ─── */}
          <div className="bg-white p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2 flex items-center gap-2">
              <Award size={14} className="text-[#183D2B]" />
              <span>4. Bottom Call To Action (CTA Card)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Card Heading
                </label>
                <input
                  type="text"
                  value={formData.cta_title}
                  onChange={(e) => handleChange("cta_title", e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none font-serif font-bold"
                  placeholder="e.g. Experience Aurelle Today"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.cta_button_text}
                  onChange={(e) => handleChange("cta_button_text", e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none font-bold"
                  placeholder="e.g. Shop The Collection"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Card Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.cta_description}
                  onChange={(e) => handleChange("cta_description", e.target.value)}
                  className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none leading-relaxed"
                  placeholder="e.g. Discover our collection of 10 thoughtfully curated categories..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Button Destination Link
                </label>
                <input
                  type="text"
                  value={formData.cta_button_link}
                  onChange={(e) => handleChange("cta_button_link", e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none"
                  placeholder="e.g. /shop"
                />
              </div>
            </div>
          </div>

          {/* ─── 5. Search Engine Optimization (SEO) ─── */}
          <div className="bg-white p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2 flex items-center gap-2">
              <Globe size={14} className="text-[#183D2B]" />
              <span>5. Search Engine Optimization (SEO)</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Meta Title (Browser Tab & Google Headline)
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => handleChange("meta_title", e.target.value)}
                  className="w-full h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none"
                  placeholder="e.g. About Aurelle Cosmetics UAE | Dubai Heritage & Philosophy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Meta Description (Google Snippet)
                </label>
                <textarea
                  rows={2}
                  value={formData.meta_description}
                  onChange={(e) => handleChange("meta_description", e.target.value)}
                  className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] outline-none leading-relaxed"
                  placeholder="Brief summary of your Dubai heritage and philosophy..."
                />
              </div>
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSaving ? "Saving Changes..." : "Save All Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
