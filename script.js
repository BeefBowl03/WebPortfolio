document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');

    // Toggle the navigation links when the burger menu is clicked
    burgerMenu.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    // Add event listener to each link to hide the menu when clicked
    const links = navLinks.querySelectorAll('li a'); // Select all links within the nav-links
    links.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active'); // Remove 'active' class to hide the list
        });
    });
});
