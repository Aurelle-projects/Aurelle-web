import React from "react";
import ComboForm from "@/components/admin/ComboForm";

export const metadata = {
  title: "Create Combo Offer | Aurelle Admin",
  description: "Create a new bundled retail combo offer with custom pricing and components.",
};

export default function NewComboPage() {
  return <ComboForm isEdit={false} />;
}
