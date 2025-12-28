document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM READY');

  //////////////////// popup
  function showPopupInCard(card, message) {
    // crée le popup dynamiquement
    const popup = document.createElement('div');
    popup.className = 'thankyou-popup';
    popup.innerHTML = `
    
      <div class="popup-content">
        <span class="close-btn">&times;</span>
        <p class="popup-message">${message}</p>
      </div>
    `;
    card.appendChild(popup);

    popup.style.display = 'flex';

    // ferme au click sur le bouton ou en dehors
    const closeBtn = popup.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => popup.remove());
    popup.addEventListener('click', e => { if(e.target === popup) popup.remove(); });
  }

  ////////////////////
  // RSVP Form
  const form = document.getElementById('rsvp-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault(); // bloque le reload

      // message spécifique pour le RSVP
      showPopupInCard(form.parentElement, "Merci de ta réponse, c'est noté !");

      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = "C'est noté !";
      btn.disabled = true;

      // envoi Google Forms via iframe
      form.submit(); 
    });
  }

  ////////////////////
  // Trip Form
  const API_URL = 'https://script.google.com/macros/s/AKfycbwZplUjWy7PPpjn-cPRwstji_0L2mPQeotLi5Zl8ZSzAWV9_D5h7Bc7hea9Ea6Bw7q3/exec';
  const tripForm = document.getElementById('trip-form');

  if (tripForm) {
    tripForm.addEventListener('submit', e => {
      e.preventDefault();
      console.log('Trip form submitted');

      const tripData = {
        driver: document.getElementById('driver').value,
        departure: document.getElementById('departure').value,
        seats_total: parseInt(document.getElementById('trip-seats').value, 10),
        seats_left: parseInt(document.getElementById('trip-seats').value, 10)
      };

      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(tripData)
      })
      .then(res => res.json())
      .then(data => {
        if(data.success){
           showPopupInCard(tripForm, "Trajet proposé avec succès !");

            const btn2 = tripForm.querySelector('button[type="submit"]');
            btn2.textContent = "C'est noté !";
            btn2.disabled = true;

            tripForm.reset();
        } else {
          showPopupInCard(tripForm.parentElement, 'Erreur : ' + data.error);
        }
      })
      .catch(err => {
        console.error(err);
        alert('Erreur réseau');
      });
    });
  }

  // Render Trips
function renderTrips(trips) {
  const container = document.getElementById('trips-container');
  if(!container) return;
  container.innerHTML = '';

  trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'trip-card';

    card.innerHTML = `
      <h3 class="volant">${trip.driver}</h3>
      <p class="depart">Départ : <strong>${trip.departure}</strong></p>
      <p class="dispo">Places : <strong><span class="seats-left">${trip.seats_left}</span> / ${trip.seats_total} disponible.s</strong></p>
      ${trip.reservedPseudos?.length ? `<p class="reserved-list">Réservé par : ${trip.reservedPseudos.join(', ')}</p>` : ''}
    `;

    if(trip.seats_left >= 1){
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Ton pseudo';
      input.className = 'pseudo-input';

      const button = document.createElement('button');
      button.type = 'button'; // évite le submit
      button.textContent = 'Réserver';
      button.className = 'btn btn-primary';

      button.addEventListener('click', () => {
        const pseudo = input.value.trim();
        if(!pseudo){ showPopupInCard(card, "Merci de mettre ton pseudo pour réserver une place"); return; }

        fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({action:'reserve', trip_id:trip.id, pseudo})
        })
        .then(res => res.json())
        .then(data => {
          if(data.success){
            showPopupInCard(card, "Trajet réservé avec succès !");

            button.textContent = "Merci !";
            button.disabled = true;
            button.classList.add('disabled');

            const seatsLeftSpan = card.querySelector('.seats-left');
            seatsLeftSpan.textContent = Number(seatsLeftSpan.textContent) - 1;
            if(Number(seatsLeftSpan.textContent) === 0){
              input.remove();
              button.remove();
              const full = document.createElement('span');
              full.className = 'full';
              full.textContent = 'Complet';
              card.appendChild(full);
            }
          } else {
            showPopupInCard(card, 'Erreur : ' + data.error);
          }
        })
        .catch(err => { console.error(err); alert('Erreur lors de la réservation'); });
      });

      card.appendChild(input);
      card.appendChild(button);
    } else {
      const full = document.createElement('span');
      full.className = 'full';
      full.textContent = 'Complet';
      card.appendChild(full);
    }

    container.appendChild(card);
  });
}

