import React, { useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { productosIniciales } from './data/productos';

const COP = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
const now = () => new Date().toISOString();

const initialProducts = () => productosIniciales.map((product) => {
  const variants = product.variantes?.length
    ? product.variantes
    : [{ id: `${product.id}-UNICA`, etiqueta: 'Única', precio: product.precio, stock: product.stock || 0 }];
  return {
    ...product,
    marca: product.marca || 'ProQuo',
    variants,
    reviews: product.reviews || [{ rating: 5, comment: 'Excelente calidad.' }],
  };
});

const initialOrders = () => [
  {
    id: 'PED-9001',
    items: [{ productId: 'PROD-002', variantId: 'PROD-002-UNICA', variantLabel: 'Única', nombre: 'Soporte Plegable para Laptop', quantity: 1, unitPrice: 45000 }],
    subtotal: 45000,
    shipping: 6000,
    total: 51000,
    state: 'Confirmado',
    stateHistory: [{ state: 'Confirmado', date: now() }],
    stockRestored: false,
    address: { municipio: 'Mosquera', alias: 'Casa', descripcion: 'Dirección ficticia 100' },
    shippingMode: 'estándar',
    createdAt: now(),
  },
];

export default function App() {
  const [section, setSection] = useState('catalog');
  const [products, setProducts] = useState(initialProducts);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [brand, setBrand] = useState('Todas');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState('Todas');
  const [filterError, setFilterError] = useState('');
  const [comparison, setComparison] = useState([]);
  const [addresses, setAddresses] = useState([{ id: 'DIR-1', alias: 'Casa', municipio: 'Mosquera', descripcion: 'Dirección ficticia 123', principal: true }]);
  const [addressDraft, setAddressDraft] = useState({ alias: '', municipio: 'Mosquera', descripcion: '' });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState('DIR-1');
  const [shippingMode, setShippingMode] = useState('');
  const [questions, setQuestions] = useState({ 'PROD-001': [{ id: 'Q-1', question: '¿Incluye estuche de carga?', answer: 'Sí, incluye estuche.', date: now(), pending: false }] });
  const [questionDraft, setQuestionDraft] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketDraft, setTicketDraft] = useState({ orderId: '', reason: 'Entrega', description: '' });
  const [status, setStatus] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const sequence = useRef(9002);

  const selectedProduct = products.find((item) => item.id === selectedProductId) || null;
  const brands = useMemo(() => ['Todas', ...new Set(products.map((item) => item.marca))], [products]);
  const categories = useMemo(() => ['Todas', ...new Set(products.map((item) => item.categoria))], [products]);
  const getStock = (product) => product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const getVariant = (productId, variantId) => products.find((item) => item.id === productId)?.variants.find((item) => item.id === variantId);

  const filtered = useMemo(() => {
    if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) return [];
    return products.filter((product) => {
      const matchesText = `${product.nombre} ${product.descripcion}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = category === 'Todas' || product.categoria === category;
      const matchesBrand = brand === 'Todas' || product.marca === brand;
      const matchesPrice = (minPrice === '' || product.precio >= Number(minPrice)) && (maxPrice === '' || product.precio <= Number(maxPrice));
      const matchesStock = availability === 'Todas' || (availability === 'Disponible' ? getStock(product) > 0 : getStock(product) === 0);
      return matchesText && matchesCategory && matchesBrand && matchesPrice && matchesStock;
    }).sort((a, b) => a.precio - b.precio);
  }, [products, search, category, brand, minPrice, maxPrice, availability]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const rates = { Mosquera: { estándar: 6000, exprés: 10000 }, Funza: { estándar: 8000, exprés: 12000 }, Madrid: { estándar: 10000, exprés: 14000 } };
  const selectedAddress = addresses.find((item) => item.id === selectedAddressId);
  const shipping = selectedAddress && shippingMode ? (rates[selectedAddress.municipio]?.[shippingMode] || 0) : 0;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const total = subtotal + shipping - discount;

  const toggleFavorite = (id) => setFavorites((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  const addToCart = (productId, variantId = selectedVariantId, quantity = selectedProductId === productId ? detailQuantity : 1) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (!variantId) { setStatus('Selecciona una variante antes de agregarlo.'); return; }
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return;
    if (variant.stock === 0) { setStatus('La variante seleccionada está agotada.'); return; }
    if (!Number.isInteger(quantity) || quantity < 1) { setStatus('La cantidad debe ser válida.'); return; }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId && item.variantId === variantId);
      const current = existing?.quantity || 0;
      if (current + quantity > variant.stock) { setStatus(`Máximo permitido: ${variant.stock} unidades.`); return prev; }
      if (existing) return prev.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { productId, variantId, variantLabel: variant.etiqueta, quantity, unitPrice: variant.precio }];
    });
    setStatus(`${product.nombre} — ${variant.etiqueta} agregado al carrito.`);
  };

  const updateQuantity = (productId, variantId, delta) => setCart((prev) => prev.map((item) => item.productId === productId && item.variantId === variantId
    ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0).map((item) => {
      const stock = getVariant(item.productId, item.variantId)?.stock || 0;
      return item.quantity > stock ? { ...item, quantity: stock } : item;
    }));

  const confirmPurchase = () => {
    if (!cart.length) { setStatus('Tu carrito está vacío.'); return; }
    if (!selectedAddressId) { setStatus('Selecciona una dirección antes de continuar.'); return; }
    if (!shippingMode) { setStatus('Selecciona la modalidad de envío.'); return; }
    if (!selectedAddress || !rates[selectedAddress.municipio]?.[shippingMode]) { setStatus('El municipio no tiene envío disponible.'); return; }
    for (const item of cart) {
      const variant = getVariant(item.productId, item.variantId);
      if (!variant || item.quantity > variant.stock) { setStatus('Hay una variante sin stock suficiente.'); return; }
    }
    sequence.current += 1;
    const id = `PED-${sequence.current}`;
    const order = {
      id, items: cart.map((item) => ({
        ...item,
        nombre: products.find((product) => product.id === item.productId)?.nombre || 'Producto',
      })),
      subtotal, shipping, discount, total,
      state: 'Confirmado',
      stateHistory: [{ state: 'Confirmado', date: now() }],
      address: selectedAddress,
      shippingMode,
      stockRestored: false,
      createdAt: now(),
    };
    setProducts((prev) => prev.map((product) => {
      const cartItems = cart.filter((item) => item.productId === product.id);
      if (!cartItems.length) return product;
      const variants = product.variants.map((variant) => {
        const item = cartItems.find((entry) => entry.variantId === variant.id);
        return item ? { ...variant, stock: Math.max(0, variant.stock - item.quantity) } : variant;
      });
      return { ...product, variants };
    }));
    setOrders((prev) => [order, ...prev]);
    setNotifications((prev) => [{ id: `NOT-${Date.now()}`, type: 'pedido', message: `${id}: pedido Confirmado`, date: now(), read: false, reference: id }, ...prev]);
    setCart([]);
    setCoupon('');
    setCouponApplied(false);
    setStatus(`Compra confirmada: ${id}.`);
  };

  const advanceOrder = (orderId) => {
    setOrders((prev) => prev.map((order) => {
      if (order.id !== orderId) return order;
      const next = order.state === 'Confirmado' ? 'Preparando' : order.state === 'Preparando' ? 'En camino' : order.state === 'En camino' ? 'Entregado' : null;
      if (!next) { setStatus('Este pedido ya no admite avances.'); return order; }
      setNotifications((items) => [{ id: `NOT-${Date.now()}-${orderId}`, type: 'pedido', message: `${orderId}: pedido ${next}`, date: now(), read: false, reference: orderId }, ...items]);
      setStatus(`${orderId} cambió a ${next}.`);
      return { ...order, state: next, stateHistory: [...order.stateHistory, { state: next, date: now() }] };
    }));
  };

  const cancelOrder = (orderId) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    if (!['Confirmado', 'Preparando'].includes(order.state)) { setStatus('No se puede cancelar: el pedido ya fue despachado o entregado.'); return; }
    Alert.alert('Cancelar pedido', `¿Confirmas cancelar ${orderId}?`, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => {
        setOrders((prev) => prev.map((item) => item.id !== orderId ? item : {
          ...item, state: 'Cancelado', stockRestored: true,
          stateHistory: [...item.stateHistory, { state: 'Cancelado', date: now() }],
        }));
        setProducts((prev) => prev.map((product) => {
          const items = order.items.filter((item) => item.productId === product.id);
          if (!items.length || order.stockRestored) return product;
          const variants = product.variants.map((variant) => {
            const item = items.find((entry) => entry.variantId === variant.id);
            return item ? { ...variant, stock: variant.stock + item.quantity } : variant;
          });
          return { ...product, variants };
        }));
        setNotifications((prev) => [{ id: `NOT-${Date.now()}-${orderId}`, type: 'pedido', message: `${orderId}: pedido Cancelado`, date: now(), read: false, reference: orderId }, ...prev]);
        setStatus(`${orderId} cancelado y stock reintegrado.`);
      } },
    ]);
  };

  const saveAddress = () => {
    if (!addressDraft.alias.trim() || !addressDraft.descripcion.trim()) { setStatus('Completa alias y referencia de entrega.'); return; }
    if (editingAddressId) {
      setAddresses((prev) => prev.map((item) => item.id === editingAddressId ? { ...item, ...addressDraft, alias: addressDraft.alias.trim(), descripcion: addressDraft.descripcion.trim() } : item));
      setEditingAddressId(null);
    } else {
      const id = `DIR-${Date.now()}`;
      setAddresses((prev) => [...prev, { id, ...addressDraft, alias: addressDraft.alias.trim(), descripcion: addressDraft.descripcion.trim(), principal: false }]);
    }
    setAddressDraft({ alias: '', municipio: 'Mosquera', descripcion: '' });
    setStatus('Dirección guardada.');
  };

  const setPrincipal = (id) => setAddresses((prev) => prev.map((item) => ({ ...item, principal: item.id === id })));

  const toggleComparison = (id) => {
    setComparison((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : prev.length >= 3 ? (setStatus('Máximo tres productos en comparación.'), prev) : [...prev, id]);
  };

  const applyFilters = () => {
    if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
      setFilterError('El precio mínimo no puede ser mayor que el máximo.');
      return;
    }
    setFilterError('');
  };

  const resetFilters = () => {
    setBrand('Todas'); setMinPrice(''); setMaxPrice(''); setAvailability('Todas'); setFilterError(''); setStatus('Filtros restablecidos.');
  };

  const sendQuestion = () => {
    if (!selectedProductId) return;
    if (questionDraft.trim().length < 10) { setStatus('La pregunta debe tener al menos 10 caracteres.'); return; }
    setQuestions((prev) => ({
      ...prev,
      [selectedProductId]: [...(prev[selectedProductId] || []), { id: `Q-${Date.now()}`, question: questionDraft.trim(), answer: '', date: now(), pending: true }],
    }));
    setQuestionDraft('');
    setStatus('Pregunta enviada con estado Pendiente.');
  };

  const answerQuestion = (questionId) => setQuestions((prev) => ({
    ...prev,
    [selectedProductId]: (prev[selectedProductId] || []).map((item) => item.id === questionId && item.pending
      ? { ...item, pending: false, answer: 'Respuesta simulada de demostración.' } : item),
  }));

  const toggleSubscription = (productId, variantId) => {
    const exists = subscriptions.find((item) => item.productId === productId && item.variantId === variantId);
    if (exists?.active) {
      setSubscriptions((prev) => prev.map((item) => item.id === exists.id ? { ...item, active: false } : item));
      setStatus('Suscripción cancelada.');
    } else if (exists) {
      setSubscriptions((prev) => prev.map((item) => item.id === exists.id ? { ...item, active: true } : item));
      setStatus('Suscripción reactivada.');
    } else {
      setSubscriptions((prev) => [...prev, { id: `SUB-${Date.now()}`, productId, variantId, active: true }]);
      setStatus('Te avisaremos cuando haya stock.');
    }
  };

  const restock = (productId, variantId) => {
    setProducts((prev) => prev.map((product) => product.id === productId ? {
      ...product,
      variants: product.variants.map((variant) => variant.id === variantId ? { ...variant, stock: variant.stock + 5 } : variant),
    } : product));
    setNotifications((prev) => subscriptions
      .filter((item) => item.productId === productId && item.variantId === variantId && item.active)
      .map((item) => ({ id: `NOT-${Date.now()}-${item.id}`, type: 'reposicion', message: 'Hay reposición disponible para el artículo suscrito.', date: now(), read: false, reference: `${productId}/${variantId}` }))
      .concat(prev));
    setSubscriptions((prev) => prev.map((item) => item.productId === productId && item.variantId === variantId ? { ...item, active: false } : item));
    setStatus('Reposición simulada completada.');
  };

  const createTicket = () => {
    if (!ticketDraft.orderId || ticketDraft.description.trim().length < 15) { setStatus('Selecciona un pedido y escribe al menos 15 caracteres.'); return; }
    const ticket = { id: `CAS-${Date.now().toString().slice(-6)}`, ...ticketDraft, description: ticketDraft.description.trim(), state: 'Abierto', response: '' };
    setTickets((prev) => [ticket, ...prev]);
    setTicketDraft({ orderId: '', reason: 'Entrega', description: '' });
    setStatus(`Solicitud creada: ${ticket.id}.`);
  };

  const renderCatalog = () => (
    <View style={styles.section}>
      <Text style={styles.brand}>ProQuo</Text>
      <Text style={styles.tagline}>Calidad que encuentras, confianza que te acompaña</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Buscar productos" style={styles.input} />
      <View style={styles.wrap}>
        {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={styles.chipText}>{item}</Text></Pressable>)}
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>Filtros combinados</Text>
        <View style={styles.wrap}>
          {brands.map((item) => <Pressable key={item} onPress={() => setBrand(item)} style={[styles.chip, brand === item && styles.chipActive]}><Text style={styles.chipText}>{item}</Text></Pressable>)}
        </View>
        <View style={styles.row}>
          <TextInput value={minPrice} onChangeText={setMinPrice} placeholder="Precio mínimo" keyboardType="numeric" style={[styles.input, styles.half]} />
          <TextInput value={maxPrice} onChangeText={setMaxPrice} placeholder="Precio máximo" keyboardType="numeric" style={[styles.input, styles.half]} />
        </View>
        <View style={styles.wrap}>
          {['Todas', 'Disponible', 'Agotado'].map((item) => <Pressable key={item} onPress={() => setAvailability(item)} style={[styles.chip, availability === item && styles.chipActive]}><Text style={styles.chipText}>{item}</Text></Pressable>)}
        </View>
        <View style={styles.row}>
          <Pressable onPress={applyFilters} style={styles.primary}><Text style={styles.primaryText}>Aplicar filtros</Text></Pressable>
          <Pressable onPress={resetFilters} style={styles.secondary}><Text style={styles.secondaryText}>Restablecer</Text></Pressable>
        </View>
        {filterError ? <Text style={styles.error}>{filterError}</Text> : null}
      </View>
      {filtered.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No hay productos</Text><Text style={styles.emptyText}>Ajusta o restablece los filtros.</Text></View> :
        filtered.map((product) => {
          const checked = comparison.includes(product.id);
          return <View key={product.id} style={styles.card}>
            <Pressable onPress={() => { setSelectedProductId(product.id); setSelectedVariantId(null); setDetailQuantity(1); }}>
              <Text style={styles.cardTitle}>{product.nombre}</Text>
              <Text style={styles.meta}>{product.marca} · {product.categoria}</Text>
              <Text style={styles.price}>{COP(product.precio)}</Text>
              <Text style={styles.meta}>{getStock(product) > 0 ? `Disponible: ${getStock(product)} und.` : 'Agotado'}</Text>
            </Pressable>
            <View style={styles.row}>
              <Pressable onPress={() => toggleFavorite(product.id)} style={styles.secondary}><Text style={styles.secondaryText}>{favorites.includes(product.id) ? '★ Favorito' : '☆ Favorito'}</Text></Pressable>
              <Pressable onPress={() => toggleComparison(product.id)} style={[styles.secondary, checked && styles.chipActive]}><Text style={styles.secondaryText}>{checked ? 'Comparando ✓' : 'Comparar'}</Text></Pressable>
            </View>
          </View>;
        })}
    </View>
  );

  const renderDetail = () => !selectedProduct ? <Text style={styles.title}>Selecciona un producto</Text> : (
    <View style={styles.section}>
      <Pressable onPress={() => setSelectedProductId(null)} style={styles.back}><Text style={styles.backText}>← Volver</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{selectedProduct.nombre}</Text>
        <Text style={styles.meta}>{selectedProduct.marca} · {selectedProduct.categoria}</Text>
        <Text style={styles.price}>{COP(selectedVariantId ? (getVariant(selectedProduct.id, selectedVariantId)?.precio || selectedProduct.precio) : selectedProduct.precio)}</Text>
        <Text style={styles.meta}>{selectedVariantId ? `Disponibles: ${getVariant(selectedProduct.id, selectedVariantId)?.stock || 0}` : `Stock global: ${getStock(selectedProduct)}`}</Text>
        <Text style={styles.description}>{selectedProduct.descripcion}</Text>
        <Text style={styles.title}>Elige una variante</Text>
        {selectedProduct.variants.map((variant) => <Pressable key={variant.id} onPress={() => setSelectedVariantId(variant.id)} disabled={variant.stock === 0} style={[styles.variant, selectedVariantId === variant.id && styles.variantActive, variant.stock === 0 && styles.disabled]}>
          <Text style={styles.variantText}>{variant.etiqueta} · {COP(variant.precio)} · {variant.stock} und.</Text>
        </Pressable>)}
        <View style={styles.row}>
          <Pressable onPress={() => setDetailQuantity(Math.max(1, detailQuantity - 1))} style={styles.qty}><Text style={styles.qtyText}>−</Text></Pressable>
          <Text style={styles.qtyNumber}>{detailQuantity}</Text>
          <Pressable onPress={() => setDetailQuantity(detailQuantity + 1)} style={styles.qty}><Text style={styles.qtyText}>+</Text></Pressable>
        </View>
        <Pressable onPress={() => addToCart(selectedProduct.id)} style={styles.primary}><Text style={styles.primaryText}>Agregar al carrito</Text></Pressable>
        <Pressable onPress={() => restock(selectedProduct.id, selectedVariantId || selectedProduct.variants[0].id)} style={[styles.secondary, { marginTop: 8 }]}><Text style={styles.secondaryText}>Simular reposición (demostración)</Text></Pressable>
        {selectedVariantId && getVariant(selectedProduct.id, selectedVariantId)?.stock === 0 && <Pressable onPress={() => toggleSubscription(selectedProduct.id, selectedVariantId)} style={[styles.secondary, { marginTop: 8 }]}><Text style={styles.secondaryText}>{subscriptions.find((item) => item.productId === selectedProduct.id && item.variantId === selectedVariantId)?.active ? 'Cancelar aviso de reposición' : 'Avisarme cuando haya stock'}</Text></Pressable>}
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>Preguntas del producto</Text>
        {(questions[selectedProduct.id] || []).map((item) => <View key={item.id} style={styles.question}><Text style={styles.cardTitleSmall}>{item.question}</Text><Text style={styles.meta}>{item.pending ? 'Pendiente' : `Respondida: ${item.answer}`}</Text>{item.pending && <Pressable onPress={() => answerQuestion(item.id)} style={styles.secondary}><Text style={styles.secondaryText}>Simular respuesta</Text></Pressable>}</View>)}
        <TextInput value={questionDraft} onChangeText={setQuestionDraft} placeholder="Escribe tu pregunta (mínimo 10 caracteres)" multiline style={[styles.input, styles.textarea]} />
        <Pressable onPress={sendQuestion} style={styles.primary}><Text style={styles.primaryText}>Enviar pregunta</Text></Pressable>
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>Productos relacionados</Text>
        {products.filter((item) => item.id !== selectedProduct.id && item.categoria === selectedProduct.categoria && getStock(item) > 0).slice(0, 4).length === 0
          ? <Text style={styles.emptyText}>No hay productos relacionados disponibles.</Text>
          : products.filter((item) => item.id !== selectedProduct.id && item.categoria === selectedProduct.categoria && getStock(item) > 0).slice(0, 4).map((item) => <Pressable key={item.id} onPress={() => { setSelectedProductId(item.id); setSelectedVariantId(null); }} style={styles.question}><Text style={styles.cardTitleSmall}>{item.nombre}</Text><Text style={styles.meta}>{COP(item.precio)}</Text></Pressable>)}
      </View>
    </View>
  );

  const renderCart = () => (
    <View style={styles.section}>
      <Text style={styles.title}>Carrito</Text>
      {cart.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Carrito vacío</Text></View> : cart.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return <View key={`${item.productId}-${item.variantId}`} style={styles.card}>
          <Text style={styles.cardTitle}>{product?.nombre}</Text>
          <Text style={styles.meta}>Variante: {item.variantLabel}</Text>
          <Text style={styles.price}>{COP(item.unitPrice)}</Text>
          <View style={styles.row}>
            <Pressable onPress={() => updateQuantity(item.productId, item.variantId, -1)} style={styles.qty}><Text style={styles.qtyText}>−</Text></Pressable>
            <Text style={styles.qtyNumber}>{item.quantity}</Text>
            <Pressable onPress={() => updateQuantity(item.productId, item.variantId, 1)} style={styles.qty}><Text style={styles.qtyText}>+</Text></Pressable>
            <Pressable onPress={() => setCart((prev) => prev.filter((entry) => !(entry.productId === item.productId && entry.variantId === item.variantId)))} style={styles.remove}><Text style={styles.removeText}>Eliminar</Text></Pressable>
          </View>
        </View>;
      })}
      {cart.length > 0 && <>
        <View style={styles.panel}>
          <Text style={styles.title}>Dirección de entrega</Text>
          {addresses.map((item) => <Pressable key={item.id} onPress={() => setSelectedAddressId(item.id)} style={[styles.address, selectedAddressId === item.id && styles.addressActive]}>
            <Text style={styles.cardTitleSmall}>{item.alias}{item.principal ? ' · Principal' : ''}</Text>
            <Text style={styles.meta}>{item.municipio} · {item.descripcion}</Text>
          </Pressable>)}
          <Text style={styles.title}>Modalidad</Text>
          <View style={styles.row}>
            {['estándar', 'exprés'].map((item) => <Pressable key={item} onPress={() => setShippingMode(item)} style={[styles.chip, shippingMode === item && styles.chipActive]}><Text style={styles.chipText}>{item}</Text></Pressable>)}
          </View>
        </View>
        <View style={styles.panel}>
          <TextInput value={coupon} onChangeText={setCoupon} placeholder="Cupón opcional" style={styles.input} />
          <Pressable onPress={() => setCouponApplied(coupon.trim().toUpperCase() === 'BIENVENIDO10')} style={styles.secondary}><Text style={styles.secondaryText}>Aplicar cupón</Text></Pressable>
          <Text style={styles.meta}>Subtotal: {COP(subtotal)}</Text>
          <Text style={styles.meta}>Envío: {selectedAddress && shippingMode ? COP(shipping) : 'Completa dirección y modalidad'}</Text>
          {couponApplied && <Text style={styles.meta}>Descuento: {COP(discount)}</Text>}
          <Text style={styles.total}>Total: {COP(total)}</Text>
        </View>
        <Pressable onPress={confirmPurchase} style={styles.primary}><Text style={styles.primaryText}>Confirmar compra</Text></Pressable>
      </>}
    </View>
  );

  const renderAddresses = () => (
    <View style={styles.section}>
      <Text style={styles.title}>Mis direcciones</Text>
      {addresses.map((item) => <View key={item.id} style={styles.card}>
        <Text style={styles.cardTitle}>{item.alias}{item.principal ? ' · Principal' : ''}</Text>
        <Text style={styles.meta}>{item.municipio}</Text>
        <Text style={styles.description}>{item.descripcion}</Text>
        <View style={styles.row}>
          <Pressable onPress={() => setPrincipal(item.id)} style={styles.secondary}><Text style={styles.secondaryText}>Principal</Text></Pressable>
          <Pressable onPress={() => { setEditingAddressId(item.id); setAddressDraft({ alias: item.alias, municipio: item.municipio, descripcion: item.descripcion }); }} style={styles.secondary}><Text style={styles.secondaryText}>Editar</Text></Pressable>
        </View>
      </View>)}
      <View style={styles.panel}>
        <Text style={styles.title}>{editingAddressId ? 'Editar dirección' : 'Nueva dirección'}</Text>
        <TextInput value={addressDraft.alias} onChangeText={(value) => setAddressDraft((prev) => ({ ...prev, alias: value }))} placeholder="Alias" style={styles.input} />
        <View style={styles.wrap}>{['Mosquera', 'Funza', 'Madrid'].map((item) => <Pressable key={item} onPress={() => setAddressDraft((prev) => ({ ...prev, municipio: item }))} style={[styles.chip, addressDraft.municipio === item && styles.chipActive]}><Text style={styles.chipText}>{item}</Text></Pressable>)}</View>
        <TextInput value={addressDraft.descripcion} onChangeText={(value) => setAddressDraft((prev) => ({ ...prev, descripcion: value }))} placeholder="Referencia de entrega ficticia" multiline style={[styles.input, styles.textarea]} />
        <Pressable onPress={saveAddress} style={styles.primary}><Text style={styles.primaryText}>Guardar dirección</Text></Pressable>
      </View>
    </View>
  );

  const renderOrders = () => {
    const order = orders.find((item) => item.id === selectedOrderId);
    if (order) return <View style={styles.section}>
      <Pressable onPress={() => setSelectedOrderId(null)} style={styles.back}><Text style={styles.backText}>← Volver a pedidos</Text></Pressable>
      <Text style={styles.title}>{order.id}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado: {order.state}</Text>
        <Text style={styles.meta}>Dirección: {order.address?.municipio} · {order.shippingMode}</Text>
        <Text style={styles.title}>Historial cronológico</Text>
        {[...(order.stateHistory || [])].map((event, index) => <Text key={`${event.state}-${index}`} style={styles.timeline}>{index + 1}. {event.state} · {new Date(event.date).toLocaleString('es-CO')}</Text>)}
        {order.items.map((item) => <Text key={`${item.productId}-${item.variantId}`} style={styles.description}>{item.nombre} — {item.variantLabel} × {item.quantity} · {COP(item.unitPrice)}</Text>)}
        <Text style={styles.total}>Total registrado: {COP(order.total)}</Text>
        {['Confirmado', 'Preparando', 'En camino'].includes(order.state) && <Pressable onPress={() => advanceOrder(order.id)} style={styles.primary}><Text style={styles.primaryText}>Simular avance de entrega</Text></Pressable>}
        {['Confirmado', 'Preparando'].includes(order.state) && <Pressable onPress={() => cancelOrder(order.id)} style={[styles.remove, { marginTop: 8 }]}><Text style={styles.removeText}>Cancelar compra</Text></Pressable>}
        {['En camino', 'Entregado', 'Cancelado'].includes(order.state) && <Text style={styles.meta}>{order.state === 'Cancelado' ? 'Pedido cancelado: no admite nuevas acciones.' : 'Cancelación no disponible en esta etapa.'}</Text>}
      </View>
    </View>;
    return <View style={styles.section}><Text style={styles.title}>Mis pedidos</Text>{orders.map((item) => <Pressable key={item.id} onPress={() => setSelectedOrderId(item.id)} style={styles.card}><Text style={styles.cardTitle}>{item.id}</Text><Text style={styles.meta}>{item.state} · {new Date(item.createdAt).toLocaleString('es-CO')}</Text><Text style={styles.price}>{COP(item.total)}</Text></Pressable>)}</View>;
  };

  const renderNotifications = () => (
    <View style={styles.section}>
      <Text style={styles.title}>Notificaciones</Text>
      {notifications.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No tienes notificaciones</Text></View> : notifications.map((item) => <Pressable key={item.id} onPress={() => setNotifications((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))} style={[styles.card, item.read && styles.read]}>
        <Text style={styles.cardTitle}>{item.message}</Text><Text style={styles.meta}>{item.read ? 'Leída' : 'Sin leer'} · {new Date(item.date).toLocaleString('es-CO')}</Text>
      </Pressable>)}
    </View>
  );

  const renderHelp = () => (
    <View style={styles.section}>
      <Text style={styles.title}>Centro de ayuda</Text>
      <View style={styles.panel}>
        <Text style={styles.title}>Nueva solicitud</Text>
        <View style={styles.wrap}>{orders.map((item) => <Pressable key={item.id} onPress={() => setTicketDraft((prev) => ({ ...prev, orderId: item.id }))} style={[styles.chip, ticketDraft.orderId === item.id && styles.chipActive]}><Text style={styles.chipText}>{item.id}</Text></Pressable>)}</View>
        <View style={styles.wrap}>{['Entrega', 'Producto', 'Otro'].map((item) => <Pressable key={item} onPress={() => setTicketDraft((prev) => ({ ...prev, reason: item }))} style={[styles.chip, ticketDraft.reason === item && styles.chipActive]}><Text style={styles.chipText}>{item}</Text></Pressable>)}</View>
        <TextInput value={ticketDraft.description} onChangeText={(value) => setTicketDraft((prev) => ({ ...prev, description: value }))} placeholder="Describe el inconveniente (mínimo 15 caracteres)" multiline style={[styles.input, styles.textarea]} />
        <Pressable onPress={createTicket} style={styles.primary}><Text style={styles.primaryText}>Enviar solicitud</Text></Pressable>
      </View>
      {tickets.map((ticket) => <View key={ticket.id} style={styles.card}>
        <Text style={styles.cardTitle}>{ticket.id} · {ticket.state}</Text>
        <Text style={styles.meta}>{ticket.orderId} · {ticket.reason}</Text>
        <Text style={styles.description}>{ticket.description}</Text>
        {ticket.state === 'Abierto' ? <Pressable onPress={() => setTickets((prev) => prev.map((item) => item.id === ticket.id ? { ...item, state: 'Respondido', response: 'Respuesta ficticia de demostración.' } : item))} style={styles.secondary}><Text style={styles.secondaryText}>Simular respuesta</Text></Pressable> : <Text style={styles.description}>Respuesta: {ticket.response}</Text>}
      </View>)}
    </View>
  );

  const renderComparison = () => (
    <View style={styles.section}>
      <Text style={styles.title}>Comparador</Text>
      {comparison.length < 2 ? <View style={styles.empty}><Text style={styles.emptyText}>Selecciona entre dos y tres productos.</Text></View> : <ScrollView horizontal>
        {comparison.map((id) => {
          const product = products.find((item) => item.id === id);
          return <View key={id} style={[styles.card, styles.compareCard]}>
            <Text style={styles.cardTitle}>{product.nombre}</Text><Text style={styles.meta}>Marca: {product.marca}</Text><Text style={styles.price}>{COP(product.precio)}</Text><Text style={styles.meta}>{getStock(product) > 0 ? 'Disponible' : 'Agotado'} · {getStock(product)} und.</Text>
            <Pressable onPress={() => toggleComparison(id)} style={styles.remove}><Text style={styles.removeText}>Retirar</Text></Pressable>
          </View>;
        })}
      </ScrollView>}
    </View>
  );

  const renderSection = () => {
    if (section === 'catalog' && selectedProductId) return renderDetail();
    if (section === 'catalog') return renderCatalog();
    if (section === 'cart') return renderCart();
    if (section === 'addresses') return renderAddresses();
    if (section === 'orders') return renderOrders();
    if (section === 'notifications') return renderNotifications();
    if (section === 'help') return renderHelp();
    if (section === 'compare') return renderComparison();
    if (section === 'favorites') return <View style={styles.section}><Text style={styles.title}>Favoritos</Text>{products.filter((item) => favorites.includes(item.id)).map((item) => <Pressable key={item.id} onPress={() => { setSelectedProductId(item.id); setSection('catalog'); }} style={styles.card}><Text style={styles.cardTitle}>{item.nombre}</Text><Text style={styles.price}>{COP(item.precio)}</Text></Pressable>)}{favorites.length === 0 && <View style={styles.empty}><Text style={styles.emptyText}>No tienes favoritos.</Text></View>}</View>;
    return renderCatalog();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
          {[['catalog','Catálogo'],['compare','Comparar'],['favorites','Favoritos'],['cart','Carrito'],['addresses','Direcciones'],['orders','Pedidos'],['notifications','Avisos'],['help','Ayuda']].map(([id,label]) => <Pressable key={id} onPress={() => { setSection(id); if (id !== 'orders') setSelectedOrderId(null); }} style={[styles.tab, section === id && styles.tabActive]}><Text style={styles.tabText}>{label}</Text></Pressable>)}
        </ScrollView>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{renderSection()}</ScrollView>
        {!!status && <Text style={styles.status}>{status}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, backgroundColor: '#0F172A', padding: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  section: { gap: 10 },
  brand: { color: '#F8FAFC', fontSize: 32, fontWeight: '800' },
  tagline: { color: '#CBD5E1', marginBottom: 8 },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginVertical: 6 },
  input: { backgroundColor: '#F8FAFC', color: '#0F172A', borderRadius: 10, padding: 12, marginBottom: 8 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  half: { flex: 1, marginHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: '#1E293B', borderRadius: 16, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  chipText: { color: '#F8FAFC', fontWeight: '700' },
  chipActiveText: { color: '#0F172A', fontWeight: '800' },
  panel: { backgroundColor: '#1E293B', borderRadius: 16, padding: 14, marginVertical: 6 },
  card: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, marginVertical: 6 },
  cardTitle: { color: '#0F172A', fontSize: 19, fontWeight: '800', marginBottom: 4 },
  cardTitleSmall: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  meta: { color: '#475569', marginVertical: 3 },
  price: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginVertical: 4 },
  description: { color: '#334155', marginVertical: 8 },
  primary: { flex: 1, backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginVertical: 4 },
  primaryText: { color: '#0F172A', fontWeight: '800' },
  secondary: { flex: 1, backgroundColor: '#E2E8F0', borderRadius: 10, paddingVertical: 10, alignItems: 'center', paddingHorizontal: 8 },
  secondaryText: { color: '#0F172A', fontWeight: '700' },
  back: { alignSelf: 'flex-start', backgroundColor: '#F59E0B', borderWidth: 2, borderColor: '#FBBF24', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 5, elevation: 5 },
  backText: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
  variant: { backgroundColor: '#E2E8F0', borderRadius: 10, padding: 12, marginVertical: 4 },
  variantActive: { backgroundColor: '#22C55E' },
  variantText: { color: '#0F172A', fontWeight: '700' },
  disabled: { opacity: 0.45 },
  qty: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F172A', borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#F8FAFC', fontSize: 22, lineHeight: 24, fontWeight: '900' },
  qtyNumber: { color: '#0F172A', fontWeight: '800', minWidth: 30, textAlign: 'center' },
  remove: { backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  removeText: { color: '#DC2626', fontWeight: '800' },
  address: { backgroundColor: '#334155', borderRadius: 10, padding: 12, marginVertical: 4 },
  addressActive: { borderWidth: 2, borderColor: '#22C55E' },
  total: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginVertical: 8 },
  timeline: { color: '#334155', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingVertical: 8 },
  question: { backgroundColor: '#E2E8F0', borderRadius: 10, padding: 10, marginVertical: 5 },
  read: { opacity: 0.72 },
  compareCard: { width: 220, marginRight: 10 },
  empty: { backgroundColor: '#1E293B', borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyText: { color: '#CBD5E1', textAlign: 'center' },
  error: { color: '#FCA5A5', marginTop: 8, fontWeight: '700' },
  tabs: { maxHeight: 58 },
  tabsContent: { gap: 6, paddingBottom: 8 },
  tab: { backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  tabActive: { backgroundColor: '#22C55E' },
  tabText: { color: '#F8FAFC', fontWeight: '700' },
  status: { backgroundColor: '#F59E0B', color: '#0F172A', borderRadius: 10, padding: 10, fontWeight: '700' },
});
