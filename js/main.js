/**
 * NexGrade - Main Homepage Interactions, Live Tools & Dark/Light Mode Theme Toggle
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // 1. Initial Theme Mode Restoration
  const savedTheme = localStorage.getItem('nexgrade_theme') || 'dark';
  applyTheme(savedTheme);

  // 2. Navbar Scroll Blur Elevation Effect
  const navbar = document.querySelector('.glass-nav');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
      } else {
        navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
      }
    });
  }

  // 3. Interactive 3D Card Tilt Effect
  const glassCards = document.querySelectorAll('.glass-card');
  glassCards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // 4. Dark / Light Mode Toggle Listener
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const currentTheme = document.body.getAttribute('data-theme') || 'dark';
      const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('nexgrade_theme', theme);

    if (typeof window.switch3DTheme === 'function') {
      window.switch3DTheme(theme);
    }

    // Update Floating Button UI
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      if (theme === 'light') {
        themeToggleBtn.innerHTML = '<i class="bi bi-moon-stars-fill text-warning me-1"></i> <span>Dark Mode</span>';
        themeToggleBtn.title = "Switch to Dark Mode";
      } else {
        themeToggleBtn.innerHTML = '<i class="bi bi-sun-fill text-warning me-1"></i> <span>Light Mode</span>';
        themeToggleBtn.title = "Switch to Light Mode";
      }
    }
  }

  // 5. Live Quick GPA Estimator Widget Logic
  const calculateQuickBtn = document.getElementById('calc-quick-gpa-btn');
  if (calculateQuickBtn) {
    calculateQuickBtn.addEventListener('click', function () {
      const g1 = parseFloat(document.getElementById('quick-g1')?.value) || 10;
      const c1 = parseFloat(document.getElementById('quick-c1')?.value) || 4;
      const g2 = parseFloat(document.getElementById('quick-g2')?.value) || 9;
      const c2 = parseFloat(document.getElementById('quick-c2')?.value) || 3;
      const g3 = parseFloat(document.getElementById('quick-g3')?.value) || 8;
      const c3 = parseFloat(document.getElementById('quick-c3')?.value) || 4;

      const totalCredits = c1 + c2 + c3;
      const totalPoints = (g1 * c1) + (g2 * c2) + (g3 * c3);
      const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

      const resultDisplay = document.getElementById('quick-gpa-result');
      if (resultDisplay) {
        resultDisplay.textContent = gpa.toFixed(2);
        resultDisplay.parentElement.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => {
          resultDisplay.parentElement.classList.remove('animate__animated', 'animate__pulse');
        }, 1000);
      }
    });
  }
});
