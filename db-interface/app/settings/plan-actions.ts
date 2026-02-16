'use server';

import { revalidatePath } from 'next/cache';
import {
  createPlan,
  updatePlan,
  togglePlanActive,
  deletePlan,
} from '@/lib/subscription-plans';

// ============================================================================
// Server Actions for Subscription Plans
// ============================================================================

interface ActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

/** Create a new subscription plan */
export async function createPlanAction(formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const durationDays = parseInt(formData.get('duration_days') as string);
  const price = parseInt(formData.get('price') as string);
  const description = (formData.get('description') as string) || null;
  const isFeatured = formData.get('is_featured') === 'true';
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0;

  if (!name || name.trim().length === 0) {
    return { error: 'Le nom est requis' };
  }
  if (isNaN(durationDays) || durationDays <= 0) {
    return { error: 'La durée doit être un nombre positif' };
  }
  if (isNaN(price) || price <= 0) {
    return { error: 'Le prix doit être un nombre positif' };
  }

  try {
    await createPlan({
      name: name.trim(),
      duration_days: durationDays,
      price,
      description,
      is_featured: isFeatured,
      sort_order: sortOrder,
    });

    revalidatePath('/settings');
    revalidatePath('/buy');
    revalidatePath('/api/payments/create-checkout');

    return { success: true, message: 'Offre créée avec succès' };
  } catch (err) {
    console.error('Error creating plan:', err);
    return { error: 'Erreur lors de la création de l\'offre' };
  }
}

/** Update an existing subscription plan */
export async function updatePlanAction(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const durationDays = parseInt(formData.get('duration_days') as string);
  const price = parseInt(formData.get('price') as string);
  const description = (formData.get('description') as string) || null;
  const isFeatured = formData.get('is_featured') === 'true';
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0;

  if (!id) {
    return { error: 'ID de l\'offre manquant' };
  }
  if (!name || name.trim().length === 0) {
    return { error: 'Le nom est requis' };
  }
  if (isNaN(durationDays) || durationDays <= 0) {
    return { error: 'La durée doit être un nombre positif' };
  }
  if (isNaN(price) || price <= 0) {
    return { error: 'Le prix doit être un nombre positif' };
  }

  try {
    await updatePlan({
      id,
      name: name.trim(),
      duration_days: durationDays,
      price,
      description,
      is_featured: isFeatured,
      sort_order: sortOrder,
    });

    revalidatePath('/settings');
    revalidatePath('/buy');
    revalidatePath('/api/payments/create-checkout');

    return { success: true, message: 'Offre mise à jour avec succès' };
  } catch (err) {
    console.error('Error updating plan:', err);
    return { error: 'Erreur lors de la mise à jour de l\'offre' };
  }
}

/** Toggle plan active status */
export async function togglePlanAction(planId: string): Promise<ActionResult> {
  if (!planId) {
    return { error: 'ID de l\'offre manquant' };
  }

  try {
    await togglePlanActive(planId);

    revalidatePath('/settings');
    revalidatePath('/buy');
    revalidatePath('/api/payments/create-checkout');

    return { success: true, message: 'Statut mis à jour' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    if (message.includes('last active plan')) {
      return { error: 'Impossible de désactiver la dernière offre active' };
    }
    console.error('Error toggling plan:', err);
    return { error: 'Erreur lors de la mise à jour du statut' };
  }
}

/** Delete a plan */
export async function deletePlanAction(planId: string): Promise<ActionResult> {
  if (!planId) {
    return { error: 'ID de l\'offre manquant' };
  }

  try {
    await deletePlan(planId);

    revalidatePath('/settings');
    revalidatePath('/buy');
    revalidatePath('/api/payments/create-checkout');

    return { success: true, message: 'Offre supprimée' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    if (message.includes('last active plan')) {
      return { error: 'Impossible de supprimer la dernière offre active' };
    }
    console.error('Error deleting plan:', err);
    return { error: 'Erreur lors de la suppression de l\'offre' };
  }
}
