document.addEventListener("DOMContentLoaded", function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('loading', 'lazy');
    });
});

function toggleMenu() {
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');

    header.classList.toggle('show-nav');

    // Toggle the menu icon between '☰' and '✕'
    menuToggle.innerHTML = header.classList.contains('show-nav') ? '✕' : '☰';
}

// Close the menu when a link is clicked
document.querySelectorAll('header nav a').forEach(link => {
    link.addEventListener('click', () => {
        const header = document.querySelector('header');
        const menuToggle = document.querySelector('.menu-toggle');

        header.classList.remove('show-nav'); // Hide the menu after clicking
        menuToggle.innerHTML = '☰';  // Reset to menu icon
    });
});

function scrollToSection(sectionId) {
    const offset = document.querySelector('header').offsetHeight;
    const element = document.getElementById(sectionId);
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

function highlightCurrentSection(sectionId) {
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const offset = document.querySelector('header').offsetHeight + 50;
    let currentSectionId = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - offset;
        if (window.scrollY >= sectionTop) {
            currentSectionId = section.getAttribute('id');
        }
    });

    highlightCurrentSection(currentSectionId);
});

let container = document.querySelector('.swipe-container');
let daySection = document.querySelector('.day-section');
let daySectionWidth = daySection?.offsetWidth || 0;

window.addEventListener('resize', () => {
    if (daySection) {
        daySectionWidth = daySection.offsetWidth;
    }
});

function scrollProgramLeft() {
    if (container) {
        container.scrollBy({ left: -daySectionWidth, behavior: 'smooth' });
    }
}

function scrollProgramRight() {
    if (container) {
        container.scrollBy({ left: daySectionWidth, behavior: 'smooth' });
    }
}