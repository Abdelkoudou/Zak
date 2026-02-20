"use client";

import { useState } from "react";
import {
  createPlanAction,
  updatePlanAction,
  togglePlanAction,
  deletePlanAction,
} from "@/app/settings/plan-actions";

// ============================================================================
// Types
// ============================================================================

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  is_featured: boolean;
  description: string | null;
}

interface SubscriptionPlansManagerProps {
  initialPlans: SubscriptionPlan[];
}

interface PlanFormData {
  name: string;
  duration_days: string;
  price: string;
  description: string;
  is_featured: boolean;
  sort_order: string;
}

const EMPTY_FORM: PlanFormData = {
  name: "",
  duration_days: "",
  price: "",
  description: "",
  is_featured: false,
  sort_order: "0",
};

// ============================================================================
// Component
// ============================================================================

export default function SubscriptionPlansManager({
  initialPlans,
}: SubscriptionPlansManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [formData, setFormData] = useState<PlanFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ========================================================================
  // Helpers
  // ========================================================================

  function clearMessage() {
    setTimeout(() => setMessage(null), 4000);
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(plan: SubscriptionPlan) {
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      duration_days: plan.duration_days.toString(),
      price: plan.price.toString(),
      description: plan.description || "",
      is_featured: plan.is_featured,
      sort_order: plan.sort_order.toString(),
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  }

  // ========================================================================
  // Actions
  // ========================================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const fd = new FormData();
    fd.set("name", formData.name);
    fd.set("duration_days", formData.duration_days);
    fd.set("price", formData.price);
    fd.set("description", formData.description);
    fd.set("is_featured", formData.is_featured.toString());
    fd.set("sort_order", formData.sort_order);

    let result;
    if (editingId) {
      fd.set("id", editingId);
      result = await updatePlanAction(fd);
    } else {
      result = await createPlanAction(fd);
    }

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: result.message || "Succès" });
      cancelForm();
      // Refresh the page to get updated data from server
      window.location.reload();
    }

    setIsLoading(false);
    clearMessage();
  }

  async function handleToggle(planId: string) {
    setIsLoading(true);
    const result = await togglePlanAction(planId);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      // Optimistic update
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, is_active: !p.is_active } : p,
        ),
      );
      setMessage({ type: "success", text: result.message || "Mis à jour" });
    }

    setIsLoading(false);
    clearMessage();
  }

  async function handleDelete(planId: string) {
    setIsLoading(true);
    setConfirmDeleteId(null);
    const result = await deletePlanAction(planId);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      setMessage({ type: "success", text: result.message || "Supprimé" });
    }

    setIsLoading(false);
    clearMessage();
  }

  // ========================================================================
  // Render
  // ========================================================================

  const activePlanCount = plans.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-body text-gray-500">
            {plans.length} offre{plans.length !== 1 ? "s" : ""} •{" "}
            {activePlanCount} active{activePlanCount !== 1 ? "s" : ""}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreateForm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-heading font-semibold text-white bg-brand-teal rounded-brand hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter une offre
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-brand text-sm font-body ${
            message.type === "success"
              ? "bg-teal-50 text-brand-teal border border-teal-100"
              : "bg-red-50 text-destructive border border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 bg-white rounded-brand border border-gray-200 shadow-sm space-y-4"
        >
          <h4 className="text-base font-heading font-semibold text-brand-black">
            {editingId ? "Modifier l'offre" : "Nouvelle offre"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label
                htmlFor="plan-name"
                className="block text-sm font-body font-medium text-brand-black mb-1"
              >
                Nom *
              </label>
              <input
                id="plan-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="ex: 2 Mois, 1 An"
                className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-body focus:border-brand-teal focus:ring-brand-teal"
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="plan-duration"
                className="block text-sm font-body font-medium text-brand-black mb-1"
              >
                Durée (jours) *
              </label>
              <input
                id="plan-duration"
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({ ...formData, duration_days: e.target.value })
                }
                required
                placeholder="ex: 60, 180, 365"
                className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-body focus:border-brand-teal focus:ring-brand-teal"
              />
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="plan-price"
                className="block text-sm font-body font-medium text-brand-black mb-1"
              >
                Prix (DZD) *
              </label>
              <div className="relative">
                <input
                  id="plan-price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  placeholder="ex: 500, 1000"
                  className="block w-full rounded-brand border border-gray-300 px-3 py-2 pr-12 text-sm font-body focus:border-brand-teal focus:ring-brand-teal"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-400 text-sm font-body">DA</span>
                </div>
              </div>
            </div>

            {/* Sort order */}
            <div>
              <label
                htmlFor="plan-sort"
                className="block text-sm font-body font-medium text-brand-black mb-1"
              >
                Ordre d&apos;affichage
              </label>
              <input
                id="plan-sort"
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
                placeholder="0"
                className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-body focus:border-brand-teal focus:ring-brand-teal"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="plan-desc"
              className="block text-sm font-body font-medium text-brand-black mb-1"
            >
              Description
            </label>
            <input
              id="plan-desc"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="ex: Accès pendant 2 mois"
              className="block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm font-body focus:border-brand-teal focus:ring-brand-teal"
            />
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) =>
                setFormData({ ...formData, is_featured: e.target.checked })
              }
              className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
            />
            <span className="text-sm font-body text-brand-black">
              ⭐ Offre mise en avant (badge &quot;Populaire&quot;)
            </span>
          </label>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-heading font-semibold text-white bg-brand-teal rounded-brand hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading
                ? "Enregistrement..."
                : editingId
                  ? "Mettre à jour"
                  : "Créer l'offre"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-body text-gray-600 hover:text-brand-black transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Plans list */}
      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 font-body text-sm">
          Aucune offre configurée. Créez votre première offre.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex items-center gap-4 p-4 rounded-brand border transition-colors ${
                plan.is_active
                  ? "bg-white border-gray-200 shadow-sm"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-heading font-semibold text-brand-black truncate">
                    {plan.name}
                  </h4>
                  {plan.is_featured && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium bg-amber-100 text-amber-800">
                      ⭐ Populaire
                    </span>
                  )}
                  {!plan.is_active && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium bg-gray-200 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm font-body text-gray-500 mt-0.5">
                  {plan.duration_days} jours •{" "}
                  <span className="font-semibold text-brand-black">
                    {plan.price} DA
                  </span>
                  {plan.description && <span> • {plan.description}</span>}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(plan.id)}
                  disabled={
                    isLoading || (plan.is_active && activePlanCount <= 1)
                  }
                  title={
                    plan.is_active && activePlanCount <= 1
                      ? "Impossible de désactiver la dernière offre active"
                      : plan.is_active
                        ? "Désactiver"
                        : "Activer"
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 disabled:opacity-30 ${
                    plan.is_active ? "bg-brand-teal" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      plan.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditForm(plan)}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-brand-teal transition-colors disabled:opacity-50"
                  title="Modifier"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>

                {/* Delete */}
                {confirmDeleteId === plan.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={isLoading}
                      className="px-2 py-1 text-xs font-body font-semibold text-white bg-destructive rounded hover:opacity-90 disabled:opacity-50"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-xs font-body text-gray-500 hover:text-brand-black"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(plan.id)}
                    disabled={
                      isLoading || (plan.is_active && activePlanCount <= 1)
                    }
                    className="p-2 text-gray-400 hover:text-destructive transition-colors disabled:opacity-30"
                    title={
                      plan.is_active && activePlanCount <= 1
                        ? "Impossible de supprimer la dernière offre active"
                        : "Supprimer"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
