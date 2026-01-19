# Guía de Despliegue - ZipGrade Sonora

## 📋 Pasos para Subir a GitHub

### 1. Verificar que Git está configurado

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

### 2. Subir el código a GitHub

Ya hemos inicializado el repositorio y agregado el remoto. Ahora solo necesitas hacer push:

```bash
git push -u origin main
```

Si GitHub te pide autenticación, puedes usar:
- **Personal Access Token** (recomendado): Ve a GitHub Settings > Developer settings > Personal access tokens > Generate new token
- O usa GitHub CLI: `gh auth login`

### 3. Verificar en GitHub

Ve a https://github.com/supervisionzonax/SECgrade y verifica que todos los archivos estén subidos.

---

## 🚀 Despliegue en Vercel

### Opción 1: Desde la Web de Vercel (Recomendado)

1. Ve a https://vercel.com/supervisionzonaxs-projects
2. Haz clic en "Add New Project"
3. Selecciona el repositorio `supervisionzonax/SECgrade`
4. Vercel detectará automáticamente que es un proyecto Next.js
5. Configuración automática:
   - **Framework Preset**: Next.js (detectado automáticamente)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `.next` (automático)
   - **Install Command**: `npm install` (automático)
6. Haz clic en "Deploy"
7. Espera a que termine el despliegue (2-3 minutos)
8. ¡Listo! Tu sitio estará disponible en una URL como: `https://secgrade.vercel.app`

### Opción 2: Desde la Terminal (CLI)

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Inicia sesión:
```bash
vercel login
```

3. Despliega:
```bash
vercel
```

4. Sigue las instrucciones en pantalla

### Opción 3: Integración Automática con GitHub

Una vez que conectes el repositorio en Vercel:
- Cada push a la rama `main` desplegará automáticamente
- Los pull requests crearán preview deployments
- Todo es automático, no necesitas hacer nada más

---

## ⚙️ Configuración de Vercel

### Variables de Entorno (si las necesitas)

Si en el futuro necesitas variables de entorno:
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega las variables necesarias

### Dominio Personalizado (Opcional)

1. Ve a Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

---

## 🔄 Actualizaciones Futuras

Para actualizar el sitio después de hacer cambios:

```bash
# 1. Haz tus cambios en el código
# 2. Agrega los archivos modificados
git add .

# 3. Haz commit
git commit -m "Descripción de los cambios"

# 4. Sube a GitHub
git push origin main

# 5. Vercel desplegará automáticamente (si está configurado)
```

---

## 📝 Notas Importantes

- **Next.js está optimizado para Vercel**: No necesitas configuración adicional
- **Build automático**: Vercel ejecuta `npm run build` automáticamente
- **Deployments instantáneos**: Cada push genera un nuevo deployment
- **Preview deployments**: Los pull requests crean URLs de preview automáticamente

---

## 🆘 Solución de Problemas

### Error en el build
- Verifica que `npm run build` funciona localmente
- Revisa los logs en Vercel Dashboard > Deployments

### Variables de entorno faltantes
- Agrega las variables en Vercel Dashboard > Settings > Environment Variables

### Problemas con rutas
- Verifica que `next.config.js` esté configurado correctamente
- Asegúrate de que las rutas API estén en `app/api/`

---

¡Tu aplicación estará en línea en minutos! 🎉
