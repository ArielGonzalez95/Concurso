import { supabase } from './supabaseClient.js'

const contenedor = document.getElementById('top3')

async function cargarTop3() {
  const { data, error } = await supabase
    .from('participantes')
    .select('*')
    .order('votos', { ascending: false })
    .limit(3)

  if (error) {
    console.error(error)
    contenedor.innerHTML = `<p>Error al cargar resultados 😢</p>`
    return
  }

  contenedor.innerHTML = ''

  data.forEach((p, i) => {
    const div = document.createElement('div')
    div.classList.add('participante')
    div.innerHTML = `
      <img src="${p.foto_url}" alt="${p.nombre}">
      <p class="nombre">#${i + 1} ${p.nombre}</p>
      <p class="votos">${p.votos} votos</p>
    `
    contenedor.appendChild(div)
  })
}

cargarTop3()
