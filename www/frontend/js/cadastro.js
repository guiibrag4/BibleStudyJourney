
// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  
    // Get no formulário os elementos
    const form = document.getElementById('registrationForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const birthDateInput = document.getElementById('birthDate');
    const submitButton = document.getElementById('submitButton');
    
    // Get erro nos elementos
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const birthDateError = document.getElementById('birthDateError');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get elementos de sucesso
    const registrationContainer = document.getElementById('registrationContainer');
    const successContainer = document.getElementById('successContainer');
    
    // Email validation regex
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    
    // Check if running in Cordova environment
    function isCordova() {
      return (typeof window.cordova !== 'undefined');
    }
    
    // Form validation function
    function validateForm() {
      let isValid = true;
      
      // Clear previous errors
      nameError.textContent = '';
      emailError.textContent = '';
      passwordError.textContent = '';
      birthDateError.textContent = '';
      errorContainer.style.display = 'none';
      
      // Validate name
      if (!nameInput.value.trim()) {
        nameError.textContent = 'Nome é obrigatório';
        isValid = false;
      }
      
      // Validate email
      if (!emailInput.value.trim()) {
        emailError.textContent = 'Email é obrigatório';
        isValid = false;
      } else if (!emailRegex.test(emailInput.value)) {
        emailError.textContent = 'Email inválido';
        isValid = false;
      }
      
      // Validate password
      if (!passwordInput.value) {
        passwordError.textContent = 'Senha é obrigatória';
        isValid = false;
      } else if (passwordInput.value.length < 6) {
        passwordError.textContent = 'Senha deve ter pelo menos 6 caracteres';
        isValid = false;
      }
      
      // Validate birth date
      if (!birthDateInput.value) {
        birthDateError.textContent = 'Data de nascimento é obrigatória';
        isValid = false;
      }
      
      return isValid;
    }
    
    // Handle form submission
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      if (validateForm()) {
        // Desabilitar o botão de envio e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        
        // Obter os dados do formulário
        const formData = {
          nome: nameInput.value,
          email: emailInput.value,
          senha: passwordInput.value,
          data_nasc: birthDateInput.value 
        };

        try {
          // Enviar os dados para o backend
            const response = await fetch('http://localhost:3000/auth/register', { // URL do endpoint do backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
    
          const data = await response.json();
    
          if (response.ok) {
            // Mostrar mensagem de sucesso
            registrationContainer.style.display = 'none';
            successContainer.style.display = 'flex';
            
            setTimeout(() => {
              window.location.href = '/index.html';
            }, 3000);

          } else {
            // Mostrar mensagem de erro do backend
            errorMessage.textContent = data.error || 'Erro ao cadastrar usuário';
            errorContainer.style.display = 'block';
          }
        } catch (err) {
          console.error('Erro ao conectar ao servidor:', err);
          errorMessage.textContent = 'Erro ao conectar ao servidor. Tente novamente mais tarde.';
          errorContainer.style.display = 'block';
        } finally {
          // Reativar o botão de envio
          submitButton.disabled = false;
          submitButton.textContent = 'Cadastrar';
        }
      }
    });
    
    // Initialize Cordova-specific features when ready
    if (isCordova()) {
      document.addEventListener('deviceready', function() {
        console.log('Cordova initialized');
      }, false);
    } else {
      console.log('Running in browser environment');
    }
  });