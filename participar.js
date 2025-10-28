import { supabase } from './supabaseClient.js'

const video = document.getElementById('camara')
const canvas = document.getElementById('fotoCanvas')
const btnCamara = document.getElementById('usar-camara')
const btnCapturar = document.getElementById('btn-capturar')
const btnCambiar = document.getElementById('cambiar-camara')
const inputArchivo = document.getElementById('subir-foto')
const preview = document.getElementById('preview')
const form = document.getElementById('form-inscripcion')
const mensaje = document.getElementById('mensaje')

let fotoBlob = null
let useFront = false
let stream = null

// Si ya participó
if (localStorage.getItem('participo')) {
  form.style.display = 'none'
  mensaje.style.color = '#28a745'
  mensaje.innerHTML = '✅ Ya participaste. Gracias por participar!'
}

// Abrir cámara
async function abrirCamara() {
  if (stream) stream.getTracks().forEach(t => t.stop())
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: useFront ? "user" : "environment" } })
  video.srcObject = stream
  video.style.display = 'block'
  btnCapturar.style.display = 'inline-block'
}

btnCamara.addEventListener('click', abrirCamara)
btnCambiar.addEventListener('click', () => {
  useFront = !useFront
  abrirCamara()
})

btnCapturar.addEventListener('click', () => {
  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  canvas.toBlob(blob => {
    fotoBlob = blob
    preview.src = URL.createObjectURL(blob)
    preview.style.display = 'block'
    video.style.display = 'none'
    btnCapturar.style.display = 'none'
  }, 'image/jpeg')
})

// Subir archivo
inputArchivo.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    fotoBlob = file
    preview.src = URL.createObjectURL(file)
    preview.style.display = 'block'
    video.style.display = 'none'
    btnCapturar.style.display = 'none'
  }
})

// Enviar formulario
form.addEventListener('submit', async e => {
  e.preventDefault()
  if (localStorage.getItem('participo')) {
    mensaje.style.color = '#ff0000'
    mensaje.innerHTML = '⚠️ Ya participaste previamente.'
    return
  }
  const nombre = document.getElementById('nombre').value.trim()
  if (!fotoBlob) {
    mensaje.style.color = '#ff0000'
    mensaje.innerHTML = '⚠️ Primero sacá o subí una foto.'
    return
  }

  const fileName = `${Date.now()}_${nombre}.jpg`
  const { error: uploadError } = await supabase.storage.from('disfraces').upload(fileName, fotoBlob, { contentType: 'image/jpeg' })
  if (uploadError) {
    mensaje.style.color = '#ff0000'
    mensaje.innerHTML = '⚠️ Error subiendo imagen: ' + uploadError.message
    return
  }

  const { data: publicUrl } = supabase.storage.from('disfraces').getPublicUrl(fileName)
  const { error: insertError } = await supabase.from('participantes').insert([{ nombre, foto_url: publicUrl.publicUrl, votos: 0 }])
  if (insertError) {
    mensaje.style.color = '#ff0000'
    mensaje.innerHTML = '⚠️ Error guardando inscripción: ' + insertError.message
    return
  }

  localStorage.setItem('participo', 'true')
  form.style.display = 'none'
  mensaje.style.color = '#28a745'
  mensaje.innerHTML = '✅ Inscripción enviada correctamente. Gracias por participar!'
})
