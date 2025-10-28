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

// Crear overlay global (solo una vez)
function crearOverlay() {
  let overlay = document.getElementById('overlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'overlay'
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.background = 'rgba(0, 0, 0, 0.8)'
    overlay.style.display = 'flex'
    overlay.style.alignItems = 'center'
    overlay.style.justifyContent = 'center'
    overlay.style.zIndex = '9999'
    overlay.style.color = '#ff0000'
    overlay.style.fontSize = '60px'

    // Calavera giratoria
    overlay.innerHTML = `<div class="spinner-skull">💀</div>`

    document.body.appendChild(overlay)

    // Inyectamos estilo de animación
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes girar {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .spinner-skull {
        display: inline-block;
        animation: girar 1s linear infinite;
      }
    `
    document.head.appendChild(style)
  }
  return overlay
}

// Enviar formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (localStorage.getItem('participacion')) return

  const nombre = document.getElementById('nombre').value.trim()
  if (!fotoBlob) return alert('Primero seleccioná una foto')

  // Mostrar spinner
  const overlay = crearOverlay()
  overlay.style.display = 'flex'

  const fileName = `${Date.now()}_${nombre}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('disfraces')
    .upload(fileName, fotoBlob, { contentType: 'image/jpeg' })

  if (uploadError) {
    overlay.style.display = 'none'
    return alert('Error subiendo imagen: ' + uploadError.message)
  }

  const { data: publicUrl } = supabase.storage
    .from('disfraces')
    .getPublicUrl(fileName)

  const { error: insertError } = await supabase
    .from('participantes')
    .insert([{ nombre, foto_url: publicUrl.publicUrl, votos: 0 }])

  // Ocultar spinner
  overlay.style.display = 'none'

  if (insertError) return alert('Error guardando inscripción: ' + insertError.message)

  // Guardamos en localStorage que ya participó
  localStorage.setItem('participacion', 'true')

  mensaje.innerHTML = `✅ Tu foto fue enviada correctamente, ${nombre}! Gracias por participar.`
  form.style.display = 'none'
})
