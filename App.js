import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productosIniciales } from './data/productos';

const brand = {
  name: 'ProQuo',
  slogan: 'Tu marketplace para elegir mejor cada día',
};

const categoriaOptions = [
  'Tecnología',
  'Hogar',
  'Moda',
  'Deporte',
  'Mascotas',
  'Belleza',
  'Juguetes',
  'Papelería',
];

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const getAverageRating = (reviews = []) => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return total / reviews.length;
};

const getInitialCatalog = () =>
  productosIniciales.map((producto) => ({
    ...producto,
    reviews: producto.reviews || [
      { rating: 5, comment: 'Muy buena experiencia.' },
      { rating: 4, comment: 'Buen valor por el precio.' },
    ],
  }));

const emptyBuyerForm = {
  name: '',
  phone: '',
  municipality: '',
  address: '',
};

const emptySellerForm = {
  id: '',
  nombre: '',
  categoria: 'Tecnología',
  precio: '',
  stock: '',
  descripcion: '',
};

export default function App() {
  const [section, setSection] = useState('catalog');
  const [products, setProducts] = useState(getInitialCatalog);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [history, setHistory] = useState([]);
  const [buyerForm, setBuyerForm] = useState(emptyBuyerForm);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [sellerForm, setSellerForm] = useState(emptySellerForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: '' });
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const raw = await AsyncStorage.getItem('proquo-state');
        if (!raw) {
          setHasLoaded(true);
          return;
        }

        const parsed = JSON.parse(raw);
        if (parsed.products && parsed.products.length) setProducts(parsed.products);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.buyerForm) setBuyerForm(parsed.buyerForm);
      } catch (error) {
        console.log('No se pudo cargar el estado local', error);
      } finally {
        setHasLoaded(true);
      }
    };

    loadStoredState();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const persistState = async () => {
      try {
        await AsyncStorage.setItem(
          'proquo-state',
          JSON.stringify({
            products,
            favorites,
            cart,
            history,
            buyerForm,
          }),
        );
      } catch (error) {
        console.log('No se pudo guardar el estado local', error);
      }
    };

    persistState();
  }, [products, favorites, cart, history, buyerForm, hasLoaded]);

  const categories = useMemo(
    () => ['Todas', ...new Set(products.map((producto) => producto.categoria))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    let result = products.filter((producto) => {
      const matchesCategory =
        selectedCategory === 'Todas' || producto.categoria === selectedCategory;
      const matchesSearch =
        !normalizedSearch ||
        producto.nombre.toLowerCase().includes(normalizedSearch) ||
        producto.descripcion.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === 'desc') return b.precio - a.precio;
      return a.precio - b.precio;
    });

    return result;
  }, [products, searchText, selectedCategory, sortOrder]);

  const selectedProduct =
    products.find((producto) => producto.id === selectedProductId) || null;

  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((producto) => producto.id === item.productId);
    return sum + (product ? product.precio * item.quantity : 0);
  }, 0);

  const shippingCost = cart.length === 0 ? 0 : subtotal >= 150000 ? 0 : 8000;
  const couponDiscount = couponApplied && subtotal > 0 ? subtotal * 0.1 : 0;
  const total = Math.max(subtotal + shippingCost - couponDiscount, 0);

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
    setStatusMessage('Cambio realizado en favoritos.');
  };

  const addToCart = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      setStatusMessage('Este producto está agotado.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      const currentQuantity = existing ? existing.quantity : 0;

      if (currentQuantity >= product.stock) {
        setStatusMessage('No puedes agregar más unidades de este producto.');
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { productId, quantity: 1 }];
    });

    setStatusMessage(`${product.nombre} agregado al carrito.`);
  };

  const updateCartQuantity = (productId, delta) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (!existing) return prev;

      const nextQuantity = existing.quantity + delta;
      if (nextQuantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }

      if (nextQuantity > product.stock) {
        setStatusMessage('No hay suficiente stock disponible.');
        return prev;
      }

      if (delta > 0) {
        setStatusMessage('Cantidad aumentada.');
      } else {
        setStatusMessage('Cantidad actualizada.');
      }

      return prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: nextQuantity }
          : item,
      );
    });
  };

  const handleConfirmPurchase = () => {
    if (!cart.length) {
      setStatusMessage('Tu carrito está vacío.');
      return;
    }

    const missingFields = [];
    if (!buyerForm.name.trim()) missingFields.push('nombre');
    if (!buyerForm.phone.trim()) missingFields.push('teléfono');
    if (!buyerForm.municipality.trim()) missingFields.push('municipio');
    if (!buyerForm.address.trim()) missingFields.push('dirección');

    if (missingFields.length) {
      setStatusMessage(`Falta información obligatoria: ${missingFields.join(', ')}.`);
      return;
    }

    for (const item of cart) {
      const product = products.find((producto) => producto.id === item.productId);
      if (!product || item.quantity > product.stock) {
        setStatusMessage('Hay un producto sin stock suficiente para confirmar la compra.');
        return;
      }
    }

    const orderId = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      buyer: { ...buyerForm },
      items: cart.map((item) => {
        const product = products.find((producto) => producto.id === item.productId);
        return {
          productId: item.productId,
          nombre: product?.nombre || 'Producto',
          quantity: item.quantity,
          unitPrice: product?.precio || 0,
        };
      }),
      subtotal,
      shipping: shippingCost,
      discount: couponDiscount,
      total,
    };

    setProducts((prev) =>
      prev.map((product) => {
        const item = cart.find((entry) => entry.productId === product.id);
        if (!item) return product;
        return { ...product, stock: product.stock - item.quantity };
      }),
    );

    setHistory((prev) => [order, ...prev]);
    setCart([]);
    setBuyerForm(emptyBuyerForm);
    setCouponInput('');
    setCouponApplied(false);
    setStatusMessage(`Compra confirmada. Código del pedido: ${orderId}. Es una simulación local.`);
  };

  const applyCoupon = () => {
    if (couponInput.trim().toUpperCase() === 'BIENVENIDO10') {
      setCouponApplied(true);
      setStatusMessage('Cupón aplicado con descuento del 10%.');
      return;
    }

    setCouponApplied(false);
    setStatusMessage('Cupón inválido. Intenta con BIENVENIDO10.');
  };

  const saveProduct = () => {
    const nombre = sellerForm.nombre.trim();
    const descripcion = sellerForm.descripcion.trim();
    const precio = Number(sellerForm.precio);
    const stock = Number(sellerForm.stock);
    const id = sellerForm.id.trim();

    if (!id || !nombre || descripcion.length < 15 || precio <= 0 || stock < 0) {
      setStatusMessage('Revisa los datos del producto: precio positivo, stock válido y descripción de al menos 15 caracteres.');
      return;
    }

    const exists = products.some((item) => item.id === id && item.id !== editingProductId);
    if (exists) {
      setStatusMessage('Ya existe un producto con ese código.');
      return;
    }

    if (editingProductId) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                id,
                nombre,
                categoria: sellerForm.categoria,
                precio,
                stock,
                descripcion,
              }
            : product,
        ),
      );
      setStatusMessage('Producto actualizado correctamente.');
    } else {
      const newProduct = {
        id,
        nombre,
        categoria: sellerForm.categoria,
        precio,
        stock,
        descripcion,
        iniciales: nombre
          .split(' ')
          .slice(0, 2)
          .map((word) => word.slice(0, 1).toUpperCase())
          .join(''),
        reviews: [],
      };

      setProducts((prev) => [...prev, newProduct]);
      setStatusMessage('Producto registrado en el catálogo.');
    }

    setSellerForm(emptySellerForm);
    setEditingProductId(null);
  };

  const editSellerProduct = (product) => {
    setSellerForm({
      id: product.id,
      nombre: product.nombre,
      categoria: product.categoria,
      precio: String(product.precio),
      stock: String(product.stock),
      descripcion: product.descripcion,
    });
    setEditingProductId(product.id);
    setSection('seller');
  };

  const deleteSellerProduct = (productId) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    setStatusMessage('Producto eliminado del catálogo.');
  };

  const addReview = () => {
    if (!selectedProduct) return;
    if (!Number.isInteger(reviewDraft.rating) || reviewDraft.rating < 1 || reviewDraft.rating > 5) {
      setStatusMessage('La valoración debe estar entre 1 y 5 estrellas.');
      return;
    }
    if (!reviewDraft.comment.trim()) {
      setStatusMessage('Escribe una reseña para guardar la valoración.');
      return;
    }

    setProducts((prev) =>
      prev.map((product) =>
        product.id === selectedProduct.id
          ? {
              ...product,
              reviews: [
                ...(product.reviews || []),
                {
                  rating: reviewDraft.rating,
                  comment: reviewDraft.comment.trim(),
                },
              ],
            }
          : product,
      ),
    );

    setReviewDraft({ rating: 5, comment: '' });
    setStatusMessage('Tu reseña quedó registrada.');
  };

  const renderCatalog = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.brandTitle}>{brand.name}</Text>
      <Text style={styles.tagline}>{brand.slogan}</Text>

      <View style={styles.searchBox}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar productos"
          style={styles.input}
          placeholderTextColor="#64748B"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <Pressable
          onPress={() => setSortOrder('asc')}
          style={[styles.sortButton, sortOrder === 'asc' && styles.sortButtonActive]}
        >
          <Text style={styles.sortButtonText}>Menor a mayor</Text>
        </Pressable>
        <Pressable
          onPress={() => setSortOrder('desc')}
          style={[styles.sortButton, sortOrder === 'desc' && styles.sortButtonActive]}
        >
          <Text style={styles.sortButtonText}>Mayor a menor</Text>
        </Pressable>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No encontramos productos</Text>
          <Text style={styles.emptyText}>Prueba otra búsqueda o cambia la categoría.</Text>
        </View>
      ) : (
        filteredProducts.map((producto) => {
          const isFavorite = favorites.includes(producto.id);
          const rating = getAverageRating(producto.reviews);

          return (
            <Pressable
              key={producto.id}
              style={styles.productCard}
              onPress={() => setSelectedProductId(producto.id)}
            >
              <View style={styles.productHeader}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{producto.iniciales}</Text>
                </View>
                <Pressable
                  onPress={() => toggleFavorite(producto.id)}
                  style={styles.favoriteButton}
                >
                  <Text style={styles.favoriteIcon}>{isFavorite ? '★' : '☆'}</Text>
                </Pressable>
              </View>

              <Text style={styles.productName}>{producto.nombre}</Text>
              <Text style={styles.productMeta}>{producto.categoria}</Text>
              <Text style={styles.productPrice}>{formatCOP(producto.precio)}</Text>
              <Text style={styles.stockText}>
                {producto.stock > 0 ? `Disponible: ${producto.stock} und.` : 'Agotado'}
              </Text>
              <Text style={styles.ratingText}>Valoración: {rating.toFixed(1)} / 5</Text>
              <Text style={styles.productDescription}>{producto.descripcion}</Text>

              <Pressable onPress={() => addToCart(producto.id)} style={styles.addButton}>
                <Text style={styles.addButtonText}>Agregar al carrito</Text>
              </Pressable>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const renderDetail = () => {
    if (!selectedProduct) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.emptyTitle}>Selecciona un producto</Text>
        </View>
      );
    }

    const isFavorite = favorites.includes(selectedProduct.id);
    const rating = getAverageRating(selectedProduct.reviews || []);

    return (
      <View style={styles.sectionContainer}>
        <Pressable style={styles.backButton} onPress={() => setSelectedProductId(null)}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>

        <View style={styles.detailCard}>
          <View style={[styles.avatarBox, styles.detailAvatar]}>
            <Text style={styles.avatarText}>{selectedProduct.iniciales}</Text>
          </View>

          <Text style={styles.brandTitle}>{selectedProduct.nombre}</Text>
          <Text style={styles.productMeta}>{selectedProduct.categoria}</Text>
          <Text style={styles.productPrice}>{formatCOP(selectedProduct.precio)}</Text>
          <Text style={styles.stockText}>
            {selectedProduct.stock > 0 ? `Stock disponible: ${selectedProduct.stock}` : 'Producto agotado'}
          </Text>
          <Text style={styles.ratingText}>Valoración media: {rating.toFixed(1)} / 5</Text>
          <Text style={styles.productDescription}>{selectedProduct.descripcion}</Text>

          <View style={styles.detailActions}>
            <Pressable
              style={[styles.addButton, selectedProduct.stock <= 0 && styles.disabledButton]}
              onPress={() => addToCart(selectedProduct.id)}
              disabled={selectedProduct.stock <= 0}
            >
              <Text style={styles.addButtonText}>
                {selectedProduct.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.favoriteButtonLarge, isFavorite && styles.favoriteButtonActive]}
              onPress={() => toggleFavorite(selectedProduct.id)}
            >
              <Text style={styles.favoriteButtonText}>{isFavorite ? 'Quitar favorito' : 'Favorito'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.reviewBox}>
          <Text style={styles.sectionTitle}>Reseñas</Text>
          {selectedProduct.reviews && selectedProduct.reviews.length ? (
            selectedProduct.reviews.map((review, index) => (
              <View key={`${review.rating}-${index}`} style={styles.reviewItem}>
                <Text style={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                <Text style={styles.reviewText}>{review.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aún no hay reseñas para este producto.</Text>
          )}

          <TextInput
            placeholder="Escribe tu reseña"
            value={reviewDraft.comment}
            onChangeText={(text) => setReviewDraft((prev) => ({ ...prev, comment: text }))}
            style={styles.input}
            placeholderTextColor="#64748B"
          />

          <View style={styles.ratingSelector}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setReviewDraft((prev) => ({ ...prev, rating: star }))}
                style={[styles.starButton, reviewDraft.rating === star && styles.starButtonActive]}
              >
                <Text style={styles.starText}>{star}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={addReview} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Guardar reseña</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderFavorites = () => {
    const savedFavorites = products.filter((producto) => favorites.includes(producto.id));

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Favoritos</Text>
        {savedFavorites.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No tienes productos guardados</Text>
            <Text style={styles.emptyText}>Vuelve al catálogo y marca tus favoritos.</Text>
          </View>
        ) : (
          savedFavorites.map((producto) => (
            <View key={producto.id} style={styles.productCard}>
              <Text style={styles.productName}>{producto.nombre}</Text>
              <Text style={styles.productMeta}>{producto.categoria}</Text>
              <Text style={styles.productPrice}>{formatCOP(producto.precio)}</Text>
              <Text style={styles.stockText}>
                {producto.stock > 0 ? `${producto.stock} unidades disponibles` : 'Sin stock'}
              </Text>
              <View style={styles.detailActions}>
                <Pressable onPress={() => setSelectedProductId(producto.id)} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Ver detalle</Text>
                </Pressable>
                <Pressable onPress={() => addToCart(producto.id)} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Agregar</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderCart = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Carrito</Text>

      {cart.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyText}>Agrega productos para simular la compra.</Text>
        </View>
      ) : (
        <>
          {cart.map((item) => {
            const product = products.find((producto) => producto.id === item.productId);
            if (!product) return null;

            return (
              <View key={item.productId} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.nombre}</Text>
                  <Text style={styles.productPrice}>{formatCOP(product.precio)}</Text>
                  <Text style={styles.stockText}>Stock disponible: {product.stock}</Text>
                </View>

                <View style={styles.quantityBox}>
                  <Pressable onPress={() => updateCartQuantity(item.productId, -1)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable onPress={() => updateCartQuantity(item.productId, 1)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLine}>Subtotal: {formatCOP(subtotal)}</Text>
            <Text style={styles.summaryLine}>Envío: {shippingCost === 0 ? 'Gratis' : formatCOP(shippingCost)}</Text>
            <Text style={styles.summaryLine}>Descuento: {formatCOP(couponDiscount)}</Text>
            <Text style={[styles.summaryLine, styles.totalLine]}>Total: {formatCOP(total)}</Text>
          </View>

          <View style={styles.couponBox}>
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Código promocional"
              style={styles.input}
              placeholderTextColor="#64748B"
            />
            <Pressable onPress={applyCoupon} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Aplicar</Text>
            </Pressable>
          </View>

          <View style={styles.formBox}>
            <Text style={styles.sectionTitle}>Datos del comprador</Text>
            <TextInput
              value={buyerForm.name}
              onChangeText={(text) => setBuyerForm((prev) => ({ ...prev, name: text }))}
              placeholder="Nombre completo"
              style={styles.input}
              placeholderTextColor="#64748B"
            />
            <TextInput
              value={buyerForm.phone}
              onChangeText={(text) => setBuyerForm((prev) => ({ ...prev, phone: text }))}
              placeholder="Teléfono"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#64748B"
            />
            <TextInput
              value={buyerForm.municipality}
              onChangeText={(text) => setBuyerForm((prev) => ({ ...prev, municipality: text }))}
              placeholder="Municipio"
              style={styles.input}
              placeholderTextColor="#64748B"
            />
            <TextInput
              value={buyerForm.address}
              onChangeText={(text) => setBuyerForm((prev) => ({ ...prev, address: text }))}
              placeholder="Dirección de entrega"
              multiline
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#64748B"
            />
          </View>

          <Pressable onPress={handleConfirmPurchase} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Confirmar compra</Text>
          </Pressable>
        </>
      )}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Historial</Text>
      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No hay pedidos registrados</Text>
          <Text style={styles.emptyText}>Cuando confirmes una compra, aparecerá aquí.</Text>
        </View>
      ) : (
        history.map((order) => (
          <View key={order.id} style={styles.historyCard}>
            <Text style={styles.productName}>{order.id}</Text>
            <Text style={styles.productMeta}>{new Date(order.createdAt).toLocaleString('es-CO')}</Text>
            <Text style={styles.productPrice}>{formatCOP(order.total)}</Text>
            <Text style={styles.reviewText}>Cliente: {order.buyer.name}</Text>
            {order.items.map((item) => (
              <Text key={`${order.id}-${item.productId}`} style={styles.reviewText}>
                {item.nombre} x {item.quantity}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  );

  const renderSeller = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Panel del vendedor</Text>
      <View style={styles.formBox}>
        <TextInput
          value={sellerForm.id}
          onChangeText={(text) => setSellerForm((prev) => ({ ...prev, id: text }))}
          placeholder="ID del producto"
          style={styles.input}
          placeholderTextColor="#64748B"
        />
        <TextInput
          value={sellerForm.nombre}
          onChangeText={(text) => setSellerForm((prev) => ({ ...prev, nombre: text }))}
          placeholder="Nombre del producto"
          style={styles.input}
          placeholderTextColor="#64748B"
        />

        <TextInput
          value={sellerForm.precio}
          onChangeText={(text) => setSellerForm((prev) => ({ ...prev, precio: text }))}
          placeholder="Precio en COP"
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#64748B"
        />
        <TextInput
          value={sellerForm.stock}
          onChangeText={(text) => setSellerForm((prev) => ({ ...prev, stock: text }))}
          placeholder="Stock"
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#64748B"
        />

        <TextInput
          value={sellerForm.descripcion}
          onChangeText={(text) => setSellerForm((prev) => ({ ...prev, descripcion: text }))}
          placeholder="Descripción (mínimo 15 caracteres)"
          multiline
          style={[styles.input, styles.textArea]}
          placeholderTextColor="#64748B"
        />

        <Text style={styles.fieldLabel}>Categoría</Text>
        <View style={styles.categoryGrid}>
          {categoriaOptions.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSellerForm((prev) => ({ ...prev, categoria: category }))}
              style={[
                styles.categoryChip,
                sellerForm.categoria === category && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  sellerForm.categoria === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={saveProduct} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {editingProductId ? 'Actualizar producto' : 'Registrar producto'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Productos actuales</Text>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.nombre}</Text>
            <Text style={styles.productMeta}>{product.categoria}</Text>
            <Text style={styles.productPrice}>{formatCOP(product.precio)}</Text>
            <Text style={styles.stockText}>Stock: {product.stock}</Text>
            <View style={styles.detailActions}>
              <Pressable onPress={() => editSellerProduct(product)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Editar</Text>
              </Pressable>
              <Pressable onPress={() => deleteSellerProduct(product.id)} style={styles.addButton}>
                <Text style={styles.addButtonText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSection = () => {
    if (selectedProduct && section === 'catalog') return renderDetail();
    if (section === 'catalog') return renderCatalog();
    if (section === 'favorites') return renderFavorites();
    if (section === 'cart') return renderCart();
    if (section === 'history') return renderHistory();
    if (section === 'seller') return renderSeller();
    return renderCatalog();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {[
            { id: 'catalog', label: 'Catálogo' },
            { id: 'favorites', label: 'Favoritos' },
            { id: 'cart', label: 'Carrito' },
            { id: 'history', label: 'Historial' },
            { id: 'seller', label: 'Vendedor' },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setSection(tab.id)}
              style={[styles.tabButton, section === tab.id && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, section === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          style={styles.screenScroll}
          contentContainerStyle={styles.screenScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderSection()}
        </ScrollView>

        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  sectionContainer: {
    paddingBottom: 12,
  },
  screenScroll: {
    flex: 1,
    marginRight: -16,
  },
  screenScrollContent: {
    flexGrow: 1,
    paddingRight: 16,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  tagline: {
    color: '#CBD5E1',
    fontSize: 15,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchBox: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    marginBottom: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryChipText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#0F172A',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#F59E0B',
  },
  sortButtonText: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatar: {
    width: 80,
    height: 80,
    marginBottom: 14,
  },
  avatarText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 18,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#F59E0B',
  },
  favoriteButtonLarge: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  favoriteButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#F59E0B',
  },
  productName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  productMeta: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 6,
  },
  productPrice: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  stockText: {
    color: '#0F172A',
    fontSize: 13,
    marginBottom: 4,
  },
  ratingText: {
    color: '#0F172A',
    fontSize: 13,
    marginBottom: 8,
  },
  productDescription: {
    color: '#334155',
    fontSize: 14,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  emptyBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#CBD5E1',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 8,
    marginTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: '#22C55E',
  },
  tabText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  statusText: {
    backgroundColor: '#F59E0B',
    color: '#0F172A',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  reviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 18,
    marginBottom: 4,
  },
  reviewText: {
    color: '#334155',
    fontSize: 13,
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    backgroundColor: '#F59E0B',
  },
  starText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0F172A',
    fontWeight: '800',
  },
  cartItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  qtyText: {
    color: '#0F172A',
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  summaryLine: {
    color: '#0F172A',
    fontSize: 15,
    marginBottom: 6,
  },
  totalLine: {
    fontWeight: '800',
    fontSize: 18,
  },
  couponBox: {
    marginBottom: 14,
  },
  formBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
});
