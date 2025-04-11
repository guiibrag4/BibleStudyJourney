// Bible content data
// const bibleContent = [
//     "Lorem ipsum dolor sit amet. Aut dolores minima et doloremque galisum id laboriosam provident et quibusdam quae aut labore optio sed accusamus error et iste eligendi. Ut quia voluptatem qui quia repudiandae et molestias molestiae.",
//     "Aut quos accusamus qui eius numquam non magni molestias sed harum assumenda. Non animi consequuntur ut aperiam recusandae ut maxime quas et sapiente cumque sed culpa fuga?",
//     "Id dolor fugit eum commodi possimus aut voluptatem cumque qui sint dicta qui quas atque! Et assumenda dolorum 33 quia voluptates aut architecto distinctio ut pariatur laborum."
//   ];
  
  // Current state
  let currentVersion = "Nvi";
  let currentChapter = "Eclesiastes 5";
  
  // DOM elements
  const versionSelector = document.getElementById('version-selector');
  const chapterSelector = document.getElementById('chapter-selector');
  const bibleContentEl = document.getElementById('bible-content');
  const versionDialog = document.getElementById('version-dialog');
  const chapterDialog = document.getElementById('chapter-dialog');
  const overlay = document.getElementById('overlay');
  const versionSelect = document.getElementById('version-select');
  const chapterSelect = document.getElementById('chapter-select');
  const closeButtons = document.querySelectorAll('.close-button');
  
  // Initialize content
  function initializeContent() {
    renderBibleContent();
    setupEventListeners();
  }
  
  // Render Bible content
  function renderBibleContent() {
    bibleContentEl.innerHTML = '';
    
    bibleContent.forEach((paragraph, index) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      bibleContentEl.appendChild(p);
      
      // Add spacing between paragraphs (except for last one)
      if (index < bibleContent.length - 1) {
        const br1 = document.createElement('br');
        const br2 = document.createElement('br');
        bibleContentEl.appendChild(br1);
        bibleContentEl.appendChild(br2);
      }
    });
  }
  
  // Open dialog helper
  function openDialog(dialog) {
    dialog.classList.add('open');
    overlay.classList.add('open');
  }
  
  // Close dialog helper
  function closeDialog(dialog) {
    dialog.classList.remove('open');
    overlay.classList.remove('open');
  }
  
  // Close all dialogs
  function closeAllDialogs() {
    closeDialog(versionDialog);
    closeDialog(chapterDialog);
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Version selector click
    versionSelector.addEventListener('click', () => {
      versionSelect.value = currentVersion;
      openDialog(versionDialog);
    });
    
    // Chapter selector click
    chapterSelector.addEventListener('click', () => {
      chapterSelect.value = currentChapter;
      openDialog(chapterDialog);
    });
    
    // Version select change
    versionSelect.addEventListener('change', () => {
      currentVersion = versionSelect.value;
      versionSelector.textContent = currentVersion;
      closeDialog(versionDialog);
    });
    
    // Chapter select change
    chapterSelect.addEventListener('change', () => {
      currentChapter = chapterSelect.value;
      chapterSelector.textContent = currentChapter;
      closeDialog(chapterDialog);
    });
    
    // Close buttons
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        closeAllDialogs();
      });
    });
    
    // Close when clicking on overlay
    overlay.addEventListener('click', closeAllDialogs);
    
    // Close when pressing Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDialogs();
      }
    });
  }
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', initializeContent);