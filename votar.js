import { supabase } from './supabaseClient.js'

const galeria = document.getElementById('galeria')

// 💀 Overlay (calavera giratoria)
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
    overlay.style.fontSize = '80px'

    // 💀 Calavera giratoria
    overlay.innerHTML = `<div class="spinner-skull">💀</div>`
    document.body.appendChild(overlay)

    // Animación CSS
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

const overlay = crearOverlay()
overlay.style.display = 'none'

// 🔁 Estilos dinámicos
const style = document.createElement('style')
style.innerHTML = `
.participante {
  display:inline-block;
  text-align:center;
  margin:15px;
  border:none;
  border-radius:10px;
  transition:all .3s;
}

.participante img {
  width:160px;
  height:160px;
  object-fit:cover;
  border-radius:10px;
  cursor:pointer;
  border:3px solid transparent;
  transition: all .3s ease;
}

/* ✅ Borde verde solo en la imagen seleccionada */
.participante.seleccionado img {
  border-color:#00ff9d;
  box-shadow:0 0 10px #00ff9d;
}

/* 🔇 Los no seleccionados se apagan */
.participante.no-seleccionado img {
  opacity:0.4;
  filter:grayscale(100%);
}

.participante button {
  margin-top:8px;
  padding:6px 12px;
  border:none;
  border-radius:6px;
  background:#3a5dae;
  color:white;
  cursor:pointer;
  transition:all .3s;
  font-family:'Creepster', cursive;
}

.participante button:disabled {
  background:#999;
  cursor:not-allowed;
}
`
document.head.appendChild(style)

// 🧠 Estado de voto
let seleccionado = localStorage.getItem('voto')

// 💬 Mensaje de confirmación
const mensajeDiv = document.createElement('div')
mensajeDiv.id = 'mensaje'
mensajeDiv.style.marginTop = '15px'
mensajeDiv.style.fontSize = '1.2em'
mensajeDiv.style.fontWeight = 'bold'
mensajeDiv.style.textAlign = 'center'
document.body.appendChild(mensajeDiv)

function mostrarMensaje(texto) {
  mensajeDiv.innerHTML = texto
}

// 👻 Cargar participantes
async function cargarParticipantes() {
  const { data, error } = await supabase.from('participantes').select('*')
  if (error) return console.error(error)

  galeria.innerHTML = ''
  const dataOrdenada = [...data].sort((a, b) => a.nombre.localeCompare(b.nombre))

  dataOrdenada.forEach(p => {
    const div = document.createElement('div')
    div.classList.add('participante')
    div.innerHTML = `
      <img src="${p.foto_url}" alt="${p.nombre}">
      <p class="nombre">${p.nombre}</p>
      <button ${seleccionado ? 'disabled' : ''}>Votar</button>
    `

    const img = div.querySelector('img')
    const btn = div.querySelector('button')

    if (seleccionado) {
      if (seleccionado === p.id.toString()) {
        div.classList.add('seleccionado')
      } else {
        div.classList.add('no-seleccionado')
      }
    } else {
      img.addEventListener('click', () => {
        document.querySelectorAll('.participante').forEach(d => d.classList.remove('seleccionado'))
        div.classList.add('seleccionado')
      })

      btn.addEventListener('click', () => votar(p.id, div))
    }

    galeria.appendChild(div)
  })
}

// 🗳️ Función para votar
async function votar(id, div) {
  if (localStorage.getItem('voto')) {
    mostrarMensaje('Ya votaste!')
    return
  }

  // Bloquear temporalmente la galería
  document.querySelectorAll('.participante').forEach(d => {
    const img = d.querySelector('img')
    const btn = d.querySelector('button')
    if (d !== div) {
      d.classList.add('no-seleccionado')
    } else {
      d.classList.add('seleccionado')
    }
    img.style.pointerEvents = 'none'
    btn.disabled = true
  })

  overlay.style.display = 'flex'

  try {
    const { error } = await supabase.rpc('incrementar_voto', { participante_id: id })
    if (error) throw error

    localStorage.setItem('voto', id)
    seleccionado = id.toString()
    mostrarMensaje('✅ Tu voto se registró. ¡Gracias por participar!')
    await cargarParticipantes()
  } catch (err) {
    mostrarMensaje('❌ Error al votar: ' + err.message)
    // Revertir si falla
    document.querySelectorAll('.participante').forEach(d => {
      d.classList.remove('seleccionado', 'no-seleccionado')
      const img = d.querySelector('img')
      const btn = d.querySelector('button')
      img.style.pointerEvents = 'auto'
      btn.disabled = false
    })
  } finally {
    overlay.style.display = 'none'
  }
}

// 🚀 Iniciar
cargarParticipantes()
