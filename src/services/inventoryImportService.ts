import * as XLSX from 'xlsx';
import { InventoryItem } from '../types';

export const INVENTORY_CATEGORIES = [
  'Pantallas / Displays',
  'Baterías',
  'Pines y Módulos de Carga',
  'Flex y Cables',
  'Cámaras y Lentes',
  'Chips / CI / Microelectrónica',
  'Memorias / Almacenamiento',
  'Teclados y Touchpads',
  'Insumos / Químicos / Soldadura',
  'Accesorios y Fundas',
  'Otros Repuestos',
] as const;

export type InventoryCategoryType = (typeof INVENTORY_CATEGORIES)[number];

export interface ParsedInventoryItem {
  id?: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  location: string;
  supplier: string;
  compatibleModels: string;
  notes: string;
  isCategoryAutoAssigned?: boolean;
  isPriceAutoCalculated?: boolean;
}

export interface ImportResult {
  items: ParsedInventoryItem[];
  fileType: string;
  fileName: string;
  totalParsed: number;
  autoCategorizedCount: number;
  autoPricedCount: number;
  warnings: string[];
}

/**
 * Normaliza y deduce la categoría basada en palabras clave del nombre, notas y descripción
 */
export function autoDetectCategory(text: string, existingCategory?: string): { category: string; isAutoAssigned: boolean } {
  if (existingCategory && existingCategory.trim()) {
    const trimmed = existingCategory.trim().toLowerCase();
    for (const cat of INVENTORY_CATEGORIES) {
      if (cat.toLowerCase() === trimmed || cat.toLowerCase().includes(trimmed) || trimmed.includes(cat.toLowerCase())) {
        return { category: cat, isAutoAssigned: false };
      }
    }
  }

  const normalized = (text || '').toLowerCase();

  // 1. Pantallas / Displays
  if (
    normalized.includes('pantalla') ||
    normalized.includes('display') ||
    normalized.includes('lcd') ||
    normalized.includes('oled') ||
    normalized.includes('amoled') ||
    normalized.includes('modulo') ||
    normalized.includes('módulo') ||
    normalized.includes('touch') ||
    normalized.includes('táctil') ||
    normalized.includes('tactil') ||
    normalized.includes('vidrio') ||
    normalized.includes('glass')
  ) {
    return { category: 'Pantallas / Displays', isAutoAssigned: true };
  }

  // 2. Baterías
  if (
    normalized.includes('bateria') ||
    normalized.includes('batería') ||
    normalized.includes('battery') ||
    normalized.includes('pila') ||
    normalized.includes('mah') ||
    normalized.includes('acumulador')
  ) {
    return { category: 'Baterías', isAutoAssigned: true };
  }

  // 3. Pines y Módulos de Carga
  if (
    normalized.includes('pin') ||
    normalized.includes('carga') ||
    normalized.includes('puerto') ||
    normalized.includes('conector') ||
    normalized.includes('usb-c') ||
    normalized.includes('type-c') ||
    normalized.includes('lightning') ||
    normalized.includes('micro usb') ||
    normalized.includes('dock') ||
    normalized.includes('subplaca') ||
    normalized.includes('subboard')
  ) {
    return { category: 'Pines y Módulos de Carga', isAutoAssigned: true };
  }

  // 4. Flex y Cables
  if (
    normalized.includes('flex') ||
    normalized.includes('cable') ||
    normalized.includes('flat') ||
    normalized.includes('interconexion') ||
    normalized.includes('fpc') ||
    normalized.includes('coaxial') ||
    normalized.includes('antena')
  ) {
    return { category: 'Flex y Cables', isAutoAssigned: true };
  }

  // 5. Cámaras y Lentes
  if (
    normalized.includes('camara') ||
    normalized.includes('cámara') ||
    normalized.includes('camera') ||
    normalized.includes('lente') ||
    normalized.includes('lens') ||
    normalized.includes('gran angular') ||
    normalized.includes('selfie')
  ) {
    return { category: 'Cámaras y Lentes', isAutoAssigned: true };
  }

  // 6. Chips / CI / Microelectrónica
  if (
    normalized.includes('chip') ||
    normalized.includes(' ic ') ||
    normalized.includes('pmic') ||
    normalized.includes('tristar') ||
    normalized.includes('hydra') ||
    normalized.includes('u2') ||
    normalized.includes('diodo') ||
    normalized.includes('mosfet') ||
    normalized.includes('capacitor') ||
    normalized.includes('resistor') ||
    normalized.includes('integrado') ||
    normalized.includes('bga')
  ) {
    return { category: 'Chips / CI / Microelectrónica', isAutoAssigned: true };
  }

  // 7. Memorias / Almacenamiento
  if (
    normalized.includes('memoria') ||
    normalized.includes('ram') ||
    normalized.includes('ssd') ||
    normalized.includes('nvme') ||
    normalized.includes('emmc') ||
    normalized.includes('disco') ||
    normalized.includes('almacenamiento') ||
    normalized.includes('hdd')
  ) {
    return { category: 'Memorias / Almacenamiento', isAutoAssigned: true };
  }

  // 8. Teclados y Touchpads
  if (
    normalized.includes('teclado') ||
    normalized.includes('keyboard') ||
    normalized.includes('touchpad') ||
    normalized.includes('trackpad') ||
    normalized.includes('palmrest')
  ) {
    return { category: 'Teclados y Touchpads', isAutoAssigned: true };
  }

  // 9. Insumos / Químicos / Soldadura
  if (
    normalized.includes('soldadura') ||
    normalized.includes('flux') ||
    normalized.includes('estaño') ||
    normalized.includes('pasta') ||
    normalized.includes('alcohol') ||
    normalized.includes('isopropilico') ||
    normalized.includes('b7000') ||
    normalized.includes('t7000') ||
    normalized.includes('pegamento') ||
    normalized.includes('adhesivo') ||
    normalized.includes('cinta') ||
    normalized.includes('kapton') ||
    normalized.includes('malla')
  ) {
    return { category: 'Insumos / Químicos / Soldadura', isAutoAssigned: true };
  }

  // 10. Accesorios y Fundas
  if (
    normalized.includes('funda') ||
    normalized.includes('case') ||
    normalized.includes('cover') ||
    normalized.includes('templado') ||
    normalized.includes('hidrogel') ||
    normalized.includes('protector') ||
    normalized.includes('cargador') ||
    normalized.includes('auricular') ||
    normalized.includes('cable usb')
  ) {
    return { category: 'Accesorios y Fundas', isAutoAssigned: true };
  }

  return { category: 'Otros Repuestos', isAutoAssigned: true };
}

