import { supabase } from './supabaseClient.js'

const galeria = document.getElementById('galeria')
const ctx = document.getElementById('grafico')
let chart

const seleccionado = localStorage.getItem('voto') // id del participante que votaste
const resumen = document.createElement('div')
resumen.style.marginTop = '15px'
resumen.style.fontSize = '1em'
resumen.style.color = '#FFA500'
resumen.style.fontWeight = 'bold'
document.body.appendChild(resumen)

async function cargarParticipantes() {
  const { data, error } = await supabase.from('participantes').select('*')
  if (error) return console.error(error)

  const dataOrdenada = [...data].sort((a,b)=> b.votos - a.votos)
  galeria.innerHTML = ''

  dataOrdenada.forEach(p => {
    const div = document.createElement('div')
    div.classList.add('participante')
    div.style.marginBottom = '15px'
    div.style.textAlign = 'center'
    div.style.transition = '0.3s'

    // Si ya votaste, destacamos la foto elegida
    if (seleccionado) {
      if (seleccionado === p.id) {
        div.style.transform = 'scale(1.1)'
        div.style.border = '3px solid #28a745'
        div.style.opacity = '1'
      } else {
        div.style.opacity = '0.4'
      }
    }

    div.innerHTML = `
      <img src="${p.foto_url}" alt="${p.nombre}" style="width:100px; border-radius:12px; display:block; margin:auto;">
      <p style="font-family:'Creepster', cursive; font-size:1.2em;">${p.nombre}</p>
      <p style="color:#FFD700; font-size:1em;">${p.votos} votos</p>
      <button ${seleccionado ? 'disabled' : ''} style="display:block; margin:10px auto; padding:8px 20px; font-size:1em;">Votar</button>
    `

    if (!seleccionado) {
      div.querySelector('img').addEventListener('click', () => {
        // seleccionar foto al tocar
        const allDivs = document.querySelectorAll('.participante')
        allDivs.forEach(d => d.style.transform = 'scale(1)')
        div.style.transform = 'scale(1.1)'
      })

      div.querySelector('button').addEventListener('click', () => votar(p.id))
    }

    galeria.appendChild(div)
  })

  mostrarGrafico(dataOrdenada)
  mostrarResumen(dataOrdenada)
}

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

cargarParticipantes()
