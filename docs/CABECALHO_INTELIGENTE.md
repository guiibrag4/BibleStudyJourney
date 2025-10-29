# Cabeçalho Inteligente - Documentação de Implementação

## Visão Geral

O cabeçalho inteligente foi implementado para melhorar a experiência de leitura, otimizando o espaço útil da tela e tornando o acesso aos controles mais intuitivo. O sistema detecta o comportamento do usuário ao rolar a página e oculta ou exibe o cabeçalho e o menu inferior de acordo com a intenção percebida.

---

## Lógica de Funcionamento

- **Oculta o cabeçalho/menu**: Quando o usuário rola para baixo mais do que um valor mínimo (`SCROLL_THRESHOLD_HIDE`), indicando intenção de leitura.
- **Exibe o cabeçalho/menu**: Quando o usuário rola para cima rapidamente (velocidade alta) ou mesmo devagar, após um pequeno deslocamento.
- **Sempre exibe**: Quando o usuário está no topo da página ou próximo ao final (para facilitar navegação).
- **Sem "layout shift"**: O espaço do cabeçalho é reservado via `padding-top` no `body`, evitando que o conteúdo "salte" ao mostrar/ocultar o header.

---

## Funcionamento Unitário dos Arquivos

### 1. `biblia.js`
- **Responsável pela lógica de exibição/ocultação** do cabeçalho e menu.
- Detecta direção e velocidade do scroll:
  ```js
  const SCROLL_THRESHOLD_HIDE = 10; // pixels para ocultar
  const VELOCITY_THRESHOLD_FAST = 3; // px/frame (~180px/s)
  ...
  if (isScrollingDown && isFastScroll && currentScrollY > SCROLL_THRESHOLD_HIDE) {
      hideHeaderAndMenu(header, menu);
  } else if (isScrollingDown && currentScrollY > SCROLL_THRESHOLD_HIDE) {
      hideHeaderAndMenu(header, menu);
  }
  if (isScrollingUp && isFastScroll) {
      showHeaderAndMenu(header, menu);
  } else if (isScrollingUp && Math.abs(scrollDelta) >= SCROLL_THRESHOLD_SHOW_SLOW) {
      showHeaderAndMenu(header, menu);
  }
  ```
- O valor de `SCROLL_THRESHOLD_HIDE` controla o quanto o usuário precisa rolar para baixo para o header sumir.
- O header/menu reaparecem imediatamente em scroll rápido para cima, ou após um pequeno deslocamento em scroll lento.

### 2. `biblia.css`
- **Responsável pelo layout fixo e transições do cabeçalho**.
- Reserva espaço para o header com:
  ```css
  body {
    padding-top: calc(67px + env(safe-area-inset-top));
  }
  .bible-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding-top: calc(10px + env(safe-area-inset-top));
    ...
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bible-header.hidden {
    transform: translateY(-100%);
  }
  ```
- O header nunca cobre o conteúdo nem fica sob a câmera/notch.
- O menu inferior usa lógica semelhante para ocultação.

### 3. Integração entre os arquivos
- O JS adiciona ou remove a classe `.hidden` no header/menu, ativando as transições CSS.
- O CSS garante que o header/menu animem suavemente e que o conteúdo nunca "salte".
- O valor de `padding-top` no `body` e de `padding-top` no header garantem compatibilidade com áreas seguras de dispositivos modernos (notch, status bar).

---

## Resumo
- O cabeçalho inteligente proporciona uma leitura mais imersiva e moderna.
- O sistema é altamente responsivo, detectando tanto a direção quanto a velocidade do scroll.
- A integração entre JS e CSS garante uma experiência fluida, sem surpresas visuais.

---

**Ajustes podem ser feitos facilmente alterando os valores das constantes no JS ou as propriedades de transição no CSS.**
