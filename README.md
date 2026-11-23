# ProQuo - Marketplace 2.0

Aplicacion Expo/React Native para comprar productos simulados, administrar variantes,
comparar catalogo, gestionar direcciones y seguimiento posventa.

## Ejecutar

```bash
npm install
npx expo start
```

Para ejecutar en navegador:

```bash
npx expo start --web
```

Los datos son ficticios y se mantienen solo en memoria durante la ejecucion.

## Validacion

```bash
npx expo lint
npx expo export --platform web --output-dir .expo-validation
```

## Matriz HU21-HU32

| HU | Historia | Implementacion | Casos cubiertos |
|---|---|---|---|
| HU21 | Variantes | Detalle de producto y carrito por variante | Seleccion, validacion, cantidad, stock agotado |
| HU22 | Comparador | Catalogo y seccion Comparar | Agregar 2-3, limite 3, retirar |
| HU23 | Filtros combinados | Catalogo: busqueda, categoria, marca, precio y stock | Interseccion, rango invalido, vacio y reset |
| HU24 | Preguntas | Panel de preguntas en detalle | Minimo 10 caracteres, pendiente y respuesta simulada |
| HU25 | Direcciones | Seccion Direcciones y seleccion en carrito | Crear, principal, editar y seleccion obligatoria |
| HU26 | Envio | Resumen del carrito | Mosquera/Funza/Madrid, estandar/expres y recalculo |
| HU27 | Seguimiento | Detalle de pedido con historial | Estados secuenciales y bloqueo final |
| HU28 | Cancelacion | Pedido confirmado/preparando y reintegro | Confirmacion, bloqueo y reintegro unico |
| HU29 | Notificaciones | Centro Avisos | Cambio de estado, lectura y ausencia de duplicados |
| HU30 | Reposicion | Suscripcion y simulacion de reposicion | Suscripcion unica, aviso y cancelacion |
| HU31 | Recomendaciones | Bloque relacionado en detalle | Misma categoria, excluir actual y excluir agotados |
| HU32 | Soporte | Centro Ayuda y tickets | Pedido/motivo/descripcion, caso unico y respuesta simulada |
