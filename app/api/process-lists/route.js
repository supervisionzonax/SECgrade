import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const grado = formData.get('grado')
    const className = formData.get('className')
    const grupos = JSON.parse(formData.get('grupos'))
    const externalRefs = JSON.parse(formData.get('externalRefs') || '{}')
    const startStudentId = parseInt(formData.get('startStudentId') || '1', 10)

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    const validExtensions = ['.xlsx', '.xls', '.csv', '.ods']
    const fileExtension = '.' + file.name.toLowerCase().split('.').pop()
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Formato de archivo no válido. Use: ${validExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    let workbook
    
    try {
      if (fileExtension === '.csv') {
        const data = new TextDecoder('utf-8').decode(buffer)
        workbook = XLSX.read(data, { 
          type: 'string',
          codepage: 65001,
          raw: false,
          cellDates: true,
          dense: false
        })
      } else {
        workbook = XLSX.read(buffer, { 
          type: 'buffer',
          cellDates: true,
          cellStyles: false,
          dense: false
        })
      }
    } catch (readError) {
      console.error('Error al leer archivo:', readError)
      return NextResponse.json(
        { 
          error: 'No se pudo leer el archivo. Verifique que no esté corrupto.',
          details: process.env.NODE_ENV === 'development' ? readError.message : undefined
        },
        { status: 400 }
      )
    }
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: 'El archivo no contiene hojas válidas.' },
        { status: 400 }
      )
    }

    const resultados = []
    let studentCounter = startStudentId || 1

    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
      
      if (!data || data.length === 0) return
      
      const hasApellidosHeader = data[0]?.[0]?.toString().toLowerCase().includes('apellido')
      const hasNombresHeader = data[0]?.[1]?.toString().toLowerCase().includes('nombre')
      const startRow = (hasApellidosHeader && hasNombresHeader) ? 1 : 0
      
      let apellidosIndex = 0
      let nombresIndex = 1
      
      if (startRow === 0 && data[0]) {
        const primeraFila = data[0]
        primeraFila?.forEach((cell, idx) => {
          const cellStr = (cell || '').toString().toLowerCase()
          if (cellStr.includes('apellido')) apellidosIndex = idx
          if (cellStr.includes('nombre') && !cellStr.includes('apellido')) nombresIndex = idx
        })
      }

      const grupoKey = grupos[index] || sheetName || `Grupo${index + 1}`
      const externalRef = externalRefs[grupoKey] || externalRefs[sheetName] || `Z1EST5M${grupoKey.match(/(\d+[A-Za-z])/)?.[0] || grupoKey}`
      
      for (let i = startRow; i < data.length; i++) {
        const row = data[i]
        if (row && Array.isArray(row) && row.length >= Math.max(apellidosIndex, nombresIndex) + 1) {
          const apellidos = (row[apellidosIndex] || '').toString().trim()
          const nombres = (row[nombresIndex] || '').toString().trim()
          
          if (apellidos || nombres) {
            resultados.push({
              'Student ID': studentCounter,
              'External Ref.': externalRef,
              'First Name': nombres,
              'Last Name': apellidos,
              'Grade': grado,
              'Class Name': className
            })
            
            studentCounter++
          }
        }
      }
    })

    if (resultados.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron datos de estudiantes en el archivo' },
        { status: 400 }
      )
    }

    // Función para escapar correctamente los valores CSV y preservar UTF-8
    const escapeCSVValue = (value) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      // Si contiene comillas, comas o saltos de línea, envolver en comillas y escapar comillas internas
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Generar CSV con UTF-8 BOM para que Excel lo reconozca correctamente
    const csvRows = [
      'Student ID,External Ref.,First Name,Last Name,Grade,Class Name',
      ...resultados.map(row => 
        [
          row['Student ID'],
          escapeCSVValue(row['External Ref.']),
          escapeCSVValue(row['First Name']),
          escapeCSVValue(row['Last Name']),
          escapeCSVValue(row.Grade),
          escapeCSVValue(row['Class Name'])
        ].join(',')
      )
    ]
    
    // Agregar BOM UTF-8 al inicio para que Excel reconozca la codificación
    const BOM = '\uFEFF'
    const csvContent = BOM + csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="zipgrade_${grado}_${className}_${new Date().getTime()}.csv"`
      }
    })

  } catch (error) {
    console.error('Error en process-lists:', error)
    return NextResponse.json(
      { 
        error: 'Error procesando el archivo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}