/**
 * Limpia y extrae números de cadenas de precios (ej: "$ 15.000,50", "USD 45.00", "3500")
 */
export function parseNumberValue(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  if (!str) return 0;

  // Remover símbolos de moneda y espacios
  let clean = str.replace(/[^0-9.,-]/g, '').trim();

  // Si tiene formato con punto y coma: ej: 1.500,00 o 1,500.00
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.indexOf('.') < clean.indexOf(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    const parts = clean.split(',');
    if (parts[1] && parts[1].length <= 2) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts[1] && parts[1].length === 3 && parts.length === 2) {
      // Formato latino miles: ej: 18.500 -> 18500
      clean = clean.replace(/\./g, '');
    } else if (parts.length > 2) {
      // 1.250.000 -> miles
      clean = clean.replace(/\./g, '');
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Autocompleta o deduce precios de costo y venta
 */
export function autoFillPrices(cost: number, sale: number): { costPrice: number; salePrice: number; isAutoCalculated: boolean } {
  let finalCost = cost;
  let finalSale = sale;
  let isAutoCalculated = false;

  if (finalCost > 0 && finalSale <= 0) {
    // Margen comercial automático del +40%
    finalSale = Math.round(finalCost * 1.4);
    isAutoCalculated = true;
  } else if (finalSale > 0 && finalCost <= 0) {
    // Estimación de costo al 65% del precio de venta
    finalCost = Math.round(finalSale * 0.65);
    isAutoCalculated = true;
  } else if (finalCost <= 0 && finalSale <= 0) {
    finalCost = 0;
    finalSale = 0;
  }

  return { costPrice: finalCost, salePrice: finalSale, isAutoCalculated };
}

/**
 * Busca valores en un objeto según posibles nombres de campos, evitando falsos positivos
 */
function getObjectValue(obj: Record<string, any>, possibleKeys: string[], excludeSubstrings?: string[]): any {
  const keys = Object.keys(obj);
  for (const pKey of possibleKeys) {
    const directMatch = keys.find((k) => k.toLowerCase().trim() === pKey.toLowerCase().trim());
    if (directMatch !== undefined && obj[directMatch] !== undefined && obj[directMatch] !== '') {
      return obj[directMatch];
    }
  }
  for (const pKey of possibleKeys) {
    const fuzzyMatch = keys.find((k) => {
      const lower = k.toLowerCase();
      if (excludeSubstrings && excludeSubstrings.some((ex) => lower.includes(ex.toLowerCase()))) {
        return false;
      }
      return lower.includes(pKey.toLowerCase());
    });
    if (fuzzyMatch !== undefined && obj[fuzzyMatch] !== undefined && obj[fuzzyMatch] !== '') {
      return obj[fuzzyMatch];
    }
  }
  return undefined;
}

/**
 * Convierte un registro crudo en un ParsedInventoryItem estandarizado
 */
export function normalizeRecord(record: Record<string, any>, index: number): ParsedInventoryItem | null {
  // 1. Nombre / Repuesto
  const rawName =
    getObjectValue(record, ['nombre', 'name', 'descripcion', 'descripción', 'description', 'repuesto', 'articulo', 'artículo', 'producto', 'item', 'title', 'detalle']) ||
    '';
  const name = String(rawName).trim();
  if (!name || name.length < 2) {
    return null;
  }

  // 2. SKU / Código
  const rawSku = getObjectValue(record, ['sku', 'codigo', 'código', 'code', 'id', 'referencia', 'ref', 'part_number', 'pn', 'item_code']);
  const sku = rawSku ? String(rawSku).trim() : `REP-${Date.now().toString().slice(-4)}${index.toString().padStart(2, '0')}`;

  // 3. Precios (Costo y Venta con exclusión inteligente)
  const rawCost = getObjectValue(
    record,
    ['costo', 'cost', 'cost_price', 'costprice', 'precio_costo', 'p_costo', 'compra', 'precio_compra', 'pc', 'costo_unitario'],
    ['venta', 'sale', 'pvp', 'publico', 'saleprice']
  );
  const rawSale = getObjectValue(
    record,
    ['precio_venta', 'p_venta', 'sale_price', 'saleprice', 'venta', 'pvp', 'pv', 'precio_publico', 'precio', 'price', 'valor', 'importe'],
    ['costo', 'cost', 'compra', 'pc']
  );

  const parsedCost = parseNumberValue(rawCost);
  const parsedSale = parseNumberValue(rawSale);
  const { costPrice, salePrice, isAutoCalculated: isPriceAutoCalculated } = autoFillPrices(parsedCost, parsedSale);

  // 4. Categoría (Autollenado inteligente)
  const rawCategory = getObjectValue(record, ['categoria', 'categoría', 'category', 'rubro', 'tipo', 'clase']);
  const { category, isAutoAssigned: isCategoryAutoAssigned } = autoDetectCategory(`${name} ${record.notas || ''} ${record.modelos || ''}`, rawCategory);

  // 5. Stock y Stock Mínimo
  const rawStock = getObjectValue(record, ['stock', 'cantidad', 'cant', 'quantity', 'qty', 'unidades', 'existencia', 'actual']);
  const stock = rawStock !== undefined ? Math.max(0, parseInt(String(rawStock), 10) || 0) : 5;

  const rawMinStock = getObjectValue(record, ['min_stock', 'minstock', 'minimo', 'mínimo', 'alerta', 'stock_minimo', 'min']);
  const minStock = rawMinStock !== undefined ? Math.max(0, parseInt(String(rawMinStock), 10) || 0) : 2;

  // 6. Ubicación, Proveedor, Modelos Compatibles, Notas
  const location = String(getObjectValue(record, ['ubicacion', 'ubicación', 'location', 'cajon', 'estante', 'gaveta', 'posicion']) || 'Taller').trim();
  const supplier = String(getObjectValue(record, ['proveedor', 'supplier', 'distribuidor', 'marca']) || '').trim();
  const compatibleModels = String(getObjectValue(record, ['compatible', 'compatibilidad', 'modelos', 'models', 'compatible_models', 'equipos']) || '').trim();
  const notes = String(getObjectValue(record, ['notas', 'notes', 'observaciones', 'comentario', 'detalles']) || '').trim();

  return {
    sku,
    name,
    category,
    stock,
    minStock,
    costPrice,
    salePrice,
    location,
    supplier,
    compatibleModels,
    notes,
    isCategoryAutoAssigned,
    isPriceAutoCalculated,
  };
}

/**
 * Parsea archivos Excel / ODS / CSV (.xlsx, .xls, .ods, .csv) usando SheetJS
 */
export async function parseSpreadsheet(file: File): Promise<ParsedInventoryItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const items: ParsedInventoryItem[] = [];
  jsonData.forEach((row, idx) => {
    const normalized = normalizeRecord(row, idx + 1);
    if (normalized) items.push(normalized);
  });

  return items;
}

/**
 * Parsea archivos JSON (.json)
 */
export async function parseJsonFile(file: File): Promise<ParsedInventoryItem[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    const candidateKeys = ['inventory', 'items', 'repuestos', 'articulos', 'productos', 'data'];
    for (const key of candidateKeys) {
      if (Array.isArray(parsed[key])) {
        rawList = parsed[key];
        break;
      }
    }
  }

  const items: ParsedInventoryItem[] = [];
  rawList.forEach((row, idx) => {
    if (typeof row === 'object' && row !== null) {
      const normalized = normalizeRecord(row, idx + 1);
      if (normalized) items.push(normalized);
    }
  });

  return items;
}

