document.addEventListener('DOMContentLoaded',function(){
  const copyBtn = document.getElementById('copyBtn');
  const shareBtn = document.getElementById('shareBtn');
  const verseText = document.querySelector('.verse-text').innerText.trim();
  const continueBtn = document.getElementById('continueBtn');

  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(verseText + '\n\nSalmos 23:6');
        copyBtn.setAttribute('aria-label','Copiado');
        copyBtn.style.opacity = '0.7';
        setTimeout(()=>{copyBtn.style.opacity='1';copyBtn.setAttribute('aria-label','Copiar versículo')},1200);
      }catch(e){
        alert('Não foi possível copiar o versículo');
      }
    });
  }

  if(shareBtn){
    shareBtn.addEventListener('click', async ()=>{
      if(navigator.share){
        try{
          await navigator.share({title:'Versículo do dia',text:verseText + '\n\nSalmos 23:6'});
        }catch(e){console.log('share canceled',e)}
      }else{
        // fallback: copy to clipboard
        try{ await navigator.clipboard.writeText(verseText + '\n\nSalmos 23:6'); alert('Versículo copiado para compartilhar'); }catch(e){ alert('Compartilhamento não suportado'); }
      }
    });
  }

  if(continueBtn){
    continueBtn.addEventListener('click', ()=>{
      // Placeholder navigation: scroll to top of verse as a demo
      window.scrollTo({top:document.querySelector('.verse').offsetTop-20,behavior:'smooth'});
    });
  }
});
