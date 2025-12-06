# JWT vs Sessões: Escalabilidade e Mobile

JWT é como um “passe de entrada” que o próprio usuário carrega no bolso, enquanto sessões tradicionais são como um “nome na lista” que fica guardado no servidor.

A razão por trás dessa frase sobre escalabilidade e mobile fica clara quando entendemos o que cada abordagem exige do sistema.

Vamos destrinchar com calma.

**JWT (JSON Web Token)** é um token assinado digitalmente. Ele contém as informações necessárias para o backend identificar o usuário — sem que o servidor precise guardar nada sobre a sessão.

**Sessões tradicionais**, por outro lado, exigem um espaço no servidor para armazenar o estado de cada usuário. Imagina uma sala com milhares de fichas, cada uma representando alguém logado. À medida que a aplicação cresce, essa sala explode de tamanho, e você precisa fazer malabarismos para manter tudo organizado: sticky sessions, replicação, cache, clusterização de sessão — e uma cacetada de dores de cabeça.

Em dispositivos mobile, isso fica ainda mais dramático, porque:

- Sessões dependem totalmente de cookies: mobile nem sempre lida bem com cookies persistentes; alguns frameworks bloqueiam ou apagam cookies entre inicializações, e chamadas em ambientes híbridos (como Cordova) podem ficar inconsistentes.
- JWT funciona bem com APIs stateless: mobile fala com backend via API REST ou GraphQL. APIs modernas já nasceram para ser stateless — sem memória interna sobre quem é quem — e o JWT se encaixa como uma luva. Basta enviá-lo no cabeçalho `Authorization`.
- Escalabilidade: quando você usa JWT, qualquer servidor dentro do seu cluster consegue validar o token sem precisar consultar outro serviço. Isso reduz carga e simplifica muito o escalonamento horizontal. Sem estado = menos atrito.

**O resumo é este:**

- Sessões dizem: “Servidor, guarda minha identidade para quando eu voltar.”
- JWT diz: “Servidor, aqui está minha identidade assinada. Você não precisa lembrar de mim.”

Essa frase da sua documentação está te lembrando que a escolha do JWT não é estética; é estrutural: funciona melhor em APIs, funciona melhor em mobile e é absurdamente mais fácil de escalar. Isso abre caminho para integrações, microserviços e distribuição sem dor de cabeça.

Esse tema conecta com arquitetura, segurança e a matemática curiosa de assinaturas digitais — um pequeno lembrete de como um sistema elegante se sustenta em detalhes invisíveis, mas fundamentais.
