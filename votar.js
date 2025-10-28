import { supabase } from './supabaseClient.js'

const galeria = document.getElementById('galeria')
const ctx = document.getElementById('grafico')
let chart

// Guardamos el participante que ya votó
const seleccionado = localStorage.getItem('voto')

// Div para mostrar ranking
const resumen = document.createElement('div')
resumen.classList.add('resumen-ranking')
document.body.appendChild(resumen)

// Cargar participantes
async function cargarParticipantes() {
  const { data, error } = await supabase.from('participantes').select('*')
  if (error) return console.error(error)

  galeria.innerHTML = ''
  const dataOrdenada = [...data].sort((a,b)=> b.votos - a.votos)

  dataOrdenada.forEach(p => {
    const div = document.createElement('div')
    div.classList.add('participante')

    div.innerHTML = `
      <img src="${p.foto_url}" alt="${p.nombre}">
      <p class="nombre">${p.nombre}</p>
      <p class="votos">${p.votos} votos</p>
      <button ${seleccionado ? 'disabled' : ''}>Votar</button>
    `

    // Si ya votaste, aplicamos clases CSS
    if (seleccionado) {
      if (seleccionado === p.id) {
        div.classList.add('seleccionado')
      } else {
        div.classList.add('no-seleccionado')
      }
    } else {
      // Click en imagen para seleccionar antes de votar
      div.querySelector('img').addEventListener('click', () => {
        document.querySelectorAll('.participante').forEach(d => d.classList.remove('seleccionado'))
        div.classList.add('seleccionado')
      })

      // Click en botón para votar
      div.querySelector('button').addEventListener('click', () => votar(p.id))
    }

    galeria.appendChild(div)
  })

  mostrarGrafico(dataOrdenada)
  mostrarResumen(dataOrdenada)
}

// Función para votar
async function votar(id) {
  if (localStorage.getItem('voto')) {
    alert('Ya votaste!')
    return
  }

  const { error } = await supabase.rpc('incrementar_voto', { participante_id: id })
  if (error) return alert('Error al votar: ' + error.message)

  localStorage.setItem('voto', id)
  alert('✅ Tu voto se registró. Gracias por participar!')
  cargarParticipantes()
}

// Gráfico de torta
function mostrarGrafico(data) {
  const nombres = data.map(p => p.nombre)
  const votos = data.map(p => p.votos)
  const colores = data.map((_, i) => `hsl(${i * 60}, 80%, 50%)`)

  if (chart) chart.destroy()
  chart = new Chart(ctx, {
    type: 'pie',
    data: { labels: nombres, datasets: [{ data: votos, backgroundColor: colores }] },
    options: { responsive:true }
  })
}

// Mostrar ranking y empates
function mostrarResumen(data) {
  if (!data || data.length === 0) return

  let texto = ''
  let posiciones = []
  let currentVotos = null
  let pos = 1

  for (let i = 0; i < data.length && i < 3; i++) {
    const p = data[i]
    if (currentVotos === null || p.votos < currentVotos) {
      currentVotos = p.votos
      posiciones.push({ pos, participantes: [p] })
      pos++
    } else if (p.votos === currentVotos) {
      posiciones[posiciones.length - 1].participantes.push(p)
    }
  }

  posiciones.forEach(grupo => {
    const emojis = ['🏆','🥈','🥉']
    const emoji = emojis[grupo.pos - 1] || ''
    const nombres = grupo.participantes.map(p => `${p.nombre} (${p.votos} votos)`).join(' y ')
    texto += `${emoji} ${nombres}<br>`
  })

  resumen.innerHTML = texto
}

// Ejecutamos
cargarParticipantes()
