import { supabase } from './supabaseClient.js'

const video = document.getElementById('camara')
const canvas = document.getElementById('fotoCanvas')
const btnFoto = document.getElementById('btn-foto')
const form = document.getElementById('form-inscripcion')
let fotoBlob = null

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => alert('No se pudo acceder a la cámara: ' + err))

btnFoto.addEventListener('click', () => {
  const context = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  canvas.toBlob(blob => fotoBlob = blob, 'image/jpeg')
  alert('📸 Foto capturada correctamente')
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const nombre = document.getElementById('nombre').value.trim()
  if (!fotoBlob) return alert('Primero sacá la foto')

  const fileName = `${Date.now()}_${nombre}.jpg`
  const { data, error } = await supabase.storage
    .from('disfraces')
    .upload(fileName, fotoBlob, { contentType: 'image/jpeg' })
  if (error) return alert('Error subiendo imagen: ' + error.message)

  const { data: publicUrl } = supabase.storage
    .from('disfraces')
    .getPublicUrl(fileName)

  const { error: insertError } = await supabase
    .from('participantes')
    .insert([{ nombre, foto_url: publicUrl.publicUrl, votos: 0 }])

  if (insertError) return alert('Error guardando inscripción: ' + insertError.message)
  alert('✅ Inscripción enviada correctamente')
  form.reset()
})