/**
 * Parsea archivos XML (.xml)
 */
export async function parseXmlFile(file: File): Promise<ParsedInventoryItem[]> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  const candidateTags = ['item', 'repuesto', 'articulo', 'producto', 'record', 'row', 'entry'];
  let elementNodes: Element[] = [];

  for (const tag of candidateTags) {
    const elements = xmlDoc.getElementsByTagName(tag);
    if (elements.length > 0) {
      elementNodes = Array.from(elements);
      break;
    }
  }

  if (elementNodes.length === 0) {
    const root = xmlDoc.documentElement;
    if (root && root.children.length > 0) {
      elementNodes = Array.from(root.children);
    }
  }

  const items: ParsedInventoryItem[] = [];
  elementNodes.forEach((node, idx) => {
    const rowData: Record<string, any> = {};

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      rowData[attr.name] = attr.value;
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      rowData[child.tagName] = child.textContent?.trim() || '';
    }

    const normalized = normalizeRecord(rowData, idx + 1);
    if (normalized) items.push(normalized);
  });

  return items;
}

/**
 * Parsea archivos de texto (.txt) tabulado, con comas, punto y coma o pipes
 */
export async function parseTextFile(file: File): Promise<ParsedInventoryItem[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes('|')) delimiter = '|';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes(',')) delimiter = ',';

  const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase());
  const hasHeaders = headers.some((h) =>
    ['nombre', 'name', 'repuesto', 'articulo', 'sku', 'precio', 'costo', 'stock'].some((kw) => h.includes(kw))
  );

  const startIndex = hasHeaders ? 1 : 0;
  const items: ParsedInventoryItem[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split(delimiter).map((c) => c.trim());
    if (columns.length === 0 || !columns[0]) continue;

    const rowData: Record<string, any> = {};
    if (hasHeaders) {
      headers.forEach((hdr, colIdx) => {
        if (colIdx < columns.length) {
          rowData[hdr] = columns[colIdx];
        }
      });
    } else {
      if (columns.length === 1) {
        rowData['nombre'] = columns[0];
      } else if (columns.length === 2) {
        rowData['nombre'] = columns[0];
        rowData['precio'] = columns[1];
      } else if (columns.length >= 3) {
        rowData['sku'] = columns[0];
        rowData['nombre'] = columns[1];
        rowData['precio'] = columns[2];
        if (columns[3]) rowData['stock'] = columns[3];
        if (columns[4]) rowData['categoria'] = columns[4];
      }
    }

    const normalized = normalizeRecord(rowData, i + 1);
    if (normalized) items.push(normalized);
  }

  return items;
}

