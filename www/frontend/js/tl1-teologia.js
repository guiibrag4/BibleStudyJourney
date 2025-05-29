document.addEventListener('DOMContentLoaded', function() {
  const topicItems = document.querySelectorAll('.topic-item');
  topicItems.forEach(function(item) {
    const header = item.querySelector('.topic-header');
    header.addEventListener('click', function(e) {
      item.classList.toggle('expanded');
      const chevron = item.querySelector('.chevron-container img');
      chevron.style.transform = item.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
      item.setAttribute('aria-expanded', item.classList.contains('expanded').toString());
    });

    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-expanded', 'false');

    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });
});