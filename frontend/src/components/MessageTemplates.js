import React from 'react';
import { Calendar, HelpCircle, FileText, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

const MESSAGE_TEMPLATES = [
  {
    id: 'visit',
    icon: Calendar,
    label: 'Planifier une visite',
    message: `Bonjour,

Je suis intéressé(e) par votre local et je souhaiterais planifier une visite.

Pourriez-vous me proposer vos disponibilités pour une visite prochainement ?

Cordialement`
  },
  {
    id: 'question',
    icon: HelpCircle,
    label: 'Question sur les équipements',
    message: `Bonjour,

J'aurais quelques questions concernant votre local :

- Quels équipements médicaux sont déjà présents ?
- Le local est-il conforme aux normes PMR ?
- Y a-t-il des places de parking disponibles ?

Merci d'avance pour vos réponses.

Cordialement`
  },
  {
    id: 'apply',
    icon: FileText,
    label: 'Je souhaite postuler',
    message: `Bonjour,

Je suis très intéressé(e) par votre local et je souhaite vous soumettre ma candidature.

Je suis actuellement en recherche d'un espace pour exercer mon activité et votre local correspond parfaitement à mes critères.

Puis-je vous transmettre mon dossier de candidature ?

Cordialement`
  },
  {
    id: 'info',
    icon: MessageCircle,
    label: 'Demande d\'informations',
    message: `Bonjour,

Je viens de découvrir votre annonce et elle m'intéresse beaucoup.

Pourriez-vous me donner plus d'informations sur :
- Les conditions du bail (durée, dépôt de garantie)
- Les charges mensuelles estimées
- La disponibilité du local

Merci d'avance.

Cordialement`
  }
];

export function MessageTemplates({ onSelectTemplate, listingTitle }) {
  const handleSelect = (template) => {
    // Ajouter le contexte de l'annonce au message
    const contextualMessage = `[Concernant : ${listingTitle}]\n\n${template.message}`;
    onSelectTemplate(contextualMessage);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium" style={{ color: '#5A6478' }}>
        Messages rapides :
      </p>
      <div className="grid grid-cols-2 gap-2">
        {MESSAGE_TEMPLATES.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            onClick={() => handleSelect(template)}
            className="flex items-center gap-2 p-3 h-auto text-left justify-start rounded-xl border transition-all hover:scale-[1.02]"
            style={{ 
              borderColor: '#E8E0D5',
              backgroundColor: '#FAF7F2'
            }}
          >
            <template.icon className="h-4 w-4 flex-shrink-0" style={{ color: '#1A1F3D' }} />
            <span className="text-sm" style={{ color: '#1A1F3D' }}>{template.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export { MESSAGE_TEMPLATES };
