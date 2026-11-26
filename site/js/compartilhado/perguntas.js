document.addEventListener('DOMContentLoaded', () => {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach((button) => {
    button.addEventListener('click', () => {
      const faqItem = button.closest('.faq-item');
      const isOpen = faqItem.classList.contains('active');

      faqItem.classList.toggle('active', !isOpen);
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  });
});