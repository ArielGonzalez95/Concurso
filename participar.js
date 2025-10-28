import { supabase } from './supabaseClient.js'

const form = document.getElementById('form-inscripcion')
const inputArchivo = document.getElementById('subir-foto')
const preview = document.getElementById('preview')
const mensaje = document.getElementById('mensaje')

// Verifica si ya participó
if (localStorage.getItem('participacion')) {
  form.style.display = 'none'
  mensaje.innerHTML = '✅ Ya participaste. Gracias por enviar tu foto!'
}

let fotoBlob = null

// Subir foto desde input
inputArchivo.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    fotoBlob = file
    preview.src = URL.createObjectURL(file)
    preview.style.display = 'block'
  }
})

// Enviar formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (localStorage.getItem('participacion')) return

  const nombre = document.getElementById('nombre').value.trim()
  if (!fotoBlob) return alert('Primero seleccioná una foto')

  const fileName = `${Date.now()}_${nombre}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('disfraces')
    .upload(fileName, fotoBlob, { contentType: 'image/jpeg' })

  if (uploadError) return alert('Error subiendo imagen: ' + uploadError.message)

  const { data: publicUrl } = supabase.storage
    .from('disfraces')
    .getPublicUrl(fileName)

  const { error: insertError } = await supabase
    .from('participantes')
    .insert([{ nombre, foto_url: publicUrl.publicUrl, votos: 0 }])

  if (insertError) return alert('Error guardando inscripción: ' + insertError.message)

  // Guardamos en localStorage que ya participó
  localStorage.setItem('participacion', 'true')

  mensaje.innerHTML = `✅ Tu foto fue enviada correctamente, ${nombre}! Gracias por participar.`
  form.style.display = 'none'
})
