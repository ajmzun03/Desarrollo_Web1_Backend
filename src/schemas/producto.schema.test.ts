import { describe, it, expect } from 'vitest'
import { schemaProducto, schemaProductoUpdate } from './producto.schema.js'
import { schemaUploadUrl } from './archivo.schema.js'

const base = { categoria_id: 1, unidad_medida_id: 1, producto: 'Tortilla', precio: 15.5 }

describe('schemaProducto imagen_url', () => {
  it('acepta un producto sin imagen', () => {
    expect(schemaProducto.safeParse(base).success).toBe(true)
  })
  it('acepta una URL https y null', () => {
    expect(schemaProducto.safeParse({ ...base, imagen_url: 'https://b.s3.amazonaws.com/uploads/a.png' }).success).toBe(true)
    expect(schemaProducto.safeParse({ ...base, imagen_url: null }).success).toBe(true)
  })
  it('rechaza URL http, texto libre y URLs demasiado largas', () => {
    expect(schemaProducto.safeParse({ ...base, imagen_url: 'http://x.com/a.png' }).success).toBe(false)
    expect(schemaProducto.safeParse({ ...base, imagen_url: 'no-es-url' }).success).toBe(false)
    expect(schemaProducto.safeParse({ ...base, imagen_url: 'https://x.com/' + 'a'.repeat(260) }).success).toBe(false)
  })
  it('permite actualizar solo la imagen', () => {
    expect(schemaProductoUpdate.safeParse({ imagen_url: 'https://x.com/a.png' }).success).toBe(true)
  })
})

describe('schemaUploadUrl fileSize', () => {
  const ok = { fileName: 'a.png', fileType: 'image/png', fileSize: 1000 }
  it('acepta un tamaño válido', () => {
    expect(schemaUploadUrl.safeParse(ok).success).toBe(true)
  })
  it('exige fileSize', () => {
    const { fileSize: _omit, ...sinTamano } = ok
    expect(schemaUploadUrl.safeParse(sinTamano).success).toBe(false)
  })
  it('rechaza más de 5 MB', () => {
    expect(schemaUploadUrl.safeParse({ ...ok, fileSize: 5 * 1024 * 1024 + 1 }).success).toBe(false)
  })
})
