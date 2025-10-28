import { supabase } from './supabaseClient.js'

const galeria = document.getElementById('galeria')

// 🦴 Spinner overlay (calavera giratoria)
const overlay = document.createElement('div')
overlay.id = 'overlay-spinner'
overlay.style.display = 'none'
overlay.style.position = 'fixed'
overlay.style.top = '0'
overlay.style.left = '0'
overlay.style.width = '100%'
overlay.style.height = '100%'
overlay.style.background = 'rgba(0,0,0,0.8)'
overlay.style.justifyContent = 'center'
overlay.style.alignItems = 'center'
overlay.style.zIndex = '9999'
overlay.innerHTML = `
  <div class="spinner" style="
    width:80px; height:80px;
    background:url('https://i.imgur.com/yourSkullIcon.png') no-repeat center center;
    background-size:contain;
    animation:girar 1s linear infinite;">
  </div>`
document.body.appendChild(overlay)

// 🔁 Estilos dinámicos
const style = document.createElement('style')
style.innerHTML = `
@keyframes girar {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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
  border:3px solid transparent; /* sin borde al inicio */
  transition: all .3s ease;
}

/* ✅ Solo borde verde en la imagen seleccionada */
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

// 🧠 Estado: quién votó
const seleccionado = localStorage.getItem('voto')

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

    // Si ya votó → marcar solo la imagen elegida
    if (seleccionado) {
      if (seleccionado === p.id.toString()) {
        div.classList.add('seleccionado')
      } else {
        div.classList.add('no-seleccionado')
      }
    } else {
      // Click en imagen → selecciona visualmente
      img.addEventListener('click', () => {
        document.querySelectorAll('.participante').forEach(d => d.classList.remove('seleccionado'))
        div.classList.add('seleccionado')
      })

      // Click en botón → votar
      btn.addEventListener('click', () => votar(p.id))
    }

    galeria.appendChild(div)
  })
}

// 🗳️ Función para votar
async function votar(id) {
  if (localStorage.getItem('voto')) {
    mostrarMensaje('Ya votaste!')
    return
  }

  overlay.style.display = 'flex'
  try {
    const { error } = await supabase.rpc('incrementar_voto', { participante_id: id })
    if (error) throw error

    localStorage.setItem('voto', id)
    mostrarMensaje('✅ Tu voto se registró. ¡Gracias por participar!')
    await cargarParticipantes()
  } catch (err) {
    mostrarMensaje('❌ Error al votar: ' + err.message)
  } finally {
    overlay.style.display = 'none'
  }
}

// 🚀 Iniciar
cargarParticipantes()
