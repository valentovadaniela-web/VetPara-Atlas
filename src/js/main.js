/******************************************************************************
 * VetPara Atlas
 * Application entry point
 ******************************************************************************/

import App from "../app/App.js";

document.addEventListener("DOMContentLoaded", () => {

    App.start();

    // Automatické zvýraznenie aktívneho odkazu v menu
    const navLinks = document.querySelectorAll('.site-nav-links .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Odstráni triedu active zo všetkých odkazov
            navLinks.forEach(l => l.classList.remove('active'));
            // Pridá triedu active na ten, na ktorý sa kliklo
            this.classList.add('active');
        });
    });

}); // <- Tu sa úspešne zatvára DOMContentLoaded z riadku 8
