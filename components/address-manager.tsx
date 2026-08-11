"use client";

import { useState } from "react";
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiStar, FiCheck, FiX } from "react-icons/fi";

import type { UserAddress } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressFormData {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormData = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Bangladesh",
  isDefault: false,
};

interface AddressManagerProps {
  initialAddresses: UserAddress[];
}

export function AddressManager({ initialAddresses }: AddressManagerProps) {
  const { token } = useAuthStore();
  const [addresses, setAddresses] = useState<UserAddress[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<AddressFormData>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  }

  function openEdit(addr: UserAddress) {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? "",
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      state: addr.state ?? "",
      postalCode: addr.postalCode ?? "",
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setErrors({});
  }

  function validateForm(): boolean {
    const newErrors: Partial<AddressFormData> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        label: form.label || undefined,
        fullName: form.fullName,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city,
        state: form.state || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country || "Bangladesh",
        isDefault: form.isDefault,
      };

      if (editingId !== null) {
        const { item } = await apiClient.updateAddress(editingId, payload, token ?? undefined);
        setAddresses((prev) => prev.map((a) => {
          if (item.isDefault && a.id !== item.id) return { ...a, isDefault: false };
          return a.id === item.id ? item : a;
        }));
      } else {
        const { item } = await apiClient.createAddress(payload, token ?? undefined);
        setAddresses((prev) => {
          const updated = item.isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : [...prev];
          return [...updated, item];
        });
      }
      closeForm();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setBusyId(id);
    try {
      await apiClient.deleteAddress(id, token ?? undefined);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to delete address");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Address cards */}
      {addresses.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
              <FiMapPin className="h-7 w-7 text-zinc-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-700">No saved addresses</p>
              <p className="text-sm text-zinc-500">Add an address to speed up checkout.</p>
            </div>
            <Button onClick={openCreate} className="rounded-full bg-orange-500 hover:bg-orange-600">
              <FiPlus className="h-4 w-4" /> Add Address
            </Button>
          </CardContent>
        </Card>
      )}

      {addresses.map((addr) => (
        <Card key={addr.id} className={addr.isDefault ? "border-orange-300 bg-orange-50/30" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm space-y-0.5">
                <div className="flex items-center gap-2">
                  {addr.label && <p className="font-semibold text-zinc-800">{addr.label}</p>}
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      <FiStar className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>
                <p className="font-medium text-zinc-800">{addr.fullName}</p>
                <p className="text-zinc-600">{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-zinc-600">{addr.addressLine2}</p>}
                <p className="text-zinc-600">
                  {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
                </p>
                <p className="text-zinc-600">{addr.country}</p>
                <p className="text-zinc-500">{addr.phone}</p>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => openEdit(addr)}
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </Button>
                {deleteConfirm === addr.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleDelete(addr.id)}
                      disabled={busyId === addr.id}
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeleteConfirm(addr.id)}
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add button (when addresses exist and form is not shown) */}
      {addresses.length > 0 && !showForm && (
        <button
          type="button"
          onClick={openCreate}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-3 text-sm font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
        >
          <FiPlus className="h-4 w-4" /> Add new address
        </button>
      )}

      {/* Address form */}
      {showForm && (
        <Card className="border-zinc-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-zinc-800">
                {editingId ? "Edit Address" : "New Address"}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
                <FiX className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Label (optional)</Label>
                <Input
                  placeholder="Home, Office..."
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  maxLength={255}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone *</Label>
                <Input
                  placeholder="+880..."
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  maxLength={30}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Address Line 1 *</Label>
                <Input
                  placeholder="Street, building, apartment..."
                  value={form.addressLine1}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
                  maxLength={500}
                />
                {errors.addressLine1 && <p className="text-xs text-red-500">{errors.addressLine1}</p>}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Address Line 2 (optional)</Label>
                <Input
                  placeholder="Floor, area landmark..."
                  value={form.addressLine2}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City *</Label>
                <Input
                  placeholder="Dhaka"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  maxLength={255}
                />
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">District / State</Label>
                <Input
                  placeholder="Dhaka Division"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Postal Code</Label>
                <Input
                  placeholder="1207"
                  value={form.postalCode}
                  onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300 accent-orange-500"
              />
              Set as default address
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {saving ? "Saving..." : "Save Address"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
