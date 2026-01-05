'use client'

import { useState } from 'react'

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Suppression de compte
          </h1>
          <p className="text-gray-600">
            Application de préparation aux examens médicaux
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Demande envoyée</h2>
              <p className="text-gray-600 mb-4">
                Votre demande de suppression a été enregistrée. Notre équipe traitera votre demande dans un délai de 7 jours ouvrables.
              </p>
              <p className="text-sm text-gray-500">
                Vous recevrez un email de confirmation à <span className="font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Demande de suppression de compte
              </h2>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Pour des raisons de sécurité, les demandes de suppression sont traitées manuellement par notre équipe. Vous recevrez une confirmation par email une fois votre compte supprimé.
                </p>
              </div>

              {/* Data Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Données qui seront supprimées :</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Votre profil et informations personnelles</li>
                  <li>• Historique de vos sessions de pratique</li>
                  <li>• Questions sauvegardées</li>
                  <li>• Statistiques et progression</li>
                  <li>• Sessions d&apos;appareils connectés</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email du compte <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="votre@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison de la suppression (optionnel)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Dites-nous pourquoi vous souhaitez supprimer votre compte..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full mt-6 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande de suppression'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="mb-2">
            Besoin d&apos;aide ? Contactez-nous à{' '}
            <a href="mailto:support@fmcquiz.com" className="text-blue-600 hover:underline">
              fmc.app.contact@gmail.com
            </a>
          </p>
          <p>
            Délai de traitement : 7 jours ouvrables maximum.
          </p>
        </div>
      </div>
    </div>
  )
}
