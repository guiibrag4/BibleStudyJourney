// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get all topic items
  const topicItems = document.querySelectorAll('.topic-item');
  
  topicItems.forEach(function(item) {
    item.addEventListener('click', function() {
      this.classList.toggle('expanded');
      const chevron = this.querySelector('.chevron-container img');
      chevron.style.transform = this.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
      const topicName = this.getAttribute('data-topic');
      console.log(`Topic ${topicName} is now ${this.classList.contains('expanded') ? 'expanded' : 'collapsed'}`);
    });
    
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-expanded', 'false');
    
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
        this.setAttribute('aria-expanded', this.classList.contains('expanded').toString());
      }
    });
  });
});

