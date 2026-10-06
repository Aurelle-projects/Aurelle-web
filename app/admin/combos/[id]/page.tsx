"use client";

import React, { useState, useEffect, use } from "react";
import ComboForm from "@/components/admin/ComboForm";
import { Loader2 } from "lucide-react";
import { ComboOffer } from "@/types/combo";

interface EditComboPageProps {
  params: Promise<{ id: string }>;
}

export default function EditComboPage({ params }: EditComboPageProps) {
  const { id } = use(params);
  const [combo, setCombo] = useState<ComboOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCombo() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/combos/${id}`);
        const data = await res.json();
        if (res.ok && data.combo) {
          setCombo(data.combo);
        } else {
          setError(data.error || "Combo offer not found.");
        }
      } catch {
        setError("Failed to load combo offer.");
      } finally {
        setLoading(false);
      }
    }

    loadCombo();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#5C6460] flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-[#183D2B]" />
        <span>Loading combo offer details...</span>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="p-8 text-center text-xs text-red-600">
        <p>{error || "Combo offer not found."}</p>
      </div>
    );
  }

  return <ComboForm initialData={combo} isEdit={true} />;
}
