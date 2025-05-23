// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get all topic items
  const topicItems = document.querySelectorAll('.topic-item');
  
  // Add click event listeners to each topic item
  topicItems.forEach(function(item) {
    item.addEventListener('click', function() {
      // Toggle the 'expanded' class
      this.classList.toggle('expanded');
      
      // Get the topic name from the data attribute
      const topicName = this.getAttribute('data-topic');
      
      // Log the toggle event (similar to the React component's logic)
      console.log(`Topic ${topicName} is now ${this.classList.contains('expanded') ? 'expanded' : 'collapsed'}`);
      
      // Here you could add additional logic for when a topic is expanded/collapsed
    });
    
    // Add keyboard accessibility
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