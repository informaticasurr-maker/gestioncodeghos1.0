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
  Smartphone,
  Laptop,
  CheckCircle2,
  HardDrive,
  Cloud,
  Mic,
  QrCode,
  Users,
  Play,
  Download,
  Share2,
  BookOpen,
  ClipboardList,
  PlusCircle,
  Wrench,
  ReceiptText,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  Zap,
  Printer,
  ArrowRight,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutSection: React.FC = () => {
  const { setIsDonateOpen, companySettings, setActiveTab } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'me_sirve' | 'sugerencia' | 'consulta' | 'felicitacion'>('me_sirve');
  const [feedbackText, setFeedbackText] = useState('');
  const [userName, setUserName] = useState('');
  const [userWorkshop, setUserWorkshop] = useState(companySettings.name || '');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Estados interactivos para el Manual de Uso Detallado
  const [manualSearch, setManualSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'inicio': true,
    'ordenes': true,
    'estados': false,
    'whatsapp': false,
    'inventario': false,
    'comprobantes': false,
    'caja': false,
    'backups': false,
    'consejos': false,
  });

  const projectEmail = 'informaticasurr@gmail.com';

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

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    manualChapters.forEach((ch) => {
      allExp[ch.id] = true;
    });
    setExpandedChapters(allExp);
  };

  const collapseAll = () => {
    setExpandedChapters({});
  };

  // Capítulos del Manual de Uso Detallado
  const manualChapters = [
    {
      id: 'inicio',
      category: 'configuracion',
      number: '1',
      title: 'Puesta en Marcha e Instalación PWA (Tu Taller en Marcha)',
      badge: 'Configuración & Acceso',
      icon: Building2,
      color: 'text-sky-400',
      borderColor: 'border-sky-500/30',
      targetTab: 'configuracion',
      targetLabel: 'Ir a Configuración del Taller',
      summary: 'Personaliza la identidad visual de tu taller e instala la aplicación como programa nativo en tu computadora o celular.',
      steps: [
        {
          title: 'Configura la Identidad de tu Taller',
          desc: 'Dirígete a la pestaña "Configuración". Ingresa el Nombre comercial de tu taller, Teléfono de WhatsApp, Dirección física, CUIT / RUT / RFC, logotipo institucional y redes sociales. Estos datos se imprimirán automáticamente en todos los comprobantes y presupuestos.'
        },
        {
          title: 'Instalación como Aplicación Nativa (PWA)',
          desc: 'En Google Chrome o Microsoft Edge, haz clic en el ícono de instalación (en la barra de direcciones o en el menú de opciones -> "Instalar ORDEN DE TRABAJO"). La app se abrirá en su propia ventana sin barras de navegador, con acceso directo en tu escritorio. En Android/iOS selecciona "Agregar a la pantalla principal".'
        },
        {
          title: 'Moneda y Parámetros Comerciales',
          desc: 'Ajusta tu moneda local ($ ARS, USD, etc.), alícuotas de IVA si emites comprobantes fiscales, y define el texto legal de garantía para proteger tu trabajo técnico.'
        }
      ],
      proTip: 'Al instalarla como PWA, la aplicación funciona de manera ultrarrápida y se puede usar en cualquier momento incluso si se cae internet en el taller.'
    },
    {
      id: 'ordenes',
      category: 'operacion',
      number: '2',
      title: 'Recepción y Creación de Órdenes de Trabajo (OT)',
      badge: 'Operación Principal',
      icon: PlusCircle,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      targetTab: 'nueva_orden',
      targetLabel: 'Crear Nueva Orden de Trabajo',
      summary: 'Registra el ingreso de cualquier equipo (celulares, notebooks, PC, consolas, TV) con diagnóstico, seña y patrón de desbloqueo.',
      steps: [
        {
          title: 'Paso 1: Identificación del Cliente',
          desc: 'Escribe el nombre o teléfono del cliente. Si ya visitó tu taller anteriormente, el sistema autocompletará sus datos en 1 segundo. Si es nuevo, pulsa "Registrar Cliente" para guardarlo en tu directorio.'
        },
        {
          title: 'Paso 2: Datos Técnicos del Equipo',
          desc: 'Selecciona la categoría (Móvil, Notebook, PC de Escritorio, Tablet, etc.), marca y modelo. Ingresa el Número de Serie o IMEI: esto es fundamental para el seguimiento y evitar confusiones en garantías.'
        },
        {
          title: 'Paso 3: Seguridad y Accesorios Recibidos',
          desc: 'Registra la clave numérica o PIN, o dibuja el patrón de desbloqueo táctil en la cuadrícula 3x3. Marca los accesorios recibidos: cargador original, funda, tarjeta SD, cable o si se recibe sin accesorios.'
        },
        {
          title: 'Paso 4: Falla Declarada y Diagnóstico Inicial',
          desc: 'Describe el síntoma manifestado por el cliente y el estado físico al recibirlo (por ejemplo: "No enciende tras golpe, tapa trasera astillada, tornillos faltantes"). Esto protege legalmente al taller.'
        },
        {
          title: 'Paso 5: Presupuesto Estimado y Seña',
          desc: 'Ingresa el costo estimado y la seña o adelanto entregado por el cliente en efectivo o transferencia. La seña se acreditará automáticamente en la Caja Diaria del taller.'
        },
        {
          title: '🎙️ Tito IA (Dictado por Voz Manos Libres)',
          desc: 'Si estás con las manos ocupadas en el banco de trabajo con el soldador o multímetro, haz clic en el micrófono de "Tito IA" y dicta la orden de forma natural: "Cargá orden para Samsung A54 de Juan Gómez con cambio de módulo y seña de 20.000". La IA estructurará todos los campos automáticamente.'
        }
      ],
      proTip: 'Anota siempre el IMEI o Número de Serie antes de desarmar el equipo. Te evitará reclamos infundados de clientes y asegura que la garantía solo cubra la pieza reemplazada.'
    },
    {
      id: 'estados',
      category: 'operacion',
      number: '3',
      title: 'Tablero de Control y Flujo de Reparaciones',
      badge: 'Gestión de Taller',
      icon: ClipboardList,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      targetTab: 'ordenes',
      targetLabel: 'Ver Tablero de Órdenes',
      summary: 'Supervisa el estado de cada reparación en tiempo real y gestiona prioridades técnicas de manera visual.',
      steps: [
        {
          title: 'El Ciclo de Vida de una Orden Técnica',
          desc: '1. Presupuesto Pendiente (revisión preliminar) -> 2. Aprobado (cliente acepta costo) -> 3. En Reparación (técnico trabajando en mesa) -> 4. Esperando Repuesto (pieza en camino de distribuidor) -> 5. Listo para Retiro (pruebas de calidad superadas) -> 6. Entregado (orden cobrada y entregada).'
        },
        {
          title: 'Cambio de Estado en 1 Clic',
          desc: 'Desde la tarjeta de la orden o desde el modal de edición, haz clic en el selector de estado para avanzar la reparación. Al cambiar a "Listo para Retirar", puedes disparar la notificación por WhatsApp de inmediato.'
        },
        {
          title: 'Buscador Neón de Alto Contraste',
          desc: 'Usa la barra de búsqueda superior con letras en amarillo flúor (#FACC15) para encontrar cualquier orden por número (ej: OT-1002), nombre del cliente, marca del dispositivo o número de serie sin demoras.'
        },
        {
          title: 'Notas Técnicas Internas',
          desc: 'Registra anotaciones técnicas internas que solo verán los técnicos (mediciones de componentes, voltajes de bobinas, consumo en fuente o pruebas de estrés térmico).'
        }
      ],
      proTip: 'Filtra las órdenes con el botón "Esperando Repuesto" todos los lunes para verificar qué piezas debes pedir a tus distribuidores.'
    },
    {
      id: 'whatsapp',
      category: 'comunicacion',
      number: '4',
      title: 'Comunicación con Clientes por WhatsApp en 1 Clic',
      badge: 'Atención al Cliente',
      icon: MessageCircle,
      color: 'text-teal-400',
      borderColor: 'border-teal-500/30',
      targetTab: 'ordenes',
      targetLabel: 'Probar Mensajería en Órdenes',
      summary: 'Envía avisos de ingreso, presupuestos y notificaciones de retiro con saldo pendiente por WhatsApp sin necesidad de agendar el número.',
      steps: [
        {
          title: 'Envío Directo sin Agendar el Número',
          desc: 'Haz clic en el botón verde de WhatsApp ubicado en la tarjeta de cualquier orden. La aplicación abrirá automáticamente WhatsApp Web o la app de WhatsApp en tu celular con el número del cliente y el mensaje formateado.'
        },
        {
          title: 'Plantillas Predefinidas y Profesionales',
          desc: 'La app incluye plantillas inteligentes para cada fase: "Aviso de Ingreso con comprobante", "Presupuesto Listo para Aprobación" y "Equipo Listo para Retiro con saldo y datos bancarios".'
        },
        {
          title: 'Variables Dinámicas Automáticas',
          desc: 'Las variables como {cliente}, {orden}, {equipo}, {monto}, {saldo} y {taller} se reemplazan automáticamente por los valores reales de la orden, garantizando un trato personalizado y profesional.'
        }
      ],
      proTip: 'Enviar el WhatsApp de ingreso ni bien recibes el equipo genera una gran sensación de confianza y reduce drásticamente las consultas telefónicas.'
    },
    {
      id: 'inventario',
      category: 'stock',
      number: '5',
      title: 'Inventario, Repuestos e Importación Inteligente Multiformato',
      badge: 'Stock & Precios',
      icon: Package,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      targetTab: 'inventario',
      targetLabel: 'Abrir Módulo de Inventario',
      summary: 'Administra repuestos y stock de insumos. Sube listas en Excel, PDF, CSV o texto plano con autocalculador de precios (+40% margen).',
      steps: [
        {
          title: 'Control de Stock y Alertas de Mínimo',
          desc: 'Carga tus pantallas, baterías, pines de carga, vidrios, flex y herramientas organizados por rubros técnicos. El sistema te alertará en color rojo cuando el stock de un repuesto sea crítico (1 unidad o menos).'
        },
        {
          title: 'Cálculo Automático de Precios y Margen Comercial',
          desc: 'Ingresa el precio de costo del repuesto y el sistema calcula de forma instantánea el precio de venta sugerido aplicando el margen comercial estándar (+40%), permitiéndote también personalizar el margen según la dificultad de instalación.'
        },
        {
          title: '📥 Nuevo Importador Inteligente Multiformato',
          desc: 'Haz clic en "Subir y Sincronizar". Puedes arrastrar archivos en 8 formatos: .xlsx, .xls, .pdf, .csv, .txt, .ods, .json y .xml. El motor inteligente analiza el archivo y detecta automáticamente las columnas de Rubro, Marca, Descripción, Cantidad y Precio.'
        },
        {
          title: '✨ Pestaña Pegar Texto con IA',
          desc: '¿Tu distribuidor te mandó una lista de precios por WhatsApp o email? Pégala directamente en la pestaña "Pegar Texto / Lista con IA" y la aplicación extraerá cada repuesto, su precio y modelo de forma automática.'
        },
        {
          title: '📄 Plantilla Oficial en Excel',
          desc: 'Dentro del modal de importación, pulsa el botón verde "Descargar Plantilla Excel" para obtener una hoja de cálculo lista para rellenar con tus artículos.'
        },
        {
          title: 'Modo Sincronización Inteligente (Smart Merge)',
          desc: 'Elige si deseas "Fusión Inteligente" (actualiza el stock y los nuevos precios de repuestos ya existentes sin duplicarlos) o "Añadir Todos como Nuevos".'
        }
      ],
      proTip: 'Descarga la plantilla de Excel de la app y envíasela a tu proveedor para que te la devuelva con sus precios actualizados. La importación tardará menos de 3 segundos.'
    },
    {
      id: 'comprobantes',
      category: 'impresion',
      number: '6',
      title: 'Comprobantes Profesionales, Tickets Térmicos y Códigos QR',
      badge: 'Impresión & Consulta',
      icon: Printer,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      targetTab: 'ordenes',
      targetLabel: 'Ver Comprobantes en Órdenes',
      summary: 'Emite comprobantes en formato A4 formal o Ticket Térmico POS (58mm y 80mm) con QR de seguimiento en línea.',
      steps: [
        {
          title: 'Comprobante A4 con Membrete y Garantía',
          desc: 'Genera un documento PDF impecable con el logotipo de tu taller, datos fiscales, descripción de la falla, diagnóstico, repuestos utilizados, costo total, seña y la cláusula legal de garantía firmable.'
        },
        {
          title: 'Ticket Térmico para Impresoras POS (58mm y 80mm)',
          desc: 'Optimizado para impresoras térmicas de tickets y etiquetas. Imprime dos copias: una para entregar como recibo al cliente y otra para pegar en el chasis del equipo para rotularlo en el estante de trabajo.'
        },
        {
          title: 'Código QR de Seguimiento en Vivo',
          desc: 'Cada comprobante incluye un código QR único. El cliente puede escanearlo con la cámara de su teléfono para consultar el estado actualizado de su equipo en https://gestiontallerpm.web.app/ sin llamar al taller.'
        }
      ],
      proTip: 'Imprimir un ticket térmico y adherirlo con cinta de pintor al equipo evita confusiones cuando tienes 5 modelos iguales de celulares desarmados en el laboratorio.'
    },
    {
      id: 'caja',
      category: 'finanzas',
      number: '7',
      title: 'Caja Diaria, Facturación y Medios de Pago',
      badge: 'Finanzas del Taller',
      icon: ReceiptText,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      targetTab: 'caja',
      targetLabel: 'Abrir Caja Diaria',
      summary: 'Controla el flujo de dinero de tu taller: ingresos por reparaciones, cobro de señas, ventas de mostrador y cobros con QR interoperable.',
      steps: [
        {
          title: 'Apertura y Cierre de Caja Diaria',
          desc: 'Comienza la jornada ingresando el saldo inicial en caja ("fondo de cambio"). Al finalizar el día, realiza el arqueo comparando el efectivo real con las transacciones registradas en el sistema.'
        },
        {
          title: 'Registro Automático de Señas y Cobros',
          desc: 'Al recibir una seña en una orden, se suma automáticamente al saldo de caja en la categoría correspondiente. Cuando el cliente retira y abona el saldo restante, la orden se liquida y el cobro se asienta.'
        },
        {
          title: 'Cobros con QR Interoperable y Alias Bancario',
          desc: 'Configura tu Alias o CBU (Mercado Pago, MODO, Cuenta DNI, bancos). La app puede mostrar en pantalla el código QR de cobro para que el cliente lo escanee y pague en el acto.'
        },
        {
          title: 'Registro de Egresos y Gastos de Taller',
          desc: 'Asienta gastos de repuestos comprados en el día, fletes, almuerzos o servicios técnicos tercerizados para conocer la ganancia neta real de tu negocio.'
        }
      ],
      proTip: 'Revisar el balance semanal te permite identificar qué tipos de reparaciones (ej: cambios de módulo vs reparaciones de placa) te dejan el mayor margen de rentabilidad.'
    },
    {
      id: 'backups',
      category: 'seguridad',
      number: '8',
      title: 'Copias de Seguridad, Google Drive y Base de Datos',
      badge: 'Seguridad de Datos',
      icon: HardDrive,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      targetTab: 'basedatos',
      targetLabel: 'Ir a Base de Datos y Backups',
      summary: 'Arquitectura Offline First con almacenamiento local seguro en IndexedDB y respaldo en la nube con Google Drive y exportación JSON.',
      steps: [
        {
          title: 'Tecnología Offline First (IndexedDB)',
          desc: 'Toda tu información se guarda en la base de datos local de tu navegador (IndexedDB). No depende de internet para funcionar, es ultrarrápida y no se borra al cerrar la pestaña o apagar la máquina.'
        },
        {
          title: 'Sincronización con Google Drive',
          desc: 'Vincula tu cuenta de Google con un clic para guardar copias de seguridad automáticas en tu propio almacenamiento en la nube de Google Drive, totalmente privado y bajo tu control.'
        },
        {
          title: 'Descarga de Respaldo Manual (.JSON)',
          desc: 'En la sección Base de Datos, pulsa "Descargar Copia de Seguridad". Obtendrás un archivo .json con todas tus órdenes, clientes y repuestos. Puedes guardarlo en un pendrive o enviártelo por email.'
        },
        {
          title: 'Restauración en Nueva Máquina',
          desc: '¿Cambiaste de computadora en el taller? Abre la app en la nueva PC, ve a Base de Datos -> "Restaurar Copia" y sube el archivo .json. Todo tu taller estará listo en 2 segundos.'
        }
      ],
      proTip: 'Descarga una copia de seguridad en archivo .json al final de cada viernes y guárdala en una memoria USB externa como buena práctica de seguridad.'
    },
    {
      id: 'consejos',
      category: 'consejos',
      number: '9',
      title: 'Consejos Pro y Buenas Prácticas para el Técnico',
      badge: 'Tips Profesionales',
      icon: Zap,
      color: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      targetTab: 'ordenes',
      targetLabel: 'Ir al Tablero de Taller',
      summary: 'Metodologías comprobadas de atención en mostrador, checklist previo a entrega y protección legal ante reclamos.',
      steps: [
        {
          title: 'Fotos Previas al Desarme',
          desc: 'Toma 1 o 2 fotos del equipo encendido o con sus rayas visibles en mostrador. Te evitará discusiones con clientes que aseguran que el vidrio no estaba rayado antes de entrar.'
        },
        {
          title: 'Checklist Obligatorio de Salida',
          desc: 'Antes de marcar "Listo para Retirar", prueba siempre: 1. Cámara frontal y trasera, 2. Micrófono y auricular de llamada, 3. Sensor de proximidad en llamada, 4. Carga de batería y 5. Wi-Fi y Bluetooth.'
        },
        {
          title: 'Rotulado con Cinta de Enmascarar',
          desc: 'Usa cinta de papel o etiqueta térmica para colocar el N° de OT en la batería o chasis de la máquina. Evita intercambios accidentales de bandejas SIM o tornillos.'
        },
        {
          title: 'Claridad en Tiempos de Garantía',
          desc: 'Aclara al cliente que la garantía cubre exclusivamente el defecto de la pieza cambiada (por ejemplo 90 días en pantalla), y no cubre roturas físicas, humedad o manipulación de terceros.'
        }
      ],
      proTip: 'Una orden de trabajo bien documentada y firmada es tu mejor escudo legal y la clave para fidelizar clientes recurrentes.'
    }
  ];

  // Filtro de capítulos por texto y categoría
  const filteredChapters = manualChapters.filter((ch) => {
    const matchesCategory = activeCategory === 'todos' || ch.category === activeCategory;
    const query = manualSearch.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuery =
      ch.title.toLowerCase().includes(query) ||
      ch.summary.toLowerCase().includes(query) ||
      ch.badge.toLowerCase().includes(query) ||
      ch.steps.some((s) => s.title.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      
      {/* ========================================================================
          HERO SHOWCASE / LANDING PAGE PRESENTATION
          ======================================================================== */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#090f1d] dark:bg-[#070b14] border border-slate-200 dark:border-[#1a2640] p-6 sm:p-10 text-white overflow-hidden shadow-xl dark:shadow-[0_0_50px_rgba(0,242,254,0.08)]">
        
        {/* Background Ambient Glows (Deep Cyan & Violet) */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/15 dark:bg-[#00f2fe]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/15 dark:bg-[#8b5cf6]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1527] border border-[#1e2947] text-xs font-semibold shadow-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-[#05d59e] animate-pulse"></span>
            <span className="text-[#05d59e] font-bold">100% GRATUITO</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Para la Comunidad Técnica & Electrónica</span>
          </div>

          {/* Main Hero Title with Cyan-Purple Gradient */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              El Software Definitivo para{' '}
              <span className="gradient-title-cyan block sm:inline">
                Talleres de Informática y Electrónica
              </span>
            </h1>
            <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Organiza tu taller, acelera los tiempos de diagnóstico y fideliza a tus clientes con{' '}
              <strong className="text-[#00f2fe] font-bold">ORDEN DE TRABAJO-pm</strong> desarrollado por{' '}
              <strong className="text-indigo-300 font-bold">CODEGHOS</strong>. Se instala directamente desde tu navegador, te registras con Google y listo: ¡ya es tuya!
            </p>
          </div>

          {/* Direct App Launch Link */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="https://gestiontallerpm.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 hover:from-teal-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(5,213,158,0.35)] transition transform hover:-translate-y-0.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Usar App: https://gestiontallerpm.web.app/</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Secondary Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('ordenes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0c1527] border border-[#1e2947] text-slate-200 hover:bg-[#13203c] hover:border-[#00f2fe]/40 transition"
            >
              <Play className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Ver Simulador Interactivo</span>
            </button>

            <button
              onClick={() => setActiveTab('nueva_orden')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0c1527] border border-[#1e2947] text-slate-200 hover:bg-[#13203c] hover:border-[#8b5cf6]/40 transition"
            >
              <Mic className="w-3.5 h-3.5 text-[#8b5cf6]" />
              <span>Asistente de Voz ("Tito IA")</span>
            </button>

            <a
              href="#manual-de-uso"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0c1527] border border-[#1e2947] text-slate-200 hover:bg-[#13203c] hover:border-amber-400/40 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Leer Manual de Uso Detallado ↓</span>
            </a>
          </div>

          {/* Benefit Badges Horizontal Row */}
          <div className="pt-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-4 py-2 rounded-xl bg-[#080e1a]/80 border border-[#1a2640] text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 text-[#05d59e] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Registro con Google en 1 Clic</span>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Instalación directa PWA en navegador</span>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-[#00f2fe] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Gratuito</span>
              </span>
            </div>
          </div>

          {/* Grid of 6 Key Features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
            {[
              { icon: Users, label: 'Clientes Ilimitados', color: 'text-sky-400', border: 'border-sky-500/20' },
              { icon: HardDrive, label: '100% Offline First', color: 'text-emerald-400', border: 'border-emerald-500/20' },
              { icon: Cloud, label: 'Google Drive & Firebase', color: 'text-blue-400', border: 'border-blue-500/20' },
              { icon: Mic, label: 'Comandos por Voz IA', color: 'text-purple-400', border: 'border-purple-500/20' },
              { icon: MessageCircle, label: 'WhatsApp & Email 1-Click', color: 'text-teal-400', border: 'border-teal-500/20' },
              { icon: QrCode, label: 'Cobros QR & Alias', color: 'text-amber-400', border: 'border-amber-500/20' },
            ].map((f, idx) => {
              const IconComponent = f.icon;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl bg-[#0a101f] border ${f.border} flex flex-col items-center justify-center gap-1.5 text-center transition hover:bg-[#0e1628]`}
                >
                  <IconComponent className={`w-5 h-5 ${f.color}`} />
                  <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================
          MANUAL DE USO DETALLADO DE LA APLICACIÓN (GUÍA OPERATIVA DEL TALLER)
          ======================================================================== */}
      <section id="manual-de-uso" className="space-y-6 scroll-mt-6">
        
        {/* Manual Section Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-200 dark:border-[#1a2640] p-6 sm:p-8 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>GUÍA COMPLETA Y MANUAL OFICIAL</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                Manual de Uso Detallado de la Aplicación
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Aprende paso a paso cómo gestionar el flujo completo de tu taller técnico: desde la recepción de equipos y dictado por voz IA, hasta el control de stock con el importador inteligente y la emisión de comprobantes térmicos con QR.
              </p>
            </div>

            {/* Quick Actions (Expand/Collapse All) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition"
              >
                Expandir Todo
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Contraer Todo
              </button>
            </div>
          </div>

          {/* Search Bar inside Manual */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                data-search-input="true"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                placeholder="Buscar en el manual: 'seña', 'importar excel', 'imprimir ticket', 'patrón', 'drive'..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 text-xs shadow-inner"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs w-full sm:w-auto">
              {[
                { id: 'todos', label: 'Todos (9)' },
                { id: 'operacion', label: 'Órdenes & Falla' },
                { id: 'stock', label: 'Inventario & Precios' },
                { id: 'comunicacion', label: 'WhatsApp' },
                { id: 'impresion', label: 'PDF & QR' },
                { id: 'finanzas', label: 'Caja' },
                { id: 'seguridad', label: 'Drive & Backups' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chapters Accordion List */}
        <div className="space-y-4">
          {filteredChapters.map((chapter) => {
            const isExpanded = !!expandedChapters[chapter.id];
            const Icon = chapter.icon;

            return (
              <div
                key={chapter.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-[#0c1322] shadow-sm ${
                  isExpanded
                    ? 'border-indigo-500/40 dark:border-[#00f2fe]/40 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-[#1a2640] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Chapter Header (Click to Expand / Collapse) */}
                <button
                  type="button"
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 text-left transition hover:bg-slate-50/50 dark:hover:bg-[#10192e]/60"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#080e1a] border border-slate-200 dark:border-[#1a2640] shrink-0">
                      <Icon className={`w-5 h-5 ${chapter.color}`} />
                    </span>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#080e1a] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e293b]">
                          Capítulo {chapter.number}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {chapter.badge}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {chapter.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        {chapter.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    <span className="text-xs font-semibold text-slate-400 hidden md:inline">
                      {isExpanded ? 'Ocultar' : 'Ver detalle'}
                    </span>
                    <span className="p-1 rounded-lg bg-slate-100 dark:bg-[#1a2640] text-slate-600 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </button>

                {/* Chapter Body (Expanded Content) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-[#1a2640] bg-slate-50/50 dark:bg-[#080e1a]/50 space-y-5 animate-fade-in text-xs">
                    
                    {/* Summary for mobile if hidden in header */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed sm:hidden">
                      {chapter.summary}
                    </p>

                    {/* Step-by-Step Points */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Instrucciones y Procedimiento Paso a Paso:</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chapter.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3.5 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1a2640] space-y-1.5 shadow-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-[#00f2fe] text-white dark:text-slate-950 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                {step.title}
                              </h5>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                              {step.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pro Tip Box */}
                    {chapter.proTip && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-500/30 flex items-start gap-3">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                            💡 Consejo Pro para el Técnico:
                          </span>
                          <p className="text-amber-800 dark:text-amber-200/90 leading-relaxed">
                            {chapter.proTip}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Direct Action Link to App Tab */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 dark:border-[#1a2640]/80">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ¿Quieres poner en práctica este capítulo en tu taller?
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab(chapter.targetTab as any)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-[#00f2fe] dark:hover:bg-[#38bdf8] text-white dark:text-[#070b14] font-bold text-xs shadow-sm transition transform active:scale-95"
                      >
                        <span>{chapter.targetLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {filteredChapters.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-[#1a2640] space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                No se encontraron temas con el criterio "{manualSearch}"
              </h4>
              <p className="text-xs text-slate-500">
                Intenta buscar términos como "orden", "seña", "excel", "caja", "whatsapp" o "drive".
              </p>
              <button
                type="button"
                onClick={() => {
                  setManualSearch('');
                  setActiveCategory('todos');
                }}
                className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Limpiar Búsqueda
              </button>
            </div>
          )}
        </div>

      </section>

      {/* ========================================================================
          GRID: FORMULARIO DE FEEDBACK + DONACIONES & CONTACTO
          ======================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
        
        {/* Left 2 Cols: Formulario de Feedback & Observaciones */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-[#1a2640] shadow-sm p-5 sm:p-7 space-y-5 transition-colors duration-200">
          
          <div className="border-b border-slate-200 dark:border-[#1a2640] pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-indigo-600 dark:text-[#00f2fe]" />
              <span>¿Te gusta la app? ¿Te sirve? Envíanos tus Observaciones</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tu opinión directa ayuda a planificar nuevas herramientas y mejoras para la comunidad técnica.
            </p>
          </div>

          <form onSubmit={handleSendFeedbackEmail} className="space-y-4 text-xs">
            
            {/* Star Rating */}
            <div className="bg-slate-50 dark:bg-[#080e1a] p-4 rounded-xl border border-slate-200 dark:border-[#1a2640] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">¿Qué tan útil te resulta el sistema?</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Selecciona tu nivel de satisfacción:</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-[#0c1322] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1a2640] shadow-xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-amber-400 focus:outline-none transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-bold text-slate-700 dark:text-amber-400 ml-2 font-mono text-xs">{rating}/5</span>
              </div>
            </div>

            {/* User & Workshop Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Técnico / Usuario:</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej: Martín Técnico"
                  className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00f2fe]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de tu Taller / Negocio:</label>
                <input
                  type="text"
                  value={userWorkshop}
                  onChange={(e) => setUserWorkshop(e.target.value)}
                  placeholder="Ej: TechFix Laboratorio"
                  className="w-full p-2.5 border border-slate-300 dark:border-[#1a2640] rounded-lg bg-white dark:bg-[#080e1a] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00f2fe]"
                />
              </div>
            </div>

            {/* Feedback Category */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo del mensaje:</label>
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
                        ? 'bg-blue-600 dark:bg-[#00f2fe] text-white dark:text-[#070b14] border-blue-600 dark:border-[#00f2fe] font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-[#080e1a] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1a2640] hover:bg-slate-100 dark:hover:bg-[#111b30]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Observations Text Area */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tus observaciones, sugerencias o comentarios para el programador *:
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Cuéntanos qué funciones te gustan más, qué otra función te gustaría que agreguemos, o cualquier detalle que desees compartir..."
                className="w-full p-3 border border-slate-300 dark:border-[#1a2640] rounded-xl bg-white dark:bg-[#080e1a] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00f2fe] leading-relaxed text-xs"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 dark:bg-[#00f2fe] dark:hover:bg-[#38bdf8] text-white dark:text-[#070b14] rounded-xl font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
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
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-lg">
                  ✓ Abriendo cliente de correo...
                </span>
              )}
            </div>

          </form>
        </div>

        {/* Right Col: Mails, Donaciones & Credits */}
        <div className="space-y-4">
          
          {/* Project Contact Card */}
          <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-[#1a2640] shadow-sm p-5 space-y-3 transition-colors duration-200">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 dark:text-[#00f2fe]" />
              <span>Contacto Oficial del Desarrollador</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ¿Deseas reportar un problema, proponer una integración o consultar sobre soporte para tu taller?
            </p>

            <div className="p-3 bg-slate-50 dark:bg-[#080e1a] rounded-xl border border-slate-200 dark:border-[#1a2640] flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-700 dark:text-slate-200 select-all truncate">
                {projectEmail}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1.5 bg-white dark:bg-[#0c1322] hover:bg-slate-100 dark:hover:bg-[#111b30] border border-slate-200 dark:border-[#1a2640] rounded-lg text-slate-600 dark:text-slate-300 transition shrink-0"
                title="Copiar correo"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Donations & Support Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 dark:from-amber-950/40 dark:to-[#0c1322] rounded-2xl border border-amber-300/40 dark:border-amber-500/30 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Heart className="w-5 h-5 fill-amber-400 text-amber-500" />
              <h4 className="font-bold text-sm">Apoyar el Desarrollo Libre</h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Este sistema se mantiene 100% gratuito y libre para técnicos de todo el mundo gracias a donaciones voluntarias.
            </p>

            <button
              onClick={() => setIsDonateOpen(true)}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95"
            >
              <Heart className="w-4 h-4 fill-slate-900" />
              <span>Colaborar con el Proyecto (Alias / PayPal)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
