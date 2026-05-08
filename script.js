// Smooth scroll for navbar links
const navLinks = document.querySelectorAll("nav a");

navLinks.forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();

        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetId === '#backtest') {
            showBacktestSection();
        }

        targetSection.scrollIntoView({
            behavior: "smooth"
        });
    });
});

// Simple console message (testing JS)
console.log("JavaScript is running 🚀");
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
    } else {
        header.style.boxShadow = "none";
    }
});
// Fade in on scroll
const faders = document.querySelectorAll(".fade-in");

const appearOnScroll = new IntersectionObserver(
    function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
        });
    },
    {
        threshold: 0.2
    }
);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");

    setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.pointerEvents = "none";

        setTimeout(() => {
            loader.style.display = "none";
        }, 500);
    }, 1500);
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');

contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your message! I will get back to you soon.');
    contactForm.reset();
});

// Backtest access control (client-side + optional server login)
const BACKTEST_PASSWORD = 'ChasingTheDreams';
const unlockBacktestButton = document.getElementById('unlockBacktest');
const backtestPanel = document.getElementById('backtestPanel');
const backtestSection = document.getElementById('backtest');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeModal = document.getElementById('closeModal');

function setBacktestUnlocked(value) {
    localStorage.setItem('backtestUnlocked', value ? 'true' : 'false');
    if (value) {
        backtestPanel.classList.remove('hidden');
        unlockBacktestButton.classList.add('hidden');
    } else {
        backtestPanel.classList.add('hidden');
        unlockBacktestButton.classList.remove('hidden');
    }
}

function showBacktestSection() {
    // Allow scrolling to the section; keep the panel locked unless unlocked
    backtestSection.classList.remove('hidden');

    const unlocked = localStorage.getItem('backtestUnlocked') === 'true';
    setBacktestUnlocked(unlocked);

    if (!unlocked) {
        showModal();
    }
}

function checkBacktestAccess() {
    const unlocked = localStorage.getItem('backtestUnlocked') === 'true';
    setBacktestUnlocked(unlocked);
}

function showModal() {
    loginModal.classList.remove('hidden');
}

function hideModal() {
    loginModal.classList.add('hidden');
    loginForm.reset();
}

unlockBacktestButton.addEventListener('click', showModal);
closeModal.addEventListener('click', hideModal);

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const data = new FormData(loginForm);
    const password = data.get('password');

    if (password === BACKTEST_PASSWORD) {
        setBacktestUnlocked(true);
        hideModal();
        alert('Backtest unlocked! Scroll down to use it.');
    } else {
        alert('Access denied. Password is incorrect.');
    }
});

checkBacktestAccess();

// Highlight active navigation link while scrolling
const sections = document.querySelectorAll('section[id]');
const observerOptions = { threshold: 0.55 };

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const id = entry.target.id;
        const link = document.querySelector(`nav a[href="#${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}, observerOptions);

sections.forEach(section => sectionObserver.observe(section));