/**
 * Parsea archivos PDF (.pdf) extrayendo texto estructurado
 */
export async function parsePdfFile(file: File): Promise<ParsedInventoryItem[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      }
    } catch {
      // Fallback local
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    const allLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const rowMap = new Map<number, { x: number; text: string }[]>();

      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        const x = Math.round(item.transform[4]);

        let matchedY = y;
        for (const existingY of rowMap.keys()) {
          if (Math.abs(existingY - y) <= 4) {
            matchedY = existingY;
            break;
          }
        }

        if (!rowMap.has(matchedY)) {
          rowMap.set(matchedY, []);
        }
        rowMap.get(matchedY)!.push({ x, text: item.str.trim() });
      }

      const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);

      for (const y of sortedYs) {
        const rowItems = rowMap.get(y)!;
        rowItems.sort((a, b) => a.x - b.x);
        const lineText = rowItems.map((i) => i.text).join('   ');
        allLines.push(lineText);
      }
    }

    const items: ParsedInventoryItem[] = [];
    let itemIndex = 1;

    for (const line of allLines) {
      if (line.length < 5) continue;
      const lower = line.toLowerCase();
      if (lower.includes('página') || lower.includes('subtotal') || lower.includes('total factura') || lower.includes('factura a') || lower.includes('cuit')) {
        continue;
      }

      const columns = line.split(/\s{2,}|\t/).map((c) => c.trim()).filter(Boolean);
      if (columns.length >= 2) {
        const rowData: Record<string, any> = {};

        if (/^[A-Z0-9_-]{3,12}$/i.test(columns[0])) {
          rowData['sku'] = columns[0];
          rowData['nombre'] = columns[1];
          if (columns[2]) rowData['precio'] = columns[2];
          if (columns[3]) rowData['stock'] = columns[3];
        } else {
          rowData['nombre'] = columns[0];
          rowData['precio'] = columns[1];
          if (columns[2]) rowData['stock'] = columns[2];
        }

        const normalized = normalizeRecord(rowData, itemIndex++);
        if (normalized) items.push(normalized);
      } else {
        const words = line.split(' ');
        if (words.length >= 2) {
          const normalized = normalizeRecord({ nombre: line }, itemIndex++);
          if (normalized) items.push(normalized);
        }
      }
    }

    return items;
  } catch (err) {
    console.error('Error parseando PDF:', err);
    throw new Error('No se pudo extraer el texto del archivo PDF. Asegúrate de que sea un PDF digital con texto seleccionable.');
  }
}

