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

  ////////////////
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
        button.type = 'button'; // important : évite comportement submit
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
                // popup dans la carte du trajet
                showPopupInCard(card, "Trajet réservé avec succès !");

                // désactive le bouton sur lequel on a cliqué
                button.textContent = "Merci !";
                button.disabled = true;
                button.classList.add('disabled');

                // met à jour le nombre de places
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
        // const reservations = tripsData.filter(t => t.seats_total === 1 && t.pseudo);
        const reservations = tripsData.filter(t => t.parent_id);
        
        mainTrips.forEach(trip => {
          trip.reservedPseudos = reservations.filter(r => r.parent_id === trip.id).map(r => r.pseudo);
        });

        renderTrips(mainTrips);
      })
      .catch(err => console.error('Erreur récupération trajets', err));
  }
});
