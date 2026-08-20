import React, { useState } from 'react';
import {
  Info,
  Heart,
  Mail,
  Send,
  MessageCircle,
  Copy,
  Check,
  Star,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Code2,
  ThumbsUp,
  Award,
  Globe,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutSection: React.FC = () => {
  const { setIsDonateOpen, companySettings } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'me_sirve' | 'sugerencia' | 'consulta' | 'felicitacion'>('me_sirve');
  const [feedbackText, setFeedbackText] = useState('');
  const [userName, setUserName] = useState('');
  const [userWorkshop, setUserWorkshop] = useState(companySettings.name || '');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const projectEmail = 'informaticasurr@gmail.com';
  const developerAlias = 'informaticasurr';
  const developerPaypal = 'paypal.me/ojovirtual';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(projectEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendFeedbackEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      alert('Por favor escribe tus observaciones o sugerencias.');
      return;
    }

    const subject = encodeURIComponent(
      `[Observaciones / Feedback Taller] - ${userWorkshop || 'Usuario de la App'}`
    );
    const body = encodeURIComponent(
      `Hola Programador,\n\nTe envío mis observaciones y comentarios sobre el Sistema de Gestión para Talleres:\n\n` +
      `🏢 Taller / Emprendimiento: ${userWorkshop || 'No especificado'}\n` +
      `👤 Nombre: ${userName || 'Técnico'}\n` +
      `⭐ Calificación de utilidad: ${rating} / 5 estrellas\n` +
      `📌 Tipo de comentario: ${feedbackCategory}\n\n` +
      `💬 Mis observaciones y comentarios:\n${feedbackText}\n\n` +
      `--\nEnviado desde el Sistema de Gestión para Talleres`
    );

    window.open(`mailto:${projectEmail}?subject=${subject}&body=${body}`, '_blank');
    setSentSuccess(true);
  };

  const handleSendFeedbackWhatsapp = () => {
    if (!feedbackText.trim()) {
      alert('Por favor escribe tus observaciones o sugerencias primero.');
      return;
    }

    const text = encodeURIComponent(
      `🛠️ *Observaciones del Sistema de Gestión para Talleres*\n\n` +
      `🏢 *Taller:* ${userWorkshop || 'Taller Técnico'}\n` +
      `👤 *Nombre:* ${userName || 'Técnico'}\n` +
      `⭐ *Calificación:* ${rating}/5 estrellas\n` +
      `💬 *Comentario:* ${feedbackText}`
    );

    window.open(`https://wa.me/5491145892234?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versión 2.5 Pro</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
            Sistema de Gestión para Talleres
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Plataforma profesional diseñada para laboratorios de microelectrónica, reparación de celulares, computadoras, consolas y servicio técnico integral.
          </p>
        </div>
      </div>

      {/* Grid: Feedback Form + Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: "¿Te gusta la app? / ¿Te sirve? / Observaciones" */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
          
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-indigo-600" />
              <span>¿Te gusta la app? ¿Te sirve? Envíanos tus Observaciones</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tu opinión directa ayuda a planificar nuevas herramientas y mejoras para la comunidad técnica.
            </p>
          </div>

          <form onSubmit={handleSendFeedbackEmail} className="space-y-4 text-xs">
            
            {/* Star Rating */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800 block text-xs">¿Qué tan útil te resulta el sistema?</span>
                <span className="text-[11px] text-slate-500">Selecciona tu nivel de satisfacción:</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-bold text-slate-700 ml-2 font-mono text-xs">{rating}/5</span>
              </div>
            </div>

            {/* User & Workshop Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Técnico / Usuario:</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej: Martín Técnico"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de tu Taller / Negocio:</label>
                <input
                  type="text"
                  value={userWorkshop}
                  onChange={(e) => setUserWorkshop(e.target.value)}
                  placeholder="Ej: TechFix Laboratorio"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Feedback Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Motivo del mensaje:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'me_sirve', label: '⭐ Me sirve mucho' },
                  { id: 'sugerencia', label: '💡 Sugerencia / Idea' },
                  { id: 'consulta', label: '❓ Consulta técnica' },
                  { id: 'felicitacion', label: '👏 Felicitaciones' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackCategory(cat.id as any)}
                    className={`py-2 px-2.5 rounded-lg border text-center text-xs font-medium transition ${
                      feedbackCategory === cat.id
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Observations Text Area */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tus observaciones, sugerencias o comentarios para el programador *:
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Cuéntanos qué funciones te gustan más, qué otra función te gustaría que agreguemos, o cualquier detalle que desees compartir..."
                className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed text-xs"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar Observaciones por Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendFeedbackWhatsapp}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
                  title="Enviar por WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              {sentSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                  ✓ Abriendo cliente de correo...
                </span>
              )}
            </div>

          </form>
        </div>

        {/* Right Col: Mails, Donaciones & Credits */}
        <div className="space-y-4">
          
          {/* Project Contact Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Mails Oficiales del Proyecto</span>
            </h4>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Correo Principal del Programador:
              </span>
              <div className="flex items-center justify-between gap-2">
                <a
                  href={`mailto:${projectEmail}`}
                  className="font-mono font-bold text-xs text-indigo-700 hover:underline break-all"
                >
                  {projectEmail}
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition shrink-0"
                  title="Copiar correo"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Atención directa para consultas, soporte de copias de seguridad o solicitudes personalizadas.
            </p>
          </div>

          {/* Donation / Support Banner */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">¿Deseas Apoyar el Proyecto?</h4>
                <span className="text-[11px] text-amber-100">Colaboración voluntaria para el desarrollador</span>
              </div>
            </div>

            <p className="text-xs text-amber-100 leading-relaxed">
              Tu aporte voluntario permite que este sistema siga siendo gratuito, incorporando nuevas actualizaciones y módulos para todos los técnicos.
            </p>

            <div className="bg-black/20 backdrop-blur-xs p-2.5 rounded-xl border border-white/20 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-amber-200 font-medium">Alias MP (Argentina):</span>
                <span className="font-mono font-bold text-white">{developerAlias}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200 font-medium">PayPal Internacional:</span>
                <span className="font-mono font-bold text-white">{developerPaypal}</span>
              </div>
            </div>

            <button
              onClick={() => setIsDonateOpen(true)}
              className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 text-amber-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95"
            >
              <Heart className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>Ver Formas de Donar / Colaborar</span>
            </button>
          </div>

          {/* Software Info & Credits */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 border border-slate-800 text-center text-xs space-y-1.5">
            <p className="font-bold text-slate-100">Sistema Creado por:</p>
            <p className="text-indigo-400 font-bold text-sm">codeghos/sistemas</p>
            <p className="text-[11px] text-slate-400">Todos los derechos reservados • Desarrollado para Talleres</p>
            <a
              href="https://www.codeghos.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-300 hover:text-white underline font-mono block pt-1"
            >
              www.codeghos.com
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
