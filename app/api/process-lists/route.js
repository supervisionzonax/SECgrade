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

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de archivo no válido. Solo se aceptan Excel (.xlsx, .xls) o CSV' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    let workbook
    
    if (file.type === 'text/csv') {
      const data = new TextDecoder().decode(buffer)
      workbook = XLSX.read(data, { type: 'string' })
    } else {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    }

    const resultados = []
    let studentCounter = startStudentId || 1

    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (data.length < 2) return
      
      const hasApellidosHeader = data[0]?.[0]?.toString().toLowerCase().includes('apellido')
      const hasNombresHeader = data[0]?.[1]?.toString().toLowerCase().includes('nombre')
      const startRow = (hasApellidosHeader && hasNombresHeader) ? 1 : 0
      
      let apellidosIndex = 0
      let nombresIndex = 1
      
      if (startRow === 0) {
        const primeraFila = data[0]
        primeraFila?.forEach((cell, idx) => {
          const cellStr = cell?.toString().toLowerCase() || ''
          if (cellStr.includes('apellido')) apellidosIndex = idx
          if (cellStr.includes('nombre') && !cellStr.includes('apellido')) nombresIndex = idx
        })
      }

      const grupoKey = grupos[index] || `Grupo${index + 1}`
      const externalRef = externalRefs[grupoKey] || `Z1EST5M${grupoKey}`
      
      for (let i = startRow; i < data.length; i++) {
        const row = data[i]
        if (row && row.length >= Math.max(apellidosIndex, nombresIndex) + 1) {
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

    const csvContent = [
      'Student ID,External Ref.,First Name,Last Name,Grade,Class Name',
      ...resultados.map(row => 
        `${row['Student ID']},${row['External Ref.']},"${row['First Name']}","${row['Last Name']}",${row.Grade},${row['Class Name']}`
      )
    ].join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="zipgrade_${grado}_${className}_${new Date().getTime()}.csv"`
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error procesando el archivo',
        details: error.message 
      },
      { status: 500 }
    )
  }
}