// Fetch trips au chargement
const tripsContainer = document.getElementById('trips-container');
if(tripsContainer){
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const tripsData = data.filter(r => !isNaN(Number(r.seats_total)) && !isNaN(Number(r.seats_left)));
      const mainTrips = tripsData.filter(t => t.seats_total >= 1);
      const reservations = tripsData.filter(t => t.parent_id); // toutes les réservations

      mainTrips.forEach(trip => {
        trip.reservedPseudos = reservations.filter(r => r.parent_id === trip.id).map(r => r.pseudo);
      });

      renderTrips(mainTrips);
    })
    .catch(err => console.error('Erreur récupération trajets', err));
}

});

document.addEventListener('DOMContentLoaded', () => {

  //////////////////// popup
  function showPopupInCard(card, message) {
    const popup = document.createElement('div');
    popup.className = 'thankyou-popup';
    popup.innerHTML = `
      <div class="popup-content">
        <span class="close-btn">&times;</span>
        <p class="popup-message">${message}</p>
      </div>
    `;
    card.appendChild(popup);
    popup.style.display = 'flex';

    const closeBtn = popup.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => popup.remove());
    popup.addEventListener('click', e => { if(e.target === popup) popup.remove(); });
  }

  //////////////////// RSVP Form "aub"
  const form = document.getElementById('aub');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault(); // bloque le reload

      // Affiche le popup
      showPopupInCard(form.parentElement, "Mercii !");

      // Désactive le bouton et change le texte
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = "C'est noté !";
      btn.disabled = true;

      // Envoi Google Forms via iframe cachée
      form.submit();
    });
  }

});

////////// camenbert 

const canvas = document.getElementById('camembert');
const ctx = canvas.getContext('2d');
const totalInput = document.getElementById('total-participants');

// Noms des catégories
const categories = ['Boissons', 'Apéro', 'Salé', 'Sucré'];

// Nombres de participants par catégorie (à remplir dynamiquement ou test)
let dataCounts = [0, 0, 0, 0]; // par défaut zéro

let chart = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: categories,
    datasets: [{
      label: 'Répartition',
      data: dataCounts,
      backgroundColor: ['#4e79a7','#2b32f2ff','#5769e1ff','#76b7b2'],
      borderWidth: 1
    }]
  },
  options: {
    responsive: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: function(context){
            return context.label + ': ' + context.raw + ' personnes';
          }
        }
      }
    }
  }
});

// Fonction pour mettre à jour le camembert
document.addEventListener('DOMContentLoaded', () => {

  // Le lien CSV public de ta Google Sheet
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRjqjXQl1zP_xzNtrXzludfYtciqmT1N8bV3oFwNxzse3-lHHys47N6cp0t4qldqEY5myT6safZKA77/pub?gid=1608669145&single=true&output=csv";

  // Les catégories à afficher
  const categories = ['Boissons', 'Apéro', 'Salé', 'Sucré'];
  const counts = [0, 0, 0, 0]; // compteur local

  const canvas = document.getElementById('camembert');
  const ctx = canvas.getContext('2d');

  // Création du camembert Chart.js
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: counts,
        backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2']
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.raw} personnes`
          }
        }
      }
    }
  });

  // Fonction pour mettre à jour le camembert avec la règle 25%
  function updateChart() {
    // nombre total de réponses
    const total = counts.reduce((a,b) => a + b, 0);
    const maxPerCat = Math.ceil(total * 0.25);

    // on limite chaque barre à 25%
    chart.data.datasets[0].data = counts.map(x => Math.min(x, maxPerCat));
    chart.update();
  }

  // Fetch du CSV
  fetch(CSV_URL)
    .then(res => res.text())
    .then(csv => {
      const lines = csv.trim().split('\n');
      const header = lines.shift().split(','); // entête

      // Trouve l’index de la colonne “Choix”
      const choixIndex = header.findIndex(h => /choix|Choix|CHOIX/.test(h));

      lines.forEach(line => {
        const cols = line.split(',');
        const choix = cols[choixIndex]?.trim();
        const idx = categories.indexOf(choix);
        if (idx !== -1) counts[idx]++;
      });

      updateChart();
    })
    .catch(err => {
      console.error('Erreur chargement CSV :', err);
    });

});