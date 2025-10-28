import { supabase } from './supabaseClient.js'

const galeria = document.getElementById('galeria')
const ctx = document.getElementById('grafico')

let chart

async function cargarParticipantes() {
  const { data, error } = await supabase.from('participantes').select('*')
  if (error) return console.error(error)

  galeria.innerHTML = ''
  const yaVoto = localStorage.getItem('voto')

  data.forEach(p => {
    const div = document.createElement('div')
    div.classList.add('participante')

    // Si ya votó, marcar seleccionado y los demás grisados
    if (yaVoto) {
      if (p.id === yaVoto) {
        div.classList.add('seleccionado')
        div.innerHTML = `
          <img src="${p.foto_url}" alt="${p.nombre}" />
          <div class="check-tilde">✔</div>
          <p>${p.nombre}</p>
        `
      } else {
        div.classList.add('no-seleccionado')
        div.innerHTML = `
          <img src="${p.foto_url}" alt="${p.nombre}" />
          <p>${p.nombre}</p>
        `
      }
    } else {
      // Si no votó, mostrar radio buttons
      div.innerHTML = `
        <img src="${p.foto_url}" alt="${p.nombre}" />
        <p>${p.nombre}</p>
        <input type="radio" name="voto" value="${p.id}" /> Seleccionar
      `
    }

    galeria.appendChild(div)
  })

  // Si no votó, agregar botón de votar
  if (!yaVoto) {
    const votarBtn = document.createElement('button')
    votarBtn.textContent = 'Votar'
    votarBtn.addEventListener('click', enviarVoto)
    galeria.appendChild(votarBtn)
  } else {
    const mensaje = document.createElement('p')
    mensaje.innerHTML = '✅ Gracias por participar!'
    galeria.appendChild(mensaje)
  }

  mostrarGrafico(data)
}

async function enviarVoto() {
  const seleccionado = document.querySelector('input[name="voto"]:checked')
  if (!seleccionado) return alert('Por favor seleccioná un disfraz antes de votar.')

  const id = seleccionado.value
  const { error } = await supabase.rpc('incrementar_voto', { participante_id: id })
  if (error) return alert('Error al votar: ' + error.message)

  localStorage.setItem('voto', id)
  cargarParticipantes()
}

// Mostrar gráfico de torta
function mostrarGrafico(data) {
  const nombres = data.map(p => p.nombre)
  const votos = data.map(p => p.votos)

  const colores = data.map((p, i) => `hsl(${i * 60 % 360}, 70%, 50%)`)
  const maxVotos = Math.max(...votos)
  const coloresFinales = votos.map((v, i) => v === maxVotos ? '#ff7f50' : colores[i])

  if (chart) chart.destroy()
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: nombres,
      datasets: [{
        label: 'Votos',
        data: votos,
        backgroundColor: coloresFinales,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const p = data[context.dataIndex]
              return `${p.nombre}: ${p.votos} votos`
            }
          }
        }
      }
    }
  })
}

// Inicializar
cargarParticipantes()

// Actualización en tiempo real
supabase
  .channel('votos')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'participantes' }, cargarParticipantes)
  .subscribe()