/**
 * Función principal que procesa cualquier archivo y retorna items estandarizados
 */
export async function processInventoryFile(file: File): Promise<ImportResult> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  let items: ParsedInventoryItem[] = [];
  let fileTypeLabel = ext.toUpperCase();

  switch (ext) {
    case 'xlsx':
    case 'xls':
    case 'ods':
    case 'csv':
      items = await parseSpreadsheet(file);
      fileTypeLabel = `Planilla ${ext.toUpperCase()}`;
      break;

    case 'json':
      items = await parseJsonFile(file);
      fileTypeLabel = 'Documento JSON';
      break;

    case 'xml':
      items = await parseXmlFile(file);
      fileTypeLabel = 'Documento XML';
      break;

    case 'txt':
      items = await parseTextFile(file);
      fileTypeLabel = 'Texto / TSV';
      break;

    case 'pdf':
      items = await parsePdfFile(file);
      fileTypeLabel = 'Documento PDF';
      break;

    default:
      throw new Error(`Formato de archivo .${ext} no soportado. Formatos permitidos: PDF, XLSX, TXT, ODS, CSV, JSON, XML, XLS.`);
  }

  const autoCategorizedCount = items.filter((i) => i.isCategoryAutoAssigned).length;
  const autoPricedCount = items.filter((i) => i.isPriceAutoCalculated).length;

  return {
    items,
    fileType: fileTypeLabel,
    fileName,
    totalParsed: items.length,
    autoCategorizedCount,
    autoPricedCount,
    warnings: items.length === 0 ? ['No se encontraron registros de repuestos válidos en el archivo.'] : [],
  };
}

/**
 * Genera y descarga una plantilla Excel oficial de inventario
 */
