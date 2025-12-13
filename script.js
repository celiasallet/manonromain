// script de formulaire pour pop window
const form = document.getElementById('rsvp-form');
const popup = document.getElementById('thankyou-popup');
const closeBtn = popup.querySelector('.close-btn');

    form.addEventListener('submit', function() {
        popup.style.display = "flex";

        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = "C'est noté !";
        btn.disabled = true;
    });

    closeBtn.addEventListener('click', function() {
        popup.style.display = "none";
    });

    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
        popup.style.display = "none";
        }
    });