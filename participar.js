import { supabase } from './supabaseClient.js'

const video = document.getElementById('camara')
const canvas = document.getElementById('fotoCanvas')
const btnCamara = document.getElementById('usar-camara')
const btnCapturar = document.getElementById('btn-capturar')
const btnCambiar = document.getElementById('cambiar-camara')
const inputArchivo = document.getElementById('subir-foto')
const preview = document.getElementById('preview')
const form = document.getElementById('form-inscripcion')
const mensaje = document.getElementById('mensaje-participacion')

let fotoBlob = null
let currentFacingMode = 'user' // frontal

// Si ya participó
if (localStorage.getItem('participante')) {
  mensaje.innerHTML = '✅ Ya enviaste tu participación. Gracias por participar!'
  form.style.display = 'none'
}

// Iniciar cámara
async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode }
    })
    video.srcObject = stream
    document.getElementById('camara-container').style.display = 'block'
    btnCapturar.style.display = 'inline-block'
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err.message)
  }
}

// Botón usar cámara
btnCamara.addEventListener('click', iniciarCamara)

// Botón cambiar cámara
btnCambiar.addEventListener('click', () => {
  currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
  iniciarCamara()
})

// Capturar foto
btnCapturar.addEventListener('click', () => {
  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  canvas.toBlob(blob => {
    fotoBlob = blob
    preview.src = URL.createObjectURL(blob)
    preview.style.display = 'block'
    video.style.display = 'none' // ocultar cámara
    btnCapturar.style.display = 'none'
  }, 'image/jpeg')
})

// Subir archivo desde galería
inputArchivo.addEventListener('change', e => {
  const file = e.target.files[0]
  if (file) {
    fotoBlob = file
    preview.src = URL.createObjectURL(file)
    preview.style.display = 'block'
  }
})

// Enviar formulario
form.addEventListener('submit', async e => {
  e.preventDefault()
  const nombre = document.getElementById('nombre').value.trim()
  if (!nombre) return alert('Ingresá tu nombre')
  if (!fotoBlob) return alert('Primero sacá o subí una foto')

  const fileName = `${Date.now()}_${nombre}.jpg`

  // Subir foto a Supabase Storage
  const { data, error } = await supabase.storage
    .from('disfraces')
    .upload(fileName, fotoBlob, { contentType: 'image/jpeg' })

  if (error) return alert('Error subiendo imagen: ' + error.message)

  const { data: publicUrl } = supabase.storage
    .from('disfraces')
    .getPublicUrl(fileName)

  // Guardar participante en tabla
  const { error: insertError } = await supabase
    .from('participantes')
    .insert([{ nombre, foto_url: publicUrl.publicUrl, votos: 0 }])

  if (insertError) return alert('Error guardando inscripción: ' + insertError.message)

  // Guardar en localStorage que ya participó
  localStorage.setItem('participante', nombre)
  mensaje.innerHTML = `✅ Tu participación fue enviada correctamente, ${nombre}!`
  form.style.display = 'none'
})
