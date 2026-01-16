# ZipGrade Sonora

Plataforma web moderna para gestionar listas de estudiantes y resultados de exámenes, compatible al 100% con ZipGrade. Desarrollada para la Secretaría de Educación y Cultura del Gobierno del Estado de Sonora.

## 🚀 Características

- **Crear Listas para ZipGrade**: Descarga plantillas Excel, completa los datos de estudiantes por grupo y genera archivos CSV perfectos para importar en ZipGrade
- **Procesar Resultados**: Sube archivos de resultados exportados desde ZipGrade y obtén reportes organizados por grupos con calificaciones detalladas
- **Interfaz Moderna**: Diseño UX/UI profesional, intuitivo y fácil de usar
- **100% Responsive**: Funciona perfectamente en desktop, tablet y móvil
- **Procesamiento Automático**: Todo el procesamiento se realiza de forma automática y eficiente

## 🛠️ Tecnologías

- **Next.js 14** - Framework React para producción
- **React 18** - Biblioteca de UI
- **XLSX** - Procesamiento de archivos Excel
- **CSS Modules** - Estilos modulares y responsivos

## 📋 Requisitos Previos

- Node.js 18.0 o superior
- npm o yarn

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/supervisionzonax/SECgrade.git
cd SECgrade
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🌐 Despliegue

### Vercel

Este proyecto está optimizado para desplegarse en Vercel:

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente que es un proyecto Next.js
3. El despliegue se realizará automáticamente en cada push a la rama principal

O usa el CLI de Vercel:
```bash
npm i -g vercel
vercel
```

## 📝 Uso

### Crear Listas para ZipGrade

1. Ve a la sección "Crear Listas"
2. Descarga la plantilla Excel
3. Completa los datos: una hoja por grupo, columna A para apellidos, columna B para nombres
4. El nombre de cada hoja debe ser el nombre del grupo (ej: "1A", "1B")
5. Sube el archivo completado
6. Configura el grado y nombre de la clase
7. Revisa y ajusta los External Refs si es necesario
8. Genera y descarga el archivo CSV para ZipGrade

### Procesar Resultados

1. Ve a la sección "Procesar Resultados"
2. Exporta tus resultados desde ZipGrade (Excel, CSV u ODS)
3. Sube el archivo en la plataforma
4. Haz clic en "Procesar Resultados"
5. Visualiza los resultados organizados por grupos
6. Descarga el Excel formateado o exporta a CSV

## 🏛️ Institución

**Secretaría de Educación y Cultura**  
Gobierno del Estado de Sonora

## 📄 Licencia

Este proyecto es propiedad de la Secretaría de Educación y Cultura del Gobierno del Estado de Sonora.

## 👥 Contribuidores

Desarrollado para la Secretaría de Educación y Cultura del Gobierno del Estado de Sonora.

---

Hecho con ❤️ para mejorar la gestión educativa en Sonora
