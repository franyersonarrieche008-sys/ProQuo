export const productosIniciales = [
  // Categoría: Tecnología
  {
    id: 'PROD-001',
    nombre: 'Audífonos Inalámbricos TWS',
    categoria: 'Tecnología',
    marca: 'NovaSound',
    precio: 75000,
    descripcion: 'Audífonos Bluetooth con estuche de carga y gran autonomía.',
    iniciales: 'AI',
    variantes: [
      { id: 'PROD-001-NEGRO', etiqueta: 'Negro', precio: 75000, stock: 6 },
      { id: 'PROD-001-BLANCO', etiqueta: 'Blanco', precio: 79000, stock: 4 }
    ]
  },
  {
    id: 'PROD-002',
    nombre: 'Soporte Plegable para Laptop',
    categoria: 'Tecnología',
    precio: 45000,
    stock: 5,
    descripcion: 'Soporte de aluminio ajustable para portátiles de hasta 15.6 pulgadas.',
    iniciales: 'SL'
  },
  {
    id: 'PROD-003',
    nombre: 'Cargador Carga Rápida USB-C',
    categoria: 'Tecnología',
    marca: 'Voltix',
    precio: 35000,
    descripcion: 'Adaptador de pared de 20W con puerto USB tipo C.',
    iniciales: 'CR',
    variantes: [
      { id: 'PROD-003-20W', etiqueta: '20W', precio: 35000, stock: 0 },
      { id: 'PROD-003-30W', etiqueta: '30W', precio: 42000, stock: 0 }
    ]
  },

  // Categoría: Hogar
  {
    id: 'PROD-004',
    nombre: 'Organizador Multiusos de Escritorio',
    categoria: 'Hogar',
    precio: 28000,
    stock: 12,
    descripcion: 'Organizadores plásticos apilables para optimizar espacios.',
    iniciales: 'OM'
  },
  {
    id: 'PROD-005',
    nombre: 'Bombillo LED Inteligente RGB',
    categoria: 'Tecnología', // O Hogar
    precio: 42000,
    stock: 8,
    descripcion: 'Bombillo compatible con asistentes de voz y cambio de color.',
    iniciales: 'BL'
  },
  {
    id: 'PROD-006',
    nombre: 'Set de Utensilios de Cocina de Bambú',
    categoria: 'Hogar',
    precio: 55000,
    stock: 6,
    descripcion: 'Juego de 5 espátulas y cucharas ecológicas resistentes al calor.',
    iniciales: 'UB'
  },

  // Categoría: Moda
  {
    id: 'PROD-007',
    nombre: 'Camiseta Básica Oversize',
    categoria: 'Moda',
    marca: 'UrbanThread',
    precio: 50000,
    descripcion: 'Camiseta 100% algodón de corte moderno y cómodo.',
    iniciales: 'CO',
    variantes: [
      { id: 'PROD-007-S-BLANCA', etiqueta: 'S / Blanca', precio: 50000, stock: 5 },
      { id: 'PROD-007-M-NEGRA', etiqueta: 'M / Negra', precio: 52000, stock: 6 },
      { id: 'PROD-007-L-NEGRA', etiqueta: 'L / Negra', precio: 54000, stock: 4 }
    ]
  },
  {
    id: 'PROD-008',
    nombre: 'Morral Urbano Impermeable',
    categoria: 'Moda',
    precio: 110000,
    stock: 4,
    descripcion: 'Mochila antirrobo con compartimento interno para portátil.',
    iniciales: 'MU'
  },
  {
    id: 'PROD-009',
    nombre: 'Gorra Deportiva Ajustable',
    categoria: 'Moda',
    precio: 32000,
    stock: 0, // Agotado para pruebas
    descripcion: 'Gorra transpirable ideal for running y actividades al aire libre.',
    iniciales: 'GD'
  },

  // Categoría: Deporte
  {
    id: 'PROD-010',
    nombre: 'Botella Térmica Acero Inoxidable',
    categoria: 'Deporte',
    precio: 62000,
    stock: 9,
    descripcion: 'Termo de 750ml que mantiene bebidas frías o calientes por horas.',
    iniciales: 'BT'
  },
  {
    id: 'PROD-011',
    nombre: 'Set de Bandas de Resistencia',
    categoria: 'Deporte',
    precio: 38000,
    stock: 14,
    descripcion: 'Kit de 5 bandas elásticas de látex con diferentes niveles de tensión.',
    iniciales: 'BR'
  },
  {
    id: 'PROD-012',
    nombre: 'Colchoneta Yoga Mat Antideslizante',
    categoria: 'Deporte',
    precio: 70000,
    stock: 7,
    descripcion: 'Tapete acolchado para ejercicios en casa, yoga o pilates.',
    iniciales: 'YM'
  }
];