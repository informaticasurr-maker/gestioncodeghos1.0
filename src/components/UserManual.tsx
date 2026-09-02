import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  PlusCircle,
  QrCode,
  Users,
  Wrench,
  ReceiptText,
  BarChart3,
  HardDrive,
  Cloud,
  CheckCircle2,
  FileText,
  Printer,
  Smartphone,
  Search,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UserManual: React.FC = () => {
  const { setActiveTab, setIsGoogleDriveOpen, setIsBackupModalOpen, setIsDonateOpen } = useApp();
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'intro', title: '1. Introducción y Vista General', icon: Sparkles },
    { id: 'ordenes', title: '2. Recepción y Creación de Órdenes', icon: PlusCircle },
    { id: 'estados', title: '3. Flujo de Estados y Presupuestos', icon: ClipboardList },
    { id: 'pdf_qr', title: '4. Comprobantes PDF, Ticket y Pagos QR', icon: QrCode },
    { id: 'clientes', title: '5. Directorio de Clientes y Contactos', icon: Users },
    { id: 'servicios', title: '6. Catálogo de Servicios y Precios', icon: Wrench },
    { id: 'facturacion', title: '7. Facturación, Señas y Balances', icon: ReceiptText },
    { id: 'basedatos', title: '8. Base de Datos y Backups (Drive/Local)', icon: HardDrive },
    { id: 'atajos', title: '9. Atajos y Consejos de Taller', icon: Zap },
  ];

  const filteredSections = sections.filter((s) => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (s.title || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">Manual de Uso del Sistema de Gestión</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Guía explicativa paso a paso para administrar reparaciones, presupuestos, clientes, medios de pago con código QR, comprobantes impresos y copias de seguridad en Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('ordenes')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            Ir a Órdenes
          </button>
          <button
            onClick={() => setActiveTab('acerca_de')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            Acerca de
          </button>
        </div>
      </div>

      {/* Main Layout: Navigation + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Table of Contents */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                data-search-input="true"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el manual..."
                className="search-input-fluor w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <nav className="space-y-1">
              {filteredSections.map((item) => {
                const Icon = item.icon;
                const isSelected = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Help Box */}
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-950 font-bold">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>¿Consultas o Soporte?</span>
            </div>
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              Puedes enviar tus observaciones o solicitar mejoras directamente al correo oficial:
            </p>
            <a
              href="mailto:informaticasurr@gmail.com"
              className="font-mono font-bold text-[11px] text-indigo-700 hover:underline block break-all"
            >
              informaticasurr@gmail.com
            </a>
          </div>
        </div>

        {/* Right Article Content */}
        <div className="lg:col-span-3 bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-sm space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
          {/* 1. INTRO */}
          {activeSection === 'intro' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>1. Introducción y Arquitectura del Sistema</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bienvenido al sistema integral para gestión de talleres de electrónica, informática y telefonía móvil.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  Este sistema está diseñado específicamente para resolver el flujo diario de trabajo en talleres técnicos: desde el momento en que un cliente deja un equipo, pasando por el diagnóstico y aprobación de presupuestos, hasta la entrega final con garantía escrita y emisión de comprobantes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block mb-1">⚡ 100% Funcional y Rápido</strong>
                    <p className="text-xs text-slate-600">
                      Diseñado para responder al instante sin esperas lentas de servidores externos.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block mb-1">🔒 Privacidad y Control</strong>
                    <p className="text-xs text-slate-600">
                      Tus datos se guardan de forma local en tu dispositivo con respaldo directo en tu propia cuenta de Google Drive.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block mb-1">🖨️ Documentos Profesionales</strong>
                    <p className="text-xs text-slate-600">
                      Genera comprobantes A4, tickets térmicos de 80mm con código QR de cobro y notificaciones automáticas por WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* 2. ORDENES */}
          {activeSection === 'ordenes' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  <span>2. Recepción y Creación de Órdenes de Trabajo</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cómo registrar correctamente el ingreso de un dispositivo en el taller.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  Para registrar una nueva orden de reparación, haz clic en la pestaña <strong>"Nueva Orden"</strong> del menú lateral.
                </p>

                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <li>
                    <strong>Seleccionar o Crear Cliente:</strong> Puedes buscar un cliente existente en el selector o ingresar el nombre, teléfono (para WhatsApp), DNI/CUIT y dirección de un nuevo cliente.
                  </li>
                  <li>
                    <strong>Datos del Dispositivo:</strong> Selecciona el tipo de equipo (Smartphone, Notebook, PC, Tablet, Consola, etc.), marca, modelo y número de serie o IMEI (fundamental para la trazabilidad y reclamos de garantía).
                  </li>
                  <li>
                    <strong>Seguridad y Desbloqueo:</strong> Indica si el equipo posee PIN, contraseña o patrón de desbloqueo para que el técnico pueda probar las funciones durante la reparación.
                  </li>
                  <li>
                    <strong>Accesorios Recibidos:</strong> Marca los accesorios que deja el cliente (cargador, funda, tarjeta SIM, caja, mouse, etc.) para evitar extravíos.
                  </li>
                  <li>
                    <strong>Falla Reportada y Estado Físico:</strong> Detalla el síntoma que manifiesta el cliente y deja constancia de daños previos (pantalla rayada, golpes en carcasa, falta de tornillos).
                  </li>
                  <li>
                    <strong>Fotografías de Recepción:</strong> Puedes tomar fotos con la cámara o subir imágenes del estado en que ingresó el equipo.
                  </li>
                  <li>
                    <strong>Servicios y Seña Inicial:</strong> Agrega los servicios iniciales requeridos o diagnósticos y registra si el cliente dejó una seña monetaria en efectivo o transferencia.
                  </li>
                </ol>

                <div className="bg-indigo-950 text-indigo-100 p-4 rounded-xl border border-indigo-800 space-y-2 mt-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Asistente de Carga por Voz con Inteligencia Artificial (Gemini AI)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    En la parte superior de la pantalla de "Nueva Orden", puedes presionar <strong>"Grabar Voz"</strong> y hablar naturalmente describiendo la reparación. Por ejemplo:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-indigo-300 border border-slate-800">
                    "Cliente Martín Fierro, teléfono 1155443322, Samsung S21 Plus pantalla astillada sin imagen, presupuesto 45000 con 90 días de garantía"
                  </div>
                  <p className="text-xs text-slate-300">
                    Al hacer clic en <strong>"Analizar y Rellenar Formulario"</strong>, la IA de Google Gemini extraerá y colocará automáticamente el cliente, teléfono, equipo, síntoma de falla, presupuesto y días de garantía directamente en los campos del formulario sin necesidad de teclear.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* 3. ESTADOS */}
          {activeSection === 'estados' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  <span>3. Flujo de Estados y Aprobación de Presupuestos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controla la etapa técnica de cada equipo en tiempo real.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  Cada orden atraviesa distintas etapas identificadas con colores para una rápida organización visual en el taller:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-800">📥 Recibido / En Revisión:</strong> Equipo ingresado en espera de diagnóstico técnico.
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <strong className="text-amber-800">⏳ Presupuesto Pendiente:</strong> Se determinó la falla y costo, esperando confirmación del cliente.
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <strong className="text-blue-800">⚙️ En Reparación:</strong> Presupuesto aceptado, trabajo en proceso en el laboratorio.
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <strong className="text-purple-800">📦 Esperando Repuesto:</strong> Pendiente de llegada de repuestos o piezas solicitadas a proveedores.
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <strong className="text-emerald-800">✅ Listo para Entrega:</strong> Trabajo finalizado y probado, listo para que el cliente lo retire.
                  </div>
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg">
                    <strong className="text-slate-700">🎉 Entregado:</strong> Equipo retirado por el cliente, saldo cancelado y garantía activada.
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* 4. PDF Y QR */}
          {activeSection === 'pdf_qr' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span>4. Comprobantes PDF, Ticket y Código QR de Cobro</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cómo emitir comprobantes y configurar tu QR y Alias de cobro para clientes.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  El sistema permite imprimir y enviar comprobantes en múltiples formatos con un solo clic:
                </p>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Comprobante A4:</strong> Incluye membrete completo con logo de tu taller, datos fiscales, tabla de servicios, estado de recepción, cláusulas de garantía de 90 días y bloque de pago con código QR y Alias.
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                    <Printer className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Ticket Térmico (80mm / 58mm):</strong> Formato compacto diseñado para impresoras de comandas y tickets de mostrador, incluyendo el código QR de pago centrado para escaneo directo.
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                    <Smartphone className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Notificación por WhatsApp:</strong> Envía un mensaje estructurado con el N° de orden, estado del trabajo, saldo pendiente, dirección del taller y tu Alias para transferencias.
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1.5 text-emerald-950">
                  <strong className="block text-emerald-900">💡 ¿Cómo configurar tu propio QR y Alias?</strong>
                  <p>
                    Ve a <strong>Ajustes & Empresa &gt; Sección 3 (Medios de Pago, Alias Bancario & Código QR)</strong>. Puedes subir la captura del código QR de tu cuenta de <strong>Mercado Pago</strong> o tu banco, escribir tu <strong>Alias</strong> (ej: <code>techfix.taller.mp</code>) y CBU. Estos datos aparecerán en los comprobantes de tus clientes.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* 5. CLIENTES */}
          {activeSection === 'clientes' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>5. Directorio de Clientes y Contactos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administración de tu cartera de clientes, historial de visitas y contacto rápido.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  En la sección <strong>"Clientes / Contactos"</strong> puedes:
                </p>
                <ul className="list-disc list-inside space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <li>Ver la lista completa de clientes registrados con búsqueda instantánea por nombre, teléfono, DNI o ciudad.</li>
                  <li>Crear nuevos contactos o <strong>editar datos existentes</strong> (teléfono, domicilio, correo, notas internas).</li>
                  <li>Abrir conversación de WhatsApp con un clic o llamar directamente por teléfono.</li>
                  <li>Consultar el <strong>historial completo de reparaciones</strong> y órdenes asociadas a cada cliente.</li>
                  <li>Exportar tu agenda de clientes a formato Excel / CSV / JSON para respaldos.</li>
                </ul>
              </div>
            </article>
          )}

          {/* 6. SERVICIOS */}
          {activeSection === 'servicios' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <span>6. Catálogo de Servicios y Listas de Precios</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estandariza tus tarifas de mano de obra y servicios frecuentes.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  El catálogo de servicios te permite cargar trabajos frecuentes (como cambio de módulo, cambio de pin de carga, mantenimiento térmico, reinstalación de sistema operativo, reballing, etc.) con sus precios sugeridos y tiempos estimados en minutos.
                </p>
                <p className="text-xs text-slate-600">
                  Al crear o editar una orden, puedes agregar estos servicios con un solo clic sin necesidad de volver a tipear los importes.
                </p>
              </div>
            </article>
          )}

          {/* 7. FACTURACIÓN */}
          {activeSection === 'facturacion' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-indigo-600" />
                  <span>7. Facturación, Señas y Balances</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control financiero de pagos parciales, saldos y arqueos de caja.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  El módulo de <strong>Facturación & Pagos</strong> consolida:
                </p>
                <ul className="list-disc list-inside space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <li>Total facturado, total cobrado y saldo pendiente por cobrar a clientes.</li>
                  <li>Registro de pagos individuales indicando método (Efectivo, Transferencia, Tarjeta, Mercado Pago).</li>
                  <li>Historial de movimientos y resumen mensual para control de ingresos del taller.</li>
                </ul>
              </div>
            </article>
          )}

          {/* 8. BASE DE DATOS Y DRIVE */}
          {activeSection === 'basedatos' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-600" />
                  <span>8. Base de Datos y Copias de Seguridad (Google Drive / Local)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explorador unificado de datos y respaldos automáticos en la nube.
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  En la nueva pestaña <strong>"Base de Datos"</strong> puedes ver todas las tablas consolidadas de la empresa (Clientes, Órdenes, Servicios y Estadísticas) con herramientas de respaldo:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                    <strong className="text-indigo-950 flex items-center gap-1.5 mb-1">
                      <Cloud className="w-4 h-4 text-indigo-600" />
                      <span>Respaldo en Google Drive</span>
                    </strong>
                    <p className="text-slate-600">
                      Sincroniza tus órdenes y clientes directamente en tu carpeta de Google Drive en formato <code>.json</code> seguro con fecha y hora.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 flex items-center gap-1.5 mb-1">
                      <HardDrive className="w-4 h-4 text-slate-700" />
                      <span>Respaldo Local (.JSON)</span>
                    </strong>
                    <p className="text-slate-600">
                      Descarga una copia completa a tu computadora o teléfono en cualquier momento para restaurar si cambias de equipo.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* 9. ATAJOS */}
          {activeSection === 'atajos' && (
            <article className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span>9. Atajos y Consejos de Productividad en el Taller</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buenas prácticas para optimizar el tiempo de atención.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">🔍 Búsqueda Rápida Global:</strong>
                    <p className="text-slate-600">
                      Usa la barra de búsqueda superior para buscar instantáneamente por N° de orden (ej: <code>ORD-001</code>), DNI o IMEI.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">📱 WhatsApp Automático:</strong>
                    <p className="text-slate-600">
                      Al cambiar de estado o finalizar un trabajo, presiona el ícono verde de WhatsApp para enviar el mensaje listo al cliente.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">📸 Fotos de Recepción:</strong>
                    <p className="text-slate-600">
                      Tomar foto de la pantalla o detalles cosméticos al ingresar el equipo protege a tu taller ante reclamos posteriores.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">💾 Copia Semanal:</strong>
                    <p className="text-slate-600">
                      Realiza una copia de seguridad en Google Drive o descarga el archivo <code>.json</code> al final de cada semana laboral.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};