export function downloadInventoryTemplateExcel() {
  const sampleData = [
    {
      Rubro: 'Pantallas / Displays',
      Marca: 'Samsung',
      Descripción: 'Módulo Display OLED Samsung Galaxy A54 5G Original con Marco',
      Cantidad: 10,
      'Precio Costo': 35000,
      'Precio Venta': 49000,
      Ubicación: 'Gaveta A-12',
    },
    {
      Rubro: 'Baterías',
      Marca: 'Apple',
      Descripción: 'Batería iPhone 13 3227mAh Alta Capacidad Calibrada',
      Cantidad: 8,
      'Precio Costo': 21000,
      'Precio Venta': 29400,
      Ubicación: 'Estante 2',
    },
    {
      Rubro: 'Pines y Módulos de Carga',
      Marca: 'Motorola',
      Descripción: 'Subboard Placa Pin de Carga Tipo C Moto G22 con Micrófono',
      Cantidad: 15,
      'Precio Costo': 2500,
      'Precio Venta': 4200,
      Ubicación: 'Cajón C-05',
    },
    {
      Rubro: 'Insumos / Químicos / Soldadura',
      Marca: 'Mechanic',
      Descripción: 'Flux en Pasta Mechanic UV50 Jeringa 10cc para Microelectrónica',
      Cantidad: 5,
      'Precio Costo': 4500,
      'Precio Venta': 7500,
      Ubicación: 'Mesa Taller',
    },
    {
      Rubro: 'Cámaras y Lentes',
      Marca: 'Xiaomi',
      Descripción: 'Cámara Trasera Principal 108MP Redmi Note 10 Pro',
      Cantidad: 4,
      'Precio Costo': 18000,
      'Precio Venta': 26000,
      Ubicación: 'Cajón D-01',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Inventario');
  XLSX.writeFile(wb, 'Plantilla_Inventario_Repuestos.xlsx');
}

/**
 * Procesa texto pegado directamente (WhatsApp, listas de proveedores, catálogos en texto plano)
 */
export function parseRawText(text: string): ImportResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 2);
  const rawItems: any[] = [];

  lines.forEach((line, idx) => {
    let parts: string[] = [];
    if (line.includes('\t')) parts = line.split('\t').map((p) => p.trim());
    else if (line.includes(';')) parts = line.split(';').map((p) => p.trim());
    else if (line.includes('|')) parts = line.split('|').map((p) => p.trim());
    else parts = [line];

    if (parts.length >= 2) {
      rawItems.push({
        nombre: parts[0],
        costo: parts[1],
        precio: parts[2],
        cantidad: parts[3],
        categoria: parts[4],
      });
    } else {
      // Línea de texto desestructurada: "10 Pantallas OLED Samsung A54 $ 35.000"
      const qtyMatch = line.match(/^(\d+)\s+(.+)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 5;
      const textAfterQty = qtyMatch ? qtyMatch[2] : line;

      const priceMatch = textAfterQty.match(/[$€]?\s*([0-9.,]+)\s*$/);
      const price = priceMatch ? parseNumberValue(priceMatch[1]) : 0;
      const name = priceMatch ? textAfterQty.slice(0, priceMatch.index).trim() : textAfterQty;

      rawItems.push({
        nombre: name || line,
        cantidad: qty,
        costo: price,
        precio: price > 0 ? Math.round(price * 1.4) : 0,
      });
    }
  });

  const parsedItems: ParsedInventoryItem[] = [];
  let autoCategorized = 0;
  let autoPriced = 0;

  rawItems.forEach((record, index) => {
    const item = normalizeRecord(record, index + 1);
    if (item) {
      if (item.isCategoryAutoAssigned) autoCategorized++;
      if (item.isPriceAutoCalculated) autoPriced++;
      parsedItems.push(item);
    }
  });

  return {
    items: parsedItems,
    fileType: 'Texto / Lista IA',
    fileName: 'Texto Pegado Manualmente',
    totalParsed: parsedItems.length,
    autoCategorizedCount: autoCategorized,
    autoPricedCount: autoPriced,
    warnings: parsedItems.length === 0 ? ['No se reconocieron artículos válidos en el texto.'] : [],
  };
}
